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
  // S-curve with diagonal wall bank shots and a water hazard. Par 3.
  //
  // Leg 1 (vertical): tee at bottom-left, shoot UP along the icy left lane.
  // Turn 1: diagonal wall at top-left redirects ball RIGHTWARD.
  // Leg 2 (horizontal): ball glides right across the icy top lane.
  // Turn 2: diagonal wall at top-right redirects ball DOWNWARD.
  // Leg 3 (vertical): ball descends the right lane on normal turf to the cup.
  //
  // No ice on leg 3 — player needs precise power to reach the cup.
  // Water hazard below the horizontal wall punishes errant shots.
  // Small taffy pond near the cup forces precise approach shots.
  // Gumdrop bumper near the cup adds risk/reward on the approach.
  //
  // HOLE-IN-ONE ROUTE: A narrow ~35-unit gap (x:190-225) in the horizontal
  // wall allows a hero shot from the tee. Aim up-right with full power to
  // thread the needle. The water hazard sits directly below the gap,
  // punishing near-misses. Extremely difficult but rewarding.
  {
    id: 9,
    name: 'The Ice Cream Glide',
    par: 3,
    tee: { x: 100, y: 700 },
    cup: { x: 400, y: 350 },
    walls: [
      // Outer boundary with diagonal corners for ball redirection
      [
        { x: 50, y: 200 },
        { x: 200, y: 60 },
        { x: 300, y: 60 },
        { x: 450, y: 200 },
        { x: 450, y: 770 },
        { x: 50, y: 770 },
        { x: 50, y: 200 },
      ],
      // Left portion of horizontal wall — closes off most of the left side
      [
        { x: 50, y: 450 },
        { x: 190, y: 450 },
      ],
      // Right portion of horizontal wall — main barrier forcing the S-curve
      // Gap between x:190 and x:225 (~35 units) allows a difficult hole-in-one
      [
        { x: 225, y: 450 },
        { x: 450, y: 450 },
      ],
    ],
    obstacles: [
      // Gumdrop bumper on the right-side approach to the cup
      {
        type: 'gumdrop_bumper',
        x: 420,
        y: 310,
        radius: 16,
        color: 0xff69b4,
      },
    ],
    slickZones: [
      // Left lane ice — ball glides upward from tee toward diagonal wall (stops before horizontal wall)
      { x: 52, y: 200, width: 146, height: 248, color: 0xffecd2 },
      // Top lane ice — ball glides rightward across the top after wall bank
      { x: 200, y: 62, width: 100, height: 140, color: 0xffc0cb },
    ],
    frictionZones: [
      // Cup approach — ball decelerates for a puttable stop
      { x: 340, y: 300, width: 108, height: 120 },
    ],
    waterZones: [
      // Water hazard — right side below the wall, punishes shots that miss the gap rightward
      { x: 300, y: 480, width: 140, height: 100, color: 0xff69b4 },
      // Small taffy pond near the cup — punishes overshooting the approach
      { x: 340, y: 220, width: 80, height: 60, color: 0xff85c1 },
    ],
  },

  // ---- HOLE 10: The Sour Tongues ----
  // Narrow corridor gauntlet with kinematic tongue blocks. Par 4.
  //
  // A long, claustrophobic central corridor (150 units wide) runs from
  // tee to cup. Six sour candy "tongues" extend and retract from the
  // walls on alternating sine-wave timers. When a tongue strikes the
  // ball, it gets knocked sideways into the sand trap gutters.
  //
  // Strategy: blast through with frame-perfect timing (risky), or lay
  // up in the safe zones between tongue pairs for a controlled par.
  {
    id: 10,
    name: 'The Sour Tongues',
    par: 4,
    tee: { x: 250, y: 720 },
    cup: { x: 250, y: 130 },
    walls: [
      // Outer boundary
      [
        { x: 70, y: 60 },
        { x: 430, y: 60 },
        { x: 430, y: 770 },
        { x: 70, y: 770 },
        { x: 70, y: 60 },
      ],
      // Left corridor wall
      [
        { x: 175, y: 100 },
        { x: 175, y: 750 },
      ],
      // Right corridor wall
      [
        { x: 325, y: 100 },
        { x: 325, y: 750 },
      ],
    ],
    obstacles: [
      // Tongue pair 1 (bottom) — left then right, slowest
      {
        type: 'tongue',
        x: 175,
        y: 640,
        width: 80,
        height: 18,
        speed: 0.5,
        forceX: 1,
        angle: 0,
      },
      {
        type: 'tongue',
        x: 245,
        y: 560,
        width: 80,
        height: 18,
        speed: 0.5,
        forceX: -1,
        angle: Math.PI,
      },
      // Tongue pair 2 (middle)
      {
        type: 'tongue',
        x: 175,
        y: 480,
        width: 80,
        height: 18,
        speed: 0.6,
        forceX: 1,
        angle: Math.PI * 0.5,
      },
      {
        type: 'tongue',
        x: 245,
        y: 400,
        width: 80,
        height: 18,
        speed: 0.6,
        forceX: -1,
        angle: Math.PI * 1.5,
      },
      // Tongue pair 3 (top) — slightly faster
      {
        type: 'tongue',
        x: 175,
        y: 320,
        width: 80,
        height: 18,
        speed: 0.7,
        forceX: 1,
        angle: Math.PI * 0.25,
      },
      {
        type: 'tongue',
        x: 245,
        y: 240,
        width: 80,
        height: 18,
        speed: 0.7,
        forceX: -1,
        angle: Math.PI * 1.25,
      },
    ],
    frictionZones: [
      // Left sand gutter
      { x: 72, y: 62, width: 101, height: 706 },
      // Right sand gutter
      { x: 327, y: 62, width: 101, height: 706 },
      // Cup approach — ball decelerates near the hole
      { x: 200, y: 100, width: 100, height: 60 },
    ],
  },

  // ---- HOLE 11: The Corkscrew Cannon ----
  // Ice runway into cannon, then a hard right-angle dogleg to the cup.
  // Cannon shoots ball upward; the corridor bends RIGHT forcing a bank shot.
  // No sand around the cup — overshoot into the water behind it.
  {
    id: 11,
    name: 'The Corkscrew Cannon',
    par: 3,
    tee: { x: 200, y: 730 },
    cup: { x: 410, y: 155 },
    walls: [
      // Vertical corridor — left wall
      [
        { x: 140, y: 770 },
        { x: 140, y: 110 },
      ],
      // Vertical corridor — right wall (stops at dogleg opening)
      [
        { x: 270, y: 770 },
        { x: 270, y: 230 },
      ],
      // Top wall — runs across the whole width above the dogleg
      [
        { x: 140, y: 110 },
        { x: 460, y: 110 },
      ],
      // Bottom wall of horizontal corridor (dogleg floor)
      [
        { x: 270, y: 230 },
        { x: 460, y: 230 },
      ],
      // Right wall of horizontal corridor
      [
        { x: 460, y: 110 },
        { x: 460, y: 230 },
      ],
      // Bottom of vertical corridor
      [
        { x: 140, y: 770 },
        { x: 270, y: 770 },
      ],
    ],
    obstacles: [
      {
        type: 'cannon',
        x: 200,
        y: 500,
        width: 38,
        height: 160,
        speed: 2.8,
      },
      // Pre-cannon bumper — forces aim adjustment on approach
      {
        type: 'gumdrop_bumper',
        x: 220,
        y: 620,
        radius: 14,
      },
      // Post-cannon bumper — aligned with cannon exit (x:200) to guarantee impact
      // Offset slightly left so ball hits right side and deflects RIGHT
      {
        type: 'gumdrop_bumper',
        x: 197,
        y: 150,
        radius: 18,
      },
      // Second ricochet bumper — catches deflection and redirects toward cup
      {
        type: 'gumdrop_bumper',
        x: 330,
        y: 165,
        radius: 14,
      },
    ],
    slickZones: [
      // Ice runway from tee to cannon
      { x: 142, y: 550, width: 126, height: 210, color: 0xadd8e6 },
    ],
    frictionZones: [
      // Small sand trap on inside of the dogleg corner
      { x: 270, y: 180, width: 55, height: 48 },
    ],
    waterZones: [
      // Water past the cup (right side of horizontal corridor, behind cup)
      { x: 462, y: 110, width: 35, height: 120, color: 0x69b4ff },
      // Water above the top wall
      { x: 60, y: 40, width: 435, height: 68, color: 0x69b4ff },
      // Water left of vertical corridor
      { x: 60, y: 110, width: 78, height: 660, color: 0x69b4ff },
      // Water right of horizontal corridor
      { x: 462, y: 232, width: 35, height: 100, color: 0x69b4ff },
      // Water right of vertical corridor (below dogleg opening)
      { x: 272, y: 300, width: 70, height: 470, color: 0x69b4ff },
      // Water below the bottom wall
      { x: 60, y: 772, width: 280, height: 25, color: 0x69b4ff },
    ],
  },

  // ---- HOLE 12: The Conveyor Belt Matrix ----
  // Wall-guided snake path: 4 horizontal conveyor legs push the ball left/right.
  // Internal walls with gaps at alternating ends force the ball to zigzag.
  // Vertical corridor barriers separate each gap from its adjacent water hazard.
  // No vertical conveyors — walls do the turning, conveyors do the pushing.
  //
  // Layout (bottom to top, tee clear of HUD at y=690):
  //   Tee (250,690) → open approach
  //   Leg A (y=570-650, x=90-410) → RIGHT    gap on RIGHT
  //   Leg B (y=420-500, x=90-410) → LEFT     gap on LEFT
  //   Leg C (y=270-350, x=90-410) → RIGHT    gap on RIGHT
  //   Leg D (y=120-200, x=90-410) → LEFT     toward cup
  //   Cup (140, 160)
  {
    id: 12,
    name: 'The Conveyor Belt Matrix',
    par: 4,
    tee: { x: 250, y: 690 },
    cup: { x: 140, y: 160 },
    walls: [
      // Outer boundary
      [
        { x: 80, y: 55 },
        { x: 80, y: 730 },
      ],
      [
        { x: 420, y: 55 },
        { x: 420, y: 730 },
      ],
      [
        { x: 80, y: 55 },
        { x: 420, y: 55 },
      ],
      [
        { x: 80, y: 730 },
        { x: 420, y: 730 },
      ],

      // Internal divider walls between legs (with gaps at alternating sides)

      // Between Leg A (→) and Leg B (←): gap on RIGHT (x=350..420)
      [
        { x: 80, y: 500 },
        { x: 350, y: 500 },
      ],

      // Between Leg B (←) and Leg C (→): gap on LEFT (x=80..150)
      [
        { x: 150, y: 350 },
        { x: 420, y: 350 },
      ],

      // Between Leg C (→) and Leg D (←): gap on RIGHT (x=350..420)
      [
        { x: 80, y: 200 },
        { x: 350, y: 200 },
      ],

      // Top wall above Leg D
      [
        { x: 80, y: 110 },
        { x: 420, y: 110 },
      ],

      // Corridor barriers — vertical walls separating gap corridors from water

      // Channel A→B gap (x=350..420): barrier on LEFT at x=350
      [
        { x: 350, y: 500 },
        { x: 350, y: 570 },
      ],

      // Channel B→C gap (x=80..150): barrier on RIGHT at x=150
      [
        { x: 150, y: 350 },
        { x: 150, y: 420 },
      ],

      // Channel C→D gap (x=350..420): barrier on LEFT at x=350
      [
        { x: 350, y: 200 },
        { x: 350, y: 270 },
      ],
    ],
    obstacles: [
      // === WALL-GUIDED CONVEYOR SNAKE PATH ===
      // 4 horizontal legs with gentle force. Walls redirect the ball at each end.

      // Leg A: y=570..650, pushes RIGHT →
      { type: 'conveyor', x: 90, y: 570, width: 320, height: 80, forceX: 2, forceY: 0 },

      // Leg B: y=420..500, pushes LEFT ←
      { type: 'conveyor', x: 90, y: 420, width: 320, height: 80, forceX: -2, forceY: 0 },

      // Leg C: y=270..350, pushes RIGHT →
      { type: 'conveyor', x: 90, y: 270, width: 320, height: 80, forceX: 2, forceY: 0 },

      // Leg D: y=120..200, pushes LEFT ← toward cup
      { type: 'conveyor', x: 90, y: 120, width: 320, height: 80, forceX: -2, forceY: 0 },
    ],
    waterZones: [
      // Channel A→B (y=500..570): gap on RIGHT (x=350..420), water on LEFT
      { x: 82, y: 502, width: 268, height: 66, color: 0x69b4ff },

      // Channel B→C (y=350..420): gap on LEFT (x=80..150), water on RIGHT
      { x: 152, y: 352, width: 266, height: 66, color: 0x69b4ff },

      // Channel C→D (y=200..270): gap on RIGHT (x=350..420), water on LEFT
      { x: 82, y: 202, width: 268, height: 66, color: 0x69b4ff },
    ],
  },

  // ---- HOLE 13: The Flavour Grabber (The Claw) ----
  // Zigzag stepping-stone layout — no straight line from tee to cup.
  // Bottom bridge is LEFT-offset, top bridge is RIGHT-offset, forcing doglegs.
  // Claw patrols the middle platform area fast with a large shadow.
  //
  // Layout (bottom to top):
  //   Bottom platform (150-350, 600-700) with tee at (250, 670)
  //     gap at top-left: x=160..220 for left bridge
  //   Left bridge (160-220, 460-600) — narrow corridor (left side)
  //   Middle platform (120-380, 340-460) — wide staging area
  //     gap at bottom-left: x=160..220 for left bridge
  //     gap at top-right: x=300..360 for right bridge
  //   Right bridge (300-360, 220-340) — narrow corridor (right side)
  //   Cup island (140-380, 150-220) with cup at (190, 185) on the LEFT
  //     gap at bottom-right: x=300..360 for right bridge
  {
    id: 13,
    name: 'The Flavour Grabber',
    par: 4,
    tee: { x: 250, y: 670 },
    cup: { x: 190, y: 185 },
    walls: [
      // === Bottom platform (150-350, 600-700) ===
      [{ x: 150, y: 700 }, { x: 350, y: 700 }],
      [{ x: 150, y: 600 }, { x: 150, y: 700 }],
      [{ x: 350, y: 600 }, { x: 350, y: 700 }],
      // Top edge — split for LEFT bridge gap (160..220)
      [{ x: 150, y: 600 }, { x: 160, y: 600 }],
      [{ x: 220, y: 600 }, { x: 350, y: 600 }],

      // === Left bridge (160-220, 460-600) ===
      [{ x: 160, y: 460 }, { x: 160, y: 600 }],
      [{ x: 220, y: 460 }, { x: 220, y: 600 }],

      // === Middle platform (120-380, 340-460) ===
      [{ x: 120, y: 340 }, { x: 120, y: 460 }],
      [{ x: 380, y: 340 }, { x: 380, y: 460 }],
      // Bottom edge — split for LEFT bridge gap (160..220)
      [{ x: 120, y: 460 }, { x: 160, y: 460 }],
      [{ x: 220, y: 460 }, { x: 380, y: 460 }],
      // Top edge — split for RIGHT bridge gap (300..360)
      [{ x: 120, y: 340 }, { x: 300, y: 340 }],
      [{ x: 360, y: 340 }, { x: 380, y: 340 }],

      // === Right bridge (300-360, 220-340) ===
      [{ x: 300, y: 220 }, { x: 300, y: 340 }],
      [{ x: 360, y: 220 }, { x: 360, y: 340 }],

      // === Cup island (140-380, 150-220), cup at LEFT (190, 185) ===
      [{ x: 140, y: 150 }, { x: 380, y: 150 }],
      [{ x: 140, y: 150 }, { x: 140, y: 220 }],
      [{ x: 380, y: 150 }, { x: 380, y: 220 }],
      // Bottom edge — split for RIGHT bridge gap (300..360)
      [{ x: 140, y: 220 }, { x: 300, y: 220 }],
      [{ x: 360, y: 220 }, { x: 380, y: 220 }],
    ],
    obstacles: [
      { type: 'claw', x: 250, y: 400, width: 160, height: 130, radius: 45, speed: 0.35 },
      // Bumpers placed per user screenshot (green stars)
      { type: 'gumdrop_bumper', x: 300, y: 170, radius: 12 },   // Cup island, right side
      { type: 'gumdrop_bumper', x: 200, y: 400, radius: 12 },   // Middle platform, left
      { type: 'gumdrop_bumper', x: 335, y: 375, radius: 12 },   // Middle platform, right
      { type: 'gumdrop_bumper', x: 250, y: 610, radius: 12 },   // Bottom platform, near bridge
      { type: 'gumdrop_bumper', x: 220, y: 680, radius: 12 },   // Bottom platform, near tee
    ],
  },

  // ---- HOLE 14: Gravity Wells and Black Holes ----
  // Surreal space-themed par 4 with spinning gravity vortexes.
  // Irregular angular boundary — NOT a rectangle. Diagonal walls create
  // a winding path with chicanes. Three powerful gravity wells at each
  // turn; slingshot around them or get swallowed. Bumpers at key corners.
  //
  // Shape: Irregular polygon — wide bottom, narrow diagonal channel mid,
  //        wide upper chamber. Diagonal internal walls force non-obvious angles.
  {
    id: 14,
    name: 'Gravity Wells',
    par: 4,
    tee: { x: 250, y: 720 },
    cup: { x: 400, y: 100 },
    walls: [
      // === Outer boundary — irregular angular shape ===
      // Bottom edge (wide)
      [{ x: 80, y: 760 }, { x: 420, y: 760 }],
      // Right side — steps inward at mid-height
      [{ x: 420, y: 760 }, { x: 440, y: 600 }],
      [{ x: 440, y: 600 }, { x: 380, y: 440 }],
      [{ x: 380, y: 440 }, { x: 440, y: 280 }],
      [{ x: 440, y: 280 }, { x: 450, y: 70 }],
      // Top edge (angled)
      [{ x: 450, y: 70 }, { x: 280, y: 60 }],
      [{ x: 280, y: 60 }, { x: 60, y: 80 }],
      // Left side — steps inward creating alcoves
      [{ x: 60, y: 80 }, { x: 70, y: 250 }],
      [{ x: 70, y: 250 }, { x: 120, y: 420 }],
      [{ x: 120, y: 420 }, { x: 80, y: 580 }],
      [{ x: 80, y: 580 }, { x: 80, y: 760 }],

      // === Internal diagonal walls — create chicanes ===
      // Diagonal wall #1: blocks direct upward shot from tee, forces right
      [{ x: 140, y: 580 }, { x: 310, y: 520 }],
      // Diagonal wall #2: blocks direct path through center, forces left
      [{ x: 200, y: 380 }, { x: 380, y: 320 }],
      // Diagonal wall #3: guards cup approach, forces slingshot around Well C
      [{ x: 160, y: 200 }, { x: 330, y: 140 }],
    ],
    obstacles: [
      // Well A — lower right, near diagonal wall #1 gap; slingshot right around it
      { type: 'gravity_well', x: 350, y: 560, radius: 60, speed: 0.0015 },
      // Well B — center left, near diagonal wall #2 gap; slingshot left around it
      { type: 'gravity_well', x: 160, y: 340, radius: 55, speed: 0.0018 },
      // Well C — upper area, guards the cup approach
      { type: 'gravity_well', x: 370, y: 200, radius: 55, speed: 0.002 },
      // Bumpers at key turning points — each a different color
      { type: 'gumdrop_bumper', x: 130, y: 650, radius: 12, color: 0x00ddff },   // Cyan — left of tee
      { type: 'gumdrop_bumper', x: 400, y: 450, radius: 12, color: 0xff44aa },   // Hot pink — right chicane
      { type: 'gumdrop_bumper', x: 120, y: 290, radius: 12, color: 0x44ff44 },   // Lime — left alcove
      { type: 'gumdrop_bumper', x: 340, y: 100, radius: 12, color: 0xffaa00 },   // Orange — cup approach
    ],
  },

  // ---- HOLE 15: The Cascading Plinko Board ----
  // Chaotic par 4 inspired by pachinko/plinko machines.
  // Tee at top, cup at bottom center surrounded by sand traps.
  // Entire fairway has constant downward force (steep slope).
  // Dense staggered grid of small high-restitution pegs causes chaotic bouncing.
  // Deterministic physics means a precise angle/power combo can navigate perfectly.
  {
    id: 15,
    name: 'The Plinko Board',
    par: 4,
    tee: { x: 250, y: 80 },
    cup: { x: 250, y: 720 },
    walls: [
      // Outer boundary — tall narrow rectangle
      [{ x: 80, y: 40 }, { x: 420, y: 40 }],    // Top
      [{ x: 80, y: 40 }, { x: 80, y: 770 }],     // Left
      [{ x: 420, y: 40 }, { x: 420, y: 770 }],   // Right
      [{ x: 80, y: 770 }, { x: 420, y: 770 }],   // Bottom
      // Funnel walls at the bottom to guide ball toward cup/traps
      [{ x: 80, y: 660 }, { x: 180, y: 700 }],   // Left funnel
      [{ x: 420, y: 660 }, { x: 320, y: 700 }],   // Right funnel
    ],
    obstacles: [
      // Downward slope — covers the entire peg field
      { type: 'ramp', x: 80, y: 120, width: 340, height: 540, forceX: 0, forceY: 4 },

      // === PEG FIELD — staggered grid ===
      // Pegs are small (radius 5), high restitution bumpers
      // Rows spaced ~45 units apart vertically, pegs ~50 apart horizontally
      // Even rows offset by 25 units for staggered pattern

      // Row 1 (y=160)
      { type: 'bumper', x: 130, y: 160, radius: 5, color: 0xffcc00 },
      { type: 'bumper', x: 180, y: 160, radius: 5, color: 0xffcc00 },
      { type: 'bumper', x: 230, y: 160, radius: 5, color: 0xffcc00 },
      { type: 'bumper', x: 280, y: 160, radius: 5, color: 0xffcc00 },
      { type: 'bumper', x: 330, y: 160, radius: 5, color: 0xffcc00 },
      { type: 'bumper', x: 380, y: 160, radius: 5, color: 0xffcc00 },

      // Row 2 (y=205) — offset
      { type: 'bumper', x: 105, y: 205, radius: 5, color: 0xff9933 },
      { type: 'bumper', x: 155, y: 205, radius: 5, color: 0xff9933 },
      { type: 'bumper', x: 205, y: 205, radius: 5, color: 0xff9933 },
      { type: 'bumper', x: 255, y: 205, radius: 5, color: 0xff9933 },
      { type: 'bumper', x: 305, y: 205, radius: 5, color: 0xff9933 },
      { type: 'bumper', x: 355, y: 205, radius: 5, color: 0xff9933 },
      { type: 'bumper', x: 405, y: 205, radius: 5, color: 0xff9933 },

      // Row 3 (y=250)
      { type: 'bumper', x: 130, y: 250, radius: 5, color: 0xff6666 },
      { type: 'bumper', x: 180, y: 250, radius: 5, color: 0xff6666 },
      { type: 'bumper', x: 230, y: 250, radius: 5, color: 0xff6666 },
      { type: 'bumper', x: 280, y: 250, radius: 5, color: 0xff6666 },
      { type: 'bumper', x: 330, y: 250, radius: 5, color: 0xff6666 },
      { type: 'bumper', x: 380, y: 250, radius: 5, color: 0xff6666 },

      // Row 4 (y=295) — offset
      { type: 'bumper', x: 105, y: 295, radius: 5, color: 0xff44cc },
      { type: 'bumper', x: 155, y: 295, radius: 5, color: 0xff44cc },
      { type: 'bumper', x: 205, y: 295, radius: 5, color: 0xff44cc },
      { type: 'bumper', x: 255, y: 295, radius: 5, color: 0xff44cc },
      { type: 'bumper', x: 305, y: 295, radius: 5, color: 0xff44cc },
      { type: 'bumper', x: 355, y: 295, radius: 5, color: 0xff44cc },
      { type: 'bumper', x: 405, y: 295, radius: 5, color: 0xff44cc },

      // Row 5 (y=340)
      { type: 'bumper', x: 130, y: 340, radius: 5, color: 0xcc44ff },
      { type: 'bumper', x: 180, y: 340, radius: 5, color: 0xcc44ff },
      { type: 'bumper', x: 230, y: 340, radius: 5, color: 0xcc44ff },
      { type: 'bumper', x: 280, y: 340, radius: 5, color: 0xcc44ff },
      { type: 'bumper', x: 330, y: 340, radius: 5, color: 0xcc44ff },
      { type: 'bumper', x: 380, y: 340, radius: 5, color: 0xcc44ff },

      // Row 6 (y=385) — offset
      { type: 'bumper', x: 105, y: 385, radius: 5, color: 0x44aaff },
      { type: 'bumper', x: 155, y: 385, radius: 5, color: 0x44aaff },
      { type: 'bumper', x: 205, y: 385, radius: 5, color: 0x44aaff },
      { type: 'bumper', x: 255, y: 385, radius: 5, color: 0x44aaff },
      { type: 'bumper', x: 305, y: 385, radius: 5, color: 0x44aaff },
      { type: 'bumper', x: 355, y: 385, radius: 5, color: 0x44aaff },
      { type: 'bumper', x: 405, y: 385, radius: 5, color: 0x44aaff },

      // Row 7 (y=430)
      { type: 'bumper', x: 130, y: 430, radius: 5, color: 0x44ffaa },
      { type: 'bumper', x: 180, y: 430, radius: 5, color: 0x44ffaa },
      { type: 'bumper', x: 230, y: 430, radius: 5, color: 0x44ffaa },
      { type: 'bumper', x: 280, y: 430, radius: 5, color: 0x44ffaa },
      { type: 'bumper', x: 330, y: 430, radius: 5, color: 0x44ffaa },
      { type: 'bumper', x: 380, y: 430, radius: 5, color: 0x44ffaa },

      // Row 8 (y=475) — offset
      { type: 'bumper', x: 105, y: 475, radius: 5, color: 0xaaff44 },
      { type: 'bumper', x: 155, y: 475, radius: 5, color: 0xaaff44 },
      { type: 'bumper', x: 205, y: 475, radius: 5, color: 0xaaff44 },
      { type: 'bumper', x: 255, y: 475, radius: 5, color: 0xaaff44 },
      { type: 'bumper', x: 305, y: 475, radius: 5, color: 0xaaff44 },
      { type: 'bumper', x: 355, y: 475, radius: 5, color: 0xaaff44 },
      { type: 'bumper', x: 405, y: 475, radius: 5, color: 0xaaff44 },

      // Row 9 (y=520)
      { type: 'bumper', x: 130, y: 520, radius: 5, color: 0xffcc00 },
      { type: 'bumper', x: 180, y: 520, radius: 5, color: 0xffcc00 },
      { type: 'bumper', x: 230, y: 520, radius: 5, color: 0xffcc00 },
      { type: 'bumper', x: 280, y: 520, radius: 5, color: 0xffcc00 },
      { type: 'bumper', x: 330, y: 520, radius: 5, color: 0xffcc00 },
      { type: 'bumper', x: 380, y: 520, radius: 5, color: 0xffcc00 },

      // Row 10 (y=565) — offset
      { type: 'bumper', x: 105, y: 565, radius: 5, color: 0xff9933 },
      { type: 'bumper', x: 155, y: 565, radius: 5, color: 0xff9933 },
      { type: 'bumper', x: 205, y: 565, radius: 5, color: 0xff9933 },
      { type: 'bumper', x: 255, y: 565, radius: 5, color: 0xff9933 },
      { type: 'bumper', x: 305, y: 565, radius: 5, color: 0xff9933 },
      { type: 'bumper', x: 355, y: 565, radius: 5, color: 0xff9933 },
      { type: 'bumper', x: 405, y: 565, radius: 5, color: 0xff9933 },

      // Row 11 (y=610)
      { type: 'bumper', x: 130, y: 610, radius: 5, color: 0xff6666 },
      { type: 'bumper', x: 180, y: 610, radius: 5, color: 0xff6666 },
      { type: 'bumper', x: 230, y: 610, radius: 5, color: 0xff6666 },
      { type: 'bumper', x: 280, y: 610, radius: 5, color: 0xff6666 },
      { type: 'bumper', x: 330, y: 610, radius: 5, color: 0xff6666 },
      { type: 'bumper', x: 380, y: 610, radius: 5, color: 0xff6666 },

      // Row 12 (y=650) — last row before funnel, offset
      { type: 'bumper', x: 155, y: 650, radius: 5, color: 0xff44cc },
      { type: 'bumper', x: 205, y: 650, radius: 5, color: 0xff44cc },
      { type: 'bumper', x: 255, y: 650, radius: 5, color: 0xff44cc },
      { type: 'bumper', x: 305, y: 650, radius: 5, color: 0xff44cc },
      { type: 'bumper', x: 355, y: 650, radius: 5, color: 0xff44cc },
    ],
    frictionZones: [
      // Sand traps flanking the cup at bottom
      { x: 82, y: 700, width: 108, height: 68 },    // Left sand
      { x: 310, y: 700, width: 108, height: 68 },    // Right sand
    ],
  },

  // ---- HOLE 16: The Invisible Maze ----
  // Psychologically taxing par 4. Appears as a wide-open, empty green.
  // Hidden inside: a labyrinth of invisible walls that flash white on impact.
  // Player must map the maze through trial, error, and spatial memory.
  //
  // Design space: outer walls 50-450 x 50-750 (400 wide, 700 tall)
  // All invisible walls are centered at (x,y) with given width/height.
  // Actual span: [x-w/2 .. x+w/2] horizontal, [y-h/2 .. y+h/2] vertical.
  //
  // VERIFIED solution path:
  //   Tee (120,100) — in zone A (top-left, x:50-240, y:50-176)
  //   1. Shoot DOWN through zone A to zone B (x:50-240, y:184-296)
  //      Gap in H1 at x:50-240 (left side) lets ball pass.
  //   2. Shoot RIGHT from zone B into zone C (x:260-450, y:184-296)
  //      Gap in V1 at y:240-300 lets ball cross the center.
  //   3. Shoot DOWN from zone C into zone D (x:260-450, y:304-416)
  //      Gap in H2 at x:260-450 (right side) lets ball pass.
  //   4. Shoot LEFT from zone D into zone E (x:50-240, y:304-416)
  //      Gap in V2 at y:350-420 lets ball cross the center.
  //   5. Shoot DOWN from zone E into zone F (x:50-240, y:424-536)
  //      Gap in H3 at x:50-240 (left side) lets ball pass.
  //   6. Shoot RIGHT from zone F into zone G (x:260-450, y:424-536)
  //      Gap in V3 at y:470-540 lets ball cross the center.
  //   7. Shoot DOWN from zone G into zone H (x:260-450, y:544-636)
  //      Gap in H4 at x:260-450 (right side) lets ball pass.
  //   8. Shoot LEFT to squeeze through the gap at x:270-310 in H5+trap (y=640).
  //      H5 blocks x:310-450, trap blocks x:130-270. Gap: x:270-310 (40 units).
  //   9. From below H5 (y:644+), putt RIGHT into cup at (380,680).
  {
    id: 16,
    name: 'The Invisible Maze',
    par: 4,
    tee: { x: 120, y: 100 },
    cup: { x: 380, y: 680 },
    walls: [
      // Outer boundary — large open rectangle
      [{ x: 50, y: 50 }, { x: 450, y: 50 }],     // Top
      [{ x: 50, y: 50 }, { x: 50, y: 750 }],      // Left
      [{ x: 450, y: 50 }, { x: 450, y: 750 }],    // Right
      [{ x: 50, y: 750 }, { x: 450, y: 750 }],    // Bottom
    ],
    obstacles: [
      // === INVISIBLE MAZE WALLS — VERIFIED SOLVABLE ===
      //
      // Horizontal barriers span HALF the width with alternating gaps.
      // Vertical dividers have gaps to let the ball cross at the right moment.
      //
      // H = horizontal barrier, V = vertical divider
      // Each H blocks half, gap on the other half.
      // Each V blocks a vertical stretch with a gap to cross.

      // H1 (y=180): RIGHT half blocks, LEFT half is the gap
      // Spans x:250-450 (width 200, centered at 350)
      // Gap: x:50-250 (ball can pass on the left)
      { type: 'invisible_wall', x: 350, y: 180, width: 200, height: 8 },

      // V1 — vertical divider at x=250, between H1 and H2
      // Blocks y:180-240, gap at y:240-300
      // Ball in left corridor must cross RIGHT through the gap
      { type: 'invisible_wall', x: 250, y: 206, width: 8, height: 56 },

      // H2 (y=300): LEFT half blocks, RIGHT half is the gap
      // Spans x:50-250 (width 200, centered at 150)
      // Gap: x:250-450 (ball can pass on the right)
      { type: 'invisible_wall', x: 150, y: 300, width: 200, height: 8 },

      // V2 — vertical divider at x=250, between H2 and H3
      // Blocks y:300-350, gap at y:350-420
      // Ball in right corridor must cross LEFT through the gap
      { type: 'invisible_wall', x: 250, y: 321, width: 8, height: 46 },

      // H3 (y=420): RIGHT half blocks, LEFT half is the gap
      // Spans x:250-450 (width 200, centered at 350)
      // Gap: x:50-250 (ball can pass on the left)
      { type: 'invisible_wall', x: 350, y: 420, width: 200, height: 8 },

      // V3 — vertical divider at x=250, between H3 and H4
      // Blocks y:420-470, gap at y:470-540
      // Ball in left corridor must cross RIGHT through the gap
      { type: 'invisible_wall', x: 250, y: 441, width: 8, height: 46 },

      // H4 (y=540): LEFT half blocks, RIGHT half is the gap
      // Spans x:50-250 (width 200, centered at 150)
      // Gap: x:250-450 (ball can pass on the right)
      { type: 'invisible_wall', x: 150, y: 540, width: 200, height: 8 },

      // H5 (y=640): RIGHT side blocks, narrow gap at x:270-310
      // Spans x:310-450 (width 140, centered at 380)
      // Combined with the trap wall below, only a 40-unit gap at x:270-310
      { type: 'invisible_wall', x: 380, y: 640, width: 140, height: 8 },

      // --- Dead-end traps to punish careless shots ---
      // Blocks direct south through the center (catches straight shots from tee)
      { type: 'invisible_wall', x: 250, y: 130, width: 8, height: 100 },
      // Horizontal trap near the cup area (blocks left side of H5 gap approach)
      // Spans x:130-270 (width 140, centered at 200)
      { type: 'invisible_wall', x: 200, y: 640, width: 140, height: 8 },
    ],
  },

  // ---- HOLE 17: The Moving Island Sequence ----
  // Grueling par 5 across a vast water void.
  // Five small platforms move laterally at different unsynchronized speeds.
  // Ball must hop between moving islands to reach a narrow green.
  //
  // Layout (500x800 design space):
  //   Tee platform: top-left (40-180, 50-130), open bottom
  //   5 islands spread y:180-650, speeds 0.35-0.75
  //   Green platform: bottom-right (350-460, 700-760), open top for entry
  //   Cup at (400, 730)
  //   Wide water hazards on left and right edges
  {
    id: 17,
    name: 'Moving Islands',
    par: 5,
    tee: { x: 110, y: 90 },
    cup: { x: 400, y: 730 },
    walls: [
      // Outer boundary
      [{ x: 30, y: 40 }, { x: 470, y: 40 }],
      [{ x: 30, y: 40 }, { x: 30, y: 770 }],
      [{ x: 470, y: 40 }, { x: 470, y: 770 }],
      [{ x: 30, y: 770 }, { x: 470, y: 770 }],
      // Tee platform walls (top-left safe zone, open bottom for exit)
      [{ x: 40, y: 50 }, { x: 190, y: 50 }],
      [{ x: 190, y: 50 }, { x: 190, y: 130 }],
      // Green platform walls (narrow, open top for entry)
      [{ x: 350, y: 700 }, { x: 350, y: 760 }],
      [{ x: 350, y: 760 }, { x: 460, y: 760 }],
    ],
    obstacles: [
      // Island 1: slow, widest — easiest to land on
      { type: 'moving_island', x: 120, y: 180, width: 90, height: 40, targetX: 380, speed: 0.35, color: 0x66cc66 },
      // Island 2: medium speed, slightly narrower
      { type: 'moving_island', x: 370, y: 300, width: 85, height: 38, targetX: 130, speed: 0.45, color: 0x44aaff },
      // Island 3: medium-fast, opposite direction
      { type: 'moving_island', x: 140, y: 420, width: 80, height: 35, targetX: 360, speed: 0.55, color: 0xffaa44 },
      // Island 4: fast, narrower
      { type: 'moving_island', x: 360, y: 540, width: 75, height: 35, targetX: 140, speed: 0.65, color: 0xff66aa },
      // Island 5: fastest, narrowest — hardest to land on
      { type: 'moving_island', x: 150, y: 650, width: 70, height: 32, targetX: 350, speed: 0.75, color: 0xcc44ff },
    ],
    waterZones: [
      // Left hazard — wide
      { x: 30, y: 130, width: 90, height: 570 },
      // Right hazard — wide
      { x: 390, y: 130, width: 80, height: 570 },
    ],
  },

  // ---- HOLE 18: The Jawbreaker Centrifuge ----
  // Two routes from a shared tee area at the top.
  //
  // Tee area (y:40-130): Open, no water. Tee at center (250,90).
  //   Divider wall at y:130 with gaps for Route A (x:30-180) and Route B (x:290-430).
  //
  // Route A (left): Dogleg corridor. Leg 1 (x:30-180, y:130-350) has windmill.
  //   Dogleg at y:350, Leg 2 (x:120-280, y:350-600) has tongues + bumpers.
  //   NO water overlaps Route A — water only in the void between routes.
  //
  // Route B (right, x:290-430): 140px wide corridor with a dry entry platform
  //   (y:130-260) where the ball can safely land. Below y:260, the corridor floor
  //   is water and the moving bridge (140px wide, 60px tall) oscillates y:260-580.
  //   Ball rides the bridge across the water to the green.
  //
  // Green (y:600-730): Both routes converge. Cup at (360, 680) — below bridge
  //   center with clear space. Bumpers guard Route A's approach.
  {
    id: 18,
    name: 'The Jawbreaker Centrifuge',
    par: 4,
    tee: { x: 250, y: 90 },
    cup: { x: 360, y: 680 },
    walls: [
      // Outer boundary — extra bottom padding (y:750)
      [{ x: 30, y: 40 }, { x: 470, y: 40 }],
      [{ x: 30, y: 40 }, { x: 30, y: 750 }],
      [{ x: 470, y: 40 }, { x: 470, y: 750 }],
      [{ x: 30, y: 750 }, { x: 470, y: 750 }],

      // === TEE AREA DIVIDER at y:130 ===
      // Gap left (x:30-180) for Route A, gap right (x:290-430) for Route B
      [{ x: 180, y: 130 }, { x: 290, y: 130 }],
      [{ x: 430, y: 130 }, { x: 470, y: 130 }],

      // === ROUTE A: Dogleg Gauntlet (left) ===
      // Leg 1: x:30-180, y:130-350
      [{ x: 180, y: 130 }, { x: 180, y: 350 }],
      // Dogleg bottom wall with gap at x:120-180
      [{ x: 30, y: 350 }, { x: 120, y: 350 }],
      // Leg 2: x:120-280, y:350-600
      [{ x: 120, y: 390 }, { x: 120, y: 530 }],
      [{ x: 280, y: 350 }, { x: 280, y: 600 }],

      // === ROUTE B: Bridge corridor (x:290-430, y:130-600) ===
      // 140px wide — easy to enter from tee area.
      // Dry platform y:130-260, water floor y:260-600.
      [{ x: 290, y: 130 }, { x: 290, y: 600 }],
      [{ x: 430, y: 130 }, { x: 430, y: 600 }],
    ],
    obstacles: [
      // === CORNER BUMPERS ===
      { type: 'bumper', x: 50, y: 60, radius: 12, color: 0x4488ff },
      { type: 'bumper', x: 450, y: 60, radius: 12, color: 0x4488ff },
      { type: 'bumper', x: 50, y: 335, radius: 12, color: 0x4488ff },
      { type: 'bumper', x: 50, y: 730, radius: 12, color: 0x4488ff },

      // === ROUTE A ===
      { type: 'windmill', x: 105, y: 240, bladeCount: 2, bladeLength: 65, speed: 1.8 },
      { type: 'tongue', x: 120, y: 450, width: 70, height: 14, forceX: 1, speed: 0.6, angle: 0 },
      { type: 'tongue', x: 200, y: 450, width: 70, height: 14, forceX: -1, speed: 0.6, angle: Math.PI },
      { type: 'bumper', x: 160, y: 500, radius: 12, color: 0xff2266 },
      { type: 'bumper', x: 240, y: 490, radius: 10, color: 0xffaa00 },

      // === ROUTE B: Moving Bridge ===
      // 140px wide × 60px tall, fills the corridor width.
      // Starts at y:260 (bottom of dry platform) and rides to y:580 (near green).
      // Speed 0.35 — slow enough for the ball to ride safely.
      { type: 'moving_bridge', x: 290, y: 260, width: 140, height: 60, targetY: 580, speed: 0.35 },

      // === GREEN — bumpers guard Route A's left approach ===
      { type: 'gumdrop_bumper', x: 250, y: 650, radius: 16, color: 0xff44cc },
      { type: 'bumper', x: 200, y: 670, radius: 12, color: 0xff2266 },
      { type: 'bumper', x: 300, y: 680, radius: 12, color: 0xffaa00 },
    ],
    waterZones: [
      // Upper void: between Leg 1 right wall (x:180) and corridor left wall (x:290)
      // Only y:130-350, stays clear of Leg 2 area
      { x: 180, y: 130, width: 110, height: 220 },
      // Lower void: between Leg 2 right wall (x:280) and corridor left wall (x:290)
      // y:350-600 — narrow 10px strip
      { x: 280, y: 350, width: 10, height: 250 },
      // Water INSIDE bridge corridor — only the hazard section (y:260-600)
      // Dry platform at y:130-260 lets the ball enter safely
      { x: 290, y: 260, width: 140, height: 340 },
      // Water right of corridor
      { x: 430, y: 130, width: 40, height: 470 },
    ],
  },
];
