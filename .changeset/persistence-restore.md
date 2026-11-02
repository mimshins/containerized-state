---
"containerized-state-plugin-persistence": patch
---

Restore a persisted value faithfully. A saved `null` now comes back as `null`
instead of the initial value. Data under the key that this package did not store,
such as a number or an object with no timestamp, is ignored instead of becoming
the value. A `ttl` of 0 now expires the value instead of never expiring it.
