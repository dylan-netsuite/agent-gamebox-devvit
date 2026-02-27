# Diplomacy - API Reference

## Server Endpoints

### `GET /api/init`
Initialize the client. Returns current game state and the requesting player's info.

**Response**: `InitResponse`
```json
{
  "gameState": { ... },
  "currentPlayer": { "userId": "...", "username": "...", "country": "England" }
}
```

### `POST /api/game/join`
Join a game as a specific country.

**Request**:
```json
{ "country": "England" }
```

**Response**: `JoinGameResponse`
```json
{
  "gameState": { ... },
  "player": { "userId": "...", "username": "...", "country": "England" }
}
```

### `POST /api/game/fill-bots`
Fill all unclaimed country slots with bot players. Only works during `waiting` phase.

**Response**:
```json
{ "type": "fill-bots", "gameState": { ... } }
```

Bot players have userId `bot:{country_lowercase}` and username `Bot ({CountryName})`. When human players submit orders/retreats/builds, bots auto-submit using a two-tier AI:
- **Orders**: Tier 1 heuristic generates a baseline (defend SCs, attack neutrals, pathfind, support). Tier 2 generates ~40 candidate order sets, simulates each with `resolveOrders`, scores the resulting position, and picks the best.
- **Retreats**: Prefer retreating to supply centers (own > neutral), then closest to friendly SCs; disband only when no valid retreat exists.
- **Builds**: Build armies at available home supply centers; disband furthest units if needed

### `POST /api/game/configure`
Configure game settings before starting. Only available during `waiting` phase for joined players.

**Request**:
```json
{ "turnTimeLimitMs": 300000 }
```

Set `turnTimeLimitMs` to one of the preset values (`null`, `300000`, `900000`, `3600000`, `86400000`, `172800000`) or `null` for no limit.

**Response**:
```json
{ "type": "configure", "gameState": { ... } }
```

### `POST /api/game/start`
Start the game (requires >= 2 players). The `turnTimeLimitMs` from configuration is used to set the first `turnDeadline`.

**Response**: `StartGameResponse`
```json
{ "gameState": { ... } }
```

### `POST /api/game/orders`
Submit movement orders for the current phase.

**Request**: `SubmitOrdersRequest`
```json
{
  "orders": [
    { "type": "move", "country": "England", "unitType": "Fleet", "province": "LON", "destination": "NTH" },
    { "type": "hold", "country": "England", "unitType": "Army", "province": "LVP" }
  ]
}
```

**Response**: `SubmitOrdersResponse`
```json
{ "success": true, "message": "Orders submitted", "gameState": { ... } }
```

### `POST /api/game/retreats`
Submit retreat decisions for dislodged units.

**Request**: `SubmitRetreatsRequest`
```json
{
  "retreats": [
    { "type": "retreat", "country": "England", "unitType": "Army", "province": "LON", "destination": "WAL" }
  ]
}
```

### `POST /api/game/builds`
Submit build/disband decisions (Fall adjustment phase).

**Request**: `SubmitBuildsRequest`
```json
{
  "builds": [
    { "type": "build", "country": "England", "unitType": "Fleet", "province": "LON" }
  ]
}
```

### `GET /api/game/state`
Poll for current game state (used for real-time updates).

**Response**: `GameState`

### `POST /api/game/chat`
Send or retrieve chat messages. Supports both global and private (DM) channels.

**Send a message**:
```json
{ "text": "Hello!", "channel": "global" }
```
For DM, use sorted country pair: `{ "text": "Secret alliance?", "channel": "ENGLAND:FRANCE" }`

**List messages** (with optional timestamp filter and multi-channel support):
```json
{ "action": "list", "after": 1234567890, "channels": ["global", "ENGLAND:FRANCE"] }
```

**Response** (list):
```json
{
  "messages": [
    { "from": "suitegeek", "country": "ENGLAND", "text": "Hello!", "timestamp": 1234567890, "channel": "global" }
  ]
}
```

Server validates that only participants in a DM channel can send to it.

### `GET /api/user/games`
Get all games the current user is participating in across all posts.

**Response**: `MyGamesResponse`
```json
{
  "games": [
    {
      "postId": "t3_abc123",
      "gameId": "game-1234567890",
      "phase": "orders",
      "turn": { "year": 1903, "season": "Fall" },
      "country": "ENGLAND",
      "playerCount": 7,
      "isYourTurn": true,
      "winner": null
    }
  ]
}
```

Games are returned from a per-user Redis sorted set. The `isYourTurn` flag is true when:
- Phase is `orders` and the player hasn't submitted yet
- Phase is `retreats` and the player has dislodged units
- Phase is `builds` and the player has pending builds/disbands

### `GET /api/game/history`
Retrieve all turn snapshots for the current game. Returns an empty array if no snapshots exist (games started before v0.0.2.127).

**Response**: `HistoryResponse`
```json
{
  "snapshots": [
    {
      "turn": { "year": 1901, "season": "Spring" },
      "phase": "initial",
      "units": [ { "type": "Army", "country": "AUSTRIA", "province": "VIE" }, ... ],
      "supplyCenters": { "VIE": "AUSTRIA", "BUD": "AUSTRIA", ... },
      "log": ["=== Spring 1901 ==="]
    },
    {
      "turn": { "year": 1901, "season": "Spring" },
      "phase": "after-orders",
      "units": [ ... ],
      "supplyCenters": { ... },
      "log": ["=== Spring 1901 ===", "Army VIE -> TYR succeeds", ...]
    }
  ]
}
```

Snapshots are ordered chronologically. Each snapshot captures the board state after a specific phase resolution:
- `initial` — Starting positions when the game begins
- `after-orders` — After orders are resolved
- `after-retreats` — After retreats are processed
- `after-builds` — After builds/disbands are applied

## Redis Keys

| Key | Type | Description |
|-----|------|-------------|
| `game:{postId}` | JSON string | Full game state for a post |
| `game:{postId}:chat` | Sorted set | Global chat messages (score = timestamp) |
| `game:{postId}:dm:{A}:{B}` | Sorted set | Private DM messages between countries A and B (sorted alphabetically) |
| `game:{postId}:orders:{season}:{year}:{country}` | JSON string | Orders for a specific country/turn |
| `user:{userId}:games` | Sorted set | PostIds the user has joined (score = join timestamp) |
| `game:{postId}:history` | Sorted set | Turn snapshots (score = timestamp, member = JSON snapshot) |

## Internal Endpoints

| Endpoint | Trigger |
|----------|---------|
| `/internal/on-app-install` | App installation |
| `/internal/menu/post-create` | "New Diplomacy Game" menu action |
