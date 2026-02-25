import type { ObstacleDef, ZoneDef, TeleporterDef } from '../objects/Obstacles';

export interface HoleDefinition {
  id: number;
  name: string;
  par: number;
  tee: { x: number; y: number };
  cup: { x: number; y: number };
  walls: { x: number; y: number }[][];
  obstacles: ObstacleDef[];
  frictionZones?: ZoneDef[];
  slickZones?: ZoneDef[];
  waterZones?: ZoneDef[];
  teleporters?: TeleporterDef[];
}

// All coordinates in design space (800x600)

export const HOLES: HoleDefinition[] = [
  // ---- HOLE 1: The Vanilla Straightaway ----
  // Simple straight vertical rectangle. No obstacles. Full-power straight
  // shot = hole-in-one. Slight miss = easy tap-in par 2.
  {
    id: 1,
    name: 'The Vanilla Straightaway',
    par: 2,
    tee: { x: 400, y: 520 },
    cup: { x: 400, y: 80 },
    walls: [
      [
        { x: 300, y: 40 },
        { x: 500, y: 40 },
        { x: 500, y: 560 },
        { x: 300, y: 560 },
        { x: 300, y: 40 },
      ],
    ],
    obstacles: [],
  },

  // ---- HOLE 2: The Licorice Dogleg ----
  // L-shaped course bending 90° right. Licorice wall blocks direct path.
  // 45° chocolate block in upper-left corner reflects ball toward cup.
  // Aim at block with ~75% power for a clean bank-shot hole-in-one.
  {
    id: 2,
    name: 'The Licorice Dogleg',
    par: 2,
    tee: { x: 400, y: 500 },
    cup: { x: 540, y: 160 },
    walls: [
      [
        // L-shape outline (clockwise from top-left)
        { x: 310, y: 80 },
        { x: 590, y: 80 },
        { x: 590, y: 280 },
        { x: 470, y: 280 },
        { x: 470, y: 560 },
        { x: 330, y: 560 },
        { x: 330, y: 80 },
        { x: 310, y: 80 },
      ],
    ],
    obstacles: [
      // Chocolate block — 45° angled reflector in upper-left area
      {
        type: 'block',
        x: 370,
        y: 140,
        width: 70,
        height: 35,
        angle: -0.785, // -45 degrees (Math.PI/4)
      },
      // Licorice wall — horizontal barrier across the bend
      {
        type: 'licorice_wall',
        x: 400,
        y: 295,
        width: 140,
        height: 22,
        angle: 0,
      },
    ],
  },
];
