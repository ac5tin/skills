# Map contract

The map is the maintained source of truth. Every file below is written once at creation and updated by the maintenance playbook.

## 1. Ids

- Feature: `feat-<kebab-slug>`, unique in the skill.
- Use case: `uc-<kebab-slug>`, unique in the skill.
- Script: `test-<feature-slug>.py`, `test-uc-<usecase-slug>.py`.
- File: `references/features/<feature-slug>.md`, `references/usecases/<usecase-slug>.md`.

No two entries share an id or a file. Renaming one changes its id; the maintenance playbook records the old id in the report.

### 1.1 Priority

Every feature and every use case carries one priority: `P0`, `P1`, `P2`, or `P3`.

| Level | Rule |
|---|---|
| `P0` | The app is unusable, or data or money is lost, if this breaks. Auth, the primary create/read path, payment, the README quickstart journey. |
| `P1` | Most users need it weekly. Main CRUD variants, search, settings that shape the main flow. |
| `P2` | Secondary behavior. Export, archive, bulk actions, rare states. |
| `P3` | Edge, cosmetic, admin-only, or deprecated. |

Caps and defaults:

- At least one `P0` feature and one `P0` use case.
- No more than 30 percent of entries at `P0`.
- A use case is at least as critical as its most critical feature. Raise it when the journey is the product's main path.
- Unsure: `P1`.

Storage:

- `map.json`: `"priority": "P0"` on every entry.
- Entry file: `**Priority:** P0 - <one-line reason>` directly after the H1 paragraph.
- Index: a `Priority` column.
- The three must agree. `validate.py` fails a mismatch.

Selection: `p0` (or `basic`) runs every `P0` entry. `p0-p1` runs a range. `all` ignores priority.

### 1.2 Targets

A target is one place the app runs. `map.json` holds one entry per target.

| Field | Meaning |
|---|---|
| `kind` | `local` starts a process. `remote` is only probed. Required. |
| `run` | `local` only: `setup`, `ready`, `teardown`, `health`. |
| `base_url` | `remote` required. Optional on `local` when the app lives under a path; otherwise the ready URL's origin is used. |
| `ready` | Probe after setup. `local` reads it from `run`. `remote` uses this. |
| `health` | Checks for `doctor`. |
| `version` | Optional probe. `{"url": "...", "field": "commit"}`. Its value goes into evidence. |
| `writes` | `allowed` or `read-only`. `remote` defaults to `read-only`. |
| `auth` | Env var names. Never values. Alias for `required_env`. |
| `env_file` | Path from the repo root. Default `.app-tester/env/<target>.env`. Must be gitignored and outside the skill directory. |
| `required_env` | Names that must have a value. `doctor` fails when one is missing. |
| `setup_steps` | Shell commands, run by `setup` after the ready probe. |
| `teardown_steps` | Shell commands, run by `teardown` before the stop. |
| `default_target` | Top-level. Must name one of the keys. |

Resolution order: `--target`, `APP_TEST_TARGET`, the target recorded in `state.json` for the run id, `default_target`, `local`.

An old map with no `targets` block is read as one `local` target built from the top-level `run`. It stays valid; `validate` prints a warning.

Entry fields:

- `targets`: list of target names. Absent means every target. An entry skipped on the active target reports `SKIP`, never `PASS`.
- `mutates`: `true` when the entry writes data. A mutating entry on a `read-only` target exits `BLOCKED` unless the run passes `--allow-writes`.
- `requires_env`: names this entry needs on top of the target's `required_env`. A missing one raises `BLOCKED` in the entry script.
- `cleanup_steps`: shell commands run after the entry, pass or fail.

A restricted entry needs a `## Targets` H2 that names its targets and what differs: auth, seed data, or a step only one target has.

### 1.3 Environment files and steps

