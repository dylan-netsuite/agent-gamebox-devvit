export type { PieceDefinition } from '../../../shared/logic/pieces';
export { PIECE_DEFINITIONS } from '../../../shared/logic/pieces';

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
