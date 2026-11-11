# Environment

Detected at generation. Update this file when the app or the test environment changes.

## Targets

| Name | Kind | URL | Writes | Auth env vars |
|---|---|---|---|---|
| `local` | local | `<url>` | `allowed` | - |
| `<name>` | remote | `<url>` | `read-only` | `<ENV_VAR_NAME>` |

- `--target <name>` selects one. Default: `<name>`.
- One target per run. Never mix targets.
- `remote` means probe only: nothing is started and nothing is killed.
- Production is `read-only`.

## Run (local)

- Root: `<repo root>`
- Setup: `<exact command>`
- Ready: `<url or log line>`
- Teardown: `<exact command>`
- Ports: `<port>`
- Data: `<disposable path or database>`

## Credentials

- `<ENV_VAR_NAME>` - `<what it is for>`, target `<name>`
- Never write a value here. A missing variable makes the affected entry `BLOCKED`.

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
