/**
 * Generates valid, BFS-verified Rush Hour puzzles with output ready for puzzles.ts.
 * Run: cd games/phaser/rush-hour && npx tsx tools/gen.ts
 */

const GRID_SIZE = 6;
const EXIT_ROW = 2;

type O = 'h' | 'v';
type T = 'car' | 'truck';
interface V { id: string; type: T; orientation: O; row: number; col: number; isTarget: boolean; }

function encodeState(p: { row: number; col: number }[]): string {
  return p.map(x => `${x.row},${x.col}`).join('|');
}

function solveBFS(vehicles: V[], maxDepth = 300): number {
  const init = vehicles.map(v => ({ row: v.row, col: v.col }));
  const won = (pos: { row: number; col: number }[]) => {
    for (let i = 0; i < vehicles.length; i++)
      if (vehicles[i]!.isTarget) return pos[i]!.row === EXIT_ROW && pos[i]!.col === GRID_SIZE - 2;
    return false;
  };
  if (won(init)) return 0;

  const visited = new Set<string>();
  const queue: { pos: { row: number; col: number }[]; m: number }[] = [];
  visited.add(encodeState(init));
  queue.push({ pos: init, m: 0 });

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.m >= maxDepth) continue;

    const grid: boolean[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false) as boolean[]);
    for (let i = 0; i < vehicles.length; i++) {
      const veh = vehicles[i]!; const p = cur.pos[i]!;
      const len = veh.type === 'truck' ? 3 : 2;
      for (let j = 0; j < len; j++) {
        const r = veh.orientation === 'v' ? p.row + j : p.row;
        const c = veh.orientation === 'h' ? p.col + j : p.col;
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) grid[r]![c] = true;
      }
    }

    for (let i = 0; i < vehicles.length; i++) {
      const veh = vehicles[i]!; const p = cur.pos[i]!;
      const len = veh.type === 'truck' ? 3 : 2;

      if (veh.orientation === 'h') {
        for (const d of [-1, 1]) {
          let s = d;
          while (true) {
            const nc = p.col + s;
            const check = d === -1 ? nc : nc + len - 1;
            if (check < 0 || check >= GRID_SIZE) break;
            if (grid[p.row]![check]!) break;
            const np = cur.pos.map((x, idx) => idx === i ? { row: x.row, col: nc } : { ...x });
            const k = encodeState(np);
            if (!visited.has(k)) {
              visited.add(k);
              if (won(np)) return cur.m + 1;
              queue.push({ pos: np, m: cur.m + 1 });
            }
            s += d;
          }
        }
      } else {
        for (const d of [-1, 1]) {
          let s = d;
          while (true) {
            const nr = p.row + s;
            const check = d === -1 ? nr : nr + len - 1;
            if (check < 0 || check >= GRID_SIZE) break;
            if (grid[check]![p.col]!) break;
            const np = cur.pos.map((x, idx) => idx === i ? { row: nr, col: x.col } : { ...x });
            const k = encodeState(np);
            if (!visited.has(k)) {
              visited.add(k);
              if (won(np)) return cur.m + 1;
              queue.push({ pos: np, m: cur.m + 1 });
            }
            s += d;
          }
        }
      }
    }
  }
  return -1;
}

function canPlace(grid: boolean[][], type: T, orientation: O, row: number, col: number): boolean {
  const len = type === 'truck' ? 3 : 2;
  for (let j = 0; j < len; j++) {
    const r = orientation === 'v' ? row + j : row;
    const c = orientation === 'h' ? col + j : col;
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
    if (grid[r]![c]!) return false;
  }
  return true;
}

function place(grid: boolean[][], type: T, orientation: O, row: number, col: number): void {
  const len = type === 'truck' ? 3 : 2;
  for (let j = 0; j < len; j++) {
    const r = orientation === 'v' ? row + j : row;
    const c = orientation === 'h' ? col + j : col;
    grid[r]![c] = true;
  }
}

