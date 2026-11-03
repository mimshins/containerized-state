# .ai: agent knowledge layer

Map of the AI-oriented layer. It **consumes and references** the root-level
project knowledge (package READMEs, `decisions/`, `runbook/`, `CONTRIBUTING.md`)
and never duplicates it. If all AI tooling were removed, those sources would
still stand on their own.

Entry point for agents: [`AGENTS.md`](../AGENTS.md). Tool adapters (`CLAUDE.md`,
`.claude/{agents,skills}`, `.opencode/{agents,skills}`, `.agents/skills`) are
pointers into this layer and must never hold content;
`tools/agent-layer.test.ts` enforces it.

## Placement rules

| Location                | Holds                                      | Test question                                                        |
| ----------------------- | ------------------------------------------ | -------------------------------------------------------------------- |
| `packages/*/README.md`  | public behavior and API                    | Is this what the package promises?                                   |
| `decisions/`            | accepted decisions and rationale (ADRs)    | Does it document _why_?                                              |
| `runbook/`              | how to develop, release, operate           | Would a human need it with no AI tooling?                            |
| `.ai/memories/`         | durable context that helps an agent orient | Does it help an agent decide, without being a contract or procedure? |
| `.ai/memories/working/` | unresolved or in-flight context            | Is it still active or unresolved?                                    |
| `.ai/skills/`           | how to perform a reusable class of task    | Is it a repeatable workflow?                                         |
| `.ai/agents/`           | role-specific behavior and boundaries      | Does it apply to one role only?                                      |
| `.ai/templates/`        | templates for maintaining this layer       | -                                                                    |

**Rules:** single source of truth, so link and do not copy; memories describe
the present, not history; no secrets.

## Index

Load only what the task needs.

### Memories

- [`overview.md`](./memories/overview.md): what the packages are. Read first.
- [`architecture.md`](./memories/architecture.md): dependency direction and how
  notification works. Before changing structure or the container.
- [`conventions.md`](./memories/conventions.md): TypeScript and code style.
- [`testing.md`](./memories/testing.md): test levels and how to add one.
- [`development-workflow.md`](./memories/development-workflow.md): approvals,
  scripts, pull requests, release.
- [`working/README.md`](./memories/working/README.md): lifecycle of in-flight
  memories.

### Skills

- [`add-a-package`](./skills/add-a-package/SKILL.md): add a package under
  `packages/`.
- [`write-tests`](./skills/write-tests/SKILL.md): choose a test level and apply
  the rules.
- [`ask-the-human`](./skills/ask-the-human/SKILL.md): raise an open question.

### Agents

Order: implementer → **human review** → reviewer → commit (on request).

- [`implementer.md`](./agents/implementer.md): code and tests; stops for review.
- [`reviewer.md`](./agents/reviewer.md): the final gate after human approval.

### Templates

[`memory.md`](./templates/memory.md), [`skill.md`](./templates/skill.md),
[`agent.md`](./templates/agent.md), [`adr.md`](./templates/adr.md).
