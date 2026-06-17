# Developer Documentation

`developer/` is the current documentation layer for the Yasumi frontend repository. Start here for any present-day development work.

## What This Section Covers

- how the current repository is organized
- how runtime data flows through auth, sync, planning, and UI layers
- how to add or change behavior without breaking existing boundaries
- which modules need extra care
- what standards to follow when changing code or documents

## Reading Order

For a new contributor, use this order:

1. `getting-started.md`
2. `architecture/README.md`
3. the most relevant file in `workflows/`
4. the matching module note in `modules/`
5. `standards/README.md` before opening a larger refactor or cross-cutting change

## Structure

- `getting-started.md`: shortest path from local setup to first safe change.
- `architecture/`: repository layers, runtime composition, and data boundaries.
- `workflows/`: task-oriented guides such as adding a page, changing data flow, or verifying behavior.
- `modules/`: current notes for high-complexity areas that deserve focused context.
- `standards/`: conventions for structure, testing, and documentation maintenance.

## How To Use This Folder

- Read `architecture/` when you need to understand why code lives where it does.
- Read `workflows/` when you already know what you need to change.
- Read `modules/` before touching planning, sync, auth, shell, or item interaction code.
- Read `standards/` when making cross-module changes or adding new documentation.

## Maintenance Rules

- Keep these files present-tense and repository-specific.
- Rewrite durable rules here instead of pointing contributors to archived phase notes.
- When a document stops matching the current code, update or remove it in the same change set as the code change.
- If a guide becomes phase-specific or acceptance-specific, move it to `../original/` and replace it here with the stable rule that remains.
