# CrossWorld

Fit your own word into a crossword, choose a writing restriction, and create a clue that fairly describes your word.

This early playtest contains one playable turn. Reveal the slot, pick one of seven restrictions, and write an answer and clue. Your draft saves to your Reddit account. An AI reviewer checks word validity and clue fairness after the game checks the written rules. Accepted turns use one restriction and complete the playtest. You can revise a rejected clue without using the restriction.

Clue review sends your answer and clue to OpenAI. Your Reddit identity is not included in that request. AI judgments can be mistaken; this playtest is also a chance to assess whether the feedback feels fair. There is no automatic daily reset or next level yet.

The game was previously called Crossword Quest. The new name is CrossWorld; the original browser mock remains in `prototypes/crossword-quest` to preserve existing saved turns.

Development and API setup: [implementation guide](docs/implementation.md).
