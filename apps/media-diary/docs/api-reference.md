# Media Diary — API Reference

## Endpoints

### GET /api/entries
Returns all diary entries for the authenticated user.

**Query Parameters:**
- `category` (optional): Filter by `watched`, `read`, or `listened`

**Response:** `EntriesResponse`
```json
{
  "success": true,
  "entries": [...],
  "total": 5
}
```

### POST /api/entries
Create a new diary entry.

**Body:** `CreateEntryRequest`
```json
{
  "category": "watched",
  "type": "movie",
  "title": "Inception",
  "date": "2026-03-07",
  "rating": 9,
  "comments": "Mind-bending"
}
```

**Response:** `EntryResponse`

### PUT /api/entries/:id
Update an existing entry. All body fields are optional.

**Body:** `UpdateEntryRequest`

**Response:** `EntryResponse`

### DELETE /api/entries/:id
Delete an entry.

**Response:** `DeleteResponse`

### GET /api/stats
Get aggregated statistics for the user.

**Response:** `StatsResponse`
```json
{
  "success": true,
  "stats": {
    "totalEntries": 15,
    "byCategory": { "watched": 8, "read": 4, "listened": 3 },
    "averageRating": 7.2,
    "recentStreak": 0
  }
}
```

## Internal Endpoints

### POST /internal/on-app-install
Creates the initial Media Diary post on subreddit install.

### POST /internal/menu/post-create
Moderator menu action to create a new Media Diary post.
