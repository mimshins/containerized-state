import Container from "./Container.ts";
import type {
  ComputeValue,
  EqualityCheckFunction,
  SubscribeCallback,
  Unsubscribe,
} from "./types";

class AsyncStateContainer<T> extends Container<T> {
  public get value(): T {
    throw new Error("Method not implemented.");
  }

  public set value(newValue: T) {
    throw new Error("Method not implemented.");
  }

  public subscribe(
    cb: SubscribeCallback<T>,
    options?: {
      signal?: AbortSignal;
    },
  ): Unsubscribe {
    throw new Error("Method not implemented.");
  }

  public computedSubscribe<P>(
    computeValue: ComputeValue<T, P>,
    cb: SubscribeCallback<P>,
    options?: {
      signal?: AbortSignal;
      isEqual?: EqualityCheckFunction<P> | undefined;
    },
  ): Unsubscribe {
    throw new Error("Method not implemented.");
  }
}

export default AsyncStateContainer;
