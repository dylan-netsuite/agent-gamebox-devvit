# Changelog

All notable changes to the Jeopardy Devvit app are documented here, newest first.

---

## [2026-02-22] Playability Updates — Skip, No-Deduct Timeout, Board Persistence

**Summary:** Three quality-of-life improvements: (1) a Skip button on every question so players can pass without penalty, (2) no point deduction when the timer runs out (only wrong answers cost points), and (3) full board state persistence so players can exit mid-game and resume later.

### Changes

**Scoring & Skip button (`Game.ts`)**
- Added "Skip" button alongside "Submit" in the question overlay
- Skipping reveals the answer with "SKIPPED" text (neutral color, no score change)
- Timer expiry no longer deducts points — shows "TIME'S UP!" in amber with no dollar penalty
- Only explicit wrong answers deduct points
- Skipped/timed-out answers are excluded from stats tracking (`AnswerResult.skipped`)

**Board state persistence (`Game.ts`, `MainMenu.ts`, server)**
- Auto-saves game state (round, score, used cells, results) to Redis after every question
- EXIT button on the game board score bar saves and returns to MainMenu
- MainMenu checks for saved games on load and shows a green "RESUME GAME" button with game details
- Resuming restores the exact board state — correct round, dollar values, used cells, score
- Save is cleared when a game completes (Final Jeopardy → GameOver)
- Starting a new game clears any existing save

**Server endpoints**
- `POST /api/game/save` — saves game state to `jeopardy:save:{userId}` (30-day TTL)
- `GET /api/game/save` — loads saved game state
- `DELETE /api/game/save` — clears saved game
- `GET /api/game?gameId={id}` — new query param for fetching cached game data by ID (for resume)
- `POST /api/stats/submit` — skipped answers excluded from stats and community counters

**Shared types**
- `AnswerResult.skipped?: boolean` — marks skipped/timed-out answers
- `SavedGameState` — board state persistence model
- `SavedGameResponse` — server response for save endpoints

### Files Modified

| File | Change |
|------|--------|
| `src/shared/types/api.ts` | Added `SavedGameState`, `SavedGameResponse`, `skipped` field |
| `src/server/index.ts` | Save/load/delete endpoints, stats exclusion for skipped, gameId query param |
| `src/client/game/scenes/Game.ts` | Skip button, timeout scoring, exit button, save/restore logic |
| `src/client/game/scenes/MainMenu.ts` | Resume button, saved game check on load |
| `src/client/game/scenes/CommunityStatsScene.ts` | Fixed pre-existing `data` property name conflict with `Scene.data` |

### Redis Keys

- `jeopardy:save:{userId}` — saved game state JSON (TTL: 30 days)

---

## [2026-02-21] Community Stats Dashboard

**Summary:** Added a new "Community" scene accessible from the MainMenu that displays aggregate stats across all players. The dashboard shows total players, total games played, total questions answered, community-wide correct %, average correct answer time, and a top 3 player podium. The server tracks global community counters in a Redis hash, incrementing them when games are submitted and when per-question stats are recorded.

**What changed:**
- New `GET /api/community-stats` endpoint aggregates data from leaderboard sorted sets and the `jeopardy:community` hash
- `POST /api/stats/submit` now also increments `jeopardy:community` counters (`gamesPlayed`, `questionsAnswered`, `questionsCorrect`)
- `POST /api/question-stats` now also tracks global timing data (`totalCorrectTimeTenths`, `totalCorrectAnswers`) in the community hash
- New `CommunityStatsScene` with hero stat, 2x2 stat cards, arc ring for correct %, and top 3 podium
- MainMenu now has three bottom buttons: MY STATS, COMMUNITY, LEADERBOARD

**Files changed:**
- `src/shared/types/api.ts` — Added `CommunityStatsResponse` interface
- `src/server/index.ts` — Added `GET /api/community-stats` endpoint, `COMMUNITY_KEY` constant, global counter increments in `/api/stats/submit` and `/api/question-stats`
- `src/client/game/scenes/CommunityStatsScene.ts` (NEW) — Full community dashboard scene
- `src/client/game/scenes/MainMenu.ts` — Added COMMUNITY button, adjusted Y positions for three buttons
- `src/client/game/game.ts` — Registered `CommunityStatsScene` in scene list

**Redis key:** `jeopardy:community` (hash) — `gamesPlayed`, `questionsAnswered`, `questionsCorrect`, `totalCorrectTimeTenths`, `totalCorrectAnswers`

