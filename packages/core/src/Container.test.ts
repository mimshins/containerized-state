import { describe, expect, it, vitest } from "vitest";
import { Container } from "./Container.ts";

describe("Container", () => {
  it("should create an instance with initial value", () => {
    const container = new Container(42);

    expect(container.getValue()).toBe(42);
  });

  it("should update the value and notify subscribers", async () => {
    const container = Container.create(42);
    const subscriber = vitest.fn();

    container.subscribe(subscriber);

    await container.setValue(24);

    expect(container.getValue()).toBe(24);
    expect(subscriber).toHaveBeenCalledWith(24);
  });

  it("should not notify subscribers if the value is the same", async () => {
    const container = Container.create(42);
    const subscriber = vitest.fn();

    container.subscribe(subscriber);

    await container.setValue(42);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it("should notify computed subscribers if computed value changes", async () => {
    const container = Container.create(42);
    const subscriber = vitest.fn();

    container.computedSubscribe(v => v + 1, subscriber);

    await container.setValue(43);
    expect(subscriber).toHaveBeenCalledWith(44);
  });

  it("should use custom equality function for computed subscribers", async () => {
    const container = Container.create(42);
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
    const container = Container.create(42);
    const subscriber = vitest.fn();
    const unsubscribe = container.subscribe(subscriber);

    unsubscribe();

    await container.setValue(24);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it("should unsubscribe computed subscriber", async () => {
    const container = Container.create(42);
    const subscriber = vitest.fn();
    const unsubscribe = container.computedSubscribe(v => v + 1, subscriber);

    unsubscribe();

    await container.setValue(43);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it("should respect signal abort for default subscriber", async () => {
    const container = Container.create(42);
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
    const container = Container.create(42);
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

  it("should handle async default subscribers and wait for them to finish", async () => {
    const container = Container.create(42);
    let asyncTaskDone = false;

    const subscriberSpy = vitest.fn(async () => {
      return new Promise<void>(resolve => {
        setTimeout(() => {
          asyncTaskDone = true;
          resolve();
        }, 100);
      });
    });

    container.subscribe(subscriberSpy);

    const setValuePromise = container.setValue(24);

    // At this point, the async subscriber should have been called,
    // but the task inside it might not be done yet.
    expect(subscriberSpy).toHaveBeenCalledWith(24);
    expect(asyncTaskDone).toBe(false);

    // Wait for setValue to complete, which in turn waits for all subscribers.
    await setValuePromise;

    // Now, the async task inside the subscriber should be finished.
    expect(asyncTaskDone).toBe(true);
  });

  it("should handle async computed subscribers and wait for them to finish", async () => {
    const container = Container.create({ count: 42, name: "test" });
    let asyncTaskDone = false;

    const subscriberSpy = vitest.fn(async () => {
      return new Promise<void>(resolve => {
        setTimeout(() => {
          asyncTaskDone = true;
          resolve();
        }, 100);
      });
    });

    container.computedSubscribe(v => v.count + 1, subscriberSpy);

    const setValuePromise = container.setValue({ count: 43, name: "new" });

    // The subscriber should have been called with the new computed value.
    expect(subscriberSpy).toHaveBeenCalledWith(44);
    expect(asyncTaskDone).toBe(false);

    await setValuePromise;

    expect(asyncTaskDone).toBe(true);
  });

  it("should call multiple async subscribers concurrently and wait for all to complete", async () => {
    const container = Container.create(42);
    let subscriber1Done = false;
    let subscriber2Done = false;

    const spy1 = vitest.fn(async () => {
      return new Promise<void>(resolve => {
        setTimeout(() => {
          subscriber1Done = true;
          resolve();
        }, 150);
      });
    });

    const spy2 = vitest.fn(async () => {
      return new Promise<void>(resolve => {
        setTimeout(() => {
          subscriber2Done = true;
          resolve();
        }, 50); // This one finishes faster.
      });
    });

    container.subscribe(spy1);
    container.subscribe(spy2);

    const setValuePromise = container.setValue(24);

    expect(spy1).toHaveBeenCalledWith(24);
    expect(spy2).toHaveBeenCalledWith(24);
    expect(subscriber1Done).toBe(false);
    expect(subscriber2Done).toBe(false);

    await setValuePromise;

    // Both subscribers should be done after setValue completes.
    expect(subscriber1Done).toBe(true);
    expect(subscriber2Done).toBe(true);
  });

  it("should create an instance with an initializer function", () => {
    const container = Container.create(() => 42);

    expect(container.getValue()).toBe(42);
  });

  it("should not notify computed subscribers if computed value is the same without a custom equality function", async () => {
    const container = Container.create({ a: 1, b: "test" });
    const subscriber = vitest.fn();

    // The compute function only cares about `a`
    container.computedSubscribe(v => v.a, subscriber);

    // This change only affects `b`, so the computed value `v.a` remains the same.
    // The default `Object.is` check should prevent the notification.
    await container.setValue({ a: 1, b: "new-test" });

    expect(subscriber).not.toHaveBeenCalled();
  });

  it("should handle `isEqual` being undefined for computed subscribers", async () => {
    const container = Container.create({ a: 1, b: 2 });
    const subscriber = vitest.fn();

    // The compute function returns the `a` property
    container.computedSubscribe(v => v.a, subscriber, {
      // Intentionally provide an undefined isEqual
      isEqual: undefined,
    });

    // Change `a` to a new value, which should trigger a notification.
    await container.setValue({ a: 2, b: 2 });

    expect(subscriber).toHaveBeenCalledWith(2);
  });

  it("should not notify default subscribers if the value is an object with the same reference", async () => {
    const initialObject = { id: 1 };
    const container = Container.create(initialObject);
    const subscriber = vitest.fn();

    container.subscribe(subscriber);

    // Set the value to the exact same object reference
    await container.setValue(initialObject);

    // `Object.is` should prevent the notification
    expect(subscriber).not.toHaveBeenCalled();
  });
});
