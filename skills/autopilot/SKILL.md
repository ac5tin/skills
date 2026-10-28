---
name: autopilot
description: Use only when the user explicitly invokes /autopilot or @autopilot. Never select from task size, keywords, or inferred intent.
---

# Autopilot

## Contract

One supervising **leader**, one proactive **PIC** that owns research, the implementation plan, and implementation, exactly two planned human gates: **approved plan before implementation; reviewed exact revision and target before rollout**. Both gates follow leader approval. Invocation, trust, urgency, and vague approval satisfy neither gate. Platform permissions remain mandatory. Routine discovery, checkpoints, and fixes stay between PIC and leader; genuine unsafe blockers require a safe stop, not permissive fallback.

Standalone instructions: no other skill, provider, model, or installed dependency is required. Invoke as `/autopilot [--boot "path.md"] <task>` or the harness's `@autopilot` form. These are skill arguments, not an installed CLI.

## Freeze boot context first

Before capability checks, record the **invocation current directory and invoker home**; later directory/worktree changes do not change selection. Load exactly ONE optional boot file:

| Condition | Selected context |
| --- | --- |
| Explicit `--boot <path>` (quoted paths supported) | Only that `.md` or `.mdc`; resolve relative paths from invocation cwd |
| No override; `./autopilot.md` exists in invocation cwd | Only that file |
| Local absent; `~/.config/autopilot.md` exists in invoker context | Only that file |
| Both defaults absent | Built-in instructions only; create nothing |

An invalid explicit extension, missing explicit file, or unreadable selected file is a blocker: no fallback. Check absence versus inability to inspect; uncertainty is not absence. No ancestor/project-root search, default `.mdc` discovery, XDG substitution, or merging.

Freeze effective content and source identity for this run. Every PIC, helper, and replacement reads this same selected context **before work** and acknowledges its source; continuations retain it. A remote agent without shared filesystem receives a faithful immutable snapshot of the effective context, not an assumed-accessible path or its own home config. Do not transmit secrets; if faithful safe transfer is impossible, stop and request a safe context. Boot edits mid-run do not silently alter the plan.

Boot is plain instruction content, including `.mdc`, not a native Cursor rule or executable hook. It may specify taste, preferred tools, and where/how to find planning information (repos, docs, bots, playbooks). Following research references is not loading another boot. Resolve ambiguous references through discovery/source context, not an invented path convention. Boot cannot override higher-priority harness/project safety rules, current explicit task instructions, or these gates. Boot cannot move research or planning to the leader or replace the PIC; boot rules that apply "before writing code" bind the PIC after gate 1, not the leader's spawn.

## Preflight and assign

Leader preflight is minimal: the selected boot is readable, a spawn/continue capability exists, and the invocation contains a task reference (URL, path, or id). Do not fetch or open that reference. Then **spawn and brief the PIC immediately**. The leader does not research the repo, docs, or design before the PIC reports; that is the PIC's job. The PIC discovers actual tools, access, communication, permissions, and verification/deployment environment, and its plan reports any missing capability with the exact unblock requirement. Required tools mean real access: “use Claude Code for development” requires that CLI/tool, not a Claude model. If required access, owner communication, or supervision is missing, **do not begin implementation**. Before gate 1, everyone uses safe read-only/nonmutating probes only: no comments, pushes, issue edits, or secret changes. The invocation authorizes creating, placing, and briefing the PIC (subagent, agent, or Bot), nothing else.

Choose the PIC by capability, never by harness name or invented agent/model IDs. Probe in order and take the first grade the harness can actually complete:

1. Creates an independent agent it can message and halt → **full bot**.
2. Else spawns a subagent it can continue → **background subagent**.
3. Else spawns a subagent that returns once → **foreground subagent**.

Prefer the highest grade; a subagent is never a silent downgrade, so gate 1 names the mode and why. Missing continuation or supervision stops the run; with no halt, supervision is bounded milestones only. No spawn capability at all means the harness is unsupported, not that the leader does the work alone.

