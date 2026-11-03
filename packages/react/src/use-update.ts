import type { Container } from "containerized-state";
import { type SetStateAction, useCallback } from "react";

import type { CallableFunction } from "./types.ts";

export type Updater<T> = (state: SetStateAction<T>) => void | Promise<void>;

/**
 * Custom hook that provides an updater function to set the value of a container.
 *
 * @param container - The container to update.
 *
 * @example
 * // Example usage:
 * const container = new Container(0);
 * const updateValue = useUpdate(container);
 * updateValue(42); // Sets the container value to 42
 * updateValue(prev => prev + 1); // Updates the container value using a function
 */
export const useUpdate = <T>(container: Container<T>): Updater<T> => {
  return useCallback(
    state => {
      const newStateValue =
        typeof state === "function"
          ? // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SetStateAction's function form: `typeof` cannot narrow a generic T.
            (state as CallableFunction<[T], T>)(container.getValue())
          : state;

      return container.setValue(newStateValue);
    },
    [container],
  );
};
