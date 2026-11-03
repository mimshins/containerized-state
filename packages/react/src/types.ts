export type CallableFunction<TArgs extends unknown[] = [], TReturn = void> = (
  ...args: TArgs
) => TReturn;
