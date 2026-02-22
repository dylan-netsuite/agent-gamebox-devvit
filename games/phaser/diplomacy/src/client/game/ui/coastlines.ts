import type { Polygon } from './provinceGeometry';
import { PROVINCES } from '../../../shared/data/provinces';

/**
 * Coastline polygons for distinct landmasses.
 * Land provinces belonging to a landmass are clipped to its polygon,
 * giving the map geographic accuracy.
 *
 * All polygons are wound CLOCKWISE — the Sutherland-Hodgman clipper
 * in provinceGeometry.ts treats "left of edge" as the inside normal,
 * which correctly identifies interior points for CW winding.
 */

// ── British Isles ─────────────────────────────────────────

/** British Isles — CLY, EDI, LVP, YOR, WAL, LON */
export const BRITISH_ISLES: Polygon = [
  { x: 190, y: 165 },
  { x: 265, y: 165 },
  { x: 290, y: 200 },
  { x: 305, y: 280 },
  { x: 310, y: 355 },
  { x: 265, y: 375 },
  { x: 215, y: 365 },
  { x: 195, y: 335 },
  { x: 195, y: 285 },
  { x: 185, y: 230 },
];

// ── North Africa ──────────────────────────────────────────

/** North Africa — NAF, TUN */
export const NORTH_AFRICA: Polygon = [
  { x: 80, y: 630 },
  { x: 400, y: 620 },
  { x: 420, y: 710 },
  { x: 250, y: 730 },
  { x: 80, y: 710 },
];

// ── Continental Europe ────────────────────────────────────

/**
 * Continental Europe — all mainland land/coastal provinces.
 *
 * Traces the OUTER coastline clockwise. Interior seas (Baltic, Adriatic,
 * Black Sea) sit inside the polygon and don't clip the provinces around
 * them — Voronoi cells handle those boundaries naturally.
 *
 * Vertices traced clockwise starting from NW Norway.
 */
export const CONTINENT: Polygon = [
  // ── NORTH COAST (west → east, facing Norwegian/Barents Sea) ──
  { x: 325, y: 90 },   // NW above NOR(365,145)
  { x: 415, y: 50 },   // N of Scandinavia
  { x: 535, y: 40 },   // N of FIN(520,120)
  { x: 610, y: 45 },   // NE of STP(570,95)

  // ── EAST SIDE (north → south, Russia interior → Turkey east) ──
  { x: 715, y: 95 },   // NE Russia
  { x: 745, y: 255 },  // E Russia
  { x: 725, y: 395 },  // E of SEV(660,420)
  { x: 775, y: 465 },  // E of ARM(730,475)
  { x: 748, y: 555 },  // SE Turkey

  // ── SOUTH COAST (east → west, Mediterranean/Aegean) ──
  { x: 738, y: 655 },  // S of SYR(700,620)
  { x: 658, y: 638 },  // S of SMY(630,585)
  { x: 588, y: 625 },  // Between CON(595,550) and AEG(570,610)
  { x: 548, y: 638 },  // S of GRE(530,595)
  { x: 508, y: 630 },  // SW of GRE

  // ── ITALIAN BOOT ──
  { x: 468, y: 645 },  // Boot tip, S of NAP(440,600)
  { x: 418, y: 618 },  // SW of NAP
  { x: 393, y: 568 },  // W of ROM(415,545)
  { x: 373, y: 528 },  // W of TUS(395,505)
  { x: 328, y: 502 },  // Between PIE(350,470)/MAR(310,495) and GOL(335,545)

  // ── FRENCH MEDITERRANEAN → IBERIA ──
  { x: 288, y: 528 },  // S of MAR(310,495)
  { x: 228, y: 583 },  // S of SPA(195,545)
  { x: 153, y: 583 },  // SW Iberia
  { x: 83, y: 563 },   // W of POR(120,530)

  // ── PORTUGUESE WEST COAST ──
  { x: 75, y: 508 },   // W of POR
  { x: 80, y: 472 },   // NW Iberia

  // ── FRENCH ATLANTIC COAST ──
  { x: 143, y: 453 },  // Between GAS(235,465) and MAO(90,450)
  { x: 173, y: 408 },  // W of BRE(220,400)

  // ── CHANNEL / LOW COUNTRIES ──
  { x: 253, y: 358 },  // Between PIC(290,370) and ENG(250,375)
  { x: 293, y: 282 },  // Between HOL(330,305) and NTH(295,240)

  // ── DANISH / NORWEGIAN WEST COAST ──
  { x: 343, y: 222 },  // W of DEN(390,245)
  { x: 333, y: 148 },  // W of NOR(365,145)
];

// ── Decorative Island Outlines ──────────────────────────────
// These don't affect gameplay — they improve geographic recognizability

/** Sicily — decorative outline south of NAP/ROM */
export const SICILY: Polygon = [
  { x: 418, y: 635 },
  { x: 445, y: 622 },
  { x: 465, y: 640 },
  { x: 455, y: 665 },
  { x: 425, y: 670 },
  { x: 410, y: 655 },
];

/** Sardinia — decorative outline west of ROM/TYS */
export const SARDINIA: Polygon = [
  { x: 355, y: 565 },
  { x: 370, y: 555 },
  { x: 378, y: 575 },
  { x: 372, y: 600 },
  { x: 358, y: 605 },
  { x: 348, y: 585 },
];

/** Corsica — decorative outline NW of TYS */
export const CORSICA: Polygon = [
  { x: 352, y: 515 },
  { x: 362, y: 508 },
  { x: 367, y: 528 },
  { x: 360, y: 545 },
  { x: 350, y: 540 },
  { x: 345, y: 525 },
];

/** Crete — decorative outline south of AEG */
export const CRETE: Polygon = [
  { x: 545, y: 650 },
  { x: 585, y: 645 },
  { x: 592, y: 655 },
  { x: 575, y: 665 },
  { x: 550, y: 662 },
];

/** Switzerland — impassable territory, drawn with hatching */
export const SWITZERLAND: Polygon = [
  { x: 330, y: 430 },
  { x: 360, y: 420 },
  { x: 385, y: 425 },
  { x: 390, y: 445 },
  { x: 370, y: 460 },
  { x: 340, y: 455 },
];

/** All decorative islands (not gameplay provinces) */
export const DECORATIVE_ISLANDS: Polygon[] = [SICILY, SARDINIA, CORSICA, CRETE];

// ── Province-to-landmass mapping ──────────────────────────

/**
 * Build the landmass map. All non-water provinces that aren't
 * British or North African are assigned to CONTINENT.
 */
function buildLandmassMap(): Record<string, Polygon> {
  const map: Record<string, Polygon> = {};

  // British Isles
  for (const id of ['CLY', 'EDI', 'LVP', 'YOR', 'WAL', 'LON']) {
    map[id] = BRITISH_ISLES;
  }

  // North Africa
  for (const id of ['NAF', 'TUN']) {
    map[id] = NORTH_AFRICA;
  }

  // Everything else that's land or coastal → CONTINENT
  for (const [id, prov] of Object.entries(PROVINCES)) {
    if (prov.type === 'water') continue;
    if (map[id]) continue; // Already assigned (British / N. Africa)
    map[id] = CONTINENT;
  }

  return map;
}

const LANDMASS_MAP = buildLandmassMap();

/**
 * Get the landmass clipping polygon for a province, if any.
 * Returns null for water provinces (they don't need clipping).
 */
export function getLandmassClip(provinceId: string): Polygon | null {
  return LANDMASS_MAP[provinceId] ?? null;
}
