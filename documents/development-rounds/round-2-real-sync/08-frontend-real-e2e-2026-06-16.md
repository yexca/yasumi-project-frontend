# Frontend Real E2E Verification - 2026-06-16

## Environment

- Frontend: `http://127.0.0.1:7650`
- Backend API: frontend proxy `/api`, service `http://127.0.0.1:7659`
- PowerSync: frontend proxy `/powersync`, service `http://127.0.0.1:8081`
- Docker Compose services were running for `postgres`, `mongo`, `powersync`, `api`, and `frontend`.
- `GET /readyz` reported both database and sync ready.
- The backend runtime image includes `tzdata` so valid IANA values such as `Asia/Tokyo` pass the existing backend settings contract.

## Browser E2E Account

- Account: `codex_final_1781587911671@example.com`
- User id: `43e71892-98c0-416c-96cb-38c9fe8050f1`
- Device simulation: two independent Playwright browser contexts using the same account.

## Verified Flow

1. Device A and Device B signed in with the same real backend account.
2. The frontend requested sync tokens through `POST /api/v1/sync/token`.
3. PowerSync connected through `/powersync/sync/stream`.
4. Device A created `Round2 final browser item 1781587911671` from Quick Add.
5. Device B saw the created item through PowerSync.
6. Device A edited the note to `Final browser note 1781587911671`.
7. Device B saw the updated note after the detail pane was fixed to refresh from synced row updates.
8. Device A completed the item.
9. Device B saw the item on Completed.
10. PostgreSQL shows the item as `completed`, `revision = 3`, with one companion `operation_history` row for `completed`.
11. Device A updated synced settings to weather city `Kyoto final continue 1781588030195`.
12. Device B saw the synced weather city in Settings.
13. Device A created `Offline final item verified 1781588232577` while the browser context was offline.
14. The offline item stayed visible locally, then uploaded after reconnection.
15. Device B saw the offline-created item after reconnection.

## Upload Evidence

The offline recovery run captured a non-empty upload:

- `POST /api/v1/sync/upload`
- `device_id`: `device-678f0a96-3830-43ef-b502-7936656bc066`
- mutation: one `items` insert for `Offline final item verified 1781588232577`
- response: `202`, accepted revision `1`

PostgreSQL evidence for the same account:

- `Round2 final browser item 1781587911671`: note `Final browser note 1781587911671`, status `completed`, revision `3`
- `Offline final item verified 1781588232577`: status `active`, revision `1`
- `operation_history`: one `completed` row with semantic idempotency key
- `user_settings`: language `en`, locale `en-US`, time zone `Asia/Tokyo`, weather city `Kyoto final continue 1781588030195`, revision `3`

## Frontend Fixes From This Pass

- Real browser planning now uses the PowerSync-backed store instead of falling back to fixtures.
- PowerSync upload mapping sends complete local rows for PATCH uploads.
- Semantic item updates include or recover companion `operation_history` rows with stable idempotency.
- Settings rows use user id as the local row identity and upload accepted `user_settings` rows.
- Settings Weather city is controlled through a local draft input but refreshes from synced settings.
- Item detail panes refresh local note editor state when the selected synced row changes.
- Quick Add is bundled with the shell so offline capture can open without fetching a lazy chunk.

## Automated Checks

- `tsc --noEmit`: passed.
- `tsc --noEmit -p tsconfig.app.json`: passed.
- `eslint .`: passed.
- `vitest run`: passed, 14 files and 57 tests.
- `vite build`: passed.

`vite build` reports an expected warning that `ItemDialogs.tsx` is both dynamically and statically imported. The static import is intentional so Quick Add remains available after the app is already loaded and the browser goes offline.

