# Scattergories - Architecture

## Tech Stack

- **Engine**: Phaser 3.88.2 (2D game framework)
- **Client**: TypeScript + Vite, runs in Devvit webview iframe
- **Server**: Express.js on Devvit serverless runtime (Node 22)
- **State**: Redis via `@devvit/web/server`
- **Realtime**: Devvit Realtime for multiplayer messaging
- **Platform**: Reddit Devvit custom post

## Project Structure

```
games/phaser/scattergories/
├── devvit.json           # App config (name: scatter-devvit)
├── package.json          # Dependencies and scripts
├── src/
│   ├── client/           # Browser-side code
│   │   ├── splash.*      # Inline post entry point
│   │   └── game/         # Full-screen Phaser app
│   │       ├── game.ts   # Phaser config + scene registry
│   │       ├── scenes/   # All game scenes
│   │       └── systems/  # MultiplayerManager, SoundManager
│   ├── server/           # Serverless backend
│   │   ├── index.ts      # Express routes + realtime broadcast
│   │   └── core/         # Business logic modules
│   └── shared/           # Shared code (types, validation)
│       ├── types/        # TypeScript type definitions
│       ├── validation.ts # Answer format + category validation
│       └── categoryRelevance.ts # Category classification + word lists
└── dist/                 # Build output
```

## Data Flow

### Single Player
1. Client picks random letter + category list locally
2. Player fills in answers during 90s timer
3. Client-side scoring validates answers (format check + category relevance)
4. Results displayed immediately

### Multiplayer
1. Host creates lobby, players join via code or quick match
2. Host starts game -> server picks letter + categories, broadcasts via realtime
3. Players submit answers to server via `POST /api/game/submit-answers`
4. Server collects all answers, performs duplicate detection, scores
5. Server broadcasts `round-results` to all players via realtime
6. After 3 rounds, server broadcasts `game-over` with final standings
7. Stats recorded to Redis leaderboard

## Key Design Decisions

- **Server-authoritative scoring** for multiplayer to prevent cheating
- **Category-aware validation** shared between client and server via `shared/validation.ts` and `shared/categoryRelevance.ts`
- **DOM overlay inputs** for text entry (Phaser has no native text input)
- **Realtime channels** per lobby: `scatter_lobby_{code}`
- **Redis TTL** of 2 hours on all lobby keys for automatic cleanup
