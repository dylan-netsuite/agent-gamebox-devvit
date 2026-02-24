# Scattergories - API Reference

## Server Endpoints

### Initialization
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/init` | Returns postId for the current context |
| GET | `/api/reconnect` | Finds user's active lobby for reconnection |

### Lobby Management
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/lobbies/create` | Creates a new lobby, adds host as first player |
| POST | `/api/lobbies/join` | Joins an existing lobby by code |
| GET | `/api/lobbies/open` | Finds first open lobby for quick match |
| GET | `/api/lobbies/list` | Returns all waiting lobbies with player details for lobby browser |

### In-Lobby
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/game/lobby?code=` | Returns lobby info and player list |
| POST | `/api/game/join` | Joins lobby (adds player, broadcasts update) |
| POST | `/api/game/leave` | Leaves lobby (removes player, broadcasts update) |
| POST | `/api/game/ready` | Toggles ready state |

### Game Lifecycle
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/game/start` | Host starts game; server picks letter + categories |
| POST | `/api/game/submit-answers` | Player submits 12 answers for current round |
| POST | `/api/game/finalize-round` | Force-finalizes round (timer expiry fallback). Caller must be a lobby member. |
| POST | `/api/game/rematch` | Creates new lobby for rematch |

### Stats
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/stats` | Returns current user's stats |
| GET | `/api/leaderboard` | Returns sorted leaderboard |

### Internal
| Method | Path | Description |
|--------|------|-------------|
| POST | `/internal/menu/post-create` | Creates a new Scattergories post (mod menu) |

## Redis Keys

| Key Pattern | TTL | Purpose |
|-------------|-----|---------|
| `scatter_lobby_{code}_state` | 2h | Lobby info (code, host, status, player count) |
| `scatter_lobby_{code}_players` | 2h | Array of LobbyPlayer objects |
| `scatter_lobby_{code}_round` | 2h | Current round config (letter, categories) |
| `scatter_lobby_{code}_answers_{round}_{userId}` | 2h | Player's submitted answers |
| `scatter_lobby_{code}_scores` | 2h | Running score totals per player |
| `scatter_lobby_{code}_used` | 2h | Used list IDs and letters |
| `scatter_{postId}_lobbies` | none | List of lobby codes for a post |
| `scatter_{postId}_stats_{userId}` | none | Per-user persistent stats |
| `scatter_{postId}_leaderboard` | none | Leaderboard map |

## Realtime Messages

Channel: `scatter_lobby_{code}`

| Type | Payload | When |
|------|---------|------|
| `lobby-update` | players, phase, hostUserId | Player join/leave/ready |
| `game-start` | round config | Host starts game |
| `round-start` | round config | New round begins |
| `player-submitted` | userId, username | Player submits answers |
| `round-results` | RoundResult, PlayerScore[] | All answers scored |
| `game-over` | PlayerScore[], winnerId | Final round complete |
| `player-left` | userId | Player disconnects |
| `rematch` | new lobbyCode | Rematch lobby created |
