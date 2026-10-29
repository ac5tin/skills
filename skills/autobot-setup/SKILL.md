---
name: autobot-setup
description: Use only when the user explicitly invokes /autobot-setup or @autobot-setup to create, inspect or validate the autobot template. Never auto-select.
---

# Autobot Setup

Write and validate the template that `/autobot` reads. This skill does not install anything, change harness settings, create a driver, or run a task.

Invoke as `/autobot-setup`, optionally with `interview`, `show effective`, `show harness`, `validate` or `edit`. With no argument: the interview when no template is selected, otherwise `show effective`.

## Interview

Start here when no template is selected. Ask one group at a time, in this order, and wait for the answer. Never ask two groups in one message.

1. **Fleet** — what the fleet does, where work lives, and the standing rules. Ask for a short list.
2. **Plan home** — `repo-file`, `external-doc` or `ticket`; the location; the naming rule. Ask for the location and the storage.
3. **Driver bot** — propose a name pattern, one job, model, workspace, section, creator and anti-jobs. Ask only what the answers above cannot settle.
4. **Release** — who merges, what counts as the release target, and whether a deploy is in scope.
5. **Escalation** — which agents must approve or be consulted, and the hard gates. `none` is a valid answer for consultations.

Propose a value for every field and say it is a proposal. The human corrects it. Never invent a value the human did not confirm.

Then show the assembled file. First line: `Template draft: write it, or name a change`. On confirmation, write one file to the scope the human chose: `~/.config/autobot.md` (global) or `./autobot.md` (this directory). Then apply `reference/template-checks.md` and report the source, any shadowed file, and the verdict.

## Where the template lives

Apply the selection step in `reference/template-checks.md`, relative to this skill directory. That file is authoritative for the order and for every check. Do not restate it.

For a write or removal, require explicit or unambiguous scope. Ask one targeted question when the scope is unclear. Never create a default file merely because `/autobot` was run.

## Show effective

Report the selected source, its content, and the step that chose it. Name each lower-precedence file that exists as shadowed, with its step and path only. An empty file that exists is still selected.

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
