# Diplomacy - Phaser Scenes

## Scene Flow

```
Boot → Preloader → MainMenu → GamePlay ↔ (poll/refresh)
                      ↕            ↕ ↓
                   MyGames       GameOver
```

## Boot
**File**: `src/client/game/scenes/Boot.ts`

Minimal bootstrap scene. Immediately starts the Preloader.

## Preloader
**File**: `src/client/game/scenes/Preloader.ts`

Displays a "DIPLOMACY" title and "Loading..." message, then transitions to MainMenu after a brief delay. The map is rendered procedurally by MapRenderer, so no asset preloading is required.

## MainMenu
**File**: `src/client/game/scenes/MainMenu.ts`

### Responsibilities
- Fetches initial game state from `/api/init`
- Displays responsive 7-country selection grid
- Handles country join flow via `/api/game/join`
- Shows START GAME button (enabled when >= 2 players and current user has joined)
- Redirects to GamePlay if game already in progress
- Redirects to GameOver if game is complete

### Key Features
- Responsive column layout (adapts to viewport width)
- Gold highlight on selected country
- "(You)" label under the player's country
- Dimmed styling for taken countries
- Refresh button for manual state reload

## GamePlay
**File**: `src/client/game/scenes/GamePlay.ts`

### Responsibilities
- Renders the Diplomacy map via `MapRenderer` in a fullscreen, map-only view
- No status bar, order panels, or message overlays — the map fills the entire viewport
- Province hover tooltips via `ProvinceTooltip`
- Zoom/pan controls: +/- buttons, home reset, zoom percentage label
- Mouse wheel zoom toward pointer, drag-to-pan at any zoom level
- Pinch-to-zoom for touch devices
- Pan clamping to keep map within visible bounds
- Double-click to reset zoom to 100%

### UI Components

#### MapRenderer (`src/client/game/ui/MapRenderer.ts`)
- Classic Diplomacy board game aesthetic with colors matching the reference map
- Deep blue ocean water (#4898c8), cream/off-white neutral land (#f0ece0)
- Country colors applied to supply center provinces only (no units rendered)
- Draws 75 provinces from GeoJSON-derived polygons with accurate geography
- Decorative Mediterranean island outlines (Sicily, Sardinia, Corsica, Crete)
- Switzerland rendered as hatched impassable territory
- Black 5-pointed star supply center markers with owner-colored rings
- Province labels showing full names, positioned at polygon centroids
- Water zone labels in italic serif font
- Province hover handling with polygon hit testing
- Selected province highlighting
- Coastline outlines (Continent, British Isles, North Africa) with solid black strokes
- No units, order arrows, or country border markers (map-only mode)

#### OrderPanel (`src/client/game/ui/OrderPanel.ts`) *(not currently active)*
- Step-by-step order creation: Select Unit → Choose Type → Select Target
- Order types: Hold, Move, Support
- Order list display with remove capability
- Submit button to send orders to server
- Clear all button

#### StatusBar (`src/client/game/ui/StatusBar.ts`)
- Compact single-row layout (38px desktop, 32px mobile) to maximize map space
- Current turn display (Season Year) and game phase indicator on the left
- Per-country supply center and unit counts on the right with adaptive spacing

## MyGames
**File**: `src/client/game/scenes/MyGames.ts`

### Responsibilities
- Fetches all games the user is participating in via `GET /api/user/games`
- Displays games grouped by urgency: YOUR TURN, WAITING FOR OTHERS, IN LOBBY, COMPLETED
- Each game card shows country, phase, turn, player count, and action badges
- Clicking a game card opens that post in a new browser tab
- Back button returns to MainMenu

### Key Features
- Scrollable list with drag and mouse wheel support
- "YOUR TURN" badge on games needing the player's input
- "VICTORY" / "DEFEATED" / "DRAW" badges on completed games
- Country color-coded circles with initials
- Responsive card width (max 500px, adapts to viewport)

### Access Points
- "MY GAMES" button on the MainMenu lobby screen (with badge count)
- Floating "My Games" button in the top-left corner of GamePlay

## GameOver
**File**: `src/client/game/scenes/GameOver.ts`

Displays the game result:
- Winner announcement with country color
- Final standings sorted by supply center count
- Supply center count per country
- **View History** button — launches GamePlay in history mode to review the game turn-by-turn
- **Return to Lobby** button — returns to MainMenu

## DOM Overlay: HistoryPanelDOM
**File**: `src/client/game/ui/HistoryPanelDOM.ts`

Singleton DOM panel that overlays the Phaser canvas during history/replay mode.

### Elements
- **Header**: "Game History" title + close button
- **Turn label**: Current snapshot's turn and phase, with index counter
- **Controls**: Previous/Next buttons + range slider for scrubbing
- **Log section**: Color-coded turn log entries for the selected snapshot
- **Return to Live button**: Exits history mode

### Lifecycle
- `open(callbacks)` — Fetches snapshots from `/api/game/history`, builds DOM, shows first snapshot
- `destroy()` — Removes all DOM elements
- `isOpen()` — Returns whether the panel is currently visible

### Integration
- GamePlay scene creates a "History" button (`#history-btn`) that toggles history mode
- When entering history mode, OrdersPanelDOM is destroyed and HistoryPanelDOM opens
- `renderSnapshot()` in GamePlay updates unit tokens and province fill colors to match the snapshot
- Province click handlers are disabled during history mode
