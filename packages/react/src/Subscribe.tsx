import type {
  ComputeValue,
  Container,
  EqualityCheckFunction,
} from "containerized-state";
import {
  createElement,
  Fragment,
  type ReactElement,
  type ReactNode,
} from "react";

import { useComputedValue } from "./use-computed-value.ts";

export type SubscribeProps<T, P> = {
  /**
   * The state container to subscribe to.
   */
  container: Container<T>;
  /**
   * A render function that receives the computed value as an argument.
   */
  children: (renderProps: P) => ReactNode;
  /**
   * A function that computes a derived value from the container's state.
   */
  compute?: ComputeValue<T, P> | undefined;
  /**
   * An optional function to compare previous and next computed values to
   * prevent unnecessary re-renders.
   */
  isEqual?: EqualityCheckFunction<P> | undefined;
};

/**
 * A render props component that subscribes to a state container and provides
 * a computed value to its children.
 *
 * It uses the `useComputedValue` hook internally to handle the subscription
 * and re-rendering logic. This component is useful for encapsulating state
 * access and providing a clean, declarative API for consuming state in a
 * React component tree.
 *
 * @template T The type of the value in the state container.
 * @template P The type of the computed value.
 *
 * @example
 * // In a component:
 * const myContainer = new Container({ name: "Alice", age: 30 });
 *
 * <Subscribe
 * container={myContainer}
 * compute={(state) => `Hello, ${state.name}! You are ${state.age} years old.`}
 * >
 * {(greeting) => <div>{greeting}</div>}
 * </Subscribe>
 */
export const Subscribe = <T, P = T>(
  props: SubscribeProps<T, P>,
): ReactElement => {
  const {
    children: render,
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- with no `compute`, P defaults to T, and the types cannot express that link.
    compute = (value: T) => value as unknown as P,
    container,
    isEqual,
  } = props;

  // The component will re-render whenever the computed value changes.
  const computed = useComputedValue(container, compute, isEqual);
  // Call the render prop function with the computed value to get the children to render.
  const children = render(computed);

  // Not JSX: the automatic runtime it compiles to needs `react/jsx-runtime`, which
  // the versions at the start of the peer range do not have.
  return createElement(Fragment, null, children);
};
