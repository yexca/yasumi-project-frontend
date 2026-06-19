# Item Interactions

This module note covers the shared planning-item interaction layer.

## Files To Know

- `src/features/items/ItemList.tsx`
- `src/features/items/ItemDialogs.tsx`
- `src/features/items/ItemActions.tsx`
- `src/features/items/itemPresentation.tsx`
- `src/components/items/DenseItemRow.tsx`

## Current Responsibility Split

- `ItemList.tsx` contains `PageFrame`, `ItemSection`, row orchestration, selection state, detail panes, markdown rendering, and note autosave behavior.
- `ItemDialogs.tsx` holds modal workflows such as Quick Add, area creation, and item-edit actions.
- `ItemActions.tsx` maps row state to available actions.
- `itemPresentation.tsx` contains presentation helpers for labels, state keys, and item markers.

## Current Risks

- `ItemList.tsx` mixes display composition with interaction state and local autosave behavior.
- The detail pane refresh behavior depends on selected item updates staying in sync with planning data changes.
- Item actions touch planning mutations directly, so presentation changes can accidentally affect write behavior.

## Safe Change Pattern

- Keep pure label and display helpers in `itemPresentation.tsx`.
- Keep feature mutations in planning hooks, not inside row components.
- If detail behavior becomes more complex, extract hooks before adding more inline state branches.
- Reuse `DenseItemRow` for visual consistency instead of rebuilding list-row UI per page.

## Practical Checks

- Does the change affect all planning pages or just one page?
- Is the change visual only, or does it alter planning writes?
- Does the detail pane still refresh correctly when synced data changes under the selected item?
