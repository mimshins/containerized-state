# react-containerized-state

## 3.4.0

### Minor Changes

- [#35](https://github.com/mimshins/containerized-state/pull/35) [`8732d36`](https://github.com/mimshins/containerized-state/commit/8732d36df860f07db33d9eedeef30dab7490efa8) Thanks [@mimshins](https://github.com/mimshins)! - Fix correctness problems found in a review:
  
  - `setValue` settles only after every subscriber has finished, and rejects with an `AggregateError` if several failed. It used to reject at the first failure, while others were still running, and lose the rest.
  - `computedSubscribe` no longer notifies of an unchanged value when `computeValue` returns a new object. A custom `isEqual` still decides for itself.
  - A new `Container.getServerValue()` is what the React hooks render on the server and while hydrating. `PersistentContainer` returns its initial value there, which fixes a hydration mismatch with a persisted value.
  - `react-containerized-state` no longer imports `react/jsx-runtime`, which its peer range did not guarantee, and depends on `containerized-state` with a caret range instead of an exact version, which could install a second, incompatible `Container`. `Subscribe` now returns `ReactElement`.
  - `PersistentContainer.reset()` keeps a value a subscriber sets in response, which used to be cleared from storage, and no longer writes the initial value first.
  - `withPersistence` keeps a value that is a function instead of calling it.
  - `PersistenceConfig` takes `serialize` and `deserialize`, for values JSON cannot hold and to validate what is stored, and `onError`, to hear about failures that are otherwise silent.

### Patch Changes

- [#35](https://github.com/mimshins/containerized-state/pull/35) [`8732d36`](https://github.com/mimshins/containerized-state/commit/8732d36df860f07db33d9eedeef30dab7490efa8) Thanks [@mimshins](https://github.com/mimshins)! - Build with the updated toolchain. Optional options and props also accept an explicit `undefined`, for projects that use `exactOptionalPropertyTypes`.
- Updated dependencies [[`8732d36`](https://github.com/mimshins/containerized-state/commit/8732d36df860f07db33d9eedeef30dab7490efa8), [`8732d36`](https://github.com/mimshins/containerized-state/commit/8732d36df860f07db33d9eedeef30dab7490efa8)]:
  - containerized-state@3.4.0

## 3.3.1
### Patch Changes



- [#31](https://github.com/mimshins/containerized-state/pull/31) [`1ef3623`](https://github.com/mimshins/containerized-state/commit/1ef362321310959ce9e41cb31a617a1eae981842) Thanks [@mimshins](https://github.com/mimshins)! - Mark the packages as free of side effects, so bundlers can drop what is not
  imported. `react-containerized-state` no longer asks for `react-dom`, which it
  never uses, so React Native projects get no peer warning.


- [#28](https://github.com/mimshins/containerized-state/pull/28) [`8ee56f7`](https://github.com/mimshins/containerized-state/commit/8ee56f7fa9f341ffbbfcadab580add81d04bfd6d) Thanks [@mimshins](https://github.com/mimshins)! - Import React's types by name instead of relying on the global `React` namespace,
  so the declarations compile whichever types a project loads.


- [#26](https://github.com/mimshins/containerized-state/pull/26) [`cd357b2`](https://github.com/mimshins/containerized-state/commit/cd357b22a0e17882087840c94b87623ed38c1aea) Thanks [@mimshins](https://github.com/mimshins)! - Import the `Container` type from `containerized-state` instead of bundling a copy
  of it. `withPersistence(Container.create(...))` and
  `useValue(persistentContainer)` now typecheck in an installed project.
- Updated dependencies [[`b09c1d5`](https://github.com/mimshins/containerized-state/commit/b09c1d520292d729c21f0298eeed48efcba88bad), [`1ef3623`](https://github.com/mimshins/containerized-state/commit/1ef362321310959ce9e41cb31a617a1eae981842)]:
  - containerized-state@3.3.1

## 3.3.0
### Minor Changes



- [`251be02`](https://github.com/mimshins/containerized-state/commit/251be02b6be7000b33e58c3d3311b9fefad09763) Thanks [@mimshins](https://github.com/mimshins)! - Refactor: update to make the packages ESM-only.


### Patch Changes

- Updated dependencies [[`251be02`](https://github.com/mimshins/containerized-state/commit/251be02b6be7000b33e58c3d3311b9fefad09763)]:
  - containerized-state@3.3.0

## 3.2.1
### Patch Changes



- [`6ecf55f`](https://github.com/mimshins/containerized-state/commit/6ecf55f845b3d03f6e8abb5ea9313e45921592c6) Thanks [@mimshins](https://github.com/mimshins)! - Bump dependency versions

## 3.2.0
### Patch Changes



- [#10](https://github.com/mimshins/containerized-state/pull/10) [`5ed861c`](https://github.com/mimshins/containerized-state/commit/5ed861cbe5025214dc96586867a0c2ca6a561fda) Thanks [@amir78729](https://github.com/amir78729)! - Set `value => value` from `compute` default value in `Subscribe`.

- Updated dependencies [[`f1ceb2d`](https://github.com/mimshins/containerized-state/commit/f1ceb2d0a01332f1d0cdf7248c0c3f97b3ea3805)]:
  - containerized-state@3.2.0

## 3.1.0
### Minor Changes



- [#8](https://github.com/mimshins/containerized-state/pull/8) [`8a8ba4e`](https://github.com/mimshins/containerized-state/commit/8a8ba4e46348e92b1ca62496584a6d5ba4091e47) Thanks [@mimshins](https://github.com/mimshins)! - Add subscribe component.

## 3.0.1
### Patch Changes



- [`dc6bd2c`](https://github.com/mimshins/containerized-state/commit/dc6bd2c3b2588a6f703bbe47fb57072da7b67d65) Thanks [@mimshins](https://github.com/mimshins)! - Add package docs

- Updated dependencies [[`dc6bd2c`](https://github.com/mimshins/containerized-state/commit/dc6bd2c3b2588a6f703bbe47fb57072da7b67d65)]:
  - containerized-state@3.0.1

## 3.0.0
### Major Changes



- [#3](https://github.com/mimshins/containerized-state/pull/3) [`6fb315d`](https://github.com/mimshins/containerized-state/commit/6fb315d7bb8108c529e27d8ca3ac58dbfb25b593) Thanks [@mimshins](https://github.com/mimshins)! - [BREAKING CHANGE] update to only support async container


### Patch Changes

- Updated dependencies [[`6fb315d`](https://github.com/mimshins/containerized-state/commit/6fb315d7bb8108c529e27d8ca3ac58dbfb25b593)]:
  - containerized-state@3.0.0
