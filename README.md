# Yasumi Frontend

Frontend workspace for Yasumi. Current implementation covers the MVP settings, localization, local-first planning, shared components, routing surface, and the first manual acceptance revision.

## Start

Use the reproducible environment under `env/`.

```powershell
.\env\npm.cmd install
.\env\npm.cmd run dev
```

The local dev server now defaults to `http://127.0.0.1:7650`.

## Docker Compose

With the backend repository present at the sibling path `..\yasumi-project-backend`, you can start the release-style full stack directly from this frontend directory:

```powershell
Copy-Item .env.example .env
docker compose up -d --build
```

The frontend container/image naming now defaults to `yexca/yasumi-project-frontend:0.1.0`.

Default exposed endpoints:

- Frontend: `http://127.0.0.1:7650`

The frontend proxies backend API and PowerSync traffic through the same origin, so the host only needs port `7650`.

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
- Authentication gate with login/registration entry, 30-day local session persistence support, and offline continuation when a local session exists.
- App shell with navigation, desktop Quick Add, customizable mobile bottom navigation, area shortcuts, utility header weather, and sync status.
- i18n catalogs for English, Simplified Chinese, and Japanese with settings-driven language switching.
- Theme mode and local-only background preferences with IndexedDB-backed custom image assets.
- Direct API query and disconnected PowerSync provider boundaries.
- Design tokens, themes, compact primitives, layout primitives, and background-aware surface behavior.
- Shared domain constants, enum validators, date-only helpers, status transitions, idempotency keys, DTO schemas, local row normalization, repository interfaces, and local read-model helpers.
- Shared planning pages for Today, Inbox, Upcoming, Deadlines, Idea Pool, Areas, Completed, Archive/History, and Settings.
- Dense item rows with left-side completion/reopen controls, Inbox completion disabled state, undo completion toast, row selection, desktop right-side markdown-first detail pane, mobile bottom-sheet detail view, item action menus, Quick Add, classification, postpone/review date, item editor/detail, area deletion, and recurring template dialogs.
- Settings cleanup hides fixed/derived fields, uses common timezone choices for Shanghai, Tokyo, London, and New York, and includes personal display name, password change, and weather city controls.
- Strict TypeScript, linting, formatting, unit/component tests, E2E configuration, Dockerfile, and dev container setup.

The old Vue scaffold has been moved to `legacy/vue-scaffold`.
