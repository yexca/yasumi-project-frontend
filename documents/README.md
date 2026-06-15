# Yasumi Frontend Documentation

`documents/` is organized around stable secondary-development guidance and round-specific delivery records.

## Directory Map

- `secondary-development/`: current frontend architecture, extension rules, and lightweight development conventions.
- `development-rounds/round-1-original-development/`: archived first-round implementation records.
- `development-rounds/round-2-real-sync/`: active second-round guidance for real sync, data-source migration, write mapping, verification, and focused structure cleanup.

## Suggested Reading Order

1. Read `secondary-development/README.md` for the current project shape and dependency boundaries.
2. Read `development-rounds/round-2-real-sync/README.md` before doing second-round work.
3. Use `development-rounds/round-1-original-development/` only when historical context or first-round acceptance evidence is needed.

## Maintenance Rules

- Keep durable architecture conventions in `secondary-development/`.
- Keep delivery-specific instructions inside the matching `development-rounds/round-*` folder.
- Do not make a round document depend on another round for active instructions; copy and update still-relevant guidance into the current round.
- When adding a new document, update the closest folder index so the tree remains self-explanatory.
