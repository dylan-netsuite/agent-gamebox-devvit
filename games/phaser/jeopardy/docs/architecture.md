# Architecture

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Platform | Reddit Devvit | 0.12.11 |
| Game Engine | Phaser 3 | 3.88.2 |
| Language | TypeScript | 5.8.2 |
| Build Tool | Vite | 6.2.4 |
| Server Framework | Express | 5.1.0 |
| Data Store | Devvit Redis | (provided by platform) |
| Linting | ESLint + typescript-eslint | 9.23.0 / 8.29.0 |
| Formatting | Prettier | 3.5.3 |

## Project Layout

```
jeopardy-devvit/
├── src/
│   ├── client/           # Browser-side code (Phaser game + splash page)
│   │   ├── splash/       # Splash page (inline entry, shown in Reddit feed)
│   │   │   └── splash.ts
│   │   ├── game/         # Phaser game (expanded/fullscreen entry)
│   │   │   ├── game.ts         # Phaser config + bootstrap
│   │   │   ├── audio/          # Sound synthesis
│   │   │   │   └── SoundManager.ts
│   │   │   ├── utils/          # Game utilities
│   │   │   │   └── answerMatcher.ts   # Fuzzy answer matching (normalization, Levenshtein)
│   │   │   ├── data/           # Static game data
│   │   │   │   ├── questions.ts
│   │   │   │   └── finalJeopardy.ts
│   │   │   └── scenes/         # Phaser scene classes
│   │   │       ├── Boot.ts
│   │   │       ├── Preloader.ts
│   │   │       ├── IntroSplash.ts
│   │   │       ├── MainMenu.ts
│   │   │       ├── Game.ts
│   │   │       ├── GameOver.ts
│   │   │       ├── StatsScene.ts
│   │   │       ├── CommunityStatsScene.ts
│   │   │       └── LeaderboardScene.ts
│   │   └── vite.config.ts
│   ├── server/           # Serverless Express backend
│   │   ├── index.ts      # Routes and server setup
│   │   ├── scraper.ts    # J-Archive scraping module
│   │   ├── core/
│   │   │   └── post.ts   # Post creation helper
│   │   └── vite.config.ts
│   └── shared/           # Types shared between client and server
│       └── types/
│           └── api.ts
├── assets/               # Static assets (images)
├── docs/                 # Project documentation (this directory)
├── .cursor/              # Cursor IDE config, rules, and skills
├── .workflows/           # Agentic workflow state (gitignored)
├── devvit.json           # Devvit app configuration
├── package.json
└── tsconfig.json
```

## Entry Points

Devvit apps have two web-view entry points defined in `devvit.json`:

| Entry | File | Mode | Purpose |
|-------|------|------|---------|
| `default` | `splash.html` | Inline (in-feed) | Compact splash card with "Start" button |
| `game` | `game.html` | Expanded (fullscreen) | Full Phaser game experience |

The splash page calls `requestExpandedMode(e, 'game')` to transition from the inline card to the fullscreen game view.

## Build Pipeline

```
npm run build
  ├── npm run build:client   →  vite build (src/client → dist/client)
  └── npm run build:server   →  vite build (src/server → dist/server/index.cjs)
```

Both bundles are output to `dist/` which is referenced by `devvit.json`:
- `post.dir` → `dist/client`
- `server.dir` → `dist/server`

## Deployment Flow

```
Local development:
  npm run dev          # Concurrent client watch + server watch + devvit playtest

Manual deploy:
  npm run deploy       # build + devvit upload (to staging)
  npm run launch       # build + upload + devvit publish (to production)
```

`devvit playtest` uploads the built assets and creates a live-reloading session on a test subreddit.

## Data Flow

