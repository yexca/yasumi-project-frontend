# Original Development Archive

This folder preserves the original frontend development records and verification outputs. These files are historical references, not the primary place to describe the current maintainable structure.

## Archive Contents

- `phase-verification/phase-01-verification.md`: project foundation, environment, and initial shell verification.
- `phase-verification/phase-02-verification.md`: design tokens, theme system, primitives, and layout foundation verification.
- `phase-verification/phase-03-verification.md`: domain contracts, validation, DTO parsing, and repository interface verification.
- `phase-verification/phase-04-verification.md`: page modules, routing, local data hook, and shared item UI verification.
- `phase-verification/phase-05-verification.md`: local-first mutations, sync state, rejected writes, and PowerSync boundary verification.
- `phase-verification/phase-06-verification.md`: i18n, settings, timezone display, and background preference verification.
- `phase-verification/phase-07-verification.md`: testing, hardening, release readiness, and route-level performance hardening verification.
- `acceptance/second-acceptance-verification.md`: second-round manual acceptance adjustments and coverage notes.
- `release/release-checklist.md`: MVP release gates, guardrails, known limitations, and release decision.
- `performance/frontend-performance-verification.md`: bundle optimization record after route and dialog lazy loading.

## When To Use This Folder

- Recover the intent and acceptance boundary of a specific phase.
- Trace why a feature landed in its current form.
- Review historical release or performance decisions before changing them.

## Current Snapshot Summary

Across the archived records, the project evolved from a strict Vite + React + TypeScript foundation into a local-first Todo frontend with:

- app shell, route-based page surface, and compact dense-item workflow
- i18n, theme, and local visual preferences
- local-first planning state and mutation simulation
- direct API and PowerSync integration boundaries
- automated test coverage, E2E checks, and release guardrails

For present-day continuation work, start with `../secondary-development/README.md`.
