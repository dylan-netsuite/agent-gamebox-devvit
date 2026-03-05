# API Reference

## Endpoints

### GET /api/stats

Returns the authenticated user's game statistics.

**Response:**

```typescript
interface StatsResponse {
  success: boolean;
  stats?: {
    gamesPlayed: number;
    highScore: number;
    totalScore: number;
    totalDistance: number;
    averageScore: number;
  };
  error?: string;
}
```

### POST /api/score/submit

Submits a game score. Updates user stats and leaderboard.

**Request:**

```typescript
interface SubmitScoreRequest {
  score: number;
  distance: number;
}
```

**Response:**

```typescript
interface SubmitScoreResponse {
  success: boolean;
  isHighScore?: boolean;
  error?: string;
}
```

### GET /api/leaderboard

Returns the top 20 players by high score, plus the authenticated user's rank.

**Response:**

```typescript
interface LeaderboardResponse {
  success: boolean;
  entries: {
    rank: number;
    userId: string;
    username: string;
    highScore: number;
  }[];
  userRank?: number;
  error?: string;
}
```

### POST /internal/on-app-install

Auto-creates a Dino Run post when the app is installed on a subreddit.

### POST /internal/menu/post-create

Manual post creation from the subreddit mod menu.

## Redis Keys

| Key Pattern | Type | Description |
|-------------|------|-------------|
| `dino:stats:{userId}` | String (JSON) | User stats object |
| `dino:lb:top` | Sorted Set | Leaderboard scores (member=userId, score=highScore) |
| `dino:lb:names` | Hash | userId → username mapping for display |
