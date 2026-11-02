import { type Initializer, Container } from "containerized-state";
import type { PersistenceConfig, StoredData } from "./types.ts";

/**
 * Whether a parsed value has the shape this package stores. Its `value` may be
 * missing, since JSON drops `undefined`.
 */
const isStoredData = <T>(data: unknown): data is StoredData<T> =>
  typeof data === "object" &&
  data !== null &&
  "timestamp" in data &&
  typeof data.timestamp === "number";

/**
 * A Container with automatic persistence to a Storage interface.
 *
 * Extends `Container<T>` so it remains compatible with all hooks and
 * utilities that accept a `Container<T>`.
 *
 * @template T The type of the container's value
 */
export class PersistentContainer<T> extends Container<T> {
  readonly #storageKey: string;
  readonly #storage: Storage;
  readonly #ttl: number | undefined;

  constructor(initializer: Initializer<T>, config: PersistenceConfig) {
    super(initializer);

    this.#storageKey = config.key;
    this.#storage = config.storage;
    this.#ttl = config.ttl;

    // Initialize container with persisted value if available
    const persisted = this.#loadPersistedData();

    if (persisted !== null) {
      this._value = persisted.value;
    }
  }

  /**
   * Updates the value of the state, notifies subscribers, and persists to storage.
   */
  public override async setValue(newValue: T): Promise<void> {
    await super.setValue(newValue);
    this.#saveValue(newValue);
  }

  /**
   * Resets the container to its initial value, notifies subscribers,
   * and clears persisted data from storage.
   */
  public override async reset(): Promise<void> {
    await super.reset();
    this.#storage.removeItem(this.#storageKey);
  }

  /**
   * Loads persisted data from storage if available, well formed and not
   * expired. It returns the stored record because null is a value too.
   */
  #loadPersistedData(): StoredData<T> | null {
    try {
      const stored = this.#storage.getItem(this.#storageKey);

      if (!stored) return null;

      const data: unknown = JSON.parse(stored);

      if (!isStoredData<T>(data)) return null;

      // Check if data has expired
      if (this.#ttl !== undefined && Date.now() - data.timestamp > this.#ttl) {
        this.#storage.removeItem(this.#storageKey);

        return null;
      }

      return data;
    } catch {
      // Return null if parsing fails or storage is unavailable
      return null;
    }
  }

  /**
   * Saves value to storage with current timestamp.
   */
  #saveValue(value: T): void {
    try {
      const data: StoredData<T> = {
        value,
        timestamp: Date.now(),
      };

      this.#storage.setItem(this.#storageKey, JSON.stringify(data));
    } catch {
      // Silently fail if storage is unavailable
    }
  }
}
