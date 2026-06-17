# Testing And Verification

Use this guide to choose the right level of validation for a change.

## Default Command Set

Use the project-pinned runtime from `env/`:

```powershell
.\env\npm.cmd run typecheck
.\env\npm.cmd run lint
.\env\npm.cmd run test
.\env\npm.cmd run test:component
.\env\npm.cmd run build
```

Add Playwright when route-level or end-to-end behavior changes:

```powershell
.\env\npm.cmd run test:e2e
```

## Match Verification To Change Type

- `domain/`, parser, DTO, or validation change: run unit tests plus typecheck.
- feature interaction change: run nearby unit or component tests plus typecheck.
- shell, route, or navigation change: run component tests and Playwright when practical.
- sync-runtime or planning-store change: run unit tests, component tests, build, and the most relevant browser verification.
- documentation-only change: verify links, paths, and reading order manually.

## High-Risk Areas

Increase verification when touching:

- `src/features/planning/usePlanningData.tsx`
- `src/features/planning/useSyncedPlanningStore.ts`
- `src/features/sync/PowerSyncRuntimeProvider.tsx`
- `src/features/sync/useSyncStatus.ts`
- `src/features/auth/AuthProvider.tsx`
- `src/components/layout/AppShell.tsx`
- `src/features/items/ItemList.tsx`

## Manual Verification Prompts

Use these checks when the change affects live behavior:

- Can a signed-in user still reach the expected page?
- Does the shell show a believable sync state?
- Do item actions still update list and detail surfaces coherently?
- If settings changed, is the synced-versus-local boundary still correct?
- If route structure changed, does mobile navigation still make sense?

## Documentation Maintenance

When code behavior changes, verify these in the same pass:

- the nearest `developer/` workflow still matches the code
- any module hotspot note still reflects the actual ownership boundary
- no current rule still points contributors into `original/` for routine work
