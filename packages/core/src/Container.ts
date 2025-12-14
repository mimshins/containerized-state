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

  static create<T>(initializer: Initializer<T>): Container<T> {
    return new Container(initializer);
  }

  constructor(initializer: Initializer<T>) {
    const initialValue =
      typeof initializer === "function"
        ? (initializer as CallableFunction<[], T>)()
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
   */
  public async setValue(newValue: T): Promise<void> {
    const prevValue = this._value;

    this._value = newValue;

    const promises: Promise<void>[] = [];

    for (const entity of this._subscribers) {
      let promise: Promise<void> = Promise.resolve();

      if (entity.type === Entity.COMPUTED) {
        const { computeValue, cb, isEqual } = entity;

        const computedValue = computeValue(newValue) as unknown;
        const prevComputedValue = computeValue(prevValue) as unknown;

        const shouldEmit = !(
          isEqual?.(prevComputedValue, computedValue) ??
          Object.is(computedValue, prevComputedValue)
        );

        if (!shouldEmit) {
          promise = Promise.resolve();

          continue;
        }

        promise = Promise.resolve(cb(computedValue));
      } else {
        // Handle Entity.DEFAULT and any other types as default behavior
        if (Object.is(prevValue, newValue)) {
          promise = Promise.resolve();

          continue;
        }

        promise = Promise.resolve(entity.cb(newValue));
      }

      promises.push(promise);
    }

    await Promise.all(promises);
  }

  /**
   * Subscribes to the changes of the container's state value
   * and returns the unsubscribe function.
   */
  public subscribe(
    cb: SubscribeCallback<T>,
    options?: {
      /**
       * An `AbortSignal` reference to control the unsubscibe.
       */
      signal?: AbortSignal;
    },
  ): Unsubscribe {
    const { signal } = options ?? {};

    const asyncCb = async (value: T): Promise<void> => {
      return cb(value);
    };

    const entity: DefaultEntity<T> = {
      type: Entity.DEFAULT,
      cb: asyncCb,
    };

    this._subscribers.add(entity);

    const unsubscribe: Unsubscribe = () => {
      this._subscribers.delete(entity);
      signal?.removeEventListener("abort", unsubscribe);
    };

    signal?.addEventListener("abort", unsubscribe);

    if (signal?.aborted) unsubscribe();

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
       * An `AbortSignal` reference to control the unsubscibe.
       */
      signal?: AbortSignal;
      /**
       * A custom equality function to control emission changes.
       */
      isEqual?: EqualityCheckFunction<P>;
    },
  ): Unsubscribe {
    const { isEqual, signal } = options ?? {};

    const asyncCb = async (value: P): Promise<void> => {
      return cb(value);
    };

    const entity: ComputedEntity<T, P> = {
      type: Entity.COMPUTED,
      computeValue,
      cb: asyncCb,
      isEqual,
    };

    this._subscribers.add(entity);

    const unsubscribe: Unsubscribe = () => {
      this._subscribers.delete(entity);
      signal?.removeEventListener("abort", unsubscribe);
    };

    signal?.addEventListener("abort", unsubscribe);

    if (signal?.aborted) unsubscribe();

    return unsubscribe;
  }

  /**
   * Resets the container to its initial value. This method is asynchronous an
   * returns a promise that resolves when all subscriber callbacks have completed.
   */
  public reset(): Promise<void> {
    return this.setValue(this._initialValue);
  }
}
