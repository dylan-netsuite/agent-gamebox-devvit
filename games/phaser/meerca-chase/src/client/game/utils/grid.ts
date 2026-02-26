export const GRID_COLS = 20;
export const GRID_ROWS = 15;

export interface GridPos {
  col: number;
  row: number;
}

export function gridToPixel(
  col: number,
  row: number,
  cellSize: number,
  offsetX: number,
  offsetY: number
): { x: number; y: number } {
  return {
    x: offsetX + col * cellSize + cellSize / 2,
    y: offsetY + row * cellSize + cellSize / 2,
  };
}

export function samePos(a: GridPos, b: GridPos): boolean {
  return a.col === b.col && a.row === b.row;
}

export function isInBounds(pos: GridPos): boolean {
  return pos.col >= 0 && pos.col < GRID_COLS && pos.row >= 0 && pos.row < GRID_ROWS;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export const DIR_VECTORS: Record<Direction, GridPos> = {
  up: { col: 0, row: -1 },
  down: { col: 0, row: 1 },
  left: { col: -1, row: 0 },
  right: { col: 1, row: 0 },
};

export function oppositeDir(dir: Direction): Direction {
  const map: Record<Direction, Direction> = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
  };
  return map[dir];
}
