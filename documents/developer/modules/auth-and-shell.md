# Auth And Shell

This module note covers the signed-in shell entry path and the auth-to-sync handoff.

## Files To Know

- `src/features/auth/AuthProvider.tsx`
- `src/features/auth/AuthPage.tsx`
- `src/features/auth/AuthGate.tsx`
- `src/features/auth/useSessionRefresh.ts`
- `src/features/auth/useOnlineState.ts`
- `src/components/primitives/Field.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/layout/useShellClock.ts`
- `src/components/layout/useWeatherSummary.ts`
- `src/features/sync/useSyncStatus.ts`

## Current Responsibility Split

- `AuthProvider.tsx` owns session persistence, login/register/logout commands, refresh policy, and offline-aware auth status.
- `AuthPage.tsx` owns signed-out entry, auth-mode switching, registration field validation, and pre-auth language switching.
- `AuthGate.tsx` decides whether the app shows the auth surface or the routed shell.
- `Field.tsx` owns shared field framing such as label rendering, required markers, and inline error presentation.
- `AppShell.tsx` owns signed-in layout composition, navigation, Quick Add entry, shell utilities, and sync-status display.
- `useSyncStatus.ts` translates auth, runtime, upload, and planning signals into one shell-facing status model.

## Current Risks

- `AuthProvider.tsx` already combines persistence, status derivation, and user account actions.
- `AppShell.tsx` is an integration-heavy file that mixes navigation, shell utilities, and action entry points.
- It is easy to accidentally move sync or weather behavior into shell rendering code without keeping the ownership boundary clear.

## Safe Change Pattern

- Keep auth state production in `auth/`.
- Keep registration-only field rules such as password confirmation in `AuthPage.tsx` rather than `AuthProvider.tsx`.
- Keep reusable field labeling and required indicators in `components/primitives/Field.tsx`.
- Keep PowerSync lifecycle in `sync/`.
- Keep shell rendering in `components/layout/`.
- Keep utility hooks such as weather or clock independent from sync behavior.
- When adding shell actions, check whether they are route-local, feature-local, or truly shell-wide before placing them in `AppShell.tsx`.

## Current UX Rules

- Registration must visually mark required fields and require password entry twice before sending the request.
- Local validation errors on the auth page should stop submission before any network call.
- Shell sync status should reflect real runtime states immediately for offline, failure, blocked, and rejection cases.
- A brief `uploading -> synced` transition may stay visible for a short hold window to avoid status flicker, but this smoothing must not delay error or offline feedback.

## Practical Boundary Checks

- Does the shell render status, or is it trying to compute transport logic itself?
- Does auth expose a stable session model, or is it learning planning details?
- Does a new utility belong in the shell, or is it really feature-specific?
