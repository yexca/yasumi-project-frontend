# Yasumi Frontend MVP Release Checklist

Date: 2026-06-14

## Automated Gates

- TypeScript strict typecheck must pass with `.\env\npm.cmd run typecheck`.
- Unit and contract fixture tests must pass with `.\env\npm.cmd test`.
- Component tests must pass with `.\env\npm.cmd run test:component`.
- Lint must pass with `.\env\npm.cmd run lint`.
- Formatting check must pass with `.\env\npm.cmd run format`.
- Production build must pass with `.\env\npm.cmd run build`.
- Playwright E2E must pass with `.\env\npm.cmd run test:e2e`.

## MVP Guardrails

- Synced user data is read and mutated through local-first feature hooks and repositories.
- Page components do not import direct API clients or PowerSync clients.
- Direct backend APIs remain limited to session, auth, sync token, and health/readiness boundaries.
- User-facing component copy resolves through message catalogs.
- Backend diagnostic `message` fields are not rendered as user copy.
- Calendar integration is not exposed as an active MVP UI flow.
- Unsupported enum values are rejected at domain/repository boundaries.
- Date-only values continue to display as `YYYY-MM-DD` and do not shift with timezone changes.
- Background glass styling is gated by active local background state.
- Dense item rows remain compact on desktop and avoid horizontal overflow on mobile.

## Known Limitations

- Backend account/session flows are not wired into the frontend shell yet.
- PowerSync connection lifecycle is scaffolded, while this MVP frontend still uses deterministic local fixture data for automated UI verification.
- Full recurring template creation/editing and next-instance generation are represented by reachable UI and idempotency checks, not a complete recurrence engine in the frontend.
- Quick Add implements the documented MVP fixture baseline and lightweight deterministic parsing; broad natural language parsing remains out of scope.
- Validation rejection recovery is modeled locally and localized, but final server rejection round trips require backend integration.
- Cross-device conflict convergence must be verified during backend and PowerSync integration testing.

## Release Decision

No frontend-only MVP blocker remains after all automated gates pass. Backend integration, authenticated sync, and multi-device convergence remain required before production release.
