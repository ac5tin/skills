# Agent Skills Repository

A collection of reusable agent skills (Markdown-based instruction sets) for AI coding tools.

## Structure

- `skills/` — Each subdirectory is a skill containing a `SKILL.md` with YAML frontmatter (`name`, `description`) and instructions.
  - `implementation-plan/` — Required plan structure and the definition-of-done mapping.
  - `code-quality/` — General clean-code best practices (KISS, DRY, simplicity).
  - `golang-code/` — Go coding standards: error handling, naming, anti-patterns, pointers, function signatures, linting.
  - `go-service-scaffold/` — Scaffold a Go microservice (includes reference templates).
  - `next-steps/` — End finished tasks with clear next actions and follow-ups.
  - `orchestrate/` — Multi-agent orchestration: subagent fan-out, isolated parallel reviews, arbitration. Triggered only via explicit invocation.
  - `trivy-scanner/` — Run Trivy vulnerability scans via Podman.

- `agents/` — Agent templates that are not skills. `dr-autobot/` creates autonomous PIC driver bots; its files are read on demand and never stored in memory.

- `docs/` — Human-facing guides. `dr-autobot.md` covers install, first run and the driver contract.

- Plugin packaging (no `skills/` changes needed; new skills are picked up automatically):
  - `.claude-plugin/` — Claude Code, Claude Desktop, ZCode. `version` is deliberately omitted; the plugin entry pins a `source.sha` (github object) that CI bumps per release — the pinned SHA is the version and drives ZCode update detection.
  - `.codex-plugin/`, `.agents/plugins/` — Codex. `version` is a constant `0.0.0` because Codex requires the field.
  - `.grok-plugin/` — Grok Build. `marketplace.json` is a self-hosted catalog whose single `url` source points back at this repo with no pinned SHA, so it tracks `main`; `plugin.json` is the plugin manifest (`skills` points at `./skills/`). No `plugin-index.json` — that is generated only inside the official `xai-org/plugin-marketplace` repo.
  - `package.json` (`pi.skills`) — Pi.
  - `.opencode/plugins/ac5tin-skills.js` + root `index.js` — OpenCode v2; registers every `skills/*/SKILL.md`.
  - No tags or version bumps. The only release automation is `.github/workflows/pin-plugin-sha.yml`, which re-pins `source.sha` when plugin content changes; otherwise a new commit is a new release.

## Build / Test

No build system or dependencies. After changing packaging, run `claude plugin validate .` (a missing-version warning is expected).

## Conventions

- Skills are plain Markdown files named `SKILL.md` with YAML frontmatter (`name`, `description`).
- Keep skills focused and concise — one concern per skill.
- Use descriptive kebab-case directory names for new skills (e.g., `my-new-skill/`).
- Follow existing formatting: H2 sections for top-level topics, H4 for subsections, fenced code blocks for examples.
- Do not duplicate guidance already covered by an existing skill; extend or reference it instead.
