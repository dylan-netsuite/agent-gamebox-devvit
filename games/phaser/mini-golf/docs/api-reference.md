# API Reference

## Server Endpoints

### GET /api/stats
Returns user statistics.

**Response**: `StatsResponse`
```json
{
  "success": true,
  "stats": {
    "roundsPlayed": 5,
    "bestScore": 54,
    "totalStrokes": 300,
    "holesInOne": 2,
    "averageStrokes": 60
  }
}
```

### POST /api/stats/submit
Submit a completed round.

**Request**: `SubmitRoundRequest`
```json
{
  "scores": [2, 3, 4, ...],
  "totalStrokes": 58,
  "totalPar": 56
}
```

### GET /api/leaderboard
Returns top 20 players by best score.

**Response**: `LeaderboardResponse`
```json
{
  "success": true,
  "entries": [
    { "rank": 1, "userId": "...", "username": "player1", "bestScore": 48, "roundsPlayed": 10 }
  ],
  "userRank": 5
}
```

### POST /internal/on-app-install
Creates initial post on app install.

### POST /internal/menu/post-create
Creates a new Mini Golf post (moderator action).

## Redis Keys

| Key Pattern | Type | Description |
|-------------|------|-------------|
| `mg:stats:{userId}` | String (JSON) | User stats object |
| `mg:lb:best` | Sorted Set | Leaderboard by best total score |
| `mg:lb:names` | Hash | userId -> username mapping |
