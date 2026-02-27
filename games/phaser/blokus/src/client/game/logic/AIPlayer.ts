import type { BoardLogic, ValidMove } from './BoardLogic';
import { BOARD_SIZE } from './BoardLogic';

export class AIPlayer {
  private difficulty: 'easy' | 'medium' | 'hard';

  constructor(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.difficulty = difficulty;
  }

  chooseMove(board: BoardLogic, player: 1 | 2): ValidMove | null {
    const moves = board.getAllValidMoves(player);
    if (moves.length === 0) return null;

    if (this.difficulty === 'easy') {
      return moves[Math.floor(Math.random() * moves.length)]!;
    }

    const scored = moves.map((move) => ({
      move,
      score: this.scoreMove(move, board),
    }));

    scored.sort((a, b) => b.score - a.score);

    // Pick from top candidates with some randomness
    const topCount = this.difficulty === 'hard' ? 3 : 5;
    const candidates = scored.slice(0, Math.min(topCount, scored.length));
    return candidates[Math.floor(Math.random() * candidates.length)]!.move;
  }

  private scoreMove(move: ValidMove, board: BoardLogic): number {
    let score = 0;

    // Prefer larger pieces (place big pieces early)
    score += move.cells.length * 10;

    // Prefer moves that create more corner opportunities
    const newCorners = this.countNewCorners(move, board);
    score += newCorners * 5;

    // Prefer moves toward the center of the board
    const center = BOARD_SIZE / 2;
    const avgRow = move.cells.reduce((s, [r]) => s + r, 0) / move.cells.length;
    const avgCol = move.cells.reduce((s, [, c]) => s + c, 0) / move.cells.length;
    const distFromCenter = Math.sqrt((avgRow - center) ** 2 + (avgCol - center) ** 2);
    score -= distFromCenter * 2;

    // Penalize moves that block own future corners
    score -= this.countBlockedOwnCorners(move, board) * 3;

    return score;
  }

  private countNewCorners(move: ValidMove, board: BoardLogic): number {
    const cellSet = new Set(move.cells.map(([r, c]) => `${r},${c}`));
    let corners = 0;

    for (const [r, c] of move.cells) {
      const diags: [number, number][] = [[r - 1, c - 1], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c + 1]];
      for (const [dr, dc] of diags) {
        if (dr < 0 || dr >= BOARD_SIZE || dc < 0 || dc >= BOARD_SIZE) continue;
        if (board.getCell(dr, dc) !== 0) continue;
        if (cellSet.has(`${dr},${dc}`)) continue;

        // Check that this diagonal isn't edge-adjacent to any of our cells
        const edges: [number, number][] = [[dr - 1, dc], [dr + 1, dc], [dr, dc - 1], [dr, dc + 1]];
        let blocked = false;
        for (const [er, ec] of edges) {
          if (cellSet.has(`${er},${ec}`)) { blocked = true; break; }
          if (er >= 0 && er < BOARD_SIZE && ec >= 0 && ec < BOARD_SIZE) {
            if (board.getCell(er, ec) === 2) { blocked = true; break; }
          }
        }
        if (!blocked) corners++;
      }
    }

    return corners;
  }

  private countBlockedOwnCorners(move: ValidMove, _board: BoardLogic): number {
    const cellSet = new Set(move.cells.map(([r, c]) => `${r},${c}`));
    let blocked = 0;

    for (const [r, c] of move.cells) {
      const edges: [number, number][] = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
      for (const [er, ec] of edges) {
        if (er < 0 || er >= BOARD_SIZE || ec < 0 || ec >= BOARD_SIZE) continue;
        if (cellSet.has(`${er},${ec}`)) continue;
        // Would block a corner if there's already a same-color diagonal here
        const diags: [number, number][] = [[er - 1, ec - 1], [er - 1, ec + 1], [er + 1, ec - 1], [er + 1, ec + 1]];
        for (const [dr, dc] of diags) {
          if (cellSet.has(`${dr},${dc}`)) { blocked++; break; }
        }
      }
    }

    return blocked;
  }
}
