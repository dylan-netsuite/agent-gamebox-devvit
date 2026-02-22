# Phaser Scenes

The game uses 8 scenes loaded in this order: Boot, Preloader, MainMenu, Game, GameOver, StatsScene, CommunityStatsScene, LeaderboardScene.

Phaser config is in `src/client/game/game.ts` with `Scale.RESIZE` mode (base 1024x768). DOM element support is enabled via `dom: { createContainer: true }` for the answer and wager input fields.

Note: `IntroSplash.ts` exists but is not registered in the scene list and is not used.

---

## Transitions (All Scenes)

All scene transitions use **camera fade-in/fade-out (black)** for smooth visual flow.

---

## Boot

**File:** `src/client/game/scenes/Boot.ts`
**Key:** `'Boot'`

### Purpose
Loads minimum assets needed by the Preloader.

### Lifecycle
- `preload()` — loads `assets/bg.png`
- `create()` — starts `'Preloader'`

### Transitions
- **Out:** → Preloader

---

## Preloader

**File:** `src/client/game/scenes/Preloader.ts`
**Key:** `'Preloader'`

### Purpose
Jeopardy-themed loading screen with progress feedback.

### Lifecycle
- `init()` — draws UI with progress bar
- `preload()` — loads `assets/logo.png`
- `create()` — camera fades out, starts `'MainMenu'`

### Transitions
- **In:** ← Boot
- **Out:** → MainMenu (camera fade out)

---

## MainMenu

**File:** `src/client/game/scenes/MainMenu.ts`
**Key:** `'MainMenu'`

### Purpose
Title screen with game type selection. Fetches live game data from the server. Checks for saved game state and offers resume.

### Key Elements
- "JEOPARDY!" gold title with pulse animation
- "Choose Your Game" subtitle
- **Resume Game** button (conditional) → appears when a saved game exists, shows game description, score, and clues remaining
- **Latest Game** button → fetches `GET /api/game?type=latest`
- **On this Day** button → fetches `GET /api/game?type=onthisday`
- **My Stats** button → navigates to StatsScene
- **Community** button → navigates to CommunityStatsScene
- **Leaderboard** button → navigates to LeaderboardScene
- Loading state with animated dots
- Fallback handling (falls back to static data on failure)

### Key Methods

| Method | Description |
|--------|-------------|
| `checkForSavedGame()` | Fetches `GET /api/game/save` to check for in-progress game |
| `createResumeButton()` | Renders the Resume Game button with saved state details |
| `resumeSavedGame()` | Fetches game data for saved `gameId` and starts Game scene with `savedState` |
| `startGameWithData()` | Starts a new game; deletes any existing save via `DELETE /api/game/save` |

### Transitions
- **In:** ← Preloader, ← GameOver, ← Game (via Exit), ← StatsScene, ← CommunityStatsScene, ← LeaderboardScene
- **Out:** → Game (with `gameData` and optional `savedState`), → StatsScene, → CommunityStatsScene, → LeaderboardScene

---

## Game

**File:** `src/client/game/scenes/Game.ts`
**Key:** `'Game'`

### Purpose
Main gameplay scene with three rounds: Jeopardy, Double Jeopardy, and Final Jeopardy.

### Round Management

| Property | Type | Description |
|----------|------|-------------|
| `currentRound` | `'J' \| 'DJ'` | Current round |
| `currentDollarValues` | `number[]` | Active dollar values for current round |
| `J_DOLLAR_VALUES` | `number[]` | `[200, 400, 600, 800, 1000]` |
| `DJ_DOLLAR_VALUES` | `number[]` | `[400, 800, 1200, 1600, 2000]` |
| `dailyDoubleCells` | `string[]` | DD cells for J round (1 cell) |
| `djDailyDoubleCells` | `string[]` | DD cells for DJ round (2 cells) |

### Key Properties

| Property | Type | Description |
|----------|------|-------------|
| `score` | `number` | Current score (can go negative) |
| `gameCategories` | `string[]` | Active J round categories |
| `gameQuestions` | `(Question \| null)[][]` | J round questions |
| `djGameCategories` | `string[]` | DJ round categories |
| `djGameQuestions` | `(Question \| null)[][]` | DJ round questions |
| `gameFinalJeopardy` | `FinalJeopardyQuestion` | Final Jeopardy data |
| `overlay` | `OverlayElements \| null` | Active question overlay |
| `wagerOverlayElements` | `GameObject[]` | Active wager input elements |

### Key Methods

| Method | Description |
|--------|-------------|
| `createBoard()` | Builds 6x6 grid for current round |
| `pickDailyDoubles(questions, count)` | Randomly places DD cells |
| `showQuestion(col, row)` | Opens question; checks for Daily Double |
| `showDailyDoubleSplash(q)` | Splash → wager input → clue overlay |
| `showWagerInput(options)` | Full-screen wager input UI with validation |
| `destroyWagerOverlay()` | Cleans up wager input elements |
| `createOverlay(question)` | Builds clue overlay with timer, input, Submit button, and Skip button |
| `submitAnswer()` | Checks answer, scores (no deduction on timeout), records result for stats |
| `skipQuestion()` | Skips the current question with no score penalty |
| `saveGameState()` | POSTs current board state to `POST /api/game/save` |
| `deleteSavedGame()` | Deletes saved state via `DELETE /api/game/save` |
| `exitAndSave()` | Saves game state and returns to MainMenu |
| `submitGameStats()` | POSTs game results to `/api/stats/submit` (fire-and-forget) |
| `transitionToDoubleJeopardy()` | Animates board out, splash, loads DJ board |
| `startFinalJeopardy()` | Board out, title, wager input, clue |
| `showFinalJeopardyClue()` | Shows FJ clue with 30s timer |

