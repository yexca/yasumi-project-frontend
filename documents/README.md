# Yasumi Frontend Documentation

`documents/` uses a two-layer structure:

- `developer/`: the current development documentation for this repository.
- `original/`: historical source documents, verification records, and round artifacts kept for traceability.

Do not treat `original/` as the current engineering standard. If a rule still matters today, it must be rewritten into `developer/`.

## Reading Order

For a new contributor:

1. Read `developer/README.md`.
2. Read `developer/getting-started.md`.
3. Read `developer/architecture/README.md`.
4. Jump to the relevant task guide in `developer/workflows/`.
5. Use `developer/modules/` only for the module you are changing.

Use `original/` only when you need one of these:

- why a feature landed in its current shape
- historical verification evidence
- past rollout, release, or migration context

## Directory Map

- `developer/README.md`: current documentation entry.
- `developer/getting-started.md`: shortest path from clone to first safe change.
- `developer/architecture/`: repository shape, runtime flow, and data boundaries.
- `developer/workflows/`: task-oriented implementation guides.
- `developer/modules/`: high-complexity module notes.
- `developer/standards/`: coding, testing, and documentation conventions.
- `original/README.md`: archive entry and historical reading map.

## Maintenance Rules

- Put present-tense guidance in `developer/`.
- Put historical plans, verification notes, acceptance records, and release evidence in `original/`.
- When code behavior changes, update the closest `developer/` document in the same change set.
- When a major phase ends, archive its stage-specific material in `original/` instead of leaving it in `developer/`.
- Every directory in `documents/` must keep a `README.md` or equivalent entry file that explains what belongs there.
