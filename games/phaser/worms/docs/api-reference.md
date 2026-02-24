# Reddit Royale - API Reference

## Server Endpoints

### GET `/api/init`

Returns initial game state for the current post. Creates a new state if none exists or the previous game is finished.

**Context**: `postId`, `userId` from Devvit context

**Response** (`InitResponse`):
```json
{
  "type": "init",
  "postId": "t3_abc123",
  "gameState": { ... },
  "currentPlayer": null
}
```

### GET `/api/game/state`

Returns current game state for the post.

### GET `/api/reconnect`

Checks if the current user is in an active lobby for this post. Used by the Preloader to auto-reconnect on refresh.

**Context**: `postId`, `userId`

**Response** (lobby found):
```json
{
  "status": "ok",
  "lobby": {
    "info": { "lobbyCode": "J9FPSQ", "status": "waiting", ... },
    "players": [...],
    "config": null
  }
}
```

**Response** (no lobby):
```json
{
  "status": "ok",
  "lobby": null
}
```

### POST `/api/lobbies/create`

Creates a new multiplayer lobby with a unique 6-character code.

**Context**: `postId`, `userId`, `username`

**Response**:
```json
{
  "status": "ok",
  "lobbyCode": "WJV64T",
  "players": [...],
  "isHost": true
}
```

### POST `/api/lobbies/join`

Joins an existing lobby by code.

**Body**: `{ "lobbyCode": "WJV64T" }`

**Response**:
```json
{
  "status": "ok",
  "lobbyCode": "WJV64T",
  "players": [...],
  "isHost": false
}
```

### GET `/api/lobbies/open`

Finds a random open lobby (status=waiting, playerCount < maxPlayers).

**Response**:
```json
{
  "status": "ok",
  "lobby": { "lobbyCode": "WJV64T", "hostUsername": "player1", "playerCount": 1, ... }
}
```

Returns 404 if no open lobbies exist.

### GET `/api/lobbies/list`

Returns all open lobbies for the current post.

### GET `/api/game/lobby?code=WJV64T`

Returns lobby player list and state for a specific lobby code.

### POST `/api/game/join`

Joins a lobby's player list. Broadcasts `lobby-update`.

**Body**: `{ "lobbyCode": "WJV64T" }`

### POST `/api/game/leave`

Leaves a lobby. Transfers host if the leaving player was host. Broadcasts `player-left` and `lobby-update`.

**Body**: `{ "lobbyCode": "WJV64T" }`

### POST `/api/game/ready`

Toggles ready status. Broadcasts `lobby-update`.

**Body**: `{ "lobbyCode": "WJV64T", "ready": true }`

### POST `/api/game/select-character`

Sets character for the player. Broadcasts `lobby-update`.

**Body**: `{ "lobbyCode": "WJV64T", "characterId": "banana-sam" }`

### POST `/api/game/start`

Host starts the game. Requires 2+ players, all ready. Broadcasts `game-start`.

**Body**: `{ "lobbyCode": "WJV64T", "mapId": "hills", "turnTimer": 45, "wormsPerTeam": 2 }`

### POST `/api/game/action`

Sends a player action during gameplay. Broadcasts `player-action`.

**Body**: `{ "lobbyCode": "WJV64T", "action": { "kind": "move", ... } }`

### POST `/api/game/turn-result`

Sends turn results (damage, craters). Broadcasts `turn-result`.

**Body**: `{ "lobbyCode": "WJV64T", "result": { ... } }`

### POST `/api/game/end-turn`

Advances to next turn. Broadcasts `turn-advance`.

**Body**: `{ "lobbyCode": "WJV64T", "turnOrderIndex": 1, "wind": 3 }`

### POST `/api/game/game-over`

Ends the game. Broadcasts `game-over`.

**Body**: `{ "lobbyCode": "WJV64T", "winningTeam": 0 }`

### POST `/api/game/rematch`

Creates a new lobby for a rematch, copying all players from the old game.

**Request body:**
```json
{ "lobbyCode": "ABC123" }
```

**Response:**
```json
{ "status": "ok", "lobbyCode": "XYZ789" }
```

**Side effects:** Broadcasts `{ type: 'rematch', lobbyCode: 'XYZ789' }` to the old lobby channel.

---

### GET `/api/stats`

Returns the authenticated user's stats for the current post.

**Response:**
```json
{
  "status": "ok",
  "stats": {
    "userId": "t2_abc",
    "username": "player1",
    "wins": 5,
    "losses": 3,
    "gamesPlayed": 8
  }
}
```

---

### GET `/api/leaderboard`

Returns all players sorted by wins descending.

**Response:**
```json
{
  "status": "ok",
  "leaderboard": [
    { "userId": "t2_abc", "username": "player1", "wins": 5, "losses": 3, "gamesPlayed": 8 },
    { "userId": "t2_def", "username": "player2", "wins": 3, "losses": 5, "gamesPlayed": 8 }
  ]
}
```

---

### POST `/internal/on-app-install`

Handles app installation. Returns success acknowledgment.

### POST `/internal/menu/post-create`

Creates a new game post via the subreddit menu action.

## Redis Keys

| Key Pattern | Type | Description |
|------------|------|-------------|
| `worms_{postId}_state` | String (JSON) | Legacy game state per post |
| `worms_{postId}_lobbies` | String (JSON array) | List of lobby codes for this post |
| `worms_lobby_{code}_state` | String (JSON) | Lobby metadata (LobbyInfo) — 2h TTL |
| `worms_lobby_{code}_players` | String (JSON array) | Lobby player list — 2h TTL |
| `worms_lobby_{code}_config` | String (JSON) | Stored game config for reconnection — 2h TTL |

## Realtime Channels

Channel name: `worms_lobby_{code}` (one channel per lobby).

### Message Types

| Type | Payload | Trigger |
|------|---------|---------|
| `lobby-update` | `lobbyCode`, `players`, `phase`, `hostUserId` | Player joins/leaves/readies |
| `game-start` | `config: MultiplayerGameConfig` | Host starts game |
| `player-action` | `action`, `playerId` | Player moves/jumps/fires |
| `turn-result` | `result`, `playerId` | Turn damage resolved |
| `turn-advance` | `turnOrderIndex`, `wind` | Next turn begins |
| `game-over` | `winningTeam` | Game ends |
| `rematch` | `{ lobbyCode: string }` | New lobby created for rematch |
| `player-left` | `userId` | Player disconnects |

## Shared Types

### `LobbyInfo`
```typescript
{
  lobbyCode: string;
  postId: string;
  hostUserId: string;
  hostUsername: string;
  playerCount: number;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
}
```

### `LobbyPlayer`
```typescript
{
  userId: string;
  username: string;
  characterId: string;
  teamIndex: number;
  ready: boolean;
}
```

### `MultiplayerGameConfig`
```typescript
{
  numTeams: number;
  wormsPerTeam: number;
  mapId: string;
  turnTimer: number;
  terrainSeed: number;
  players: LobbyPlayer[];
}
```

### `PlayerStats`
```typescript
{
  userId: string;
  username: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
}
```
