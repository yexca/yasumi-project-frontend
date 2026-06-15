# Extension Playbook

Use this playbook when implementing a new capability without disturbing the current layering.

## Add A New Page

1. Create `src/features/<feature>/<Feature>Page.tsx`.
2. Reuse `PageFrame`, layout primitives, and shared item components where possible.
3. Register the route in `src/app/router/router.tsx`.
4. Add navigation metadata only if it is a first-class navigation entry.
5. Add unit or component tests near the feature.

## Add A New Mutation

1. Define or reuse the domain rule first.
2. Add mutation logic through planning state or the future owning repository boundary.
3. Keep idempotency and validation close to mutation assembly.
4. Keep user-visible feedback in feature UI, not inside domain helpers.

## Add A New Backend Integration

1. Add DTO parsing in `src/repositories/direct-api/`.
2. Add repository interface updates in `src/repositories/local-db/repositoryTypes.ts` or the relevant repository module.
3. Expose consumption through a hook/provider instead of page-level client calls.
4. Localize user-facing error mapping through i18n-aware boundaries.

## Add Shared UI

1. Put low-level controls in `src/components/primitives/`.
2. Put workflow-shaped shared UI in `src/components/items/` or `src/components/layout/`.
3. Avoid feature-specific business assumptions in shared components.

## Add Tests

- Pure rule changes: domain or reducer tests.
- UI interactions: component tests.
- Navigation or route workflow changes: Playwright coverage when risk justifies it.
