# Autopilot harness support

Autopilot is harness-agnostic by capability, not by name. At run time it probes what the harness exposes and picks the highest grade it can actually supervise. There is no config file, no generated variant, and nothing rewrites the skill.

## What it needs

| Capability | Needed for |
| --- | --- |
| Spawn an independent agent | Full-bot PIC |
| Message and continue that agent | Full-bot supervision |
| Spawn a continuation subagent | Subagent PIC |
| Halt a running PIC | Holds and fencing |
| Retire the PIC | Cleanup after completion |

Spawn and continue are required. Missing halt means bounded milestones only. Missing retire means mark and report. No spawn at all means unsupported: autopilot stops and names the missing capability.

## Support tiers

| Harness | Tier | Halt | Retire |
| --- | --- | --- | --- |
| Grok Bot | Full bot | ✓ | ✓ |
| OpenBot | Full bot | ✓ | — |
| Claude Code | Subagent | — | — |
| OpenCode v2 | Subagent | — | — |
| Grok Build | Subagent | — | — |
| ZCode | Subagent | — | — |
| Pi, other | Probed | — | — |

`—` means the harness exposes no such action. A subagent has no separate bot to halt or retire: the leader uses bounded milestones and the session ends on its own.

## Setup by harness

### Claude Code

1. `/plugin marketplace add ac5tin/skills`
2. `/plugin install ac5tin-skills@ac5tin-skills`
3. Invoke `/autopilot <task>`.

The PIC is a subagent. Both gates appear in chat. No separate bot and no retire action; the subagent ends with its session.

### OpenCode v2 (2.0.4+)

1. Add `"plugins": ["ac5tin-skills@git+https://github.com/ac5tin/skills.git"]` to `opencode.json`.
2. Restart OpenCode.
3. Invoke `/autopilot <task>`.

The PIC is a background subagent continued by `sessionID`. No halt or retire tool is exposed; the leader waits for the completion notification.

### OpenBot

1. OpenBot loads OpenCode plugins from `opencode.json`, so skills reach agents whose provider is `opencode`. Keep the leader on that provider, or install the skill into OpenBot's own skill store for other providers.
2. Let the leader create agents, or have Dr. Eggbot design the PIC. The autopilot invocation authorizes exactly one PIC agent, listed at gate 1.
3. Choose the sidebar section for PICs, or accept the leader's default and move it later.
4. Finished PICs: there is no agent-facing delete. The leader retitles it `PIC — done, safe to delete` and reports it; archive or delete it from the app.

The PIC gets its own workspace, not the invocation directory. The brief carries the repo's absolute path and a snapshot of the boot context; `./autopilot.md` in a repo is not selected.

### Grok Bot

1. `grok plugin marketplace add ac5tin/skills`
2. `grok plugin install ac5tin-skills --trust`
3. Invoke `/autopilot <task>`.

The PIC is a new Bot the leader manages. Dr. Eggbot designs it when present. A replaced or finished PIC is hidden, not deleted, preserving its audit trail.

### Grok Build

1. `grok plugin marketplace add ac5tin/skills`
2. `grok plugin install ac5tin-skills --trust`
3. Invoke `/autopilot <task>`.

The PIC is a `spawn_subagent` continued with `resume_from`. Output is read only after completion; no halt or retire action.

### ZCode

1. Plugins > Marketplace > Create, add `ac5tin/skills`, install `ac5tin-skills`.
2. Invoke `/autopilot <task>`.

The PIC is a general-purpose subagent. Resume it if a resume tool is discovered; otherwise use the handoff rule.

### Pi, other harnesses

`npx add-skills ac5tin/skills` installs the skills. Autopilot probes the session's tools. If it finds a spawn tool with continuation, it runs at the subagent tier; if not, it reports the harness as unsupported rather than pretending.

## Boot instructions

Boot is plain instruction content, not harness configuration. Selection is fixed at invocation:

1. `--boot <path>` if given.
2. `./autopilot.md` in the invocation directory.
3. `~/.config/autopilot.md` if the local file is absent.
4. Built-in instructions if neither exists.

OpenBot's invocation directory is the agent workspace, so use the global file or pass `--boot`.

## Verify

- `/autopilot-setup show harness` — detected tier, the capabilities that decided it, and the one setup action left.
- `/autopilot-setup show effective` — the boot file in force.

Neither writes anything.
