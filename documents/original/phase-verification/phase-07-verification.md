# Phase 07 Verification

Date: 2026-06-14

## Scope

Implemented and verified testing, hardening, and release readiness work against
`../dev_documents/frontend_coding_guide/08-phase-07-testing-hardening-release.md`.

## Implemented

- Added contract fixture compatibility tests for item shapes, deadline modes, status transitions, settings defaults, Today recommendations, Quick Add parsing, postponed activation, recurrence idempotency keys, and sync tombstone guardrails.
- Added a shared deterministic Quick Add parser and wired both preview and local save paths to it.
- Preserved raw capture titles when saving Quick Add text as Inbox while using cleaned titles for confirmed suggestions.
- Added online/offline event handling so sync status reacts to browser network state changes.
- Added Playwright coverage for all MVP navigation routes, Quick Add local capture, complete/reopen, offline pending behavior, language fallback, theme switching, and background-off state.
- Hardened theme testability with root data attributes for resolved theme mode and background preference.
- Switched Playwright's dev server command to use `env/npm.cmd` on Windows so tests use the project-pinned runtime.
- Added the release checklist document, now archived at `documents/original/release/release-checklist.md`, with automated gates, MVP guardrails, known limitations, and release decision notes.

## Acceptance Notes

- Contract fixture tests consumed `../dev_documents/contracts/fixtures/` directly at the time this record was written.
- Quick Add parser fixture baseline passes for English, Simplified Chinese, Japanese, ambiguous dates, deadline floating time, short-date next-year behavior, and the "done date" non-completion guardrail.
- Offline UI remains navigable and shows pending local state after an item action.
- Unsupported browser locale falls back to English.
- Theme/background checks verify dark mode and no-background solid-surface state without depending on backend services.
- Release checklist documents backend/session/PowerSync integration limitations separately from frontend-only blockers.

## Verification Commands

- `.\env\npm.cmd run typecheck`
- `.\env\npm.cmd test`
- `.\env\npm.cmd run test:component`
- `.\env\npm.cmd run lint`
- `.\env\npm.cmd run format`
- `.\env\npm.cmd run build`
- `.\env\npm.cmd run test:e2e`

## Browser Verification

- Started the local dev server at `http://127.0.0.1:5173`.
- Opened `http://127.0.0.1:5173/today` in the in-app browser.
- Verified Today renders planning rows, uses background-off state, has no horizontal overflow, and reports no browser console errors.
- Opened `http://127.0.0.1:5173/settings`.
- Verified language controls, timezone display, background-off state, no desktop horizontal overflow, no 390px mobile horizontal overflow, and no browser console errors.

## Results

| Check                       | Result                      |
| --------------------------- | --------------------------- |
| TypeScript strict typecheck | Passed                      |
| Unit/component tests        | Passed, 13 files / 51 tests |
| Component test project      | Passed, 7 files / 22 tests  |
| Lint                        | Passed                      |
| Format check                | Passed                      |
| Production build            | Passed                      |
| E2E smoke/layout/flows      | Passed, 8 tests             |
| Contract fixture tests      | Passed within unit suite    |
| Browser interaction check   | Passed                      |

## Known Release Notes

- Production build reports the current single JS chunk is larger than Vite's 500 kB warning threshold. This is not an MVP blocker, but route-level code splitting should be considered before broader distribution.
- Backend account/session and authenticated PowerSync convergence remain integration work.
- Recurrence generation is guarded by idempotency checks and reachable UI, but the full recurrence engine is not implemented in the frontend.

## Phase Boundary

Phase 07 frontend hardening is complete enough for MVP integration. The remaining release risks are backend integration, authenticated sync, and cross-device convergence verification rather than frontend-only test or release checklist gaps.
