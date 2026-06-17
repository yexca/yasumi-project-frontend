# Runtime And Data Flow

This document describes the active runtime path of the current frontend.

## Provider Order

`src/app/providers/AppProviders.tsx` currently composes providers in this order:

1. `QueryClientProvider`
2. `AuthProvider`
3. `PowerSyncRuntimeProvider`
4. `PlanningDataProvider`
5. `I18nProvider`
6. `ThemeProvider`

This order matters:

- auth must exist before sync because sync depends on the session
- sync must exist before planning because planning can read and write through the PowerSync runtime
- planning must exist before i18n and theme consumers that read settings-backed values in the shell

## Route Flow

The route tree is created in `src/app/router/router.tsx`.

- `/` redirects to `/today`
- `today` and `inbox` are loaded eagerly
- the remaining main pages are lazy-loaded

The shell entry is gated by `src/features/auth/AuthGate.tsx`.

## Auth Flow

`src/features/auth/AuthProvider.tsx` owns:

- reading and persisting the stored session
- login, register, logout, profile update, and password update commands
- online/offline awareness
- refresh policy through `useSessionRefresh.ts`

Auth exposes session state. It should not own planning reads, shell rendering, or PowerSync mutations.

## Sync Runtime Flow

`src/features/sync/PowerSyncRuntimeProvider.tsx` observes auth state and manages the PowerSync database lifecycle.

Current behavior:

- when no session exists, it disconnects and clears the user-scoped database state
- when a valid signed-in session exists, it creates a connector and connects through PowerSync
- it exposes lifecycle state and database access to the rest of the app

`src/features/sync/useSyncStatus.ts` then combines:

- auth status
- runtime lifecycle state
- PowerSync connection state
- upload queue count
- planning-level rejected or pending state

That hook is the shell-facing sync status boundary.

## Planning Data Flow

`src/features/planning/PlanningDataProvider.tsx` is the compatibility layer that hides two modes:

- synced mode through `useSyncedPlanningStore.ts`
- fixture fallback mode through `usePlanningData.tsx`

Current intent:

- the real browser runtime should use the synced PowerSync-backed store
- the fixture path remains a fallback for tests and environments where the synced runtime is unavailable

Pages should read through `usePlanningData()` and mutate through `usePlanningMutations()`, not by reaching into PowerSync or direct API code themselves.

## Synced Versus Device-Local State

Current synced state:

- items
- areas
- recurring task templates
- operation history
- user settings intended to converge across devices

Current local-only state:

- theme mode
- local background assets and related visual preferences
- rejected write context
- pending write context
- device identity

When changing settings behavior, decide explicitly which side the new field belongs to before writing code.

## Read Path

The synced planning store reads from:

- `areas`
- `items`
- `operation_history`
- `recurring_task_templates`
- `user_settings`
- local-only pending and rejected context tables

Read-model derivation logic still lives in `src/repositories/local-db/readModels.ts`, so page shaping stays separate from database access mechanics.

## Write Path

User actions should follow this path:

1. UI triggers a feature mutation through `usePlanningMutations()`.
2. The synced planning store validates and normalizes data.
3. Writes happen inside PowerSync local database transactions.
4. Semantic actions append `operation_history` where required.
5. Pending or rejected local context is recorded in local-only tables for UX and recovery.

Do not reintroduce page-level direct upload logic.

## Shell Composition

`src/components/layout/AppShell.tsx` currently combines:

- main navigation
- area shortcuts
- sync status display
- shell clock
- weather summary
- language switch
- theme switch
- Quick Add entry
- desktop and mobile shell layout

This is a legitimate integration point, but it is also a structural hotspot. Keep new behavior narrowly scoped when touching it.
