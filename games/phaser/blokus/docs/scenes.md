# Blokus - Scene Inventory

## Scene Flow

```
Boot -> Preloader -> MainMenu -> ModeSelect -> Game (vs AI) -> GameOver -> ModeSelect
                        |            |                                        |
                        |            +-> LobbyBrowser -> Lobby -> Game (MP) --+
                        |            +-> HowToPlay -> MainMenu
                        |            +-> Leaderboard -> MainMenu
                        +-> HowToPlay -> MainMenu
                        +-> Leaderboard -> MainMenu
```

## Scenes

### Boot
- **File**: `scenes/Boot.ts`
- **Purpose**: Minimal bootstrap, immediately starts Preloader
- **Assets loaded**: None
- **Transitions**: -> Preloader

### Preloader
- **File**: `scenes/Preloader.ts`
- **Purpose**: Shows loading progress bar with BLOKUS title
- **Assets loaded**: None (all graphics are procedural)
- **Transitions**: -> MainMenu (with fade)

### MainMenu
- **File**: `scenes/MainMenu.ts`
- **Purpose**: Title screen with navigation buttons
- **Features**:
  - BLOKUS title with decorative polyomino pieces in background
  - PLAY button -> ModeSelect
  - HOW TO PLAY button -> HowToPlay
  - LEADERBOARD button -> Leaderboard
- **Transitions**: -> ModeSelect, HowToPlay, Leaderboard (all with fade)

### ModeSelect
- **File**: `scenes/ModeSelect.ts`
- **Purpose**: Mode selection hub
- **Features**:
  - VS AI button -> Game (single-player)
  - ONLINE PLAY button -> LobbyBrowser
  - HOW TO PLAY button -> HowToPlay
  - LEADERBOARD button -> Leaderboard
- **Transitions**: -> Game, LobbyBrowser, HowToPlay, Leaderboard (all with fade)

### LobbyBrowser
- **File**: `scenes/LobbyBrowser.ts`
- **Purpose**: Online play entry point for finding/creating multiplayer games
- **Features**:
  - Quick Match: finds open lobby or creates one
  - Create Lobby: creates a new lobby
  - Join by Code: 6-character code input with keyboard support
  - Loading dots animation during async operations
  - Back button -> ModeSelect
- **Transitions**: -> Lobby, ModeSelect

### Lobby
- **File**: `scenes/Lobby.ts`
- **Purpose**: Waiting room for 2 players before game starts
- **Features**:
  - Lobby code display (shareable 6-char code)
  - 2 player slots showing username, color (Blue/Orange), ready state
  - Host tag on first player
  - READY/UNREADY toggle button
  - START GAME button (host only, visible when both players ready)
  - Realtime connection via MultiplayerManager
  - Listens for `lobby-update`, `game-start`, `player-left` messages
  - Back button -> LobbyBrowser
- **Transitions**: -> Game (multiplayer), LobbyBrowser

### Game
- **File**: `scenes/Game.ts`
- **Purpose**: Core gameplay scene (supports both single-player and multiplayer)
- **Scene data**:
  - `multiplayer: boolean` - whether this is a multiplayer game
  - `mp: MultiplayerManager` - realtime connection (multiplayer only)
  - `playerNumber: 1 | 2` - which player this client is (multiplayer only)
  - `opponentName: string` - opponent's username (multiplayer only)
- **Features**:
  - 14x14 board with grid lines and starting position markers, centered horizontally
  - Bottom piece tray: horizontal scrollable strip with larger piece previews (18px cells)
  - Size category tabs (ALL, 1-2, 3, 4, 5) for filtering pieces by polyomino size
  - Ghost preview on board hover (green=valid, red=invalid)
  - Drag-and-drop: Drag pieces from tray directly onto the board with ghost preview
  - On-screen control buttons: CCW, CW, Flip, Undo (SP only), Clear, Pass
  - Keyboard shortcuts: R=rotate CW, E=rotate CCW, F=flip, ESC=deselect, Z=undo (SP only)
  - Orientation indicator in status text
  - Sound effects: Procedural audio for all actions
  - Playability indicators: unplayable pieces dimmed with red dot
  - Turn indicator and score display in top bar
  - **Single-player**: AI opponent with delayed moves, undo enabled
  - **Multiplayer**: Sends moves via MultiplayerManager, listens for opponent moves, undo disabled, "Waiting for opponent..." status
  - Opponent left detection with forfeit win notification
- **Layout**: Top bar | Centered board | Tab bar + Piece strip + Control buttons
- **Audio**: `audio/SoundManager.ts` - Web Audio API oscillator-based procedural sounds
- **Transitions**: -> GameOver (with fade)

### GameOver
- **File**: `scenes/GameOver.ts`
- **Purpose**: Displays game results
- **Features**:
  - Win/Lose/Tie/Perfect result header
  - Score comparison (player vs opponent)
  - Opponent label shows username in multiplayer, "AI" in single-player
  - Pieces placed count
  - Perfect game bonus display
  - Play Again -> ModeSelect
  - Main Menu -> MainMenu
- **Transitions**: -> ModeSelect, MainMenu (with fade)

### HowToPlay
- **File**: `scenes/HowToPlay.ts`
- **Purpose**: Rules tutorial
- **Features**:
  - Numbered rule list
  - Scoring explanation
  - Visual demo of corner vs edge placement rules
  - Back button
- **Transitions**: -> MainMenu (with fade)

### Leaderboard
- **File**: `scenes/Leaderboard.ts`
- **Purpose**: Score rankings from server
- **Features**:
  - Fetches leaderboard from `/api/leaderboard`
  - Displays top 20 players with rank, name, best score, wins
  - Gold highlighting for top 3
  - User's own rank display
  - Loading and empty states
  - Back button
- **Transitions**: -> MainMenu (with fade)
