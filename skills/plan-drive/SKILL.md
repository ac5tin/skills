---
name: plan-drive
description: Turn an approved implementation plan into an ordered, evidence-backed todo list and drive it to completion. Use when a PIC driver starts the driving phase, or when a running driver must decide the next step.
---

# Plan drive

Input: the approved implementation plan. Output: one ordered todo list the driver executes.

Use this at the start of Driving. The plan says what; this skill fixes the order, the evidence and the stop rule.

## 1. Read the plan

Extract every goal, done criterion, check, dependency, gate and handoff. A goal without a done criterion is a blocker: return to Planning. Do not invent work outside the plan.

## 2. Write the todo list

Write `drive-todos.md` in the driver workspace, or at the path the config names. One row per step:

- ID and phase
- Action: one bounded change or command
- Command or observation
- Expected result and done signal
- Evidence: where the output goes
- Depends on
- May wait: yes or no

Order by dependency. Put every independent step before a wait. The first step must be runnable now.

## 3. Statuses

`TODO`, `DOING`, `DONE`, `WAIT`, `BLOCKED`. Update the file after every step.

- `DONE` needs evidence. A claim is not evidence.
- `WAIT` needs the wait pack from section 4.
- `BLOCKED` is for a step the plan cannot resolve. It returns to the leader.

## 4. Drive without idling

- Take the next `TODO` whose dependencies are `DONE`.
- On a wait, mark `WAIT` with: what you wait for, who or what acts, the resume trigger, the next step after resume, and the evidence you need. Then continue any other independent step.
- End the turn only when no independent step remains. The final message states: why you stop, what you wait for, the next action item, and how to resume.
- Never end a turn while a runnable step exists. "I will wait" is not allowed without a named wait.
- Report each `DONE` step with its evidence. No silent completion.

## 5. Keep the plan honest

If a step reveals the plan is wrong, stop and return to Planning. Do not edit the plan without the leader. A material change reopens both gates.
