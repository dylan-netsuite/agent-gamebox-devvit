# Blokus - Architecture

## Tech Stack

- **Engine**: Phaser 3.88.2 (WebGL/Canvas)
- **Server**: Express 5 on Devvit serverless runtime
- **Storage**: Devvit Redis
- **Build**: Vite 6 (client + server)
- **Language**: TypeScript 5.8 (strict mode)
- **Platform**: Reddit Devvit (custom post app)

## Project Structure

```
games/phaser/blokus/
├── src/
│   ├── client/
│   │   ├── splash.html          # Inline splash screen (default entrypoint)
│   │   ├── game.html            # Full game (expanded mode entrypoint)
│   │   ├── splash/
│   │   │   ├── splash.ts        # Splash logic (requestExpandedMode)
│   │   │   └── splash.css       # Splash styling
│   │   └── game/
│   │       ├── game.ts          # Phaser bootstrap + config
│   │       ├── game.css         # Game container styles
│   │       ├── audio/
│   │       │   └── SoundManager.ts # Procedural Web Audio API sounds
│   │       ├── data/
│   │       │   └── pieces.ts    # Re-exports piece definitions from shared/logic
│   │       ├── logic/
│   │       │   ├── BoardLogic.ts # Board state, validation, scoring
│   │       │   └── AIPlayer.ts   # AI opponent with scoring heuristics
│   │       ├── systems/
│   │       │   └── MultiplayerManager.ts # Realtime connection, lobby management, heartbeat
│   │       └── scenes/
│   │           ├── Boot.ts       # Minimal bootstrap
│   │           ├── Preloader.ts  # Loading screen
│   │           ├── MainMenu.ts   # Title + navigation
│   │           ├── ModeSelect.ts # Mode selection (VS AI, Online Play, etc.)
│   │           ├── LobbyBrowser.ts # Find/create multiplayer lobbies
│   │           ├── Lobby.ts      # Pre-game waiting room
│   │           ├── Game.ts       # Core gameplay (SP + MP)
│   │           ├── GameOver.ts   # Results display
│   │           ├── HowToPlay.ts  # Rules tutorial
│   │           └── Leaderboard.ts # Score rankings
│   ├── server/
│   │   ├── index.ts             # Express API + Redis + Realtime relay
│   │   └── core/
│   │       ├── post.ts          # Devvit post creation
│   │       └── lobbyState.ts    # Redis-backed lobby state management
│   └── shared/
│       ├── logic/
│       │   ├── pieces.ts        # Canonical piece definitions (shared by client + server)
│       │   └── BoardValidator.ts # Server-side move validation engine
│       └── types/
│           ├── api.ts           # Shared API types
│           └── multiplayer.ts   # Multiplayer message + lobby types
├── devvit.json                  # Devvit app config (realtime permission)
├── package.json                 # Dependencies + scripts
└── docs/                        # Documentation
```

## Data Flow

### Single-Player (VS AI)
1. **Splash** (`splash.html`): Inline in Reddit post. User clicks PLAY -> `requestExpandedMode('game')`.
2. **Game** (`game.html`): Phaser boots, scenes run. Game logic is fully client-side.
3. **Results**: On game end, client POSTs to `/api/stats/submit` to persist score.
4. **Leaderboard**: Client GETs `/api/leaderboard` to fetch rankings from Redis.

### Multiplayer
1. **Lobby creation**: Host calls `/api/lobbies/create` -> server generates 6-char code, stores in Redis.
2. **Lobby join**: Guest calls `/api/lobbies/join` with code -> server adds player to Redis state.
3. **Realtime connection**: Both clients call `connectRealtime(channel)` to join the lobby's Realtime channel.
4. **Ready + Start**: Players toggle ready via `/api/game/ready`. Host starts via `/api/game/start` -> server broadcasts `game-start` message.
5. **Game moves**: Active player places piece -> POST `/api/game/move` -> server validates via `BoardValidator` -> if valid, broadcasts `player-move` via `realtime.send()` -> opponent applies via `BoardLogic`. If invalid, server responds 400 and broadcasts `move-rejected`.
6. **Turn management**: After each move, active player switches. Server maintains authoritative game state via `BoardValidator`; clients derive display state from broadcast messages.
7. **Heartbeat**: Both clients send periodic heartbeat POSTs to `/api/game/heartbeat` (every 10s). Server checks opponent's last heartbeat timestamp. If >30s stale, marks opponent as disconnected and broadcasts `player-disconnected`. After 60s grace period, broadcasts `player-left` and ends the game.
8. **Turn timer**: Server tracks `turnStartedAt` timestamp in Redis. During heartbeat processing, if the current turn exceeds `turnTimerSeconds` (default 90s), server auto-passes the player and broadcasts `turn-timeout` + `player-pass`.
9. **Reconnection**: If a disconnected player rejoins (lobby in `playing` state), `/api/lobbies/join` returns `reconnect: true`. Client calls `/api/game/reconnect` to retrieve game config, move history, and player info. Game scene replays moves to reconstruct board state.

## Key Design Decisions

- **Server-side move validation**: `BoardValidator` in `shared/logic/` reconstructs game state from move history and validates each incoming move against Blokus placement rules before broadcasting. Prevents cheating.
- **Disconnection grace period**: 60-second window before a stale player is forfeited. During this time, the opponent sees a "Waiting for reconnect" overlay with countdown. The player can rejoin via lobby code.
- **Turn timer enforcement**: Server-authoritative turn timer prevents stalling. Configurable via `MultiplayerGameConfig.turnTimerSeconds`. Client displays countdown but server enforces the timeout via heartbeat checks.
- **Race condition fix**: Server auto-marks the host as `ready` before checking `allReady` on game start, preventing transient 400 errors when the host clicks START before their own ready state is persisted.
- **Shared logic layer**: Piece definitions and board validation logic live in `src/shared/logic/` so both client and server can use the same code.
- **Procedural graphics**: No external image assets. All pieces, board, and UI drawn with Phaser Graphics API.
- **Responsive layout**: Board and tray scale dynamically using `Phaser.Scale.RESIZE` mode.
- **Blokus Duo variant**: 14x14 board, 2 players, center starting positions. Simpler than full 4-player Blokus.
- **Redis lobby storage**: Lobbies stored with 2-hour TTL. Keys: `blokus_lobby_{code}_state`, `blokus_lobby_{code}_players`, `blokus_lobby_{code}_heartbeat_{userId}`, `blokus_lobby_{code}_moves`, `blokus_lobby_{code}_disconnectedAt_{userId}`, `blokus_lobby_{code}_turnStartedAt`.