- One env file per target. Gitignored. Mode `600`. Default `.app-tester/env/<target>.env`.
- Format: `KEY=value`, `#` comments, blank lines, optional `export`, optional quotes. No interpolation, no multi-line values.
- Load order: the target file over the process environment. The file wins for the names it defines, so an exported production password cannot drive a dev run.
- `doctor` reports the file, the missing names, and bad permission bits. A missing required name, or a mode bit for group or other, fails the check.
- `setup_steps` run after the ready probe. A non-zero exit or a 120-second timeout is `BLOCKED`; a local process that `setup` started is stopped.
- `teardown_steps` run before the process stop, for both kinds, and after a failed entry. A step failure is reported and does not skip the stop.
- `cleanup_steps` run after one entry, pass or fail. A failure prints `CLEANUP FAILED` and does not change the entry status.
- Every value loaded from the file is replaced with `***` in step logs, evidence, and an error tail.
- The tester never creates, edits, or deletes an env file.

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

Run: `{{RUNTIME}} .agents/skills/<skill>/scripts/test-create-note.{{EXT}} --run-id "$RUN_ID"`
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

Tokens: `{{APP}}`, `{{SKILL_NAME}}`, `{{SURFACE}}`, `{{DATE}}`, `{{RUNTIME}}`, `{{EXT}}`, `{{FEATURE_ID}}`, `{{FEATURE_NAME}}`, `{{FEATURE_FILE}}`, `{{UC_ID}}`, `{{UC_NAME}}`, `{{UC_FILE}}`, `{{SCRIPT}}`, `{{UC_SCRIPT}}`, `{{SUMMARY}}`, `{{PRIORITY}}`, `{{PRIORITY_REASON}}`, `{{TARGETS_SECTION}}`, `{{ENVIRONMENT_SECTION}}`. Every token must be replaced before `validate.py` runs. `{{SCRIPT}}` and `{{UC_SCRIPT}}` include the extension. `{{TARGETS_SECTION}}` and `{{ENVIRONMENT_SECTION}}` are empty unless the entry is restricted or needs extra variables.

## 5. `map.json`

```json
{
  "app": "foobar",
  "skill": "foobar-app-tester",
  "runtime": "node",
  "generated_at": "2026-11-10T00:00:00Z",
  "source_commit": "abc123",
  "assets_digest": "sha256",
  "stack": {"language": "python", "framework": "none", "package_manager": "pip"},
  "surfaces": [{"kind": "http", "entry_points": ["GET /notes"]}],
  "default_target": "local",
  "targets": {
    "local": {
      "kind": "local",
      "writes": "allowed",
      "run": {
        "setup": "python3 app.py --port 8099",
        "ready": {"url": "http://127.0.0.1:8099/health", "timeout": 30},
        "teardown": "",
        "health": [{"kind": "http", "url": "http://127.0.0.1:8099/health", "expect": 200}]
      }
    },
    "dev": {
      "kind": "remote",
      "base_url": "https://dev.example.com",
      "writes": "read-only",
      "health": [{"kind": "http", "url": "https://dev.example.com/health", "expect": 200}],
      "version": {"url": "https://dev.example.com/version", "field": "commit"},
      "env_file": ".app-tester/env/dev.env",
      "required_env": ["APP_USERNAME", "APP_PASSWORD"],
      "setup_steps": ["python3 .agents/skills/<skill>/scripts/setup-dev.py"],
      "teardown_steps": ["python3 .agents/skills/<skill>/scripts/teardown-dev.py"]
    }
  },
  "evidence_root": ".app-tester/artifacts",
  "features": [
    {"id": "feat-x", "priority": "P0", "file": "references/features/x.md", "script": "scripts/test-x.py", "mutates": true}
  ],
  "usecases": [
    {"id": "uc-y", "priority": "P0", "file": "references/usecases/y.md", "script": "scripts/test-uc-y.py", "features": ["feat-x"]}
  ],
  "limits": ["no browser driver"]
}
```

Field rules:

- `runtime`: `node` (Node 18+ and `.mjs`) or `python3` (`.py`). All scripts use that runtime and extension.
- `source_commit`: `git rev-parse HEAD` at generation, or `null`.
- `assets_digest`: output of `<runtime> <create-app-tester>/scripts/digest.<ext> <create-app-tester>/assets`.
- `run.setup`: shell command, run from the repo root. It may start a server; the process group is recorded. `local` only.
- `run.ready`: URL to poll, or `{"cmd": "..."}`. Omit for a short-lived CLI.
- `run.health`: list of checks for `doctor`: `http`, `cmd`, `port`, `file`.
- `targets.<name>.base_url`: the only address a `remote` target drives.
- `limits`: every blocked surface or missing driver, in plain words.

