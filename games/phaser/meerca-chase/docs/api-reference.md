# Meerca Chase - API Reference

## Public Endpoints

### GET /api/stats
Returns the authenticated user's personal stats.

**Response**: `StatsResponse`
```json
{
  "success": true,
  "stats": {
    "gamesPlayed": 5,
    "highScore": 42,
    "totalNeggs": 30,
    "totalScore": 120,
    "averageScore": 24
  }
}
```

### POST /api/score/submit
Submits a game score for the authenticated user.

**Request**: `SubmitScoreRequest`
```json
{
  "score": 42,
  "neggsCaught": 12,
  "difficulty": "classic"
}
```

**Response**: `SubmitScoreResponse`
```json
{
  "success": true,
  "isHighScore": true
}
```

### GET /api/leaderboard
Returns the top 20 high scores.

**Response**: `LeaderboardResponse`
```json
{
  "success": true,
  "entries": [
    { "rank": 1, "userId": "t2_abc", "username": "player1", "highScore": 100 }
  ],
  "userRank": 5
}
```

## Internal Endpoints

### POST /internal/on-app-install
Creates the initial game post when the app is installed.

### POST /internal/menu/post-create
Creates a new game post via the subreddit menu action.

## Redis Keys

| Key | Type | Description |
|-----|------|-------------|
| `mc:stats:{userId}` | String (JSON) | User stats blob |
| `mc:lb:top` | Sorted Set | High scores (member=userId, score=highScore) |
| `mc:lb:names` | Hash | userId → username mapping |
