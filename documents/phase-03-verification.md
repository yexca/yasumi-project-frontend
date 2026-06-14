# Phase 03 Verification

Date: 2026-06-14

## Scope

Implemented and verified the local data and contract-domain foundation against
`../dev_documents/frontend_coding_guide/04-phase-03-local-data-and-contract-domain.md`.

## Implemented

- Completed shared contract constants and TypeScript union types.
- Added allow-list enum guards for all documented contract enums.
- Added contract error and field-key types.
- Added timezone-neutral `YYYY-MM-DD` helpers and local time/instant validators.
- Tightened instant validation to accept only RFC 3339 boundary strings.
- Added status transition validation.
- Added idempotency key builders for semantic actions, recurrence, generation, and postponed activation.
- Added settings default builder.
- Added item DTO schema and local item row normalization with deadline-shape validation.
- Added direct API DTO parsers for auth responses and stable backend errors.
- Added repository interface contracts for direct API, local items, areas, recurring templates, settings, and operation history.
- Added local read-model helpers for Today, Inbox, Upcoming, Deadlines, Ideas, Areas, Completed, and Archive.
- Added postponed activation planning logic without performing writes.
- Added fixture-driven unit tests using the shared contract fixtures.

## Acceptance Notes

- `src/domain` remains pure: no React, router, storage, CSS, API clients, or PowerSync clients.
- UI pages still do not contain SQL strings, PowerSync client access, or direct API CRUD access.
- Today read model returns reason keys only; localized copy stays in the message catalog layer.
- Full mutation execution remains Phase 05 scope. Phase 03 only plans due postponed activation and exposes idempotency keys.
- Direct API parsing is limited to MVP auth/session/error surfaces and does not add item CRUD.
- Local row normalization accepts fixture fragments for tests while rejecting impossible domain shapes.

## Verification Commands

- `.\env\npm.cmd run typecheck`
- `.\env\npm.cmd test`
- `.\env\npm.cmd run lint`
- `.\env\npm.cmd run format`
- `.\env\npm.cmd run build`
- `.\env\npm.cmd run test:e2e`

## Environment Notes

- Root and `env/.devcontainer` definitions forward frontend `5173`, preview/E2E `4175`, backend `7659`, and PowerSync `8081`.
- Runtime remains pinned through `env/Dockerfile` and `.\env\npm.cmd`.

## Results

| Check                       | Result                          |
| --------------------------- | ------------------------------- |
| TypeScript strict typecheck | Passed                          |
| Unit/component tests        | Passed, 9 files / 29 tests      |
| Lint                        | Passed                          |
| Format check                | Passed                          |
| Production build            | Passed                          |
| E2E smoke test              | Passed, root redirects to Today |
