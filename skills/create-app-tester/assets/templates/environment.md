# Environment

Detected at generation. Update this file when the app or the test environment changes.

This file is tracked. It holds names, paths, and commands. Never a value.

## Targets

| Name | Kind | URL | Writes | Env file | Required vars |
|---|---|---|---|---|---|
| `local` | local | `<url>` | `allowed` | - | - |
| `<name>` | remote | `<url>` | `read-only` | `.app-tester/env/<name>.env` | `APP_USERNAME`, `APP_PASSWORD` |

- `--target <name>` selects one. Default: `<name>`.
- One target per run. Never mix targets.
- `remote` means probe only: nothing is started and nothing is killed.
- Production is `read-only`.

## Environment files

One file per target. Gitignored. Mode `600`.

```sh
install -m 600 /dev/null .app-tester/env/<name>.env
```

Then fill it:

```sh
APP_USERNAME=<value>
APP_PASSWORD=<value>
```

- Format: `KEY=value` per line. `#` comments and blank lines are ignored. An optional `export` prefix is allowed. No interpolation, no multi-line values.
- The target file wins for the names it defines. The shell environment fills the rest. This stops an exported production password from driving a dev run.
- A name the target requires but the file does not define is `BLOCKED` at `doctor`.
- Never commit the file. Never paste a value into this markdown, a command line, or a chat.

## Variable names

| Name | Used by | Targets |
|---|---|---|
| `APP_USERNAME` | login setup, `feat-<slug>` | `<targets>` |
| `APP_PASSWORD` | login setup | `<targets>` |

## Setup steps

Run by `setup` after the ready probe, in order. One command per line. Timeout 120 seconds.

1. `<exact command>` - `<what it does and what it writes>`

## Teardown steps

Run by `teardown` before the process stop, in order. They run after a failed test too.

1. `<exact command>` - `<what it undoes>`

## Per-entry cleanup

`cleanup_steps` in `references/map.json` runs after that entry, pass or fail. Use it for records a single test creates.

## Rotation

1. Replace the value in the env file.
2. Run `doctor.<ext> --target <name>`.
3. Run the `P0` selection again.

## Run (local)

- Root: `<repo root>`
- Setup: `<exact command>`
- Ready: `<url or log line>`
- Teardown: `<exact command>`
- Ports: `<port>`
- Data: `<disposable path or database>`

## Secrets

- Never write a value here. Never pass one as an argument.
- Every loaded value is replaced with `***` in logs and evidence. Do not rely on it: keep values out of commands that print them.

## Isolation

- `<data dir, container, profile>`
- One run owns its port and state directory.
- Remote targets share state with other people. Writes need `--allow-writes` and an explicit request.
- Destructive steps: `<which ones need --allow-destructive>`

## Limits

- `<blocked surface, missing driver, external service>`

## Assumptions

- `<default used>` - `Source: assumed`
- `<fact read from code>` - `Source: code`
- `<answer from the invoking agent>` - `Source: answered`
