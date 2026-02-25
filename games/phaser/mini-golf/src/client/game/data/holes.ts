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
        { x: 350, y: 40 },
        { x: 450, y: 40 },
        { x: 450, y: 560 },
        { x: 350, y: 560 },
        { x: 350, y: 40 },
      ],
    ],
    obstacles: [],
  },
];
