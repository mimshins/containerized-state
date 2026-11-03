---
name: ask-the-human
description: Use when blocked on an open question or a decision that is the human's to make. Raises it with concrete options and a recommendation.
---

# ask-the-human

## Workflow

1. Check the code, READMEs, and `decisions/` first; ask only what they do not
   settle.
2. Ask through the host's structured-question tool (Claude Code: `AskUserQuestion`).
   With no such tool, or as a subagent, put the questions in the report and stop.
3. Give each question its context, concrete options, and a recommendation when a
   source favors one.
4. Record the answer where it belongs: the diff, a README, or an ADR.

## Constraints

An answer is not an approval: it never replaces the gates of `AGENTS.md`.

## Expected output

A decision recorded in the repository, not only in chat.
