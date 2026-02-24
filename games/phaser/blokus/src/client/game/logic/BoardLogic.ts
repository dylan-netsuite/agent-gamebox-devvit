import { PIECE_DEFINITIONS, getTransformedCells } from '../data/pieces';

export const BOARD_SIZE = 14;

// Blokus Duo starting positions (near center)
export const START_POSITIONS: [number, number][] = [
  [4, 4],
  [9, 9],
];

export const PLAYER_COLORS = [0x4a90d9, 0xe8913a] as const;
export const PLAYER_COLOR_NAMES = ['Blue', 'Orange'] as const;

export type CellState = 0 | 1 | 2; // 0=empty, 1=player1, 2=player2

export interface PlacedPiece {
  pieceId: string;
  player: 1 | 2;
  cells: [number, number][];
}

export interface ValidMove {
  pieceId: string;
  rotation: number;
  flipped: boolean;
  anchorRow: number;
  anchorCol: number;
  cells: [number, number][];
}

export class BoardLogic {
  grid: CellState[][];
  placedPieces: PlacedPiece[] = [];
  remainingPieces: Map<number, Set<string>> = new Map();
  lastPiecePlaced: Map<number, string> = new Map();

  constructor() {
    this.grid = Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, (): CellState => 0)
    );
    this.remainingPieces.set(1, new Set(PIECE_DEFINITIONS.map((p) => p.id)));
    this.remainingPieces.set(2, new Set(PIECE_DEFINITIONS.map((p) => p.id)));
  }

  getCell(row: number, col: number): CellState {
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return 0;
    return this.grid[row]![col]!;
  }

  isFirstMove(player: 1 | 2): boolean {
    return this.placedPieces.filter((p) => p.player === player).length === 0;
  }

  isValidPlacement(
    cells: [number, number][],
    player: 1 | 2
  ): boolean {
    // All cells must be on the board and empty
    for (const [r, c] of cells) {
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
      if (this.grid[r]![c] !== 0) return false;
    }

    const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));

    // No edge adjacency with same color
    for (const [r, c] of cells) {
      const edges: [number, number][] = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
      for (const [er, ec] of edges) {
        if (cellSet.has(`${er},${ec}`)) continue; // same piece
        if (er >= 0 && er < BOARD_SIZE && ec >= 0 && ec < BOARD_SIZE) {
          if (this.grid[er]![ec] === player) return false;
        }
      }
    }

    if (this.isFirstMove(player)) {
      // Must cover the starting position
      const start = START_POSITIONS[player - 1]!;
      const coversStart = cells.some(([r, c]) => r === start[0] && c === start[1]);
      return coversStart;
    }

    // Must touch at least one same-color piece diagonally
    let hasDiagonalTouch = false;
    for (const [r, c] of cells) {
      const diags: [number, number][] = [[r - 1, c - 1], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c + 1]];
      for (const [dr, dc] of diags) {
        if (cellSet.has(`${dr},${dc}`)) continue;
        if (dr >= 0 && dr < BOARD_SIZE && dc >= 0 && dc < BOARD_SIZE) {
          if (this.grid[dr]![dc] === player) {
            hasDiagonalTouch = true;
            break;
          }
        }
      }
      if (hasDiagonalTouch) break;
    }

    return hasDiagonalTouch;
  }

  placePiece(pieceId: string, cells: [number, number][], player: 1 | 2): boolean {
    if (!this.isValidPlacement(cells, player)) return false;

    for (const [r, c] of cells) {
      this.grid[r]![c] = player;
    }

    this.placedPieces.push({ pieceId, player, cells });
    this.remainingPieces.get(player)?.delete(pieceId);
    this.lastPiecePlaced.set(player, pieceId);
    return true;
  }

  removePiece(pieceId: string, player: 1 | 2): boolean {
    const idx = this.placedPieces.findIndex(
      (p) => p.pieceId === pieceId && p.player === player,
    );
    if (idx === -1) return false;

    const placed = this.placedPieces[idx]!;
    for (const [r, c] of placed.cells) {
      this.grid[r]![c] = 0;
    }

    this.placedPieces.splice(idx, 1);
    this.remainingPieces.get(player)?.add(pieceId);

    const lastOfPlayer = [...this.placedPieces]
      .reverse()
      .find((p) => p.player === player);
    if (lastOfPlayer) {
      this.lastPiecePlaced.set(player, lastOfPlayer.pieceId);
    } else {
      this.lastPiecePlaced.delete(player);
    }
    return true;
  }

  getCornerPositions(player: 1 | 2): Set<string> {
    const corners = new Set<string>();

    if (this.isFirstMove(player)) {
      const start = START_POSITIONS[player - 1]!;
      corners.add(`${start[0]},${start[1]}`);
      return corners;
    }

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (this.grid[r]![c] !== player) continue;

        const diags: [number, number][] = [[r - 1, c - 1], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c + 1]];
        for (const [dr, dc] of diags) {
          if (dr < 0 || dr >= BOARD_SIZE || dc < 0 || dc >= BOARD_SIZE) continue;
          if (this.grid[dr]![dc] !== 0) continue;

          // Check no edge adjacency
          const edges: [number, number][] = [[dr - 1, dc], [dr + 1, dc], [dr, dc - 1], [dr, dc + 1]];
          let edgeBlocked = false;
          for (const [er, ec] of edges) {
            if (er >= 0 && er < BOARD_SIZE && ec >= 0 && ec < BOARD_SIZE) {
              if (this.grid[er]![ec] === player) {
                edgeBlocked = true;
                break;
              }
            }
          }
          if (!edgeBlocked) {
            corners.add(`${dr},${dc}`);
          }
        }
      }
    }

    return corners;
  }

  getAllValidMoves(player: 1 | 2): ValidMove[] {
    const moves: ValidMove[] = [];
    const remaining = this.remainingPieces.get(player);
    if (!remaining) return moves;

    const cornerPositions = this.getCornerPositions(player);
    if (cornerPositions.size === 0) return moves;

    const seenPlacements = new Set<string>();

    for (const pieceId of remaining) {
      const piece = PIECE_DEFINITIONS.find((p) => p.id === pieceId);
      if (!piece) continue;

      for (let rotation = 0; rotation < 4; rotation++) {
        for (const flipped of [false, true]) {
          const transformedCells = getTransformedCells(piece.cells, rotation, flipped);

          for (const cornerStr of cornerPositions) {
            const [cr, cc] = cornerStr.split(',').map(Number) as [number, number];

            for (const [cellR, cellC] of transformedCells) {
              const anchorRow = cr - cellR;
              const anchorCol = cc - cellC;

              const placedCells = transformedCells.map(
                ([r, c]): [number, number] => [anchorRow + r, anchorCol + c]
              );

              const key = placedCells
                .map(([r, c]) => `${r},${c}`)
                .sort()
                .join('|');

              if (seenPlacements.has(`${pieceId}:${key}`)) continue;

              if (this.isValidPlacement(placedCells, player)) {
                seenPlacements.add(`${pieceId}:${key}`);
                moves.push({
                  pieceId,
                  rotation,
                  flipped,
                  anchorRow,
                  anchorCol,
                  cells: placedCells,
                });
              }
            }
          }
        }
      }
    }

    return moves;
  }

  hasValidMoves(player: 1 | 2): boolean {
    const remaining = this.remainingPieces.get(player);
    if (!remaining || remaining.size === 0) return false;

    const cornerPositions = this.getCornerPositions(player);
    if (cornerPositions.size === 0) return false;

    for (const pieceId of remaining) {
      const piece = PIECE_DEFINITIONS.find((p) => p.id === pieceId);
      if (!piece) continue;

      for (let rotation = 0; rotation < 4; rotation++) {
        for (const flipped of [false, true]) {
          const transformedCells = getTransformedCells(piece.cells, rotation, flipped);

          for (const cornerStr of cornerPositions) {
            const [cr, cc] = cornerStr.split(',').map(Number) as [number, number];

            for (const [cellR, cellC] of transformedCells) {
              const anchorRow = cr - cellR;
              const anchorCol = cc - cellC;

              const placedCells = transformedCells.map(
                ([r, c]): [number, number] => [anchorRow + r, anchorCol + c]
              );

              if (this.isValidPlacement(placedCells, player)) {
                return true;
              }
            }
          }
        }
      }
    }

    return false;
  }

  calculateScore(player: 1 | 2): number {
    const remaining = this.remainingPieces.get(player);
    if (!remaining) return 0;

    if (remaining.size === 0) {
      let bonus = 15;
      if (this.lastPiecePlaced.get(player) === 'O1') bonus += 5;
      return bonus;
    }

    let unplacedSquares = 0;
    for (const pieceId of remaining) {
      const piece = PIECE_DEFINITIONS.find((p) => p.id === pieceId);
      if (piece) unplacedSquares += piece.size;
    }

    return -unplacedSquares;
  }

  isGameOver(): boolean {
    return !this.hasValidMoves(1) && !this.hasValidMoves(2);
  }

  getPiecesPlaced(player: 1 | 2): number {
    return 21 - (this.remainingPieces.get(player)?.size ?? 0);
  }
}
