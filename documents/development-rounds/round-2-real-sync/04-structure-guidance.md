# Structure Guidance

Round 2 should improve structure only where it reduces sync migration risk.

This document merges the still-relevant first-round optimization guidance into the active round so implementers do not need to rely on archived documents.

## Architecture Direction

The current project shape should be preserved:

- `src/app`: app bootstrap, providers, router, and navigation.
- `src/features`: page and business-facing modules.
- `src/components`: reusable UI building blocks.
- `src/domain`: shared contract rules, validation, time, and state transitions.
- `src/repositories`: direct API, local database, and PowerSync boundaries.
- `src/i18n` and `src/styles`: cross-cutting infrastructure.

Recommended dependency direction:

- `app` may depend on `features`, `components`, `i18n`, and `styles`.
- `features` may depend on `components`, `domain`, `repositories`, `i18n`, and `styles`.
- `components` may depend on `domain`, `i18n`, and `styles`, but should avoid feature-specific data logic.
- `repositories` may depend on `domain`.
- `domain` should not depend on React, browser-heavy UI code, `features`, or `components`.

## Round 2 Split Priorities

### 1. `src/features/planning/usePlanningData.tsx`

Current pressure:

- Fixture bootstrap, reducer logic, mutation construction, sync-state derivation, local persistence, settings behavior, and exported hooks are concentrated in one file.
- Real sync migration needs a clean way to replace fixture reads and in-memory writes.

Recommended target:

- `src/features/planning/PlanningDataProvider.tsx`: provider wiring and exported planning hooks.
- `src/features/planning/planningFixtures.ts`: development or test fixture rows only.
- `src/features/planning/planningReducer.ts`: pure reducer, action types, and state transitions that remain useful during migration.
- `src/features/planning/planningSelectors.ts`: read helpers and derived views.
- `src/features/planning/planningStorage.ts`: device-local persistence helpers that should remain local.
- `src/features/planning/useSyncedPlanningReads.ts`: local synced read subscriptions or repository-backed hooks once PowerSync reads become active.
- `src/features/planning/useSyncedPlanningWrites.ts`: write commands that call local PowerSync transactions.

Guidance:

- Do not add real sync by expanding the current file.
- Keep fixture helpers test-only or development-only after the local synced path is active.
- Keep selector and read-model logic reusable while replacing the backing data source.

### 2. `src/components/layout/AppShell.tsx`

Current pressure:

- Shell composition, top-bar time refresh, weather loading, Quick Add interaction, navigation, and sync side effects are mixed.

Recommended target:

- `src/components/layout/AppShell.tsx`: shell composition only.
- `src/components/layout/ShellSidebar.tsx`
- `src/components/layout/ShellTopBar.tsx`
- `src/components/layout/ShellMobileNav.tsx`
- `src/components/layout/useShellClock.ts`
- `src/components/layout/useWeatherSummary.ts`
- `src/features/sync/useSyncStatus.ts`: sync status derived from the real runtime.

Guidance:

- Sync upload and connector state should not live in the layout component.
- The shell should consume a small status model and render it.
- Weather and clock behavior should remain independent from sync.

### 3. `src/features/auth/AuthProvider.tsx`

Current pressure:

- Session storage, refresh lifecycle, offline state, profile update, password update, and auth commands share one provider.

Recommended target:

- `src/features/auth/authStorage.ts`
- `src/features/auth/useOnlineState.ts`
- `src/features/auth/useSessionRefresh.ts`
- `src/features/auth/AuthProvider.tsx`
- `src/features/sync/PowerSyncRuntimeProvider.tsx` or an equivalent sync-owned lifecycle provider.

Guidance:

- Auth should expose stable session state.
- Sync should observe auth state and own connect, disconnect, reconnect, and cleanup behavior.
- Avoid letting auth commands know about page-level planning state.

### 4. `src/features/items/ItemList.tsx`

Current pressure:

- List rendering, selection context, detail-pane state, markdown rendering, autosave behavior, and row actions are mixed.

Recommended target:

- `src/features/items/components/PageFrame.tsx`
- `src/features/items/components/ItemSection.tsx`
- `src/features/items/components/PlanningItemRow.tsx`
- `src/features/items/components/ItemDetailPane.tsx`
- `src/features/items/hooks/useItemDetailAutosave.ts`
- `src/features/items/utils/renderMarkdown.tsx`

Guidance:

- Treat this as secondary unless a read or write migration touches the file.
- Keep item action wiring close to the owning feature, but push display-only pieces into components.

## Lightweight Target Structure

```text
src/
  app/
    navigation/
    providers/
    router/
  components/
    items/
    layout/
      AppShell.tsx
      ShellMobileNav.tsx
      ShellSidebar.tsx
      ShellTopBar.tsx
      useShellClock.ts
      useWeatherSummary.ts
    primitives/
  domain/
    constants/
    items/
    settings/
    time/
    transitions/
    validation/
  features/
    auth/
      AuthGate.tsx
      AuthProvider.tsx
      authApi.ts
      authStorage.ts
      useOnlineState.ts
      useSessionRefresh.ts
    items/
      components/
      hooks/
      utils/
    planning/
      PlanningDataProvider.tsx
      planningFixtures.ts
      planningReducer.ts
      planningSelectors.ts
      planningStorage.ts
      useSyncedPlanningReads.ts
      useSyncedPlanningWrites.ts
    settings/
    sync/
      PowerSyncRuntimeProvider.tsx
      useSyncStatus.ts
    weather/
  i18n/
  repositories/
    direct-api/
    local-db/
    powersync/
  styles/
  test/
```

This is a direction, not a mandatory tree. Prefer the smallest extraction that creates a clean ownership boundary.

## What Not To Do

- Do not split files for line-count aesthetics alone.
- Do not create a global `services/` dumping ground.
- Do not let shared UI primitives import feature state.
- Do not scatter sync logic across pages.
- Do not keep both fixture runtime and real sync runtime active as long-lived competing sources of truth.
- Do not combine broad visual changes with sync plumbing.
