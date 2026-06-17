# Code Organization Standards

These are the current placement and dependency rules for this repository.

## Layering Rules

- `app` composes the application; it should not own feature business rules.
- `features` own user-facing behavior and may depend on `components`, `domain`, `repositories`, `i18n`, and `styles`.
- `components` provide reusable UI and should avoid feature-specific business logic.
- `repositories` own transport, persistence, and query boundaries.
- `domain` owns shared rules and should stay React-free.

## Practical Rules

- Do not call backend clients directly from pages.
- Do not put PowerSync connector or schema logic in UI files.
- Do not put DTO parsing in presentation components.
- Do not add a generic `services/` dumping ground when an existing layer already has a clear owner.
- Do not put synced user state into local-storage helpers unless that split is deliberate and documented.

## Reuse Rules

- Reuse primitives before creating new one-off controls.
- Reuse item interaction surfaces before rebuilding list behavior per page.
- Extract shared logic only when it is truly shared or when one file becomes hard to reason about.

## Text And Error Rules

- Put user-facing strings in `src/i18n/messages.ts`.
- Keep backend diagnostic payloads out of direct UI copy.
- Translate stable error codes through i18n-aware boundaries rather than inline string building.

## Commit Naming

Use:

```text
action(module): summary
```

Examples:

- `docs(documents): rebuild developer documentation structure`
- `refactor(sync): narrow shell status composition`
