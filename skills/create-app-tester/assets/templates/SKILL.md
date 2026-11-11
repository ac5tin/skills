---
name: {{SKILL_NAME}}
description: Use when asked to test, verify, smoke-test, or check {{APP}}, including one feature, several, or all. Also use to update or resync the {{APP}} feature and use-case map.
---

# {{APP}} app tester

Generated {{DATE}} by create-app-tester. Primary surface: {{SURFACE}}.

Read `references/map.json` before a run. It lists every id, file, script, and entry command.

## Choose a playbook

| Request | Read |
|---|---|
| Test one, several, or all features or use cases | `references/playbooks/test.md` |
| Update, resync, add, or remove coverage | `references/playbooks/maintain.md` |
| No argument | Show both indexes and ask which ids to run |
| Environment, credentials, or limits | `references/environment.md` |

## Fast paths

- All: `references/playbooks/test.md`, selection `all`.
- Basic regression: selection `p0` (alias `basic`).
- One feature: `test feat-<slug>`.
- One use case: `test uc-<slug>`.

## Rules

- Run `doctor.{{EXT}}` before the first drive and after any failed drive.
- One `setup.{{EXT}}` per run. One `teardown.{{EXT}}` in a `finally` path.
- Evidence under `.app-tester/artifacts/<run-id>/` survives teardown.
- `SKIP` and `BLOCKED` are not passes.
- Never weaken an assertion. A product bug is a report.
- Never edit product code from this skill.
