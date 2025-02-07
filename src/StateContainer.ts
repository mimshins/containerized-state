import { Entity } from "./constants.ts";
import Container from "./Container.ts";
import type {
  ComputedEntity,
  ComputeValue,
  DefaultEntity,
  EqualityCheckFunction,
  Initializer,
  SubscribeCallback,
  Unsubscribe,
} from "./types";

class StateContainer<T> extends Container<T> {
  static create<T>(initializer: Initializer<T>): StateContainer<T> {
    return new StateContainer(initializer);
  }

  public get value(): T {
    return this._value;
  }

  public set value(newValue: T) {
    const prevValue = this._value;

    this._value = newValue;

    this._subscribers.forEach(entity => {
      if (entity.type === Entity.DEFAULT) {
        if (Object.is(prevValue, newValue)) return;

        entity.cb(newValue);
      } else if (entity.type === Entity.COMPUTED) {
        const { computeValue, cb, isEqual } = entity;

        const computedValue = computeValue(newValue) as unknown;
        const prevComputedValue = computeValue(prevValue) as unknown;

        const shouldEmit = !(
          isEqual?.(prevComputedValue, computedValue) ??
          Object.is(computedValue, prevComputedValue)
        );

        if (!shouldEmit) return;

        cb(computedValue);
      }
    });
  }

  public subscribe(
    cb: SubscribeCallback<T>,
    options?: {
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

  public computedSubscribe<P>(
    computeValue: ComputeValue<T, P>,
    cb: SubscribeCallback<P>,
    options?: {
      signal?: AbortSignal;
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

export default StateContainer;
