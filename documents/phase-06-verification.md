# Phase 06 Verification

Date: 2026-06-14

Rechecked: 2026-06-14 06:34 JST

First manual acceptance revision: 2026-06-14 JST

## Scope

Implemented and verified the i18n, settings, timezone display, and local visual preference phase
against `../dev_documents/frontend_coding_guide/07-phase-06-i18n-settings-and-backgrounds.md`.

## Implemented

- Wired global translations to synced user settings instead of one-time browser language detection.
- Added browser-language normalization for English, Simplified Chinese, Japanese, and English fallback.
- Added local-first settings mutation flow with persistence, pending sync state, and rejected context for invalid settings.
- Added settings controls for language, locale, week start, app timezone, fixed date display, local date-time preview, time display, default time mode, and recommendation windows.
- Added app-timezone-aware top-bar date display.
- Added fixed `YYYY-MM-DD` date-only and `YYYY-MM-DD HH:mm:ss` local date-time helpers.
- Added localized backend error-code and field-key mapping without rendering diagnostic backend messages.
- Kept theme mode and background settings local-only, with custom image assets stored outside localStorage.
- Expanded unit/component tests for language fallback, error mapping, date/time display, timezone validation, settings controls, and background image validation.

## Acceptance Notes

- Unsupported browser languages fall back to English.
- `zh-CN`, `zh-SG`, Simplified Chinese tags, Japanese tags, and English tags resolve to supported MVP languages.
- User-selected language updates visible app copy immediately and persists through the local settings row.
- Date-only values display as `YYYY-MM-DD`.
- Full local date-time preview displays as `YYYY-MM-DD HH:mm:ss` in the configured app timezone.
- Invalid timezone edits are rejected before saving and use localized UI copy.
- Background assets remain local-only and are stored through IndexedDB, while small visual preferences remain in localStorage.
- Background-off mode keeps solid surfaces; background-on surface behavior remains gated by the theme root background state.

## Verification Commands

- `.\env\npm.cmd run typecheck`
- `.\env\npm.cmd test`
- `.\env\npm.cmd run test:component`
- `.\env\npm.cmd run lint`
- `.\env\npm.cmd run format`
- `.\env\npm.cmd run build`
- `.\env\npm.cmd run test:e2e`

## Browser Verification

- Reused the local dev server at `http://127.0.0.1:5173`.
- Opened `http://127.0.0.1:5173/settings` in the in-app browser.
- Verified settings controls and date/time previews rendered.
- Switched the language to Simplified Chinese and confirmed the Settings heading and labels updated immediately.
- Verified invalid timezone input shows localized validation copy after the field loses focus.
- Verified no horizontal overflow on the default desktop viewport.
- Checked a 390px mobile viewport and confirmed no horizontal overflow.
- Verified no browser console errors during the interaction.
- Restored the browser language setting to English after verification.

## Results

| Check                       | Result                      |
| --------------------------- | --------------------------- |
| TypeScript strict typecheck | Passed                      |
| Unit/component tests        | Passed, 12 files / 45 tests |
| Component test project      | Passed, 7 files / 22 tests  |
| Lint                        | Passed                      |
| Format check                | Passed                      |
| Production build            | Passed                      |
| E2E smoke/layout tests      | Passed, 2 tests             |
| Browser interaction check   | Passed                      |

## Phase Boundary

Localization, settings editing, timezone display, and local visual preference behavior are complete
enough for Phase 07 hardening. Full authenticated settings sync convergence and backend-driven
account/session flows remain later integration work.

## First Manual Acceptance Revision

- Added authentication gate with login and registration before the normal app shell.
- Preserved local app access when an existing local session is available offline, with sync status showing offline or blocked state.
- Removed page titles from the global header; page names remain in the main page content.
- Moved desktop Quick Add to the far-left navigation area and added a mobile bottom add button.
- Added Today-page Quick Add defaults so low-confidence captures become date tasks scheduled for today.
- Changed item rows to use a left-side completion/reopen control, right-side item source/type icon, row selection, and undo completion toast.
- Added a desktop right-side item detail pane that follows row selection and can be closed.
- Simplified Settings by hiding fixed/derived display fields and replacing free-form timezone entry with Shanghai, Tokyo, London, and New York choices.

Verification rerun:

```powershell
.\env\npm.cmd run typecheck
.\env\npm.cmd test -- --run
.\env\npm.cmd run lint
```
