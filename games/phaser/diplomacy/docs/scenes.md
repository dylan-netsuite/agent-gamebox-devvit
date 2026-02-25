# Diplomacy - Phaser Scenes

## Scene Flow

```
Boot → Preloader → MainMenu → GamePlay ↔ (poll/refresh)
                      ↕  ↕        ↕ ↓
                   MyGames  ↕   GameOver
                         Tutorial
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

## Tutorial
**File**: `src/client/game/scenes/Tutorial.ts`

### Responsibilities
- Provides a guided, client-side tutorial experience teaching all core Diplomacy mechanics
- Extends GamePlay to reuse the full map, unit rendering, order panel, and arrow system
- Overrides network methods (no server communication) — all game state is managed in-memory
- Resolves orders locally using the shared `orderResolver` (pure logic, no server dependencies)
- Drives gameplay through a scripted sequence of 8 tutorial turns

### Tutorial Flow
The player controls Italy through a scripted introductory game (~3 years):

1. **Spring 1901** — Basic movement: move Army, Fleet to adjacent provinces
2. **Fall 1901** — Capturing supply centers, hold orders
3. **Fall 1901 Builds** — Building new units in home supply centers
4. **Spring 1902** — Support orders: supported attacks with strength > 1
5. **Fall 1902** — Convoy orders: transporting armies across water
6. **Spring 1903** — Orders phase leading to a dislodgement
7. **Spring 1903 Retreats** — Retreat/disband dislodged units
8. **Fall 1903** — Final turn with full mechanics

### Key Components

#### TutorialOverlayDOM (`src/client/game/tutorial/TutorialOverlayDOM.ts`)
- Semi-transparent overlay with message box, title, body text, and "Next" button
- Step counter showing progress within each turn
- "Skip Tutorial" button in the top-right corner
- Province highlight rings (pulsing golden borders)
- UI element pointing (glowing border on orders panel elements)
- Completion screen with mechanics summary and "Return to Lobby" button

#### Tutorial Script (`src/client/game/tutorial/tutorialScript.ts`)
- Defines `TutorialStep` and `TutorialTurn` types
- Contains pre-computed bot orders for all 6 non-player nations per turn
- Each step has conditions for advancement: `waitForNext`, `waitForOrderFrom`, `waitForSubmit`, `waitForRetreat`, `waitForBuild`
- Bot orders are crafted to create interesting scenarios (e.g., Germany attacks Venice with support to trigger a retreat)

### Access Points
- "TUTORIAL" button on the MainMenu lobby screen (gold-styled, positioned above action buttons)

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
