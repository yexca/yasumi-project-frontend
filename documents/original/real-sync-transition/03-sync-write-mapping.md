# Sync Write Mapping

This document defines how major frontend actions should map into local PowerSync writes and backend-facing sync mutations during Round 2.

## General Rules

- Synced tables in scope are `items`, `areas`, `recurring_task_templates`, `operation_history`, and `user_settings`.
- `rejected_write_context` is local-only recovery state and must not upload.
- Device-local UI state must not be uploaded as synced data.
- Semantic changes to `status`, `deleted_at`, `archived_at`, or `hidden_reason` must preserve action intent.
- Ordinary semantic actions should use idempotency keys shaped like `action:{user_id}:{device_id}:{client_action_id}` unless the backend contract changes.

For every migrated write, answer these questions before implementation:

1. Which synced local tables change?
2. Which changes are semantic?
3. What upload mutations are expected?
4. What backend validation rule can reject them?

## Create Item

User actions:

- Quick Add capture.
- Item creation from a dialog or editor.

Local write expectation:

- Insert one `items` row.
- Set required item fields according to `item_type`.
- Set metadata such as `created_by_device_id`, `updated_by_device_id`, and client timestamps.

Upload expectation:

- One `items` insert or upsert mutation with a complete row payload.

Backend acceptance notes:

- `user_id` must match the authenticated scope or be normalized by the backend.
- Title and item-shape validation must pass.
- No `operation_history` row is required if no semantic status or tombstone field changed.

## Edit Item Scalar Fields

User actions:

- Change title, note, area, importance, effort, or dates that do not imply a semantic transition.

Local write expectation:

- Update the existing `items` row.

Upload expectation:

- One `items` update or upsert mutation carrying the updated row state required by the adapter behavior.

Backend acceptance notes:

- The resulting item shape must remain valid.
- No `operation_history` row is required when `status`, `deleted_at`, `archived_at`, and `hidden_reason` are unchanged.

## Complete Item

Local write expectation:

- Update `items.status` to `completed`.
- Insert one `operation_history` row with `event_type = completed`.

Upload expectation:

- One semantic `items` mutation.
- One `operation_history` insert mutation.

Backend acceptance notes:

- The backend validates the transition against accepted server state.
- The operation event must match the status transition.
- Duplicate retries must converge through idempotency.

## Reopen or Restore Item

Local write expectation:

- Update the item row to the restored active state.
- Clear or update tombstone and archive fields according to the action.
- Insert one matching `operation_history` row.

Upload expectation:

- One semantic `items` mutation.
- One `operation_history` insert mutation.

Backend acceptance notes:

- The operation event must match the exact restored state.
- Restore behavior for archived or deleted metadata must remain explicit.

## Postpone Item

Local write expectation:

- Update relevant scheduling, due, or review date fields.
- If the action changes semantic status, insert a matching `operation_history` row.
- Preserve meaningful old and new values in operation metadata.

Upload expectation:

- One `items` mutation.
- One `operation_history` insert when semantic action intent is required.

Backend acceptance notes:

- The backend validates semantic transitions and due-postponed activation rules where applicable.

## Hold, Abandon, Archive, Delete, and Restore

Local write expectation:

- Update `status`, `archived_at`, `deleted_at`, or `hidden_reason` as appropriate.
- Insert a matching `operation_history` row.

Upload expectation:

- One semantic `items` mutation.
- One `operation_history` insert mutation.

Backend acceptance notes:

- Physical delete is not allowed.
- Soft delete remains a row update plus operation-history append.
- Event type and resulting semantic state must agree.

## Area Changes

Create or edit area:

- Insert or update one `areas` row.
- Preserve ownership, timestamps, and device metadata.

Delete area:

- Update or remove the `areas` row according to the existing synced-table behavior.
- Update affected `items` rows when the user chooses to delete or move affected work.
- Insert `operation_history` rows for affected item semantic changes when required.

Backend acceptance notes:

- Ownership and item-shape validation apply to every affected row.
- Avoid frontend-only shortcuts that hide item-state consequences from the backend.

## Recurring Templates and Instances

Create or update template:

- Insert or update one `recurring_task_templates` row with valid recurrence fields.

Complete or skip instance:

- Update the concrete instance item.
- Insert recurrence action `operation_history`.
- Generate and insert the next instance where recurrence has not ended.
- Insert the generation operation row where the contract requires it.

Backend acceptance notes:

- Recurrence shape, frequency, interval, end type, and counters must pass validation.
- Idempotency and generated-sequence constraints must converge duplicate actions safely.

## Synced User Settings

Synced settings include language, locale, week start, time zone, date and time formats, lookahead days, deadline awareness days, and weather city when those are intended to converge across devices.

Local write expectation:

- Upsert one `user_settings` row.

Upload expectation:

- One `user_settings` update or upsert mutation.

Backend acceptance notes:

- Settings row identity is scoped by authenticated `user_id`.
- Device-local preferences such as theme mode and background assets must stay out of `user_settings` unless the sync contract intentionally changes.

## Rejected-Write Context

Purpose: preserve row-level recovery information when the backend rejects a mutation.

Local write expectation:

- Insert or update `rejected_write_context`.
- Preserve affected row, table name, action, client action ID, idempotency key, backend error code, field errors, and retryability.

Upload expectation:

- None. This table is local-only.
