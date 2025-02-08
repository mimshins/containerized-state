import { Entity } from "./constants.ts";
import Container from "./Container.ts";
import type { Initializer } from "./types";

class AsyncStateContainer<T> extends Container<T> {
  static create<T>(initializer: Initializer<T>): AsyncStateContainer<T> {
    return new AsyncStateContainer(initializer);
  }

  public async setValue(newValue: T): Promise<void> {
    const prevValue = this._value;

    this._value = newValue;

    await Promise.resolve();

    const promises: Promise<boolean>[] = [];

    for (const entity of this._subscribers) {
      let promise: Promise<boolean> = Promise.resolve(false);

      if (entity.type === Entity.DEFAULT) {
        if (Object.is(prevValue, newValue)) {
          promise = Promise.resolve(false);

          continue;
        }

        entity.cb(newValue);
        promise = Promise.resolve(true);
      } else if (entity.type === Entity.COMPUTED) {
        const { computeValue, cb, isEqual } = entity;

        const computedValue = computeValue(newValue) as unknown;
        const prevComputedValue = computeValue(prevValue) as unknown;

        const shouldEmit = !(
          isEqual?.(prevComputedValue, computedValue) ??
          Object.is(computedValue, prevComputedValue)
        );

        if (!shouldEmit) {
          promise = Promise.resolve(false);

          continue;
        }

        cb(computedValue);
        promise = Promise.resolve(true);
      }

      promises.push(promise);
    }

    await Promise.all(promises);

    return Promise.resolve();
  }
}

export default AsyncStateContainer;
