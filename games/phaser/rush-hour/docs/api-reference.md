# Rush Hour - API Reference

## Server Endpoints

### GET `/api/daily-puzzle`
Returns today's daily puzzle and the user's result if already completed.

**Response**: `DailyPuzzleResponse`

### POST `/api/daily-puzzle/submit`
Submit a daily puzzle completion result.

**Body**: `SubmitResultRequest`

### GET `/api/stats`
Get the authenticated user's statistics.

**Response**: `StatsResponse`

### POST `/api/stats/submit`
Submit a puzzle completion result (catalog or daily).

**Body**: `SubmitResultRequest`
```json
{
  "puzzleId": "b01",
  "moves": 5,
  "timeSeconds": 12,
  "stars": 3,
  "isDaily": false
}
```

### GET `/api/leaderboard?type=daily|alltime`
Get leaderboard entries.

**Query Parameters**:
- `type`: `"daily"` (today's daily puzzle) or `"alltime"` (overall stats)

**Response**: `LeaderboardResponse`

### GET `/api/user-puzzles`
Get the authenticated user's created puzzles.

**Response**: `UserPuzzleResponse`

### POST `/api/user-puzzles`
Save a user-created puzzle.

**Body**: `UserPuzzleSubmission`
```json
{
  "name": "My Puzzle",
  "vehicles": [...],
  "minMoves": 15
}
```

### GET `/api/puzzle-progress`
Get the authenticated user's per-puzzle best results.

**Response**: `PuzzleProgressResponse`
```json
{
  "success": true,
  "progress": {
    "b01": { "stars": 3, "bestMoves": 1, "bestTime": 2 },
    "b02": { "stars": 2, "bestMoves": 6, "bestTime": 18 }
  }
}
```

### POST `/internal/on-app-install`
Creates the initial post when the app is installed on a subreddit.

### POST `/internal/menu/post-create`
Creates a new post from the subreddit moderator menu.
