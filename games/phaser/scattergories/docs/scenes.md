# Scattergories - Scene Inventory

## Scene Flow

```
Boot -> Preloader -> ModeSelect -> [branch]
                                    ├── GamePlay (single player)
                                    ├── LobbyBrowser -> Lobby -> GamePlay (multiplayer)
                                    └── Leaderboard

GamePlay -> RoundResults -> GamePlay (next round) or GameOver
GameOver -> ModeSelect or Lobby (rematch)
```

## Scenes

### Boot
- **File**: `scenes/Boot.ts`
- **Purpose**: Minimal bootstrap, immediately starts Preloader

### Preloader
- **File**: `scenes/Preloader.ts`
- **Purpose**: Shows loading screen, checks for active lobby reconnection
- **Key behavior**: Calls `/api/reconnect` to resume interrupted games

### ModeSelect
- **File**: `scenes/ModeSelect.ts`
- **Purpose**: Main menu with 3 options
- **Options**: Single Player, Online Play, Leaderboard
- **Animation**: Camera fade-in on scene enter

### LobbyBrowser
- **File**: `scenes/LobbyBrowser.ts`
- **Purpose**: Online matchmaking hub
- **Features**: Quick Match, Create Lobby, Join by Code (6-char input), Browse Open Lobbies
- **Lobby List**: Shows all open lobbies with host name, player count (e.g. "2/6"), age (e.g. "1m ago"), and JOIN button. Auto-refreshes every 5 seconds via `/api/lobbies/list`.

### Lobby
- **File**: `scenes/Lobby.ts`
- **Purpose**: Waiting room before game starts
- **Features**: 6 player slots, lobby code display, ready toggle, host start button
- **Realtime**: Listens for `lobby-update` and `game-start` messages

### GamePlay
- **File**: `scenes/GamePlay.ts`
- **Purpose**: Core gameplay - category list with text inputs
- **Features**:
  - Animated letter dice roll (cycles random letters ~1s before settling)
  - Round/timer display with urgency effects (pulse + red flash at ≤10s)
  - 12 category rows with DOM overlay text inputs
  - Submit button (or auto-submit on timer expiry)
  - Player submission status indicators (multiplayer)
- **Input**: DOM `<input>` elements overlaid on canvas for keyboard support
- **Animation**: Dice roll on letter reveal, timer pulse at ≤10s, header flash

### RoundResults
- **File**: `scenes/RoundResults.ts`
- **Purpose**: Shows scored answers after each round
- **Features**:
  - Per-category answer comparison table with staggered row-by-row reveal
  - Green for unique valid answers, red/strikethrough for duplicates
  - Per-row sound effects (correct chime or duplicate buzz)
  - Round score and running total (animate in after rows)
  - Next Round button for both single player AND multiplayer (no more auto-advance)
  - Multiplayer: buffers `round-start` message, shows "Reviewing..." until ready, then enables "NEXT ROUND ▶"
- **Animation**: Camera fade-in, staggered row reveal, fade-out on transition

### GameOver
- **File**: `scenes/GameOver.ts`
- **Purpose**: Final standings after 3 rounds
- **Features**: Ranked player list with medals, total scores, Rematch and Back buttons
- **Animation**: Camera fade-in, title drop from above, winner text fade-in, score rows slide in sequentially, buttons fade in with staggered delays

### Leaderboard
- **File**: `scenes/Leaderboard.ts`
- **Purpose**: All-time stats from Redis
- **Columns**: Rank, Player, Wins, Total Points, Games Played
