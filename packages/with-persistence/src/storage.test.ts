import { describe, expect, it } from "vitest";

import { PersistentContainer } from "./persistent-container.ts";
import type { PersistenceStorage } from "./types.ts";

describe("a custom storage", () => {
  it("should need only getItem, setItem and removeItem", async () => {
    const data = new Map<string, string>();
    const storage: PersistenceStorage = {
      getItem: key => data.get(key) ?? null,
      setItem: (key, value) => {
        data.set(key, value);
      },
      removeItem: key => {
        data.delete(key);
      },
    };

    const open = () => new PersistentContainer(0, { key: "key", storage });

    await open().setValue(1);

    expect(open().getValue()).toBe(1);

    await open().reset();

    expect(open().getValue()).toBe(0);
  });
});
