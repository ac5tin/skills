# Maintain playbook

Incremental resync of this skill against the app. Not a rebuild; `/create-app-tester --recreate` does that.

## 0. Locate the drift

1. Read `references/map.json`: `source_commit`, ids, scripts.
2. `git rev-parse HEAD` and `git diff --name-status <source_commit>..HEAD`.
3. No git: compare file mtimes and say the scan is weaker.

## 1. Index hygiene

Compare files in `references/features/` and `references/usecases/` with their indexes and `map.json`. Fix missing, extra, duplicate, and dead rows. No new inventory yet.

## 2. Source wave

One read-only pass per touched feature and per changed directory. Run them concurrently when the harness has parallel subagents; otherwise serially. Children may read and report, never edit or drive.

Each returns: feature summary, source entry points, likely drift with citations, one live recipe.

Also scan changed directories for user-facing surfaces missing from the map. A missing entry needs a concrete source path before it is called missing.

## 3. Interview

Ask only about unresolved drift. Five questions maximum, each with a default. Record answers in `references/environment.md`.

## 4. Reconcile

Choose per entry: keep, update, add, remove, merge.

- Update when the behavior or entry point changed.
- Re-check the priority of every touched entry. Record a priority change in the report.
- Add when a user-facing surface has no entry.
- Remove only with two independent signals: the entry point is gone from code, and no test, route, or doc references it.
- Merge duplicates into one id; record the retired id in the report.

Never remove an entry because one grep missed it.

## 5. Live proof

Drive every changed feature once. When more than 20 percent of entries changed, drive all. Use the test playbook's launch, doctor, teardown, and evidence rules.

A doc-only change still needs its feature file to match the app. Prove the behavior, not the prose.

## 6. Write

Update the feature and use-case files, both indexes, the per-entry scripts, and `map.json` (`source_commit`, `generated_at`, ids, priorities). Add `assets_digest` only when the generator refreshed generic files.

## 7. Validate

Run `python3 .agents/skills/{{SKILL_NAME}}/scripts/validate.py`. Fix every failure.

## 8. Report

State one outcome: `clean`, `changed`, or `blocked`.

- `changed`: list added, updated, removed, merged, and renamed ids, with evidence paths.
- `blocked`: name the missing prerequisite and the attempted route.

## Rules

- Edit only this skill's directory. Never edit product code.
- Separate doc drift from a product regression. Drift: fix the map. Regression: report it and leave the map honest.
- Keep evidence. Remove only scratch state the run created.
- A removal or a rename is a breaking change for users of this skill. Report it plainly.
