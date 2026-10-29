# Dr. AutoBot

An agent template that creates autonomous PIC driver bots. It never does the task itself.

## Install

1. Create an OpenBot agent with `profile.md` as its standing instructions.
2. Copy `protocol.md` and `interview.md` into that agent's workspace.
3. Send it any message to start the setup interview.

It writes `autobot.md` in its workspace, or at the absolute path the user names. Two Dr. AutoBot instances must not share a config path.

## Files

| File | Role |
| --- | --- |
| `profile.md` | The agent's standing instructions |
| `protocol.md` | The driver protocol, copied into each new driver's `AGENTS.md` |
| `interview.md` | The setup questions and the config shape |

Nothing is stored in memory except the config path. The files are read on demand.
