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
// `never` keeps a `PersistenceConfig` with no argument, and so no codec, usable
// with a container of any type. It takes `serialize` as a method for that:
// parameters of a method are compared bivariantly.
export type PersistenceConfig<T = never> = {
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
  ttl?: number | undefined;

  /**
   * Turns the value into what JSON can hold, for a value it cannot (a `Date`, a
   * `Map`, a `bigint`). By default the value is stored as it is.
   */
  serialize?(value: T): unknown;

  /**
   * Turns what was stored back into the value, and is the place to validate it:
   * if it throws, the stored data is ignored. By default what was stored is
   * trusted to be a `T`.
   */
  deserialize?(stored: unknown): T;

  /**
   * Told about a failure to load, save or clear, which otherwise leaves the
   * container working in silence. An error it throws is ignored.
   */
  onError?: ((error: unknown) => void) | undefined;
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
