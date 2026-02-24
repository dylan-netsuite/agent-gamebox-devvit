# Blokus - API Reference

## Server Endpoints

### `GET /api/stats`

Returns the authenticated user's game statistics.

**Response** (`StatsResponse`):
```json
{
  "success": true,
  "stats": {
    "gamesPlayed": 5,
    "gamesWon": 3,
    "totalScore": 12,
    "bestScore": 8,
    "totalPiecesPlaced": 85,
    "perfectGames": 0
  }
}
```

### `POST /api/stats/submit`

Submits a game result. Updates user stats, leaderboard, and community stats.

**Request** (`SubmitResultRequest`):
```json
{
  "playerScore": 5,
  "aiScore": -12,
  "playerPiecesPlaced": 18,
  "won": true,
  "perfect": false
}
```

**Response**: `{ "success": true }`

### `GET /api/leaderboard`

Returns the top 20 players by best score.

**Response** (`LeaderboardResponse`):
```json
{
  "success": true,
  "entries": [
    { "rank": 1, "userId": "t2_abc", "username": "player1", "bestScore": 15, "gamesWon": 10 }
  ],
  "userRank": 5
}
```

### `GET /api/community-stats`

Returns aggregate community statistics.

**Response** (`CommunityStatsResponse`):
```json
{
  "success": true,
  "gamesPlayed": 142,
  "totalPiecesPlaced": 2500
}
```

### `POST /internal/on-app-install`

Triggered on app install. Creates the initial Blokus post.

### `POST /internal/menu/post-create`

Creates a new Blokus post from the subreddit menu.

### `POST /api/game/heartbeat`

Sends a heartbeat to indicate the player is still connected. Checks opponent's heartbeat for staleness.

**Request**: `{ "lobbyCode": "ABC123" }`

**Response**: `{ "success": true }`

**Side effects**: If opponent's heartbeat is >30s stale, broadcasts `player-left` via realtime and sets lobby status to `finished`.

### `POST /api/game/move` (updated)

Now validates moves server-side using `BoardValidator` before broadcasting.

**Request**: `{ "lobbyCode": "ABC123", "move": { "pieceId": "monomino", "cells": [[4,4]], "playerNumber": 1 } }`

**On valid**: Applies move to server board, persists state, broadcasts `player-move`. Returns `{ "success": true }`.

**On invalid**: Returns 400 with `{ "error": "Invalid move: <reason>" }` and broadcasts `move-rejected` to the player.

### `POST /api/game/pass` (updated)

Now validates passes server-side using `BoardValidator`.

## Redis Keys

| Key Pattern | Type | Description |
|-------------|------|-------------|
| `blokus:stats:{userId}` | String (JSON) | User stats object |
| `blokus:lb:score` | Sorted Set | Best scores (member=userId, score=bestScore) |
| `blokus:lb:names` | Hash | userId -> username mapping |
| `blokus:community` | Hash | Aggregate stats (gamesPlayed, totalPiecesPlaced) |
| `blokus_lobby_{code}_state` | String (JSON) | Lobby state (players, status, host) |
| `blokus_lobby_{code}_players` | String (JSON) | Player list for the lobby |
| `blokus_lobby_{code}_heartbeat_{userId}` | String | Last heartbeat timestamp (ms) per player |
| `blokus_lobby_{code}_moves` | String (JSON) | Serialized move history for server-side validation |
| `blokus_lobby_{code}_passes` | String (JSON) | Player pass state for server-side validation |

## Shared Types

All types are defined in `src/shared/types/`:

- `api.ts`: `UserStats`, `GameResult`, `SubmitResultRequest`, `StatsResponse`, `LeaderboardEntry`, `LeaderboardResponse`, `CommunityStatsResponse`
- `multiplayer.ts`: `LobbyInfo`, `LobbyPlayer`, `MultiplayerGameConfig`, `BlokusMove`, `MultiplayerMessage` (includes `move-rejected` type)

## Shared Logic

Located in `src/shared/logic/`:

- `pieces.ts`: Canonical `PieceDefinition` interface and `PIECE_DEFINITIONS` array (21 polyominoes)
- `BoardValidator.ts`: Server-side game state engine with methods: `validateMove()`, `applyMove()`, `applyPass()`, `isGameOver()`, `calculateScore()`, `serialize()`, `deserialize()`