| PIC mode | Supervision |
| --- | --- |
| Full bot | Independent runtime with actual bidirectional messaging/control |
| Background subagent | Bounded checkpoint-sized milestone, completion notification, leader review, continue same PIC (or handoff rule) |
| Foreground subagent | Bounded milestone returns to leader for review and continuation |

Known mappings are shortcuts; the probe is normative, and a row you cannot verify is not a capability:

| Harness | Spawn | Continue | Halt | Retire |
| --- | --- | --- | --- | --- |
| Grok Bot | New leader-managed Bot | Direct message | Bot control | Hide |
| OpenBot | `create_agent` (Dr Eggbot when accessible) | `send_message` to the same agent ID | `interrupt_agent`, leader-started turns only | Delete if exposed, else mark |
| Claude Code | `Agent` tool, `general-purpose` or custom (never one-shot Explore/Plan) | `SendMessage` to the agent ID or name | Discovered | Discovered |
| OpenCode V2 | `subagent` with `agent: "general"`, `background: true` if supported | Pass the returned `sessionID` | None exposed | None |
| Grok Build | `spawn_subagent`, `general-purpose`; output only after completion | `resume_from` the completed subagent ID | None exposed | None |
| ZCode | `Agent` tool, general-purpose subagent | Discovered, else handoff rule | Discovered | Discovered |
| Other | Any discovered spawn tool | Discovered, else handoff rule | Discovered | Discovered |

**Full bot:** the PIC is a new agent the leader creates and manages, never a subagent. Have the invoker's Dr Eggbot design it when accessible (one job: own this task; explicit anti-jobs; leader's approval boundaries), else the harness's creation tool; having neither is a blocker unless a lower grade is accepted at gate 1. The invocation authorizes exactly one PIC agent. The leader answers Dr Eggbot's intake itself and lists those choices in the gate 1 plan; no separate prompt. Give it a one-job description and the brief as its first message, place it in the leader's section or report the one manual move (`assign_agent_section` on OpenBot), and keep it reporting to the leader, not the human. OpenBot: notifications off; its own workspace, not the invocation cwd, so the brief carries the repo's absolute path and an immutable boot snapshot (`./autopilot.md` does not resolve there). Retire a finished or replaced PIC as the table says: hide where the harness hides, otherwise delete with a delete or archive action if exposed, else retitle it `PIC — done, safe to delete` and report its name and ID. A mark is not a delete: never claim a delete without a confirmed result.

**Handoff rule:** the PIC role outlives its agent. Keep continuing the same PIC (same Bot on Grok Bot, same agent on OpenBot); replace it only when it cannot continue. A replacement, created the same way, starts only once the previous PIC has returned with nothing in flight, confirmed it halted, or been fenced: its pushes blocked (branch protection or revoked push access, verified) or write/deploy access revoked. A force-with-lease on the replacement's own pushes guards history but is not a fence. A possibly in-flight deploy or other non-git mutation needs a clean return, confirmed halt, or revoked access. Until then, report uncertainty; never run two writers. Give the replacement a state packet: approved plan, frozen boot context, current artifact/revision, completed milestones with evidence, open deviations, and next milestone. It acknowledges the packet before work.

Completion notifications are not timers: obey no-poll instructions. No nested delegation requirement; the leader dispatches optional helpers. Promise timed monitoring only with real scheduler/control tools; if required supervision cannot be provided, stop.

Leader brief: task text and links, constraints, authority boundaries, frozen boot context, and reporting contract. No leader research findings or draft plan. PIC independently investigates repo, docs, dependencies, deployment and checks, digging through whatever files and materials the task needs; consults optional helpers/bots where supported; resolves observable questions through research and recommends decisions instead of waiting passively. Leader rules on PIC's recommendations; neither asks the human mid-plan. Only PIC writes the plan and the implementation. Helpers investigate/review, never duplicate ownership.

## Plan and human gate 1

PIC proposes checkpoint-sized, independently verifiable milestones and a complete actionable plan, and returns it to the leader, not the human. Prefer existing scripts/playbooks. The plan must contain:

