import { type Initializer, Container } from "containerized-state";
import type { PersistenceConfig, StoredData } from "./types.ts";

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
    const persisted = this.#loadPersistedValue();

    if (persisted !== null) {
      this._value = persisted;
    }
  }

  /**
   * Persists the value to storage, then updates the state and notifies
   * subscribers. It is saved first so that what a subscriber does cannot stop or
   * reorder the save: one that rejects, never resolves, or finishes late.
   */
  public override async setValue(newValue: T): Promise<void> {
    this.#saveValue(newValue);
    await super.setValue(newValue);
  }

  /**
   * Resets the container to its initial value, notifies subscribers,
   * and clears persisted data from storage.
   */
  public override async reset(): Promise<void> {
    const notified = super.reset();

    this.#clearValue();
    await notified;
  }

  /**
   * Loads persisted value from storage if available and not expired.
   */
  #loadPersistedValue(): T | null {
    try {
      const stored = this.#storage.getItem(this.#storageKey);

      if (!stored) return null;

      const data = JSON.parse(stored) as StoredData<T>;

      // Check if data has expired
      if (this.#ttl && Date.now() - data.timestamp > this.#ttl) {
        this.#storage.removeItem(this.#storageKey);

        return null;
      }

      return data.value;
    } catch {
      // Return null if parsing fails or storage is unavailable
      return null;
    }
  }

  /**
   * Clears the persisted value from storage.
   */
  #clearValue(): void {
    try {
      this.#storage.removeItem(this.#storageKey);
    } catch {
      // Silently fail if storage is unavailable
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
