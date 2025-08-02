import { act, renderHook } from "@testing-library/react";
import { Container } from "containerized-state";
import { describe, expect, it } from "vitest";
import { useComputedValue } from "./use-computed-value.ts";

describe("useComputedValue", () => {
  it("should return the initial computed value", () => {
    const container = Container.create({ a: 1, b: 2 });
    const { result } = renderHook(() =>
      useComputedValue(container, state => state.a + state.b),
    );

    expect(result.current).toBe(3);
  });

  it("should re-render when the container value changes and the computed value is different", async () => {
    const container = Container.create({ a: 1, b: 2 });
    const { result } = renderHook(() =>
      useComputedValue(container, state => state.a + state.b),
    );

    expect(result.current).toBe(3);

    await act(async () => {
      // Use act to wrap state updates that cause re-renders
      await container.setValue({ a: 10, b: 20 });
    });

    expect(result.current).toBe(30);
  });

  it("should not re-render if the container value changes but the computed value is the same", async () => {
    const container = Container.create({ a: 1, b: 2 });
    const { result } = renderHook(() =>
      useComputedValue(container, state => state.a + state.b),
    );

    expect(result.current).toBe(3);

    // This change to `a` won't change the computed value
    await act(async () => {
      await container.setValue({ a: 3, b: 0 });
    });

    // We can't directly check for re-renders with this method,
    // but we can assert the value hasn't changed.
    expect(result.current).toBe(3);
  });

  it("should re-render when the custom isEqual function returns false", async () => {
    const container = Container.create({
      items: [{ id: 1 }, { id: 2 }],
    });

    const { result } = renderHook(() =>
      useComputedValue(
        container,
        state => state.items.length,
        (prev, next) => prev === next,
      ),
    );

    expect(result.current).toBe(2);

    await act(async () => {
      await container.setValue({
        items: [{ id: 1 }, { id: 2 }, { id: 3 }],
      });
    });

    expect(result.current).toBe(3);
  });

  it("should not re-render when the custom isEqual function returns true", async () => {
    const container = Container.create({
      items: [{ id: 1 }, { id: 2 }],
    });

    // This custom equality function only cares about the length of the array
    const { result } = renderHook(() =>
      useComputedValue(
        container,
        state => state.items,
        (prev, next) => prev.length === next.length,
      ),
    );

    expect(result.current.length).toBe(2);

    // This change updates the array reference but not the length,
    // so the hook should not re-render.
    await act(async () => {
      await container.setValue({
        items: [{ id: 1 }, { id: 2 }],
      });
    });

    expect(result.current.length).toBe(2);
  });

  it("should unsubscribe when the component unmounts", async () => {
    const container = Container.create(0);
    const { result, unmount } = renderHook(() =>
      useComputedValue(container, state => state),
    );

    expect(result.current).toBe(0);

    // Unmount the hook
    unmount();

    // Update the container, this should not trigger a re-render
    await act(async () => {
      await container.setValue(99);
    });

    // The value should remain the initial one from before unmounting
    expect(result.current).toBe(0);
  });

  it("should work correctly with different containers and selectors", async () => {
    const container1 = Container.create(5);
    const container2 = Container.create("hello");

    const { result: result1 } = renderHook(() =>
      useComputedValue(container1, state => state * 2),
    );

    const { result: result2 } = renderHook(() =>
      useComputedValue(container2, state => state.toUpperCase()),
    );

    expect(result1.current).toBe(10);
    expect(result2.current).toBe("HELLO");

    await act(async () => {
      await container1.setValue(10);
    });

    expect(result1.current).toBe(20);
    expect(result2.current).toBe("HELLO");
  });
});
