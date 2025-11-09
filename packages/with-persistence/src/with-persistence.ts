import type { Container } from "containerized-state";
import type { PersistenceConfig, StoredData } from "./types.ts";

/**
 * Wraps a Container with persistence functionality.
 *
 * Note: This function modifies the original container instance by augmenting it
 * with persistence features. It does not create a new container instance.
 *
 * @template T The type of the container's value
 * @param container The container instance to add persistence to
 * @param config Persistence configuration options
 * @returns The same container instance with persistence functionality added
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
): Container<T> => {
  const { key, storage, ttl } = config;

  /**
   * Loads persisted value from storage if available and not expired.
   *
   * @returns The persisted value or null if not found/expired
   */
  const loadPersistedValue = (): T | null => {
    try {
      const stored = storage.getItem(key);

      if (!stored) return null;

      const data = JSON.parse(stored) as StoredData<T>;

      // Check if data has expired
      if (ttl && Date.now() - data.timestamp > ttl) {
        storage.removeItem(key);

        return null;
      }

      return data.value;
    } catch {
      // Return null if parsing fails or storage is unavailable
      return null;
    }
  };

  /**
   * Saves value to storage with current timestamp.
   *
   * @param value The value to persist
   */
  const saveValue = (value: T): void => {
    try {
      const data: StoredData<T> = {
        value,
        timestamp: Date.now(),
      };

      storage.setItem(key, JSON.stringify(data));
    } catch {
      // Silently fail if storage is unavailable
    }
  };

  // Override setValue to add persistence
  const originalSetValue = container.setValue.bind(container);

  container.setValue = async (newValue: T): Promise<void> => {
    await originalSetValue(newValue);

    saveValue(newValue);
  };

  // Override reset to clear persisted data
  const originalReset = container.reset.bind(container);

  container.reset = async (): Promise<void> => {
    await originalReset();

    storage.removeItem(key);
  };

  // Initialize container with persisted value if available
  void container.setValue(loadPersistedValue() ?? container.getValue());

  return container;
};
