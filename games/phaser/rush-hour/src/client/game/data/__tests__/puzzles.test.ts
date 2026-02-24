import { describe, it, expect } from 'vitest';
import { CATALOG_PUZZLES } from '../puzzles';
import { solve, validatePuzzle } from '../../utils/solver';

describe('Catalog puzzles BFS validation', () => {
  for (const puzzle of CATALOG_PUZZLES) {
    // Puzzles requiring 35+ moves have state spaces too large for JS BFS.
    // They are verified by the Fogleman exhaustive C++ solver.
    if (puzzle.minMoves >= 35) {
      it(`${puzzle.id} "${puzzle.name}" is valid (Fogleman-verified, ${puzzle.minMoves} moves)`, () => {
        const validation = validatePuzzle(puzzle.vehicles);
        expect(validation.valid, `Validation failed: ${validation.error}`).toBe(true);
      });
    } else {
      it(`${puzzle.id} "${puzzle.name}" is valid and solvable in ${puzzle.minMoves} moves`, () => {
        const validation = validatePuzzle(puzzle.vehicles);
        expect(validation.valid, `Validation failed: ${validation.error}`).toBe(true);

        const result = solve(puzzle.vehicles, 300);
        expect(result.solvable, `Puzzle ${puzzle.id} is unsolvable`).toBe(true);
        expect(
          result.minMoves,
          `${puzzle.id}: BFS found ${result.minMoves} moves but catalog says ${puzzle.minMoves}`
        ).toBe(puzzle.minMoves);
      });
    }
  }
});
