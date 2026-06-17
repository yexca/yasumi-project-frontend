# Planning And Sync

This module note covers the active planning runtime and the sync-backed data path.

## Files To Know

- `src/features/planning/PlanningDataProvider.tsx`
- `src/features/planning/usePlanningData.tsx`
- `src/features/planning/useSyncedPlanningStore.ts`
- `src/features/sync/PowerSyncRuntimeProvider.tsx`
- `src/features/sync/useSyncStatus.ts`
- `src/repositories/local-db/readModels.ts`
- `src/repositories/powersync/schema.ts`

## Current Responsibility Split

- `PlanningDataProvider.tsx` is the public entry for planning reads and writes.
- `usePlanningData.tsx` still contains the fixture-backed compatibility path and exports the shared hooks and types.
- `useSyncedPlanningStore.ts` is the real PowerSync-backed planning store.
- `readModels.ts` shapes raw rows into page-facing views.
- `PowerSyncRuntimeProvider.tsx` owns database lifecycle, not planning UI behavior.

## Important Current Rule

Pages should not care whether data came from the fixture fallback or from the synced store. They should read through `usePlanningData()` and mutate through `usePlanningMutations()`.

## Current Risks

- `usePlanningData.tsx` is still large and mixes compatibility logic, fixture data, mutation helpers, and exported hook contracts.
- `useSyncedPlanningStore.ts` holds a broad write surface and a lot of transactional detail.
- Sync status pulls signals from both planning and PowerSync runtime state, so changes can create inconsistent shell messages if they update only one side.

## Safe Change Pattern

1. Decide whether the change affects the public planning hook contract or only one backing implementation.
2. Keep page-facing hook signatures stable unless there is a clear reason to break them.
3. Keep SQL and transaction mechanics in the synced store layer.
4. Keep read-model derivation separate from database querying.
5. Preserve the synced-versus-device-local split when adding new state.

## Escalation Trigger

Pause for a design decision before coding if a new field or behavior could be interpreted as either synced user state or local device state.