function genPuzzle(targetMin: number, targetMax: number, numVeh: number, maxAttempts: number): { vehicles: V[]; minMoves: number } | null {
  for (let a = 0; a < maxAttempts; a++) {
    const grid: boolean[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false) as boolean[]);
    const tc = Math.floor(Math.random() * 3); // target col 0, 1, or 2
    const target: V = { id: 'X', type: 'car', orientation: 'h', row: EXIT_ROW, col: tc, isTarget: true };
    place(grid, 'car', 'h', EXIT_ROW, tc);
    const vehs: V[] = [target];

    for (let v = 0; v < numVeh - 1; v++) {
      let placed = false;
      for (let t = 0; t < 100; t++) {
        const type: T = Math.random() < 0.2 ? 'truck' : 'car';
        const orientation: O = Math.random() < 0.5 ? 'h' : 'v';
        const maxR = orientation === 'v' ? GRID_SIZE - (type === 'truck' ? 3 : 2) : GRID_SIZE - 1;
        const maxC = orientation === 'h' ? GRID_SIZE - (type === 'truck' ? 3 : 2) : GRID_SIZE - 1;
        const r = Math.floor(Math.random() * (maxR + 1));
        const c = Math.floor(Math.random() * (maxC + 1));
        if (canPlace(grid, type, orientation, r, c)) {
          vehs.push({ id: String.fromCharCode(65 + v), type, orientation, row: r, col: c, isTarget: false });
          place(grid, type, orientation, r, c);
          placed = true;
          break;
        }
      }
      if (!placed) break;
    }
    if (vehs.length < numVeh) continue;

    const mm = solveBFS(vehs);
    if (mm >= targetMin && mm <= targetMax) {
      return { vehicles: vehs, minMoves: mm };
    }
  }
  return null;
}

const COLORS = [
  '#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261',
  '#6a4c93', '#48bfe3', '#06d6a0', '#ef476f', '#ffd166',
  '#118ab2', '#073b4c', '#8338ec', '#ff006e', '#fb5607', '#3a86ff',
];

interface Spec { id: string; name: string; difficulty: string; targetMin: number; targetMax: number; numVeh: number; }

const specs: Spec[] = [
  { id: 'b01', name: 'First Steps', difficulty: 'beginner', targetMin: 1, targetMax: 1, numVeh: 1 },
  { id: 'b02', name: 'One Blocker', difficulty: 'beginner', targetMin: 2, targetMax: 2, numVeh: 3 },
  { id: 'b03', name: 'Side Step', difficulty: 'beginner', targetMin: 2, targetMax: 3, numVeh: 4 },
  { id: 'b04', name: 'Tight Squeeze', difficulty: 'beginner', targetMin: 3, targetMax: 4, numVeh: 4 },
  { id: 'b05', name: 'Two Way', difficulty: 'beginner', targetMin: 3, targetMax: 5, numVeh: 5 },
  { id: 'b06', name: 'Clear Path', difficulty: 'beginner', targetMin: 4, targetMax: 5, numVeh: 5 },
  { id: 'b07', name: 'Detour', difficulty: 'beginner', targetMin: 4, targetMax: 6, numVeh: 5 },
  { id: 'b08', name: 'Shuffle', difficulty: 'beginner', targetMin: 5, targetMax: 7, numVeh: 6 },
  { id: 'b09', name: 'Warm Up', difficulty: 'beginner', targetMin: 5, targetMax: 7, numVeh: 6 },
  { id: 'b10', name: 'Getting Started', difficulty: 'beginner', targetMin: 6, targetMax: 8, numVeh: 7 },

  { id: 'i01', name: 'Crossroads', difficulty: 'intermediate', targetMin: 7, targetMax: 10, numVeh: 7 },
  { id: 'i02', name: 'Traffic Jam', difficulty: 'intermediate', targetMin: 8, targetMax: 11, numVeh: 8 },
  { id: 'i03', name: 'Gridlock', difficulty: 'intermediate', targetMin: 9, targetMax: 12, numVeh: 8 },
  { id: 'i04', name: 'Bottleneck', difficulty: 'intermediate', targetMin: 10, targetMax: 13, numVeh: 9 },
  { id: 'i05', name: 'Maze Runner', difficulty: 'intermediate', targetMin: 11, targetMax: 14, numVeh: 9 },
  { id: 'i06', name: 'Rush Hour', difficulty: 'intermediate', targetMin: 12, targetMax: 15, numVeh: 9 },
  { id: 'i07', name: 'Congestion', difficulty: 'intermediate', targetMin: 13, targetMax: 16, numVeh: 10 },
  { id: 'i08', name: 'Intersection', difficulty: 'intermediate', targetMin: 14, targetMax: 17, numVeh: 10 },
  { id: 'i09', name: 'Bumper to Bumper', difficulty: 'intermediate', targetMin: 15, targetMax: 18, numVeh: 10 },
  { id: 'i10', name: 'Pile Up', difficulty: 'intermediate', targetMin: 16, targetMax: 20, numVeh: 11 },

  { id: 'a01', name: 'Lockdown', difficulty: 'advanced', targetMin: 17, targetMax: 22, numVeh: 11 },
  { id: 'a02', name: 'Deadlock', difficulty: 'advanced', targetMin: 18, targetMax: 24, numVeh: 12 },
  { id: 'a03', name: 'Snarl', difficulty: 'advanced', targetMin: 19, targetMax: 26, numVeh: 12 },
  { id: 'a04', name: 'Standstill', difficulty: 'advanced', targetMin: 20, targetMax: 28, numVeh: 12 },
  { id: 'a05', name: 'Impasse', difficulty: 'advanced', targetMin: 21, targetMax: 30, numVeh: 12 },
  { id: 'a06', name: 'Quagmire', difficulty: 'advanced', targetMin: 22, targetMax: 32, numVeh: 13 },
  { id: 'a07', name: 'Entangled', difficulty: 'advanced', targetMin: 23, targetMax: 34, numVeh: 13 },
  { id: 'a08', name: 'Stalemate', difficulty: 'advanced', targetMin: 24, targetMax: 35, numVeh: 13 },
  { id: 'a09', name: 'Labyrinth', difficulty: 'advanced', targetMin: 25, targetMax: 36, numVeh: 13 },
  { id: 'a10', name: 'Conundrum', difficulty: 'advanced', targetMin: 26, targetMax: 38, numVeh: 13 },

  { id: 'e01', name: 'Nightmare', difficulty: 'expert', targetMin: 27, targetMax: 40, numVeh: 13 },
  { id: 'e02', name: 'Impossible', difficulty: 'expert', targetMin: 28, targetMax: 42, numVeh: 13 },
  { id: 'e03', name: 'Chaos', difficulty: 'expert', targetMin: 29, targetMax: 44, numVeh: 13 },
  { id: 'e04', name: 'Inferno', difficulty: 'expert', targetMin: 30, targetMax: 46, numVeh: 13 },
  { id: 'e05', name: 'Armageddon', difficulty: 'expert', targetMin: 31, targetMax: 48, numVeh: 13 },
  { id: 'e06', name: 'Catastrophe', difficulty: 'expert', targetMin: 32, targetMax: 50, numVeh: 13 },
  { id: 'e07', name: 'Apocalypse', difficulty: 'expert', targetMin: 33, targetMax: 52, numVeh: 13 },
  { id: 'e08', name: 'Oblivion', difficulty: 'expert', targetMin: 34, targetMax: 54, numVeh: 13 },
  { id: 'e09', name: 'Cataclysm', difficulty: 'expert', targetMin: 35, targetMax: 56, numVeh: 13 },
  { id: 'e10', name: 'Grand Master', difficulty: 'expert', targetMin: 36, targetMax: 60, numVeh: 13 },
];

