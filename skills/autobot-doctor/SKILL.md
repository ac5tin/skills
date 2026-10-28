---
name: autobot-doctor
description: Use only when the user explicitly invokes /autobot-doctor or @autobot-doctor to check an autobot setup and name what blocks a run. Never auto-select.
---

# Autobot Doctor

Check whether `/autobot` can run here. Report. Never fix, edit, create, install or change a permission.

Invoke as `/autobot-doctor`, optionally with `template`, `harness` or `fleet`.

## Order

Run every check, then give the verdict. A blocker stops the run, not the report.

1. **Template** — apply `../autobot-setup/reference/template-checks.md`, relative to this skill directory, to the selected file. Nothing selected is a blocker that names `/autobot-setup`. When that reference is unreadable, report `autobot-setup` missing and skip this check.
2. **Harness** — probe create an agent, send to it, receive from it, halt it. Delete or archive is optional: retitle at close instead.
3. **Fleet** — `implementation-plan` loads; `autobot/playbooks/verify-plan.md` and `autobot/playbooks/recover-pic.md` are readable.

## Report

One line per check with the evidence: the probe result, the file path, or the version you read. Each finding ends with its fix — file, field, expected value. Report the fix; never apply it.

Then the verdict:

- `READY` — no blocker. List the warnings.
- `BLOCKED` — the first blocker in check order and the one fix that clears it.

Never claim a capability you did not probe. A harness name is not a capability.
