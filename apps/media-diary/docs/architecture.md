# Media Diary — Architecture

## Overview
Media Diary is a Devvit app that lets Reddit users track media they consume (TV shows, movies, books, music, etc.) with ratings and comments. It uses vanilla TypeScript for the UI with no game engine.

## Tech Stack
- **Client**: Vanilla TypeScript + CSS (no framework, no Phaser)
- **Server**: Express.js on Devvit serverless runtime
- **Storage**: Devvit Redis (sorted sets + key-value)
- **Build**: Vite (client multi-page + server SSR bundle)
- **Types**: Shared TypeScript types between client and server

## Directory Structure
```
apps/media-diary/
├── src/
│   ├── client/          # Browser-side code
│   │   ├── splash.html  # Inline post view
│   │   ├── splash/      # Splash screen (entry point)
│   │   ├── app.html     # Expanded diary view
│   │   └── app/         # Main diary UI
│   ├── server/          # Node serverless backend
│   │   ├── index.ts     # Express routes + Redis ops
│   │   └── core/        # Post creation helpers
│   └── shared/          # Shared types
│       └── types/
│           └── api.ts   # All API types and constants
├── devvit.json          # Devvit app config
├── package.json         # Dependencies and scripts
└── tsconfig.json        # Project references
```

## Data Flow
1. User clicks "Open Diary" on splash → expanded mode with `app` entrypoint
2. App fetches entries via `GET /api/entries`
3. User adds entry via form → `POST /api/entries`
4. Server stores entry in Redis (sorted set by date + JSON value)
5. Stats are rebuilt on every write operation

## Redis Schema
| Key Pattern | Type | Purpose |
|---|---|---|
| `md:entries:{userId}` | Sorted Set | Entry IDs sorted by date |
| `md:entry:{userId}:{entryId}` | String (JSON) | Individual entry data |
| `md:stats:{userId}` | String (JSON) | Cached user statistics |
