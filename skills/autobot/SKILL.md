---
name: autobot
description: Use only when the user explicitly invokes /autobot or @autobot. Runs one task through one driver bot. Never select from task size, keywords, or inferred intent.
---

# Autobot

One leader, one driver bot, one task. The leader is the session that invoked `/autobot`. It creates and owns the driver. The driver owns research, the plan and the implementation. The human approves twice: the plan, then the exact release.

Use this only on a harness that can create an independent agent and exchange messages with it. A subagent-only harness stops the run. There is no fallback.

Invoke as `/autobot [--template <path>] <task>`. These are skill arguments, not an installed CLI.

## Phase 0 — Select the template

Load exactly one file:

1. `--template <path>` when given: `.md` or `.mdc`, resolved from the invocation directory. Missing, unreadable, or wrong extension blocks; no fallback.
2. `~/.config/autobot.md` when present.
3. `./autobot.md` in the invocation directory when present.
4. None: stop and tell the human to run `/setup-autobot`.

Freeze the source and content for the run. Every bot in the run receives a faithful snapshot before work. A remote driver without the shared filesystem receives the snapshot, never a path it cannot read. Edits during the run do not change the plan.

Parse the required fields before any bot is created: name, one job, description, skills required, plan home, merge policy. A missing field stops the run. Report the template source in the first leader message.

## Phase 1 — Provision

Probe the harness in this order: create an agent, send to it, receive from it, halt it. A missing capability stops the run and names it.

Create the driver through the template's `created by` agent when that agent is named and reachable. Otherwise create it directly. Apply the template's model, workspace, section and skills. Notifications off. The driver reports to the leader, never to the human.

Brief it with:

- the task and its reference
- the repository absolute path when the driver's workspace is not the invocation directory
- the frozen template snapshot
- the instruction to load `implementation-plan`
- the plan home
- anti-jobs and authority boundaries
- the reporting contract

The brief also says: write the plan at once without being asked; present it to the leader; do not implement until the leader confirms human gate 1; do not merge, tag, publish or deploy until the leader confirms human gate 2 for one exact revision and target.

The leader equips the driver to finish alone: tools, scripts, access and permissions, as far as the harness allows. A gap it cannot close is either closed before gate 1 or recorded in the plan as a human handoff pack with best time, commands, expected output, done signal and rollback. A plan that leaves the driver unable to reach the definition of done is CHANGES.

Provisioning is complete when the driver acknowledges the brief, can load `implementation-plan`, and can message the leader. If the harness cannot install the skill, the driver receives an immutable snapshot; record that mode and disclose it at gate 1. If neither is possible, stop before planning. Gate 1 also discloses any capability that had to be arranged by hand.

## Phase 2 — Plan and human gate 1

The driver writes the plan with `implementation-plan` on its own initiative and presents it to the leader. It starts no implementation.

The leader verifies with `playbooks/verify-plan.md` and issues APPROVE or CHANGES with numbered reasons. CHANGES returns the plan to the driver. The leader resolves every open product, design and scope choice with the driver first. A plan with an open question is not approved.

When the template names consultations, the leader obtains them and records the outcome before deciding. The leader still issues the decision. This skill names no reviewer and implements no reviewer protocol.

On APPROVE, show the human the leader-approved plan. First line: `Leader-approved plan: approve, or name a change`. Then the decisions made, each overridable, and any blocker that needs human action. No options to pick from. Implementation starts only after the human approves.

A material scope or design change after approval returns to this phase with the same plan artifact.

## Phase 3 — Build and verify

The driver owns the development and verification loop, including the checks in the plan. It reports at milestones: milestone, revision, commands and results, deviations, blockers, recommended next action. The leader checks scope and evidence, then continues the same driver.

Routine checkpoints and fixes stay between leader and driver. No routine human prompts. Missing access or a hard gate stops the loop and names the exact unblock.

## Phase 4 — Release and human gate 2

The leader reviews the exact candidate revision and the exact target, with evidence. Missing evidence is not a pass. Fixes go back to the driver. For work with no deploy step, the merge, tag or publish step is the release target.

On leader approval, ask the human to approve that exact revision and target, with results, risks, postchecks and rollback authority visible. A changed revision or target voids the approval and needs a fresh review and a fresh gate 2.

The driver releases only the approved revision to the approved target and runs the bounded postchecks. A successful rollback is recovery, not completion.

## Phase 5 — Close

The driver reports completion against the definition of done, item by item with evidence. The leader accepts or returns it.

On acceptance, retire the driver. Delete when the harness exposes a delete or archive action. Otherwise retitle it `PIC — done, safe to delete` and report its name and ID. Never claim a delete without a confirmed result.

Report to the human: outcome, exact revision and target, checks, remaining risks, residual work. The human acknowledges; that closes the run.

## Authority

- The leader owns the driver: creation, placement, model from the template, hold, replacement, retirement.
- The leader makes every product, design and scope decision with the driver, following template policy.
- The leader never writes the implementation.
- The human approves the plan and the exact release. The human is never asked to choose between options.
- Two writers never run. To hold, fence, replace or retire a driver, read `playbooks/recover-pic.md` first.

## Playbooks

Read the playbook before the gate it governs. An unreadable playbook blocks that gate.

- `playbooks/verify-plan.md` — the leader's plan gate.
- `playbooks/recover-pic.md` — hold, fence, replace and retire.

Inspired by Lauren Tan's pstack; portable instructions, no runtime required.
