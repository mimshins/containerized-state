---
"containerized-state-plugin-persistence": patch
---

Save to storage before notifying subscribers. A subscriber that rejects, never
resolves or finishes late can no longer stop a save, or leave an older value in
storage over a newer one. `reset` clears storage the same way, and no longer
rejects when storage is unavailable.
