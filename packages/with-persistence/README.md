# containerized-state-plugin-persistence

A persistence plugin for
[containerized-state](https://github.com/mimshins/containerized-state) that adds
automatic state persistence to `localStorage`, `sessionStorage`, or any
`Storage`-compatible interface.

## Features

- **Automatic Persistence**: Automatically saves container state to storage on
  every update
- **TTL Support**: Optional time-to-live functionality to expire stored data
- **Error Handling**: Graceful handling of storage errors and quota limits
- **Type Safe**: Full TypeScript support with proper type inference
- **Storage Agnostic**: Works with `localStorage`, `sessionStorage`, or custom
  `Storage` implementations
- **Zero Dependencies**: Only requires `containerized-state` as a peer
  dependency

## Installation

```sh
pnpm add containerized-state-plugin-persistence containerized-state
# or
npm install containerized-state-plugin-persistence containerized-state
# or
yarn add containerized-state-plugin-persistence containerized-state
```

## Usage

### Basic Usage

```ts
import { Container } from "containerized-state";
import { withPersistence } from "containerized-state-plugin-persistence";

// Create a container with persistence
const counterContainer = withPersistence(Container.create(0), {
  key: "counter",
  storage: localStorage,
});

// The container will automatically load persisted value on initialization
console.log(counterContainer.getValue()); // Loads from localStorage

// Updates are automatically persisted
await counterContainer.setValue(42); // Saves to localStorage
```

### With TTL (Time-to-Live)

```ts
const userContainer = withPersistence(
  Container.create({ name: "", preferences: {} }),
  {
    key: "user-data",
    storage: localStorage,

    // 24 hours in milliseconds
    ttl: 24 * 60 * 60 * 1000,
  },
);

// Data will be automatically removed after 24 hours
```

### Using `sessionStorage`

```ts
const temporaryContainer = withPersistence(
  Container.create({ sessionData: null }),
  {
    key: "temp-data",

    // Persists only for the session
    storage: sessionStorage,
  },
);
```

### Custom Storage Implementation

```ts
// Create a custom storage implementation
class CustomStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.data.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

const container = withPersistence(Container.create({ data: [] }), {
  key: "custom-data",
  storage: new CustomStorage(),
});
```

## API Reference

### `withPersistence<T>(container, config)`

Creates a new `PersistentContainer<T>` with persistence functionality.

**Note**: `withPersistence` creates a new `PersistentContainer<T>` instance
using the container's current value as the initial value. The returned instance
extends `Container<T>` and is fully compatible with all hooks and utilities
(e.g., `useValue`, `useUpdate`) that accept a `Container<T>`.

#### Parameters

- `container: Container<T>` - The container instance to derive the initial value
  from
- `config: PersistenceConfig` - Persistence configuration options

#### Returns

A new `PersistentContainer<T>` instance with persistence functionality.

### `PersistentContainer<T>`

A Container subclass with automatic persistence to a `Storage` interface.
Extends `Container<T>` so it remains compatible everywhere a `Container<T>` is
expected.

### `PersistenceConfig`

Configuration options for persistence functionality.

```ts
type PersistenceConfig = {
  /**
   * Unique key for storing data in the storage.
   */
  key: string;

  /**
   * Storage interface to use (localStorage, sessionStorage, or custom).
   */
  storage: Storage;

  /**
   * Optional time-to-live in milliseconds.
   * If specified, stored data will expire after this duration.
   */
  ttl?: number;
};
```

## Behavior

### Initialization

When `withPersistence` is called, it creates a new `PersistentContainer<T>`
instance and immediately attempts to load any existing persisted data:

1. Creates a new `PersistentContainer<T>` with the source container's current
   value as the initial value
2. Checks if data exists in storage for the given key
3. Validates the data format and TTL (if specified)
4. If valid data is found, initializes the container with the persisted value
5. If no valid data is found, uses the source container's current value

### Persistence

- **setValue**: Automatically saves the new value to storage after updating the
  container
- **reset**: Clears the persisted data from storage and resets the container to
  its initial value

### Error Handling

The plugin handles storage errors gracefully:

- **Load errors**: If loading fails (corrupted data, storage unavailable), the
  container keeps its current value
- **Save errors**: If saving fails (quota exceeded, storage unavailable), the
  container update still succeeds
- **TTL expiration**: Expired data is automatically removed from storage

## Examples

### Shopping Cart Persistence

```ts
import { Container } from "containerized-state";
import { withPersistence } from "containerized-state-plugin-persistence";

type CartItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};

const cartContainer = withPersistence(Container.create<CartItem[]>([]), {
  key: "shopping-cart",
  storage: localStorage,

  // 7 days
  ttl: 7 * 24 * 60 * 60 * 1000,
});

// Add item to cart
const currentCart = cartContainer.getValue();
await cartContainer.setValue([
  ...currentCart,
  { id: "1", name: "Product", quantity: 1, price: 29.99 },
]);
```

### User Preferences

```ts
type UserPreferences = {
  theme: "light" | "dark";
  language: string;
  notifications: boolean;
};

const preferencesContainer = withPersistence(
  Container.create<UserPreferences>({
    theme: "light",
    language: "en",
    notifications: true,
  }),
  {
    key: "user-preferences",
    storage: localStorage,
    // No TTL - preferences should persist indefinitely
  },
);

// Update theme
const prefs = preferencesContainer.getValue();
await preferencesContainer.setValue({
  ...prefs,
  theme: "dark",
});
```

## Contributing

Read the
[contributing guide](https://github.com/mimshins/containerized-state/blob/main/CONTRIBUTING.md)
to learn about our development process, how to propose bug fixes and
improvements, and how to build and test your changes.

## License

This project is licensed under the terms of the
[MIT license](https://github.com/mimshins/containerized-state/blob/main/LICENSE).
