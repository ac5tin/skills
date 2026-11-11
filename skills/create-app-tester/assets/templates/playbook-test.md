# Test playbook

Drive the real app with its own harness. Report one status per selected entry, with evidence.

## 1. Select

Resolve the target first: `--target <name>`, else `APP_TEST_TARGET`, else `map.json.default_target`. An unknown name stops the run and lists the declared targets. One target per run.

Then select entries:

| Selection | Entries to run |
|---|---|
| `all` | Every id in `references/map.json` |
| `p0` or `basic` | Every entry with priority `P0` |
| `p1`, `p2`, `p3` | Entries at that level |
| `p0-p1` | Every entry in the range |
| Explicit ids | Those ids |

- One selection per run. Do not mix ids with a priority.
- A priority run covers both features and use cases at that level.
- Nothing: print both indexes with ids and priorities, then ask. Do not guess.
- An id missing from `map.json` is an error, not a new test.
- An entry whose `targets` list excludes the active target reports `SKIP`. Do not drop it silently.

## 2. Preflight

1. Run `{{RUNTIME}} .agents/skills/{{SKILL_NAME}}/scripts/doctor.{{EXT}} --target <name>`.
2. Healthy: continue. Unhealthy: repair the state, or report `BLOCKED` with the failing check and the exact command. Never drive an instance that failed the doctor.
3. For a `remote` target, keep the `version` value from the doctor output. It goes into the report.
4. The doctor also reports the env file and any missing name. A missing required name, or permission bits for group or other, is `BLOCKED`. Never guess a value.

## 2.1 Environment

- The target env file supplies values to `setup_steps` and to the entry scripts. Never read a value into a command line or a reply.
- One env file per target. The file wins over the shell for the names it defines.
- A login step writes its session under `.app-tester/state/`. Later entries reuse it; do not log in again.

## 3. Run

1. `{{RUNTIME}} .agents/skills/{{SKILL_NAME}}/scripts/setup.{{EXT}} --run-id <run> --target <name>` once. It starts a local target, probes readiness, then runs the target's setup steps.
2. For each selected id, in `map.json` order:
   - `{{RUNTIME}} .agents/skills/{{SKILL_NAME}}/scripts/<script> --run-id <run> --target <name>`
   - Record status, reason, evidence paths, and target.
   - Continue after `FAIL` unless the user asked to stop at the first failure.
3. Run use cases after their features, unless the use case needs a clean state.
4. Run `{{RUNTIME}} .agents/skills/{{SKILL_NAME}}/scripts/teardown.{{EXT}} --run-id <run> --target <name>` in a `finally` path, including after a failure.
5. Confirm every evidence path still exists after teardown.

`--allow-writes` goes on the entry script, not on setup. Use it only when the user asked for a write in the same message and the target is not production.

## 4. Report

| Target | Priority | ID | Status | Reason | Evidence |
|---|---|---|---|---|---|

Write `summary.md` and `summary.json` to `.app-tester/artifacts/<run>/`. Exit non-zero when any selected entry is `FAIL`.

`SKIP` and `BLOCKED` never count as a pass. Name the missing precondition in the report.

## 5. Rules

- Exercise the user path, not an internal setter or a test-only endpoint.
- Capture the action and the resulting state. A final screen alone does not prove the action.
- Verify the side effect: a row, a file, a message, a read-back through a second view.
- Stub only a boundary the production system already isolates.
- A dry-run must be observed, not trusted by name: check files, network, and git refs.
- A failed step is evidence. Keep its output and its artifacts.
- A product bug is a report. Do not edit product code, and do not weaken the step.
- Never print, copy, or echo a value from an env file. Report the variable name only.
- `teardown` runs the target's teardown steps before it stops a local process. Keep that order.

## 6. Isolation

- One run owns its target, port, and data directory. Refuse to drive an instance another run owns.
- `--fresh` clears only `.app-tester/` runtime state, never user data.
- Destructive steps require `--allow-destructive` and an explicit user request.
- A `remote` target is shared with other people. Read-only is the default; a write needs `--allow-writes` and an explicit request.
- Production is read-only. Never pass `--allow-writes` for it.
- Kill only recorded process groups, and only for a `local` target. Never kill by process name.
