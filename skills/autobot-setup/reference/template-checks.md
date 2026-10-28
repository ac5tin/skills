# Template checks

The only authoritative check list. `/autobot-setup validate` and `/autobot-doctor` apply this file and do not restate it. `/autobot` applies the same field list at its Phase 0 gate.

## Selection

Resolve one file. No merging, no ancestor search.

1. `--template <path>` when given: `.md` or `.mdc`, resolved from the invocation directory.
2. `./autobot.md` in the invocation directory.
3. `~/.config/autobot.md`.

The nearest file wins. An explicit path beats both. `--template` is the only escape hatch when both exist and the global file is the wanted one.

A missing, unreadable or wrong-extension explicit path is a blocker. No fallback. An empty file that exists is still selected.

## Schema

```markdown
# <fleet> autobot template

## Fleet
- What this fleet does
- Where work lives: repos, docs, boards
- Standing taste and rules

## Plan home
- kind: repo-file | external-doc | ticket
- location: <path or URL pattern>
- naming: <slug rule>

## Driver bot
- name: <pattern, for example "PIC — <task-slug>">
- one job: <one sentence>
- description: <full agent description>
- model: <provider/model, or "inherit">
- workspace: <path, or "own">
- section: <where to place it>
- created by: <agent that creates the driver, or "direct">
- skills required: <must include implementation-plan>
- notifications: off
- reports to: leader
- anti-jobs: <list>

## Release
- merge policy: <who merges; what counts as the release target>

## Escalation and consultations
- consultations: <agent or role, and when the leader must obtain its input>
- contacts and when to use them
- hard gates
```

## Levels

- **BLOCKER** — a run must not start.
- **WARNING** — a run may start. Disclose it at gate 1.

A placeholder is not a value. Placeholders: empty, `TBD`, `TODO`, `...`, `<...>`, `change me`. The placeholder rule applies to the T2 fields only. `none` is a valid value for `anti-jobs` and `consultations`.

## Checks

| ID | Level | Test |
| --- | --- | --- |
| T0 | BLOCKER | The selected file is readable with the right extension. |
| T1 | BLOCKER | Each H2 exists exactly once: `Fleet`, `Plan home`, `Driver bot`, `Release`, `Escalation and consultations`. A duplicated title fails. Another H2 is a WARNING. |
| T2 | BLOCKER | A real value for `name`, `one job`, `description`, `skills required`, `merge policy`, and `kind`, `location`, `naming` under Plan home. |
| T3 | BLOCKER | `kind` is `repo-file`, `external-doc` or `ticket`. |
| T4 | BLOCKER | `location` is a value. WARNING when `repo-file` is not a path, or `external-doc` and `ticket` are not a URL. |
| T5 | BLOCKER | `skills required` lists `implementation-plan`. |
| T6 | BLOCKER | `notifications` is `off`. |
| T7 | BLOCKER | `reports to` is `leader`. |
| T8 | WARNING | `model` is `inherit` or `provider/model`. |
| T9 | WARNING | `workspace` is `own` or an absolute path. |
| T10 | WARNING | `created by` is present. Do not check that the agent exists. Reachability is a Phase 1 harness probe. |
| T11 | WARNING | A keyed line in `Plan home`, `Driver bot` or `Release` matches the schema. Name the nearest expected key. Fleet and escalation prose stay free. |
| T12 | BLOCKER | No line gives the driver human approval, approves the plan automatically, skips gate 1 or gate 2, or merges without gate 2. A line that restates the human gates is not an override. The template is fleet configuration and cannot change the approval chain. |
| T13 | WARNING | A keyed-section line is a `- key: value` line or a `- ` bullet. |

## Output

Report the source and the step that selected it, then one line per finding in check order, then the verdict:

```
Source: ./autobot.md (step 2, invocation directory)
T2 BLOCKER Driver bot / one job: empty value
T5 BLOCKER Driver bot / skills required: implementation-plan missing
T11 WARNING Driver bot / skill required: expected "skills required"
Template: FAIL — 2 blockers, 1 warning
```

`Template: PASS` when there is no blocker. Warnings still appear. Validation changes nothing.
