# Rush Hour - Game Mechanics

## Board

- 6×6 grid with an exit on the right side at row 2 (0-indexed)
- Cars occupy 2 cells, trucks occupy 3 cells
- Vehicles slide along their orientation axis only (no rotation)
- The red "target" car is always horizontal at row 2

## Controls

- **Drag** vehicles along their axis to slide them — vehicles follow the pointer smoothly in pixel space and snap to the nearest valid cell on release
- Collision boundaries are pre-computed when a drag starts, so the vehicle can only move within its valid range
- The red target car can be dragged past the right edge of the grid to exit and win
- If the pointer exits the canvas during a drag, the vehicle auto-snaps to the nearest valid cell (pointer-out safety)
- Touch targets are expanded by 8px around each vehicle for easier mobile interaction
- **Undo** button reverses the last move
- **Reset** button restarts the puzzle from the beginning

### Exit Animation
When the red car is dragged past the grid's right boundary, an ease-out cubic animation slides it off-screen with a whoosh sound effect, followed by a celebration sound and transition to the PuzzleComplete scene.

### Sound Effects
All sounds are generated procedurally via the Web Audio API (no asset files required):
- **Snap**: Short click/tick when a vehicle crosses a cell boundary during drag
- **Whoosh**: Rising frequency sweep when the red car exits the board
- **Celebrate**: Ascending arpeggio on puzzle completion

## Scoring

- **3 Stars**: Completed at or below the minimum number of moves
- **2 Stars**: Completed within 150% of minimum moves
- **1 Star**: Completed in any number of moves
- **Time**: Tracked from first load to completion (minutes:seconds)
- **Moves**: Each discrete slide counts as one move

## Game Modes

### Puzzle Catalog
111 built-in puzzles across 5 difficulty tiers, sourced from the Fogleman Rush Hour database (all BFS-validated):
- **Beginner** (15 puzzles): 1-8 minimum moves, 1-11 vehicles
- **Intermediate** (25 puzzles): 9-18 minimum moves, 9-13 vehicles
- **Advanced** (30 puzzles): 19-30 minimum moves, 11-13 vehicles
- **Expert** (30 puzzles): 31-42 minimum moves, 10-14 vehicles
- **Grandmaster** (11 puzzles): 43-51 minimum moves, 12-13 vehicles

Puzzles were selected to maximize cluster size (branching factor), which correlates with perceived difficulty beyond raw move count. The Grandmaster tier contains the hardest known 0-wall Rush Hour configurations.

Puzzle catalog cards display completion status: stars earned and best result (moves/time) for each puzzle the player has solved.

### Daily Puzzle
- One puzzle per day, same for all users
- Selected deterministically from the catalog using a date-based hash
- Daily leaderboard tracks moves and time
- Daily streak tracking for consecutive days played

### Puzzle Editor
- Place vehicles on a 6×6 grid by tapping
- Select vehicle type (car/truck) and orientation (horizontal/vertical)
- First horizontal car placed on row 2 automatically becomes the target (red) car
- Tap existing vehicles to remove them
- **Validate** button runs BFS solver to check solvability and compute minimum moves
- **Play** button starts the custom puzzle (must be valid and solvable)
- Custom puzzles are saved to the server

## Puzzle Validation Rules

1. Exactly one target (red) car must exist
2. Target car must be horizontal on row 2
3. Target car must be a car (length 2), not a truck
4. No vehicles may overlap
5. All vehicles must be within the 6×6 grid bounds
6. The puzzle must be solvable (BFS finds a solution within 300 moves)
