# API Reference

## Server Endpoints

The Express server runs as a Devvit serverless function. All public endpoints use the `/api/` prefix. Internal endpoints use `/internal/`.

### `GET /api/game`

Fetch game data for the Jeopardy board. Supports two game modes.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'latest'` \| `'onthisday'` | Yes | `latest` = yesterday's episode; `onthisday` = random game from this date in a previous year |
| `gameId` | `number` | No | Fetch a specific cached game by ID (used for resume flow) |

**Response (200):**
```typescript
{
  success: boolean;
  data?: GameData;
  fallback?: boolean;   // true if scraping failed
  error?: string;
}
```

**Caching:** Results are cached in Redis. Cache hit returns immediately; cache miss triggers J-Archive scrape.

---

### `GET /api/stats`

Fetch the authenticated user's cumulative stats.

**Response (200):**
```typescript
{
  success: boolean;
  stats?: UserStats;
  error?: string;
}
```

**Authentication:** Requires `context.userId` (provided by Devvit platform). Returns 401 if not authenticated.

---

### `POST /api/stats/submit`

Submit game results after completing a game. The server updates the user's cumulative stats.

**Request Body:**
```typescript
{
  score: number;
  description: string;
  answers: AnswerResult[];
}
```

**Response (200):**
```typescript
{ success: boolean }
```

**Authentication:** Requires `context.userId`. Returns 401 if not authenticated.

---

### `GET /api/leaderboard`

Fetch the community leaderboard (top 20 players by best single-game score) plus the current user's rank.

**Response (200):**
```typescript
{
  success: boolean;
  entries: LeaderboardEntry[];  // Top 20, sorted by bestScore descending
  userRank?: number;            // Current user's 1-based rank (if on leaderboard)
  userEntry?: LeaderboardEntry; // Current user's full entry (if on leaderboard)
  error?: string;
}
```

Each `LeaderboardEntry`:
```typescript
{
  rank: number;
  userId: string;
  username: string;
  bestScore: number;
  gamesPlayed: number;
}
```

**No authentication required to view.** The user's own rank/entry are populated when `context.userId` is available.

---

### `POST /api/question-stats`

Submit an answer result for a specific question and receive community-wide stats.

**Request Body:**
```typescript
{
  questionId: string;  // Deterministic ID: "g{gameId}_{round}_{col}_{row}" or "g{gameId}_FJ"
  correct: boolean;
}
```

**Response (200):**
```typescript
{
  success: boolean;
  correct: number;   // Total correct answers across all players
  total: number;     // Total answers across all players
}
```

**No authentication required.** Every player's answer is recorded anonymously. The response includes the updated community stats so the client can display "X% of N players got this right."

---

### `GET /api/game/save`

Load the user's saved game state (if any).

**Response (200):**
```typescript
{
  success: boolean;
  state?: SavedGameState;  // Present if a save exists
  error?: string;
}
```

**Requires authentication** (`context.userId`). Returns `{ success: true }` with no `state` if no save exists.

---

### `POST /api/game/save`

Save the current game state for later resumption.

**Request Body:**
```typescript
{
  gameId: number;
  round: 'J' | 'DJ';
  score: number;
  usedCells: string[];       // e.g. ["0-0", "1-2", ...]
  gameResults: AnswerResult[];
  gameDescription: string;
  savedAt: string;           // ISO timestamp
}
```

**Response (200):** `{ success: boolean }`

**Requires authentication.** Save expires after 30 days. Redis key: `jeopardy:save:{userId}`.

---

### `DELETE /api/game/save`

Clear the user's saved game (called when a game completes).

**Response (200):** `{ success: boolean }`

**Requires authentication.**

---

### `POST /internal/on-app-install`

Triggered automatically when the app is installed on a subreddit. Creates the initial Jeopardy post.

### `POST /internal/menu/post-create`

Triggered from the subreddit mod menu action "Create a new post".

## Redis Cache Keys

| Key | TTL | Description |
|-----|-----|-------------|
| `jeopardy:game:{gameId}` | 30 days | Cached game data for a specific J-Archive game |
| `jeopardy:latest` | 6 hours | Cached response for "Latest Game" mode |
| `jeopardy:stats:{userId}` | None (permanent) | Per-user cumulative stats (JSON blob) |
| `jeopardy:qstats:{questionId}` | None (permanent) | Per-question community stats `{correct, total}` |
| `jeopardy:lb:best` | None (permanent) | Sorted set — member=userId, score=best game score |
| `jeopardy:lb:games` | None (permanent) | Sorted set — member=userId, score=games played |
| `jeopardy:lb:names` | None (permanent) | Hash — userId → username mapping |

**Note:** Score, used cells, round state, and wager state are ephemeral and stored client-side in Phaser scene memory. They reset on page reload.

## Shared Types

Defined in `src/shared/types/api.ts`:

```typescript
export type GameType = 'latest' | 'onthisday';

