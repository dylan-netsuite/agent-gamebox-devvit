import { PIECE_DEFINITIONS, getPieceById } from './pieces';
import type { BlokusMove } from '../types/multiplayer';

export const BOARD_SIZE = 14;

export const START_POSITIONS: [number, number][] = [
  [4, 4],
  [9, 9],
];

export type CellState = 0 | 1 | 2;

export class BoardValidator {
  grid: CellState[][];
  private placedPieceIds: Map<number, Set<string>> = new Map();
  private remainingPieces: Map<number, Set<string>> = new Map();
  private moveHistory: BlokusMove[] = [];
  private currentTurn: 1 | 2 = 1;
  private passCount: [boolean, boolean] = [false, false];

  constructor() {
    this.grid = Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, (): CellState => 0),
    );
    this.placedPieceIds.set(1, new Set());
    this.placedPieceIds.set(2, new Set());
    this.remainingPieces.set(1, new Set(PIECE_DEFINITIONS.map((p) => p.id)));
    this.remainingPieces.set(2, new Set(PIECE_DEFINITIONS.map((p) => p.id)));
  }

  get turn(): 1 | 2 {
    return this.currentTurn;
  }

  get moves(): BlokusMove[] {
    return [...this.moveHistory];
  }

  isFirstMove(player: 1 | 2): boolean {
    return (this.placedPieceIds.get(player)?.size ?? 0) === 0;
  }

  isValidPlacement(cells: [number, number][], player: 1 | 2): boolean {
    for (const [r, c] of cells) {
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
      if (this.grid[r]![c] !== 0) return false;
    }

    const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));

    for (const [r, c] of cells) {
      const edges: [number, number][] = [
        [r - 1, c],
        [r + 1, c],
        [r, c - 1],
        [r, c + 1],
      ];
      for (const [er, ec] of edges) {
        if (cellSet.has(`${er},${ec}`)) continue;
        if (er >= 0 && er < BOARD_SIZE && ec >= 0 && ec < BOARD_SIZE) {
          if (this.grid[er]![ec] === player) return false;
        }
      }
    }

    if (this.isFirstMove(player)) {
      const start = START_POSITIONS[player - 1]!;
      return cells.some(([r, c]) => r === start[0] && c === start[1]);
    }

    let hasDiagonalTouch = false;
    for (const [r, c] of cells) {
      const diags: [number, number][] = [
        [r - 1, c - 1],
        [r - 1, c + 1],
        [r + 1, c - 1],
        [r + 1, c + 1],
      ];
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

  validateMove(move: BlokusMove): { valid: boolean; reason?: string } {
    if (move.player !== this.currentTurn) {
      return { valid: false, reason: `Not player ${move.player}'s turn (current: ${this.currentTurn})` };
    }

    const piece = getPieceById(move.pieceId);
    if (!piece) {
      return { valid: false, reason: `Unknown piece: ${move.pieceId}` };
    }

    const remaining = this.remainingPieces.get(move.player);
    if (!remaining?.has(move.pieceId)) {
      return { valid: false, reason: `Piece ${move.pieceId} already used by player ${move.player}` };
    }

    if (move.cells.length !== piece.size) {
      return { valid: false, reason: `Cell count mismatch: got ${move.cells.length}, expected ${piece.size}` };
    }

    if (!this.isValidPlacement(move.cells, move.player)) {
      return { valid: false, reason: 'Invalid placement (violates Blokus rules)' };
    }

    return { valid: true };
  }

  applyMove(move: BlokusMove): void {
    for (const [r, c] of move.cells) {
      this.grid[r]![c] = move.player;
    }
    this.placedPieceIds.get(move.player)!.add(move.pieceId);
    this.remainingPieces.get(move.player)!.delete(move.pieceId);
    this.moveHistory.push(move);
    this.passCount[move.player - 1] = false;
    this.currentTurn = move.player === 1 ? 2 : 1;
  }

  applyPass(player: 1 | 2): { valid: boolean; reason?: string } {
    if (player !== this.currentTurn) {
      return { valid: false, reason: `Not player ${player}'s turn` };
    }
    this.passCount[player - 1] = true;
    this.currentTurn = player === 1 ? 2 : 1;
    return { valid: true };
  }

  isGameOver(): boolean {
    return this.passCount[0] && this.passCount[1];
  }

  calculateScore(player: 1 | 2): number {
    const remaining = this.remainingPieces.get(player);
    if (!remaining) return 0;

    if (remaining.size === 0) {
      const lastMove = [...this.moveHistory].reverse().find((m) => m.player === player);
      let bonus = 15;
      if (lastMove?.pieceId === 'O1') bonus += 5;
      return bonus;
    }

    let unplacedSquares = 0;
    for (const pieceId of remaining) {
      const piece = getPieceById(pieceId);
      if (piece) unplacedSquares += piece.size;
    }
    return -unplacedSquares;
  }

  serialize(): string {
    return JSON.stringify(this.moveHistory);
  }

  static deserialize(data: string): BoardValidator {
    const moves = JSON.parse(data) as BlokusMove[];
    const board = new BoardValidator();
    for (const move of moves) {
      board.applyMove(move);
    }
    return board;
  }
}
