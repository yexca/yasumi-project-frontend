# Yasumi Frontend

Phase 01 frontend foundation for Yasumi.

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

## Phase 01 Scope

- Vite + React + TypeScript foundation.
- React Router Data Mode route configuration for MVP routes.
- App shell with navigation, Quick Add placeholder, and sync status placeholder.
- i18n, theme, direct API query, and disconnected PowerSync provider placeholders.
- Strict TypeScript, linting, formatting, unit/component tests, E2E configuration, Dockerfile, and dev container setup.

The old Vue scaffold has been moved to `legacy/vue-scaffold`.
