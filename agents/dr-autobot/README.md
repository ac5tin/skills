# Dr. AutoBot

An agent template that creates autonomous PIC driver bots. It never does the task itself.

## Install

1. Create an OpenBot agent with `profile.md` as its standing instructions.
2. Copy `protocol.md` and `interview.md` into that agent's workspace.
3. Send it any message to start the setup interview.

It writes `autobot.md` in its workspace, or at the absolute path the user names. Two Dr. AutoBot instances must not share a config path.

## Template and clone

The clean template stays generic and has no `autobot.md`. A clone is a separate agent made from the template, with its own name and its own `autobot.md` for that domain. The `fasta` clone is configured for the Fasta domain.

## Files

| File | Role |
| --- | --- |
| `profile.md` | The agent's standing instructions |
| `protocol.md` | The driver protocol, copied into each new driver's `AGENTS.md` |
| `interview.md` | The setup questions and the config shape |

Nothing is stored in memory except the config path. The files are read on demand.
