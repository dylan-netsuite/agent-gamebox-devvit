# Scattergories - Changelog

## [0.7.0] - 2026-02-26

### Added
- **Category-Aware Answer Validation** — Answers are now validated against category-specific word lists for enumerable categories (Animals, Countries, Trees, Emotions, Sports, etc.). For example, "Cobra" is rejected for "Athletes" but accepted for "Animals". Open-ended categories ("Things in a Kitchen") still accept any well-formed answer.
- **`categoryRelevance.ts` Module** — New shared module with `isCategoryRelevant()` function, `classifyCategory()` mapper (23 category types), and `fuzzyMatch()` for flexible matching (exact, multi-word, substring).
- **Comprehensive Word Lists** — Curated lists for names, countries, animals, colors, sports, clothing, occupations, flowers, trees, instruments, cars, holidays, superheroes, emotions, food, cities, languages, insects, birds, fish, reptiles, dances, and shows.

### Changed
- **All Scoring Modules** — `scoring.ts` (server), `singlePlayerScoring.ts` (client), and `localScoring.ts` (client) now use `isAnswerValidForCategory(answer, letter, category)` instead of `isAnswerValid(answer, letter)`, enabling category-aware rejection.

### Verified
- Single player E2E: "Cobra" for Athletes correctly rejected (score 11/12), "Cedar" for Trees and "Calm" for Emotions correctly accepted
- Open-ended categories still accept any valid answer
- AI opponent answers also validated against categories
- Zero console errors

Workflow: wf-1772064000

## [0.6.0] - 2026-02-24

### Added
- **AI Difficulty Levels** — New `DifficultySelect` scene lets players choose Easy (1 slow AI), Medium (2 balanced AI), or Hard (3 sharp AI) before starting single player. Each difficulty has distinct skill ranges and opponent counts.
- **Pass Device Interstitial** — New `PassDevice` scene shows between player turns in local multiplayer with a lock icon, next player's name, and "TAP ANYWHERE WHEN READY" prompt. Prevents peeking at previous player's answers.
- **Expanded AI Word Banks** — Added 12 new category banks: flowers, trees, colors, instruments, cars, holidays, toys, superheroes, mythological creatures, emotions, brands, and bodies of water. Existing banks also expanded with additional entries.

### Changed
- **ModeSelect** — Single Player now navigates to DifficultySelect instead of directly to GamePlay.
- **AIOpponent** — `createAIPlayers()` now accepts a difficulty parameter controlling opponent count and skill range. Difficulty-specific AI names (Rookie Bot for easy, Bot Alpha/Beta for medium, CPU Omega/Sigma/Delta for hard).
- **GamePlay** — Passes `aiDifficulty` through the round cycle so difficulty persists across rounds.
- **categorize()** — Updated to route niche categories (flowers, trees, colors, instruments, cars, etc.) to their dedicated word banks instead of falling through to generic "thing" bank.

Workflow: wf-1771960800

## [0.5.0] - 2026-02-24

### Added
- **Three Game Modes** — ModeSelect now offers Single Player (vs AI), Local Play (pass & play), and Live Multiplayer (online) alongside Leaderboard.
- **AI Opponents** — Single player mode now pits you against 2 AI opponents with curated word banks per category type. AI skill varies — they sometimes leave blanks or give duplicate answers.
- **Local Multiplayer** — New `LocalSetup` scene lets 2-6 players enter names, then take turns on the same device. After all players submit, results show side-by-side with duplicate detection.
- **AI Answer Generation System** — New `AIOpponent.ts` with word banks for names, cities, countries, animals, food, things, sports, clothing, shows, and occupations.
- **Local Scoring Module** — New `localScoring.ts` handles multi-player scoring with cross-player duplicate detection.

### Fixed
- **Lobby UI** — Completely rewrote `LobbyBrowser.ts` to remove the cluttered inline lobby list and duplicated JOIN buttons. Now shows three clean action cards: Quick Match, Create Lobby, and Join by Code.

### Changed
- **ModeSelect** — Now shows 4 mode cards with unique colors: Single Player (purple), Local Play (green), Live Multiplayer (blue), Leaderboard (orange).
- **Single Player Scoring** — Now includes AI opponents in the results table with duplicate detection across all players (human + AI).

Workflow: wf-1771959200

## [0.4.0] - 2026-02-24

### Added
- **Answer Validation** — Answers are now validated beyond just letter-checking: minimum 2 characters, cannot be a single repeated character, must contain at least one vowel. Applied to both multiplayer (server-side) and single-player (client-side) scoring.
- **Lobby Browser List** — The Online Play screen now shows an "OPEN LOBBIES" section below the Join by Code area, listing all available lobbies with host name, player count (e.g. "2/6"), age (e.g. "33s ago"), and a JOIN button for each.
- **Lobby List Auto-Refresh** — The lobby list refreshes every 5 seconds automatically.
- **`GET /api/lobbies/list` Endpoint** — New server endpoint returns all waiting lobbies with player details for a given post.
- **`listOpenLobbies()` Function** — New gameState function to query all open lobbies with player info.

