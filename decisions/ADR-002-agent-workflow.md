# ADR-002: Agent workflow and approvals

**Status:** Accepted, 2026-11-03

## Context

People use several agent tools here. Each has its own folder conventions, and
copying instructions into each would drift.

## Decision

1. `AGENTS.md` is the one entry point; `.ai/` holds agents, skills, memories,
   and templates. `CLAUDE.md`, `.claude/{agents,skills}`,
   `.opencode/{agents,skills}`, and `.agents/skills` are pointers only, enforced
   by `tools/agent-layer.test.ts`.
2. The layer consumes the READMEs, `decisions/`, and `runbook/`; removing it
   leaves those standing.
3. No agent stages, commits, or pushes without a human's approval and then the
   reviewer agent's, and without a human asking.

## Consequences

A new tool gets a pointer, not content. `specs/` and `rfcs/` are left out on
purpose: for packages this small, the READMEs are the contract.
