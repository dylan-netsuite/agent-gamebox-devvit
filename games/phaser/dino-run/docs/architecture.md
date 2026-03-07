# Architecture

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Game Engine | Phaser 3.88.2 |
| Language | TypeScript 5.8.2 |
| Bundler | Vite 6.2.4 |
| Server | Express 5.1.0 on Devvit serverless |
| Storage | Devvit Redis |
| Platform | Devvit (@devvit/web 0.12.11) |

## Project Layout

```
games/phaser/dino-run/
├── src/
│   ├── client/                  # Browser-side code
│   │   ├── splash.html          # Inline Reddit card entry
│   │   ├── splash/              # Splash screen (CSS + TS)
│   │   ├── game.html            # Fullscreen game entry
│   │   └── game/
│   │       ├── game.ts          # Phaser bootstrap
│   │       ├── game.css         # Canvas container styles
│   │       ├── scenes/          # Phaser scenes (Boot → Preloader → MainMenu → Game → GameOver, Leaderboard)
│   │       └── utils/
│   │           └── textures.ts  # Procedural sprite generation
│   ├── server/
│   │   ├── index.ts             # Express API routes
│   │   └── core/post.ts         # Post creation helper
│   └── shared/
│       └── types/api.ts         # Shared request/response types
├── devvit.json                  # Devvit app configuration
├── package.json                 # Dependencies and scripts
└── tools/tsconfig-base.json     # Shared TypeScript config
```

## Data Flow

```
User taps post → Splash (splash.html)
   ├── fetch('/api/stats') → Show high score
   └── PLAY button → requestExpandedMode('game')
                         ↓
               Game (game.html) → Phaser boot
                         ↓
               Boot → Preloader → MainMenu → DinoGame
                                                ↓
                                          Game Over
                                      fetch('/api/score/submit')
                                                ↓
                                         Server (Express)
                                      redis.set / redis.zAdd
```

## Build Pipeline

- **Client**: Vite builds `splash.html` and `game.html` as separate entry points. Phaser is chunked into its own bundle (`phaser.js`) for caching.
- **Server**: Vite builds `index.ts` as a CJS module targeting Node 22.
- **Output**: `dist/client/` and `dist/server/` are referenced by `devvit.json`.

## Graphics

All sprites are generated procedurally in `TextureFactory` using `Phaser.GameObjects.Graphics.generateTexture()`. No external image assets are required. This keeps the bundle small and avoids asset loading latency.
