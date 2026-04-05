# Agent Skills Repository

A collection of reusable agent skills (Markdown-based instruction sets) for AI coding tools.

## Structure

- `skills/` — Each subdirectory is a skill containing a `SKILL.md` with YAML frontmatter (`name`, `description`) and instructions.
  - `code-quality/` — General clean-code best practices (KISS, DRY, simplicity).
  - `golang-code/` — Go coding standards: error handling, naming, anti-patterns, pointers, function signatures, linting.
  - `go-service-scaffold/` — Scaffold a Go microservice (includes reference templates).
  - `trivy-scanner/` — Run Trivy vulnerability scans via Podman.

## Build / Test

No build system, dependencies, or tests. This is a documentation-only repo.

## Conventions

- Skills are plain Markdown files named `SKILL.md` with YAML frontmatter (`name`, `description`).
- Keep skills focused and concise — one concern per skill.
- Use descriptive kebab-case directory names for new skills (e.g., `my-new-skill/`).
- Follow existing formatting: H2 sections for top-level topics, H4 for subsections, fenced code blocks for examples.
- Do not duplicate guidance already covered by an existing skill; extend or reference it instead.
