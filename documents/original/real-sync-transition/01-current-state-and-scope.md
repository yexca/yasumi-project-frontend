# Current State and Scope

This document records the frontend-specific problems confirmed at the start of Round 2.

The deployment-level round guidance includes backend and root-stack work. In this frontend repository, the active scope is the frontend side of that sync loop plus the structure cleanup needed to land it safely.

## 1. The Runtime Is Still Fixture-First

The main page data path is still driven by `src/features/planning/usePlanningData.tsx`.

That file currently owns fixture bootstrap, reducer logic, local persistence, pending-sync metadata, read helpers, settings, and exported hooks. It is also the data source used by the main pages.

Result: the app can look complete while still not reading from the real PowerSync local database.

## 2. PowerSync Exists but Is Not the Active Provider Boundary

The repository layer already contains:

- `src/repositories/powersync/client.ts`
- `src/repositories/powersync/connector.ts`
- `src/repositories/powersync/schema.ts`
- `src/repositories/direct-api/syncTokenRepository.ts`

However, `src/app/providers/AppProviders.tsx` does not yet install a PowerSync runtime provider or auth-aware sync lifecycle boundary.

Result: after sign-in, the app does not yet reliably fetch `/v1/sync/token`, connect through `/powersync`, disconnect on sign-out, or expose connector state to the shell.

## 3. The Write Path Does Not Produce Real Sync Mutations

`src/features/sync/syncApi.ts` still models upload as a direct API operation, and the planning provider currently tracks lightweight pending metadata instead of backend-valid row mutations.

Round 2 must move writes into the local PowerSync database. The upload pipeline should then send real mutations for synced tables rather than fixture-only or empty batches.

## 4. Sync Status Is Still Simulated

The shell currently reflects local pending/offline heuristics, not the real combination of:

- signed-out or auth-blocked state
- connector disconnected state
- upload activity
- backend validation rejection
- catch-up or caught-up state

Result: the UI can claim local save or pending status without proving real multi-device sync.

## 5. Synced and Device-Local Settings Need a Formal Boundary

The PowerSync schema includes `user_settings`, but current planning settings are still stored through the planning provider and browser-local state.

Round 2 should make synced settings explicit and keep device-local preferences separate. Theme mode, local background assets, and similar device-only concerns must not be silently uploaded as user settings.

## 6. Structural Pressure Is Now a Sync Risk

The most important split candidates are:

- `src/features/planning/usePlanningData.tsx` at about 1,126 lines.
- `src/components/layout/AppShell.tsx` at about 347 lines.
- `src/features/auth/AuthProvider.tsx` at about 238 lines.
- `src/features/items/ItemList.tsx` at about 528 lines.

The first three are directly related to sync integration. `ItemList.tsx` remains a useful secondary candidate, but it should not block real sync unless a write or read migration touches it directly.

## Out of Scope

- New product features.
- Large visual redesign.
- Replacing the current app architecture with a deep clean-architecture matrix.
- New backend behavior from this repository.
- A new sync adapter.
- Broad file splitting that is not needed for real sync migration.

## Recommended Execution Order

1. Split only the planning, shell, and auth responsibilities needed to create clean sync boundaries.
2. Add the PowerSync runtime lifecycle after sign-in.
3. Move reads from fixture state to local synced tables.
4. Move writes into PowerSync CRUD transactions with backend-valid metadata.
5. Replace simulated sync status.
6. Separate synced settings from device-local preferences.
7. Remove fixture-only mainline paths.
8. Verify from the root deployment stack.
