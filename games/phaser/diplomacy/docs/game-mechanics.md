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
2. The server waits for all players (bots submit instantly)
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

## Order Resolution

All orders are resolved simultaneously using the standard Diplomacy adjudication algorithm:
1. Validate all orders
2. Cut supports (attacks on supporting units cancel their support)
3. Calculate attack and defense strengths
4. Resolve moves (head-to-head battles, standoffs)
5. Determine dislodged units and retreat options

## Victory Condition

Control **18 or more supply centers** at the end of a Fall turn.

## Game Over Screen

When the game ends, players are shown a full statistics screen:
- **Winner announcement** with animated crown and country-colored text
- **Animated bar chart** showing each country's supply center count as horizontal bars
- Unit counts and winner star indicator
- Final turn information and game duration (number of turns played)
- **Return to Lobby** button to go back to the main menu
- Victory fanfare sound effect plays on screen entry

## Phases

| Phase | Description |
|-------|-------------|
| `waiting` | Lobby — players join countries |
| `orders` | Players write and submit orders |
| `retreats` | Dislodged units retreat or disband |
| `builds` | Fall adjustments: build or disband units |
| `complete` | Game over — winner declared |
