# Module Splitting Plan

This plan focuses on the current files with the biggest cohesion pressure.

## 1. `src/features/planning/usePlanningData.tsx`

Current issue:

- One file is handling fixture bootstrap, reducer logic, mutation construction, sync UI derivation, storage persistence, and exported hooks.
- At more than 1000 lines, feature growth will quickly become expensive.

Recommended split:

- `src/features/planning/planningFixtures.ts`
  - initial fixture rows, areas, recurring templates, operation history
- `src/features/planning/planningReducer.ts`
  - reducer, action types, state transitions, mutation assembly
- `src/features/planning/planningStorage.ts`
  - device id and settings persistence
- `src/features/planning/planningSelectors.ts`
  - sync state derivation and read helpers
- `src/features/planning/PlanningDataProvider.tsx`
  - provider wiring and exported hooks

Expected benefit:

- easier testing of reducer logic
- clearer split between pure logic and browser storage
- easier later replacement of fixture bootstrap with real repository subscriptions

## 2. `src/features/items/ItemList.tsx`

Current issue:

- List rendering, selection context, detail-pane state, markdown parsing, autosave behavior, and row action wiring are mixed in one page-oriented module.

Recommended split:

- `src/features/items/components/PageFrame.tsx`
- `src/features/items/components/ItemSection.tsx`
- `src/features/items/components/PlanningItemRow.tsx`
- `src/features/items/components/ItemDetailPane.tsx`
- `src/features/items/hooks/useItemDetailAutosave.ts`
- `src/features/items/utils/renderMarkdown.tsx`

Expected benefit:

- easier reuse of detail pane and list sections
- smaller presentational files
- markdown and autosave logic become independently testable

## 3. `src/components/layout/AppShell.tsx`

Current issue:

- Layout rendering, shell utilities, sync flushing, weather fetching, and Quick Add interaction are all managed in one component.

Recommended split:

- `src/components/layout/AppShell.tsx`
  - shell composition only
- `src/components/layout/useShellClock.ts`
  - top bar time refresh
- `src/components/layout/usePendingSyncFlush.ts`
  - pending mutation flush trigger
- `src/components/layout/useWeatherSummary.ts`
  - weather fetching and reset policy
- `src/components/layout/ShellSidebar.tsx`
- `src/components/layout/ShellTopBar.tsx`
- `src/components/layout/ShellMobileNav.tsx`

Expected benefit:

- lower rendering noise in the main shell file
- easier to evolve header/sidebar/mobile navigation independently
- side effects become replaceable when sync and weather logic mature

## 4. `src/features/auth/AuthProvider.tsx`

Current issue:

- Session storage, refresh lifecycle, offline state, profile update, password update, and auth commands are currently bundled in one provider.

Recommended split:

- `src/features/auth/authStorage.ts`
- `src/features/auth/useOnlineState.ts`
- `src/features/auth/useSessionRefresh.ts`
- `src/features/auth/AuthProvider.tsx`

Expected benefit:

- easier session policy testing
- less provider churn when auth flows expand
- cleaner separation between state machine and IO helpers

## 5. Keep As-Is For Now

These areas look reasonably sized or already well bounded:

- `src/domain/*`
- `src/repositories/*`
- `src/app/router/*`
- `src/i18n/*`
- `src/styles/*`

They should be optimized only when real change pressure appears.
