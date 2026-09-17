# Design brief: CrossWorld / Sandy Shore

## Outcome and constraints

Phone and desktop Reddit players author their own connected crossword. Notice the map first, understand the current pair, uncover or edit next. Touch and keyboard; expanded game can scroll. Inline entry cannot require scrolling. Preserve exact user-supplied 33-cell silhouette, five paired turns, separate clue criteria, immediate progression, persistent drafts and paid review protections. Deliver working redesign plus editable structural scene. Human taste/physical phone acceptance remains pending.

## Visual direction

A coastal field guide: ivory paper, deep sea-green ink, turquoise actions, terracotta chapter marker, generous serif world title and small precise utility labels. The map is a single continuous surface; a stable attached field-note editor supports it. Viewed: user-supplied tile screenshot and current rendered mobile UI (before.png). No claim of matching external brands. Avoided separate bottom dashboard; instead show focused map and attached note, with full-map toggle. On wide screens the note sits beside the entire map.
Tokens: --paper outer parchment; --map map ivory; --surface note paper; --ink deep green; --muted readable gray-green; --accent turquoise; --orange terracotta; --line quiet divider; --selected soft sea-green; --error rust; --success sea-green. Display Georgia; UI Avenir/system; 4px rhythm; 44px actions; 8px tiles; 16px atlas; short discovery transitions only.

## States

Covered: five cover groups, single discover marker, five-part progress.
Authoring: tap tiles, Across/Down with independent readiness/rule labels, contextual clue and visual rule choices. Mobile viewport centers active path without resizing cells below touch size; full map available. Desktop full map and notes side by side.
Criteria: seven visual symbols with plain-language rules; selection changes only active direction; Escape/close returns to editor.
Review: explicit Review both clues action; show reviewing status and prevent duplicates. Rejected direction selected, input retained. Error and reconnect preserve draft.
Complete: all 33 tiles, five accepted pairs, inspect ten clues. Restart remains private and account scoped with existing dialog.

## Artifacts

Scene: https://app.excalidraw.com/s/9oHgJ0UhsrQ/1PUa50nGJ2z
Frames: Mobile covered, mobile authoring, mobile criteria, wide completion. Mobile wireframes 2× structural scale; not production typography. Synthetic empty/sample content marked on scene. SVG shore assets purpose-built in code.

## Verification

Before render inspected. Clue panel covers substantial board, weak hierarchy, uneven iconography and bottom-only progress. New composition removes overlay and makes current task/state visible. Verification outcomes recorded in evidence after browser work.