---

## [2026-02-21] Multiplayer Answer Tracking with Timing

**Summary:** Enhanced per-question community stats to track answer timing. After each answer, the overlay now shows three pieces of data: (1) community correct percentage, (2) the current user's answer time, and (3) the average correct answer time across all players. This adds a competitive timing dimension to the existing correct-percentage stats.

**What changed:**
- `QuestionStatsRequest` now includes `elapsed` (seconds taken to answer)
- `QuestionStatsResponse` now includes `avgCorrectTime` and `yourTime`
- Server tracks `totalCorrectTime` in Redis alongside `correct` and `total`
- Client records `answerStartTime` when the timer starts, calculates elapsed in `submitAnswer()`
- New `timingText` element in the question overlay displays "Your time: Xs" and optionally "Avg correct: Xs"

**Files changed:**
- `src/shared/types/api.ts` — Added `elapsed` to `QuestionStatsRequest`; added `avgCorrectTime` and `yourTime` to `QuestionStatsResponse`
- `src/server/index.ts` — Updated `POST /api/question-stats` to accept `elapsed`, track `totalCorrectTime` in Redis, compute and return `avgCorrectTime`
- `src/client/game/scenes/Game.ts` — Added `answerStartTime` property, `timingText` to `OverlayElements`, timing calculation in `submitAnswer()`, enhanced `fetchQuestionStats()` to display timing stats, updated `animateOverlayOut()`, `destroyOverlay()`, and `updateLayout()` to handle the new text element

**Redis key format:** `jeopardy:qstats:{questionId}` value now includes `totalCorrectTime` field (backward-compatible — missing field defaults to 0)

---

## [2026-02-21] MainMenu Responsive Font Sizes

**Summary:** Refactored MainMenu to use responsive `fontSize` with enforced minimums instead of `setScale(sf)` on text objects. Previously, button text like "LEADERBOARD" was rendered at ~6px on mobile (18px × sf≈0.32) — now it renders at 12px minimum, clearly readable.

**Root cause:** MainMenu created text with fixed `fontSize` then applied `setScale(sf)` to the entire text object, which scaled the rendered size proportionally. At mobile width (sf≈0.32), this made small buttons nearly invisible.

**Fix:** Replaced `setScale(sf)` pattern with `fontSize: Math.max(min, Math.round(base * sf))` — the same approach already used by Game, GameOver, LeaderboardScene, and StatsScene. Also added minimum button dimensions for touch targets (180×38 for game buttons, 130×36 for small buttons).

**Files changed:**
- `src/client/game/scenes/MainMenu.ts` — Complete refactor: replaced per-element instance variables with `allObjects[]` array + `destroyAll()` pattern; removed `setScale(sf)` from all text; added responsive font sizes with minimums for title (28px), subtitle (14px), game buttons (14px), small buttons (12px), subtext (9px), loading text (12px); added minimum button dimensions; simplified hover tweens to use scale 1.0 base.

---

## [2026-02-20] Mobile UI Cleanup

**Summary:** Added responsive scaling across all Phaser scenes that previously used fixed pixel sizes. The game runs in a Devvit webview that is typically ~375px wide on mobile, where the scale factor (`sf`) drops to ~0.32. All font sizes, button dimensions, board margins, and overlay elements now scale proportionally with enforced minimums to remain readable.

**Scenes updated:**
- **Game.ts** — Board layout (`boardMargin`, `scoreBarHeight`, `categoryRowHeight`), category font size, dollar value font size, score bar text, question overlay (header, timer, question, answer, submit button, result, community stats), Daily Double splash, wager overlay (title, category, score label, range, input, submit), Final Jeopardy intro, Double Jeopardy splash — all now scale with `sf` and have minimum sizes.
- **GameOver.ts** — Refactored to use `buildUI()` + `destroyAll()` pattern with resize handler. Title (56px→scaled), score (52px→scaled), label (20px→scaled), button (220×50→scaled) all responsive.
- **LeaderboardScene.ts** — Added `sf` scaling and resize handler. Title bar positions, font sizes, row heights, and entry text all scale with viewport. Previously had zero responsive behavior.
- **Preloader.ts** — Title (48px→scaled) and loading text (14px→scaled) now responsive.

**Testing:** Verified at 375×700 viewport. All scenes render correctly — categories readable, dollar values fit cells, overlays don't overflow, buttons are tappable, leaderboard and stats scenes properly scaled. Zero console errors.

