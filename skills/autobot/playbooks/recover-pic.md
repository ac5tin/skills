# Recover a driver

Use when the driver must stop, cannot continue, or must be replaced. Two writers never run.

## Stuck

Stuck means no progress by the checkpoint deadline, or repeated failure against the same check. Waiting on the human is not stuck. Report the wait; do not replace the driver for it.

## Hold

Ask the driver to stop mutations, report in-flight work, and acknowledge. A stop is not confirmed until the driver acknowledges. Without confirmation, use the harness halt and verify it took effect.

## Fence

Fencing blocks the old driver's writes before a replacement starts. Git: block pushes with branch protection or revoked push access, and verify the block. A force-with-lease on the replacement's own pushes is not a fence. Deploy or other non-git mutation: a clean return, a confirmed halt, or revoked access.

## Replace

Replace only after a clean return, a confirmed halt, or a verified fence. Create the replacement the same way as the original. Give it a state packet: approved plan, frozen template, current revision, completed milestones with evidence, open deviations, next milestone. It acknowledges the packet before work.

## Retire

Delete when the harness exposes delete or archive. Otherwise retitle `PIC — done, safe to delete` and report the name and ID. A mark is not a delete.

## Report

Say what is confirmed, what is assumed, and what the human must do. Never claim a stop, a fence or a delete without a result.
