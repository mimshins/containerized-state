import { act } from "@testing-library/react";
import { Container } from "containerized-state";
import type { JSX } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { useComputedValue } from "./use-computed-value.ts";
import { useValue } from "./use-value.ts";

/** Holds a value only the client knows, like a persistent container. */
class ClientOnlyContainer extends Container<string> {
  public override getServerValue(): string {
    return "server";
  }
}

const hydrate = async (
  app: JSX.Element,
  serverText = "server",
): Promise<{ element: HTMLElement; errors: unknown[] }> => {
  const errors: unknown[] = [];
  const element = document.createElement("div");

  element.innerHTML = renderToString(app);
  document.body.append(element);
  expect(element.textContent).toBe(serverText);

  await act(async () => {
    hydrateRoot(element, app, {
      onRecoverableError: error => {
        errors.push(error);
      },
    });
    await Promise.resolve();
  });

  return { element, errors };
};

/** A container from a core older than `getServerValue`. */
const fromOlderCore = <T,>(value: T): Container<T> => {
  const container = new Container(value);

  Object.defineProperty(container, "getServerValue", { value: undefined });

  return container;
};

describe("server rendering", () => {
  it("should render a container from an older core, on both sides", async () => {
    const container = fromOlderCore("server");
    const App = (): JSX.Element => (
      <p>
        {useValue(container)}
        {useComputedValue(container, value => value.length)}
      </p>
    );

    const { element, errors } = await hydrate(<App />, "server6");

    expect(errors).toEqual([]);
    expect(element.textContent).toBe("server6");
  });

  it("useValue should hydrate from the server value, then show the client's", async () => {
    const container = new ClientOnlyContainer("client");
    const App = (): JSX.Element => <p>{useValue(container)}</p>;

    const { element, errors } = await hydrate(<App />);

    expect(errors).toEqual([]);
    expect(element.textContent).toBe("client");
  });

  it("useComputedValue should hydrate from the server value, then show the client's", async () => {
    const container = new ClientOnlyContainer("client");
    const App = (): JSX.Element => (
      <p>{useComputedValue(container, value => value)}</p>
    );

    const { element, errors } = await hydrate(<App />);

    expect(errors).toEqual([]);
    expect(element.textContent).toBe("client");
  });
});
