# Architecture Optimization Guide

This folder records optimization opportunities in the current frontend structure. The target is not large-scale rewrite. The target is a lighter structure with stronger cohesion and weaker cross-module coupling.

## Overall Assessment

The current project direction is good:

- the layer boundaries are recognizable
- shared contracts are already separated into `domain`
- routing and page ownership are feature-oriented
- direct API and PowerSync are not scattered everywhere

The main optimization need is not folder naming. It is responsibility density inside a few oversized files.

## Priority Overview

1. Split oversized state and orchestration modules.
2. Separate presentation helpers from interactive page containers.
3. Move side-effect logic behind dedicated hooks/services.
4. Keep future sync integration behind repository-facing boundaries.

## Optimization Documents

- `module-splitting-plan.md`: concrete file-level split suggestions and recommended extraction order.
- `target-structure-example.md`: a lightweight target structure that preserves the current architecture style.

## Change Strategy

- Prefer incremental extraction over global refactor.
- Each extraction should keep public behavior unchanged.
- Do not combine structural refactor with feature changes unless necessary.
- Preserve current user-facing routes and provider composition while moving internals.
