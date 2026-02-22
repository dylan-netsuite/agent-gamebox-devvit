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

Bot players have userId `bot:{country_lowercase}` and username `Bot ({CountryName})`. When human players submit orders/retreats/builds, bots auto-submit:
- **Orders**: Hold all units
- **Retreats**: Disband all dislodged units
- **Builds**: Build armies at available home supply centers; disband furthest units if needed

### `POST /api/game/start`
Start the game (requires >= 2 players).

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

## Redis Keys

| Key | Type | Description |
|-----|------|-------------|
| `game:{postId}` | JSON string | Full game state for a post |
| `game:{postId}:chat` | Sorted set | Global chat messages (score = timestamp) |
| `game:{postId}:dm:{A}:{B}` | Sorted set | Private DM messages between countries A and B (sorted alphabetically) |
| `game:{postId}:orders:{season}:{year}:{country}` | JSON string | Orders for a specific country/turn |

## Internal Endpoints

| Endpoint | Trigger |
|----------|---------|
| `/internal/on-app-install` | App installation |
| `/internal/menu/post-create` | "New Diplomacy Game" menu action |
