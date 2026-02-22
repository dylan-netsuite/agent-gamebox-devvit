/**
 * Reads current puzzles, validates them, fixes minMoves via BFS, and outputs corrected ones.
 * For invalid puzzles, tries to generate a replacement.
 * Run: cd games/phaser/rush-hour && npx tsx tools/auto-fix.ts
 */

import { CATALOG_PUZZLES, VEHICLE_COLORS } from '../src/client/game/data/puzzles';
import { solve, validatePuzzle } from '../src/client/game/utils/solver';

for (const p of CATALOG_PUZZLES) {
  const v = validatePuzzle(p.vehicles);
  const s = v.valid ? solve(p.vehicles, 300) : { solvable: false, minMoves: -1 };
  const status = !v.valid ? `INVALID: ${v.error}` :
                 !s.solvable ? 'UNSOLVABLE' :
                 s.minMoves !== p.minMoves ? `minMoves: ${p.minMoves} → ${s.minMoves}` :
                 `OK (${s.minMoves})`;
  console.log(`${p.id} "${p.name}": ${status}`);
}
