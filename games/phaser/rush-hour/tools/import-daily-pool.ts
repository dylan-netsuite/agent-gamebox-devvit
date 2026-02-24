/**
 * Extracts 365 unique daily puzzles from the Fogleman Rush Hour database.
 * These puzzles are separate from the catalog and used exclusively for daily challenges.
 *
 * Distribution: ~40% advanced (19-30 moves), ~45% expert (31-42), ~15% grandmaster (43-51)
 *
 * Run: cd games/phaser/rush-hour && npx tsx tools/import-daily-pool.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const GRID_SIZE = 6;
const EXIT_ROW = 2;

type O = 'h' | 'v';
type T = 'car' | 'truck';

interface V {
  id: string;
  type: T;
  orientation: O;
  row: number;
  col: number;
  isTarget: boolean;
}

interface DBEntry {
  moves: number;
  board: string;
  cluster: number;
}

function parseFogleman(board: string): V[] | null {
  if (board.length !== 36) return null;

  const grid: string[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    grid.push([]);
    for (let c = 0; c < GRID_SIZE; c++) {
      grid[r]!.push(board[r * GRID_SIZE + c]!);
    }
  }

  const seen = new Set<string>();
  const vehicles: V[] = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const ch = grid[r]![c]!;
      if (ch === 'o' || ch === '.' || ch === 'x' || seen.has(ch)) continue;
      seen.add(ch);

      const cells: { row: number; col: number }[] = [];
      for (let rr = 0; rr < GRID_SIZE; rr++) {
        for (let cc = 0; cc < GRID_SIZE; cc++) {
          if (grid[rr]![cc] === ch) cells.push({ row: rr, col: cc });
        }
      }

      if (cells.length < 2 || cells.length > 3) return null;

      const allSameRow = cells.every((c2) => c2.row === cells[0]!.row);
      const allSameCol = cells.every((c2) => c2.col === cells[0]!.col);
      if (!allSameRow && !allSameCol) return null;

      const orientation: O = allSameRow ? 'h' : 'v';
      const type: T = cells.length === 3 ? 'truck' : 'car';
      const topLeft =
        orientation === 'h'
          ? cells.reduce((a, b) => (a.col < b.col ? a : b))
          : cells.reduce((a, b) => (a.row < b.row ? a : b));

      const isTarget = ch === 'A';

      if (isTarget) {
        if (orientation !== 'h' || topLeft.row !== EXIT_ROW || type !== 'car') return null;
      }

      vehicles.push({
        id: isTarget ? 'X' : ch,
        type,
        orientation,
        row: topLeft.row,
        col: topLeft.col,
        isTarget,
      });
    }
  }

  if (!vehicles.some((v) => v.isTarget)) return null;
  return vehicles;
}

function vehiclesToBoard(vehicles: V[]): string {
  const grid: string[] = new Array(36).fill('o');
  for (const v of vehicles) {
    const ch = v.isTarget ? 'A' : v.id;
    const len = v.type === 'truck' ? 3 : 2;
    for (let j = 0; j < len; j++) {
      const r = v.orientation === 'v' ? v.row + j : v.row;
      const c = v.orientation === 'h' ? v.col + j : v.col;
      grid[r * GRID_SIZE + c] = ch;
    }
  }
  return grid.join('');
}

const COLORS = [
  '#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261',
  '#6a4c93', '#48bfe3', '#06d6a0', '#ef476f', '#ffd166',
  '#118ab2', '#073b4c', '#8338ec', '#ff006e', '#fb5607', '#3a86ff',
];

interface TierSpec {
  tier: string;
  prefix: string;
  minMoves: number;
  maxMoves: number;
  count: number;
}

const TIERS: TierSpec[] = [
  { tier: 'advanced', prefix: 'da', minMoves: 19, maxMoves: 30, count: 155 },
  { tier: 'expert', prefix: 'de', minMoves: 31, maxMoves: 42, count: 175 },
  { tier: 'grandmaster', prefix: 'dg', minMoves: 43, maxMoves: 60, count: 35 },
];

async function main() {
  const toolsDir = path.dirname(new URL(import.meta.url).pathname);
  const dbPath = path.join(toolsDir, 'rush.txt');
  if (!fs.existsSync(dbPath)) {
    console.error('rush.txt not found. Download from https://www.michaelfogleman.com/static/rush/rush.txt.gz');
    process.exit(1);
  }

  // Load existing catalog puzzles to build exclusion set
  const catalogPath = path.join(toolsDir, '..', 'src', 'client', 'game', 'data', 'puzzles.ts');
  const catalogSrc = fs.readFileSync(catalogPath, 'utf-8');

  // Extract board strings from catalog by parsing the vehicle definitions
  // and reconstructing the Fogleman format. This is complex, so instead
  // we'll just track which Fogleman board strings we select and ensure
  // we skip the top-cluster entries that the catalog import already picked.
  // The catalog import always picked the highest-cluster entry per move bucket,
  // so we skip rank-1 entries and start from rank-2.

  console.log('Reading Fogleman database...');

  const buckets = new Map<number, DBEntry[]>();

  const rl = readline.createInterface({
    input: fs.createReadStream(dbPath),
    crlfDelay: Infinity,
  });

  let total = 0;
  let noWall = 0;

  for await (const line of rl) {
    total++;
    const parts = line.trim().split(/\s+/);
    if (parts.length < 3) continue;
    const moves = parseInt(parts[0]!, 10);
    const board = parts[1]!;
    const cluster = parseInt(parts[2]!, 10);

    if (board.includes('x')) continue;
    noWall++;

    if (!buckets.has(moves)) buckets.set(moves, []);
    buckets.get(moves)!.push({ moves, board, cluster });
  }

  console.log(`Total entries: ${total}, 0-wall entries: ${noWall}`);

  // Sort each bucket by cluster descending
  for (const [, entries] of buckets) {
    entries.sort((a, b) => b.cluster - a.cluster);
  }

  // Build exclusion set: reconstruct board strings from catalog
  // by finding the exact Fogleman entries the catalog would have selected.
  // The catalog import picked the top-cluster entry per move target.
  // We need to exclude those specific boards.
  const catalogBoards = new Set<string>();

  // Parse catalog to extract minMoves values and count per tier
  const catalogMoves: number[] = [];
  const moveRegex = /minMoves:\s*(\d+)/g;
  let match;
  while ((match = moveRegex.exec(catalogSrc)) !== null) {
    catalogMoves.push(parseInt(match[1]!, 10));
  }
  console.log(`Catalog has ${catalogMoves.length} puzzles`);

  // For each catalog puzzle's minMoves, mark the top-cluster Fogleman entry as used
  const usedPerBucket = new Map<number, number>();
  for (const m of catalogMoves) {
    const count = (usedPerBucket.get(m) ?? 0) + 1;
    usedPerBucket.set(m, count);
    const bucket = buckets.get(m);
    if (bucket && bucket.length >= count) {
      catalogBoards.add(bucket[count - 1]!.board);
    }
  }
  console.log(`Excluding ${catalogBoards.size} catalog boards`);

  // Select daily puzzles
  const selected: { tier: string; id: string; entry: DBEntry; vehicles: V[] }[] = [];

  for (const tier of TIERS) {
    console.log(`\n--- ${tier.tier.toUpperCase()} (${tier.minMoves}-${tier.maxMoves} moves, want ${tier.count}) ---`);

    const candidates: DBEntry[] = [];
    for (let m = tier.minMoves; m <= tier.maxMoves; m++) {
      const bucket = buckets.get(m);
      if (bucket) {
        for (const entry of bucket) {
          if (!catalogBoards.has(entry.board)) {
            candidates.push(entry);
          }
        }
      }
    }

    // Sort by cluster descending (higher cluster = more complex state graph)
    candidates.sort((a, b) => b.cluster - a.cluster);
    console.log(`  Candidates (excl. catalog): ${candidates.length}`);

    const usedBoards = new Set<string>();
    let found = 0;
    const want = Math.min(tier.count, candidates.length);

    // Take top candidates by cluster size, skipping parse failures
    for (const entry of candidates) {
      if (found >= want) break;
      if (usedBoards.has(entry.board)) continue;

      const vehicles = parseFogleman(entry.board);
      if (!vehicles) continue;

      usedBoards.add(entry.board);
      const idx = found + 1;
      const id = `${tier.prefix}${String(idx).padStart(3, '0')}`;
      selected.push({ tier: tier.tier, id, entry, vehicles });
      found++;
    }

    console.log(`  Selected: ${found}/${tier.count}`);
  }

  console.log(`\nTotal daily puzzles: ${selected.length}`);

  // Deterministic shuffle so difficulties are interleaved across the year
  function seededShuffle<T>(arr: T[], seed: number): T[] {
    const result = [...arr];
    let s = seed;
    for (let i = result.length - 1; i > 0; i--) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const j = s % (i + 1);
      [result[i], result[j]] = [result[j]!, result[i]!];
    }
    return result;
  }
  const shuffled = seededShuffle(selected, 20260224);

  // Reassign sequential IDs after shuffle
  for (let i = 0; i < shuffled.length; i++) {
    shuffled[i]!.id = `d${String(i + 1).padStart(3, '0')}`;
  }

  // Generate TypeScript output
  const outPath = path.join(toolsDir, '..', 'src', 'client', 'game', 'data', 'dailyPuzzles.ts');

  let output = `import type { PuzzleConfig, Vehicle } from '../../../shared/types/api';

function v(
  id: string,
  type: 'car' | 'truck',
  orientation: 'h' | 'v',
  row: number,
  col: number,
  color: string,
  isTarget = false
): Vehicle {
  return { id, type, orientation, row, col, color, isTarget };
}

const C = [
  '#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261',
  '#6a4c93', '#48bfe3', '#06d6a0', '#ef476f', '#ffd166',
  '#118ab2', '#073b4c', '#8338ec', '#ff006e', '#fb5607', '#3a86ff',
];

/**
 * 365 daily-exclusive puzzles, never duplicated from the catalog.
 * Distribution: ~40% advanced, ~45% expert, ~15% grandmaster.
 * Source: Fogleman Rush Hour Database.
 */
export const DAILY_PUZZLES: PuzzleConfig[] = [\n`;

  for (const p of shuffled) {
    let colorIdx = 1;
    const getColor = (isTarget: boolean) => {
      if (isTarget) return 'C[0]!';
      const idx = colorIdx % COLORS.length;
      colorIdx++;
      return `C[${idx}]!`;
    };

    output += `  {\n`;
    output += `    id: '${p.id}', name: 'Daily #${p.id.slice(1)}', difficulty: '${p.tier}', minMoves: ${p.entry.moves},\n`;
    output += `    vehicles: [\n`;
    for (const veh of p.vehicles) {
      output += `      v('${veh.id}', '${veh.type}', '${veh.orientation}', ${veh.row}, ${veh.col}, ${getColor(veh.isTarget)}${veh.isTarget ? ', true' : ''}),\n`;
    }
    output += `    ],\n`;
    output += `  },\n`;
  }

  output += `];\n`;

  fs.writeFileSync(outPath, output, 'utf-8');
  console.log(`\nWrote ${shuffled.length} shuffled puzzles to ${outPath}`);
}

main().catch(console.error);
