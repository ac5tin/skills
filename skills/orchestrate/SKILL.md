---
name: orchestrate
description: Use only when the user explicitly invokes this skill via the harness's skill prefix — "/orchestrate <task>" where skills use a slash prefix, "@orchestrate <task>" on OpenCode. Never trigger from task size, keywords, or shape.
---

# Orchestrate

## Overview

The main agent is the orchestrator: it plans, fans out to subagents, arbitrates, and reports. It does not edit files itself.

```
Plan → Implement → Parallel reviews → Arbitration → Accept
           ↑                              |
           └──────── Fix requested ───────┘
```

Run only when explicitly invoked (`/orchestrate <task>`, `@orchestrate <task>`). Never self-select it, offer it, or apply it to a task on your own. If the harness has no subagent dispatch, say so and stop.

## Steps

#### 1. Plan

Approved plan already exists (Plan-mode output, a plan file, an approved breakdown)? Skip to Implement.
Otherwise: split the task into independent workstreams; for each, define acceptance criteria and how it will be verified; dispatch a recon subagent only if research is needed; present the breakdown and the dispatch plan, then wait for approval.
Read-only session (Plan mode): stop after this step.

#### 2. Implement

One subagent per independent workstream, dispatched concurrently in a single message; sequential work gets one subagent.
Every brief contains: full context (fresh contexts share nothing), the slice, constraints, acceptance criteria, required self-verification (tests/checks to run), and the report format (files touched, commands run, results).
Consolidate the reports; never redo delegated work yourself.

#### 3. Parallel reviews

Dispatch 2+ reviewers concurrently and isolated from each other. Independence comes from what each reviewer receives, not the model: give every reviewer the acceptance criteria and the code — never other reviewers' findings.
Default pair: primary reviewer (correctness vs criteria) + independent reviewer (different lens: security, edge cases, spec compliance).
Each returns PASS, FAIL, or PARTIAL with evidence (file:line, command output).

#### 4. Arbitration

Decide from the verdicts:
- All PASS → Accept.
- FAIL or PARTIAL → consolidated fix list back to the implementer; re-run the reviews. PARTIAL is never silently treated as a pass.
- Bound the loop: at most 2 fix rounds, then escalate to the user with what remains.

#### 5. Accept

Report: what was built, what was verified (commands and results), each verdict, and what remains unverified or risky.

## Subagent selection

At every dispatch, enumerate the subagent types you actually have, then pick the best fit for the role: recon/explore types for investigation, coding types for implementation, review/general types for reviews. Fall back to the general-purpose subagent. Never invent agent names. Only one type available? Use it for every role — fresh, isolated briefs still provide independence.

## Quick reference

| Role | Who | Responsibility |
| --- | --- | --- |
| Planner | main agent | workstreams + acceptance criteria |
| Executor | coding subagent(s) | implement one workstream |
| Primary reviewer | review subagent | correctness vs criteria |
| Independent reviewer | separate subagent | independent lens |
| Arbiter | main agent | PASS/FAIL/PARTIAL, accept or fix |

## Not for

Single-file fixes or one workstream — tell the user the simpler path instead.

Adapted from Empryo's multi-agent workflows: https://empryo.com/docs/agents/workflows