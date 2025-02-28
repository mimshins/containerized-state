import { describe, expect, it, vitest } from "vitest";
import AsyncStateContainer from "./AsyncStateContainer";

describe("AsyncStateContainer", () => {
  it("should create an instance with initial value", async () => {
    const container = new AsyncStateContainer(42);

    expect(container.getValue()).toBe(42);
  });

  it("should update the value and notify subscribers", async () => {
    const container = AsyncStateContainer.create(42);
    const subscriber = vitest.fn();

    container.subscribe(subscriber);

    await container.setValue(24);

    expect(container.getValue()).toBe(24);
    expect(subscriber).toHaveBeenCalledWith(24);
  });

  it("should not notify subscribers if the value is the same", async () => {
    const container = AsyncStateContainer.create(42);
    const subscriber = vitest.fn();

    container.subscribe(subscriber);

    await container.setValue(42);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it("should notify computed subscribers if computed value changes", async () => {
    const container = AsyncStateContainer.create(42);
    const subscriber = vitest.fn();

    container.computedSubscribe(v => v + 1, subscriber);

    await container.setValue(43);
    expect(subscriber).toHaveBeenCalledWith(44);
  });

  it("should use custom equality function for computed subscribers", async () => {
    const container = AsyncStateContainer.create(42);
    const subscriber = vitest.fn();

    container.computedSubscribe(v => v % 2, subscriber, {
      isEqual: (a, b) => a === b,
    });

    await container.setValue(44);
    expect(subscriber).not.toHaveBeenCalled();

    await container.setValue(45);
    expect(subscriber).toHaveBeenCalledWith(1);
  });

  it("should unsubscribe default subscriber", async () => {
    const container = AsyncStateContainer.create(42);
    const subscriber = vitest.fn();
    const unsubscribe = container.subscribe(subscriber);

    unsubscribe();

    await container.setValue(24);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it("should unsubscribe computed subscriber", async () => {
    const container = AsyncStateContainer.create(42);
    const subscriber = vitest.fn();
    const unsubscribe = container.computedSubscribe(v => v + 1, subscriber);

    unsubscribe();

    await container.setValue(43);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it("should respect signal abort for default subscriber", async () => {
    const container = AsyncStateContainer.create(42);
    const subscriber = vitest.fn();
    const controller = new AbortController();

    container.subscribe(subscriber, { signal: controller.signal });
    controller.abort();

    await container.setValue(24);
    expect(subscriber).not.toHaveBeenCalled();

    container.subscribe(subscriber, { signal: controller.signal });

    await container.setValue(24);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it("should respect signal abort for computed subscriber", async () => {
    const container = AsyncStateContainer.create(42);
    const subscriber = vitest.fn();
    const controller = new AbortController();

    container.computedSubscribe(v => v + 1, subscriber, {
      signal: controller.signal,
    });
    controller.abort();

    await container.setValue(43);
    expect(subscriber).not.toHaveBeenCalled();

    container.computedSubscribe(v => v + 1, subscriber, {
      signal: controller.signal,
    });

    await container.setValue(43);
    expect(subscriber).not.toHaveBeenCalled();
  });
});
