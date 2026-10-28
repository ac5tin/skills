---
name: autopilot-setup
description: Use only when the user explicitly invokes /autopilot-setup or @autopilot-setup to inspect or manage autopilot boot instructions. Never auto-select.
---

# Autopilot Setup

## Scope and invocation

Manage boot instructions and report the detected harness only when explicitly invoked. Natural language is sufficient, for example `/autopilot-setup show effective`, `/autopilot-setup show harness`, `@autopilot-setup add to global: prefer existing test scripts`, or `/autopilot-setup update "./team taste.mdc": use the deployment playbook at docs/deploy.md`. This is skill syntax, not an installed CLI.

Setup is separate interactive configuration, not a third gate inside an active autopilot run. Do not install anything or modify harness permissions, model configuration, versions, or releases. No secret material in examples or generated instructions.

## Show harness

`/autopilot-setup show harness` reports, without writing anything: the grade autopilot will use here (full bot, background subagent, or foreground subagent), the spawn/continue/halt/retire capabilities that decided it, and the one setup action left, such as creating Dr Eggbot, allowing agent creation, or choosing a section. Probe the tools this session actually exposes; a harness name is not a capability. Read the installed plugin's `docs/autopilot-harnesses.md` when it is reachable, and say when it is not. Never write or edit the skill, a JSON config, harness permissions, or model settings for this.

## Select the file

Record invocation cwd and invoker home before changing directories. For writes/removals, require explicit or unambiguous scope; otherwise ask one targeted question before editing.

| Scope | Exact path |
| --- | --- |
| Current-directory / local | `./autopilot.md` in invocation cwd, not repo root |
| Global | `~/.config/autopilot.md` in invoker context |
| Explicit custom | Named `.md` or `.mdc`, quoted paths supported; relative to invocation cwd |

For **show effective**, apply autopilot's exact-one selection: explicit `--boot <path>` must name a `.md` or `.mdc` and selects only that file; otherwise local if present, global only if local absent, built-in instructions if both absent. Show the selected source and its effective instructions, not shadowed files' contents. An empty local file still exists and remains selected. No merges, ancestor search, default `.mdc` search, or XDG alternative. Missing explicit or unreadable selected files block, without fallback; distinguish absent from uninspectable. A custom file is active only when explicitly selected, not automatically discovered.

`.mdc` is plain instruction content, not a Cursor auto-rule or executable hook. Instructions may record taste, required/preferred tools, and where/how to find planning information (repos, docs, bots, playbooks). They cannot override higher-priority harness/project safety, explicit task instructions, or autopilot's two human gates. “Use Claude Code” requires actual tool access, not just a Claude model.

## Read, patch, verify

1. Validate the selected path and requested operation. Read an existing file first, including frontmatter and unrelated sections. An unreadable file is a blocker: do not overwrite or change permissions to work around it.
2. Show requested instructions, or make the smallest targeted addition/update/removal. Preserve unrelated content and `.mdc` frontmatter. Create a missing file only for an explicit scoped add/create request; never create defaults merely by showing or running autopilot. Ask before ambiguous whole-file overwrite/deletion; “remove autopilot” does not authorize deleting a file. Removing a named instruction removes only that instruction.
3. Re-read to verify exact path and resulting content; report the targeted diff (or no change) and effective precedence. Editing global while local exists leaves local selected. Explicit custom selection overrides defaults rather than merging.

Do not silently apply edits to an active run: its selected source/content is frozen, including remote/helper snapshots. Report that new configuration applies to a subsequent run; restart/reapproval is needed if the user wants changed instructions to affect an approved plan.

Inspired by Lauren Tan's pstack [setup skill](https://github.com/cursor/plugins/blob/main/pstack/skills/setup-pstack/SKILL.md); no pstack installation or runtime required.
