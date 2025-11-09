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
  storage: Storage;

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
