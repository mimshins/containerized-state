import { act, renderHook } from "@testing-library/react";
import { Container } from "containerized-state";
import { describe, expect, it } from "vitest";
import { useUpdate } from "./use-update.ts";

describe("useUpdate", () => {
  it("should return a stable function", () => {
    const container = Container.create(0);
    const { result, rerender } = renderHook(() => useUpdate(container));
    const updater1 = result.current;

    rerender(); // Re-render the hook without changing its props
    const updater2 = result.current;

    expect(updater1).toBe(updater2);
  });

  it("should update the container value with a direct value", async () => {
    const container = Container.create(0);
    const { result } = renderHook(() => useUpdate(container));
    const update = result.current;

    await act(async () => {
      // We must await the update inside the act() block because it returns a promise.
      await update(42);
    });

    expect(container.getValue()).toBe(42);
  });

  it("should update the container value with an updater function", async () => {
    const container = Container.create(10);
    const { result } = renderHook(() => useUpdate(container));
    const update = result.current;

    await act(async () => {
      // The updater function receives the current state value
      await update(prev => prev + 5);
    });

    expect(container.getValue()).toBe(15);
  });

  it("should correctly handle multiple sequential updates", async () => {
    const container = Container.create(0);
    const { result } = renderHook(() => useUpdate(container));
    const update = result.current;

    await act(async () => {
      await update(prev => prev + 1);
      await update(prev => prev + 1);
      await update(10);
      await update(prev => prev - 2);
    });

    expect(container.getValue()).toBe(8);
  });

  it("should update different containers independently", async () => {
    const container1 = Container.create("initial");
    const container2 = Container.create(0);

    const { result: result1 } = renderHook(() => useUpdate(container1));
    const { result: result2 } = renderHook(() => useUpdate(container2));

    const update1 = result1.current;
    const update2 = result2.current;

    await act(async () => {
      await update1("new value");
      await update2(100);
    });

    expect(container1.getValue()).toBe("new value");
    expect(container2.getValue()).toBe(100);
  });
});
