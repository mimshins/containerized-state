import { afterEach, beforeEach, describe, expect, it, vitest } from "vitest";

import { PersistentContainer } from "./persistent-container.ts";
import type { PersistenceConfig, PersistenceStorage } from "./types.ts";

const memoryStorage = (entries: Record<string, string> = {}): Storage => {
  const items = new Map(Object.entries(entries));

  return {
    get length() {
      return items.size;
    },
    clear: () => {
      items.clear();
    },
    getItem: key => items.get(key) ?? null,
    key: index => [...items.keys()][index] ?? null,
    removeItem: key => {
      items.delete(key);
    },
    setItem: (key, value) => {
      items.set(key, value);
    },
  };
};

const open = <T>(initial: T, storage: Storage, ttl?: number) =>
  new PersistentContainer<T>(initial, {
    key: "key",
    storage,
    ...(ttl === undefined ? {} : { ttl }),
  });

// Only the clock is faked: stored timestamps and TTLs must not depend on real time.
beforeEach(() => {
  vitest.useFakeTimers({ toFake: ["Date"], now: 1_000_000 });
});

afterEach(() => {
  vitest.useRealTimers();
});

describe("restoring a persisted value", () => {
  it("should restore a saved null", async () => {
    const storage = memoryStorage();

    await open<string | null>("initial", storage).setValue(null);

    expect(open<string | null>("initial", storage).getValue()).toBeNull();
  });

  it("should restore a saved undefined", async () => {
    const storage = memoryStorage();

    await open<string | undefined>("initial", storage).setValue(undefined);

    expect(open<string | undefined>("initial", storage).getValue()).toBe(
      undefined,
    );
  });

  it.each([
    ["a number", "5"],
    ["a string", '"text"'],
    ["null", "null"],
    ["an array", "[1]"],
    ["an object with no timestamp", '{"value":1}'],
    ["an object with a bad timestamp", '{"value":1,"timestamp":"now"}'],
  ])("should ignore %s stored under the key", (_, stored) => {
    const storage = memoryStorage({ key: stored });

    expect(open("initial", storage).getValue()).toBe("initial");
  });

  it("should expire a value at once with a ttl of 0", () => {
    const storage = memoryStorage({
      key: JSON.stringify({ value: "old", timestamp: Date.now() - 1 }),
    });

    expect(open("initial", storage, 0).getValue()).toBe("initial");
    expect(storage.getItem("key")).toBeNull();
  });

  it("should restore a value serialize and deserialize convert", async () => {
    const config = {
      key: "key",
      storage: memoryStorage(),
      serialize: (date: Date) => date.toISOString(),
      deserialize: (stored: unknown) => new Date(String(stored)),
    };
    const date = new Date(1000);

    await new PersistentContainer(new Date(0), config).setValue(date);

    expect(new PersistentContainer(new Date(0), config).getValue()).toEqual(
      date,
    );
  });

  it("should ignore stored data deserialize refuses and report it", () => {
    const onError = vitest.fn<(error: unknown) => void>();
    const refused = new Error("not a number");
    const container = new PersistentContainer(0, {
      key: "key",
      storage: memoryStorage({
        key: JSON.stringify({ value: "text", timestamp: 1 }),
      }),
      deserialize: () => {
        throw refused;
      },
      onError,
    });

    expect(container.getValue()).toBe(0);
    expect(onError).toHaveBeenCalledWith(refused);
  });

  it("should restore a persisted value but give the initial one to the server", () => {
    const container = open(
      "initial",
      memoryStorage({
        key: JSON.stringify({ value: "saved", timestamp: 1_000_000 }),
      }),
    );

    expect(container.getValue()).toBe("saved");
    expect(container.getServerValue()).toBe("initial");
  });
});

describe("failures to persist", () => {
  const failing = (): PersistenceStorage => ({
    getItem: () => null,
    setItem: () => {
      throw new Error("save failed");
    },
    removeItem: () => {
      throw new Error("clear failed");
    },
  });

  it("should report a value that cannot be saved, and keep it", async () => {
    const onError = vitest.fn<(error: unknown) => void>();
    const container = new PersistentContainer<bigint>(0n, {
      key: "key",
      storage: memoryStorage(),
      onError,
    });

    await container.setValue(1n);

    expect(container.getValue()).toBe(1n);
    expect(onError).toHaveBeenCalledWith(expect.any(TypeError));
  });

  it("should report a function, and not save what would restore as undefined", async () => {
    const onError = vitest.fn<(error: unknown) => void>();
    const storage = memoryStorage();
    const container = new PersistentContainer<() => number>(() => () => 0, {
      key: "key",
      storage,
      onError,
    });

    await container.setValue(() => 1);

    expect(storage.getItem("key")).toBeNull();
    expect(onError).toHaveBeenCalledWith(expect.any(TypeError));
  });

  it("should report stored data of the wrong shape", () => {
    const onError = vitest.fn<(error: unknown) => void>();
    const container = new PersistentContainer(0, {
      key: "key",
      storage: memoryStorage({ key: JSON.stringify({ value: 1 }) }),
      onError,
    });

    expect(container.getValue()).toBe(0);
    expect(onError).toHaveBeenCalledWith(expect.any(TypeError));
  });

  it("should accept a config with no type argument, for any container", () => {
    const config: PersistenceConfig = { key: "key", storage: memoryStorage() };

    expect(new PersistentContainer<number>(0, config).getValue()).toBe(0);
    expect(new PersistentContainer<string>("a", config).getValue()).toBe("a");
  });

  it("should report failures to save and clear", async () => {
    const onError = vitest.fn<(error: unknown) => void>();
    const container = new PersistentContainer(0, {
      key: "key",
      storage: failing(),
      onError,
    });

    await container.setValue(1);
    await container.reset();

    expect(onError.mock.calls).toEqual([
      [new Error("save failed")],
      [new Error("clear failed")],
    ]);
  });

  it("should survive an onError that throws", async () => {
    const container = new PersistentContainer(0, {
      key: "key",
      storage: failing(),
      onError: () => {
        throw new Error("reporting failed");
      },
    });

    await expect(container.setValue(1)).resolves.toBeUndefined();
    expect(container.getValue()).toBe(1);
  });
});
