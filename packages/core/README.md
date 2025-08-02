# containerized-state

A lightweight, framework-agnostic state container for managing application
state. This package provides the core `Container` class, a powerful tool for
centralizing state and a robust subscription model for observing changes.

This library is designed to be a building block for more complex state
management solutions, offering a clean, observable API for managing a single
source of truth.

## Features

- **Single Source of Truth**: Centralize your application state in a single,
  observable `Container` instance.

- **Framework Agnostic**: The core `Container` class has no dependencies on any
  UI framework, making it usable in React, Vue, Svelte, or even vanilla
  JavaScript projects.

- **Efficient Subscriptions**: Use `subscribe` for general state changes or
  `computedSubscribe` to observe derived values, with built-in equality checks
  to prevent unnecessary updates.

- **Asynchronous Safe**: The `setValue` method and subscription callbacks are
  designed to handle asynchronous operations gracefully, waiting for all
  subscribers to complete before the update is considered finished.

- **Flexible Unsubscription**: Easily manage subscriptions with a returned
  `unsubscribe` function or an `AbortSignal`.

## Installation

To install the core package, you can use a package manager like pnpm, npm, or
yarn.

```sh
pnpm add containerized-state
# or
npm install containerized-state
# or
yarn add containerized-state
```

## The `Container` Class

The `Container` class is the heart of this library. It holds a single state
value and provides methods for interacting with it.

### `Container.create(initializer)`

A static factory method to create a new `Container` instance. The initializer
can be a direct value or a function that returns the initial value.

```ts
import { Container } from "containerized-state";

// Initialize with a direct value
const counterContainer = Container.create(0);
console.log(counterContainer.getValue()); // 0

// Initialize with a function
const userContainer = Container.create(() => ({ name: "Alice", id: 1 }));
console.log(userContainer.getValue()); // { name: "Alice", id: 1 }
```

### `container.getValue()`

Returns the current value of the container's state.

```ts
const container = Container.create("Hello");
console.log(container.getValue()); // "Hello"
```

### `container.setValue(newValue)`

Updates the value of the container's state and notifies all subscribers. This
method is asynchronous and returns a promise that resolves when all subscriber
callbacks have completed.

```ts
const container = Container.create(0);

const subscriber = vitest.fn();
container.subscribe(subscriber);

await container.setValue(10);
// All subscribers have been notified
console.log(container.getValue()); // 10
expect(subscriber).toHaveBeenCalledWith(10);
```

### `container.subscribe(cb, options?)`

Subscribes a callback function to be notified whenever the container's state
value changes.

- `cb`: The callback function that receives the new state value.
- `options.signal`: An optional `AbortSignal` to automatically unsubscribe.

The method returns an `unsubscribe` function to manually stop the subscription.

```ts
const container = Container.create(0);
const subscriber = value => console.log("Value changed to:", value);

const unsubscribe = container.subscribe(subscriber);

await container.setValue(1); // Logs: "Value changed to: 1"
unsubscribe();

await container.setValue(2); // Nothing is logged
```

### `container.computedSubscribe(computeValue, cb, options?)`

Subscribes to a derived (computed) value from the container's state. The
subscriber is only notified if the computed value changes.

- `computeValue`: A function that takes the state value and returns the derived
  value.
- `cb`: The callback function that receives the new computed value.
- `options.isEqual`: An optional custom equality function to control when the
  subscriber is notified. By default, `Object.is` is used.
- `options.signal`: An optional `AbortSignal` to automatically unsubscribe.

## Contributing

Read the
[contributing guide](https://github.com/mimshins/containerized-state/blob/main/CONTRIBUTING.md)
to learn about our development process, how to propose bug fixes and
improvements, and how to build and test your changes.

## License

This project is licensed under the terms of the
[MIT license](https://github.com/mimshins/containerized-state/blob/main/LICENSE).
