# Source Tree

This document maps the current source tree to responsibilities in the Yasumi frontend.

## Top-Level Structure

- `src/app/`: application entry composition, router creation, navigation metadata, and provider assembly.
- `src/features/`: page-level and business-facing behavior.
- `src/components/`: reusable UI building blocks shared across features.
- `src/domain/`: pure or near-pure shared rules, schemas, validation, time helpers, and transitions.
- `src/repositories/`: boundaries to backend APIs, PowerSync local database, and read-model helpers.
- `src/i18n/`: message catalogs, translation provider, language fallback, and user-facing error mapping.
- `src/styles/`: theme provider, design tokens, global styles, surfaces, and background assets.
- `src/test/`: shared test setup and fixture helpers.
- `tests/e2e/`: Playwright coverage for shell, layout, and route-level flows.

## `src/app/`

Current ownership:

- `providers/AppProviders.tsx`: wires auth, sync runtime, planning data, i18n, and theme.
- `router/router.tsx`: defines the route tree and lazy-loaded pages.
- `router/routes.ts`: route constants and navigation metadata.
- `navigation/mobileNavigation.ts`: mobile-nav slot grouping.

Put code here only when it is app-wide composition rather than feature-owned behavior.

## `src/features/`

Current major areas:

- `auth/`: session storage, login/register/logout, refresh policy, auth gate, and auth screen.
- `planning/`: active planning data provider, fixture fallback path, synced PowerSync-backed store, and planning mutations.
- `sync/`: PowerSync runtime lifecycle, device identity, client version, and shell sync status.
- route-facing page folders such as `today/`, `inbox/`, `areas/`, `settings/`, `upcoming/`, `deadlines/`, and `archive/`.
- `items/`: shared item list surface, dialogs, actions, and detail interactions reused by multiple pages.
- `quick-add/`: capture parsing logic.
- `weather/`: weather API integration used by the shell.

Default rule: if behavior is owned by one user-facing capability, keep it in `src/features/` first.

## `src/components/`

Current subareas:

- `primitives/`: low-level UI controls such as buttons, dialogs, menus, fields, and tooltips.
- `layout/`: app shell and layout primitives.
- `items/`: reusable visual item-row building blocks.

Do not place feature-owned business rules here.

## `src/domain/`

Current subareas include:

- `constants/`: shared enum-like contract values.
- `items/`: item schemas and postponed-activation helpers.
- `settings/`: default settings and validation helpers.
- `time/`: date-only and timezone-safe helpers.
- `transitions/`: status transition validation.
- `validation/`: enum validation helpers.

This layer should stay independent from React and from backend transport details.

## `src/repositories/`

Current subareas:

- `direct-api/`: HTTP client, DTO parsing, config, error guards, and sync-token repository.
- `local-db/`: read-model derivation and repository types.
- `powersync/`: schema, connector, and local database factory.

This is the only layer that should know transport or storage details directly.

## Dependency Direction

Use this direction unless there is a strong repository-specific reason not to:

- `app` may depend on `features`, `components`, `i18n`, and `styles`.
- `features` may depend on `components`, `domain`, `repositories`, `i18n`, and `styles`.
- `components` may depend on `domain`, `i18n`, and `styles`.
- `repositories` may depend on `domain`.
- `domain` should not depend on React, `features`, or `components`.

## Placement Rules

- Do not let page components call `fetch` or direct API clients directly.
- Do not move sync logic into layout components or route pages.
- Do not store transport parsing logic in UI files.
- Do not put device-local preference logic into synced repository code by accident.
