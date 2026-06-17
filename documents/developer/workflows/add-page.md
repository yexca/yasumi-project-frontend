# Add Or Change A Page

Use this workflow when adding a new first-class page or making a meaningful change to an existing routed page.

## 1. Choose The Owning Feature Folder

- Put the page under `src/features/<feature>/`.
- Prefer keeping page-specific helpers close to that feature before extracting shared abstractions.
- Reuse `src/features/items/` only when the interaction pattern is already shared across multiple planning pages.

## 2. Build The Page Surface

- Create or update `<Feature>Page.tsx`.
- Reuse `PageFrame`, `ItemSection`, layout primitives, and shared item interactions where they already fit.
- Keep orchestration in the page and keep parsing or validation logic out of the page file.

## 3. Register Routing

- Add or update the route in `src/app/router/router.tsx`.
- Add or update route constants and navigation metadata in `src/app/router/routes.ts` when the page is part of primary navigation.
- If the page should not be a top-level nav destination, do not add it to `NAV_ITEMS`.

## 4. Connect Data Through The Right Boundary

- Read through `usePlanningData()` or feature-owned hooks.
- Write through `usePlanningMutations()` or feature-owned commands.
- Do not import direct API clients into the page.
- Do not import PowerSync schema or connector code into the page.

## 5. Add Strings And Styling

- Add user-facing copy to `src/i18n/messages.ts`.
- Keep feature-specific styling in the feature folder unless it is truly shared.
- Reuse primitives and surface rules before introducing new one-off controls.

## 6. Validate

- Add or update component tests near the feature when interaction changes.
- Run route-level or Playwright checks when navigation, layout, or multi-step behavior changes.
- Run the minimum verification listed in `testing-and-verification.md`.

## Practical Checks

- Does the page depend only on allowed layers?
- Is navigation metadata updated only if the route is a real navigation destination?
- Is the page reading shaped data rather than rebuilding raw repository logic itself?
- Are new strings localized?
