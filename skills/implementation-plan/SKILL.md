---
name: implementation-plan
description: Use when writing, revising or checking an implementation plan for a delegated task. Defines the required structure and the definition-of-done mapping.
---

# Implementation plan

Every plan follows this structure before the leader approves it. The plan describes the current design only. Keep one living artifact and revise it in place.

Generic by design: no company names, accounts, storage products, people or role names. The template supplies where the plan lives and who approves it.

## Front matter

Title, version, date in the leader's timezone, author, status, task reference, repositories.

## Sections, in order

1. Background — why this exists, with links to the source material.
2. Goals and measurable outcomes — separate must-have from nice-to-have.
3. Terminology — terms unique to this task.
4. Scope — in scope, and explicit non-goals.
5. Architecture and approach — at least one high-level diagram, inline with alt text.
6. Detailed design — contracts, control gates, data path, external services, errors and observability.
7. Data and storage changes — migrations, apply path, rollback; say "none" when none.
8. Affected systems — table: system, change type, notes.
9. Autonomy and hard gates — ownership statement, equip table, owner handoff packs.
10. Implementation steps — ordered units the driver executes.
11. Verification — pass/fail bars, one check per done criterion.
12. Rollout and rollback — environment order, enablement, triggers, procedure, authority, recovery check.
13. Trade-offs and decisions — decision, alternatives, reason, consequence.
14. Limitations — honest limits of the chosen design.
15. Risks — likelihood, impact, mitigation, owner.
16. Follow-ups and open questions — parked work only. No development-stopping item here.
17. Definition of done and responsibilities — one row per goal with its criterion and check.
18. Appendix — changelog only, one line per version.

## Definition of done

The mapping is the gate:

- Every goal has at least one done criterion.
- Every done criterion names one check.
- Every check maps back to a goal. Remove or map an orphan check.
- Each check states the exact command or observation, expected result, pass/fail bar, inputs, starting state, and evidence location.
- The driver can run every check without human action.
- A goal without a check is not done.

## Ownership

- The driver is the default operator: code, scripts, migrations, rollout, verification.
- Peers approve bars and advise. They do not become the operator.
- A human step appears only when no bot has access. It carries best time, exact commands, inputs, expected output, done signal and rollback.
- No silent blockers, no TBD owners, no work parked on a peer that the driver can do.

## Quality

- One living plan, revised in place. No new artifact per version.
- Front matter version and status are current.
- Rejected alternatives stay short, in the decisions section.
- Figures have alt text or a caption.
- Cite the source and date for any external claim.
