# Getting Started

This is the shortest path for a developer who needs to understand the repository and start making safe changes.

## 1. Understand The Repository Shape

Read these files first:

1. `README.md` at the repository root for runtime commands and current scope.
2. `architecture/source-tree.md` for the code layout.
3. `architecture/runtime-and-data-flow.md` for the active runtime path.

## 2. Know The Main Runtime Chain

The current app flow is:

1. `src/main.tsx` mounts the app.
2. `src/app/App.tsx` renders the router app.
3. `src/app/providers/AppProviders.tsx` composes `AuthProvider`, `PowerSyncRuntimeProvider`, `PlanningDataProvider`, `I18nProvider`, and `ThemeProvider`.
4. `src/features/auth/AuthGate.tsx` decides whether the signed-in shell or auth screen is shown.
5. `src/components/layout/AppShell.tsx` renders navigation, top bar, sync status, and Quick Add entry.
6. Route pages under `src/features/` consume planning data and shared UI pieces.

## 3. Know Where To Start Reading In Code

Pick the path that matches your task:

- Page or route work: `src/app/router/` then the matching folder under `src/features/`.
- Auth or sign-in state: `src/features/auth/`.
- Sync state or PowerSync runtime: `src/features/sync/` and `src/repositories/powersync/`.
- Planning reads and writes: `src/features/planning/`.
- Shared item interactions: `src/features/items/`.
- Shared visual building blocks: `src/components/` and `src/styles/`.

## 4. First Checks Before Editing

- Confirm whether the change belongs to `app`, `features`, `components`, `domain`, or `repositories`.
- Confirm whether the behavior is synced across devices or device-local only.
- Check whether a current workflow doc already exists in `workflows/`.
- Check whether the target area already has focused notes in `modules/`.

## 5. Minimum Safe Validation

Match validation to the change:

- Domain or parsing change: run unit tests near the touched logic.
- Page or interaction change: run the nearest component tests.
- Route or major flow change: run Playwright coverage when practical.
- Structure or cross-cutting change: run at least typecheck, lint, unit tests, and build.

See `workflows/testing-and-verification.md` for the detailed matrix.

## 6. Reading Sequence For A New Team Member

If you are new to this codebase, use this order:

1. `README.md`
2. `developer/getting-started.md`
3. `developer/architecture/source-tree.md`
4. `developer/architecture/runtime-and-data-flow.md`
5. `developer/workflows/add-page.md` or `developer/workflows/change-data-flow.md`
6. the relevant module note in `developer/modules/`

## 7. Maintenance Rule

If you learn something essential that is not captured here, add it to the closest document before the context fades.
