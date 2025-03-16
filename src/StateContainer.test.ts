import { describe, expect, it, vitest } from "vitest";
import StateContainer from "./StateContainer.ts";

describe("StateContainer", () => {
  it("should create an instance with initial value", () => {
    const container = new StateContainer(42);

    expect(container.getValue()).toBe(42);
  });

  it("should update the value and notify subscribers", () => {
    const container = StateContainer.create(42);
    const subscriber = vitest.fn();

    container.subscribe(subscriber);
    container.setValue(24);

    expect(container.getValue()).toBe(24);
    expect(subscriber).toHaveBeenCalledWith(24);
  });

  it("should not notify subscribers if the value is the same", () => {
    const container = StateContainer.create(42);
    const subscriber = vitest.fn();

    container.subscribe(subscriber);
    container.setValue(42);

    expect(subscriber).not.toHaveBeenCalled();
  });

  it("should notify computed subscribers if computed value changes", () => {
    const container = StateContainer.create(42);
    const subscriber = vitest.fn();

    container.computedSubscribe(v => v + 1, subscriber);
    container.setValue(43);

    expect(subscriber).toHaveBeenCalledWith(44);
  });

  it("should use custom equality function for computed subscribers", () => {
    const container = StateContainer.create(42);
    const subscriber = vitest.fn();

    container.computedSubscribe(v => v % 2, subscriber, {
      isEqual: (a, b) => a === b,
    });
    container.setValue(44);

    expect(subscriber).not.toHaveBeenCalled();

    container.setValue(45);

    expect(subscriber).toHaveBeenCalledWith(1);
  });

  it("should unsubscribe default subscriber", () => {
    const container = StateContainer.create(42);
    const subscriber = vitest.fn();
    const unsubscribe = container.subscribe(subscriber);

    unsubscribe();
    container.setValue(24);

    expect(subscriber).not.toHaveBeenCalled();
  });

  it("should unsubscribe computed subscriber", () => {
    const container = StateContainer.create(42);
    const subscriber = vitest.fn();

    const unsubscribe = container.computedSubscribe(v => v + 1, subscriber);

    unsubscribe();
    container.setValue(43);

    expect(subscriber).not.toHaveBeenCalled();
  });

  it("should respect signal abort for default subscriber", () => {
    const container = StateContainer.create(42);
    const subscriber = vitest.fn();
    const controller = new AbortController();

    container.subscribe(subscriber, { signal: controller.signal });
    controller.abort();
    container.setValue(24);

    expect(subscriber).not.toHaveBeenCalled();

    container.subscribe(subscriber, { signal: controller.signal });
    container.setValue(24);

    expect(subscriber).not.toHaveBeenCalled();
  });

  it("should respect signal abort for computed subscriber", () => {
    const container = StateContainer.create(42);
    const subscriber = vitest.fn();
    const controller = new AbortController();

    container.computedSubscribe(v => v + 1, subscriber, {
      signal: controller.signal,
    });
    controller.abort();
    container.setValue(43);

    expect(subscriber).not.toHaveBeenCalled();

    container.computedSubscribe(v => v + 1, subscriber, {
      signal: controller.signal,
    });
    container.setValue(43);

    expect(subscriber).not.toHaveBeenCalled();
  });
});
