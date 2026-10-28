# Verify plan

The leader reads the plan as an owner, not an editor. Output is APPROVE or CHANGES with numbered reasons. CHANGES names the missing item and the section that must carry it. The leader never rewrites the plan.

## Structure

- Every required section of `implementation-plan` is present, in order.
- Front matter names the author, version, date in the leader's timezone and status.
- The plan describes the current design only. Rejected alternatives stay short, in the decisions section.

## Goals, done criteria, checks

- Every goal has at least one done criterion.
- Every done criterion names the check that proves it.
- Every check maps back to a goal.
- An orphan goal or an orphan check is CHANGES.

For each check, confirm:

- the exact command or observation
- the expected result and the pass/fail bar
- the inputs, environment and starting state
- the evidence location
- the driver can run it without human action

## Decisions

- Every product, design and scope choice is decided, with a reason.
- No open question, no TBD owner, no "ask later".
- A choice that needs authority the leader lacks states the chosen option and the authority it needs.

## Autonomy

- The driver is the default operator for code, scripts, migrations, rollout and verification.
- The driver holds, or can obtain, the tools, scripts, access and permissions needed to finish. A remaining gap is a handoff pack, not a silent blocker.
- Peers approve bars and advise. A peer is not the happy-path operator.
- A human step appears only where no bot has access. It carries best time, exact commands, inputs, expected output, done signal and rollback.
- The plan does not park work on a peer that the driver can do.

## Rollout

- The release target is exact: revision, environment, tag or publish destination.
- Rollout is step by step, with enablement order and kill switch default.
- Every postcheck maps to a done criterion.
- Rollback has triggers, procedure, authority and a recovery check.
- A failed postcheck with a healthy rollback leaves the task incomplete.

## Risk and scope

- Scope lists in-scope and out-of-scope work.
- Risks carry likelihood, impact, mitigation and owner.
- Limitations are honest.

## Gate 1 message

Present the plan to the human only after all of the above pass. First line: `Leader-approved plan: approve, or name a change`. Then the decisions, each overridable, and any human-only blocker. No options to pick from.
