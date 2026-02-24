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
│   │       │   └── pieces.ts    # 21 polyomino piece definitions + transforms
│   │       ├── logic/
│   │       │   ├── BoardLogic.ts # Board state, validation, scoring
│   │       │   └── AIPlayer.ts   # AI opponent with scoring heuristics
│   │       ├── systems/
│   │       │   └── MultiplayerManager.ts # Realtime connection + lobby management
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
5. **Game moves**: Active player places piece -> POST `/api/game/move` -> server broadcasts `player-move` via `realtime.send()` -> opponent applies via `BoardLogic`.
6. **Turn management**: After each move, active player switches. Both clients derive game state from the initial setup + ordered move messages.

## Key Design Decisions

- **Client-side game logic**: All Blokus rules, AI, and board state run in the browser. Server only handles persistence and relay.
- **Procedural graphics**: No external image assets. All pieces, board, and UI drawn with Phaser Graphics API.
- **Responsive layout**: Board and tray scale dynamically using `Phaser.Scale.RESIZE` mode.
- **Blokus Duo variant**: 14x14 board, 2 players, center starting positions. Simpler than full 4-player Blokus.
- **Thin server relay**: Server broadcasts moves without validating game rules. Active-player authority model.
- **Redis lobby storage**: Lobbies stored with 2-hour TTL. Keys: `blokus_lobby_{code}_state`, `blokus_lobby_{code}_players`.
