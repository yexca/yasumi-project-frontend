# Documentation Maintenance

This document defines how to keep the `documents/` tree usable as the codebase evolves.

## Core Rule

Current guidance lives in `developer/`. Historical evidence lives in `original/`.

## Put A Document In `developer/` When

- a new contributor needs it to work effectively today
- it describes the current structure, workflow, or rule of the repository
- it should be updated whenever code behavior changes

## Put A Document In `original/` When

- it is a historical phase plan
- it records verification, acceptance, release, or performance evidence
- it describes a migration round that is no longer the default working mode
- it should be preserved for traceability rather than rewritten every time the code changes

## Update Rules

- When code changes invalidate a current guide, update the guide in the same change set.
- When adding a new subdirectory under `documents/`, add a `README.md` immediately.
- When retiring a current guide, either delete it or move its historical value into `original/`; do not leave it half-current.
- Do not ask contributors to stitch together active guidance from multiple historical rounds.

## Reading Order Rules

- `documents/README.md` must explain the top-level split.
- `developer/README.md` must give the current onboarding path.
- Each subdirectory `README.md` must explain what belongs there and when to read it.

## Archive Rules

- Preserve historical facts.
- Add context in the nearest archive `README.md` instead of rewriting the body of old evidence files unless a path or label is actively misleading.
- If a current rule started inside an archived round, rewrite the rule into `developer/` and leave the archive as evidence.
