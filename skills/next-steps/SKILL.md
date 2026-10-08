---
name: next-steps
description: Always end a finished task with clear next actions and follow-ups, so the user knows exactly what to do next. Use whenever completing a task, fix, plan, review, or any work that changes state.
---

## Guidelines

- After finishing any task, end the reply with a `## Next steps` section.
- Never end on "done" alone. The user must know what happens next.

## Format

#### Do next

The single recommended action, with the exact command, file path, or decision needed.

#### Follow-ups

Work left undone, unverified, or deferred, plus known risks. Rank by importance. Max 5 items.

#### Needs your decision

Open questions only the user can answer. Omit if none.

## Rules

- Each item is concrete and actionable. Not "consider improving X".
- Only list real items. Never invent filler to fill a section.
- If nothing is pending, write `Nothing pending.` in one line.
- State what was skipped or not verified (tests not run, edge cases unchecked).
- Do not start a follow-up without the user's go-ahead.
- Do not recap what was just done.
- Keep it short: no pleasantries, no closing questions like "anything else?".

## Example

```markdown
## Next steps

**Do next:** run `npm test -- auth.spec.ts` to confirm the token fix.

**Follow-ups:**
1. Refresh-token path is untested.
2. `README` still documents the old login flow.

**Needs your decision:** keep the 24h token expiry, or shorten it?
```
