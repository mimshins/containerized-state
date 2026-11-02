---
"containerized-state": patch
"react-containerized-state": patch
"containerized-state-plugin-persistence": patch
---

Mark the packages as free of side effects, so bundlers can drop what is not
imported. `react-containerized-state` no longer asks for `react-dom`, which it
never uses, so React Native projects get no peer warning.
