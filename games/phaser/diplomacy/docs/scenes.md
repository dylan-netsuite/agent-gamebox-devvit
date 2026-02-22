# Diplomacy - Phaser Scenes

## Scene Flow

```
Boot → Preloader → MainMenu → GamePlay ↔ (poll/refresh)
                                  ↓
                               GameOver
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

## GameOver
**File**: `src/client/game/scenes/GameOver.ts`

Displays the game result:
- Winner announcement with country color
- Final standings sorted by supply center count
- Supply center count per country
