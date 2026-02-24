export interface PieceDefinition {
  id: string;
  name: string;
  cells: [number, number][];
  size: number;
}

// All 21 free polyominoes (monomino through pentominoes).
// Each cell is [row, col] offset from origin.
export const PIECE_DEFINITIONS: PieceDefinition[] = [
  // 1-square
  { id: 'O1', name: 'Monomino', size: 1, cells: [[0, 0]] },

  // 2-square
  { id: 'I2', name: 'Domino', size: 2, cells: [[0, 0], [0, 1]] },

  // 3-square (trominoes)
  { id: 'I3', name: 'Tromino I', size: 3, cells: [[0, 0], [0, 1], [0, 2]] },
  { id: 'L3', name: 'Tromino L', size: 3, cells: [[0, 0], [1, 0], [1, 1]] },

  // 4-square (tetrominoes)
  { id: 'I4', name: 'Tetromino I', size: 4, cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
  { id: 'O4', name: 'Tetromino O', size: 4, cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  { id: 'T4', name: 'Tetromino T', size: 4, cells: [[0, 0], [0, 1], [0, 2], [1, 1]] },
  { id: 'S4', name: 'Tetromino S', size: 4, cells: [[0, 1], [0, 2], [1, 0], [1, 1]] },
  { id: 'L4', name: 'Tetromino L', size: 4, cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },

  // 5-square (pentominoes)
  { id: 'F5', name: 'F', size: 5, cells: [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]] },
  { id: 'I5', name: 'I', size: 5, cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
  { id: 'L5', name: 'L', size: 5, cells: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]] },
  { id: 'N5', name: 'N', size: 5, cells: [[0, 0], [0, 1], [1, 1], [1, 2], [1, 3]] },
  { id: 'P5', name: 'P', size: 5, cells: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]] },
  { id: 'T5', name: 'T', size: 5, cells: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1]] },
  { id: 'U5', name: 'U', size: 5, cells: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]] },
  { id: 'V5', name: 'V', size: 5, cells: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]] },
  { id: 'W5', name: 'W', size: 5, cells: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]] },
  { id: 'X5', name: 'X', size: 5, cells: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]] },
  { id: 'Y5', name: 'Y', size: 5, cells: [[0, 0], [1, 0], [1, 1], [2, 0], [3, 0]] },
  { id: 'Z5', name: 'Z', size: 5, cells: [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2]] },
];

export function rotateCells(cells: [number, number][]): [number, number][] {
  const rotated = cells.map(([r, c]): [number, number] => [c, -r]);
  const minR = Math.min(...rotated.map(([r]) => r));
  const minC = Math.min(...rotated.map(([, c]) => c));
  return rotated.map(([r, c]): [number, number] => [r - minR, c - minC]);
}

export function flipCells(cells: [number, number][]): [number, number][] {
  const flipped = cells.map(([r, c]): [number, number] => [r, -c]);
  const minC = Math.min(...flipped.map(([, c]) => c));
  return flipped.map(([r, c]): [number, number] => [r, c - minC]);
}

export function normalizeCells(cells: [number, number][]): [number, number][] {
  const minR = Math.min(...cells.map(([r]) => r));
  const minC = Math.min(...cells.map(([, c]) => c));
  const normalized = cells.map(([r, c]): [number, number] => [r - minR, c - minC]);
  normalized.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return normalized;
}

export function getTransformedCells(
  cells: [number, number][],
  rotation: number,
  flipped: boolean
): [number, number][] {
  let result = [...cells.map(([r, c]): [number, number] => [r, c])];
  if (flipped) result = flipCells(result);
  for (let i = 0; i < rotation; i++) {
    result = rotateCells(result);
  }
  return normalizeCells(result);
}

export function totalSquares(): number {
  return PIECE_DEFINITIONS.reduce((sum, p) => sum + p.size, 0);
}
