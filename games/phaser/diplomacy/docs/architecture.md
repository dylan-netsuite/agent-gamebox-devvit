# Diplomacy - Architecture

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Client | Phaser 3.88 (WebGL), TypeScript, Vite |
| Server | Express (Devvit serverless), TypeScript, Vite |
| Persistence | Devvit Redis |
| Platform | Reddit Devvit (`@devvit/web`) |

## Directory Structure

```
games/phaser/diplomacy/
├── src/
│   ├── client/           # Browser-side code
│   │   ├── splash.html   # Inline webview (splash screen)
│   │   ├── splash/       # Splash screen TS/CSS
│   │   ├── game.html     # Expanded Phaser game
│   │   └── game/         # Phaser scenes, UI components
    │   │       ├── game.ts   # Phaser config & entry (RESIZE mode, 100% sizing)
    │   │       ├── scenes/   # Boot, Preloader, MainMenu, GamePlay, GameOver
    │   │       ├── ui/       # MapRenderer, provinceGeometry, coastlines (w/ decorative islands & Switzerland), mapBackground (SVG gen, unused), ProvinceTooltip, OrderPanel, StatusBar
    │   │       └── data/     # (uses shared/data)
│   ├── server/           # Devvit serverless backend
│   │   ├── index.ts      # Express routes & API
│   │   └── core/         # Game logic modules
│   │       ├── gameState.ts     # Redis state management
│   │       ├── orderResolver.ts # Diplomacy order resolution engine
│   │       ├── botLogic.ts      # Bot player AI & auto-submit
│   │       └── post.ts          # Reddit post creation
│   └── shared/           # Shared between client & server
│       ├── types/        # TypeScript interfaces
│       │   ├── game.ts   # GameState, Country, Unit, etc.
│       │   ├── orders.ts # Order types & formatting
│       │   ├── map.ts    # Province & adjacency types
│       │   └── api.ts    # API request/response types
│       └── data/         # Game data
│           ├── provinces.ts       # 75 provinces with coordinates
│           ├── adjacencies.ts     # Movement graph
│           └── startingPositions.ts # Spring 1901 setup
├── devvit.json           # Devvit app config
├── package.json          # Dependencies & scripts
└── docs/                 # Documentation
```

## Client-Server Communication

The client communicates with the server via `fetch()` calls to API endpoints. The Devvit framework proxies these through its webview infrastructure.

```
Client (Phaser) --fetch()--> Server (Express) --redis--> Devvit Redis
```

## Build Pipeline

- **Client**: `vite build` produces `dist/client/` with `splash.html` and `game.html`
- **Server**: `vite build --ssr` produces `dist/server/index.cjs`
- **Deploy**: `npx devvit playtest` uploads both bundles
