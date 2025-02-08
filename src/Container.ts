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
} from "./types";

abstract class Container<T> {
  protected _value: T;
  protected _subscribers: Set<ContainerEntity<T>>;

  constructor(initializer: Initializer<T>) {
    const initialValue =
      typeof initializer === "function"
        ? (initializer as CallableFunction<[], T>)()
        : initializer;

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
  public abstract setValue(newValue: T): void | Promise<void>;

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

    if (signal?.aborted) unsubscribe();

    return unsubscribe;
  }
}

export default Container;
