import { Entity } from "./constants.ts";
import type {
  CallableFunction,
  ComputedEntity,
  ComputeValue,
  ContainerEntity,
  DefaultEntity,
  EqualityCheckFunction,
  Initializer,
  SubscribeCallback,
  Unsubscribe,
} from "./types.ts";

export class Container<T> {
  protected _value: T;
  protected _subscribers: Set<ContainerEntity<T>>;

  protected _initialValue: T;

  readonly #notifications: CallableFunction[] = [];
  #isNotifying = false;

  static create<T>(initializer: Initializer<T>): Container<T> {
    return new Container(initializer);
  }

  constructor(initializer: Initializer<T>) {
    const initialValue =
      typeof initializer === "function"
        ? // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a function initializer is called, as documented: `typeof` cannot narrow a generic T.
          (initializer as CallableFunction<[], T>)()
        : initializer;

    this._initialValue = initialValue;

    this._value = initialValue;
    this._subscribers = new Set();
  }

  /**
   * A snapshot of the state.
   */
  public getValue(): T {
    return this._value;
  }

  /**
   * Updates the value of the state and notifies the subscribers.
   *
   * Each subscriber present when a notification starts gets it, unless it
   * unsubscribes first, and a failing one does not stop the others. An update
   * made during a notification is delivered after it, so every subscriber sees
   * updates in order and the last value it gets is the current one.
   */
  public setValue(newValue: T): Promise<void> {
    const prevValue = this._value;

    this._value = newValue;

    return new Promise(resolve => {
      this.#notifications.push(() => {
        const entities = [...this._subscribers];

        resolve(this.#notifyAll(entities, prevValue, newValue));
      });

      this.#runNotifications();
    });
  }

  /**
   * Runs the waiting notifications in order. One asked for while another runs
   * waits for this loop instead of starting inside it.
   */
  #runNotifications(): void {
    if (this.#isNotifying) return;

    this.#isNotifying = true;

    for (const notification of this.#notifications) notification();

    this.#notifications.length = 0;
    this.#isNotifying = false;
  }

  /**
   * Notifies every given subscriber, and settles when they have all finished or
   * the first one has failed.
   */
  async #notifyAll(
    entities: ContainerEntity<T>[],
    prevValue: T,
    newValue: T,
  ): Promise<void> {
    await Promise.all(
      entities.map(entity => this.#notify(entity, prevValue, newValue)),
    );
  }

  /**
   * Notifies one subscriber of a change. It is asynchronous so that anything
   * thrown here rejects this subscriber's promise and leaves the others alone.
   */
  async #notify(
    entity: ContainerEntity<T>,
    prevValue: T,
    newValue: T,
  ): Promise<void> {
    if (!this._subscribers.has(entity)) return;

    if (entity.type !== Entity.COMPUTED) {
      if (!Object.is(prevValue, newValue)) await entity.cb(newValue);

      return;
    }

    const { computeValue, cb, isEqual } = entity;

    const computedValue = computeValue(newValue) as unknown;
    const prevComputedValue = computeValue(prevValue) as unknown;

    const isSame =
      isEqual?.(prevComputedValue, computedValue) ??
      Object.is(computedValue, prevComputedValue);

    if (!isSame) await cb(computedValue);
  }

  /**
   * Subscribes to the changes of the container's state value
   * and returns the unsubscribe function.
   */
  public subscribe(
    cb: SubscribeCallback<T>,
    options?: {
      /**
       * An `AbortSignal` reference to control the unsubscribe.
       */
      signal?: AbortSignal | undefined;
    },
  ): Unsubscribe {
    const { signal } = options ?? {};

    const entity: DefaultEntity<T> = {
      type: Entity.DEFAULT,
      cb,
    };

    this._subscribers.add(entity);

    const unsubscribe: Unsubscribe = () => {
      this._subscribers.delete(entity);
      signal?.removeEventListener("abort", unsubscribe);
    };

    signal?.addEventListener("abort", unsubscribe);

    if (signal?.aborted === true) unsubscribe();

    return unsubscribe;
  }

  /**
   * Subscribes to the changes of the container's selected state values
   * and returns the unsubscribe function.
   *
   * For more control over emission changes, you may provide a custom equality function.
   */
  public computedSubscribe<P>(
    computeValue: ComputeValue<T, P>,
    cb: SubscribeCallback<P>,
    options?: {
      /**
       * An `AbortSignal` reference to control the unsubscribe.
       */
      signal?: AbortSignal | undefined;
      /**
       * A custom equality function to control emission changes.
       */
      isEqual?: EqualityCheckFunction<P> | undefined;
    },
  ): Unsubscribe {
    const { isEqual, signal } = options ?? {};

    const entity: ComputedEntity<T, P> = {
      type: Entity.COMPUTED,
      computeValue,
      cb,
      isEqual,
    };

    this._subscribers.add(entity);

    const unsubscribe: Unsubscribe = () => {
      this._subscribers.delete(entity);
      signal?.removeEventListener("abort", unsubscribe);
    };

    signal?.addEventListener("abort", unsubscribe);

    if (signal?.aborted === true) unsubscribe();

    return unsubscribe;
  }

  /**
   * Resets the container to its initial value. This method is asynchronous and
   * returns a promise that resolves when all subscriber callbacks have completed.
   */
  public reset(): Promise<void> {
    return this.setValue(this._initialValue);
  }
}
