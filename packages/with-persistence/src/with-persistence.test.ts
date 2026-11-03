import { Container } from "containerized-state";
import { afterEach, beforeEach, describe, expect, it, vitest } from "vitest";

import { PersistentContainer } from "./persistent-container.ts";
import type { StoredData } from "./types.ts";
import { withPersistence } from "./with-persistence.ts";

// Mock storage implementation
class MockStorage implements Storage {
  #store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.#store).length;
  }

  clear(): void {
    this.#store = {};
  }

  getItem(key: string): string | null {
    return this.#store[key] ?? null;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.#store);

    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    delete this.#store[key];
  }

  setItem(key: string, value: string): void {
    this.#store[key] = value;
  }
}

// Only the clock is faked: stored timestamps and TTLs must not depend on real time.
beforeEach(() => {
  vitest.useFakeTimers({ toFake: ["Date"], now: 1_000_000 });
});

afterEach(() => {
  vitest.useRealTimers();
});

describe("withPersistence", () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  afterEach(() => {
    vitest.clearAllMocks();
  });

  it("should return a PersistentContainer instance that extends Container", () => {
    const container = Container.create(0);
    const persistentContainer = withPersistence(container, {
      key: "test",
      storage: mockStorage,
    });

    expect(persistentContainer).toBeInstanceOf(PersistentContainer);
    expect(persistentContainer).toBeInstanceOf(Container);
  });

  it("should persist value when setValue is called", async () => {
    const container = Container.create(0);

    const persistentContainer = withPersistence(container, {
      key: "counter",
      storage: mockStorage,
    });

    await persistentContainer.setValue(42);

    const stored = mockStorage.getItem("counter");

    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored ?? "") as StoredData<number>;

    expect(parsed.value).toBe(42);
    expect(parsed.timestamp).toBeTypeOf("number");
  });

  it("should load persisted value on initialization", () => {
    // Pre-populate storage
    mockStorage.setItem(
      "counter",
      JSON.stringify({
        value: 99,
        timestamp: Date.now(),
      }),
    );

    const persistentContainer = withPersistence(Container.create(0), {
      key: "counter",
      storage: mockStorage,
    });

    expect(persistentContainer.getValue()).toBe(99);
  });

  it("should not load expired persisted value", () => {
    // Pre-populate storage with expired data
    mockStorage.setItem(
      "counter",
      JSON.stringify({
        value: 99,

        // 2 seconds ago
        timestamp: Date.now() - 2000,
      }),
    );

    const persistentContainer = withPersistence(Container.create(0), {
      key: "counter",
      storage: mockStorage,

      // 1 second TTL
      ttl: 1000,
    });

    expect(persistentContainer.getValue()).toBe(0);
    expect(mockStorage.getItem("counter")).toBeNull();
  });

  it("should load non-expired persisted value", () => {
    // Pre-populate storage with fresh data
    mockStorage.setItem(
      "counter",
      JSON.stringify({
        value: 99,

        // 0.5 seconds ago
        timestamp: Date.now() - 500,
      }),
    );

    const persistentContainer = withPersistence(Container.create(0), {
      key: "counter",
      storage: mockStorage,

      // 1 second TTL
      ttl: 1000,
    });

    expect(persistentContainer.getValue()).toBe(99);
  });

  it("should handle storage errors gracefully when loading", () => {
    // Pre-populate storage with invalid JSON
    mockStorage.setItem("counter", "invalid-json");

    const persistentContainer = withPersistence(Container.create(0), {
      key: "counter",
      storage: mockStorage,
    });

    expect(persistentContainer.getValue()).toBe(0);
  });

  it("should handle storage errors gracefully when saving", async () => {
    const faultyStorage = {
      setItem: vitest.fn(() => {
        throw new Error("Storage full");
      }),
      getItem: vitest.fn(() => null),
      removeItem: vitest.fn(),
    };

    const persistentContainer = withPersistence(Container.create(0), {
      key: "counter",
      storage: faultyStorage,
    });

    // Should not throw
    await expect(persistentContainer.setValue(42)).resolves.toBeUndefined();
    expect(persistentContainer.getValue()).toBe(42);
  });

  it("should clear persisted data on reset", async () => {
    const persistentContainer = withPersistence(Container.create(10), {
      key: "counter",
      storage: mockStorage,
    });

    await persistentContainer.setValue(42);
    expect(mockStorage.getItem("counter")).toBeTruthy();

    await persistentContainer.reset();
    expect(persistentContainer.getValue()).toBe(10);
    expect(mockStorage.getItem("counter")).toBeNull();
  });

  it("should work with complex objects", async () => {
    const initialValue = { count: 0, name: "test" };

    const persistentContainer = withPersistence(
      Container.create(initialValue),
      {
        key: "object",
        storage: mockStorage,
      },
    );

    const newValue = { count: 5, name: "updated" };

    await persistentContainer.setValue(newValue);

    const stored = mockStorage.getItem("object");
    const parsed = JSON.parse(stored ?? "") as StoredData<{
      count: number;
      name: string;
    }>;

    expect(parsed.value).toEqual(newValue);
  });

  it("should work with arrays", async () => {
    const persistentContainer = withPersistence(Container.create([1, 2, 3]), {
      key: "array",
      storage: mockStorage,
    });

    await persistentContainer.setValue([4, 5, 6]);

    const stored = mockStorage.getItem("array");
    const parsed = JSON.parse(stored ?? "") as StoredData<number[]>;

    expect(parsed.value).toEqual([4, 5, 6]);
  });

  it("should handle null and undefined values", async () => {
    const persistentContainer = withPersistence(
      Container.create<string | null>(null),
      {
        key: "nullable",
        storage: mockStorage,
      },
    );

    await persistentContainer.setValue("test");
    await persistentContainer.setValue(null);

    const stored = mockStorage.getItem("nullable");
    const parsed = JSON.parse(stored ?? "") as StoredData<string | null>;

    expect(parsed.value).toBeNull();
  });

  it("should work without TTL", async () => {
    const persistentContainer = withPersistence(Container.create(0), {
      key: "no-ttl",
      storage: mockStorage,
    });

    await persistentContainer.setValue(42);

    // Simulate loading after a long time
    const stored = mockStorage.getItem("no-ttl");

    expect(stored).toBeTruthy();

    const newPersistentContainer = withPersistence(Container.create(0), {
      key: "no-ttl",
      storage: mockStorage,
    });

    expect(newPersistentContainer.getValue()).toBe(42);
  });

  it("should handle missing storage item gracefully", () => {
    const persistentContainer = withPersistence(Container.create(0), {
      key: "non-existent",
      storage: mockStorage,
    });

    expect(persistentContainer.getValue()).toBe(0);
  });

  it("should preserve container behavior for subscribers", async () => {
    const persistentContainer = withPersistence(Container.create(0), {
      key: "subscriber-test",
      storage: mockStorage,
    });

    const subscriber = vitest.fn();

    persistentContainer.subscribe(subscriber);

    await persistentContainer.setValue(42);

    expect(subscriber).toHaveBeenCalledWith(42);
  });

  it("should work with localStorage-like storage", async () => {
    const persistentContainer = withPersistence(
      Container.create({ theme: "light" }),
      {
        key: "app-settings",
        storage: mockStorage,
      },
    );

    await persistentContainer.setValue({ theme: "dark" });

    // Simulate app restart
    const newPersistentContainer = withPersistence(
      Container.create({ theme: "light" }),
      {
        key: "app-settings",
        storage: mockStorage,
      },
    );

    expect(newPersistentContainer.getValue()).toEqual({ theme: "dark" });
  });

  describe("when a subscriber misbehaves", () => {
    const saved = (storage: Storage, key: string): unknown => {
      const stored = storage.getItem(key);

      return stored === null
        ? null
        : (JSON.parse(stored) as StoredData<unknown>).value;
    };

    const open = () =>
      new PersistentContainer<number>(0, {
        key: "misbehaving",
        storage: mockStorage,
      });

    it("should persist the value though a subscriber rejects", async () => {
      const container = open();

      container.subscribe(() => {
        throw new Error("subscriber failed");
      });

      await expect(container.setValue(1)).rejects.toThrow("subscriber failed");

      expect(container.getValue()).toBe(1);
      expect(saved(mockStorage, "misbehaving")).toBe(1);
    });

    it("should persist the value while a subscriber is pending", () => {
      const container = open();

      container.subscribe(() => new Promise<void>(() => {}));

      void container.setValue(1);

      expect(saved(mockStorage, "misbehaving")).toBe(1);
    });

    it("should keep the newest value when an older subscriber finishes last", async () => {
      const container = open();
      let finishFirst = (): void => {};

      container.subscribe(value =>
        value === 1
          ? new Promise<void>(resolve => {
              finishFirst = resolve;
            })
          : undefined,
      );

      const first = container.setValue(1);

      await container.setValue(2);
      finishFirst();
      await first;

      expect(saved(mockStorage, "misbehaving")).toBe(2);
    });

    it("should clear persisted data on reset though a subscriber rejects", async () => {
      const container = open();

      await container.setValue(1);

      container.subscribe(() => {
        throw new Error("subscriber failed");
      });

      await expect(container.reset()).rejects.toThrow("subscriber failed");

      expect(container.getValue()).toBe(0);
      expect(mockStorage.getItem("misbehaving")).toBeNull();
    });

    it("should keep a value set while a reset is notifying", async () => {
      const container = open();
      let finishReset = (): void => {};

      await container.setValue(1);

      const unsubscribe = container.subscribe(
        () =>
          new Promise<void>(resolve => {
            finishReset = resolve;
          }),
      );

      const reset = container.reset();

      unsubscribe();
      await container.setValue(2);
      finishReset();
      await reset;

      expect(saved(mockStorage, "misbehaving")).toBe(2);
    });
  });

  it("should handle storage errors gracefully when resetting", async () => {
    const failingStorage = new MockStorage();

    vitest.spyOn(failingStorage, "removeItem").mockImplementation(() => {
      throw new Error("Storage error");
    });

    const container = new PersistentContainer(0, {
      key: "test",
      storage: failingStorage,
    });

    await container.setValue(1);
    await expect(container.reset()).resolves.toBeUndefined();

    expect(container.getValue()).toBe(0);
  });
});
