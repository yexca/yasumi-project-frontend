# Change Data Flow

Use this workflow when changing planning reads, planning writes, synced settings, or backend-facing integration boundaries.

## 1. Classify The Change

Decide which category applies before editing:

- read-path change
- write-path change
- sync status change
- auth-session change
- synced setting versus device-local preference change

This decision tells you which module notes to read next.

## 2. Pick The Right Boundary

- Backend HTTP and DTO parsing belong in `src/repositories/direct-api/`.
- PowerSync schema, connector, and local database setup belong in `src/repositories/powersync/`.
- Read-model shaping belongs in `src/repositories/local-db/readModels.ts`.
- Planning read and write orchestration belongs in `src/features/planning/`.
- Auth session lifecycle belongs in `src/features/auth/`.
- Shell-facing sync status composition belongs in `src/features/sync/useSyncStatus.ts`.

Do not skip layers by letting pages or layout components own transport details.

## 3. Decide Whether State Is Synced

Ask this explicitly:

- Should the value converge across devices for the same signed-in user?
- Should it remain local to one browser or device?

Current rule of thumb:

- synced: user settings, items, areas, recurring templates, operation history
- local only: theme mode, background assets, pending context, rejected context, device identity

If the answer is unclear, pause for a product decision before implementation.

## 4. Preserve Validation Placement

- Keep schema and contract parsing near `domain/` or repository boundaries.
- Keep status transition checks in `src/domain/transitions/status.ts`.
- Keep idempotency-key behavior in `src/domain/idempotency.ts`.
- Keep user-facing error translation out of transport code.

## 5. Preserve Write Semantics

For semantic item actions:

- update the item row
- append `operation_history` when the action changes semantic state
- keep pending and rejected local context accurate

For settings:

- keep synced settings in `user_settings`
- keep local visual preferences out of synced rows unless the contract intentionally changes

## 6. Validate At The Right Level

- repository or parsing change: unit tests
- planning write behavior change: planning store tests
- sync runtime change: sync runtime tests plus practical end-to-end verification where possible
- user-visible sync behavior: shell or Playwright verification

Use `../../original/real-sync-transition/` only when you need historical migration rationale or evidence.
