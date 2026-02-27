# Rush Hour - Architecture

## Tech Stack

- **Engine**: Phaser 3.88 (Canvas/WebGL)
- **Client**: TypeScript + Vite
- **Server**: Express on Devvit serverless runtime
- **Storage**: Devvit Redis (sorted sets, hashes, key-value)
- **Platform**: Reddit Devvit (custom post with webview)

## Project Structure

```
games/phaser/rush-hour/
├── src/
│   ├── client/           # Browser-side code
│   │   ├── splash/       # Inline splash screen (pre-expand)
│   │   └── game/         # Phaser game (post-expand)
│   │       ├── scenes/   # Phaser scene classes
│   │       ├── data/     # Puzzle catalog + daily puzzle pool
│   │       ├── utils/    # BFS solver, validation, sounds
│   │       └── data/__tests__/  # BFS puzzle validation tests
│   ├── server/           # Devvit serverless backend
│   │   ├── index.ts      # Express routes
│   │   └── core/         # Post creation
│   └── shared/           # Shared types between client/server
│       └── types/
├── tools/                # Puzzle generation & import tooling
│   ├── import-fogleman.ts  # Parses Fogleman database → puzzles.ts
│   ├── gen.ts              # Simulated annealing puzzle generator
│   └── rush.txt            # Fogleman Rush Hour database (2.5M configs)
├── dist/                 # Build output
├── assets/               # Static assets
└── docs/                 # Documentation
```

## Data Flow

1. **Splash** → User clicks PLAY → `requestExpandedMode('game')` → Phaser boots
2. **MainMenu** → User selects mode → Scene transition
3. **Game** → Puzzle loaded from catalog or server → User drags vehicles → Win detection → Submit to server
4. **Server** → Stores stats in Redis → Updates leaderboards → Returns rankings

## Redis Schema

| Key Pattern | Type | Purpose |
|-------------|------|---------|
| `rh:stats:{userId}` | string (JSON) | User statistics |
| `rh:daily:{date}` | string (JSON) | Daily puzzle config |
| `rh:daily:result:{date}:{userId}` | string (JSON) | User's daily result |
| `rh:lb:daily:{date}:moves` | sorted set | Daily leaderboard by moves |
| `rh:lb:daily:{date}:time` | sorted set | Daily leaderboard by time |
| `rh:lb:alltime:solved` | sorted set | All-time puzzles solved |
| `rh:lb:alltime:speed` | sorted set | All-time average speed |
| `rh:lb:names` | hash | userId → username mapping |
| `rh:user-puzzle:{id}` | string (JSON) | User-created puzzle |
| `rh:user-puzzles:{userId}` | sorted set | User's created puzzle IDs |
| `rh:community` | hash | Global counters |
| `rh:progress:{userId}:{puzzleId}` | string (JSON) | Per-puzzle best result (stars, moves, time) |
| `rh:progress-index:{userId}` | sorted set | Index of puzzle IDs with saved progress |
