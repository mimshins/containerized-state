---
description: Dependency direction and how notification works. Read before changing structure or the container.
---

# Architecture

Direction: core is a leaf; react and with-persistence depend on it and not on each
other. See [AGENTS.md](../../AGENTS.md).

**Notification.** `setValue` changes the value at once, then queues a notification.
`#runNotifications` drains the queue in order, and an update made during a
notification waits in that queue, so subscribers see updates in order. Each
subscriber runs in its own async `#notify`, so one that throws cannot stop another.

**`Container` is nominal to TypeScript** because of its protected members: two
declarations of it are different types. So no package may bundle core's types
(`deps.neverBundle` in `tsdown.base.ts`; checked in `tools/package-tarball.ts`).

**`PersistentContainer`** overrides `setValue` and `reset`. Its `reset` calls
`super.setValue` directly: core's `reset` calls `this.setValue`, which would save
the initial value. It clears storage before notifying, so a value a subscriber sets
in response stays saved.

**Server rendering.** The hooks' server snapshot is `getServerValue()`, not
`getValue()`. `PersistentContainer` returns its initial value there, so hydration
matches the server's HTML.
