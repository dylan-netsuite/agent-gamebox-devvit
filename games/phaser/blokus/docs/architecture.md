# Blokus - Architecture

## Tech Stack

- **Engine**: Phaser 3.88.2 (WebGL/Canvas)
- **Server**: Express 5 on Devvit serverless runtime
- **Storage**: Devvit Redis
- **Build**: Vite 6 (client + server)
- **Language**: TypeScript 5.8 (strict mode)
- **Platform**: Reddit Devvit (custom post app)

## Project Structure

```
games/phaser/blokus/
├── src/
│   ├── client/
│   │   ├── splash.html          # Inline splash screen (default entrypoint)
│   │   ├── game.html            # Full game (expanded mode entrypoint)
│   │   ├── splash/
│   │   │   ├── splash.ts        # Splash logic (requestExpandedMode)
│   │   │   └── splash.css       # Splash styling
│   │   └── game/
│   │       ├── game.ts          # Phaser bootstrap + config
│   │       ├── game.css         # Game container styles
│   │       ├── data/
│   │       │   └── pieces.ts    # 21 polyomino piece definitions + transforms
│   │       ├── logic/
│   │       │   ├── BoardLogic.ts # Board state, validation, scoring
│   │       │   └── AIPlayer.ts   # AI opponent with scoring heuristics
│   │       └── scenes/
│   │           ├── Boot.ts       # Minimal bootstrap
│   │           ├── Preloader.ts  # Loading screen
│   │           ├── MainMenu.ts   # Title + navigation
│   │           ├── Game.ts       # Core gameplay
│   │           ├── GameOver.ts   # Results display
│   │           ├── HowToPlay.ts  # Rules tutorial
│   │           └── Leaderboard.ts # Score rankings
│   ├── server/
│   │   ├── index.ts             # Express API + Redis
│   │   └── core/
│   │       └── post.ts          # Devvit post creation
│   └── shared/
│       └── types/
│           └── api.ts           # Shared API types
├── devvit.json                  # Devvit app config
├── package.json                 # Dependencies + scripts
└── docs/                        # Documentation
```

## Data Flow

1. **Splash** (`splash.html`): Inline in Reddit post. User clicks PLAY -> `requestExpandedMode('game')`.
2. **Game** (`game.html`): Phaser boots, scenes run. Game logic is fully client-side.
3. **Results**: On game end, client POSTs to `/api/stats/submit` to persist score.
4. **Leaderboard**: Client GETs `/api/leaderboard` to fetch rankings from Redis.

## Key Design Decisions

- **Client-side game logic**: All Blokus rules, AI, and board state run in the browser. Server only handles persistence.
- **Procedural graphics**: No external image assets. All pieces, board, and UI drawn with Phaser Graphics API.
- **Responsive layout**: Board and tray scale dynamically using `Phaser.Scale.RESIZE` mode.
- **Blokus Duo variant**: 14x14 board, 2 players, center starting positions. Simpler than full 4-player Blokus.
