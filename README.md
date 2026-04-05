# Agent Skills

A collection of reusable agent skills (Markdown-based instruction sets) for AI coding tools.

## Available Skills

| Skill | Description |
|-------|-------------|
| `code-quality` | Enforce clean, simple, maintainable code best practices. Use when planning, implementation and code reviews. |
| `golang-code` | Enforce good Go (Golang) code styles and best practices. Use when writing and reviewing Go code. |
| `trivy-scanner` | Scan the current project for vulnerabilities using Trivy via Podman. |

## Installation

### Install all skills

```bash
npx add-skills ac5tin/skills
```

### Install a specific skill

```bash
npx add-skills ac5tin/skills --skill <skill-name>
```

For example:

```bash
npx add-skills ac5tin/skills --skill code-quality
npx add-skills ac5tin/skills --skill golang-code
npx add-skills ac5tin/skills --skill trivy-scanner
```
