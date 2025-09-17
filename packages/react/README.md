# react-containerized-state

A collection of React hooks for seamlessly integrating a `Container` from
`containerized-state` into your React components. These hooks provide a simple
and idiomatic way to subscribe to container state and trigger updates,
leveraging React's built-in `useSyncExternalStore` for optimal performance.

## Installation

To install the react package, you can use a package manager like pnpm, npm, or
yarn.

```sh
pnpm add react-containerized-state
# or
npm install react-containerized-state
# or
yarn add react-containerized-state
```

## The Hooks

This package provides three primary hooks for working with a `Container` in
React: `useValue`, `useUpdate`, and `useComputedValue`.

### `useValue(container)`

A custom hook that subscribes a component to a `Container` and returns its
current value. The component will automatically re-render whenever the
container's state changes.

```tsx
import { Container, useValue } from "react-containerized-state";

// Create a container instance outside of your component
const counterContainer = new Container(0);

const CounterDisplay = () => {
  // Subscribe to the container's value
  const count = useValue(counterContainer);

  return <h1>Current Count: {count}</h1>;
};
```

### `useUpdate(container)`

A custom hook that returns a stable `Updater` function. This function can be
used to update the container's state.

- `Updater<T>` can accept a new state value or an updater function that receives
  the previous state.
- The returned function is stable, meaning its reference does not change on
  re-renders, preventing unnecessary re-renders in child components that receive
  it as a prop.

```tsx
import { Container, useValue, useUpdate } from "react-containerized-state";

// Create a container instance
const counterContainer = new Container(0);

const Counter = () => {
  const count = useValue(counterContainer);
  const updateCount = useUpdate(counterContainer);

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => updateCount(prev => prev + 1)}>Increment</button>
      <button onClick={() => updateCount(0)}>Reset</button>
    </div>
  );
};
```

### `useComputedValue(container)`

A custom hook that subscribes to a derived value from the container's state.
This is highly performant as the component only re-renders when the computed
value changes, not every time the base container's value changes.

- `compute`: A function that takes the container's value and returns the derived
  value.
- `isEqual`: An optional custom equality function to compare the previous and
  next computed values. By default, `Object.is` is used.

```tsx
import { Container, useComputedValue } from "react-containerized-state";

const userContainer = new Container({
  firstName: "Jane",
  lastName: "Doe",
});

const UserGreeting = () => {
  // The component only re-renders if the full name changes.
  const fullName = useComputedValue(
    userContainer,
    state => `${state.firstName} ${state.lastName}`,
  );

  return <h2>Hello, {fullName}!</h2>;
};
```

## Example

Here's a full example demonstrating how to use all three hooks together to
manage a simple todo list.

```tsx
import {
  Container,
  useValue,
  useUpdate,
  useComputedValue,
} from "react-containerized-state";

// A single container to hold all our state
const todosContainer = new Container([
  { id: 1, text: "Learn React Hooks", completed: true },
  { id: 2, text: "Write some code", completed: false },
]);

const TodoList = () => {
  const todos = useValue(todosContainer);
  const updateTodos = useUpdate(todosContainer);
  const completedCount = useComputedValue(
    todosContainer,
    todos => todos.filter(todo => todo.completed).length,
  );

  const toggleTodo = id => {
    updateTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  return (
    <div>
      <h1>Todo List</h1>
      <p>
        {completedCount} of {todos.length} tasks completed.
      </p>
      <ul>
        {todos.map(todo => (
          <li
            key={todo.id}
            style={{ textDecoration: todo.completed ? "line-through" : "none" }}
            onClick={() => toggleTodo(todo.id)}
          >
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

## Subscribe

A render props component that subscribes to a container and provides a computed
value to its children. This offers a declarative, JSX-based alternative to the
`useComputedValue` hook, which can be useful for separating concerns or creating
reusable components.

- `container`: The state container to subscribe to.
- `compute`: An optional function that computes a derived value from the
  container's state. By default, `value => value` is used.
- `isEqual`: An optional custom equality function to control re-renders.
- `children`: A render function that receives the computed value as an argument.

```tsx
import { Container, Subscribe } from "react-containerized-state";

// Create a container instance outside of your component
const userContainer = new Container({
  firstName: "Jane",
  lastName: "Doe",
});

const UserGreeting = () => (
  <Subscribe
    container={userContainer}
    compute={state => `${state.firstName} ${state.lastName}`}
  >
    {fullName => <h2>Hello, {fullName}!</h2>}
  </Subscribe>
);
```

## Contributing

Read the
[contributing guide](https://github.com/mimshins/containerized-state/blob/main/CONTRIBUTING.md)
to learn about our development process, how to propose bug fixes and
improvements, and how to build and test your changes.

## License

This project is licensed under the terms of the
[MIT license](https://github.com/mimshins/containerized-state/blob/main/LICENSE).
