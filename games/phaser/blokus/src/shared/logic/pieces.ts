export interface PieceDefinition {
  id: string;
  name: string;
  cells: [number, number][];
  size: number;
}

export const PIECE_DEFINITIONS: PieceDefinition[] = [
  { id: 'O1', name: 'Monomino', size: 1, cells: [[0, 0]] },
  { id: 'I2', name: 'Domino', size: 2, cells: [[0, 0], [0, 1]] },
  { id: 'I3', name: 'Tromino I', size: 3, cells: [[0, 0], [0, 1], [0, 2]] },
  { id: 'L3', name: 'Tromino L', size: 3, cells: [[0, 0], [1, 0], [1, 1]] },
  { id: 'I4', name: 'Tetromino I', size: 4, cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
  { id: 'O4', name: 'Tetromino O', size: 4, cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  { id: 'T4', name: 'Tetromino T', size: 4, cells: [[0, 0], [0, 1], [0, 2], [1, 1]] },
  { id: 'S4', name: 'Tetromino S', size: 4, cells: [[0, 1], [0, 2], [1, 0], [1, 1]] },
  { id: 'L4', name: 'Tetromino L', size: 4, cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
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

const PIECE_MAP = new Map(PIECE_DEFINITIONS.map((p) => [p.id, p]));

export function getPieceById(id: string): PieceDefinition | undefined {
  return PIECE_MAP.get(id);
}
