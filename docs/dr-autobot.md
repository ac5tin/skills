# Dr. AutoBot

Dr. AutoBot is an OpenBot agent template. It creates and equips autonomous PIC driver bots. It never does the task itself.

It replaces the former `autobot`, `autobot-setup` and `autobot-doctor` skills. The driver structure lives in a driver protocol file, not in a skill. The only skills a driver needs are `implementation-plan` and `next-steps`, supplied by this plugin.

## Install

1. Create an OpenBot agent with [`profile.md`](../agents/dr-autobot/profile.md) as its standing instructions.
2. Copy [`protocol.md`](../agents/dr-autobot/protocol.md) and [`interview.md`](../agents/dr-autobot/interview.md) into that agent's workspace.
3. Send it any message to start the setup interview.

## First run

The interview asks one group at a time: fleet and rules, plan home, driver defaults, approval chain, release policy, autonomy, and the absolute paths of `autobot.md` and `protocol.md`.

The paths are per instance. Two Dr. AutoBot agents on one machine must not share them.

The answers are written to `autobot.md`. Nothing is stored in memory except the config path. Files are read only when a driver is created.

## Creating a driver

On each request Dr. AutoBot:

1. Reads `autobot.md` and `protocol.md`.
2. Creates the driver with `create_agent`.
3. Writes `AGENTS.md` in the driver's workspace: the protocol, the config snapshot, the task, the plan home and the reporting contract.
4. Assigns the section, turns notifications off, and creates a 5-minute interval self-check routine.
5. Confirms `implementation-plan` and `next-steps` load in the driver.
6. Sends the brief and reports the name, id, section, routine id, skills probe and plan home.

## Driver contract

The driver is the only writer and the only operator. It owns the task end to end.

| Phase | Exit condition |
| --- | --- |
| Setup | Task, repo, plan home and skills confirmed; ready reported to the leader |
| Planning | Plan written with `implementation-plan`, consultations done, leader APPROVE, human gate 1 |
| Driving | `plan-drive` builds the ordered todos; milestones reported; gate 2 before any release |
| Verification | `plan-verify` builds the scripts; every check in the plan and the definition of done passes with recorded evidence |
| Acknowledgement | Leader accepts item by item; human acknowledges; `next-steps` handoff |
| Retire | Self-check routine stopped; bot retitled or deleted |

The leader guides and approves. It never contributes work. A change of any size goes to the driver.

## Autonomy

- The driver never idles. If it is not waiting, it takes the next step.
- It stops only when the task is complete, or when it waits for a named external action. It says what, who and what happens next.
- The 5-minute routine asks: current milestone, last verified evidence, blocked or waiting, next action. If not waiting and not done, the driver acts.

## Limits

- OpenBot only. The harness must create an agent and exchange messages with it.
- `create_agent` cannot install skills or set notifications. The plugin supplies the skills; Dr. AutoBot turns notifications off after creation.
- A driver whose skills do not load must not start planning.
