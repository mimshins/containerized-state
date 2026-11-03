---
name: write-tests
description: Use when adding or changing behavior. Chooses the right test level and applies the repository's test rules.
---

# write-tests

## Prerequisites

[testing memory](../../memories/testing.md).

## Workflow

1. Pick the level: container or storage logic is a **unit** test beside the code;
   a hook or component is a **component** test (Vitest, jsdom, Testing Library); a
   repository rule is a **guard** in `tools/`, with a case that proves it fails;
   what a consumer sees of the published package is in `tools/check-packages.ts`.
2. Assert behavior: what a subscriber received and in what order, what storage
   holds, not how many internal calls were made.
3. Keep it hermetic: fake timers and the clock (`vitest.useFakeTimers()`), a
   memory storage, no network.
4. Check it fails without the change.

## Constraints

Deterministic; one behavior per test; never skip or weaken a test to go green;
coverage stays at 100%.

## Useful commands

`pnpm test`, `pnpm test:tools`, `pnpm check`

## Expected output

Tests at the right level that fail without the change and pass with it.
