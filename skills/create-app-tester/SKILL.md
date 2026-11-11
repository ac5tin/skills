---
name: create-app-tester
description: Use when the user runs /create-app-tester, or asks to create, update, or recreate a repo-local app tester. Scans the repo, interviews the invoking agent, maps priority-tagged features and use cases, and generates .agents/skills/<app>-app-tester with reusable scripts plus test and maintenance playbooks.
---

# Create an app tester

Generate a repo-local skill that drives the real app and proves user-visible behavior. Output: `.agents/skills/<app>-app-tester/`, open to any agent that reads the Agent Skills format.

Read this file fully before Phase 0. Load a reference only when its phase starts.

## Modes

| Invocation | No tester | Tester exists |
|---|---|---|
| `/create-app-tester` | Create | Ask: new suffixed tester, update, or full recreate |
| `/create-app-tester --update` | Stop: no tester to update | Incremental update |
| `/create-app-tester --recreate` | Create | Archive, then full regenerate |

- Read flags from the raw argument string. "update the tester" counts as `--update`.
- Ask with the harness question tool when present. Otherwise ask one numbered question and wait.
- Non-interactive session with an existing tester and no flag: stop and print the three commands.
- New name: first free `<app>-<n>-app-tester`, `n` from 1. Leave the original untouched.
- Update: run the existing `references/playbooks/maintain.md`. Then, when `references/map.json.assets_digest` differs from this skill's asset digest, archive the generic files to `.app-tester/archive/<name>-assets-<timestamp>/` and overwrite only `SKILL.md`, `references/playbooks/*`, `lib.py`, `doctor.py`, `setup.py`, `teardown.py`, and `validate.py`. Never touch maps, `environment.md`, or `test-*.py`. Print every overwritten file.
- Recreate: move the old tester to `.app-tester/archive/<name>-<timestamp>/`. Keep `.app-tester/artifacts/`. Never delete the old map.
- Both modes: run `<runtime> <this-skill>/scripts/gitignore.<ext> <repo-root>` and report what changed.

The asset digest is `<runtime> <this-skill>/scripts/digest.<ext> <this-skill>/assets`.

## Phase 0 - Preflight

1. Find the repo root with `git rev-parse --show-toplevel`. Not a repo: use the working directory and say so.
2. Read `AGENTS.md` or `CLAUDE.md`, then the `README`. Note the documented build, test, and run commands.
3. Detect the app name and skill name with `references/discovery.md`.
4. Look for `.agents/skills/<name>/SKILL.md` and any `*-app-tester` whose `references/map.json` names this app. Apply the mode above.
5. Check write access before any generation. Read-only: stop.

Gate: do not scan until the mode is settled.

## Phase 1 - Discover

Read `references/discovery.md`. Build the surface table: kind, entry points, run command, readiness signal, auth, seed data, evidence, isolation limits. Read only the files listed there. Skip build output, dependencies, and VCS data.

Gate: the app must start and reach a usable state. A missing local asset may be created as test scaffolding and removed in cleanup. Any other failure: report the exact command and error, stop.

## Phase 2 - Interview

Ask the invoking agent only what the code cannot answer. One message, all questions, every question with a default. Use the bank in `references/discovery.md`. Record answers in `references/environment.md` as `Source: code | answered | assumed`.

Gate: every answer is recorded or defaulted. Never ask again in a later phase.

## Phase 3 - Map

Read `references/map-contract.md`. Map 5-12 features and 3-8 use cases. A feature is a user-visible capability with an entry point, not a module. A use case is a 3-8 step journey across two or more features. Give each a stable id and code anchors. Give every entry a priority `P0`-`P3` with a one-line reason: `P0` is the critical path, at most 30 percent of entries.

Gate: more than 15 features without a selection means ask which subset matters and list the rest as `unmapped`.

## Phase 4 - Generate

Write `.agents/skills/<name>/`:

1. Copy `assets/templates/SKILL.md`, `feature.md`, `usecase.md`, `features-README.md`, `usecases-README.md`, `playbook-test.md`, `playbook-maintain.md`, `environment.md`. Replace every `{{TOKEN}}`, including `{{RUNTIME}}` and `{{EXT}}`.
2. Copy every file from `assets/runtimes/<runtime>/` into `scripts/`, except `test-feature.<ext>`.
3. Write `scripts/test-<slug>.<ext>` per feature and `scripts/test-uc-<slug>.<ext>` per use case from `assets/runtimes/<runtime>/test-feature.<ext>`. Put real commands, selectors, and assertions in each.
4. Write `references/map.json` with `runtime`, every id, file, script, run command, and `assets_digest`.
5. Run `<runtime> .agents/skills/<name>/scripts/validate.<ext>`. Fix every failure.
6. Run `<runtime> <this-skill>/scripts/gitignore.<ext> <repo-root>`. It adds or refreshes a managed block: tester patterns plus stack patterns detected from manifests (`node_modules/` for `package.json`, `target/` for `Cargo.toml`, and so on). It preserves every other line. Report what it added.

No `{{` may remain. No placeholder prose.

## Phase 5 - Prove

Run the generated skill once, end to end:

1. `<runtime> .agents/skills/<name>/scripts/setup.<ext> --run-id proof`
2. `<runtime> .agents/skills/<name>/scripts/doctor.<ext>`
3. `<runtime> .agents/skills/<name>/scripts/test-<one-feature>.<ext> --run-id proof`
4. `<runtime> .agents/skills/<name>/scripts/teardown.<ext> --run-id proof`
5. Confirm the evidence still exists at its named path.
6. Run `validate.<ext>` again.

Fix the generated skill until this passes. A generated tester that was never executed is a draft. If a real product bug blocks the run, report it and hand over a draft, clearly labeled.

## Phase 6 - Handoff

Print:

- The skill name and both indexes.
- Three examples: `/name all`, `/name test <id>`, `/name maintain`.
- Known limits: blocked auth, missing browser harness, external services.
- The update command: `/create-app-tester --update`.

## Gates

Stop and report when: no write access; the app cannot start; no safe isolated environment; more than 15 features without a selection; credentials missing for the only surface; `--update` with no tester; an existing tester in a non-interactive session with no flag.

## Never

- Never point a test at production data or a shared database.
- Never write a credential into the skill. Use env var names.
- Never weaken an assertion to make a run pass.
- Never edit product code to make a test pass. Report the bug.
- Never delete a map without archiving it first.

Design lineage: pstack `create-verification-skill` by Lauren Tan (MIT). This skill changes the output location, adds use cases and scripts, and keeps maintenance in the generated skill.
