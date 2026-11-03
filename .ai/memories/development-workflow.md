---
description: Approvals, scripts, pull requests, and release. Read before starting work or opening a pull request.
---

# Development workflow

- Approvals and the agent order: [AGENTS.md](../../AGENTS.md).
- Branch from `main`, one logical change per pull request. A change a consumer can
  observe needs a changeset; CI's `changeset` job checks.
- `ci-ok` is the one check that aggregates the rest.
- Release: [runbook/release.md](../../runbook/release.md).
