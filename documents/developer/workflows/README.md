# Workflows

This directory contains task-oriented guides for common repository work.

## Start Here

- `add-page.md`: add or extend a routed page.
- `change-data-flow.md`: change reads, writes, sync-backed state, or backend integration boundaries.
- `testing-and-verification.md`: choose the right validation depth for a change.

## Use These Guides When

- you already know the feature area you need to change
- you need a concrete execution sequence instead of architectural background
- you want to avoid reopening historical round documents for routine work

## Maintenance Rules

- Keep these guides procedural and repository-specific.
- Split a workflow when it becomes long enough that a developer cannot scan it quickly during implementation.
- If a workflow becomes historical or one-off, archive it in `../../original/` and keep only the durable process here.
