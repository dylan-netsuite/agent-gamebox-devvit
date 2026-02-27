/**
 * Validates existing puzzles, reports issues, and prints corrected minMoves.
 * Run: cd games/phaser/rush-hour && npx tsx tools/fix-puzzles.ts
 */

import { CATALOG_PUZZLES } from '../src/client/game/data/puzzles';
import { solve, validatePuzzle } from '../src/client/game/utils/solver';

for (const p of CATALOG_PUZZLES) {
  const v = validatePuzzle(p.vehicles);
  if (!v.valid) {
    console.log(`${p.id} "${p.name}": INVALID - ${v.error}`);
    continue;
  }
  const result = solve(p.vehicles, 300);
  if (!result.solvable) {
    console.log(`${p.id} "${p.name}": UNSOLVABLE`);
  } else if (result.minMoves !== p.minMoves) {
    console.log(`${p.id} "${p.name}": minMoves ${p.minMoves} → ${result.minMoves}`);
  } else {
    console.log(`${p.id} "${p.name}": OK (${result.minMoves} moves)`);
  }
}
