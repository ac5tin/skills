---
name: plan-verify
description: Turn an approved implementation plan into executable verification scripts and the order to run them. Use when a PIC driver starts the verification phase, or when a plan's checks need to become runnable.
---

# Plan verify

Input: the approved implementation plan and the current code. Output: executable verification scripts and the order to run them.

Use this at the start of Verification, before the first check runs.

## 1. Extract the checks

Every done criterion in the plan maps to at least one check. List each with its expected result, inputs, starting state and evidence location. A criterion without a check is a blocker: return to Planning.

## 2. Interview the repo and the driver

Answer from the code, not from memory. Ask the driver or the leader only what the code cannot show:

- What starts the system: command, port, environment, seed data, auth.
- What proves each check: the exact command or observation.
- What is the starting state: clean checkout, built image, running stack.
- What is safe to run twice: destructive steps, data, credentials.
- How evidence is captured: exit code, output, log, screenshot, CI run URL.

Record every answer in the verification README. An assumption is a risk, not a fact.

## 3. Write the scripts

Write to the path the plan names. If it names none, use `verification/<task-slug>/` in the workspace and record the path in the plan.

- One script per check, or per group that shares a setup.
- `NN-<check>.sh` in run order, plus `run-all.sh`.
- Each script carries: exact command, expected output, pass or fail bar, evidence path, cleanup.
- Deterministic, non-destructive, safe to re-run. A secret comes from the environment; never hardcode it.
- A check that cannot be scripted, such as a CI pipeline or post-deploy logs, gets a script that runs the command and records the result, or a named manual step with the exact command and observation.
- No script proves nothing outside the plan. No orphan script.

## 4. Prove the scripts

Run `run-all.sh` once against the current state. Fix what fails. A script never run is a draft, not a deliverable. If the state cannot run yet because the code is not written, mark the check `PENDING` and run it during Verification.

## 5. Output

`README.md` with: check, script, what it proves, run order, expected result, evidence path. Update the plan with the script location and the run order.
