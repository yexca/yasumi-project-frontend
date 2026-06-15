# Yasumi Frontend Documentation

`documents/` has been reorganized into three independent areas so later handoff and iteration stay clear:

- `original-development/`: raw development-period records, acceptance notes, release checklist, and performance verification.
- `secondary-development/`: onboarding and extension notes for continued development on the current frontend.
- `architecture-optimization/`: structure review and lightweight optimization guidance aimed at higher cohesion and lower coupling.

## Suggested Reading Order

1. Read `secondary-development/README.md` for current architecture, boundaries, and extension conventions.
2. Read `architecture-optimization/README.md` before larger refactors or module extraction work.
3. Use `original-development/README.md` when you need historical phase context, acceptance evidence, or release constraints.

## Maintenance Rules

- Keep historical records in `original-development/` and avoid rewriting them as living docs.
- Keep current-state handoff docs in `secondary-development/`.
- Keep future-oriented refactor proposals in `architecture-optimization/`.
- When adding a new document, prefer updating the closest subfolder index so the tree remains self-explanatory.
