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

Sends a heartbeat to indicate the player is still connected. Manages disconnection detection, grace periods, and turn timer enforcement.

**Request**: `{ "lobbyCode": "ABC123" }`

**Response**: `{ "success": true }`

**Side effects**:
- If the calling player was previously marked as disconnected, clears the disconnection state and broadcasts `player-reconnected`.
- If opponent's heartbeat is >30s stale, marks them as disconnected and broadcasts `player-disconnected`. Starts 60s grace period.
- If opponent's disconnection grace period (60s) expires, broadcasts `player-left` and sets lobby status to `finished`.
- If the current turn exceeds `turnTimerSeconds` (default 90s), auto-passes the current player and broadcasts `turn-timeout` + `player-pass`.

### `POST /api/game/start`

Host starts the game. Server auto-marks the host as `ready` before checking `allReady` to prevent race conditions.

**Request**: `{ "lobbyCode": "ABC123" }`

**Response**: `{ "success": true }`

**Side effects**: Broadcasts `game-start` with `MultiplayerGameConfig` (includes `turnTimerSeconds`). Initializes `turnStartedAt` in Redis.

### `POST /api/game/move`

Validates moves server-side using `BoardValidator` before broadcasting. Resets turn timer on success.

**Request**: `{ "lobbyCode": "ABC123", "move": { "pieceId": "monomino", "cells": [[4,4]], "playerNumber": 1 } }`

**On valid**: Applies move to server board, persists state, resets `turnStartedAt`, broadcasts `player-move`. Returns `{ "success": true }`.

**On invalid**: Returns 400 with `{ "error": "Invalid move: <reason>" }` and broadcasts `move-rejected` to the player.

### `POST /api/game/pass`

Validates passes server-side using `BoardValidator`. Resets turn timer on success.

### `POST /api/game/reconnect`

Allows a disconnected player to retrieve the current game state for client-side reconstruction.

**Request**: `{ "lobbyCode": "ABC123" }`

**Response**:
```json
{
  "success": true,
  "config": { "lobbyCode": "ABC123", "players": [...], "turnTimerSeconds": 90 },
  "movesJson": "[{\"pieceId\":\"monomino\",\"cells\":[[4,4]],\"playerNumber\":1}]",
  "playerNumber": 2,
  "opponentName": "player1"
}
```

**Side effects**: Clears disconnection state and broadcasts `player-reconnected`.

### `POST /api/lobbies/join`

Joins a lobby by code. If the lobby is in `playing` state and the requesting user is a participant, returns `reconnect: true` so the client can initiate the reconnection flow.

**Request**: `{ "code": "ABC123" }`

**Response (normal)**: `{ "success": true, "lobby": {...} }`

**Response (reconnect)**: `{ "success": true, "lobby": {...}, "reconnect": true }`

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
| `blokus_lobby_{code}_disconnectedAt_{userId}` | String | Disconnection timestamp (ms) for grace period tracking |
| `blokus_lobby_{code}_turnStartedAt` | String | Turn start timestamp (ms) for turn timer enforcement |

## Shared Types

All types are defined in `src/shared/types/`:

- `api.ts`: `UserStats`, `GameResult`, `SubmitResultRequest`, `StatsResponse`, `LeaderboardEntry`, `LeaderboardResponse`, `CommunityStatsResponse`
- `multiplayer.ts`: `LobbyInfo`, `LobbyPlayer`, `MultiplayerGameConfig` (includes `turnTimerSeconds`), `BlokusMove`, `MultiplayerMessage` (includes `move-rejected`, `player-disconnected`, `player-reconnected`, `turn-timeout` types)

## Shared Logic

Located in `src/shared/logic/`:

- `pieces.ts`: Canonical `PieceDefinition` interface and `PIECE_DEFINITIONS` array (21 polyominoes)
- `BoardValidator.ts`: Server-side game state engine with methods: `validateMove()`, `applyMove()`, `applyPass()`, `isGameOver()`, `calculateScore()`, `serialize()`, `deserialize()`
