# Frontend Verification - 2026-06-16

## Automated Checks

- `tsc --noEmit`: passed.
- `tsc --noEmit -p tsconfig.app.json`: passed.
- `eslint .`: passed.
- `vitest run`: passed, 14 files and 57 tests.
- `vite build`: passed.

## Real Backend Checks

- `GET http://127.0.0.1:7659/healthz`: `{"status":"ok"}`.
- `GET http://127.0.0.1:7659/readyz`: database and sync ready.
- Registered a real test account through `POST /v1/auth/register`.
- Requested `POST /v1/sync/token` with `device_id=codex-device-round2` and `client_version=0.1.0`.
- Received a sync token scoped to the authenticated `user_id`.
- Sent a non-empty `POST /v1/sync/upload` mutation batch containing one `items` insert.
- Backend accepted the write with revision `1`.
- PostgreSQL row check confirmed the inserted item in `items`.

## Partial Scope Notes

- The frontend now removes the old empty upload helper and routes upload through the PowerSync connector mapping.
- The app provider tree installs the PowerSync runtime before the planning provider, so real browser runtime can use PowerSync local reads and writes.
- Component tests still use the fixture fallback because the test PowerSync mock does not implement the full watched-query runtime.
- Multi-device browser propagation, offline replay, and rejected-write UI recovery still need a manual browser pass against the running frontend.
