# Real Sync Transition Archive

This directory preserves the Round 2 material that moved the frontend from fixture-first behavior to the current PowerSync-backed local-first runtime.

At the time these documents were active, they mixed planning, migration sequencing, write mapping, verification, and structure cleanup guidance. They are now archived because the repository needs a stable present-tense documentation layer in `../../developer/`.

## Contents

- `01-current-state-and-scope.md`: the problem statement at the start of the migration.
- `02-frontend-migration-plan.md`: the staged execution plan used during the migration.
- `03-sync-write-mapping.md`: expected write semantics and backend-facing mutation expectations.
- `04-structure-guidance.md`: structure guidance used to land sync safely.
- `05-acceptance-checklist.md`: completion checklist for the round.
- `06-verification-playbook.md`: root-stack manual verification flow.
- `07-frontend-verification-2026-06-16.md`: automated and backend verification notes.
- `08-frontend-real-e2e-2026-06-16.md`: two-device real sync verification evidence.

## When To Read

- You are changing sync behavior and need the migration rationale.
- You need the exact historical verification evidence for the first real-sync pass.
- You want to compare current implementation with the migration plan that shaped it.

## Archive Boundary

Do not extend this folder with current rules. If a sync rule still applies today, document it in `../../developer/architecture/` or `../../developer/modules/`.
