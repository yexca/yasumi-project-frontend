# Second Acceptance Verification

Date: 2026-06-14

## Scope

- Mobile Quick Add uses the raised compact plus button only.
- Login copy spacing has a calmer vertical rhythm.
- Inbox item completion is disabled while classify/edit/review remain available.
- Completion undo toast remains available for completable items.
- Settings include display name, password change, and weather city.
- Header display name updates from the authenticated profile response.
- Header weather reads the selected city and displays a compact summary.
- Detail pane renders markdown content before status and metadata.
- Dialog surfaces remain light in dark mode.
- Connected sync state uses a healthy online indicator.

## Automated Coverage

- `src/features/settings/SettingsPage.test.tsx` covers profile, password, and weather city controls.
- `src/features/items/phase04-pages.test.tsx` covers Inbox completion restriction, markdown-first detail order, and header weather rendering.

## Manual Docker Check

Use the backend root `docker-compose.example.yml` with the frontend profile when both repositories are adjacent. Confirm profile and weather API calls through the running API container, then repeat the manual checklist that existed in the external `dev_documents` workspace at the time of this verification.
