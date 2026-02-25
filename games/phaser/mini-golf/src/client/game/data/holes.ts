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
  {
    id: 1,
    name: 'The Vanilla Straightaway',
    par: 2,
    tee: { x: 400, y: 520 },
    cup: { x: 400, y: 80 },
    walls: [
      [
        { x: 350, y: 40 },
        { x: 450, y: 40 },
        { x: 450, y: 560 },
        { x: 350, y: 560 },
      ],
    ],
    obstacles: [],
  },

  // ---- HOLE 2: The Licorice Dogleg ----
  {
    id: 2,
    name: 'The Licorice Dogleg',
    par: 2,
    tee: { x: 200, y: 500 },
    cup: { x: 600, y: 150 },
    walls: [
      // L-shaped outer boundary
      [
        { x: 150, y: 100 },
        { x: 650, y: 100 },
        { x: 650, y: 200 },
        { x: 300, y: 200 },
        { x: 300, y: 550 },
        { x: 150, y: 550 },
      ],
      // Inner corner block
      [
        { x: 250, y: 100 },
        { x: 250, y: 440 },
        { x: 550, y: 440 },
        { x: 550, y: 100 },
      ],
    ],
    obstacles: [
      // 45-degree angled chocolate block in the corner
      {
        type: 'bumper',
        x: 275,
        y: 215,
        radius: 5,
        color: 0x8b4513,
      },
    ],
  },

  // ---- HOLE 3: The Graham Cracker Divide ----
  {
    id: 3,
    name: 'The Graham Cracker Divide',
    par: 3,
    tee: { x: 400, y: 530 },
    cup: { x: 400, y: 70 },
    walls: [
      // Outer boundary
      [
        { x: 200, y: 30 },
        { x: 600, y: 30 },
        { x: 600, y: 570 },
        { x: 200, y: 570 },
      ],
      // Left divider (narrow left path)
      [
        { x: 370, y: 120 },
        { x: 370, y: 460 },
      ],
      // Right divider
      [
        { x: 430, y: 120 },
        { x: 430, y: 460 },
      ],
    ],
    obstacles: [],
    frictionZones: [
      // Graham cracker sand trap in the center
      { x: 375, y: 140, width: 50, height: 300, color: 0xd2b48c },
    ],
  },

  // ---- HOLE 4: The Gumdrop Bumper Pinball ----
  {
    id: 4,
    name: 'The Gumdrop Bumper Pinball',
    par: 3,
    tee: { x: 400, y: 520 },
    cup: { x: 400, y: 100 },
    walls: [
      [
        { x: 200, y: 50 },
        { x: 600, y: 50 },
        { x: 600, y: 560 },
        { x: 200, y: 560 },
      ],
    ],
    obstacles: [
      { type: 'bumper', x: 350, y: 200, radius: 20, color: 0xff6347 },
      { type: 'bumper', x: 450, y: 200, radius: 20, color: 0x32cd32 },
      { type: 'bumper', x: 400, y: 150, radius: 20, color: 0xffd700 },
    ],
  },

  // ---- HOLE 5: The Jawbreaker Wedge ----
  {
    id: 5,
    name: 'The Jawbreaker Wedge',
    par: 3,
    tee: { x: 400, y: 530 },
    cup: { x: 400, y: 80 },
    walls: [
      // Outer boundary with narrowing at midpoint
      [
        { x: 300, y: 40 },
        { x: 500, y: 40 },
        { x: 500, y: 220 },
        { x: 450, y: 280 },
        { x: 500, y: 340 },
        { x: 500, y: 570 },
        { x: 300, y: 570 },
        { x: 300, y: 340 },
        { x: 350, y: 280 },
        { x: 300, y: 220 },
      ],
    ],
    obstacles: [
      // Ramp zone in the narrow section
      {
        type: 'ramp',
        x: 350,
        y: 240,
        width: 100,
        height: 80,
        forceY: 3,
      },
    ],
  },

  // ---- HOLE 6: The Taffy River ----
  {
    id: 6,
    name: 'The Taffy River',
    par: 3,
    tee: { x: 400, y: 500 },
    cup: { x: 400, y: 100 },
    walls: [
      // Bottom island
      [
        { x: 300, y: 400 },
        { x: 500, y: 400 },
        { x: 500, y: 560 },
        { x: 300, y: 560 },
      ],
      // Top island
      [
        { x: 300, y: 40 },
        { x: 500, y: 40 },
        { x: 500, y: 200 },
        { x: 300, y: 200 },
      ],
    ],
    obstacles: [],
    waterZones: [
      // River between islands (except for bridge area)
      { x: 300, y: 200, width: 160, height: 200, color: 0xff69b4 },
      { x: 440, y: 200, width: 60, height: 200, color: 0xff69b4 },
    ],
  },

  // ---- HOLE 7: The Wafer Windmill ----
  {
    id: 7,
    name: 'The Wafer Windmill',
    par: 3,
    tee: { x: 400, y: 520 },
    cup: { x: 400, y: 80 },
    walls: [
      [
        { x: 320, y: 40 },
        { x: 480, y: 40 },
        { x: 480, y: 560 },
        { x: 320, y: 560 },
      ],
    ],
    obstacles: [
      {
        type: 'windmill',
        x: 400,
        y: 300,
        bladeCount: 4,
        bladeLength: 70,
        speed: 1.5,
        color: 0xe9c46a,
      },
    ],
  },

  // ---- HOLE 8: The Teleportation Tunnels ----
  {
    id: 8,
    name: 'The Teleportation Tunnels',
    par: 3,
    tee: { x: 200, y: 500 },
    cup: { x: 600, y: 100 },
    walls: [
      // Starting box
      [
        { x: 100, y: 400 },
        { x: 300, y: 400 },
        { x: 300, y: 560 },
        { x: 100, y: 560 },
      ],
      // Destination box
      [
        { x: 500, y: 40 },
        { x: 700, y: 40 },
        { x: 700, y: 200 },
        { x: 500, y: 200 },
      ],
    ],
    obstacles: [],
    teleporters: [
      { entryX: 280, entryY: 420, exitX: 520, exitY: 180, color: 0xff0000 },
      { entryX: 200, entryY: 420, exitX: 600, exitY: 180, color: 0x00ff00 },
      { entryX: 120, entryY: 420, exitX: 680, exitY: 100, color: 0x0000ff },
    ],
  },

  // ---- HOLE 9: The Ice Cream Glide ----
  {
    id: 9,
    name: 'The Ice Cream Glide',
    par: 4,
    tee: { x: 100, y: 530 },
    cup: { x: 700, y: 70 },
    walls: [
      [
        { x: 50, y: 30 },
        { x: 750, y: 30 },
        { x: 750, y: 570 },
        { x: 50, y: 570 },
      ],
      // Zig-zag internal walls
      [
        { x: 200, y: 30 },
        { x: 200, y: 400 },
      ],
      [
        { x: 400, y: 200 },
        { x: 400, y: 570 },
      ],
      [
        { x: 600, y: 30 },
        { x: 600, y: 400 },
      ],
    ],
    obstacles: [],
    slickZones: [
      { x: 50, y: 30, width: 700, height: 540, color: 0xfff0f5 },
    ],
  },

  // ---- HOLE 10: The Sour Tongues ----
  {
    id: 10,
    name: 'The Sour Tongues',
    par: 4,
    tee: { x: 400, y: 530 },
    cup: { x: 400, y: 70 },
    walls: [
      [
        { x: 350, y: 30 },
        { x: 450, y: 30 },
        { x: 450, y: 570 },
        { x: 350, y: 570 },
      ],
    ],
    obstacles: [
      // Thrusting barriers on alternating sides
      {
        type: 'thrusting_barrier',
        x: 350,
        y: 200,
        width: 30,
        height: 8,
        speed: 2,
      },
      {
        type: 'thrusting_barrier',
        x: 450,
        y: 300,
        width: 30,
        height: 8,
        speed: 2.5,
      },
      {
        type: 'thrusting_barrier',
        x: 350,
        y: 400,
        width: 30,
        height: 8,
        speed: 1.8,
      },
    ],
    frictionZones: [
      { x: 300, y: 30, width: 50, height: 540, color: 0xd2b48c },
      { x: 450, y: 30, width: 50, height: 540, color: 0xd2b48c },
    ],
  },

  // ---- HOLE 11: The Loop-de-Loop ----
  {
    id: 11,
    name: 'The Loop-de-Loop',
    par: 3,
    tee: { x: 400, y: 530 },
    cup: { x: 400, y: 80 },
    walls: [
      [
        { x: 320, y: 40 },
        { x: 480, y: 40 },
        { x: 480, y: 570 },
        { x: 320, y: 570 },
      ],
    ],
    obstacles: [
      // Ramp zone simulating the loop
      {
        type: 'ramp',
        x: 340,
        y: 250,
        width: 120,
        height: 60,
        forceY: 5,
      },
    ],
    waterZones: [
      { x: 320, y: 40, width: 30, height: 120, color: 0xff69b4 },
      { x: 450, y: 40, width: 30, height: 120, color: 0xff69b4 },
    ],
  },

  // ---- HOLE 12: The Conveyor Belt Matrix ----
  {
    id: 12,
    name: 'The Conveyor Belt Matrix',
    par: 4,
    tee: { x: 150, y: 500 },
    cup: { x: 650, y: 100 },
    walls: [
      [
        { x: 80, y: 40 },
        { x: 720, y: 40 },
        { x: 720, y: 560 },
        { x: 80, y: 560 },
      ],
    ],
    obstacles: [
      { type: 'conveyor', x: 150, y: 350, width: 120, height: 120, forceX: 3, forceY: 0 },
      { type: 'conveyor', x: 350, y: 350, width: 120, height: 120, forceX: 0, forceY: -3 },
      { type: 'conveyor', x: 350, y: 150, width: 120, height: 120, forceX: 3, forceY: 0 },
      { type: 'conveyor', x: 550, y: 150, width: 120, height: 120, forceX: 0, forceY: -2 },
    ],
  },

  // ---- HOLE 13: The Flavour Grabber ----
  {
    id: 13,
    name: 'The Flavour Grabber',
    par: 4,
    tee: { x: 400, y: 520 },
    cup: { x: 400, y: 300 },
    walls: [
      [
        { x: 150, y: 150 },
        { x: 650, y: 150 },
        { x: 650, y: 550 },
        { x: 150, y: 550 },
      ],
    ],
    obstacles: [],
    waterZones: [
      { x: 100, y: 100, width: 50, height: 500, color: 0xff69b4 },
      { x: 650, y: 100, width: 50, height: 500, color: 0xff69b4 },
      { x: 100, y: 100, width: 600, height: 50, color: 0xff69b4 },
      { x: 100, y: 550, width: 600, height: 50, color: 0xff69b4 },
    ],
  },

  // ---- HOLE 14: Gravity Wells and Black Holes ----
  {
    id: 14,
    name: 'Gravity Wells',
    par: 4,
    tee: { x: 150, y: 500 },
    cup: { x: 650, y: 100 },
    walls: [
      [
        { x: 80, y: 40 },
        { x: 720, y: 40 },
        { x: 720, y: 560 },
        { x: 80, y: 560 },
      ],
    ],
    obstacles: [
      { type: 'gravity_well', x: 300, y: 300, radius: 40, color: 0x4b0082 },
      { type: 'gravity_well', x: 500, y: 200, radius: 35, color: 0x4b0082 },
    ],
  },

  // ---- HOLE 15: The Cascading Plinko Board ----
  {
    id: 15,
    name: 'The Cascading Plinko',
    par: 4,
    tee: { x: 400, y: 60 },
    cup: { x: 400, y: 540 },
    walls: [
      [
        { x: 250, y: 20 },
        { x: 550, y: 20 },
        { x: 550, y: 580 },
        { x: 250, y: 580 },
      ],
    ],
    obstacles: [
      // Plinko pegs
      { type: 'bumper', x: 330, y: 150, radius: 6, color: 0xff69b4 },
      { type: 'bumper', x: 400, y: 150, radius: 6, color: 0xffd700 },
      { type: 'bumper', x: 470, y: 150, radius: 6, color: 0xff69b4 },
      { type: 'bumper', x: 365, y: 210, radius: 6, color: 0x32cd32 },
      { type: 'bumper', x: 435, y: 210, radius: 6, color: 0x32cd32 },
      { type: 'bumper', x: 330, y: 270, radius: 6, color: 0xff69b4 },
      { type: 'bumper', x: 400, y: 270, radius: 6, color: 0xffd700 },
      { type: 'bumper', x: 470, y: 270, radius: 6, color: 0xff69b4 },
      { type: 'bumper', x: 365, y: 330, radius: 6, color: 0x32cd32 },
      { type: 'bumper', x: 435, y: 330, radius: 6, color: 0x32cd32 },
      { type: 'bumper', x: 330, y: 390, radius: 6, color: 0xff69b4 },
      { type: 'bumper', x: 400, y: 390, radius: 6, color: 0xffd700 },
      { type: 'bumper', x: 470, y: 390, radius: 6, color: 0xff69b4 },
      // Downward ramp
      { type: 'ramp', x: 250, y: 100, width: 300, height: 400, forceY: -2 },
    ],
    frictionZones: [
      { x: 280, y: 480, width: 100, height: 80, color: 0xd2b48c },
      { x: 420, y: 480, width: 100, height: 80, color: 0xd2b48c },
    ],
  },

  // ---- HOLE 16: The Invisible Maze ----
  {
    id: 16,
    name: 'The Invisible Maze',
    par: 4,
    tee: { x: 150, y: 500 },
    cup: { x: 650, y: 100 },
    walls: [
      // Outer boundary
      [
        { x: 80, y: 40 },
        { x: 720, y: 40 },
        { x: 720, y: 560 },
        { x: 80, y: 560 },
      ],
      // Invisible internal walls (rendered transparent, flash on hit)
      [
        { x: 250, y: 40 },
        { x: 250, y: 350 },
      ],
      [
        { x: 250, y: 350 },
        { x: 500, y: 350 },
      ],
      [
        { x: 500, y: 200 },
        { x: 500, y: 560 },
      ],
      [
        { x: 350, y: 200 },
        { x: 650, y: 200 },
      ],
    ],
    obstacles: [],
  },

  // ---- HOLE 17: The Moving Island Sequence ----
  {
    id: 17,
    name: 'The Moving Islands',
    par: 5,
    tee: { x: 400, y: 530 },
    cup: { x: 400, y: 70 },
    walls: [
      // Start platform
      [
        { x: 300, y: 480 },
        { x: 500, y: 480 },
        { x: 500, y: 570 },
        { x: 300, y: 570 },
      ],
      // End platform
      [
        { x: 300, y: 30 },
        { x: 500, y: 30 },
        { x: 500, y: 120 },
        { x: 300, y: 120 },
      ],
    ],
    obstacles: [],
    waterZones: [
      { x: 200, y: 120, width: 400, height: 360, color: 0xff69b4 },
    ],
  },

  // ---- HOLE 18: The Skull of Doom ----
  {
    id: 18,
    name: 'The Skull of Doom',
    par: 3,
    tee: { x: 400, y: 530 },
    cup: { x: 400, y: 100 },
    walls: [
      // Narrow bridge approach
      [
        { x: 370, y: 300 },
        { x: 370, y: 570 },
      ],
      [
        { x: 430, y: 300 },
        { x: 430, y: 570 },
      ],
      // Skull arena
      [
        { x: 250, y: 50 },
        { x: 550, y: 50 },
        { x: 550, y: 300 },
        { x: 250, y: 300 },
      ],
    ],
    obstacles: [
      {
        type: 'windmill',
        x: 400,
        y: 200,
        bladeCount: 2,
        bladeLength: 60,
        speed: 2.5,
        color: 0xff1493,
      },
    ],
    waterZones: [
      { x: 200, y: 300, width: 170, height: 270, color: 0xff4500 },
      { x: 430, y: 300, width: 170, height: 270, color: 0xff4500 },
    ],
  },
];
