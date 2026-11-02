---
"containerized-state-plugin-persistence": minor
---

Accept any storage with `getItem`, `setItem` and `removeItem`, through the new
`PersistenceStorage` type. A custom storage no longer has to implement the rest
of `Storage`. `localStorage` and `sessionStorage` work as before.
