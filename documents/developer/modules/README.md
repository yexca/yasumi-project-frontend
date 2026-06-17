# Modules

This directory documents the repository areas that currently carry the most coordination risk.

## Current Focus Areas

- `planning-and-sync.md`: planning provider boundary, PowerSync-backed store, and write semantics.
- `auth-and-shell.md`: auth lifecycle, shell composition, and sync-status presentation.
- `item-interactions.md`: shared item list, detail pane, autosave, and action wiring.

## When To Read

- before changing a high-responsibility file
- before splitting a module that already combines UI and orchestration
- before adding cross-cutting behavior that could leak across boundaries

## Maintenance Rules

- Keep these notes specific to the current code, not aspirational architecture.
- Name the actual hotspot files.
- If a hotspot is no longer special, simplify or remove the note instead of letting it become stale.
