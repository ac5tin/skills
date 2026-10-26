---
name: autopilot
description: Use only when the user explicitly invokes /autopilot or @autopilot. Never select from task size, keywords, or inferred intent.
---

# Autopilot

## Contract

One supervising **leader**, one proactive **PIC (implementation owner)**, exactly two planned human gates: **approved plan before implementation; reviewed exact revision and target before rollout**. Both gates follow leader approval. Invocation, trust, urgency, and vague approval satisfy neither gate. Platform permissions remain mandatory. Routine discovery, checkpoints, and fixes stay between PIC and leader; genuine unsafe blockers require a safe stop, not permissive fallback.

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

Boot is plain instruction content, including `.mdc`, not a native Cursor rule or executable hook. It may specify taste, preferred tools, and where/how to find planning information (repos, docs, bots, playbooks). Following research references is not loading another boot. Resolve ambiguous references through discovery/source context, not an invented path convention. Boot cannot override higher-priority harness/project safety rules, current explicit task instructions, or these gates.

## Preflight and assign

Discover actual tools, access, communication, permissions, verification/deployment environment, and supervision capabilities. Required tools mean real access: “use Claude Code for development” requires that CLI/tool, not a Claude model. If required access, owner communication, or supervision is missing, **do not begin implementation**; report the missing capability and exact unblock requirement. Before plan approval, discovery uses safe read-only/nonmutating probes only; the invocation authorizes creating the PIC itself (subagent or Bot), nothing else.

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
| Grok Build | `spawn_subagent`, `general-purpose` type; read background results with `get_command_or_subagent_output` only after completion | `resume_from` the completed subagent ID (same type) |
| ZCode | `Agent` tool, general-purpose subagent | Handoff rule below unless resume is discovered |
| Grok Bot | New full Bot owned by the leader, below | Direct message the PIC Bot |
| Other | Any discovered spawn tool | Discovered continuation, else handoff rule |

**Grok Bot:** the leader Bot creates one new PIC Bot under its management for this task. If the invoker's Dr Eggbot is accessible, ask Dr Eggbot to design and create it (one job: own this task, poteto-mode bar, explicit anti-jobs, leader's approval boundaries); otherwise create it directly with available bot-creation tools. The leader answers Dr Eggbot's intake from the task, frozen boot context, and authority boundaries; anything only the human can decide is bundled into gate 1, never a separate prompt. Place it in the leader's section where the runtime allows; otherwise report the one manual move needed. Brief and supervise it by direct message or group chat; it reports to the leader, not the human. No bot-creation access and no Dr Eggbot means a blocker, not a subagent substitute when a full Bot was required. On completion, hide the PIC Bot rather than delete it, preserving its audit trail.

**Handoff rule:** when the same PIC cannot be continued, start one replacement only after the previous PIC has finished or confirmed it halted, never alongside a live writer. Give it a state packet: approved plan, frozen boot context, current artifact/revision, completed milestones with evidence, open deviations, and next milestone. It acknowledges the packet before work.

Completion notifications are not timers: obey no-poll instructions. Some harnesses forbid nested subagents; optional helpers can be dispatched by the leader. No nested delegation requirement. Promise timed monitoring only with real scheduler/control tools; if required supervision cannot be provided, stop.

Leader supplies the full goal, background, constraints, authority boundaries, frozen boot context, and reporting contract. PIC independently investigates repo, docs, dependencies, deployment and checks; consults optional helpers/bots where supported; resolves observable questions through research and recommends decisions instead of waiting passively. Only PIC writes implementation. Helpers investigate/review, never duplicate ownership.

## Plan and human gate 1

PIC proposes checkpoint-sized, independently verifiable milestones and a complete actionable plan. Prefer existing scripts/playbooks. The plan must contain:

1. Scope, research evidence, recommendation/product choices, risks, measurable definition of done, and explicit requested implementation/rollout/rollback authority.
2. Reproducible procedures: starting state, exact commands, environment/inputs, expected outputs/assertions/exit codes/thresholds, bounded timeouts/observation windows, and stop/failure handling. Identify proposed scripts as **TO BUILD**, never existing or passed.
3. Development/self-test milestones and evidence needed for leader review; verification environment and dependencies/access.
4. Deployment artifact/revision identification and target (for no-deploy work, the merge, tag, or publish step is the rollout target and gate 2 still applies), rollout commands, post-rollout checks meeting definition of done, rollback triggers/procedure/authorization, and recovery checks.

Leader challenges completeness, feasibility, scope and safety with PIC until satisfied. **Then** present the complete leader-approved plan and request explicit human approval to implement within its authority. Bundle unresolved product/authority choices here where possible. Do not implement on invocation or leader self-approval. A plan that cannot equip PIC to implement, test, roll out, verify and recover autonomously is not ready.

## Develop, supervise, review

After gate 1, PIC implements and self-verifies in a fix/check loop. At each bounded checkpoint report: **milestone; artifact/revision; commands/results; deviations; blockers; recommended next action**. Leader checks scope, evidence, deviations and risks, then resumes the same PIC for the next milestone or fixes. Continue internally; no routine human permission prompts or micromanagement.

For a hold or authority loss, request that PIC halt mutations and report in-flight operations, safe state and acknowledgement. Do not claim a process stopped until confirmed. Without confirmation, report uncertainty and fence further mutations through available controls; never start a racing replacement writer. Unsafe/unresolvable blockers stop the workflow with exact recovery/unblock requirements. Material changes outside approved scope/authority require renewed plan approval through leader then human, not a hidden exception to gate 1.

Leader performs actual final code **and evidence** review of the exact candidate and planned target; missing evidence is not a pass. Send fixes to PIC, never take over writing. Re-review fixes before presenting release approval.

## Human gate 2, rollout, outcome

After leader approval, ask the human to explicitly approve the **reviewed exact artifact/revision and target**, with results, risks, rollout/postchecks and rollback authority visible. Never ask for release approval before leader review. Changed artifact or target invalidates release approval: review again, then request gate 2 again. Fix loops preserve both gates; unchanged in-scope plans need no redundant gate 1.

PIC deploys only that approved artifact to that target, runs bounded postchecks, and sends evidence to leader. If rollback triggers fire, execute only explicitly authorized rollback and recovery checks; otherwise safe-stop and report. **Rollback success means recovered, not task completed.** Final completion requires all agreed checks/definition of done to pass and leader acceptance of evidence. Leader reports outcome, exact revision/target, checks and remaining risks; never fabricate success from missing access, elapsed time, or a healthy rollback.

## Common traps

| Temptation | Required response |
| --- | --- |
| “They trust us; ship immediately.” | Obtain both explicit human gates after leader approval. |
| “Use the root config or combine defaults.” | Select one file from invocation cwd, then invoker global only if local absent. |
| “Tiny fix; reuse release approval.” | Changed artifact/target needs fresh review and gate 2. |
| “Background means continuous monitoring.” | Use real supervision capabilities or stop. |

Inspired by Lauren Tan's pstack [autopilot-full playbook](https://github.com/cursor/plugins/blob/main/pstack/skills/poteto-mode/playbooks/autopilot-full.md); original portable instructions, not its runtime machinery.
