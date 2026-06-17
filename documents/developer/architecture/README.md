# Architecture

This directory explains the current structure of the Yasumi frontend as it exists in this repository today.

## Read These Files

1. `source-tree.md`: what each top-level code area owns.
2. `runtime-and-data-flow.md`: how auth, sync, planning, i18n, theme, and route rendering fit together.

## Questions This Directory Should Answer

- Where should a new piece of code live?
- Which direction can dependencies flow?
- Which state is synced and which state is device-local?
- Which layers are allowed to know about backend or PowerSync details?

## Maintenance Rules

- Keep descriptions aligned with the current `src/` tree.
- Document repository-specific boundaries, not generic frontend advice.
- If a structural rule only applies to one hotspot, move it to `../modules/` instead of making this directory vague.
