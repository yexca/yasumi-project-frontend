# Secondary Development Guide

This guide is for continued development on the current Yasumi frontend. Its goal is to help new work stay high-cohesion, low-coupling, and lightweight.

## 1. Project Positioning

Current frontend stack:

- Vite 8
- React 19
- TypeScript 5
- React Router
- TanStack Query
- Radix UI primitives
- Zod for DTO and contract parsing

The project already follows a layered shape:

- `src/app`: app bootstrap, providers, router, navigation
- `src/features`: page and business-facing feature modules
- `src/components`: reusable UI building blocks
- `src/domain`: shared contract rules, validation, time, and state transitions
- `src/repositories`: backend, local-db, and PowerSync boundaries
- `src/i18n` and `src/styles`: cross-cutting infrastructure

## 2. Current Runtime Flow

Entry flow:

1. `src/main.tsx` mounts the app.
2. `src/app/App.tsx` renders the router shell.
3. `src/app/providers/AppProviders.tsx` composes React Query, planning state, i18n, theme, and auth providers.
4. `src/features/auth/AuthGate.tsx` controls authenticated shell access.
5. `src/components/layout/AppShell.tsx` renders navigation, top bar, sync status, and Quick Add entry.
6. Route pages under `src/features/*` consume planning state and shared UI primitives.

## 3. Practical Module Boundaries

Recommended dependency direction:

- `app` -> may depend on `features`, `components`, `i18n`, `styles`
- `features` -> may depend on `components`, `domain`, `repositories`, `i18n`, `styles`
- `components` -> may depend on `domain`, `i18n`, `styles`, but avoid feature-specific data logic
- `repositories` -> may depend on `domain`
- `domain` -> should stay near-pure and not depend on `features`, `components`, or browser-heavy UI code

Keep these rules steady:

- Page components should not talk to low-level API clients directly.
- Shared visual primitives should not import feature business logic.
- Domain validation and state rules should not depend on React.
- New backend integration should enter through `repositories/`, then be consumed by hooks/providers/features.

## 4. Where To Extend

Common extension paths:

- Add a new page: `src/features/<feature>/<Feature>Page.tsx`, then register route and navigation metadata.
- Add a new shared widget: `src/components/...`
- Add a new business rule: `src/domain/...`
- Add a new backend or local persistence contract: `src/repositories/...`
- Add new settings or localization copy: `src/i18n/messages.ts` and related feature settings UI

## 5. Current High-Value Hotspots

These files deserve extra care because they already hold broad responsibilities:

- `src/features/planning/usePlanningData.tsx`: local-first state, sample data, mutations, sync state, settings persistence, and operation history are concentrated here.
- `src/features/items/ItemList.tsx`: list surface, selection context, desktop/mobile detail views, markdown rendering, and note autosave live together here.
- `src/components/layout/AppShell.tsx`: shell layout, sync flush trigger, weather fetch trigger, language switch, theme switch, and mobile navigation wiring are all coupled here.
- `src/features/auth/AuthProvider.tsx`: session persistence, refresh policy, online/offline tracking, and profile/password actions share one provider.

These files are still workable, but they are the first places to split when adding complexity.

## 6. Development Conventions For New Work

- Prefer adding logic beside the owning feature before extracting shared abstractions too early.
- Extract only when at least two modules need the same rule or when one file stops being understandable.
- Keep hooks narrow: one hook should ideally expose one concern.
- Keep page files focused on orchestration and composition.
- Keep parsing, validation, and DTO transformation outside presentation files.
- Keep user-facing text in message catalogs.
- Keep direct browser storage access in dedicated providers or infrastructure helpers.

## 7. Lightweight Secondary Development Checklist

- Does the new feature live in the right layer?
- Does it reuse an existing primitive, provider, or domain helper first?
- Does any page import something lower-level than a repository or feature hook?
- Does any component gain state/business responsibilities that belong in a hook?
- Are new strings localized?
- Are tests added near the touched behavior with similar scope to existing tests?

## 8. Commit Convention

Use this format for commits:

```text
action(module): summary
```

Allowed `action` values:

- `feat`
- `fix`
- `refactor`
- `chore`
- `docs`
- `perf`

Examples:

- `docs(documents): reorganize development notes`
- `refactor(planning): split mutation state`

## 9. Recommended Document Pairing

- Read `../architecture-optimization/README.md` before splitting large files.
- Read `../original-development/README.md` when historical acceptance scope matters.
