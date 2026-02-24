# Blokus - Game Mechanics

## Game Variant

**Blokus Duo** - A 2-player variant of the classic Blokus board game.

## Board

- 14x14 grid (196 cells)
- Starting positions: Player 1 (Blue) at (4,4), Player 2/AI (Orange) at (9,9)
- Cells can be: empty, Player 1, or Player 2

## Pieces

Each player has 21 polyomino pieces (identical sets):

| Category | Count | Pieces |
|----------|-------|--------|
| Monomino (1 sq) | 1 | O1 |
| Domino (2 sq) | 1 | I2 |
| Trominoes (3 sq) | 2 | I3, L3 |
| Tetrominoes (4 sq) | 5 | I4, O4, T4, S4, L4 |
| Pentominoes (5 sq) | 12 | F, I5, L5, N, P, T5, U, V, W, X, Y, Z |

Total: 89 squares per player (21 pieces).

## Placement Rules

1. **First move**: Must cover the player's starting position
2. **Corner contact**: Each subsequent piece must touch at least one same-color piece diagonally (corner-to-corner)
3. **No edge adjacency**: Same-color pieces may NOT share an edge
4. **Cross-color**: Different colors can touch edges freely
5. **Transforms**: Pieces can be rotated (0/90/180/270 degrees) and flipped horizontally

## Turn Flow

1. Player selects a piece from the bottom tray (tap/click) or drags it directly onto the board
2. Player can rotate (CW/CCW) or flip using on-screen buttons or keyboard shortcuts (R=CW, E=CCW, F=flip)
3. Player hovers over the board to see ghost preview (green = valid, red = invalid)
4. Player clicks/taps to place the piece, or drops a dragged piece
5. If the placement was a mistake, player can press Undo (↩) to revert
6. If no valid moves exist, player can use the Pass button
7. AI takes its turn automatically

### Piece Tray UX

- **Bottom strip**: Horizontal scrollable tray at the bottom of the screen
- **Size tabs**: Filter pieces by category (All, 1-2, 3, 4, 5 cells)
- **Playability**: Pieces with no valid moves are dimmed with a red indicator dot
- **Used pieces**: Placed pieces remain in tray as dimmed silhouettes for reference
- **Selection preview**: Selected piece shows current rotation/flip in the tray
- **Auto-select**: First playable piece is auto-selected at the start of each turn
- **Drag-and-drop**: Long-press/drag a piece from tray directly onto the board (8px threshold)
- **Control buttons**: On-screen ↺ CCW, ↻ CW, ↔ Flip, ↩ Undo, ✕ Clear, and ⏭ Pass buttons
- **Orientation display**: Status text shows current rotation angle and flip state (e.g. "90° flipped")

### Undo

- Reverts the player's last move AND the AI's response move
- Single-level: can only undo the most recent move pair
- Available only when it's the player's turn and a move has been made
- Keyboard shortcut: Z key
- The undone piece is automatically re-selected for placement

### Sound Effects

Procedural audio generated via Web Audio API (no external files):
- **Placement**: Low-frequency thunk
- **Rotate/Flip**: Quick click
- **Selection**: Soft pop
- **Invalid move**: Error buzz
- **AI move**: Two-tone chime
- **Undo**: Descending sweep
- **Game over**: Ascending arpeggio (win) or descending (loss)
- **Pass**: Muted thud

## AI Opponent

The AI uses a scoring heuristic to choose moves:

- **Piece size** (+10 per square): Prefers placing larger pieces early
- **New corners** (+5 each): Prefers moves that create more future placement opportunities
- **Center proximity** (-2 per unit distance): Prefers moves toward the board center
- **Self-blocking** (-3 each): Avoids moves that block own future corners

Difficulty levels: Easy (random), Medium (top 5 candidates), Hard (top 3 candidates).

## Scoring

| Condition | Points |
|-----------|--------|
| Each unplaced square | -1 |
| All 21 pieces placed | +15 bonus |
| All placed + last was monomino | +5 extra |

Highest score wins. Possible score range: -89 (nothing placed) to +20 (perfect game with monomino last).

## Game End

The game ends when neither player can make a valid move. This happens when:
- Both players have placed all pieces, OR
- Both players have no valid placements remaining, OR
- Both players pass consecutively
