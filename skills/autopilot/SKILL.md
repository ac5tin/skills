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

Leader preflight is minimal: the selected boot is readable, a spawn/continue capability exists, and the invocation contains a task reference (URL, path, or id). Do not fetch or open that reference. Then **spawn and brief the PIC immediately**. The leader does not research the repo, docs, or design before the PIC reports; that is the PIC's job. The PIC discovers actual tools, access, communication, permissions, and verification/deployment environment, and its plan reports any missing capability with the exact unblock requirement. Required tools mean real access: “use Claude Code for development” requires that CLI/tool, not a Claude model. If required access, owner communication, or supervision is missing, **do not begin implementation**. Before gate 1, everyone uses safe read-only/nonmutating probes only: no comments, pushes, issue edits, or secret changes. The invocation authorizes creating, placing, and briefing the PIC (subagent or Bot), nothing else.

Choose by capability, never invented agent/model IDs:

| PIC mode | Supervision |
| --- | --- |
| Background subagent | Bounded checkpoint-sized milestone, completion notification, leader review, continue same PIC (or handoff rule) |
| Foreground subagent | Bounded milestone returns to leader for review and continuation |
| Full bot | Independent runtime with actual bidirectional messaging/control |

Known harness mappings; use only what the running harness actually exposes:

| Harness | Spawn PIC | Continue same PIC |
| --- | --- | --- |
| Claude Code | `Agent` tool, `general-purpose` or custom type (never one-shot Explore/Plan) | `SendMessage` to the returned agent ID or name |
| OpenCode V2 | `subagent` with `agent: "general"`, `background: true` if supported | Pass the returned `sessionID` |
| Grok Build | `spawn_subagent`, `general-purpose`; `get_command_or_subagent_output` only after completion | `resume_from` the completed subagent ID |
| ZCode | `Agent` tool, general-purpose subagent | Handoff rule below unless resume is discovered |
| Grok Bot | New leader-managed Bot, below | Direct message the same Bot |
| Other | Any discovered spawn tool | Discovered continuation, else handoff rule |

**Grok Bot:** the PIC is always a new Bot the leader Bot creates and manages, never a subagent. Have the invoker's Dr Eggbot design and create it when accessible (one job: own this task; explicit anti-jobs; leader's approval boundaries), else available bot-creation tools; having neither is a blocker. The leader answers Dr Eggbot's intake itself and lists those choices in the gate 1 plan for the human to change; no separate prompt. Place the Bot in the leader's section, or report the one manual move needed. It reports to the leader by direct message or group chat, not to the human. Hide a replaced or finished PIC Bot rather than delete it, preserving its audit trail.

**Handoff rule:** the PIC role outlives its agent. Keep continuing the same PIC (same Bot on Grok Bot); replace it only when it cannot continue. A replacement, created the same way, starts only once the previous PIC has returned with nothing in flight, confirmed it halted, or been fenced: its pushes blocked (branch protection or revoked push access, verified) or write/deploy access revoked. A force-with-lease on the replacement's own pushes guards history but is not a fence. A possibly in-flight deploy or other non-git mutation needs a clean return, confirmed halt, or revoked access. Until then, report uncertainty; never run two writers. Give the replacement a state packet: approved plan, frozen boot context, current artifact/revision, completed milestones with evidence, open deviations, and next milestone. It acknowledges the packet before work.

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
