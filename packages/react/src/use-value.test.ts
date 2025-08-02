import { act, renderHook } from "@testing-library/react";
import { Container } from "containerized-state";
import { describe, expect, it } from "vitest";
import { useValue } from "./use-value.ts";

describe("useValue", () => {
  it("should return the initial container value", () => {
    const container = Container.create(42);
    const { result } = renderHook(() => useValue(container));

    expect(result.current).toBe(42);
  });

  it("should re-render when the container value changes", async () => {
    const container = Container.create(0);
    const { result } = renderHook(() => useValue(container));

    expect(result.current).toBe(0);

    await act(async () => {
      // Use act to wrap state updates that cause re-renders
      await container.setValue(100);
    });

    expect(result.current).toBe(100);
  });

  it("should not re-render if the container value is the same", async () => {
    const container = Container.create(10);
    const { result } = renderHook(() => useValue(container));

    expect(result.current).toBe(10);

    // Update with the same value, this should not trigger a re-render
    await act(async () => {
      await container.setValue(10);
    });

    // The value should remain the same
    expect(result.current).toBe(10);
  });

  it("should handle object state changes and re-render correctly", async () => {
    const container = Container.create({ count: 0, theme: "light" });
    const { result } = renderHook(() => useValue(container));

    expect(result.current).toEqual({ count: 0, theme: "light" });

    await act(async () => {
      await container.setValue({ count: 1, theme: "dark" });
    });

    expect(result.current).toEqual({ count: 1, theme: "dark" });
  });

  it("should unsubscribe when the component unmounts", async () => {
    const container = Container.create(0);
    const { result, unmount } = renderHook(() => useValue(container));

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

  it("should work correctly with different container instances", async () => {
    const container1 = Container.create("a");
    const container2 = Container.create("b");

    const { result: result1 } = renderHook(() => useValue(container1));
    const { result: result2 } = renderHook(() => useValue(container2));

    expect(result1.current).toBe("a");
    expect(result2.current).toBe("b");

    await act(async () => {
      await container1.setValue("x");
    });

    expect(result1.current).toBe("x");
    expect(result2.current).toBe("b");
  });
});
