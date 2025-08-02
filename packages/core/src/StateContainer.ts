import { Entity } from "./constants.ts";
import Container from "./Container.ts";
import type { Initializer } from "./types";

class StateContainer<T> extends Container<T> {
  static create<T>(initializer: Initializer<T>): StateContainer<T> {
    return new StateContainer(initializer);
  }

  public setValue(newValue: T): void {
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
}

export default StateContainer;
