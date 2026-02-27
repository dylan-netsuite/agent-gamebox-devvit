# Meerca Chase - Architecture

## Tech Stack

- **Engine**: Phaser 3.88.2 (WebGL, Canvas fallback)
- **Client**: TypeScript, Vite, HTML/CSS
- **Server**: Express 5 on Node 22 (serverless via `@devvit/web/server`)
- **Storage**: Redis (via `@devvit/web/server`)
- **Platform**: Reddit Devvit

## Project Structure

```
games/phaser/meerca-chase/
├── src/
│   ├── client/
│   │   ├── splash.html          # Inline post card entry
│   │   ├── game.html            # Fullscreen game entry
│   │   ├── splash/              # Splash screen (CSS + TS)
│   │   └── game/
│   │       ├── game.ts          # Phaser bootstrap
│   │       ├── scenes/          # Boot, Preloader, MainMenu, Game, GameOver, Leaderboard
│   │       ├── objects/         # Meerca (snake), Negg (collectible)
│   │       ├── data/            # Negg type definitions
│   │       └── utils/           # Grid helpers, procedural textures
│   ├── server/
│   │   ├── index.ts             # Express routes + Redis logic
│   │   └── core/post.ts         # Reddit post creation
│   └── shared/
│       └── types/api.ts         # Shared request/response interfaces
├── devvit.json                  # Devvit app config
├── package.json
└── docs/
```

## Data Flow

1. **Splash** (inline post): User sees title card, clicks PLAY
2. **Expanded mode**: `requestExpandedMode()` opens `game.html`
3. **Phaser boot**: Boot → Preloader → MainMenu
4. **Gameplay**: MainMenu → Game (with difficulty param) → GameOver
5. **Score submit**: GameOver POSTs to `/api/score/submit` → Redis
6. **Leaderboard**: Fetches from `/api/leaderboard` → Redis sorted set

## Build Pipeline

- **Client**: Vite multi-page build (`splash.html` + `game.html`) → `dist/client/`
- **Server**: Vite SSR build (`index.ts`) → `dist/server/index.cjs`
- **Phaser**: Chunked separately via `manualChunks` for caching
