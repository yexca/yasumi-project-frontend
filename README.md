# Yasumi Frontend

Frontend workspace for Yasumi. Current implementation covers the Phase 04 MVP pages, shared planning components, and routing surface.

## Start

Use the reproducible environment under `env/`.

```powershell
.\env\npm.cmd install
.\env\npm.cmd run dev
```

## Checks

```powershell
.\env\npm.cmd run typecheck
.\env\npm.cmd run lint
.\env\npm.cmd run format
.\env\npm.cmd run test
.\env\npm.cmd run test:component
.\env\npm.cmd run build
```

E2E tests are configured with Playwright:

```powershell
.\env\npm.cmd exec playwright install
.\env\npm.cmd run test:e2e
```

## Current Scope

- Vite + React + TypeScript foundation.
- React Router Data Mode route configuration for MVP routes.
- App shell with navigation, global Quick Add dialog, area shortcuts, and sync status placeholder.
- i18n, theme, direct API query, and disconnected PowerSync provider placeholders.
- Design tokens, themes, compact primitives, layout primitives, and background preferences.
- Shared domain constants, enum validators, date-only helpers, status transitions, idempotency keys, DTO schemas, local row normalization, repository interfaces, and local read-model helpers.
- Shared planning pages for Today, Inbox, Upcoming, Deadlines, Idea Pool, Areas, Completed, Archive/History, and Settings.
- Dense item rows, item action menus, Quick Add, classification, postpone/review date, item editor/detail, area deletion, and recurring template dialogs.
- Strict TypeScript, linting, formatting, unit/component tests, E2E configuration, Dockerfile, and dev container setup.

The old Vue scaffold has been moved to `legacy/vue-scaffold`.