```
┌─────────────────────────────────────────────────────┐
│  Reddit (reddit.com)                                │
│  ┌───────────────────────────────────────────────┐  │
│  │  Devvit Post (iframe)                         │  │
│  │  ┌──────────────┐    ┌─────────────────────┐  │  │
│  │  │ Splash Page   │───▶│ Phaser Game          │  │  │
│  │  │ (inline card) │    │ (expanded webview)   │  │  │
│  │  └──────────────┘    └────────┬────────────┘  │  │
│  └──────────────────────────────┼────────────────┘  │
│                                  │ fetch('/api/game')  │
│  ┌──────────────────────────────▼────────────────┐  │
│  │  Express Server (serverless)                   │  │
│  │  GET /api/game?type=latest|onthisday           │  │
│  │  GET /api/stats, POST /api/stats/submit        │  │
│  │  GET /api/community-stats                      │  │
│  │  /internal/on-app-install, /internal/menu/... │  │
│  └──────────────────────────────┬────────────────┘  │
│                                  │                    │
│  ┌──────────────────────────────▼────────────────┐  │
│  │  Devvit Redis                                  │  │
│  │  jeopardy:game:{gameId}, jeopardy:latest       │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Scraping Pipeline

Game data is fetched live from J-Archive.com instead of static files:

1. **Client (MainMenu)** — User selects "Latest Game" or "On this Day" → `fetch(/api/game?type=latest|onthisday)`
2. **Server** — Checks Redis cache for existing game data
3. **Cache hit** — Returns cached `GameData` immediately
4. **Cache miss** — Scraper module (`src/server/scraper.ts`) fetches J-Archive:
   - `lookupGameByDate(date)` — Resolves date to J-Archive game ID via season pages
   - `scrapeGame(gameId, airDate, gameType)` — Scrapes game page for J round categories/clues, DJ round categories/clues, and Final Jeopardy
   - `findLatestGame()` — Searches backward from yesterday up to 14 days
   - `findOnThisDayGame()` — Tries up to 10 random years for current month/day
5. **Text cleaning** — All extracted text passes through `cleanHtmlText()` which handles HTML entity decoding, backslash removal, and whitespace normalization
6. **Cache write** — Result stored in Redis with TTL
7. **Response** — Returns `GameResponse` with `GameData` (including DJ data) or fallback indicator
8. **Client (Game scene)** — Accepts dynamic `GameData`, loads both J and DJ rounds, falls back to static data if scraping fails

**Logging:** Both the scraper and server endpoint emit structured `[scraper]` and `[api/game]` log messages for game lookups, clue counts, and errors to aid production debugging.

## Game Rounds

The game follows real Jeopardy structure:

| Round | Categories | Values | Daily Doubles | Trigger |
|-------|-----------|--------|---------------|---------|
| Jeopardy | 6 (from `categories`) | $200-$1000 | 1 | Game start |
| Double Jeopardy | 6 (from `djCategories`) | $400-$2000 | 2 | All J cells used |
| Final Jeopardy | 1 (from `finalJeopardy`) | Player wager | N/A | All DJ cells used |

Static fallback data provides separate question sets for J round (`CATEGORIES`/`QUESTIONS`) and DJ round (`DJ_CATEGORIES`/`DJ_QUESTIONS`).

## User Stats

Per-user stats are tracked in Redis, keyed by Devvit `context.userId`. The Game scene records each answer result during gameplay and submits them to the server when transitioning to GameOver. The StatsScene fetches and visualizes this data.

```
Game scene (client)
  │ tracks AnswerResult[] during gameplay
  │
  ▼ POST /api/stats/submit
Express Server
  │ updates UserStats in Redis
  │
  ▼ GET /api/stats
StatsScene (client)
  │ renders data visualizations
