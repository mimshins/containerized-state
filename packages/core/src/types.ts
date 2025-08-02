// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Entity } from "./constants.ts";

export type CallableFunction<TArgs extends any[] = [], TReturn = void> = (
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
  isEqual?: EqualityCheckFunction<P>;
};

export type DefaultEntity<T> = {
  type: (typeof Entity)["DEFAULT"];
  cb: SubscribeCallback<T>;
};

export type ContainerEntity<T> = DefaultEntity<T> | ComputedEntity<T, any>;

export type Initializer<T> = T | CallableFunction<[], T>;
