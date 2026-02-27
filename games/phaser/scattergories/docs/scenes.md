# Scattergories - Scene Inventory

## Scene Flow

```
Boot -> Preloader -> ModeSelect -> [branch]
                                    ├── DifficultySelect -> GamePlay (single player vs AI)
                                    ├── LocalSetup -> GamePlay (local pass & play)
                                    ├── LobbyBrowser -> Lobby -> GamePlay (live multiplayer)
                                    └── Leaderboard

GamePlay (local) -> PassDevice -> GamePlay (next player's turn) -> RoundResults
GamePlay (single/mp) -> RoundResults -> GamePlay (next round) or GameOver
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
- **Purpose**: Main menu with 4 options
- **Options**: Single Player (vs AI, purple), Local Play (pass & play, green), Live Multiplayer (online, blue), Leaderboard (orange)
- **Animation**: Camera fade-in on scene enter

### DifficultySelect
- **File**: `scenes/DifficultySelect.ts`
- **Purpose**: AI difficulty selection for single player mode
- **Options**: Easy (1 AI, skill 0.25-0.45), Medium (2 AI, skill 0.45-0.65), Hard (3 AI, skill 0.70-0.90)
- **Features**: Color-coded buttons (green/yellow/red), AI count badges, descriptive text
- **Navigation**: ESC or back button returns to ModeSelect
- **Animation**: Camera fade-in on scene enter

### LocalSetup
- **File**: `scenes/LocalSetup.ts`
- **Purpose**: Player name entry for local multiplayer
- **Features**: Player count (2-6) with +/- buttons, DOM text inputs for each player name, START GAME button
- **Navigation**: ESC or back button returns to ModeSelect

### LobbyBrowser
- **File**: `scenes/LobbyBrowser.ts`
- **Purpose**: Online matchmaking hub with clean 3-section layout
- **Features**: Quick Match (find or create game), Create Lobby (private room), Join by Code (6-char input with orange JOIN button)
- **Animation**: Camera fade-in on scene enter

### Lobby
- **File**: `scenes/Lobby.ts`
- **Purpose**: Waiting room before game starts
- **Features**: 6 player slots, lobby code display, ready toggle, host start button
- **Realtime**: Listens for `lobby-update` and `game-start` messages

### PassDevice
- **File**: `scenes/PassDevice.ts`
- **Purpose**: Interstitial screen between local multiplayer turns
- **Features**: Lock icon, "PASS THE DEVICE TO [name]" prompt, "TAP ANYWHERE WHEN READY" with pulsing animation
- **Behavior**: 900ms delay before accepting input to prevent accidental taps. Accepts pointer click or any key press.
- **Animation**: Lock icon bounces in, text fades in sequentially, tap prompt pulses continuously

### GamePlay
- **File**: `scenes/GamePlay.ts`
- **Purpose**: Core gameplay - category list with text inputs
- **Modes**: `single` (vs AI, count/skill based on difficulty), `local` (pass & play), `multiplayer` (online)
- **Features**:
  - Animated letter dice roll (cycles random letters ~1s before settling)
  - Round/timer display with urgency effects (pulse + red flash at ≤10s)
  - 12 category rows with DOM overlay text inputs
  - Submit button (or auto-submit on timer expiry)
  - Player name badge in top-left for local mode with turn indicator
  - AI answer generation for single player mode
  - Player submission status indicators (multiplayer)
- **Input**: DOM `<input>` elements overlaid on canvas for keyboard support
- **Animation**: Dice roll on letter reveal, timer pulse at ≤10s, header flash
- **Local flow**: After submission, transitions to PassDevice interstitial, then next player's turn with same letter/categories; after last player, scores and shows RoundResults

### RoundResults
- **File**: `scenes/RoundResults.ts`
- **Purpose**: Shows scored answers after each round
- **Features**:
  - Per-category answer comparison table with staggered row-by-row reveal
  - Green for unique valid answers, red/strikethrough for duplicates
  - Per-row sound effects (correct chime or duplicate buzz)
  - Round score and running total (animate in after rows)
  - Next Round button for single player, local, AND multiplayer
  - Multiplayer: buffers `round-start` message, shows "Reviewing..." until ready, then enables "NEXT ROUND ▶"
  - Local: passes player names, scores, and used lists/letters to next round
- **Animation**: Camera fade-in, staggered row reveal, fade-out on transition

### GameOver
- **File**: `scenes/GameOver.ts`
- **Purpose**: Final standings after 3 rounds
- **Features**: Ranked player list with medals, total scores, mode-appropriate buttons (Rematch for online, Play Again for local, Back to Menu for all)
- **Animation**: Camera fade-in, title drop from above, winner text fade-in, score rows slide in sequentially, buttons fade in with staggered delays

### Leaderboard
- **File**: `scenes/Leaderboard.ts`
- **Purpose**: All-time stats from Redis
- **Columns**: Rank, Player, Wins, Total Points, Games Played
