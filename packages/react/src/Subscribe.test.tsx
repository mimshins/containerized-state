import { act, cleanup, render, screen } from "@testing-library/react";
import { Container } from "containerized-state";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Subscribe } from "./Subscribe.tsx";

describe("Subscribe", () => {
  type User = {
    name: string;
    age: number;
    status: "active" | "inactive";
  };

  let userContainer: Container<User>;

  beforeEach(() => {
    // Re-initialize the container before each test to ensure a clean state
    userContainer = new Container({
      age: 30,
      name: "Alice",
      status: "active",
    } satisfies User as User);

    cleanup();
  });

  it("should render with the initial computed value", () => {
    render(
      <Subscribe
        container={userContainer}
        compute={user => user.name}
      >
        {name => <div data-testid="name">{name}</div>}
      </Subscribe>,
    );

    expect(screen.getByTestId("name")).toHaveTextContent(
      userContainer.getValue().name,
    );
  });

  it("should default to identity function when compute is not provided", async () => {
    render(
      <Subscribe container={userContainer}>
        {user => (
          <div data-testid="user">
            {user.name}, {user.age}, {user.status}
          </div>
        )}
      </Subscribe>,
    );

    // Initial render should show the full User object stringified via the render function
    expect(screen.getByTestId("user")).toHaveTextContent("Alice, 30, active");

    await act(async () => {
      await userContainer.setValue({
        name: "Bob",
        age: 40,
        status: "inactive",
      });
    });

    // Expect the updated container state to flow through unchanged (identity compute)
    expect(screen.getByTestId("user")).toHaveTextContent("Bob, 40, inactive");
  });

  it("should re-render when the container's state changes and the computed value changes", async () => {
    render(
      <Subscribe
        container={userContainer}
        compute={user => user.age}
      >
        {age => <div data-testid="age">Age: {age}</div>}
      </Subscribe>,
    );

    expect(screen.getByTestId("age")).toHaveTextContent(
      `Age: ${userContainer.getValue().age}`,
    );

    await act(async () => {
      // Update the container's state
      await userContainer.setValue({
        name: "Alice",
        age: 31,
        status: "active",
      });
    });

    expect(screen.getByTestId("age")).toHaveTextContent(`Age: ${31}`);

    await act(async () => {
      // Test with a different value
      await userContainer.setValue({
        name: "Alice",
        age: 40,
        status: "active",
      });
    });

    expect(screen.getByTestId("age")).toHaveTextContent(`Age: ${40}`);
  });

  it("should not re-render when the computed value does not change, even if the container state does", async () => {
    const renderSpy = vi.fn(name => <div data-testid="name">{name}</div>);

    render(
      <Subscribe
        container={userContainer}
        compute={user => user.name}
      >
        {renderSpy}
      </Subscribe>,
    );

    // Initial render check
    expect(renderSpy).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId("name")).toHaveTextContent(
      userContainer.getValue().name,
    );

    await act(async () => {
      // Update the container with a change that doesn't affect the computed value
      await userContainer.setValue({
        name: "Alice",
        age: 40,
        status: "inactive",
      });
    });

    // The render function should not have been called again because the computed value ('Alice') didn't change.
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  it("should use the isEqual function to control re-renders", async () => {
    // A compute function that returns an object, which would normally cause re-renders
    // even if the contents are the same due to reference equality.
    const computeUserObject = (user: User) => ({
      name: user.name,
      age: user.age,
    });

    // A custom isEqual function to compare the content of the objects
    const isEqualUsers = (
      prev: { name: string; age: number },
      next: { name: string; age: number },
    ) => prev.name === next.name && prev.age === next.age;

    const renderSpy = vi.fn((user: { name: string; age: number }) => (
      <div data-testid="test">
        Name: {user.name}, Age: {user.age}
      </div>
    ));

    render(
      <Subscribe
        container={userContainer}
        compute={computeUserObject}
        isEqual={isEqualUsers}
      >
        {renderSpy}
      </Subscribe>,
    );

    // Initial render
    expect(renderSpy).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId("test")).toHaveTextContent(
      "Name: Alice, Age: 30",
    );

    await act(async () => {
      // Update the container with a different object, but the computed value is logically the same
      // (name and age are unchanged).
      await userContainer.setValue({
        name: "Alice",
        age: 30,
        status: "active",
      });
    });

    // The component should NOT re-render because `isEqual` will return true.
    expect(renderSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      // Now, update the container with a change that should trigger a re-render.
      await userContainer.setValue({
        name: "Bob",
        age: 35,
        status: "inactive",
      });
    });

    expect(screen.getByTestId("test")).toHaveTextContent("Name: Bob, Age: 35");
    // The render spy should have been called one more time.
    expect(renderSpy).toHaveBeenCalledTimes(2);
  });

  it("should handle a complex computed value", async () => {
    // A compute function that turns the numerical age into a sentence.
    const computeAgeSentence = (user: User) =>
      `The user is ${user.age} years old.`;

    render(
      <Subscribe
        container={userContainer}
        compute={computeAgeSentence}
      >
        {sentence => <div data-testid="age-sentence">{sentence}</div>}
      </Subscribe>,
    );

    // Initial render check
    expect(screen.getByTestId("age-sentence")).toHaveTextContent(
      "The user is 30 years old.",
    );

    await act(async () => {
      // Update the container to a new age
      await userContainer.setValue({
        name: "Alice",
        age: 45,
        status: "active",
      });
    });

    // Expect the component to re-render with the new sentence
    expect(screen.getByTestId("age-sentence")).toHaveTextContent(
      "The user is 45 years old.",
    );
  });
});
