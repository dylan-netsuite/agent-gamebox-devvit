# Blokus - Scene Inventory

## Scene Flow

```
Boot -> Preloader -> MainMenu -> Game -> GameOver -> MainMenu
                        |                               |
                        +-> HowToPlay -> MainMenu       |
                        +-> Leaderboard -> MainMenu     |
                        +-------------------------------+
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
  - PLAY button -> Game
  - HOW TO PLAY button -> HowToPlay
  - LEADERBOARD button -> Leaderboard
- **Transitions**: -> Game, HowToPlay, Leaderboard (all with fade)

### Game
- **File**: `scenes/Game.ts`
- **Purpose**: Core gameplay scene
- **Features**:
  - 14x14 board with grid lines and starting position markers, centered horizontally
  - Bottom piece tray: horizontal scrollable strip with larger piece previews (18px cells)
  - Size category tabs (ALL, 1-2, 3, 4, 5) for filtering pieces by polyomino size
  - Ghost preview on board hover (green=valid, red=invalid)
  - **Drag-and-drop**: Drag pieces from tray directly onto the board with ghost preview
  - On-screen control buttons: ↺ CCW, ↻ CW, ↔ Flip, ↩ Undo, ✕ Clear, ⏭ Pass (touch-friendly)
  - Keyboard shortcuts: R=rotate CW, E=rotate CCW, F=flip, ESC=deselect, Z=undo
  - Orientation indicator in status text (e.g. "90° flipped")
  - **Undo**: Reverts last player move + AI response, single-level
  - **Sound effects**: Procedural audio for all actions (placement, rotation, selection, AI move, undo, game over)
  - Playability indicators: unplayable pieces dimmed with red dot, used pieces shown as ghosts
  - Turn indicator and score display in top bar
  - AI opponent with delayed moves (500ms think time)
  - Auto-selects first playable piece at start of each turn
  - Auto-detects game over condition
  - Horizontal drag/swipe to scroll piece tray on mobile
- **Layout**: Top bar | Centered board | Tab bar + Piece strip + Control buttons (6)
- **Audio**: `audio/SoundManager.ts` - Web Audio API oscillator-based procedural sounds
- **Transitions**: -> GameOver (with fade)

### GameOver
- **File**: `scenes/GameOver.ts`
- **Purpose**: Displays game results
- **Features**:
  - Win/Lose/Tie/Perfect result header
  - Score comparison (player vs AI)
  - Pieces placed count
  - Perfect game bonus display
  - Play Again and Main Menu buttons
- **Transitions**: -> Game, MainMenu (with fade)

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
