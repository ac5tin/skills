# Map contract

The map is the maintained source of truth. Every file below is written once at creation and updated by the maintenance playbook.

## 1. Ids

- Feature: `feat-<kebab-slug>`, unique in the skill.
- Use case: `uc-<kebab-slug>`, unique in the skill.
- Script: `test-<feature-slug>.py`, `test-uc-<usecase-slug>.py`.
- File: `references/features/<feature-slug>.md`, `references/usecases/<usecase-slug>.md`.

No two entries share an id or a file. Renaming one changes its id; the maintenance playbook records the old id in the report.

## 2. Feature file

H1 plus one paragraph of user-visible behavior. Then exactly these H2s, in order:

1. `Sub-features` - short ids and one line each.
2. `Entry points` - every way a user reaches it.
3. `How to test and verify` - preconditions, then numbered steps.
4. `Evidence` - artifact paths the run must produce.
5. `Code anchors` - `path#symbol`, one per entry point.
6. `Gotchas` - traps that invalidate a run.

Step shape:

```markdown
### Step 2 - Create the note

Run: `python3 .agents/skills/<skill>/scripts/test-create-note.py --run-id "$RUN_ID"`
Expect: HTTP 201 and `notes.json` contains the title `Release checklist`.
```

Every step has one command and one observable result. No step says "verify it works".

## 3. Use-case file

H1 plus one paragraph of the journey. Then exactly these H2s, in order:

1. `Features involved` - links to feature files.
2. `Preconditions` - state, data, auth.
3. `How to test and verify` - numbered steps, same shape as a feature.
4. `Evidence` - artifacts.
5. `Code anchors` - entry points used by the journey.
6. `Gotchas`.

A use case crosses two or more features and ends in a state a user can see.

## 4. Indexes

`references/features/README.md` and `references/usecases/README.md` each hold:

- Baseline preconditions and the evidence root.
- One table row per entry: id, one-line behavior, relative link.
- A rule: an entry missing from the table is invisible to a run.

`validate.py` checks that every map file appears in its index.

Tokens: `{{APP}}`, `{{SKILL_NAME}}`, `{{SURFACE}}`, `{{DATE}}`, `{{FEATURE_ID}}`, `{{FEATURE_NAME}}`, `{{FEATURE_FILE}}`, `{{UC_ID}}`, `{{UC_NAME}}`, `{{UC_FILE}}`, `{{SCRIPT}}`, `{{UC_SCRIPT}}`, `{{SUMMARY}}`. Every token must be replaced before `validate.py` runs.

## 5. `map.json`

```json
{
  "app": "foobar",
  "skill": "foobar-app-tester",
  "generated_at": "2026-11-10T00:00:00Z",
  "source_commit": "abc123",
  "assets_digest": "sha256",
  "stack": {"language": "python", "framework": "none", "package_manager": "pip"},
  "surfaces": [{"kind": "http", "entry_points": ["GET /notes"]}],
  "run": {
    "setup": "python3 app.py --port 8099",
    "ready": {"url": "http://127.0.0.1:8099/health", "timeout": 30},
    "teardown": "",
    "health": [{"kind": "http", "url": "http://127.0.0.1:8099/health", "expect": 200}]
  },
  "evidence_root": ".app-tester/artifacts",
  "features": [
    {"id": "feat-x", "file": "references/features/x.md", "script": "scripts/test-x.py"}
  ],
  "usecases": [
    {"id": "uc-y", "file": "references/usecases/y.md", "script": "scripts/test-uc-y.py", "features": ["feat-x"]}
  ],
  "limits": ["no browser driver"]
}
```

Field rules:

- `source_commit`: `git rev-parse HEAD` at generation, or `null`.
- `assets_digest`: output of `python3 <create-app-tester>/scripts/digest.py <create-app-tester>/assets`.
- `run.setup`: shell command, run from the repo root. It may start a server; the process group is recorded.
- `run.ready`: URL to poll, or `{"cmd": "..."}`. Omit for a short-lived CLI.
- `run.health`: list of checks for `doctor.py`: `http`, `cmd`, `port`, `file`.
- `limits`: every blocked surface or missing driver, in plain words.

## 6. Scripts

All scripts run as `python3 <path>`. Exit codes: `0` pass, `1` fail, `2` blocked. A script prints one status line and writes `result.json` plus evidence.

| Script | Arguments | Behavior |
|---|---|---|
| `doctor.py` | none | Read-only. Runs `run.health`. Prints JSON. Exit 2 when unhealthy. |
| `setup.py` | `--run-id`, `--fresh` | Runs `run.setup`, waits for `run.ready`, records the process group in `.app-tester/state.json`. Prints `READY <url> <run-id>`. |
| `teardown.py` | `--run-id` | Stops the recorded process group and runs `run.teardown`. Keeps artifacts. Idempotent. |
| `test-<slug>.py` | `--run-id`, `--json` | One feature or use case. Prints `PASS|FAIL|BLOCKED <id> <reason>`. |
| `validate.py` | none | Checks this contract. Prints each failure. |

Rules:

- Idempotent and safe to re-run.
- No secrets in arguments or output.
- Continue after one failure only at the playbook level; each script owns one entry.
- A missing precondition raises `Blocked`, never a fake pass.

## 7. Evidence

- Root: `.app-tester/artifacts/<run-id>/<entry-id>/`.
- Capture the action and the result: command, stdout, stderr, exit code; HTTP status and body; screenshot plus ARIA snapshot for UI.
- Read-back through a second user-facing view for any mutation.
- Evidence survives every teardown. Never clean the artifacts directory.
- Record the entry id and entry point in every artifact name or header.

## 8. Failure semantics

| Status | Meaning |
|---|---|
| `PASS` | Every step matched its expected result, and evidence exists. |
| `FAIL` | The app returned a different observable result. Product bug or wrong expectation; report both. |
| `BLOCKED` | The run could not start: missing driver, credential, service, or state. Name the exact missing thing. |
| `SKIP` | Out of scope or destructive without opt-in. Never counts as a pass. |

A run exits non-zero when any selected entry is `FAIL`. `SKIP` and `BLOCKED` are reported by name, never hidden.
