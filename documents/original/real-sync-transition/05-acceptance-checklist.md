# Acceptance Checklist

Use this checklist to decide whether Round 2 is complete for the frontend repository.

The default verification environment is the root deployment repository using Docker Compose.

## A. Environment and Stack Readiness

- [ ] The root stack starts `postgres`, `mongo`, `powersync`, `migrate`, `api`, and `frontend`.
- [ ] The frontend is reachable at `http://127.0.0.1:7650`.
- [ ] Backend readiness reports both database and sync dependencies as available.
- [ ] PowerSync is reachable through the frontend proxy path `/powersync`.

## B. Sign-In and Sync Runtime

- [ ] A signed-in frontend session requests `POST /v1/sync/token`.
- [ ] The sync token request uses the authenticated user scope and active device ID.
- [ ] The frontend establishes a real PowerSync connection after sign-in.
- [ ] Sign-out disconnects the sync runtime cleanly.
- [ ] Expired or blocked auth state is surfaced distinctly from generic offline state.

## C. Local Data Source

- [ ] Planning pages read from the PowerSync local database instead of fixture arrays.
- [ ] `areas` render from synced local rows.
- [ ] `items` render from synced local rows.
- [ ] `recurring_task_templates` render from synced local rows where applicable.
- [ ] `operation_history` is available to derived read models that depend on it.
- [ ] Synced `user_settings` are read from the local synced store.

## D. Write Path

- [ ] Creating an item writes to the local PowerSync database.
- [ ] Editing an item writes to the local PowerSync database.
- [ ] At least one semantic item action writes valid sync metadata.
- [ ] Settings updates write through the synced path instead of local-memory-only state.
- [ ] Sync upload requests contain real, non-empty mutations.
- [ ] Backend-accepted writes appear in PostgreSQL synced tables.

## E. Backend Contract Compatibility

- [ ] Uploaded mutations match the synced table schema expected by the backend.
- [ ] Semantic writes include companion `operation_history` rows or equivalent observed-state metadata where required.
- [ ] The backend accepts valid ordinary edits.
- [ ] The backend rejects invalid semantic transitions with the stable API error shape.
- [ ] Duplicate semantic actions converge safely through idempotency behavior.

## F. Sync Status UX

- [ ] The shell distinguishes signed-out or auth-blocked, disconnected, uploading, rejected, and caught-up states.
- [ ] Offline state is not conflated with validation rejection.
- [ ] Transport failure is not conflated with backend validation rejection.
- [ ] A successful catch-up state is visible after pending writes are synchronized.
- [ ] Rejected rows can be identified with row-level recovery context.

## G. Multi-Device Behavior

- [ ] Device A creates an item and Device B sees it after PowerSync catches up.
- [ ] Device A edits an item and Device B sees the updated values.
- [ ] Device A performs at least one semantic action and Device B receives the resulting accepted state.
- [ ] Synced settings updated on Device A become visible on Device B where those settings are intended to sync.

## H. Offline and Recovery Behavior

- [ ] A device can create or edit local rows while offline.
- [ ] Pending local writes remain visible after temporary disconnection.
- [ ] Reconnection resumes sync without manual data reset.
- [ ] Invalid writes surface recovery information instead of silently disappearing.

## I. Structure and Maintainability

- [ ] Frontend sync integration is not implemented by further expanding the existing monolithic planning provider.
- [ ] Shell sync logic is not permanently entangled with weather, clock, and layout rendering concerns.
- [ ] Auth exposes session state without owning page data migration.
- [ ] Settings have an explicit synced-versus-device-local boundary.
- [ ] Fixture-only code is removed from the signed-in main path or moved behind explicit test or development helpers.

## J. Regression Guardrails

- [ ] Frontend tests cover token fetch, connection lifecycle, local database queries, or equivalent sync-runtime behavior.
- [ ] Frontend tests cover at least one accepted mutation path and one rejected mutation path.
- [ ] Existing page and domain tests remain green.
- [ ] A documented end-to-end verification run exists for the root deployment stack.
