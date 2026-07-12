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
  private readonly _storageKey: string;
  private readonly _storage: Storage;
  private readonly _ttl: number | undefined;

  constructor(initializer: Initializer<T>, config: PersistenceConfig) {
    super(initializer);

    this._storageKey = config.key;
    this._storage = config.storage;
    this._ttl = config.ttl;

    // Initialize container with persisted value if available
    const persisted = this._loadPersistedValue();

    if (persisted !== null) {
      this._value = persisted;
    }
  }

  /**
   * Updates the value of the state, notifies subscribers, and persists to storage.
   */
  public override async setValue(newValue: T): Promise<void> {
    await super.setValue(newValue);
    this._saveValue(newValue);
  }

  /**
   * Resets the container to its initial value, notifies subscribers,
   * and clears persisted data from storage.
   */
  public override async reset(): Promise<void> {
    await super.reset();
    this._storage.removeItem(this._storageKey);
  }

  /**
   * Loads persisted value from storage if available and not expired.
   */
  private _loadPersistedValue(): T | null {
    try {
      const stored = this._storage.getItem(this._storageKey);

      if (!stored) return null;

      const data = JSON.parse(stored) as StoredData<T>;

      // Check if data has expired
      if (this._ttl && Date.now() - data.timestamp > this._ttl) {
        this._storage.removeItem(this._storageKey);

        return null;
      }

      return data.value;
    } catch {
      // Return null if parsing fails or storage is unavailable
      return null;
    }
  }

  /**
   * Saves value to storage with current timestamp.
   */
  private _saveValue(value: T): void {
    try {
      const data: StoredData<T> = {
        value,
        timestamp: Date.now(),
      };

      this._storage.setItem(this._storageKey, JSON.stringify(data));
    } catch {
      // Silently fail if storage is unavailable
    }
  }
}
