import { type Initializer, Container } from "containerized-state";

import type {
  PersistenceConfig,
  PersistenceStorage,
  StoredData,
} from "./types.ts";

/**
 * Whether a parsed value has the shape this package stores. Its `value` may be
 * missing, since JSON drops `undefined`.
 */
const isStoredData = (data: unknown): data is StoredData<unknown> =>
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
  readonly #storage: PersistenceStorage;
  readonly #ttl: number | undefined;
  readonly #serialize: (value: T) => unknown;
  readonly #deserialize: (stored: unknown) => T;
  readonly #onError: ((error: unknown) => void) | undefined;

  constructor(initializer: Initializer<T>, config: PersistenceConfig<T>) {
    super(initializer);

    this.#storageKey = config.key;
    this.#storage = config.storage;
    this.#ttl = config.ttl;
    this.#serialize = value =>
      config.serialize === undefined ? value : config.serialize(value);
    this.#deserialize = stored =>
      config.deserialize === undefined
        ? // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- with no `deserialize`, the documented default is to trust what this package stored.
          (stored as T)
        : config.deserialize(stored);
    this.#onError = config.onError;

    // Initialize container with persisted value if available
    const persisted = this.#loadPersistedData();

    if (persisted !== null) {
      this._value = persisted.value;
    }
  }

  /**
   * The initial value: the server cannot know what the client's storage holds,
   * so the first client render must not use it either. React moves to the
   * persisted value right after hydrating.
   */
  public override getServerValue(): T {
    return this._initialValue;
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
   * Clears persisted data from storage, then resets the container to its initial
   * value and notifies subscribers. It clears first so that a value a subscriber
   * sets in response is the one that stays saved.
   */
  public override async reset(): Promise<void> {
    this.#clearValue();
    await super.setValue(this._initialValue);
  }

  /**
   * Loads persisted data from storage if available, well formed and not
   * expired. It returns the stored record because null is a value too.
   */
  #loadPersistedData(): StoredData<T> | null {
    try {
      const stored = this.#storage.getItem(this.#storageKey);

      if (stored === null) return null;

      const data: unknown = JSON.parse(stored);

      if (!isStoredData(data)) {
        throw new TypeError(`Unexpected data in "${this.#storageKey}".`);
      }

      // Check if data has expired
      if (this.#ttl !== undefined && Date.now() - data.timestamp > this.#ttl) {
        this.#storage.removeItem(this.#storageKey);

        return null;
      }

      return { ...data, value: this.#deserialize(data.value) };
    } catch (error) {
      // Return null if parsing fails or storage is unavailable
      this.#report(error);

      return null;
    }
  }

  /**
   * Clears the persisted value from storage.
   */
  #clearValue(): void {
    try {
      this.#storage.removeItem(this.#storageKey);
    } catch (error) {
      this.#report(error);
    }
  }

  /**
   * Saves value to storage with current timestamp.
   */
  #saveValue(value: T): void {
    try {
      const serialized = this.#serialize(value);

      // JSON would drop these, and the record would restore as `undefined`.
      if (typeof serialized === "function" || typeof serialized === "symbol") {
        throw new TypeError(`Cannot save a ${typeof serialized} as JSON.`);
      }

      const data: StoredData<unknown> = {
        value: serialized,
        timestamp: Date.now(),
      };

      this.#storage.setItem(this.#storageKey, JSON.stringify(data));
    } catch (error) {
      this.#report(error);
    }
  }

  /**
   * Tells `onError` of a failure. Persistence failing must not stop the
   * container, so neither may the callback that reports it.
   */
  #report(error: unknown): void {
    try {
      this.#onError?.(error);
    } catch {
      // Nothing is left to report it to.
    }
  }
}
