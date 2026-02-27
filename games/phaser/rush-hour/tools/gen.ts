/**
 * Simulated Annealing puzzle generator for Rush Hour.
 *
 * Instead of randomly placing vehicles and hoping for a hard puzzle,
 * this uses simulated annealing to iteratively mutate a board configuration
 * and maximize the BFS move count.
 *
 * Run: cd games/phaser/rush-hour && npx tsx tools/gen.ts [targetMoves] [iterations]
 *
 * Example: npx tsx tools/gen.ts 30 10000
 */

const GRID_SIZE = 6;
const EXIT_ROW = 2;

type O = 'h' | 'v';
type T = 'car' | 'truck';

interface V {
  id: string;
  type: T;
  orientation: O;
  row: number;
  col: number;
  isTarget: boolean;
}

const COLORS = [
  '#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261',
  '#6a4c93', '#48bfe3', '#06d6a0', '#ef476f', '#ffd166',
  '#118ab2', '#073b4c', '#8338ec', '#ff006e', '#fb5607', '#3a86ff',
];

function encodeState(p: { row: number; col: number }[]): string {
  return p.map(x => `${x.row},${x.col}`).join('|');
}

function solveBFS(vehicles: V[], maxDepth = 200): number {
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

function buildGrid(vehicles: V[]): boolean[][] {
  const grid: boolean[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false) as boolean[]);
  for (const v of vehicles) {
    const len = v.type === 'truck' ? 3 : 2;
    for (let j = 0; j < len; j++) {
      const r = v.orientation === 'v' ? v.row + j : v.row;
      const c = v.orientation === 'h' ? v.col + j : v.col;
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) grid[r]![c] = true;
    }
  }
  return grid;
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

function placeOnGrid(grid: boolean[][], type: T, orientation: O, row: number, col: number): void {
  const len = type === 'truck' ? 3 : 2;
  for (let j = 0; j < len; j++) {
    const r = orientation === 'v' ? row + j : row;
    const c = orientation === 'h' ? col + j : col;
    grid[r]![c] = true;
  }
}

function removeFromGrid(grid: boolean[][], type: T, orientation: O, row: number, col: number): void {
  const len = type === 'truck' ? 3 : 2;
  for (let j = 0; j < len; j++) {
    const r = orientation === 'v' ? row + j : row;
    const c = orientation === 'h' ? col + j : col;
    grid[r]![c] = false;
  }
}

function randomSeed(numVehicles: number): V[] {
  const grid: boolean[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false) as boolean[]);
  const tc = Math.floor(Math.random() * 3);
  const target: V = { id: 'X', type: 'car', orientation: 'h', row: EXIT_ROW, col: tc, isTarget: true };
  placeOnGrid(grid, 'car', 'h', EXIT_ROW, tc);
  const vehs: V[] = [target];

  for (let v = 0; v < numVehicles - 1; v++) {
    let placed = false;
    for (let t = 0; t < 200; t++) {
      const type: T = Math.random() < 0.25 ? 'truck' : 'car';
      const orientation: O = Math.random() < 0.5 ? 'h' : 'v';
      // No horizontal vehicles on the exit row (row 2) other than target
      if (orientation === 'h') {
        const maxC = GRID_SIZE - (type === 'truck' ? 3 : 2);
        const r = (() => { let rr; do { rr = Math.floor(Math.random() * GRID_SIZE); } while (rr === EXIT_ROW); return rr; })();
        const c = Math.floor(Math.random() * (maxC + 1));
        if (canPlace(grid, type, orientation, r, c)) {
          vehs.push({ id: String.fromCharCode(65 + v), type, orientation, row: r, col: c, isTarget: false });
          placeOnGrid(grid, type, orientation, r, c);
          placed = true;
          break;
        }
      } else {
        const maxR = GRID_SIZE - (type === 'truck' ? 3 : 2);
        const r = Math.floor(Math.random() * (maxR + 1));
        const c = Math.floor(Math.random() * GRID_SIZE);
        if (canPlace(grid, type, orientation, r, c)) {
          vehs.push({ id: String.fromCharCode(65 + v), type, orientation, row: r, col: c, isTarget: false });
          placeOnGrid(grid, type, orientation, r, c);
          placed = true;
          break;
        }
      }
    }
    if (!placed) break;
  }
  return vehs;
}

function cloneVehicles(vehicles: V[]): V[] {
  return vehicles.map(v => ({ ...v }));
}

/**
 * Mutate the board by applying one random change:
 * 1. Slide a random non-target vehicle by 1 cell
 * 2. Remove a non-target vehicle and place a new one randomly
 * 3. Change a non-target vehicle's type (car <-> truck)
 */
