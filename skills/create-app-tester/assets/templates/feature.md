# {{FEATURE_NAME}}

{{SUMMARY}}

## Sub-features

- `{{FEATURE_ID}}-1` - <behavior in one line>

## Entry points

- <user path: button, route, command, API operation>

## How to test and verify

Preconditions:

- <state, data, auth>
- `doctor.py` passes.

### Step 1 - <action>

Run: `python3 .agents/skills/{{SKILL_NAME}}/scripts/{{SCRIPT}} --run-id "$RUN_ID"`
Expect: <exact observable result>

## Evidence

- `.app-tester/artifacts/<run-id>/{{FEATURE_ID}}/result.json`
- <specific artifact: response body, screenshot, transcript>

## Code anchors

- `<path>#<symbol>`

## Gotchas

- <trap that can waste or invalidate a run>
