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

// All coordinates in design space (500x800)

export const HOLES: HoleDefinition[] = [
  // ---- HOLE 1: The Vanilla Straightaway ----
  // Simple straight vertical rectangle. No obstacles. Full-power straight
  // shot = hole-in-one. Slight miss = easy tap-in par 2.
  {
    id: 1,
    name: 'The Vanilla Straightaway',
    par: 2,
    tee: { x: 250, y: 690 },
    cup: { x: 250, y: 110 },
    walls: [
      [
        { x: 150, y: 60 },
        { x: 350, y: 60 },
        { x: 350, y: 740 },
        { x: 150, y: 740 },
        { x: 150, y: 60 },
      ],
    ],
    obstacles: [],
  },

  // ---- HOLE 2: The Licorice Dogleg ----
  // L-shaped course bending 90° right. Licorice wall partially blocks
  // direct line of sight at the bend but leaves the path navigable.
  // 45° chocolate block in upper-right corner reflects ball toward cup.
  {
    id: 2,
    name: 'The Licorice Dogleg',
    par: 2,
    tee: { x: 200, y: 700 },
    cup: { x: 360, y: 130 },
    walls: [
      [
        // Single L-shape polygon (clockwise from top-left)
        { x: 120, y: 80 },
        { x: 420, y: 80 },
        { x: 420, y: 250 },
        { x: 280, y: 250 },
        { x: 280, y: 750 },
        { x: 120, y: 750 },
        { x: 120, y: 80 },
      ],
    ],
    obstacles: [
      // Chocolate block — 45° angled reflector in upper-left corner of the bend
      {
        type: 'block',
        x: 160,
        y: 130,
        width: 70,
        height: 30,
        angle: -0.785,
      },
      // Licorice wall — horizontal barrier extending from the inner wall,
      // blocking the right side of the corridor to force the bank shot left
      {
        type: 'licorice_wall',
        x: 230,
        y: 310,
        width: 100,
        height: 18,
        angle: 0,
      },
    ],
  },
];
