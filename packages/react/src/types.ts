/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SetStateAction } from "react";

export type CallableFunction<TArgs extends any[] = [], TReturn = void> = (
  ...args: TArgs
) => TReturn;

export type Updater<T> = (state: SetStateAction<T>) => void | Promise<void>;
/* eslint-enable @typescript-eslint/no-explicit-any */
