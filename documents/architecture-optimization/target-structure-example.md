# Lightweight Target Structure Example

This is a suggested direction, not a mandatory rewrite.

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
      usePendingSyncFlush.ts
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
    settings/
    sync/
    weather/
  i18n/
  repositories/
    direct-api/
    local-db/
    powersync/
  styles/
  test/
```

## Design Principles Behind This Structure

- Keep cross-cutting infrastructure close to the root.
- Keep feature folders business-centered.
- Keep heavy state modules split by responsibility, not by arbitrary technical pattern.
- Prefer tiny utility files over one giant "helpers" file.
- Avoid creating a global `services/` dumping ground unless ownership is explicit.

## What Not To Do

- Do not move everything into a deep clean-architecture matrix.
- Do not split files just to satisfy line-count aesthetics.
- Do not let shared UI primitives import feature state.
- Do not scatter sync logic across unrelated pages.
