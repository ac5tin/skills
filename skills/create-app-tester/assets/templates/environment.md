# Environment

Detected at generation. Update this file when the app or the test environment changes.

## Run

- Root: `<repo root>`
- Setup: `<exact command>`
- Ready: `<url or log line>`
- Teardown: `<exact command>`
- Ports: `<port>`
- Data: `<disposable path or database>`

## Credentials

- `<ENV_VAR_NAME>` - `<what it is for>`
- Never write a value here. A missing variable makes the affected entry `BLOCKED`.

## Isolation

- `<data dir, container, profile>`
- One run owns its port and state directory.
- Destructive steps: `<which ones need --allow-destructive>`

## Limits

- `<blocked surface, missing driver, external service>`

## Assumptions

- `<default used>` - `Source: assumed`
- `<fact read from code>` - `Source: code`
- `<answer from the invoking agent>` - `Source: answered`