```

## Community Question Stats

Per-question stats are tracked via `POST /api/question-stats`. After each answer, the server records whether the player got it right and how long they took. The client displays:
1. Community correct % (e.g., "67% of 12 players got this right")
2. User's answer time (e.g., "Your time: 4.2s")
3. Average correct answer time (e.g., "Avg correct: 6.1s") — shown only when at least one correct answer exists

The timing data is stored alongside the existing correct/total counts in Redis, using a `totalCorrectTime` field to compute averages.

## Community Stats Dashboard

The CommunityStatsScene displays aggregate data across all players, sourced from:

1. **Leaderboard sorted sets** — `totalPlayers` from `zCard(LB_BEST_KEY)`, top 3 from `zRange`
2. **Community hash** (`jeopardy:community`) — Global counters incremented by game submissions and per-question stats

```
POST /api/stats/submit
  │ increments gamesPlayed, questionsAnswered, questionsCorrect
  │
POST /api/question-stats
  │ increments totalCorrectTimeTenths, totalCorrectAnswers (for correct answers)
  │
  ▼ GET /api/community-stats
CommunityStatsScene (client)
  │ renders hero stat, stat cards, arc ring, avg time, top 3 podium
```

## Cache Strategy

| Key | TTL | Description |
|-----|-----|-------------|
| `jeopardy:game:{gameId}` | 30 days | Cached game data for a specific J-Archive game |
| `jeopardy:latest` | 6 hours | Cached response for "Latest Game" mode |
| `jeopardy:stats:{userId}` | None (permanent) | Per-user stats (JSON blob) |
| `jeopardy:qstats:{questionId}` | None (permanent) | Per-question stats: `{correct, total, totalCorrectTime}` |
| `jeopardy:community` | None (permanent) | Global counters (hash): `gamesPlayed`, `questionsAnswered`, `questionsCorrect`, `totalCorrectTimeTenths`, `totalCorrectAnswers` |
| `jeopardy:save:{userId}` | 30 days | Saved game state for board persistence (JSON blob) |

## Responsive Design

The Phaser game uses `Phaser.Scale.RESIZE` mode, which means the canvas dynamically resizes to fill the available space. Each scene implements an `updateLayout(width, height)` or `buildUI()` method that repositions all game objects when the viewport changes. The base design resolution is 1024x768, with a `scaleFactor` computed as `Math.min(width / 1024, height / 768)`.

All scenes use the scale factor (`sf`) to scale font sizes, button dimensions, margins, and spacing. Each scaled value has an enforced minimum to remain readable at small viewports (e.g., `Math.max(14, Math.round(32 * sf))` for dollar values). At a typical mobile Devvit webview width of ~375px, `sf` is approximately 0.32–0.37.

| Scene | Scaling | Resize Handler |
|-------|---------|----------------|
| Preloader | `sf` for title and loading text | None (runs once) |
| MainMenu | `sf` for all text and buttons, `setScale(sf)` | `buildUI()` on resize |
| Game | `sf` for board, overlays, splashes, score bar | `updateLayout()` on resize |
| GameOver | `sf` for title, score, button | `buildUI()` on resize |
| StatsScene | `sf` for all cards, charts, text | `buildUI()` on resize |
| CommunityStatsScene | `sf` for hero, cards, arc ring, podium | `buildUI()` on resize |
| LeaderboardScene | `sf` for title bar, rows, fonts | `buildUI()` on resize |

## Game Utilities

**`answerMatcher.ts`** — Fuzzy answer matching for typed player responses. Exports `checkAnswer(playerAnswer, correctAnswer): MatchResult` returning `{ correct, similarity }`. Normalizes both strings (lowercase, trim, strip punctuation, Jeopardy prefixes like "What is...", leading articles). Matching strategies: exact normalized match, containment check, or Levenshtein similarity ≥ 0.75.

**`textCleaner.ts`** — Client-side HTML entity decoder. Exports `decodeHtmlEntities(text): string` which uses the browser's `textarea.innerHTML` parser to decode all HTML entities (named, decimal, hex) and handles double-encoding. Also repairs corrupted ampersand sequences from old cache data where `&amp;` got mangled into garbled Unicode.
