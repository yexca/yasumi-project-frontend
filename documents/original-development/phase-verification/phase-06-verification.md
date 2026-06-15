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

## Verification Commands

- `.\env\npm.cmd run typecheck`
- `.\env\npm.cmd run test`
- `.\env\npm.cmd run test:component`

## Browser Verification

- Verified timezone-aware shell display and localized settings behavior.

## Results

Settings and localization became first-class runtime concerns while local-only visual preferences remained intentionally decoupled from synced user data.

## Phase Boundary

The phase closed with local preference handling still separate from any server-owned visual customization model.

## First Manual Acceptance Revision

- Manual acceptance updates later refined settings and item-detail behavior beyond the initial phase close.
