# Discovery

Answer from the code first. Ask only what the code cannot show.

## 1. Repo root and app name

Repo root: `git rev-parse --show-toplevel`. No git: the working directory.

App name, first match wins:

| File | Field |
|---|---|
| `package.json` | `name` |
| `pyproject.toml` | `project.name`, else `tool.poetry.name` |
| `Cargo.toml` | `package.name` |
| `go.mod` | last segment of the `module` line |
| `composer.json` | `name` |
| `pubspec.yaml` | `name` |
| none | directory name |

Normalize: strip an npm scope (`@acme/foo` becomes `foo`), lowercase, replace `_` and `.` with `-`, collapse `--`, trim `-`. Keep meaningful suffixes: `foo-web` becomes `foo-web-app-tester`.

Skill name: `<app>-app-tester`. Must match `^[a-z0-9]+(-[a-z0-9]+)*$`, 64 chars maximum, no `--`. Truncate the app part to 52 chars, less when a numeric suffix is added.

### 1.1 Harness runtime

Pick the runtime from the repo, not from preference:

| Signal | Runtime | Extension |
|---|---|---|
| `package.json` and `node --version` 18 or later | `node` | `.mjs` |
| `pyproject.toml` or `requirements.txt` | `python3` | `.py` |
| Both | The primary surface's language; ask if unclear | |
| Neither | `node` when present, else `python3` | |

Neither runtime available: stop and say which one to install. Record the choice as `runtime` in `map.json`.

Monorepo: several manifests at depth 1-2 with different names means ask which package is the app. Run discovery from that directory. Write the skill at the repo root unless the user asks for a nested skill.

## 2. Surfaces

| Kind | Read | Entry point signals |
|---|---|---|
| Web | framework config, `src/routes`, `app/`, `pages/`, templates | routes, nav labels, forms, buttons |
| HTTP API | OpenAPI, routers, controllers, `curl` examples | method plus path, auth header |
| CLI | `bin/`, `cmd/`, `__main__`, console scripts, Makefile | subcommands, flags, exit codes |
| Desktop | Electron/Tauri config, main process | windows, menus, IPC |
| Mobile | `android/`, `ios/`, app config | screens, deep links |
| Library | exported package entry, public API | public functions and classes |

A repo can have several surfaces. Pick the primary one: most entry points, or the one the README shows first. Record the rest as secondary.

## 3. Run and drive

Prefer the repo's own documented command: `package.json` scripts, Makefile, justfile, README quickstart, compose file.

Record:

- Setup command and working directory.
- Readiness signal: health URL, log line, prompt, port.
- Environment variables, with defaults.
- Seed data and migrations.
- Auth: scheme, test account source, env var names only.
- Teardown: stop command, containers, temp dirs.

Drive with the harness that already exists, in this order:

1. Playwright, Cypress, pytest, Go test, or another suite in the repo.
2. Plain HTTP for services.
3. Subprocess plus PTY or tmux for CLI and TUI.
4. A browser driver only when it is already installed. Never install one during a run.

No driver for the primary surface: record it as a limit. Affected features are `BLOCKED`, not faked.

## 4. Safe environment

- Disposable data directory, database, or container.
- Never production, never customer data, never a shared instance.
- Unique port per run when the app supports it.
- Credentials from env vars named in `environment.md`.
- Destructive flows off by default; require `--allow-destructive`.
- Record how to stop every process the run starts.

## 5. Question bank

Batch these in one message. Every question has a default, so a silent agent still gets a tester.

| # | Question | Default |
|---|---|---|
| 1 | Which surface is primary, and which are secondary? | The surface with the most entry points |
| 2 | What is the safe test environment? | Local process, disposable state |
| 3 | Which env vars hold test credentials? | None; auth features become `BLOCKED` |
| 4 | Which external services may be stubbed? | None; live-call steps are skipped and reported |
| 5 | Which features are out of scope? | Payments, email, anything irreversible |
| 6 | What observable state proves a journey passed? | The app's success state plus a read-back |
| 7 | Which destructive flows need explicit opt-in? | All deletes and sends |
| 8 | Wall-clock budget per run? | 10 minutes |

Ask nothing the code answers. One interview, not a conversation.

## 6. Record

Write `references/environment.md` with these sections:

- Run: commands, ports, readiness.
- Credentials: env var names, never values.
- Isolation: data dirs, containers, ports, teardown.
- Limits: blocked surfaces, missing drivers, external services.
- Assumptions: every default used, marked `Source: assumed`.

Every later phase reads this file instead of asking again.
