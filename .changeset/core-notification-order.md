---
"containerized-state": patch
---

Make notifications reliable when something changes during one. An update made by
a subscriber is delivered after the current one, so every subscriber sees updates
in order and ends on the current value. A subscriber added during a notification
waits for the next one. A `computeValue` or `isEqual` that throws no longer stops
the remaining subscribers.
