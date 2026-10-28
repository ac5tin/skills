---
name: setup-autobot
description: Use only when the user explicitly invokes /setup-autobot or @setup-autobot to create, inspect or validate the autobot template. Never auto-select.
---

# Setup Autobot

Write and validate the template that `/autobot` reads. This skill does not install anything, change harness settings, create a driver, or run a task.

Invoke as `/setup-autobot`, optionally with `show effective`, `show harness`, `validate` or `edit`.

## Where the template lives

Resolve in this order:

1. `--template <path>` when given: `.md` or `.mdc`, resolved from the invocation directory. Missing, unreadable, or wrong extension is a blocker; no fallback.
2. `~/.config/autobot.md`.
3. `./autobot.md` in the invocation directory.

For a write or removal, require explicit or unambiguous scope. Ask one targeted question when the scope is unclear. Never create a default file merely because `/autobot` was run.

## Show effective

Report the selected source, its content, and the selection step that chose it. Do not show shadowed files. An empty file that exists is still selected. No merging and no ancestor search.

## Show harness

Report, without writing: whether this session can create an independent agent, send to it, receive from it, and halt it. Name the one setup action left when a capability is missing. A harness name is not a capability.

## Validate

Check the selected template against the schema below. Report each missing required field and each malformed line. Validation changes nothing.

## Schema

```markdown
# <fleet> autobot template

## Fleet
- What this fleet does
- Where work lives: repos, docs, boards
- Standing taste and rules

## Plan home
- kind: repo-file | external-doc | ticket
- location: <path or URL pattern>
- naming: <slug rule>

## Driver bot
- name: <pattern, for example "PIC — <task-slug>">
- one job: <one sentence>
- description: <full agent description>
- model: <provider/model, or "inherit">
- workspace: <path, or "own">
- section: <where to place it>
- created by: <agent that creates the driver, or "direct">
- skills required: <must include implementation-plan>
- notifications: off
- reports to: leader
- anti-jobs: <list>

## Release
- merge policy: <who merges; what counts as the release target>

## Escalation and consultations
- consultations: <agent or role, and when the leader must obtain its input>
- contacts and when to use them
- hard gates
```

Required fields: name, one job, description, skills required, plan home, merge policy. A missing required field blocks a run before any bot is created.

The template is fleet configuration. It cannot change the approval chain: the leader decides and the human approves the plan and the exact release.

## Edit

1. Read the selected file, including frontmatter and unrelated sections.
2. Make the smallest targeted change. Preserve unrelated content.
3. Re-read and report the exact path and the change.

An edit applies to the next run. A run freezes its template at invocation, so an approved plan is unaffected.

## Roles

`created by` names an agent that designs bots. Keep it in the template, not in `autobot`. When it is absent or unreachable, the leader creates the driver directly.