---

## [2026-02-20] J-Archive Integration Verified & Hardened

**Summary:** With j-archive.com HTTP access approved, verified the full scraping pipeline end-to-end in production. Added HTML text cleaning, structured logging, and improved error messages to the scraper and server.

**What was tested:**
- "Latest Game" successfully fetches real categories and clues from the most recent Jeopardy episode
- "On This Day" successfully fetches a historical game from the same date in a random past year
- Full game flow works with live data: J round → DJ round → Final Jeopardy
- Question overlay displays real clues with timer, input, and scoring
- Redis caching works (subsequent loads are instant)
- Fallback to static data works when scraping fails
- Zero console errors during gameplay

**Files changed:**
- `src/server/scraper.ts` — Added `cleanHtmlText()` helper for robust HTML entity decoding (handles `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#039;`, backslash escapes, whitespace normalization). Applied to all question and answer text extraction. Added structured `[scraper]` logging for game lookup, clue counts, and errors.
- `src/server/index.ts` — Added `[api/game]` logging for scrape requests and responses. Split error handling into separate cases for null scrape result vs. insufficient clues, with more specific error messages.

**Known minor issue:** Some j-archive clues contain Unicode characters that Phaser's canvas text renderer cannot display (shown as □). This is a Phaser limitation, not a data issue.

---

## [2026-02-17] Leaderboard — Community Top Players

**Summary:** Added a community leaderboard showing the top 20 players ranked by best single-game score. Players can see their rank, username, best score, and games played for all top performers. The current user's entry is highlighted. If the user is outside the top 20, their rank is shown below a separator. Gold, silver, and bronze medal emojis distinguish the top 3 players.

