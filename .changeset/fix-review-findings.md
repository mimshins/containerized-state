---
"containerized-state": minor
"react-containerized-state": minor
"containerized-state-plugin-persistence": minor
---

Fix correctness problems found in a review:

- `setValue` settles only after every subscriber has finished, and rejects with an `AggregateError` if several failed. It used to reject at the first failure, while others were still running, and lose the rest.
- `computedSubscribe` no longer notifies of an unchanged value when `computeValue` returns a new object. A custom `isEqual` still decides for itself.
- A new `Container.getServerValue()` is what the React hooks render on the server and while hydrating. `PersistentContainer` returns its initial value there, which fixes a hydration mismatch with a persisted value.
- `react-containerized-state` no longer imports `react/jsx-runtime`, which its peer range did not guarantee, and depends on `containerized-state` with a caret range instead of an exact version, which could install a second, incompatible `Container`. `Subscribe` now returns `ReactElement`.
- `PersistentContainer.reset()` keeps a value a subscriber sets in response, which used to be cleared from storage, and no longer writes the initial value first.
- `withPersistence` keeps a value that is a function instead of calling it.
- `PersistenceConfig` takes `serialize` and `deserialize`, for values JSON cannot hold and to validate what is stored, and `onError`, to hear about failures that are otherwise silent.