const results: { id: string; name: string; difficulty: string; minMoves: number; vehicles: V[] }[] = [];

for (const spec of specs) {
  process.stdout.write(`${spec.id} "${spec.name}" (${spec.targetMin}-${spec.targetMax} moves, ${spec.numVeh} veh)... `);
  let result = genPuzzle(spec.targetMin, spec.targetMax, spec.numVeh, 50000);

  if (!result) {
    // Try with fewer vehicles
    for (let fewer = 1; fewer <= 4; fewer++) {
      result = genPuzzle(Math.max(1, spec.targetMin - 3), spec.targetMax, Math.max(2, spec.numVeh - fewer), 50000);
      if (result) break;
    }
  }

  if (result) {
    console.log(`✓ ${result.minMoves} moves, ${result.vehicles.length} veh`);
    results.push({ id: spec.id, name: spec.name, difficulty: spec.difficulty, minMoves: result.minMoves, vehicles: result.vehicles });
  } else {
    console.log(`✗ FAILED`);
  }
}

// Output TypeScript
console.log('\n// ---- Generated Puzzles ----\n');
for (const p of results) {
  console.log(`  {`);
  console.log(`    id: '${p.id}', name: '${p.name}', difficulty: '${p.difficulty}', minMoves: ${p.minMoves},`);
  console.log(`    vehicles: [`);
  for (const v of p.vehicles) {
    const ci = v.isTarget ? 0 : COLORS.indexOf(v.isTarget ? COLORS[0]! : '') === -1 ? 0 : 0;
    console.log(`      v('${v.id}', '${v.type}', '${v.orientation}', ${v.row}, ${v.col}, VEHICLE_COLORS[${v.isTarget ? 0 : (COLORS.indexOf(v.isTarget ? '' : '') + 1) || (p.vehicles.indexOf(v))}]!${v.isTarget ? ', true' : ''}),`);
  }
  console.log(`    ],`);
  console.log(`  },`);
}
