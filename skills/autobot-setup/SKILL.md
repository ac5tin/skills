---
name: autobot-setup
description: Use only when the user explicitly invokes /autobot-setup or @autobot-setup to create, inspect or validate the autobot template. Never auto-select.
---

# Autobot Setup

Write and validate the template that `/autobot` reads. This skill does not install anything, change harness settings, create a driver, or run a task.

Invoke as `/autobot-setup`, optionally with `show effective`, `show harness`, `validate` or `edit`.

## Where the template lives

Apply the selection step in `reference/template-checks.md`, relative to this skill directory. That file is authoritative for the order and for every check. Do not restate it.

For a write or removal, require explicit or unambiguous scope. Ask one targeted question when the scope is unclear. Never create a default file merely because `/autobot` was run.

## Show effective

Report the selected source, its content, and the selection step that chose it. Do not show shadowed files. An empty file that exists is still selected.

## Show harness

Report the same capability report as `/autobot-doctor harness`: create, send, receive, halt, and the one setup action left when one is missing. A harness name is not a capability.

## Validate

Apply `reference/template-checks.md` to the selected file. Report its output, including the verdict line. Change nothing.

When that file is unreadable, stop and report it as missing. Do not validate from memory.

## Edit

1. Read the selected file, including frontmatter and unrelated sections.
2. Make the smallest targeted change. Preserve unrelated content.
3. Apply `reference/template-checks.md` again and report the verdict.
4. Re-read and report the exact path and the change.

An edit applies to the next run. A run freezes its template at invocation, so an approved plan is unaffected.

## Roles

`created by` names an agent that designs bots. Keep it in the template, not in `autobot`. When it is absent or unreachable, the leader creates the driver directly.
