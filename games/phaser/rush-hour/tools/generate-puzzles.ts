/**
 * Generates valid, BFS-verified Rush Hour puzzles.
 * Run with: npx tsx tools/generate-puzzles.ts
 */

type Orientation = 'h' | 'v';
type VehicleType = 'car' | 'truck';

interface Vehicle {
  id: string;
  type: VehicleType;
  orientation: Orientation;
  row: number;
  col: number;
  color: string;
  isTarget: boolean;
}

const GRID_SIZE = 6;
const EXIT_ROW = 2;

const COLORS = [
  '#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261',
  '#6a4c93', '#48bfe3', '#06d6a0', '#ef476f', '#ffd166',
  '#118ab2', '#073b4c', '#8338ec', '#ff006e', '#fb5607', '#3a86ff',
];

function buildGrid(vehicles: Vehicle[]): boolean[][] {
  const grid: boolean[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => false)
  );
  for (const v of vehicles) {
    const len = v.type === 'truck' ? 3 : 2;
    for (let j = 0; j < len; j++) {
      const r = v.orientation === 'v' ? v.row + j : v.row;
      const c = v.orientation === 'h' ? v.col + j : v.col;
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        grid[r]![c] = true;
      }
    }
  }
  return grid;
}

function encodeState(positions: { row: number; col: number }[]): string {
  return positions.map(p => `${p.row},${p.col}`).join('|');
}

function solve(vehicles: Vehicle[], maxDepth = 300): number {
  const initialPositions = vehicles.map(v => ({ row: v.row, col: v.col }));

  const isWon = (positions: { row: number; col: number }[]) => {
    for (let i = 0; i < vehicles.length; i++) {
      if (vehicles[i]!.isTarget) {
        return positions[i]!.row === EXIT_ROW && positions[i]!.col === GRID_SIZE - 2;
      }
    }
    return false;
  };

  if (isWon(initialPositions)) return 0;

  const visited = new Set<string>();
  const queue: { positions: { row: number; col: number }[]; moves: number }[] = [];
  visited.add(encodeState(initialPositions));
  queue.push({ positions: initialPositions, moves: 0 });

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.moves >= maxDepth) continue;

    const grid: boolean[][] = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => false)
    );
    for (let i = 0; i < vehicles.length; i++) {
      const veh = vehicles[i]!;
      const pos = current.positions[i]!;
      const len = veh.type === 'truck' ? 3 : 2;
      for (let j = 0; j < len; j++) {
        const r = veh.orientation === 'v' ? pos.row + j : pos.row;
        const c = veh.orientation === 'h' ? pos.col + j : pos.col;
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) grid[r]![c] = true;
      }
    }

    for (let i = 0; i < vehicles.length; i++) {
      const veh = vehicles[i]!;
      const pos = current.positions[i]!;
      const len = veh.type === 'truck' ? 3 : 2;

      if (veh.orientation === 'h') {
        for (const delta of [-1, 1]) {
          let step = delta;
          while (true) {
            const newCol = pos.col + step;
            const checkCol = delta === -1 ? newCol : newCol + len - 1;
            if (checkCol < 0 || checkCol >= GRID_SIZE) break;
            if (grid[pos.row]![checkCol]! && !(pos.col <= checkCol && checkCol < pos.col + len)) break;
            // Check the actual cell, not already occupied by this vehicle
            let blocked = false;
            if (delta === -1) {
              if (grid[pos.row]![newCol]!) {
                // Check if it's our own cell
                if (newCol < pos.col || newCol >= pos.col + len) { blocked = true; }
              }
            } else {
              const farEnd = newCol + len - 1;
              if (grid[pos.row]![farEnd]!) {
                if (farEnd < pos.col || farEnd >= pos.col + len) { blocked = true; }
              }
            }
            if (blocked) break;

            const newPositions = current.positions.map((p, idx) =>
              idx === i ? { row: p.row, col: newCol } : { ...p }
            );
            const key = encodeState(newPositions);
            if (!visited.has(key)) {
              visited.add(key);
              if (isWon(vehicles, newPositions)) return current.moves + 1;
              queue.push({ positions: newPositions, moves: current.moves + 1 });
            }
            step += delta;
          }
        }
      } else {
        for (const delta of [-1, 1]) {
          let step = delta;
          while (true) {
            const newRow = pos.row + step;
            const checkRow = delta === -1 ? newRow : newRow + len - 1;
            if (checkRow < 0 || checkRow >= GRID_SIZE) break;
            let blocked = false;
            if (delta === -1) {
              if (grid[newRow]![pos.col]!) {
                if (newRow < pos.row || newRow >= pos.row + len) blocked = true;
              }
            } else {
              const farEnd = newRow + len - 1;
              if (grid[farEnd]![pos.col]!) {
                if (farEnd < pos.row || farEnd >= pos.row + len) blocked = true;
              }
            }
            if (blocked) break;

            const newPositions = current.positions.map((p, idx) =>
              idx === i ? { row: newRow, col: p.col } : { ...p }
            );
            const key = encodeState(newPositions);
            if (!visited.has(key)) {
              visited.add(key);
              if (isWon(vehicles, newPositions)) return current.moves + 1;
              queue.push({ positions: newPositions, moves: current.moves + 1 });
            }
            step += delta;
          }
        }
      }
    }
  }

  function isWon(vehicles: Vehicle[], positions: { row: number; col: number }[]): boolean {
    for (let i = 0; i < vehicles.length; i++) {
      if (vehicles[i]!.isTarget) {
        return positions[i]!.row === EXIT_ROW && positions[i]!.col === GRID_SIZE - 2;
      }
    }
    return false;
  }

  return -1;
}

