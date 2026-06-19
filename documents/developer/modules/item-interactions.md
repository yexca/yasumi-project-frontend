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

## Quick Add Rules

- Quick Add captures a task name, description, task type, and area in one dialog.
- Opening Quick Add from a route may provide a page baseline. Today provides a date task baseline for today. Area detail provides an area baseline. Idea Pool provides an idea baseline. These baselines are defaults, not user choices.
- Parsed date text in the task name can promote an untouched task type to a date task and can override the page baseline date. For example, opening from Today and typing `tomorrow` should create a date task for tomorrow, not today.
- Date priority is: user-entered date, parsed date, page baseline date. If a parsed fragment is cancelled, the date returns to the page baseline unless the user manually entered a date.
- Recognized date fragments stay highlighted in the task name. Backspace on a highlighted fragment cancels that fragment for the current capture while keeping its text in the title.
- Inbox is the default pool for active non-idea items without an area. Areas are user classification, not a replacement for type-based views. Idea tasks appear in Idea Pool and may also belong to an area.

## Current Risks

- `ItemList.tsx` mixes display composition with interaction state and local autosave behavior.
- The detail pane refresh behavior depends on selected item updates staying in sync with planning data changes.
- Item actions touch planning mutations directly, so presentation changes can accidentally affect write behavior.
- Quick Add behavior spans parser state, route defaults, read models, and both planning write implementations. Update them together when changing capture semantics.

## Safe Change Pattern

- Keep pure label and display helpers in `itemPresentation.tsx`.
- Keep feature mutations in planning hooks, not inside row components.
- If detail behavior becomes more complex, extract hooks before adding more inline state branches.
- Reuse `DenseItemRow` for visual consistency instead of rebuilding list-row UI per page.

## Practical Checks

- Does the change affect all planning pages or just one page?
- Is the change visual only, or does it alter planning writes?
- Does the detail pane still refresh correctly when synced data changes under the selected item?
- Does Quick Add still behave correctly from Inbox, Today, Idea Pool, and Area detail routes?