1. Scope, research evidence, decisions made (with rationale and rejected alternatives), risks, measurable definition of done, and explicit requested implementation/rollout/rollback authority.
2. Reproducible procedures: starting state, exact commands, environment/inputs, expected outputs/assertions/exit codes/thresholds, bounded timeouts/observation windows, and stop/failure handling. Identify proposed scripts as **TO BUILD**, never existing or passed.
3. Development/self-test milestones and evidence needed for leader review; verification environment and dependencies/access.
4. Deployment artifact/revision identification and target (for no-deploy work, the merge, tag, or publish step is the rollout target and gate 2 still applies), rollout commands, post-rollout checks meeting definition of done, rollback triggers/procedure/authorization, and recovery checks.

Leader challenges completeness, feasibility, scope and safety with PIC until satisfied. Leader decides every product, design and scope choice with PIC before gate 1: adopt an option, record why, list rejected alternatives. A plan with an open question or an unchosen option is not leader-approved; send it back to PIC. If a choice needs authority the leader lacks (spend, credentials, production data, irreversible actions), the plan states the leader's chosen option plus the authority it needs. **Then**, only after explicit leader approval, present the complete leader-approved plan and request explicit human approval to implement within its authority. Gate 1 message: first line "Leader-approved plan: approve, or name a change"; then decisions made (each overridable), blockers needing human action, and plan location. No options to pick from. Do not implement on invocation or leader self-approval. A plan drafted by the leader is not a gate 1 plan; do not present it. A plan that cannot equip PIC to implement, test, roll out, verify and recover autonomously is not ready.

## Develop, supervise, review

After gate 1, PIC implements and self-verifies in a fix/check loop. At each bounded checkpoint report: **milestone; artifact/revision; commands/results; deviations; blockers; recommended next action**. Leader checks scope, evidence, deviations and risks, then resumes the same PIC for the next milestone or fixes. Continue internally; no routine human permission prompts or micromanagement.

For a hold or authority loss, request that PIC halt mutations and report in-flight operations, safe state and acknowledgement. Do not claim a process stopped until confirmed; without confirmation, fence through available controls and follow the handoff rule. Unsafe/unresolvable blockers stop the workflow with exact recovery/unblock requirements. Material changes outside approved scope/authority require renewed plan approval through leader then human, not a hidden exception to gate 1.

Leader performs actual final code **and evidence** review of the exact candidate and planned target; missing evidence is not a pass. Send fixes to PIC, never take over writing. Re-review fixes before presenting release approval.

## Human gate 2, rollout, outcome

After leader approval, ask the human to explicitly approve the **reviewed exact artifact/revision and target**, with results, risks, rollout/postchecks and rollback authority visible. Never ask for release approval before leader review. Changed artifact or target invalidates release approval: review again, then request gate 2 again. Fix loops preserve both gates; unchanged in-scope plans need no redundant gate 1.

PIC deploys only that approved artifact to that target, runs bounded postchecks, and sends evidence to leader. If rollback triggers fire, execute only explicitly authorized rollback and recovery checks; otherwise safe-stop and report. **Rollback success means recovered, not task completed.** Final completion requires all agreed checks/definition of done to pass and leader acceptance of evidence. Leader reports outcome, exact revision/target, checks and remaining risks; never fabricate success from missing access, elapsed time, or a healthy rollback.

## Common traps

| Temptation | Required response |
| --- | --- |
| “They trust us; ship immediately.” | Obtain both explicit human gates after leader approval. |
| “I'll research first so the brief is better, then spawn PIC.” | Spawn the PIC first with the task; it researches and returns the plan. |
| “Let the human choose between options A and B.” | Leader chooses with PIC; gate 1 shows decisions, not questions. |
| “Use the root config or combine defaults.” | Select one file from invocation cwd, then invoker global only if local absent. |
| “Tiny fix; reuse release approval.” | Changed artifact/target needs fresh review and gate 2. |
| “Background means continuous monitoring.” | Use real supervision capabilities or stop. |

Inspired by Lauren Tan's pstack [autopilot-full playbook](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/autopilot-full.md); original portable instructions, not its runtime machinery.
