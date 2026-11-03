import type { Entity } from "./constants.ts";

export type CallableFunction<TArgs extends unknown[] = [], TReturn = void> = (
  ...args: TArgs
) => TReturn;

export type SubscribeCallback<T> = (value: T) => Promise<void> | void;
export type Unsubscribe = () => void;
export type ComputeValue<T, P> = (value: T) => P;
export type EqualityCheckFunction<P> = (prev: P, next: P) => boolean;

export type ComputedEntity<T, P> = {
  type: (typeof Entity)["COMPUTED"];
  cb: SubscribeCallback<P>;
  computeValue: ComputeValue<T, P>;
  isEqual?: EqualityCheckFunction<P> | undefined;
};

export type DefaultEntity<T> = {
  type: (typeof Entity)["DEFAULT"];
  cb: SubscribeCallback<T>;
};

export type ContainerEntity<T> =
  | DefaultEntity<T>
  // oxlint-disable-next-line typescript/no-explicit-any -- each subscriber has its own P, and `unknown` would not accept a ComputedEntity<T, P> (P is contravariant in cb).
  | ComputedEntity<T, any>;

export type Initializer<T> = T | CallableFunction<[], T>;
