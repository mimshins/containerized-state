// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CallableFunction<TArgs extends any[] = [], TReturn = void> = (
  ...args: TArgs
) => TReturn;
