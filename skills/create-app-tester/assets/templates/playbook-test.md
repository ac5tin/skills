# Test playbook

Drive the real app with its own harness. Report one status per selected entry, with evidence.

## 1. Select

- Explicit ids: use them.
- `all`: every id in `references/map.json`.
- Nothing: print both indexes with their ids and ask. Do not guess.

An id missing from `map.json` is an error, not a new test.

## 2. Preflight

1. Run `python3 .agents/skills/{{SKILL_NAME}}/scripts/doctor.py`.
2. Healthy: continue. Unhealthy: repair the state, or report `BLOCKED` with the failing check and the exact command. Never drive an instance that failed the doctor.

## 3. Run

1. `python3 .agents/skills/{{SKILL_NAME}}/scripts/setup.py --run-id <run>` once.
2. For each selected id, in `map.json` order:
   - `python3 .agents/skills/{{SKILL_NAME}}/scripts/<script> --run-id <run>`
   - Record status, reason, and evidence paths.
   - Continue after `FAIL` unless the user asked to stop at the first failure.
3. Run use cases after their features, unless the use case needs a clean state.
4. Run `teardown.py --run-id <run>` in a `finally` path, including after a failure.
5. Confirm every evidence path still exists after teardown.

## 4. Report

| ID | Status | Reason | Evidence |
|---|---|---|---|

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

## 6. Isolation

- One run owns its port and data directory. Refuse to drive an instance another run owns.
- `--fresh` clears only `.app-tester/` runtime state, never user data.
- Destructive steps require `--allow-destructive` and an explicit user request.
- Kill only recorded process groups. Never kill by process name.