function mutate(vehicles: V[]): V[] | null {
  const result = cloneVehicles(vehicles);
  const nonTarget = result.filter(v => !v.isTarget);
  if (nonTarget.length === 0) return null;

  const mutation = Math.random();

  if (mutation < 0.5) {
    // Slide a random vehicle by 1 cell
    const veh = nonTarget[Math.floor(Math.random() * nonTarget.length)]!;
    const grid = buildGrid(result);
    removeFromGrid(grid, veh.type, veh.orientation, veh.row, veh.col);

    const deltas = veh.orientation === 'h' ? [{ dr: 0, dc: -1 }, { dr: 0, dc: 1 }] : [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }];
    const shuffled = deltas.sort(() => Math.random() - 0.5);

    for (const { dr, dc } of shuffled) {
      const nr = veh.row + dr;
      const nc = veh.col + dc;
      if (canPlace(grid, veh.type, veh.orientation, nr, nc)) {
        veh.row = nr;
        veh.col = nc;
        return result;
      }
    }
    return null;
  } else if (mutation < 0.8) {
    // Remove a vehicle and place a new one randomly
    const idx = result.indexOf(nonTarget[Math.floor(Math.random() * nonTarget.length)]!);
    result.splice(idx, 1);

    const grid = buildGrid(result);
    for (let t = 0; t < 100; t++) {
      const type: T = Math.random() < 0.25 ? 'truck' : 'car';
      const orientation: O = Math.random() < 0.5 ? 'h' : 'v';
      let r: number, c: number;
      if (orientation === 'h') {
        do { r = Math.floor(Math.random() * GRID_SIZE); } while (r === EXIT_ROW);
        c = Math.floor(Math.random() * (GRID_SIZE - (type === 'truck' ? 3 : 2) + 1));
      } else {
        r = Math.floor(Math.random() * (GRID_SIZE - (type === 'truck' ? 3 : 2) + 1));
        c = Math.floor(Math.random() * GRID_SIZE);
      }
      if (canPlace(grid, type, orientation, r, c)) {
        result.push({ id: String.fromCharCode(65 + result.length), type, orientation, row: r, col: c, isTarget: false });
        return result;
      }
    }
    return null;
  } else {
    // Toggle car <-> truck for a random vehicle
    const veh = nonTarget[Math.floor(Math.random() * nonTarget.length)]!;
    const grid = buildGrid(result);
    removeFromGrid(grid, veh.type, veh.orientation, veh.row, veh.col);

    const newType: T = veh.type === 'car' ? 'truck' : 'car';
    if (canPlace(grid, newType, veh.orientation, veh.row, veh.col)) {
      veh.type = newType;
      return result;
    }
    return null;
  }
}

function anneal(targetMoves: number, iterations: number, numVehicles: number): { vehicles: V[]; moves: number } {
  let best = randomSeed(numVehicles);
  let bestMoves = solveBFS(best);
  if (bestMoves === -1) bestMoves = 0;

  let current = cloneVehicles(best);
  let currentMoves = bestMoves;

  const T_INITIAL = 10.0;
  const T_MIN = 0.01;
  const coolingRate = Math.pow(T_MIN / T_INITIAL, 1 / iterations);

  let temperature = T_INITIAL;
  let stagnant = 0;

  for (let i = 0; i < iterations; i++) {
    const candidate = mutate(current);
    if (!candidate) {
      temperature *= coolingRate;
      continue;
    }

    const candidateMoves = solveBFS(candidate);
    if (candidateMoves === -1) {
      temperature *= coolingRate;
      continue;
    }

    const delta = candidateMoves - currentMoves;

    if (delta > 0 || Math.random() < Math.exp(delta / temperature)) {
      current = candidate;
      currentMoves = candidateMoves;

      if (currentMoves > bestMoves) {
        best = cloneVehicles(current);
        bestMoves = currentMoves;
        stagnant = 0;
        process.stdout.write(`\r  [${i}/${iterations}] Best: ${bestMoves} moves (target: ${targetMoves})  `);
      }
    }

    temperature *= coolingRate;
    stagnant++;

    // Restart from a new random seed if stuck for too long
    if (stagnant > iterations / 5) {
      current = randomSeed(numVehicles);
      currentMoves = solveBFS(current);
      if (currentMoves === -1) currentMoves = 0;
      stagnant = 0;
      temperature = T_INITIAL * 0.5;
    }

    if (bestMoves >= targetMoves) break;
  }

  return { vehicles: best, moves: bestMoves };
}

// --- Main ---

const targetMoves = parseInt(process.argv[2] ?? '25', 10);
const iterations = parseInt(process.argv[3] ?? '5000', 10);
const numVehicles = parseInt(process.argv[4] ?? '12', 10);
const runs = parseInt(process.argv[5] ?? '5', 10);

console.log(`Simulated Annealing Rush Hour Generator`);
console.log(`Target: ${targetMoves} moves, ${iterations} iterations/run, ${numVehicles} vehicles, ${runs} runs\n`);

let globalBest: { vehicles: V[]; moves: number } = { vehicles: [], moves: 0 };

for (let r = 0; r < runs; r++) {
  console.log(`Run ${r + 1}/${runs}:`);
  const result = anneal(targetMoves, iterations, numVehicles);
  console.log(`\n  Result: ${result.moves} moves, ${result.vehicles.length} vehicles`);

  if (result.moves > globalBest.moves) {
    globalBest = result;
  }

  if (globalBest.moves >= targetMoves) break;
}

console.log(`\nBest overall: ${globalBest.moves} moves, ${globalBest.vehicles.length} vehicles\n`);

// Output TypeScript
let colorIdx = 1;
console.log(`  {`);
console.log(`    id: 'gen01', name: 'Generated', difficulty: 'TODO', minMoves: ${globalBest.moves},`);
console.log(`    vehicles: [`);
for (const v of globalBest.vehicles) {
  const ci = v.isTarget ? 0 : colorIdx++ % COLORS.length;
  console.log(`      v('${v.id}', '${v.type}', '${v.orientation}', ${v.row}, ${v.col}, VEHICLE_COLORS[${ci}]!${v.isTarget ? ', true' : ''}),`);
}
console.log(`    ],`);
console.log(`  },`);