## 6. Scripts

All scripts run as `<runtime> <path>`: `node` for `.mjs`, `python3` for `.py`. Node needs version 18 or later for built-in `fetch`. Exit codes: `0` pass, `1` fail, `2` blocked. A script prints one status line and writes `result.json` plus evidence.

| Script | Arguments | Behavior |
|---|---|---|
| `doctor.<ext>` | `--target` | Read-only. Runs the active target's `health`, `version`, and env check. Prints JSON. Exit 2 when unhealthy or a required variable is missing. |
| `setup.<ext>` | `--run-id`, `--target`, `--fresh` | Loads the target env file. `local`: runs `run.setup`, waits for `run.ready`, records the process group. `remote`: starts nothing, probes `ready`. Then runs `setup_steps`. Prints `READY <url> <run-id> target=<name>`. |
| `teardown.<ext>` | `--run-id`, `--target` | Runs `teardown_steps`, then stops the recorded process group for a `local` target. Never starts a process. Keeps artifacts. Idempotent. |
| `test-<slug>.<ext>` | `--run-id`, `--target`, `--allow-writes`, `--json` | One feature or use case. Checks `requires_env`, runs, then `cleanup_steps`. Prints `PASS|FAIL|BLOCKED|SKIP <id> <reason>`. |
| `validate.<ext>` | none | Checks this contract, including that `env_file` is gitignored and outside the skill. Prints each failure. |
| `lib.<ext>` | none | Shared helpers: paths, HTTP, shell, assertions, evidence, state, targets, env, steps. |

Rules:

- Idempotent and safe to re-run.
- No secrets in arguments or output.
- One target per run. A `remote` target is never started or killed.
- Continue after one failure only at the playbook level; each script owns one entry.
- A missing precondition raises `Blocked`, never a fake pass.
- A missing required env name raises `Blocked` with the name and the file path.
- A loaded secret value is redacted in logs, evidence, and error tails.
- An entry not mapped to the active target raises `Skipped`.

## 7. Evidence

- Root: `.app-tester/artifacts/<run-id>/<entry-id>/`.
- Capture the action and the result: command, stdout, stderr, exit code; HTTP status and body; screenshot plus ARIA snapshot for UI.
- Read-back through a second user-facing view for any mutation.
- Every `result.json` records `target`, `base_url`, and the target's `version` when it declares one.
- Step logs live at `.app-tester/logs/<run>/`. Secret values are redacted before write.
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

## 9. Repo hygiene

All tester output goes under `.app-tester/`. Never commit artifacts, reports, or state.

The generator maintains one block in the repo `.gitignore`:

```
# app-tester: begin (managed)
.app-tester/
__pycache__/
*.pyc
node_modules/
# app-tester: end (managed)
```

Base patterns: `.app-tester/`, `__pycache__/`, `*.pyc`.

Stack patterns are added only when the manifest exists at the repo root:

| Manifest | Added |
|---|---|
| `package.json` | `node_modules/`, `.next/`, `coverage/` |
| `pyproject.toml`, `requirements.txt` | `.venv/`, `.pytest_cache/` |
| `Cargo.toml` | `target/` |
| `pom.xml`, `build.gradle`, `build.gradle.kts` | `target/` or `build/`, `.gradle/` |
| `Gemfile` | `.bundle/` |
| `composer.json` | `vendor/` |
| `pubspec.yaml` | `.dart_tool/`, `build/` |

Conservative by design: dependency and cache directories only. Build outputs that projects sometimes commit, such as `dist/`, are left to the app's own rules.

Rules:

- Add only missing patterns. Keep every line outside the block unchanged.
- Rewrite the block in place on update or recreate. Never add a second block.
- Patterns already present outside the block stay there; do not duplicate them.
- Stacks not listed above belong to the app's own ignore rules, not this block.
- Not a git repo: skip and report.
