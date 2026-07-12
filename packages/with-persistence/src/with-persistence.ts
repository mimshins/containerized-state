import type { Container } from "containerized-state";
import { PersistentContainer } from "./persistent-container.ts";
import type { PersistenceConfig } from "./types.ts";

/**
 * Creates a PersistentContainer from an existing Container instance.
 *
 * Note: This function creates a new `PersistentContainer<T>` instance using the
 * container's current value as the initial value. The returned instance extends
 * `Container<T>` and is compatible with all hooks and utilities that accept a
 * `Container<T>`.
 *
 * @template T The type of the container's value
 * @param container The container instance to derive the initial value from
 * @param config Persistence configuration options
 * @returns A new PersistentContainer instance with persistence functionality
 *
 * @example
 * ```typescript
 * const persistentContainer = withPersistence(
 *   Container.create({ count: 0 }),
 *   {
 *     key: 'my-counter',
 *     storage: localStorage,
 *
 *     // 24 hours
 *     ttl: 24 * 60 * 60 * 1000
 *   }
 * );
 * ```
 */
export const withPersistence = <T>(
  container: Container<T>,
  config: PersistenceConfig,
): PersistentContainer<T> => {
  return new PersistentContainer<T>(container.getValue(), config);
};
