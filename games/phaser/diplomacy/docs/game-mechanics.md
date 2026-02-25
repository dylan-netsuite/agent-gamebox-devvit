# Diplomacy - Game Mechanics

## Overview

Diplomacy is a 2-7 player strategy game set in pre-World War I Europe. Players control Great Powers and issue simultaneous orders to their units. There is no dice — success depends on negotiation, alliances, and strategic planning.

## Great Powers

| Country | Color | Home SCs |
|---------|-------|----------|
| Austria-Hungary | Red (#C41E3A) | VIE, BUD, TRI |
| England | Navy (#1E3A5F) | LON, EDI, LVP |
| France | Blue (#4169E1) | PAR, MAR, BRE |
| Germany | Gray (#555555) | BER, MUN, KIE |
| Italy | Green (#2E8B57) | ROM, NAP, VEN |
| Russia | White (#8B8682) | MOS, STP, WAR, SEV |
| Turkey | Gold (#DAA520) | CON, ANK, SMY |

## Map

75 provinces total:
- **Inland**: Only armies can enter
- **Coastal**: Armies and fleets can enter
- **Water**: Only fleets can enter
- **34 supply centers** (SCs) scattered across the map, marked with star icons

### Province Tooltips
Hovering over any province displays a tooltip with:
- Full province name (e.g., "St. Petersburg" instead of "STP")
- Province type (Coastal / Inland / Water / Non-playable)
- Supply center owner (if applicable)
- Stationed unit type and country (if applicable)

### Supply Center Markers
Supply centers are visually indicated by small star markers below province labels. Stars are colored to match the controlling power, or gold if the center is neutral/unowned.

### Multi-Coast Provinces
- St. Petersburg (NC/SC coasts)
- Spain (NC/SC coasts)
- Bulgaria (EC/SC coasts)

When a fleet moves to one of these provinces, a coast picker popup appears in the center of the screen. The player must select which coast the fleet will occupy (e.g., "North Coast" or "South Coast"). This affects which provinces the fleet can subsequently move to. If the coast can be automatically determined from the origin province, it is pre-selected.

## Units

- **Army (A)**: Moves across land provinces; can be convoyed across water
- **Fleet (F)**: Moves across water and coastal provinces

## Turn Timer

Games can have a configurable turn time limit, set by any joined player in the lobby before the game starts.

### Presets
| Label | Duration |
|-------|----------|
| None | No limit (default) |
| 5m | 5 minutes |
| 15m | 15 minutes |
| 1h | 1 hour |
| 24h | 24 hours |
| 48h | 48 hours |

### Behavior When Timer Expires
- **Orders phase**: Auto-submit hold orders for all players who haven't submitted, then resolve the turn normally.
- **Retreats phase**: Disband all remaining dislodged units.
- **Builds phase**: Waive all pending builds/disbands.

The countdown is displayed in the Orders Panel with a monospace font. It turns red and pulses when under 1 minute remaining. The deadline is reset each time the phase changes.

## Turn Structure

Each game year has two seasons:

1. **Spring**: Orders phase → Resolution → Retreats (if needed)
2. **Fall**: Orders phase → Resolution → Retreats (if needed) → Supply center adjustment → Builds/Disbands

## Order Types

### Movement Phase
- **Hold**: Unit stays in place, defends at strength 1
- **Move**: Unit attempts to move to an adjacent province
- **Support**: Unit supports another unit's hold or move (+1 strength)
- **Convoy**: Fleet in water carries an army across sea zones

### Retreat Phase
Dislodged units must retreat to a valid adjacent province or disband. Cannot retreat to:
- The province the attacker came from
- An occupied province
- A province where a standoff occurred

### Build Phase (Fall only)
- **Build**: Place a new unit on an unoccupied home SC (if SCs > units)
- **Disband**: Remove a unit (if units > SCs)
- **Waive**: Decline to build

## Order Submission Flow

### Order Mode Selector
The Orders Panel provides five order modes via toggle buttons:
- **Move** (default): Click a unit, then click a legal destination to stage a move
- **Hold**: Click a unit to immediately stage a hold order
- **S Hold** (Support Hold): Click the supporting unit, then click the unit to be supported
- **S Move** (Support Move): Click the supporting unit, then the unit being supported, then the destination of the supported move
- **Convoy**: Click a fleet in a sea province, then click the army to be convoyed, then click the army's destination

### Staging Orders
1. Select an order mode from the mode selector bar
2. Follow the mode-specific click flow to stage the order
3. Staged orders appear in the Orders Panel with formatted descriptions (e.g., "A LVP → YOR", "F LON Hold", "A EDI S LVP (hold)")
4. Each order has an × button for manual removal
5. Staging a new order for a unit that already has one automatically replaces the previous order (duplicate prevention)

### Submitting
1. Clicking **Submit Orders** sends all staged orders to the server; units without explicit orders automatically **Hold**
2. The server waits for all players (bots submit instantly using heuristic AI)
3. When all orders are in, the adjudication engine resolves the turn
4. The map redraws with updated unit positions and the turn advances

### Retreat Phase UI
When units are dislodged, the Orders Panel switches to retreat mode:
- Each dislodged unit is shown with a dropdown of valid retreat destinations
- "Disband" is always an option
- Click **Submit Retreats** to send choices to `POST /api/game/retreats`

### Build Phase UI
After Fall supply center adjustments, the Orders Panel switches to build mode:
- Build allowances/requirements are shown per power
- Province and unit type dropdowns for building
- "Waive" option to decline a build
- Click **Submit Builds** to send choices to `POST /api/game/builds`

### Turn Log
The **Turn Log** button toggles a scrollable view of all past turn events:
- Turn headers are displayed in gold
- Successful moves are shown in green
- Failed orders and dislodgements are shown in red

### Visual Order Arrows
Staged orders are displayed as persistent colored arrows on the map:
- **Move**: White arrow from origin to destination
- **Hold**: Yellow circle around the unit
- **Support**: Green arrow to the supported destination, with a dashed line to the supported unit
- **Convoy**: Blue arrow to the convoyed army's destination, with a dashed line to the army

Arrows update automatically when orders are added, removed, or cleared.

### Real-Time State Sync
When waiting for other players, the client automatically polls `/api/game/state` every 5 seconds. When the state changes (phase, turn, or unit count), the scene reloads with updated data. Polling pauses when the player needs to act.

### Turn Resolution Animation
When units move after order resolution, they animate from their previous position to their new position with an 800ms cubic ease-out tween. This provides visual feedback of what happened during resolution.

### Chat / Negotiation
A collapsible chat panel in the bottom-left corner enables in-game communication:
- Toggle with the "Chat" button; unread messages show a red badge
- Messages are color-coded by country
- Stored in Redis sorted set, polled every 5 seconds
- 200-character message limit, 200-message history cap

#### Private Messaging
The chat panel includes channel tabs for private 1-on-1 messaging:
- **All** tab: Global chat visible to all players
- **Country tabs** (AUS, FRA, GER, ITA, RUS, TUR): Private channels between your country and the selected country
- Each tab shows an unread badge when new messages arrive in that channel
- DM messages are stored in separate Redis sorted sets, keyed by the sorted pair of country names
- Only the two participants in a DM channel can read or send messages in it

### Sound Effects
The game includes Web Audio API-generated sound effects:
- **Order staged**: Quick ascending beep when clicking to stage an order
- **Orders submitted**: Three-note ascending chord on successful submission
- **Phase change**: Major chord when the game phase advances
- **Chat message**: Short ping when a new message arrives
- **Victory**: Four-note fanfare on game completion
- A mute toggle button (🔊/🔇) is available in the bottom-right corner

### Lobby Auto-Polling
The MainMenu lobby polls for new players every 3 seconds. When the game starts (another player clicks START), all connected clients automatically transition to the GamePlay scene without manual refresh.

## Bot AI

Empty country slots can be filled with bots via the "FILL WITH BOTS" button in the lobby. Bots use a two-tier AI system:

### Tier 1: Heuristic Baseline
A rule-based priority system generates a "baseline" order set:
1. **Defend threatened SCs**: If an enemy unit is adjacent to an owned supply center, the bot moves to defend or support-holds the SC.
2. **Attack reachable SCs**: Move to capture undefended supply centers adjacent to the unit. Neutral SCs are preferred over enemy-owned ones.
3. **Pathfind toward distant SCs**: If no SC is directly reachable, use BFS pathfinding to step toward the nearest target SC.
4. **Support own attacks**: If a friendly unit is already moving to a province, support that move instead of issuing an independent order.
5. **Hold**: Units with no useful offensive or defensive option hold in place.

Anti-self-bounce logic ensures two bot units never move to the same province — the second unit automatically converts to a support order.

### Tier 2: Outcome Simulation
The baseline is then improved through simulation:
1. **Candidate generation**: Up to 40 variant order sets are created by swapping individual unit orders and creating coordinated move+support pairs.
2. **Simulation**: Each candidate is tested against predicted opponent orders (assume all opponents hold) using the real `resolveOrders` adjudication engine.
3. **Scoring**: The resulting board position is evaluated with a weighted formula:
   - Supply centers owned: ×100
   - Units alive: ×30
   - Units adjacent to target SCs: ×15
   - Units threatening enemy SCs: ×5
   - Own SCs under threat: ×-20
4. **Selection**: The candidate with the highest score is chosen.

### Retreats Phase
Bots prefer retreating to supply centers (especially their own), then to provinces closest to friendly SCs. If no valid retreat destination exists, the unit is disbanded.

### Builds Phase
- **Naval powers** (England, Turkey) prefer building fleets at coastal home SCs.
- **All bots** prioritize building at home SCs closest to the front line (nearest enemy territory).
- When disbanding, bots remove the unit furthest from any enemy supply center (least strategically useful).

## Order Resolution

All orders are resolved simultaneously using the standard Diplomacy adjudication algorithm:
1. Validate all orders
2. Cut supports (attacks on supporting units cancel their support)
3. Calculate attack and defense strengths
4. Resolve moves (head-to-head battles, standoffs)
5. Determine dislodged units and retreat options

## Victory Condition

Control **18 or more supply centers** at the end of a Fall turn.

## Game History / Replay

After each turn resolves, a snapshot of the board state is saved. Players can review the game's history at any time:

- **History button**: Gold-styled button in the top-left corner of the GamePlay scene
- **Timeline slider**: Scrub through all saved snapshots with prev/next buttons or a range slider
- **Turn label**: Shows the turn (e.g., "Spring 1901 -- After Orders") and snapshot index (e.g., "3 / 12")
- **Turn log**: Color-coded log entries for the selected snapshot (green = success, red = failure)
- **Map updates**: Units and supply center ownership update to match the selected snapshot
- **Return to Live**: Button to exit history mode and return to the current game state

Snapshots are saved at four points:
1. **Initial** — When the game starts (starting positions)
2. **After Orders** — After orders are resolved
3. **After Retreats** — After retreats are processed
4. **After Builds** — After builds/disbands are applied

During history mode, province interactions (clicking, ordering) are disabled and the orders panel is hidden.

## Game Over Screen

When the game ends, players are shown a full statistics screen:
- **Winner announcement** with animated crown and country-colored text
- **Animated bar chart** showing each country's supply center count as horizontal bars
- Unit counts and winner star indicator
- Final turn information and game duration (number of turns played)
- **View History** button to review the game's turn-by-turn history
- **Return to Lobby** button to go back to the main menu
- Victory fanfare sound effect plays on screen entry

## Tutorial Mode

A guided, client-side tutorial that teaches all core mechanics through a scripted introductory game. The player controls Italy and plays through ~3 game years (Spring 1901 to Fall 1903), learning:

- **Movement** — Moving armies and fleets to adjacent provinces
- **Hold** — Defending a position
- **Support** — Adding strength to attacks and defenses
- **Convoy** — Transporting armies across water via fleets
- **Retreats** — Repositioning dislodged units
- **Builds** — Creating new units after gaining supply centers

The tutorial runs entirely on the client with no server communication. Bot orders are pre-scripted to create pedagogically interesting scenarios (e.g., a supported attack dislodges the player's unit to teach retreats). Accessible from the "TUTORIAL" button on the main menu.

## Phases

| Phase | Description |
|-------|-------------|
| `waiting` | Lobby — players join countries |
| `orders` | Players write and submit orders |
| `retreats` | Dislodged units retreat or disband |
| `builds` | Fall adjustments: build or disband units |
| `complete` | Game over — winner declared |
