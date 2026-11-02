import { describe, expect, it, vitest } from "vitest";
import { Container } from "./Container.ts";

describe("Container notifications", () => {
  it("should deliver a nested update after the one that caused it", async () => {
    const container = Container.create(0);
    const seenByLater: number[] = [];

    container.subscribe(value => {
      if (value === 1) void container.setValue(2);
    });
    container.subscribe(value => {
      seenByLater.push(value);
    });

    await container.setValue(1);

    expect(seenByLater).toEqual([1, 2]);
    expect(container.getValue()).toBe(2);
  });

  it("should deliver nested computed updates in order", async () => {
    const container = Container.create({ count: 0 });
    const seen: number[] = [];

    container.subscribe(({ count }) => {
      if (count === 1) void container.setValue({ count: 2 });
    });
    container.computedSubscribe(
      ({ count }) => count,
      count => {
        seen.push(count);
      },
    );

    await container.setValue({ count: 1 });

    expect(seen).toEqual([1, 2]);
  });

  it("should resolve a nested update a subscriber waits for", async () => {
    const container = Container.create(0);

    container.subscribe(async value => {
      if (value === 1) await container.setValue(2);
    });

    await container.setValue(1);

    expect(container.getValue()).toBe(2);
  });

  it("should not notify a subscriber added during a notification", async () => {
    const container = Container.create(0);
    const added = vitest.fn();

    container.subscribe(() => {
      container.subscribe(added);
    });

    await container.setValue(1);

    expect(added).not.toHaveBeenCalled();
  });

  it("should not notify a subscriber removed during a notification", async () => {
    const container = Container.create(0);
    const removed = vitest.fn();
    let unsubscribe = (): void => {};

    container.subscribe(() => {
      unsubscribe();
    });
    unsubscribe = container.subscribe(removed);

    await container.setValue(1);

    expect(removed).not.toHaveBeenCalled();
  });

  it("should notify everyone when computing a value throws", async () => {
    const container = Container.create(0);
    const later = vitest.fn();

    container.computedSubscribe(
      () => {
        throw new Error("compute failed");
      },
      () => {},
    );
    container.subscribe(later);

    await expect(container.setValue(1)).rejects.toThrow("compute failed");

    expect(later).toHaveBeenCalledWith(1);
  });

  it("should notify everyone when an equality check throws", async () => {
    const container = Container.create(0);
    const later = vitest.fn();

    container.computedSubscribe(
      value => value,
      () => {},
      {
        isEqual: () => {
          throw new Error("isEqual failed");
        },
      },
    );
    container.subscribe(later);

    await expect(container.setValue(1)).rejects.toThrow("isEqual failed");

    expect(later).toHaveBeenCalledWith(1);
  });

  it("should still deliver updates after a failed one", async () => {
    const container = Container.create(0);
    const seen = vitest.fn();

    container.subscribe(value => {
      if (value === 1) throw new Error("subscriber failed");
    });
    container.subscribe(seen);

    await expect(container.setValue(1)).rejects.toThrow("subscriber failed");
    await container.setValue(2);

    expect(seen).toHaveBeenLastCalledWith(2);
  });
});
