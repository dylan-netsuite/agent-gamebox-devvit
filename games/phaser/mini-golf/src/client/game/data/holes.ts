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

  // ---- HOLE 3: The Gumdrop Bumper Pinball ----
  // Wide rectangular arena. 3 gumdrop bumpers in semi-circle guard the cup.
  // Bumpers have restitution 1.5 (hyper-elastic pinball effect).
  // Thread the gaps with low power, or bank around the perimeter.
  {
    id: 3,
    name: 'The Gumdrop Bumper Pinball',
    par: 3,
    tee: { x: 250, y: 690 },
    cup: { x: 250, y: 140 },
    walls: [
      [
        { x: 80, y: 60 },
        { x: 420, y: 60 },
        { x: 420, y: 740 },
        { x: 80, y: 740 },
        { x: 80, y: 60 },
      ],
    ],
    obstacles: [
      // Left gumdrop (red) — semi-circle arc, left position
      {
        type: 'gumdrop_bumper',
        x: 185,
        y: 260,
        radius: 22,
        color: 0xff3333,
      },
      // Center gumdrop (green) — semi-circle arc, center-top
      {
        type: 'gumdrop_bumper',
        x: 250,
        y: 220,
        radius: 22,
        color: 0x33cc33,
      },
      // Right gumdrop (blue) — semi-circle arc, right position
      {
        type: 'gumdrop_bumper',
        x: 315,
        y: 260,
        radius: 22,
        color: 0x3399ff,
      },
    ],
  },

  // ---- HOLE 4: The Graham Cracker Divide ----
  // Left: needle-thin channel (26px) aligned with cup for hole-in-one.
  // Right: wide safe path with gumdrop bumpers at corners to redirect ball.
  // Center island is a graham cracker sand trap that kills momentum.
  {
    id: 4,
    name: 'The Graham Cracker Divide',
    par: 3,
    tee: { x: 250, y: 700 },
    cup: { x: 93, y: 110 },
    walls: [
      // Outer boundary
      [
        { x: 80, y: 60 },
        { x: 420, y: 60 },
        { x: 420, y: 740 },
        { x: 80, y: 740 },
        { x: 80, y: 60 },
      ],
      // Center island — right edge of needle channel at x:106, right path starts x:300
      // Top opens at y:150 so the needle connects to the cup zone
      // Bottom opens at y:620 so both paths merge at the tee area
      [
        { x: 106, y: 150 },
        { x: 300, y: 150 },
        { x: 300, y: 620 },
        { x: 106, y: 620 },
        { x: 106, y: 150 },
      ],
    ],
    obstacles: [
      // Corner bumper: top-right — redirects rightward shots toward the cup
      {
        type: 'gumdrop_bumper',
        x: 365,
        y: 195,
        radius: 24,
        color: 0xff69b4,
      },
      // Corner bumper: bottom-right — guides entry into the right path
      {
        type: 'gumdrop_bumper',
        x: 365,
        y: 575,
        radius: 24,
        color: 0x33cc33,
      },
    ],
    frictionZones: [
      // Graham cracker sand trap covering the center island
      { x: 108, y: 152, width: 190, height: 466 },
    ],
  },
];
