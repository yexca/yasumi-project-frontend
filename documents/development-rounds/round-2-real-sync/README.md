# Round 2: Real Sync

Round 2 moves the frontend from a fixture-first local simulation to a real PowerSync-backed, local-first runtime that works with the deployment stack and backend sync contract.

This round must stay focused: close the real sync loop first, then keep structural cleanup limited to the splits needed to reduce integration risk.

## Goals

1. Connect the signed-in frontend to the real PowerSync runtime through `/v1/sync/token` and `/powersync`.
2. Move planning reads from fixture arrays to synced local tables.
3. Move user-visible writes to PowerSync CRUD transactions that produce backend-valid mutations.
4. Separate synced `user_settings` from device-local preferences.
5. Replace simulated sync status with status derived from auth, connector, upload, rejection, and catch-up state.
6. Split only the high-pressure frontend modules needed to keep the migration cohesive and low-coupled.
7. Verify the result from the root deployment stack with a two-device acceptance pass.

## Current Starting Point

The frontend already has useful pieces in place:

- Direct API auth and token infrastructure.
- PowerSync schema, connector, and client modules under `src/repositories/powersync/`.
- A sync token repository under `src/repositories/direct-api/syncTokenRepository.ts`.
- Local read-model helpers under `src/repositories/local-db/`.
- A central planning provider that currently powers the pages.

The gap is that these pieces are not yet the active runtime path. `src/app/providers/AppProviders.tsx` still wires `PlanningDataProvider` directly into the app, and the main planning state is still fixture and memory driven.

## Round Documents

- `01-current-state-and-scope.md`: confirmed frontend problems and round boundaries.
- `02-frontend-migration-plan.md`: phased execution plan for runtime, reads, writes, status, settings, and fixture removal.
- `03-sync-write-mapping.md`: expected local writes and backend-facing mutation behavior for major actions.
- `04-structure-guidance.md`: merged structure guidance for this round, including the still-relevant first-round optimization direction.
- `05-acceptance-checklist.md`: functional completion checklist.
- `06-verification-playbook.md`: root-stack verification script.

## Working Principles

- Keep one active source of truth per phase.
- Route backend and sync integration through repository-facing boundaries, not page-level client calls.
- Prefer focused extraction over broad restructuring.
- Keep domain rules near-pure and keep React orchestration outside `domain/`.
- Keep device-only preferences out of synced settings unless the backend contract intentionally changes.
- Stop and clarify before changing scope, adding product behavior, or inventing a contract not already represented by the frontend, backend, or deployment guidance.
