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

## Redis Keys

| Key Pattern | Type | Description |
|-------------|------|-------------|
| `blokus:stats:{userId}` | String (JSON) | User stats object |
| `blokus:lb:score` | Sorted Set | Best scores (member=userId, score=bestScore) |
| `blokus:lb:names` | Hash | userId -> username mapping |
| `blokus:community` | Hash | Aggregate stats (gamesPlayed, totalPiecesPlaced) |

## Shared Types

All types are defined in `src/shared/types/api.ts`:

- `UserStats` - Player statistics
- `GameResult` - Full game result (client-side)
- `SubmitResultRequest` - POST body for submitting results
- `StatsResponse` - GET /api/stats response
- `LeaderboardEntry` - Single leaderboard row
- `LeaderboardResponse` - GET /api/leaderboard response
- `CommunityStatsResponse` - GET /api/community-stats response
