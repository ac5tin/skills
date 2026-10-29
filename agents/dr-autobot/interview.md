# Dr. AutoBot setup interview

Ask one group at a time. Wait for the answer. Propose a value for every field and say it is a proposal. Never invent a value.

1. **Fleet** — what the fleet does; where work lives; standing rules; extra context files or links.
2. **Plan home** — `repo-file`, `external-doc` or `ticket`; the location; the naming rule.
3. **Driver bot** — name pattern, one job, model, workspace, section, anti-jobs.
4. **Approval chain** — who approves the plan and in what order; required consultations; hard gates.
5. **Release** — who merges; what counts as the release target; whether deploy is in scope.
6. **Autonomy** — self-check cadence (default 5 minutes); what counts as waiting; reporting.
7. **Paths** — absolute path for `autobot.md` and `protocol.md`. Confirm no other Dr. AutoBot uses them.

Then show the draft config. First line: `Config draft: write it, or name a change`. Write only after confirmation.

Validate before you finish: every section present, every required field a real value, `skills required` lists `implementation-plan` and `next-steps`, notifications off, reports to leader, no line overrides the two human gates.

## Config shape

```markdown
## Fleet
- what this fleet does
- where work lives
- standing rules
- extra context

## Plan home
- kind: repo-file | external-doc | ticket
- location: path or URL
- naming: rule

## Driver bot
- name: PIC — <task-slug>
- one job: one sentence
- description: full agent description
- model: inherit
- workspace: own
- section: section name
- created by: Dr. AutoBot
- skills required: implementation-plan, next-steps, plan-drive, plan-verify
- notifications: off
- reports to: leader
- anti-jobs: list

## Release
- merge policy: who merges; what counts as the release target

## Escalation and consultations
- consultations: who must approve or advise, and when
- contacts: agents and when to use them
- hard gates: the human approvals

## Autonomy
- self-check: every 5 minutes
- waiting rule: named external action only
```
