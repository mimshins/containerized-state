import type {
  CallableFunction,
  ComputeValue,
  ContainerEntity,
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
  public abstract get value(): T;
  public abstract set value(newValue: T);

  /**
   * Subscribes to the changes of the container's state value
   * and returns the unsubscribe function.
   */
  public abstract subscribe(
    cb: SubscribeCallback<T>,
    options?: {
      /**
       * An `AbortSignal` reference to control the unsubscibe.
       */
      signal?: AbortSignal;
    },
  ): Unsubscribe;

  /**
   * Subscribes to the changes of the container's selected state values
   * and returns the unsubscribe function.
   *
   * For more control over emission changes, you may provide a custom equality function.
   */
  public abstract computedSubscribe<P>(
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
  ): Unsubscribe;
}

export default Container;
