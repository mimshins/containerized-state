import type { Container } from "containerized-state";
import { useMemo } from "react";
import { useSyncExternalStore } from "./use-sync-external-store.ts";

/**
 * Custom hook that subscribes to a container and retrieves its current value.
 *
 * @param container - The container to subscribe to and retrieve the value from.
 *
 * @example
 * // Example usage:
 * const container = new Container(0);
 * const currentValue = useValue(container);
 */
export const useValue = <T>(container: Container<T>): T => {
  const { subscribe, getServerSnapshot, getSnapshot } = useMemo(
    () => ({
      subscribe: container.subscribe.bind(container),
      getSnapshot: container.getValue.bind(container),
      getServerSnapshot: container.getValue.bind(container),
    }),
    [container],
  );

  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return snapshot;
};
