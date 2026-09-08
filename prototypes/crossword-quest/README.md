# CrossWorld — one-turn mechanics mock

A neutral browser prototype for a player to reveal one slot, choose one of seven proposed restrictions, enter a fitting word and clue, and submit it for human review. Only one turn is implemented. No chapter theme, art direction, future slots, live AI, Reddit deployment, daily unlocks, dictionary service, or leaderboard is implied.

From the repository root:

```sh
python3 -m http.server 4178 --bind 127.0.0.1 --directory prototypes/crossword-quest
```

Open <http://127.0.0.1:4178/>. Use `?session=qa` or a separate browser context for automation, leaving the player's default session untouched. The fixed scenario/version is exported in `rules.mjs`. Drafts and manual verdicts are stored locally; this is not trusted production progress. If storage is blocked, play continues in memory with a warning.

## Play and review

Reveal today's slot, choose a restriction, write the answer and clue, and submit. Mechanical failures keep the draft editable. Passing checks produces a copyable turn record with review pending. Paste that record into the development chat for a real review of the English word and clue's meaning. No automated semantic or dictionary verdict is fabricated.

After the review, use **Record the review after our chat** to record the actual decision and note. A rejection returns to editing without spending a restriction. Acceptance spends exactly one restriction and ends this mock. The control is deliberately manual and local. A production implementation would require a trusted backend judge/state transition.

The rule explainer defines case, tokenization, punctuation, exact-answer bans, and substring behavior. The seven-card pool is proposed tuning, not an established chapter design. This turn can test clarity and immediate choice; it cannot establish seven-day strategy or retention.

## Verification

```sh
node --check prototypes/crossword-quest/rules.mjs
node --check prototypes/crossword-quest/app.mjs
node --test prototypes/crossword-quest/rules.test.mjs
```

No package installation, TypeScript compilation, or production build is required. Browser verification covers reveal, input errors, pending/accepted/revise transitions, reload, copy fallback, storage denial, keyboard controls, and narrow layouts. Automated tests do not establish that a human enjoyed the turn.