**Files changed:**
- `src/shared/types/api.ts` — Added `LeaderboardEntry` and `LeaderboardResponse` interfaces
- `src/server/index.ts` — Added `GET /api/leaderboard` endpoint (top 20 via Redis sorted set + current user's rank). Added leaderboard update logic in `POST /api/stats/submit` — updates sorted sets and stores username mapping. New Redis keys: `jeopardy:lb:best` (sorted set), `jeopardy:lb:games` (sorted set), `jeopardy:lb:names` (hash).
- `src/client/game/scenes/LeaderboardScene.ts` (NEW) — Phaser scene displaying ranked player list with title bar, back button, header row (rank/player/best/games), entry rows with medal emojis for top 3, current user highlight, empty state, and user rank outside top 20.
- `src/client/game/scenes/MainMenu.ts` — Added "LEADERBOARD" button below "MY STATS"; navigates to LeaderboardScene
- `src/client/game/game.ts` — Registered `LeaderboardScene` in scene list

**Redis keys:**
- `jeopardy:lb:best` — sorted set (member=userId, score=best game score)
- `jeopardy:lb:games` — sorted set (member=userId, score=games played)
- `jeopardy:lb:names` — hash (userId → username from `context.username`)

---

## [2026-02-17] Community Question Stats — Per-Question Correct %

**Summary:** After answering any question, players now see the community-wide correct percentage for that question (e.g., "67% of 3 players got this right"). This adds a social layer where players can gauge how their performance compares to everyone else on every clue.

**Files changed:**
- `src/shared/types/api.ts` — Added `QuestionStatsRequest` and `QuestionStatsResponse` interfaces
- `src/server/index.ts` — Added `POST /api/question-stats` endpoint. Stores per-question stats in Redis at `jeopardy:qstats:{questionId}` as `{correct, total}` JSON.
- `src/client/game/scenes/Game.ts` — Added `communityText` to `OverlayElements` interface. Added `gameId` property, `getQuestionId()` helper (generates deterministic IDs like `g8042_J_3_2`), and `fetchQuestionStats()` method. After every answer submission, fetches and displays community stats in the overlay.
- `src/client/game/game.ts` — Exposed Phaser game instance on `window.__PHASER_GAME__` for Playwright testing.

---

## [2026-02-17] My Stats — Per-User Stats Tracking & Visualization

**Summary:** Added a "My Stats" feature that tracks per-user game statistics in Redis and displays them in a new StatsScene with data visualizations. Players can view their overall correct %, best game, longest answer streak, correct % by clue value, and Final Jeopardy accuracy.

**Files changed:**
- `src/shared/types/api.ts` — Added `AnswerResult`, `GameResult`, `UserStats`, `StatsResponse` interfaces
- `src/server/index.ts` — Added `GET /api/stats` (returns user stats) and `POST /api/stats/submit` (processes game results and updates cumulative stats). Stats keyed by `context.userId` in Redis with no TTL.
- `src/client/game/scenes/Game.ts` — Added `gameResults: AnswerResult[]` tracking array. Each answer in `submitAnswer()` pushes a result. New `submitGameStats()` method POSTs results to server before transitioning to GameOver.
- `src/client/game/scenes/StatsScene.ts` (NEW) — Full stats visualization scene with:
  - Overall correct % (circular arc ring, color-coded green/yellow/red)
  - Best game card (score, date, description, gold star)
  - Longest streak display (gold number with glow)
  - Final Jeopardy % (percentage with correct/total)
  - Correct % by clue value (horizontal bar chart, sorted ascending)
  - Empty state for new users ("No stats yet!")
  - Back button to MainMenu
- `src/client/game/scenes/MainMenu.ts` — Added "MY STATS" button below game mode buttons; navigates to StatsScene
- `src/client/game/game.ts` — Registered `StatsScene` in scene list

**Redis key:** `jeopardy:stats:{userId}` — permanent JSON blob

**Stats tracked:** totalAnswered, totalCorrect, gamesPlayed, bestGame, longestStreak, currentStreak, correctByValue, finalJeopardy

---

## [2026-02-16] Custom Wager Input & Double Jeopardy Round

**Summary:** Two major features: (1) Custom wager input for Daily Double and Final Jeopardy — players now choose their own wager amount via a dedicated wager screen instead of auto-calculated wagers. (2) Double Jeopardy round — the game now has two full rounds (J with $200-$1000 and 1 DD, DJ with $400-$2000 and 2 DDs) plus Final Jeopardy, matching the real Jeopardy structure.

**Files changed:**
- `src/shared/types/api.ts` — Added `djCategories?: string[]` and `djClues?: Clue[]` to `GameData` for Double Jeopardy round data
- `src/server/scraper.ts` — Now extracts both Jeopardy and Double Jeopardy clues from J-Archive (previously only J round). DJ categories from `#double_jeopardy_round .category_name`, DJ clues with `roundId === 'DJ'` and values = row * 400
- `src/client/game/data/questions.ts` — Added `DJ_CATEGORIES` and `DJ_QUESTIONS` static fallback data for Double Jeopardy (6 categories: World Capitals, Literature, Music, Food & Drink, Movies, Nature; values $400-$2000)
- `src/client/game/scenes/Game.ts` — Major refactor:
  - **Round management:** `currentRound`, `currentDollarValues`, DJ data properties
  - **Wager input UI:** New `showWagerInput()` method with number input, min/max validation, WAGER button
  - **Daily Double flow:** splash → wager input → clue (replaces auto-wager)
  - **Final Jeopardy flow:** title → category → wager input (if score > 0) → clue
  - **Double Jeopardy transition:** `transitionToDoubleJeopardy()` with splash animation
  - **DD placement:** `pickDailyDoubles()` helper; 1 DD for J round, 2 for DJ
  - **Completion logic:** J done → DJ transition; DJ done → Final Jeopardy

**Wager rules:**
- Daily Double: min $5, max = max(score, highest board value)
- Final Jeopardy: min $0, max = current score (forced $0 if score <= 0)

---

## [2026-02-16] Remove Intro Splash

**Summary:** Removed the IntroSplash scene from the game flow. The game now goes directly from Preloader to MainMenu. IntroSplash.ts still exists in the codebase but is not imported or registered.

**Files changed:**
- `src/client/game/game.ts` — Removed IntroSplash from scene list
- `src/client/game/scenes/Preloader.ts` — Changed transition target from IntroSplash to MainMenu

---

## [2026-02-16] J-Archive Live Game Scraping

**Summary:** Replaced static question data with live-scraped games from J-Archive.com. Added two game modes to the MainMenu: "Latest Game" (yesterday's episode) and "On this Day" (random game from this date in a previous year, 2000–2025).

**Files changed:**
- `package.json` — Added `cheerio` dependency for HTML parsing
- `src/shared/types/api.ts` — New types: `GameType`, `Clue`, `FinalJeopardyClue`, `GameData`, `GameResponse`
- `src/server/scraper.ts` (NEW) — J-Archive scraping module:
  - `lookupGameByDate(date)` — resolves date to J-Archive game ID via season pages
  - `scrapeGame(gameId, airDate, gameType)` — scrapes game page for categories, clues, and Final Jeopardy
  - `findLatestGame()` — searches backward from yesterday up to 14 days
  - `findOnThisDayGame()` — tries up to 10 random years for current month/day
- `src/server/index.ts` — New `GET /api/game?type=latest|onthisday` endpoint with Redis caching; removed unused counter endpoints
- `src/client/game/scenes/MainMenu.ts` — Two game type buttons with loading state and fallback handling
- `src/client/game/scenes/Game.ts` — Accepts dynamic `GameData` from server, falls back to static data; shows game description in score bar; handles missing clues gracefully

**Redis cache keys:**
- `jeopardy:game:{gameId}` — cached game data (30 day TTL)
- `jeopardy:latest` — cached latest game response (6 hour TTL)

**Architecture:** Client (MainMenu) → fetch /api/game → Server checks Redis cache → scrapes J-Archive on miss → caches result → returns GameData → Client (Game scene). Graceful fallback: if scraping fails, static questions from `data/questions.ts` are used.

---

## [2026-02-16] Answer Input with Fuzzy Matching & Intro Splash Scene

**Summary:** Two major features: (1) Replaced "Show Answer" → "Got it Right / Got it Wrong" flow with a text input where players type their answer; answers are automatically checked via fuzzy matching. (2) Added a cinematic IntroSplash scene that plays once between Preloader and MainMenu.

**Feature 1: Answer Input with Fuzzy Matching**
- **New file:** `src/client/game/utils/answerMatcher.ts` — exports `checkAnswer(playerAnswer, correctAnswer): MatchResult` with `{ correct, similarity }`; normalizes strings (lowercase, trim, strip punctuation, strip Jeopardy prefixes like "What is...", strip leading articles); matching strategies: exact normalized match, containment check, or Levenshtein similarity ≥ 0.75
- **Game.ts overlay:** Removed `showAnswerButton`, `showAnswerBg`, `rightButton`, `rightBg`, `wrongButton`, `wrongBg`; added `inputDom` (Phaser DOMElement), `submitButton`, `submitBg`, `resultText`, `scored`; enabled `dom: { createContainer: true }` in game config
- **New method:** `submitAnswer()` — reads input, calls `checkAnswer()`, auto-awards/deducts points, shows result ("CORRECT! +$X" in green or "WRONG! -$X" / "TIME'S UP! -$X" in red), reveals correct answer, auto-closes after 2.2s
- Timer timeout now calls `submitAnswer()` with current input (or empty string)
- Submit via Enter key or Submit button click

**Feature 2: Intro Splash Scene**
- **New file:** `src/client/game/scenes/IntroSplash.ts` — Scene key `'IntroSplash'`; black background with 40 animated star particles; gold rays; "THIS..." / "IS" / "JEOPARDY!" text sequence with bounce; 16-particle sparkle burst; "Tap to begin" prompt; fanfare sound; auto-advances after 5s or on click/tap; camera fade to MainMenu
- **Scene order:** Boot → Preloader → IntroSplash → MainMenu → Game → GameOver

---

## [2026-02-16] UI Polish & Animations

**Summary:** Comprehensive visual polish across all scenes with camera fade transitions, refined typography, pill-shaped buttons, board/overlay animations, and improved feedback. All scene transitions now use black camera fade-in/fade-out for smooth flow.

**Files modified:**
- `src/client/game/scenes/Preloader.ts` — Jeopardy-themed: dark blue background, "JEOPARDY!" title text, gold rounded progress bar with percentage text; camera fade out to MainMenu
- `src/client/game/scenes/MainMenu.ts` — Decorative gold lines, title shadow/glow with scale-pulse animation, "Test Your Knowledge" subtitle, pill-shaped Start button with rounded Graphics background, button hover scale (Back.easeOut), stagger entrance animations, camera fade to Game
- `src/client/game/scenes/Game.ts` — Color palette constants, board cell shadows, category headers (darker blue + gold border), cell hover scale + shadow intensify, `animateBoardIn()` stagger entrance, score bar (semi-transparent strip, gold divider, score pulse), overlay scale-in + stagger, rounded panel border, divider line, Georgia serif question text, pill-shaped overlay buttons, answer reveal slide-up, scoring buttons stagger, panel flash feedback, `animateOverlayOut()`, cell-used animation, Daily Double splash animations, Final Jeopardy intro (board out, FJ title bounce, category/wager fade), timer bar tween, timer shake when ≤5s; `BoardCell` + `OverlayElements` interfaces updated
- `src/client/game/scenes/GameOver.ts` — Camera fade in, gold decorative lines, "GAME OVER" bounce-in with shadow/glow, "Final Score" italic label, animated score count-up (`tweens.addCounter`), score pulse, sparkle particles (12 gold circles when score > 0), pill-shaped "PLAY AGAIN" button, button hover scale, camera fade to MainMenu

---

## [2026-02-16] Sound Effects, Score Deduction, Daily Double, Final Jeopardy, Timer Bar

**Workflow:** wf-1739926800
**Version:** v0.0.1.27

**Summary:** Five major features added: (1) Web Audio API sound effects for all game interactions, (2) traditional Jeopardy score deduction for wrong answers (score can go negative), (3) Daily Double mechanic with random cell, splash animation, and wager-based scoring, (4) Final Jeopardy round with 30-second timer after all board cells are used, (5) visual timer bar that changes color from green to yellow to red.

**Files created:**
- `src/client/game/audio/SoundManager.ts` -- Web Audio API sound synthesis singleton with 8 sound types
- `src/client/game/data/finalJeopardy.ts` -- Final Jeopardy question data

**Files modified:**
- `src/client/game/scenes/Game.ts` -- Added Daily Double state (random cell, splash, wager), Final Jeopardy flow (board clear, intro, 30s overlay, transition to GameOver), timer bar (timerBarBg/timerBar rectangles with green/yellow/red color transitions), sound effect triggers in tickTimer/scoreAndClose/revealAnswer, score deduction in scoreAndClose(false), negative score display
- `src/client/game/scenes/GameOver.ts` -- Handle negative score display (e.g., "Final Score: -$200")

---

## [2026-02-16] Score Tracking & Answer Timer

**Workflow:** wf-1739580000
**Version:** v0.0.1.20

**Summary:** Added a 15-second countdown timer to the question overlay and a full scoring system with "Got it Right" / "Got it Wrong" buttons. Score persists across questions and is displayed on the game board and the Game Over screen.

**Files modified:**
- `src/client/game/scenes/Game.ts` -- Added `score`, `timerEvent`, `timerSeconds`, `TIMER_DURATION` properties. Added `OverlayElements.timerText`, `.showAnswerButton`, `.rightButton`, `.wrongButton`, `.timedOut` fields. Implemented `createScoreDisplay()`, `updateScoreDisplay()`, `startTimer()`, `tickTimer()`, `stopTimer()`, `updateTimerDisplay()`, `revealAnswer()`, `scoreAndClose()`, `restoreRevealedState()`. Timer turns red below 5s, auto-reveals at 0.
- `src/client/game/scenes/GameOver.ts` -- Added `finalScore` property, `init(data)` to receive score from Game scene, `scoreText` and `replayText` elements. Background changed to Jeopardy blue.

---

## [2026-02-15] Question Display on Cell Click

**Workflow:** wf-1738972800

**Summary:** Clicking a dollar-value cell now opens a full-screen overlay showing the question. Players can reveal the answer and return to the board. Used cells are visually marked as dark/empty and become non-interactive.

**Files modified:**
- `src/client/game/scenes/Game.ts` -- Added `OverlayElements` interface, `activeQuestion`, `usedCells` state, overlay creation/destruction, `showQuestion()`, `createOverlay()`, `closeOverlay()`, `markCellUsed()`. Updated `createQuestionRow()` for used-cell styling.
- `src/client/game/data/questions.ts` -- **New file.** Contains `Question` interface, `CATEGORIES` array, and `QUESTIONS` 2D array (6 categories x 5 values = 30 questions).

---

## [2026-02-14] Initial Game Menu & Board

**Workflow:** wf-1770526198

**Summary:** Created the initial Jeopardy-themed main menu and a generic 6x6 game board with category headers and dollar values. Established the visual identity (Jeopardy blue, gold text) and responsive layout system.

**Files modified:**
- `src/client/game/scenes/MainMenu.ts` -- Implemented Jeopardy-themed title screen with "JEOPARDY!" text, logo, and "Start Game" button. Added responsive `refreshLayout()`.
- `src/client/game/scenes/Game.ts` -- Created the game board grid with 6 categories, 5 dollar-value rows, interactive cells with hover effects, and responsive `updateLayout()`.
- `src/client/splash/splash.ts` -- Fixed `@typescript-eslint/no-floating-promises` lint error.
