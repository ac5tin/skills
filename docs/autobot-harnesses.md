# Autobot harness support

Autobot runs one task through one independent driver bot. It works where the leader can create an agent and exchange messages with it. A subagent-only session is unsupported.

## What it needs

| Capability | Use |
| --- | --- |
| Create an agent | Driver |
| Send a message | Brief, milestones, holds |
| Receive a message | Plan and reports |
| Halt the agent | Hold and fencing |
| Delete or archive | Retirement |

Create, send, receive and halt are required. Missing one stops the run and names it. Missing delete or archive is not a failure: retitle `PIC — done, safe to delete` and report the name and ID.

## Harnesses

| Harness | Support | Note |
| --- | --- | --- |
| OpenBot | ✓ | Create the driver with the template's `created by` agent or directly. No delete action; retitle at close. |
| Grok Bot | ✓ | The driver is a new bot the leader manages. Hide a finished bot when delete is not exposed. |
| Claude Code, OpenCode, Codex, Grok Build, ZCode, Pi | — | Subagents only. Unsupported. |

## Templates

Selection is fixed at invocation:

1. `--template <path>`.
2. `~/.config/autobot.md`.
3. `./autobot.md` in the invocation directory.
4. None: stop and tell the human to run `/setup-autobot`.

OpenBot runs from the agent workspace, so pass `--template` or use the global file.

## Verify

- `/setup-autobot show harness` — the capabilities present and the one action left.
- `/setup-autobot show effective` — the template in force.
