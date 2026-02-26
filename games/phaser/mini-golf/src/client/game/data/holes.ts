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
    tee: { x: 250, y: 650 },
    cup: { x: 250, y: 110 },
    walls: [
      [
        { x: 150, y: 60 },
        { x: 350, y: 60 },
        { x: 350, y: 700 },
        { x: 150, y: 700 },
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
    tee: { x: 200, y: 660 },
    cup: { x: 360, y: 130 },
    walls: [
      [
        // Single L-shape polygon (clockwise from top-left)
        { x: 120, y: 80 },
        { x: 420, y: 80 },
        { x: 420, y: 250 },
        { x: 280, y: 250 },
        { x: 280, y: 710 },
        { x: 120, y: 710 },
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
    tee: { x: 250, y: 650 },
    cup: { x: 250, y: 140 },
    walls: [
      [
        { x: 80, y: 60 },
        { x: 420, y: 60 },
        { x: 420, y: 700 },
        { x: 80, y: 700 },
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
  // Tee, needle channel, and cup all at x:95 — straight vertical line.
  // Needle channel: x:80-110 (30px design, ~12px effective after 9px wall inset).
  // Right: wide safe path with 45° corner bumper blocks (Hole 2 style).
  // Center island is a graham cracker sand trap.
  {
    id: 4,
    name: 'The Graham Cracker Divide',
    par: 3,
    tee: { x: 95, y: 660 },
    cup: { x: 95, y: 110 },
    walls: [
      // Outer boundary
      [
        { x: 80, y: 60 },
        { x: 420, y: 60 },
        { x: 420, y: 700 },
        { x: 80, y: 700 },
        { x: 80, y: 60 },
      ],
      // Island — needle channel on left (x:80-110, 30px) and wide path on right (x:310-420)
      [
        { x: 110, y: 150 },
        { x: 310, y: 150 },
        { x: 310, y: 620 },
        { x: 110, y: 620 },
        { x: 110, y: 150 },
      ],
    ],
    obstacles: [
      // Top-right corner bumper: 45° block tucked into the (420, 60) corner.
      // Same style as Hole 2's chocolate block (70x30).
      // Redirects upward-traveling ball leftward toward the cup.
      {
        type: 'block',
        x: 385,
        y: 95,
        width: 70,
        height: 30,
        angle: 0.785,
      },
      // Bottom-right corner bumper: 45° block tucked into the (420, 740) corner.
      // Redirects rightward-traveling ball upward into the right path.
      {
        type: 'block',
        x: 385,
        y: 705,
        width: 70,
        height: 30,
        angle: -0.785,
      },
    ],
    frictionZones: [
      // Graham cracker sand trap covering the center island
      { x: 112, y: 152, width: 196, height: 466 },
    ],
  },

  // ---- HOLE 5: The Jawbreaker Wedge ----
  // Long straight fairway that funnels into a narrow ramp at the midpoint.
  // Ramp zone applies constant downward force (simulates uphill gravity).
  // Ball must have ~80% power to crest; too much overshoots into back wall.
  // Cup sits on a raised plateau past the ramp.
  {
    id: 5,
    name: 'The Jawbreaker Wedge',
    par: 3,
    tee: { x: 250, y: 650 },
    cup: { x: 250, y: 140 },
    walls: [
      // Hourglass/funnel shape: wide bottom → narrow ramp → narrow plateau
      [
        { x: 150, y: 700 },
        { x: 350, y: 700 },
        { x: 350, y: 420 },
        { x: 310, y: 320 },
        { x: 310, y: 60 },
        { x: 190, y: 60 },
        { x: 190, y: 320 },
        { x: 150, y: 420 },
        { x: 150, y: 700 },
      ],
    ],
    obstacles: [
      // Ramp zone — mild downward force simulates uphill slope
      {
        type: 'ramp',
        x: 190,
        y: 300,
        width: 120,
        height: 120,
        forceX: 0,
        forceY: 2.25,
      },
    ],
  },

  // ---- HOLE 6: The Taffy River ----
  // Two isolated islands connected by a wide moving bridge.
  // The taffy river between them is a fatal water hazard — ball sinks, +1 penalty, reset.
  // Bridge oscillates vertically, requiring timing and patience.
  // Island walls are U-shaped (open on the river-facing side) so the ball can exit/enter.
  {
    id: 6,
    name: 'The Taffy River',
    par: 3,
    tee: { x: 250, y: 640 },
    cup: { x: 250, y: 140 },
    walls: [
      // Bottom island (tee side) — U-shape open at top (river side)
      [
        { x: 120, y: 520 },
        { x: 120, y: 700 },
        { x: 380, y: 700 },
        { x: 380, y: 520 },
      ],
      // Top island (cup side) — U-shape open at bottom (river side)
      [
        { x: 380, y: 280 },
        { x: 380, y: 60 },
        { x: 120, y: 60 },
        { x: 120, y: 280 },
      ],
    ],
    obstacles: [
      // Moving bridge — tall kinematic body oscillating between the two islands
      {
        type: 'moving_bridge',
        x: 170,
        y: 500,
        width: 160,
        height: 100,
        targetY: 300,
        speed: 0.8,
      },
    ],
    waterZones: [
      // Taffy river — the entire gap between the two islands
      { x: 120, y: 280, width: 260, height: 240, color: 0xff69b4 },
    ],
  },

  // ---- HOLE 7: The Wafer Windmill ----
  // Classic retro mini-golf timing challenge. Straight fairway with a massive
  // 4-blade windmill dead center. Blades extend wall-to-wall — no safe path
  // around them. High restitution blades violently deflect the ball on contact.
  // Player must time their shot to slip through the gap between rotating blades.
  {
    id: 7,
    name: 'The Wafer Windmill',
    par: 3,
    tee: { x: 250, y: 650 },
    cup: { x: 250, y: 110 },
    walls: [
      [
        { x: 150, y: 60 },
        { x: 350, y: 60 },
        { x: 350, y: 700 },
        { x: 150, y: 700 },
        { x: 150, y: 60 },
      ],
    ],
    obstacles: [
      {
        type: 'windmill',
        x: 250,
        y: 380,
        bladeCount: 4,
        bladeLength: 180,
        speed: 1.2,
      },
    ],
  },

  // ---- HOLE 8: The Teleportation Tunnels ----
  // Puzzle hole with two physically separate areas. Tee box at bottom has three
  // colored pipe entrances (Red, Blue, Green) in the top wall. Cup is in a
  // walled-off exit area at the top, reachable only via teleporters.
  // Red pipe → sand trap (away from hole). Blue pipe → corner bounce (chaotic).
  // Green pipe → straight shot at hole (but entrance is blocked by chocolate).
  // Player must bank off the wall to slip into the hidden Green pipe.
  {
    id: 8,
    name: 'The Teleportation Tunnels',
    par: 3,
    tee: { x: 250, y: 650 },
    cup: { x: 250, y: 160 },
    walls: [
      // Tee box (bottom enclosed area)
      [
        { x: 150, y: 540 },
        { x: 350, y: 540 },
        { x: 350, y: 700 },
        { x: 150, y: 700 },
        { x: 150, y: 540 },
      ],
      // Exit area (top enclosed area — physically unreachable)
      [
        { x: 100, y: 60 },
        { x: 400, y: 60 },
        { x: 400, y: 320 },
        { x: 100, y: 320 },
        { x: 100, y: 60 },
      ],
    ],
    obstacles: [
      // Chocolate block partially obscuring the Green pipe entrance
      {
        type: 'block',
        x: 250,
        y: 610,
        width: 40,
        height: 20,
        angle: 0,
      },
    ],
    frictionZones: [
      // Sand trap around the Red pipe exit
      { x: 300, y: 220, width: 95, height: 95 },
    ],
    teleporters: [
      // Red pipe — exits pointing left, away from hole, into sand trap
      {
        entryX: 190,
        entryY: 590,
        exitX: 350,
        exitY: 270,
        exitAngle: Math.PI,
        color: 0xff3333,
      },
      // Blue pipe — exits top-left corner, pointing straight down away from hole
      {
        entryX: 310,
        entryY: 590,
        exitX: 130,
        exitY: 100,
        exitAngle: Math.PI / 2,
        color: 0x3399ff,
      },
      // Green pipe — exits pointing straight up at the hole
      {
        entryX: 250,
        entryY: 590,
        exitX: 250,
        exitY: 240,
        exitAngle: -Math.PI / 2,
        color: 0x33cc33,
      },
    ],
  },

  // ---- HOLE 9: The Ice Cream Glide ----
  // L-shaped zigzag with chocolate reflectors and a bumper. Par 3.
  //
  // Leg 1 (vertical): tee at bottom-left, shoot UP along the left lane.
  // Turn: 45° chocolate reflector at the top-left redirects ball RIGHT.
  // Leg 2 (horizontal): ball glides right across the top on ice cream.
  // Cup at top-right (400,140).
  //
  // A gumdrop bumper in the horizontal lane adds risk — hit it and the
  // ball bounces unpredictably. A second reflector near the right wall
  // can redirect overshoots downward.
  //
  // Birdie: aim up with good power, bank off the reflector, ball glides
  // right and stops near the cup. Tap-in for 2.
  // Ace: perfect power + aim sends the ball all the way to the cup.
  {
    id: 9,
    name: 'The Ice Cream Glide',
    par: 3,
    tee: { x: 100, y: 700 },
    cup: { x: 400, y: 140 },
    walls: [
      // Outer boundary
      [
        { x: 50, y: 60 },
        { x: 450, y: 60 },
        { x: 450, y: 770 },
        { x: 50, y: 770 },
        { x: 50, y: 60 },
      ],
      // Horizontal wall blocking direct right-side path from the tee area
      [
        { x: 200, y: 300 },
        { x: 450, y: 300 },
      ],
    ],
    obstacles: [
      // 45° chocolate reflector at top-left — the key bank shot target.
      // Ball going UP hits it and gets redirected RIGHTWARD.
      {
        type: 'block',
        x: 130,
        y: 130,
        width: 80,
        height: 30,
        angle: 0.785,
      },
      // Gumdrop bumper in the horizontal lane — adds excitement.
      // Ball coming from the reflector may hit this and bounce wildly.
      {
        type: 'gumdrop_bumper',
        x: 280,
        y: 110,
        radius: 16,
        color: 0xff69b4,
      },
      // Second gumdrop bumper near the cup for risk/reward
      {
        type: 'gumdrop_bumper',
        x: 420,
        y: 200,
        radius: 16,
        color: 0x87ceeb,
      },
    ],
    slickZones: [
      // Vertical lane ice — ball glides upward from tee to reflector
      { x: 52, y: 130, width: 146, height: 570, color: 0xffecd2 },
      // Horizontal lane ice — ball glides rightward after the reflector
      { x: 130, y: 62, width: 200, height: 100, color: 0xffc0cb },
    ],
    frictionZones: [
      // Cup approach — ball decelerates for a puttable stop
      { x: 330, y: 62, width: 118, height: 236 },
    ],
    waterZones: [
      // Dead-end hazard below the horizontal wall on the right side
      { x: 300, y: 500, width: 148, height: 200, color: 0xff69b4 },
    ],
  },
];
