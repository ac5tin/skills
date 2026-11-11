# {{UC_NAME}}

{{SUMMARY}}

**Priority:** {{PRIORITY}} - {{PRIORITY_REASON}}

{{TARGETS_SECTION}}

## Features involved

- [<feature name>](../features/<feature-file>.md)

## Preconditions

- <state, data, auth>
- `doctor.{{EXT}}` passes.

## How to test and verify

### Step 1 - <action>

Run: `{{RUNTIME}} .agents/skills/{{SKILL_NAME}}/scripts/{{UC_SCRIPT}} --run-id "$RUN_ID"`
Expect: <exact observable result>

## Evidence

- `.app-tester/artifacts/<run-id>/{{UC_ID}}/result.json`
- <specific artifact>

## Code anchors

- `<path>#<symbol>`

## Gotchas

- <trap that can waste or invalidate a run>
