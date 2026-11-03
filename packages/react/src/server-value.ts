import type { Container } from "containerized-state";

/**
 * The container's server value. The app may hold a `Container` from an older
 * core than this package depends on, with no such method, and that must keep
 * rendering: its server value is its current value. The types describe this
 * package's core, so they cannot say so.
 */
export const getServerValue = <T>(container: Container<T>): T =>
  typeof container.getServerValue === "function"
    ? container.getServerValue()
    : container.getValue();
