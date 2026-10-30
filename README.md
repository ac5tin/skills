# Agent Skills

A collection of reusable agent skills (Markdown-based instruction sets) for AI coding tools.

## Available Skills

| Skill | Description |
|-------|-------------|
| `implementation-plan` | Required structure and definition-of-done mapping for implementation plans. Use when writing, revising or checking a plan. |
| `plan-drive` | Turn an approved plan into an ordered todo list and drive it without idling. |
| `plan-verify` | Turn an approved plan into executable verification scripts and a run order. |
| `code-quality` | Enforce clean, simple, maintainable code best practices. Use when planning, implementation and code reviews. |
| `go-service-scaffold` | Scaffolds new Go microservices from scratch with a production-ready layered architecture: Fiber HTTP, Bun ORM, Unit of Work, dual-interface services, domain packages, task queues, cron workers. Use when creating a new Go project, bootstrapping a Go service, or asked to scaffold a Go API. |
| `golang-code` | Enforce good Go (Golang) code styles and best practices. Use when writing and reviewing Go code. |
| `next-steps` | Always end a finished task with clear next actions and follow-ups. Use whenever completing a task, fix, plan, review, or any work that changes state. |
| `orchestrate` | Run multi-agent orchestration: fan out work to subagents, run isolated parallel reviews, arbitrate verdicts. Use only when explicitly invoked via `/orchestrate` or `@orchestrate`. |
| `trivy-scanner` | Scan the current project for vulnerabilities using Trivy via Podman. |

Per-harness setup, support tiers and limits: [docs/dr-autobot.md](docs/dr-autobot.md).

## Dr. AutoBot

An agent template that creates autonomous PIC driver bots. Install it from [`agents/dr-autobot/`](agents/dr-autobot/). The created driver uses `implementation-plan` and `next-steps`, and carries a 5-minute self-check routine.

## Installation

Install as a plugin (updates follow new commits on `main`, no tags):

| Agent | Install |
|-------|---------|
| Claude Code / Claude Desktop | `/plugin marketplace add ac5tin/skills` then `/plugin install ac5tin-skills@ac5tin-skills` (send as two prompts) |
| Codex | `codex plugin marketplace add ac5tin/skills` then `codex plugin add ac5tin-skills@ac5tin-skills` |
| Grok Build | `grok plugin marketplace add ac5tin/skills` then `grok plugin install ac5tin-skills --trust` |
| Cursor / Grok Bot | Teams/Enterprise: Dashboard → Plugins & MCPs → Add Marketplace → Import from Repo with `https://github.com/ac5tin/skills` (marketplace id `ac5tin-skills`), then install from Customize. Grok Bot reads the same `.cursor-plugin` format. |
| OpenCode v2 (2.0.4+) | add `"plugins": ["ac5tin-skills@git+https://github.com/ac5tin/skills.git"]` to `opencode.json` and restart |
| Pi | `pi install git:github.com/ac5tin/skills` |
| ZCode | Plugins > Marketplace > Create, add `ac5tin/skills`, then install `ac5tin-skills` |

### Updating

- Claude Code: `/plugin marketplace update ac5tin-skills` (the git commit SHA is the version).
- Codex / Pi: re-run the marketplace update or `pi update`.
- Grok Build: `grok plugin update ac5tin-skills` (the catalog source has no pinned SHA, so it tracks `main`).
- Cursor / Grok Bot: no `version` field; a marketplace refresh tracks `main`.
- OpenCode: Bun may pin the resolved commit. If a new commit does not show up, clear OpenCode's package cache (`~/.cache/opencode/npm/git-ac5tin-skills-*`) and restart.
- ZCode: refresh the marketplace source. The update badge does not appear because no version string changes.

### Any other agent

```bash
npx add-skills ac5tin/skills
```

To install a single skill:

```bash
npx add-skills ac5tin/skills --skill <skill-name>
```
