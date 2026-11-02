/**
 * The part of a `Storage` this package uses. `localStorage` and
 * `sessionStorage` are one, and a custom storage needs only these methods.
 */
export type PersistenceStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

/**
 * Configuration options for persistence functionality.
 */
export type PersistenceConfig = {
  /**
   * Unique key for storing data in the storage.
   */
  key: string;

  /**
   * Storage interface to use.
   */
  storage: PersistenceStorage;

  /**
   * Time-to-live in milliseconds.
   */
  ttl?: number;
};

/**
 * Data structure used for storing values with timestamp information.
 */
export type StoredData<T> = {
  /**
   * The stored value.
   */
  value: T;

  /**
   * Timestamp when the value was stored (in milliseconds).
   */
  timestamp: number;
};
