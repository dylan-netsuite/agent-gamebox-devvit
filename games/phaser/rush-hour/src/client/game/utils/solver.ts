import type { Vehicle } from '../../../shared/types/api';

const GRID_SIZE = 6;
const EXIT_ROW = 2;

interface State {
  vehicles: { row: number; col: number }[];
  moves: number;
  parent: State | null;
}

function encodeState(positions: { row: number; col: number }[]): string {
  return positions.map((p) => `${p.row},${p.col}`).join('|');
}

function isOccupied(
  grid: boolean[][],
  row: number,
  col: number
): boolean {
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return true;
  return grid[row]![col]!;
}

function buildGrid(
  vehicles: Vehicle[],
  positions: { row: number; col: number }[]
): boolean[][] {
  const grid: boolean[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => false)
  );

  for (let i = 0; i < vehicles.length; i++) {
    const veh = vehicles[i]!;
    const pos = positions[i]!;
    const len = veh.type === 'truck' ? 3 : 2;

    for (let j = 0; j < len; j++) {
      const r = veh.orientation === 'v' ? pos.row + j : pos.row;
      const c = veh.orientation === 'h' ? pos.col + j : pos.col;
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        grid[r]![c] = true;
      }
    }
  }

  return grid;
}

function isWon(
  vehicles: Vehicle[],
  positions: { row: number; col: number }[]
): boolean {
  for (let i = 0; i < vehicles.length; i++) {
    if (vehicles[i]!.isTarget) {
      return positions[i]!.row === EXIT_ROW && positions[i]!.col === GRID_SIZE - 2;
    }
  }
  return false;
}

export interface SolveResult {
  solvable: boolean;
  minMoves: number;
}

export function solve(vehicles: Vehicle[], maxDepth = 200): SolveResult {
  const initialPositions = vehicles.map((v) => ({ row: v.row, col: v.col }));

  if (isWon(vehicles, initialPositions)) {
    return { solvable: true, minMoves: 0 };
  }

  const visited = new Set<string>();
  const queue: State[] = [{ vehicles: initialPositions, moves: 0, parent: null }];
  visited.add(encodeState(initialPositions));

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.moves >= maxDepth) continue;

    const grid = buildGrid(vehicles, current.vehicles);

    for (let i = 0; i < vehicles.length; i++) {
      const veh = vehicles[i]!;
      const pos = current.vehicles[i]!;
      const len = veh.type === 'truck' ? 3 : 2;

      if (veh.orientation === 'h') {
        for (const delta of [-1, 1]) {
          let step = delta;
          while (true) {
            const newCol = pos.col + step;
            const checkCol = delta === -1 ? newCol : newCol + len - 1;
            if (checkCol < 0 || checkCol >= GRID_SIZE) break;
            if (isOccupied(grid, pos.row, checkCol)) break;

            const newPositions = current.vehicles.map((p, idx) =>
              idx === i ? { row: p.row, col: newCol } : { ...p }
            );
            const key = encodeState(newPositions);

            if (!visited.has(key)) {
              visited.add(key);
              const newState: State = {
                vehicles: newPositions,
                moves: current.moves + 1,
                parent: current,
              };

              if (isWon(vehicles, newPositions)) {
                return { solvable: true, minMoves: newState.moves };
              }

              queue.push(newState);
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
            if (isOccupied(grid, checkRow, pos.col)) break;

            const newPositions = current.vehicles.map((p, idx) =>
              idx === i ? { row: newRow, col: p.col } : { ...p }
            );
            const key = encodeState(newPositions);

            if (!visited.has(key)) {
              visited.add(key);
              const newState: State = {
                vehicles: newPositions,
                moves: current.moves + 1,
                parent: current,
              };

              if (isWon(vehicles, newPositions)) {
                return { solvable: true, minMoves: newState.moves };
              }

              queue.push(newState);
            }

            step += delta;
          }
        }
      }
    }
  }

  return { solvable: false, minMoves: -1 };
}

export function validatePuzzle(vehicles: Vehicle[]): { valid: boolean; error?: string } {
  const targetCars = vehicles.filter((v) => v.isTarget);
  if (targetCars.length !== 1) {
    return { valid: false, error: 'Must have exactly one target (red) car' };
  }

  const target = targetCars[0]!;
  if (target.orientation !== 'h' || target.row !== EXIT_ROW) {
    return { valid: false, error: 'Target car must be horizontal on row 2' };
  }

  if (target.type !== 'car') {
    return { valid: false, error: 'Target must be a car (length 2)' };
  }

  const grid: boolean[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => false)
  );

  for (const veh of vehicles) {
    const len = veh.type === 'truck' ? 3 : 2;
    for (let j = 0; j < len; j++) {
      const r = veh.orientation === 'v' ? veh.row + j : veh.row;
      const c = veh.orientation === 'h' ? veh.col + j : veh.col;
      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) {
        return { valid: false, error: `Vehicle ${veh.id} is out of bounds` };
      }
      if (grid[r]![c]) {
        return { valid: false, error: `Vehicle ${veh.id} overlaps with another vehicle` };
      }
      grid[r]![c] = true;
    }
  }

  return { valid: true };
}
