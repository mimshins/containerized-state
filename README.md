# containerized-state

Fast and minimal state container which can be used and shared across every
environment.

[![license](https://img.shields.io/github/license/mimshins/containerized-state?color=010409&style=for-the-badge)](https://github.com/mimshins/containerized-state/blob/main/LICENSE)
[![npm latest package](https://img.shields.io/npm/v/containerized-state?color=010409&style=for-the-badge)](https://www.npmjs.com/package/containerized-state)
[![npm downloads](https://img.shields.io/npm/dt/containerized-state?color=010409&style=for-the-badge)](https://www.npmjs.com/package/containerized-state)
[![bundle size](https://img.shields.io/bundlephobia/minzip/containerized-state?style=for-the-badge&color=%23010409)](https://bundlephobia.com/package/containerized-state)

## Installation

To install the package, run:

```bash
npm install containerized-state
# Or via any other package manager
```

## API Reference

This library exposes two APIs:

### `StateContainer`:

The `StateContainer` class is a utility for centralized state management,
providing mechanisms to subscribe to state changes and notify subscribers
efficiently. It supports both default and computed subscriptions, ensuring that
updates are only propagated when necessary. This class is ideal for applications
that require reactive state handling, optimization for performance, and
customizable state change notifications.

```ts
class StateContainer<T> {
  static create<T>(initializer: Initializer<T>): StateContainer<T>;
  constructor(initializer: Initializer<T>);
  setValue(newValue: T): void;
  getValue(): T;
  subscribe(
    cb: SubscribeCallback<T>,
    options?: {
      signal?: AbortSignal;
    },
  ): Unsubscribe;
  computedSubscribe<P>(
    computeValue: ComputeValue<T, P>,
    cb: SubscribeCallback<P>,
    options?: {
      signal?: AbortSignal;
      isEqual?: EqualityCheckFunction<P>;
    },
  ): Unsubscribe;
}
```

#### `setValue`

Updates the value of the state and notifies the subscribers.

#### `getValue`

Returns a snapshot of the state.

#### `subscribe`

Subscribes to the changes of the container's state value and returns the
unsubscribe function.

#### `computedSubscribe`

Subscribes to the changes of the container's selected state values and returns
the unsubscribe function. For more control over emission changes, you may
provide a custom equality function.

### `AsyncStateContainer`:

This class is ideal for applications where state updates involve asynchronous
processes, ensuring that all subscribers are notified correctly even after async
changes. Additionally, it is particularly useful for handling heavy and slow
calculations, allowing these operations to complete without blocking the main
execution flow.

```ts
class AsyncStateContainer<T> {
  static create<T>(initializer: Initializer<T>): StateContainer<T>;
  constructor(initializer: Initializer<T>);
  setValue(newValue: T): Promise<void>;
  getValue(): T;
  subscribe(
    cb: SubscribeCallback<T>,
    options?: {
      signal?: AbortSignal;
    },
  ): Unsubscribe;
  computedSubscribe<P>(
    computeValue: ComputeValue<T, P>,
    cb: SubscribeCallback<P>,
    options?: {
      signal?: AbortSignal;
      isEqual?: EqualityCheckFunction<P>;
    },
  ): Unsubscribe;
}
```

#### `setValue`

Updates the value of the state and notifies the subscribers. This will be
resolved when all the subscribers are notified.

#### `getValue`

Returns a snapshot of the state.

#### `subscribe`

Subscribes to the changes of the container's state value and returns the
unsubscribe function.

#### `computedSubscribe`

Subscribes to the changes of the container's selected state values and returns
the unsubscribe function. For more control over emission changes, you may
provide a custom equality function.

### `subscribe` vs. `computedSubscribe`

Both the `subscribe` and `computedSubscribe` methods allow you to subscribe to
changes in the container's state, but they serve different purposes and offer
different levels of control.

#### `subscribe`

The `subscribe` method allows you to subscribe to any changes in the container's
state. This method is straightforward and notifies subscribers every time the
state changes, regardless of the nature of the change.

##### Parameters

- `cb`: A callback function that is invoked whenever the state changes. The
  callback receives the new state value as its argument.
- `options` (optional): An object containing additional options for the
  subscription.
  - `signal` (optional): An `AbortSignal` reference that can be used to
    unsubscribe from changes. If the signal is aborted, the subscription is
    automatically removed.

##### Returns

A function that can be called to manually unsubscribe from the changes.

##### Usage

```ts
// Define a state container with an initial value
const container = StateContainer.create(42);
// You can also instantiate a new container using the `new` keyword. For example: `new StateContainer(42)`.

// Define a callback function that will be invoked when the state changes
const callback: SubscribeCallback<number> = newValue => {
  console.log("State changed:", newValue);
};

// Subscribe to the state changes
const unsubscribe = container.subscribe(callback);

// Update the state
container.setValue(24); // This will trigger the callback

// Unsubscribe from the changes
unsubscribe();
```

#### `computedSubscribe`

The `computedSubscribe` method allows you to subscribe to changes in selected
state values derived from the container's state. This method is useful for
scenarios where you need more granular control over state changes, such as
monitoring specific computed properties rather than the entire state.

##### Parameters

- `computeValue`: A function that takes the current state value and returns the
  computed value of type `P`. This function is used to derive the value that the
  subscriber is interested in.
- `cb`: A callback function that is invoked whenever the computed value changes.
  The callback receives the new computed value as its argument.
- `options` (optional): An object containing additional options for the
  subscription.
  - `signal` (optional): An `AbortSignal` reference that can be used to
    unsubscribe from changes. If the signal is aborted, the subscription is
    automatically removed.
  - `isEqual` (optional): A custom equality function to control emission
    changes. This function takes the previous and current computed values as
    arguments and returns a boolean indicating whether they are equal. If they
    are equal, the callback is not invoked.

##### Returns

A function that can be called to manually unsubscribe from the changes.

##### Usage

```ts
type State = {
  count: number;
  name: string;
};

// Define a state container with an initial value
const container = StateContainer.create<State>({ count: 0, name: "John" });
// You can also instantiate a new container using the `new` keyword. For example: `new StateContainer(42)`.

// Define a compute value function that selects a specific part of the state
const computeValue: ComputeValue<State, number> = state => state.count;

// Define a callback function that will be invoked when the computed value changes
const callback: SubscribeCallback<number> = newValue => {
  console.log("Computed value changed:", newValue);
};

// Subscribe to the computed value changes
const unsubscribe = container.computedSubscribe(computeValue, callback);

// Update the state
container.setValue({ count: 1, name: "John" }); // This will not trigger the callback (`count` remains the same)
container.setValue({ count: 2, name: "Doe" }); // This will trigger the callback (`count` changes)

// Unsubscribe from the changes
unsubscribe();
```

## Contributing

Read the
[contributing guide](https://github.com/mimshins/containerized-state/blob/main/CONTRIBUTING.md)
to learn about our development process, how to propose bug fixes and
improvements, and how to build and test your changes.

Contributing to "Containerized State" is about more than just issues and pull
requests! There are many other ways to support the project beyond contributing
to the code base.

## License

This project is licensed under the terms of the
[MIT license](https://github.com/mimshins/containerized-state/blob/main/LICENSE).
