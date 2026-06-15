# Verification Playbook

This playbook verifies the frontend side of Round 2 from the root deployment repository.

Target outcome: a user action on Device A becomes accepted backend state and appears on Device B through PowerSync.

## Environment

- Repository: `yasumi-project-deploy`
- Startup path: root `docker compose up -d --build`
- Frontend URL: `http://127.0.0.1:7650`

Use two independent browser sessions:

- Device A: normal browser window.
- Device B: private window or a different browser profile.

## Preflight

Before testing app behavior:

- Confirm all core services are running: `postgres`, `mongo`, `powersync`, `migrate`, `api`, and `frontend`.
- Open the frontend URL successfully.
- Confirm backend readiness reports database and sync as available.
- Confirm frontend proxy paths `/api` and `/powersync` are reachable through the frontend origin.

If preflight fails, do not continue to application-level acceptance.

## Scenario 1: Sign-In and Runtime Sync Connection

Steps:

1. Open Device A at the frontend URL.
2. Register or sign in with a test account.
3. Observe network activity after sign-in.

Expected results:

- Device A requests `POST /v1/sync/token`.
- Device A establishes a real PowerSync connection through `/powersync`.
- The shell sync status does not remain in a fixture-only state.

## Scenario 2: Create Item on Device A, Observe on Device B

Steps:

1. Sign in on Device B with the same account.
2. On Device A, create a new item.
3. Wait for sync to complete.
4. Observe Device B.

Expected results:

- Device A writes the new row into the local PowerSync database.
- Upload contains a non-empty mutation batch.
- The backend accepts the write.
- The row appears in PostgreSQL synced tables.
- Device B receives the created item without fixture-dependent refresh logic.

## Scenario 3: Edit Item on Device A, Observe Update on Device B

Steps:

1. On Device A, edit the title or note of an existing item.
2. Wait for catch-up.
3. Observe Device B.

Expected results:

- Device A sends a real update mutation.
- The backend accepts the update.
- Device B shows the updated title or note.

## Scenario 4: Semantic Action Propagation

Pick at least one semantic item action:

- complete
- postpone
- archive
- restore
- delete

Steps:

1. Perform the semantic action on Device A.
2. Observe upload behavior.
3. Observe Device B after catch-up.

Expected results:

- The frontend writes both the semantic item change and any required companion `operation_history` row.
- The backend accepts the action as a valid transition.
- Device B receives the accepted semantic state.

## Scenario 5: Synced Settings Convergence

Steps:

1. On Device A, change one setting intended to sync, such as language or weather city.
2. Wait for catch-up.
3. Observe Device B.

Expected results:

- The setting writes into synced `user_settings`.
- Device B receives the setting change if that setting is defined as synced.
- Device-local preferences such as theme or background do not unexpectedly overwrite across devices.

## Scenario 6: Offline Create and Reconnect

Steps:

1. On Device A, force offline mode.
2. Create or edit an item while offline.
3. Reconnect the device.
4. Observe Device B.

Expected results:

- Device A keeps the local change visible while offline.
- Sync status reflects offline or pending state accurately.
- Reconnection resumes sync automatically.
- Device B eventually receives the accepted change.

## Scenario 7: Rejected Write Handling

Use a write known to violate backend validation, such as an invalid status transition, invalid item shape, or invalid synced setting value.

Steps:

1. Trigger the invalid write on Device A.
2. Observe upload result and UI recovery state.

Expected results:

- The backend rejects the write with the stable API error shape.
- The frontend does not silently claim the write synced successfully.
- Row-level rejected context is preserved for recovery.
- Sync status reflects rejection distinctly from offline or generic transport failure.

## Evidence to Capture

For each scenario, capture lightweight evidence:

- whether `/v1/sync/token` was requested
- whether `/v1/sync/upload` payloads were empty or non-empty
- whether `/powersync` connected
- what shell sync state was visible
- whether PostgreSQL received the accepted row
- whether Device B displayed the expected result

## Minimum Pass Requirement

Round 2 should not be marked complete unless all of the following are true in one reproducible environment:

1. Device A signs in and connects to PowerSync.
2. Device A creates or edits real synced data.
3. The backend accepts a non-empty mutation batch.
4. Device B sees the accepted result through sync.
5. At least one offline or rejected-write recovery path is verified.
