# Original Documents Archive

`original/` preserves the repository's historical source material. This folder exists for traceability, not as the default guide for current development.

## What Belongs Here

- phase-by-phase verification notes
- acceptance and release records
- performance verification snapshots
- migration plans and round-specific execution documents that are no longer the active working standard

## What Does Not Belong Here

- current architecture rules
- current onboarding guidance
- current implementation workflows
- repository standards that new contributors must follow today

Those belong in `../developer/`.

## Reading Order

Choose the shortest path for your question:

1. To understand the original MVP build-up, read `phase-verification/README.md`.
2. To inspect manual acceptance history, read `acceptance/README.md`.
3. To inspect release readiness and guardrails at the original milestone, read `release/README.md`.
4. To inspect the real-sync migration round, read `real-sync-transition/README.md`.
5. To inspect bundle optimization evidence, read `performance/README.md`.

## Maintenance Rules

- Preserve historical facts even when they no longer match the current codebase.
- Prefer adding new archive entry documents over rewriting old records.
- If a historical document points to an old path or external workspace, keep the record intact and explain the context in the nearest archive `README.md`.
- Do not move current rules here just because they started in an earlier round; rewrite them into `developer/`.