### Score & Skip Rules
- **Wrong answer** → deducts the clue's dollar value
- **Timer expiry** → no deduction, shows "TIME'S UP!" in amber
- **Skip** → no deduction, shows "SKIPPED" in neutral color

### Board Persistence
After each answered/skipped question, the game auto-saves its state (`POST /api/game/save`). An **EXIT** button in the score bar lets the player save and return to MainMenu. The save is deleted on game completion or when starting a new game.

### Lifecycle
- `init(data)` — receives `{ gameData: GameData, savedState?: SavedGameState }` from MainMenu; loads J, DJ, and FJ data; restores state if resuming
- `create()` — resets state, restores from `pendingSavedState` if present, picks DD cells for both rounds, creates board for current round

### Transitions
- **In:** ← MainMenu (new game or resume)
- **Internal:** J Round → DJ Round (when all J cells used) → Final Jeopardy (when all DJ cells used)
- **Out:** → GameOver (after Final Jeopardy scoring), → MainMenu (via Exit button)

---

## GameOver

**File:** `src/client/game/scenes/GameOver.ts`
**Key:** `'GameOver'`

### Purpose
Displays final score with animated count-up and allows replay.

### Key Elements
- "GAME OVER" title with bounce-in animation
- Animated score count-up
- "PLAY AGAIN" pill button

### Transitions
- **In:** ← Game
- **Out:** → MainMenu

---

## StatsScene

**File:** `src/client/game/scenes/StatsScene.ts`
**Key:** `'StatsScene'`

### Purpose
Displays per-user stats with data visualizations. Fetches stats from the server on load.

### Key Elements
- "MY STATS" gold title with "< BACK" button
- Games played subtitle
- **Overall Correct %** — circular arc ring with percentage
- **Best Game** — score, description, gold star
- **Longest Streak** — large gold number
- **Final Jeopardy %** — percentage with correct/total count
- **Correct % by Value** — horizontal bar chart with color-coded fills
- **Empty state** — "No stats yet!" message for new users

### Key Methods

| Method | Description |
|--------|-------------|
| `loadStats()` | Fetches `GET /api/stats` and triggers rendering |
| `buildUI()` | Orchestrates all card layouts |
| `drawOverallCard()` | Circular arc ring for overall correct % |
| `drawBestGameCard()` | Score + date + description card |
| `drawStreakCard()` | Longest streak display |
| `drawFinalJeopardyCard()` | FJ correct % card |
| `drawByValueCard()` | Horizontal bar chart by dollar value |

### Transitions
- **In:** ← MainMenu
- **Out:** → MainMenu (via BACK button)

---

## CommunityStatsScene

**File:** `src/client/game/scenes/CommunityStatsScene.ts`
**Key:** `'CommunityStatsScene'`

### Purpose
Displays aggregate community statistics — total games, questions, accuracy, and top streaks across all players.

### Key Elements
- "COMMUNITY" gold title with "< BACK" button
- Hero stat cards (games played, questions answered, overall accuracy)
- Circular arc ring for community correct %
- Top community streaks podium

### Transitions
- **In:** ← MainMenu
- **Out:** → MainMenu (via BACK button)

---

## LeaderboardScene

**File:** `src/client/game/scenes/LeaderboardScene.ts`
**Key:** `'LeaderboardScene'`

### Purpose
Displays the community leaderboard — top 20 players ranked by best single-game score.

### Key Elements
- "LEADERBOARD" gold title with glow
- "Top Players by Best Game Score" subtitle
- "< BACK" button → returns to MainMenu
- Header row: rank (#), PLAYER, BEST, GAMES
- Entry rows with:
  - Medal emojis for top 3 (gold, silver, bronze)
  - Username and best score
  - Games played count
  - Current user highlighted with gold background tint and "(you)" suffix
- If current user is outside top 20, shown below a "..." separator
- Empty state: "No scores yet! Play a game to get on the board."

### Key Methods

| Method | Description |
|--------|-------------|
| `loadLeaderboard()` | Fetches `GET /api/leaderboard` and triggers rendering |
| `buildUI()` | Orchestrates title bar, entries, or empty state |
| `drawTitleBar()` | Title, subtitle, back button, separator line |
| `drawEntries()` | Header row + ranked entry rows + user rank if outside top 20 |
| `drawEntryRow()` | Single row: medal/rank, username, score, games |
| `drawEmptyState()` | "No scores yet!" message |

### Transitions
- **In:** ← MainMenu
- **Out:** → MainMenu (via BACK button)
