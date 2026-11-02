# containerized-state

## 3.3.1
### Patch Changes



- [#29](https://github.com/mimshins/containerized-state/pull/29) [`b09c1d5`](https://github.com/mimshins/containerized-state/commit/b09c1d520292d729c21f0298eeed48efcba88bad) Thanks [@mimshins](https://github.com/mimshins)! - Make notifications reliable when something changes during one. An update made by
  a subscriber is delivered after the current one, so every subscriber sees updates
  in order and ends on the current value. A subscriber added during a notification
  waits for the next one. A `computeValue` or `isEqual` that throws no longer stops
  the remaining subscribers.


- [#31](https://github.com/mimshins/containerized-state/pull/31) [`1ef3623`](https://github.com/mimshins/containerized-state/commit/1ef362321310959ce9e41cb31a617a1eae981842) Thanks [@mimshins](https://github.com/mimshins)! - Mark the packages as free of side effects, so bundlers can drop what is not
  imported. `react-containerized-state` no longer asks for `react-dom`, which it
  never uses, so React Native projects get no peer warning.

## 3.3.0
### Minor Changes



- [`251be02`](https://github.com/mimshins/containerized-state/commit/251be02b6be7000b33e58c3d3311b9fefad09763) Thanks [@mimshins](https://github.com/mimshins)! - Refactor: update to make the packages ESM-only.

## 3.2.0
### Minor Changes



- [#13](https://github.com/mimshins/containerized-state/pull/13) [`f1ceb2d`](https://github.com/mimshins/containerized-state/commit/f1ceb2d0a01332f1d0cdf7248c0c3f97b3ea3805) Thanks [@mimshins](https://github.com/mimshins)! - Add `reset` method.

## 3.0.1
### Patch Changes



- [`dc6bd2c`](https://github.com/mimshins/containerized-state/commit/dc6bd2c3b2588a6f703bbe47fb57072da7b67d65) Thanks [@mimshins](https://github.com/mimshins)! - Add package docs

## 3.0.0
### Major Changes



- [#3](https://github.com/mimshins/containerized-state/pull/3) [`6fb315d`](https://github.com/mimshins/containerized-state/commit/6fb315d7bb8108c529e27d8ca3ac58dbfb25b593) Thanks [@mimshins](https://github.com/mimshins)! - [BREAKING CHANGE] update to only support async container