function validate(vehicles: Vehicle[]): boolean {
  const grid: boolean[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => false)
  );
  for (const v of vehicles) {
    const len = v.type === 'truck' ? 3 : 2;
    for (let j = 0; j < len; j++) {
      const r = v.orientation === 'v' ? v.row + j : v.row;
      const c = v.orientation === 'h' ? v.col + j : v.col;
      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
      if (grid[r]![c]!) return false;
      grid[r]![c] = true;
    }
  }
  return true;
}

function canPlace(
  grid: boolean[][],
  type: VehicleType,
  orientation: Orientation,
  row: number,
  col: number
): boolean {
  const len = type === 'truck' ? 3 : 2;
  for (let j = 0; j < len; j++) {
    const r = orientation === 'v' ? row + j : row;
    const c = orientation === 'h' ? col + j : col;
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
    if (grid[r]![c]!) return false;
  }
  return true;
}

function placeOnGrid(
  grid: boolean[][],
  type: VehicleType,
  orientation: Orientation,
  row: number,
  col: number
): void {
  const len = type === 'truck' ? 3 : 2;
  for (let j = 0; j < len; j++) {
    const r = orientation === 'v' ? row + j : row;
    const c = orientation === 'h' ? col + j : col;
    grid[r]![c] = true;
  }
}

function generatePuzzle(
  targetMinMoves: number,
  numVehicles: number,
  maxAttempts: number = 5000
): Vehicle[] | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const grid: boolean[][] = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => false)
    );

    const targetCol = Math.floor(Math.random() * 3);
    const target: Vehicle = {
      id: 'X',
      type: 'car',
      orientation: 'h',
      row: EXIT_ROW,
      col: targetCol,
      color: COLORS[0]!,
      isTarget: true,
    };
    placeOnGrid(grid, 'car', 'h', EXIT_ROW, targetCol);
    const vehicles: Vehicle[] = [target];

    let colorIdx = 1;
    for (let v = 0; v < numVehicles - 1; v++) {
      let placed = false;
      for (let tries = 0; tries < 50; tries++) {
        const type: VehicleType = Math.random() < 0.25 ? 'truck' : 'car';
        const orientation: Orientation = Math.random() < 0.5 ? 'h' : 'v';
        const maxRow = orientation === 'v' ? GRID_SIZE - (type === 'truck' ? 3 : 2) : GRID_SIZE - 1;
        const maxCol = orientation === 'h' ? GRID_SIZE - (type === 'truck' ? 3 : 2) : GRID_SIZE - 1;
        const row = Math.floor(Math.random() * (maxRow + 1));
        const col = Math.floor(Math.random() * (maxCol + 1));

        if (canPlace(grid, type, orientation, row, col)) {
          const id = String.fromCharCode(65 + v);
          vehicles.push({
            id,
            type,
            orientation,
            row,
            col,
            color: COLORS[colorIdx % COLORS.length]!,
            isTarget: false,
          });
          placeOnGrid(grid, type, orientation, row, col);
          colorIdx++;
          placed = true;
          break;
        }
      }
      if (!placed) break;
    }

    if (vehicles.length < numVehicles) continue;

    const minMoves = solve(vehicles);
    if (minMoves >= targetMinMoves - 2 && minMoves <= targetMinMoves + 2 && minMoves > 0) {
      return vehicles.map(v => ({ ...v }));
    }
  }
  return null;
}

