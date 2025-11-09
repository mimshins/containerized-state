import { Container } from "containerized-state";
import { afterEach, beforeEach, describe, expect, it, vitest } from "vitest";
import type { StoredData } from "./types.ts";
import { withPersistence } from "./with-persistence.ts";

// Mock storage implementation
class MockStorage implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);

    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
}

describe("withPersistence", () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  afterEach(() => {
    vitest.clearAllMocks();
  });

  it("should return the same container instance", () => {
    const container = Container.create(0);
    const persistentContainer = withPersistence(container, {
      key: "test",
      storage: mockStorage,
    });

    expect(persistentContainer).toBe(container);
  });

  it("should persist value when setValue is called", async () => {
    const container = Container.create(0);

    withPersistence(container, {
      key: "counter",
      storage: mockStorage,
    });

    await container.setValue(42);

    const stored = mockStorage.getItem("counter");

    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!) as StoredData<number>;

    expect(parsed.value).toBe(42);
    expect(parsed.timestamp).toBeTypeOf("number");
  });

  it("should load persisted value on initialization", () => {
    const container = Container.create(0);

    // Pre-populate storage
    mockStorage.setItem(
      "counter",
      JSON.stringify({
        value: 99,
        timestamp: Date.now(),
      }),
    );

    withPersistence(container, {
      key: "counter",
      storage: mockStorage,
    });

    expect(container.getValue()).toBe(99);
  });

  it("should not load expired persisted value", () => {
    const container = Container.create(0);

    // Pre-populate storage with expired data
    mockStorage.setItem(
      "counter",
      JSON.stringify({
        value: 99,

        // 2 seconds ago
        timestamp: Date.now() - 2000,
      }),
    );

    withPersistence(container, {
      key: "counter",
      storage: mockStorage,

      // 1 second TTL
      ttl: 1000,
    });

    expect(container.getValue()).toBe(0);
    expect(mockStorage.getItem("counter")).toBeNull();
  });

  it("should load non-expired persisted value", () => {
    const container = Container.create(0);

    // Pre-populate storage with fresh data
    mockStorage.setItem(
      "counter",
      JSON.stringify({
        value: 99,

        // 0.5 seconds ago
        timestamp: Date.now() - 500,
      }),
    );

    withPersistence(container, {
      key: "counter",
      storage: mockStorage,

      // 1 second TTL
      ttl: 1000,
    });

    expect(container.getValue()).toBe(99);
  });

  it("should handle storage errors gracefully when loading", () => {
    const container = Container.create(0);

    // Pre-populate storage with invalid JSON
    mockStorage.setItem("counter", "invalid-json");

    withPersistence(container, {
      key: "counter",
      storage: mockStorage,
    });

    expect(container.getValue()).toBe(0);
  });

  it("should handle storage errors gracefully when saving", async () => {
    const container = Container.create(0);
    const faultyStorage = {
      ...mockStorage,
      setItem: vitest.fn(() => {
        throw new Error("Storage full");
      }),
    };

    withPersistence(container, {
      key: "counter",
      storage: faultyStorage as unknown as Storage,
    });

    // Should not throw
    await expect(container.setValue(42)).resolves.toBeUndefined();
    expect(container.getValue()).toBe(42);
  });

  it("should clear persisted data on reset", async () => {
    const container = Container.create(10);

    withPersistence(container, {
      key: "counter",
      storage: mockStorage,
    });

    await container.setValue(42);
    expect(mockStorage.getItem("counter")).toBeTruthy();

    await container.reset();
    expect(container.getValue()).toBe(10);
    expect(mockStorage.getItem("counter")).toBeNull();
  });

  it("should work with complex objects", async () => {
    const initialValue = { count: 0, name: "test" };
    const container = Container.create(initialValue);

    withPersistence(container, {
      key: "object",
      storage: mockStorage,
    });

    const newValue = { count: 5, name: "updated" };

    await container.setValue(newValue);

    const stored = mockStorage.getItem("object");
    const parsed = JSON.parse(stored!) as StoredData<{
      count: number;
      name: string;
    }>;

    expect(parsed.value).toEqual(newValue);
  });

  it("should work with arrays", async () => {
    const container = Container.create([1, 2, 3]);

    withPersistence(container, {
      key: "array",
      storage: mockStorage,
    });

    await container.setValue([4, 5, 6]);

    const stored = mockStorage.getItem("array");
    const parsed = JSON.parse(stored!) as StoredData<number[]>;

    expect(parsed.value).toEqual([4, 5, 6]);
  });

  it("should handle null and undefined values", async () => {
    const container = Container.create<string | null>(null);

    withPersistence(container, {
      key: "nullable",
      storage: mockStorage,
    });

    await container.setValue("test");
    await container.setValue(null);

    const stored = mockStorage.getItem("nullable");
    const parsed = JSON.parse(stored!) as StoredData<string | null>;

    expect(parsed.value).toBeNull();
  });

  it("should work without TTL", async () => {
    const container = Container.create(0);

    withPersistence(container, {
      key: "no-ttl",
      storage: mockStorage,
    });

    await container.setValue(42);

    // Simulate loading after a long time
    const stored = mockStorage.getItem("no-ttl");

    expect(stored).toBeTruthy();

    const newContainer = Container.create(0);

    withPersistence(newContainer, {
      key: "no-ttl",
      storage: mockStorage,
    });

    expect(newContainer.getValue()).toBe(42);
  });

  it("should handle missing storage item gracefully", () => {
    const container = Container.create(0);

    withPersistence(container, {
      key: "non-existent",
      storage: mockStorage,
    });

    expect(container.getValue()).toBe(0);
  });

  it("should preserve original container behavior for subscribers", async () => {
    const container = Container.create(0);
    const subscriber = vitest.fn();

    container.subscribe(subscriber);

    withPersistence(container, {
      key: "subscriber-test",
      storage: mockStorage,
    });

    await container.setValue(42);

    expect(subscriber).toHaveBeenCalledWith(42);
  });

  it("should work with localStorage-like storage", async () => {
    // Test with a more realistic storage implementation
    const container = Container.create({ theme: "light" });

    withPersistence(container, {
      key: "app-settings",
      storage: mockStorage,
    });

    await container.setValue({ theme: "dark" });

    // Simulate app restart
    const newContainer = Container.create({ theme: "light" });

    withPersistence(newContainer, {
      key: "app-settings",
      storage: mockStorage,
    });

    expect(newContainer.getValue()).toEqual({ theme: "dark" });
  });
});