export interface Clue {
  id: number;
  question: string;
  answer: string;
  value: number;
  category: string;
  col: number; // 1-6
  row: number; // 1-5
}

export interface FinalJeopardyClue {
  category: string;
  question: string;
  answer: string;
}

export interface GameData {
  gameId: number;
  airDate: string;
  categories: string[];       // 6 J round category names
  clues: Clue[];              // J round clues (up to 30)
  djCategories?: string[];    // 6 DJ round category names
  djClues?: Clue[];           // DJ round clues (up to 30)
  finalJeopardy: FinalJeopardyClue | null;
  gameType: GameType;
  description: string;
}

export interface GameResponse {
  success: boolean;
  data?: GameData;
  error?: string;
  fallback?: boolean;
}

// Stats types
export interface AnswerResult {
  value: number;
  correct: boolean;
  isDailyDouble: boolean;
  isFinalJeopardy: boolean;
}

export interface GameResult {
  score: number;
  description: string;
  answers: AnswerResult[];
}

export interface UserStats {
  totalAnswered: number;
  totalCorrect: number;
  gamesPlayed: number;
  bestGame: { score: number; date: string; description: string } | null;
  longestStreak: number;
  currentStreak: number;
  correctByValue: Record<string, { correct: number; total: number }>;
  finalJeopardy: { correct: number; total: number };
}

export interface StatsResponse {
  success: boolean;
  stats?: UserStats;
  error?: string;
}

// Per-question community stats
export interface QuestionStatsRequest {
  questionId: string;
  correct: boolean;
}

export interface QuestionStatsResponse {
  success: boolean;
  correct: number;
  total: number;
}

// Leaderboard types
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  bestScore: number;
  gamesPlayed: number;
}

export interface LeaderboardResponse {
  success: boolean;
  entries: LeaderboardEntry[];
  userRank?: number;
  userEntry?: LeaderboardEntry;
  error?: string;
}
```

## Scraper Module

`src/server/scraper.ts` — Extracts game data from J-Archive.com.

### Exported Functions

| Function | Description |
|----------|-------------|
| `lookupGameByDate(date)` | Resolves YYYY-MM-DD date to J-Archive game ID via season pages |
| `scrapeGame(gameId, airDate, gameType)` | Scrapes game page for J round categories/clues, DJ round categories/clues, and Final Jeopardy |
| `findLatestGame()` | Searches backward from yesterday up to 14 days |
| `findOnThisDayGame()` | Tries up to 10 random years for current month/day |

### Scraper Details

- **J Round clues:** Extracted from `.clue_text` elements with ID pattern `clue_J_{col}_{row}`. Values = row * 200.
- **DJ Round clues:** Extracted from `.clue_text` elements with ID pattern `clue_DJ_{col}_{row}`. Values = row * 400.
- **Final Jeopardy:** Extracted from `#clue_FJ` and `#clue_FJ_r .correct_response`.
- **Categories:** J from `#jeopardy_round .category_name`, DJ from `#double_jeopardy_round .category_name`, FJ from `#final_jeopardy_round .category_name`.
- **Text cleaning:** All extracted text passes through `cleanHtmlText()` which decodes HTML entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#039;`), removes backslash escapes, and normalizes whitespace.
- **Logging:** Structured `[scraper]` log messages for game lookup results, clue counts per round, and errors.

## Menu Actions

| Label | Location | For | Endpoint |
|-------|----------|-----|----------|
| "Create a new post" | subreddit | moderator | `/internal/menu/post-create` |

## Triggers

| Event | Endpoint |
|-------|----------|
| `onAppInstall` | `/internal/on-app-install` |