// Generate puzzles for each difficulty
interface PuzzleSpec {
  difficulty: string;
  targetMoves: number;
  numVehicles: number;
  name: string;
}

const specs: PuzzleSpec[] = [
  // Beginner (1-10)
  { difficulty: 'beginner', targetMoves: 1, numVehicles: 1, name: 'First Steps' },
  { difficulty: 'beginner', targetMoves: 2, numVehicles: 3, name: 'One Blocker' },
  { difficulty: 'beginner', targetMoves: 3, numVehicles: 3, name: 'Side Step' },
  { difficulty: 'beginner', targetMoves: 3, numVehicles: 4, name: 'Tight Squeeze' },
  { difficulty: 'beginner', targetMoves: 4, numVehicles: 4, name: 'Two Way' },
  { difficulty: 'beginner', targetMoves: 4, numVehicles: 5, name: 'Clear Path' },
  { difficulty: 'beginner', targetMoves: 5, numVehicles: 5, name: 'Detour' },
  { difficulty: 'beginner', targetMoves: 5, numVehicles: 5, name: 'Shuffle' },
  { difficulty: 'beginner', targetMoves: 6, numVehicles: 5, name: 'Warm Up' },
  { difficulty: 'beginner', targetMoves: 7, numVehicles: 6, name: 'Getting Started' },
  // Intermediate (11-20)
  { difficulty: 'intermediate', targetMoves: 8, numVehicles: 7, name: 'Crossroads' },
  { difficulty: 'intermediate', targetMoves: 9, numVehicles: 8, name: 'Traffic Jam' },
  { difficulty: 'intermediate', targetMoves: 10, numVehicles: 8, name: 'Gridlock' },
  { difficulty: 'intermediate', targetMoves: 11, numVehicles: 8, name: 'Bottleneck' },
  { difficulty: 'intermediate', targetMoves: 12, numVehicles: 9, name: 'Maze Runner' },
  { difficulty: 'intermediate', targetMoves: 13, numVehicles: 9, name: 'Rush Hour' },
  { difficulty: 'intermediate', targetMoves: 14, numVehicles: 10, name: 'Congestion' },
  { difficulty: 'intermediate', targetMoves: 15, numVehicles: 10, name: 'Intersection' },
  { difficulty: 'intermediate', targetMoves: 16, numVehicles: 10, name: 'Bumper to Bumper' },
  { difficulty: 'intermediate', targetMoves: 17, numVehicles: 11, name: 'Pile Up' },
  // Advanced (21-30)
  { difficulty: 'advanced', targetMoves: 18, numVehicles: 11, name: 'Lockdown' },
  { difficulty: 'advanced', targetMoves: 19, numVehicles: 11, name: 'Deadlock' },
  { difficulty: 'advanced', targetMoves: 20, numVehicles: 12, name: 'Snarl' },
  { difficulty: 'advanced', targetMoves: 21, numVehicles: 12, name: 'Standstill' },
  { difficulty: 'advanced', targetMoves: 22, numVehicles: 12, name: 'Impasse' },
  { difficulty: 'advanced', targetMoves: 23, numVehicles: 12, name: 'Quagmire' },
  { difficulty: 'advanced', targetMoves: 24, numVehicles: 13, name: 'Entangled' },
  { difficulty: 'advanced', targetMoves: 25, numVehicles: 13, name: 'Stalemate' },
  { difficulty: 'advanced', targetMoves: 26, numVehicles: 13, name: 'Labyrinth' },
  { difficulty: 'advanced', targetMoves: 27, numVehicles: 13, name: 'Conundrum' },
  // Expert (31-40)
  { difficulty: 'expert', targetMoves: 28, numVehicles: 13, name: 'Nightmare' },
  { difficulty: 'expert', targetMoves: 29, numVehicles: 13, name: 'Impossible' },
  { difficulty: 'expert', targetMoves: 30, numVehicles: 13, name: 'Chaos' },
  { difficulty: 'expert', targetMoves: 31, numVehicles: 13, name: 'Inferno' },
  { difficulty: 'expert', targetMoves: 32, numVehicles: 13, name: 'Armageddon' },
  { difficulty: 'expert', targetMoves: 33, numVehicles: 13, name: 'Catastrophe' },
  { difficulty: 'expert', targetMoves: 34, numVehicles: 13, name: 'Apocalypse' },
  { difficulty: 'expert', targetMoves: 35, numVehicles: 13, name: 'Oblivion' },
  { difficulty: 'expert', targetMoves: 36, numVehicles: 13, name: 'Cataclysm' },
  { difficulty: 'expert', targetMoves: 37, numVehicles: 13, name: 'Grand Master' },
];

