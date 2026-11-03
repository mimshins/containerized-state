import { afterEach, beforeEach, describe, expect, it, vitest } from "vitest";

import { PersistentContainer } from "./persistent-container.ts";

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
});