### Verified
- Full multiplayer E2E test completed with 2 players using both `player_one` and `player_two` Playwright instances
- Answer validation: "H" (too short) and "Hhhh" (repeated chars) correctly rejected
- Duplicate detection: "Honduras" and "Hiking" correctly marked as duplicates for both players
- Lobby browser list: correctly shows suitegeek's lobby with "1/6" count and age
- Quick Match: successfully finds and joins existing lobby
- NEXT ROUND button: buffers round-start message, transitions from "Reviewing..." to "NEXT ROUND ▶"
- Timer expiration auto-finalizes final round and transitions to Game Over
- Game Over shows correct winner (suitegeek) on both player screens
- Zero console errors on both players

Workflow: wf-1771958400

## [0.3.0] - 2026-02-24

### Added
- **Round Results: Manual Continue** — Multiplayer round results now buffer the `round-start` message and display a "NEXT ROUND" button instead of auto-advancing after 5 seconds. Players can review all answers at their own pace.
- **Letter Dice Roll Animation** — GamePlay scene now animates a "dice roll" effect when showing the round letter: rapidly cycles through random letters for ~1 second before settling on the actual letter with a bounce effect.
- **Timer Urgency Effects** — When the timer reaches ≤10 seconds, the timer text pulses larger and the header background flashes between dark red and normal.
- **Staggered Score Reveal** — RoundResults rows now animate in one at a time with per-row sound effects (correct/duplicate) instead of appearing all at once.
- **GameOver Entrance Animation** — Title drops in from above, winner text fades in, score rows slide in sequentially, and buttons fade in with staggered delays.
- **Scene Fade Transitions** — ModeSelect, RoundResults, and GameOver scenes now fade in smoothly. RoundResults fades out before transitioning to the next scene.
- **Dice Roll Sound Effect** — New `diceRoll` sound added to SoundManager for the letter animation.

## [0.2.1] - 2026-02-24

### Verified
- Full multiplayer E2E test completed with 2 players (suitegeek + BarryBetsALot)
- Matchmaking flow: CREATE LOBBY + JOIN BY CODE successfully syncs players
- Lobby UI correctly shows both players, ready states, and host designation
- All 3 rounds play through with unique letters and category lists per round
- DOM text inputs render and accept answers correctly for both players simultaneously
- Server-authoritative scoring works: duplicate answers scored for both, unique answers scored individually
- Game Over screen shows correct final standings with winner, scores, REMATCH + BACK TO MENU
- Zero console errors across both players throughout entire session

Workflow: wf-1771956062

## [0.2.0] - 2026-02-24

### Fixed
- Single-player round progression now preserves state (used letters, used lists, total score, round number) across rounds — no more repeat letters/categories or score resets
- Multiplayer timer expiry now calls `finalizeRound()` on the server so rounds complete even if not all players submit manually
- Rematch now disconnects from the old lobby channel and reconnects to the new one via `resetForLobby()`
- GameOver screen no longer crashes on empty scores — derives winner from sorted array with fallback
- Post creation endpoint returns `navigateTo` URL (matching worms pattern) and proper error handling
- Server startup now binds to port with error handler (matching worms pattern)

### Hardened
- `createLobby()` API call now checks `res.ok` and throws on error, preventing undefined crashes
- LobbyBrowser actions (quick match, create, join) now await `ensurePostId()` before proceeding, fixing a race condition
- `/api/game/finalize-round` server endpoint now verifies the caller is a member of the lobby

Workflow: wf-1771955085

## [0.1.0] - 2026-02-24

### Added
- Initial game implementation with full Scattergories gameplay
- Single player mode with solo scoring (1 point per valid answer)
- Online multiplayer with lobby system (2-6 players)
  - Quick match, create lobby, join by code
  - Realtime lobby updates and game messaging
  - Server-authoritative scoring with duplicate detection
- 10 category lists with 12 categories each
- 20-letter pool (A-P, R-T, W) matching the classic die
- 3 rounds per game, 90 seconds per round
- Round results screen with answer comparison table
- Game over screen with final standings and medals
- Rematch functionality for multiplayer
- Persistent leaderboard (wins, total points, games played)
- Reconnection support for interrupted games
- Synthesized sound effects (select, tick, submit, reveal, etc.)
- Responsive UI with dark theme

### Technical
- Phaser 3.88.2 with RESIZE scale mode
- Express.js server with Redis state management
- Devvit Realtime for multiplayer communication
- DOM overlay text inputs for keyboard support
- Lobby TTL of 2 hours for automatic cleanup

Workflow: wf-1771949968