console.log('Generating puzzles...');

const diffPrefixes: Record<string, string> = {
  beginner: 'b',
  intermediate: 'i',
  advanced: 'a',
  expert: 'e',
};

const results: { id: string; name: string; difficulty: string; minMoves: number; vehicles: Vehicle[] }[] = [];
let diffCounters: Record<string, number> = { beginner: 0, intermediate: 0, advanced: 0, expert: 0 };

for (const spec of specs) {
  diffCounters[spec.difficulty]!++;
  const idx = diffCounters[spec.difficulty]!;
  const id = `${diffPrefixes[spec.difficulty]}${String(idx).padStart(2, '0')}`;

  console.log(`  Generating ${id} "${spec.name}" (target: ~${spec.targetMoves} moves, ${spec.numVehicles} vehicles)...`);

  const vehicles = generatePuzzle(spec.targetMoves, spec.numVehicles, 10000);
  if (vehicles) {
    const actualMoves = solve(vehicles);
    console.log(`    ✓ Generated with ${actualMoves} min moves`);
    results.push({ id, name: spec.name, difficulty: spec.difficulty, minMoves: actualMoves, vehicles });
  } else {
    console.log(`    ✗ Failed to generate, using simpler params`);
    const fallback = generatePuzzle(Math.max(1, spec.targetMoves - 3), Math.max(2, spec.numVehicles - 2), 20000);
    if (fallback) {
      const actualMoves = solve(fallback);
      console.log(`    ✓ Fallback generated with ${actualMoves} min moves`);
      results.push({ id, name: spec.name, difficulty: spec.difficulty, minMoves: actualMoves, vehicles: fallback });
    } else {
      console.log(`    ✗✗ Complete failure, skipping`);
    }
  }
}

// Output as TypeScript
console.log('\n\nGenerated puzzles TypeScript:\n');

for (const p of results) {
  console.log(`  {`);
  console.log(`    id: '${p.id}', name: '${p.name}', difficulty: '${p.difficulty}', minMoves: ${p.minMoves},`);
  console.log(`    vehicles: [`);
  for (const v of p.vehicles) {
    const colorIdx = COLORS.indexOf(v.color);
    console.log(`      v('${v.id}', '${v.type}', '${v.orientation}', ${v.row}, ${v.col}, VEHICLE_COLORS[${colorIdx}]!${v.isTarget ? ', true' : ''}),`);
  }
  console.log(`    ],`);
  console.log(`  },`);
}
