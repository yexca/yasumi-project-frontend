# Frontend Migration Plan

This plan converts the current fixture-first frontend into a real PowerSync-backed local-first frontend.

Do not try to replace the whole data flow in one rewrite. Each phase should leave the app understandable and testable.

## Phase A: Prepare Sync-Friendly Boundaries

Objective: make room for real sync without expanding the existing monoliths.

Tasks:

- Extract planning provider wiring away from reducer logic, persistence helpers, selectors, and fixture bootstrap.
- Extract shell sync side effects away from weather, clock, navigation, and layout composition.
- Extract auth storage, online state, and session refresh policy away from auth command handlers where needed.
- Keep all public app behavior unchanged during these preparatory splits.

Exit criteria:

- Sync lifecycle work has a clear provider or hook boundary.
- Planning reads and writes can be redirected without editing unrelated page composition.
- The shell can consume sync status without owning upload mechanics.

## Phase B: Introduce PowerSync Runtime Lifecycle

Objective: make the authenticated app join the real sync stream.

Tasks:

- Instantiate the PowerSync local database once per app runtime.
- Add a PowerSync provider or equivalent runtime boundary to the app provider tree.
- Request `/v1/sync/token` after sign-in using the active session, device ID, and client version.
- Connect through the existing connector to `/powersync`.
- Disconnect and clean up user-scoped runtime state on sign-out.
- Support reconnect after transient network loss.
- Expose connection state through a dedicated sync-status boundary.

Exit criteria:

- A signed-in user triggers a sync-token request.
- The frontend establishes a real PowerSync connection.
- Sign-out disconnects sync cleanly.
- Connection state is observable without reading source code.

## Phase C: Move Reads to Local Synced Tables

Objective: make page reads come from the PowerSync local database instead of fixture arrays.

Tasks:

- Create narrow repository or hook boundaries over local synced tables.
- Reuse existing `src/repositories/local-db/readModels.ts` derivation logic where possible.
- Migrate simpler direct-row views before derived recommendation-heavy views.
- Keep local-first responsiveness while changing the backing store.

Recommended page order:

1. Settings
2. Areas
3. Inbox
4. Upcoming
5. Deadlines
6. Idea Pool
7. Completed and Archive
8. Today and recommendation-heavy views

Exit criteria:

- Main pages render from local synced rows.
- A fresh account no longer depends on hard-coded fixture rows.
- Reloading the app preserves locally synchronized state.

## Phase D: Move Writes to PowerSync CRUD Transactions

Objective: make user actions produce real local database writes and backend-valid uploads.

Tasks:

- Replace in-memory mutation queues with local PowerSync CRUD transactions.
- Ensure inserted and updated rows match the schema in `src/repositories/powersync/schema.ts`.
- Preserve semantic intent for status, archive, delete, restore, postpone, and recurring actions.
- Insert companion `operation_history` rows when the backend contract requires them.
- Store rejected-write recovery context in the local-only `rejected_write_context` table when needed.

Exit criteria:

- Create and edit flows write to the local PowerSync database.
- Uploads contain non-empty mutations.
- Valid writes are accepted by the backend.
- Rejected writes keep enough row-level context for recovery.

## Phase E: Replace Simulated Sync Status

Objective: make shell status reflect the real sync pipeline.

Tasks:

- Derive status from auth state, connector state, upload activity, rejection state, and catch-up state.
- Stop using the old in-memory pending array as the primary truth.
- Distinguish signed-out or auth-blocked, disconnected, uploading, rejected, and caught-up states.
- Keep transport failure distinct from backend validation rejection.

Exit criteria:

- Status labels are trustworthy evidence of real runtime state.
- An accepted empty upload cannot masquerade as full application sync.

## Phase F: Split Synced and Device-Local Settings

Objective: prevent settings from converging accidentally or staying local accidentally.

Tasks:

- Store synced settings in `user_settings`.
- Keep theme mode, background assets, and device-only display preferences local unless intentionally added to the sync contract.
- Ensure synced settings writes use the same local database and upload path as other synced data.

Exit criteria:

- Synced settings replicate across devices.
- Device-local preferences remain explicitly local.
- No setting is written to both local storage and synced storage without a clear precedence rule.

## Phase G: Remove Fixture-Only Mainline Paths

Objective: retire the fake runtime from the primary user experience.

Tasks:

- Remove fixture bootstrap from the signed-in main path.
- Move sample data behind explicit tests, stories, or development helpers if still useful.
- Remove code that exists only to simulate pending sync behavior in memory.

Exit criteria:

- The signed-in app no longer depends on fixture rows.
- Tests still have explicit fixture helpers where needed.
