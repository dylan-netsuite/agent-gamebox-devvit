export interface MapPreset {
  id: string;
  name: string;
  description: string;
  terrainStyle: TerrainStyle;
  colors: TerrainColors;
}

export interface TerrainStyle {
  minHeight: number;
  maxHeight: number;
  octaves: number;
  flatness: number;
  islands: boolean;
  cavern: boolean;
  plateaus?: boolean;
  ridged?: boolean;
  terraced?: number;
  waterLevel?: number;
}

export interface TerrainColors {
  topSurface: [number, number, number];
  subSurface: [number, number, number];
  deep: [number, number, number];
  skyTop: number;
  skyMid: number;
  skyLow: number;
  skyBottom: number;
  waterColor?: [number, number, number];
  waterAlpha?: number;
}

export const MAP_PRESETS: MapPreset[] = [
  {
    id: 'hills',
    name: 'Green Hills',
    description: 'Rolling green hills — the classic battlefield',
    terrainStyle: {
      minHeight: 0.3,
      maxHeight: 0.75,
      octaves: 5,
      flatness: 0,
      islands: false,
      cavern: false,
    },
    colors: {
      topSurface: [76, 175, 80],
      subSurface: [56, 142, 60],
      deep: [121, 85, 72],
      skyTop: 0x1e90ff,
      skyMid: 0x87ceeb,
      skyLow: 0xb0e0e6,
      skyBottom: 0x4682b4,
    },
  },
  {
    id: 'islands',
    name: 'Island Chain',
    description: 'Tropical islands over crystal-clear ocean',
    terrainStyle: {
      minHeight: 0.15,
      maxHeight: 0.6,
      octaves: 4,
      flatness: 0,
      islands: true,
      cavern: false,
      waterLevel: 0.82,
    },
    colors: {
      topSurface: [194, 178, 128],
      subSurface: [160, 140, 100],
      deep: [120, 100, 80],
      skyTop: 0x00bcd4,
      skyMid: 0x80deea,
      skyLow: 0xb2ebf2,
      skyBottom: 0x0097a7,
      waterColor: [30, 120, 200],
      waterAlpha: 0.55,
    },
  },
  {
    id: 'cavern',
    name: 'Underground Cavern',
    description: 'A dark cave with stalactites — watch your head',
    terrainStyle: {
      minHeight: 0.15,
      maxHeight: 0.4,
      octaves: 4,
      flatness: 0.3,
      islands: false,
      cavern: true,
    },
    colors: {
      topSurface: [110, 105, 100],
      subSurface: [80, 75, 70],
      deep: [55, 50, 50],
      skyTop: 0x0a0a14,
      skyMid: 0x10101e,
      skyLow: 0x0a0a14,
      skyBottom: 0x0a0a14,
    },
  },
  {
    id: 'flatlands',
    name: 'Flat Arena',
    description: 'Wide-open plains — nowhere to hide',
    terrainStyle: {
      minHeight: 0.45,
      maxHeight: 0.55,
      octaves: 2,
      flatness: 0.8,
      islands: false,
      cavern: false,
    },
    colors: {
      topSurface: [139, 195, 74],
      subSurface: [104, 159, 56],
      deep: [85, 60, 50],
      skyTop: 0x42a5f5,
      skyMid: 0x90caf9,
      skyLow: 0xbbdefb,
      skyBottom: 0x1e88e5,
    },
  },
  {
    id: 'cliffs',
    name: 'Cliffside',
    description: 'Extreme peaks and plunging valleys',
    terrainStyle: {
      minHeight: 0.1,
      maxHeight: 0.9,
      octaves: 4,
      flatness: 0,
      islands: false,
      cavern: false,
      terraced: 6,
    },
    colors: {
      topSurface: [120, 120, 120],
      subSurface: [90, 85, 80],
      deep: [60, 55, 50],
      skyTop: 0x5c6bc0,
      skyMid: 0x9fa8da,
      skyLow: 0xc5cae9,
      skyBottom: 0x3949ab,
    },
  },
  {
    id: 'desert',
    name: 'Desert Dunes',
    description: 'Sun-scorched sand dunes under a blazing sky',
    terrainStyle: {
      minHeight: 0.35,
      maxHeight: 0.7,
      octaves: 3,
      flatness: 0,
      islands: false,
      cavern: false,
      plateaus: true,
    },
    colors: {
      topSurface: [218, 189, 132],
      subSurface: [194, 160, 100],
      deep: [160, 120, 70],
      skyTop: 0xff7043,
      skyMid: 0xffab91,
      skyLow: 0xffe0b2,
      skyBottom: 0xffa726,
    },
  },
  {
    id: 'tundra',
    name: 'Frozen Tundra',
    description: 'Icy peaks and frozen lakes in a winter storm',
    terrainStyle: {
      minHeight: 0.25,
      maxHeight: 0.8,
      octaves: 5,
      flatness: 0,
      islands: false,
      cavern: false,
      ridged: true,
      waterLevel: 0.88,
    },
    colors: {
      topSurface: [220, 230, 240],
      subSurface: [180, 200, 215],
      deep: [100, 120, 140],
      skyTop: 0x546e7a,
      skyMid: 0x78909c,
      skyLow: 0xb0bec5,
      skyBottom: 0x455a64,
      waterColor: [140, 180, 210],
      waterAlpha: 0.45,
    },
  },
  {
    id: 'volcano',
    name: 'Volcanic Ridge',
    description: 'Charred rock over rivers of molten lava',
    terrainStyle: {
      minHeight: 0.2,
      maxHeight: 0.85,
      octaves: 5,
      flatness: 0,
      islands: false,
      cavern: false,
      ridged: true,
      waterLevel: 0.9,
    },
    colors: {
      topSurface: [70, 60, 55],
      subSurface: [50, 40, 35],
      deep: [35, 25, 20],
      skyTop: 0x4a0000,
      skyMid: 0x8b0000,
      skyLow: 0xb71c1c,
      skyBottom: 0x3e0000,
      waterColor: [255, 90, 0],
      waterAlpha: 0.8,
    },
  },
  {
    id: 'archipelago',
    name: 'Archipelago',
    description: 'Scattered landmasses over shallow seas',
    terrainStyle: {
      minHeight: 0.2,
      maxHeight: 0.65,
      octaves: 6,
      flatness: 0,
      islands: true,
      cavern: false,
      waterLevel: 0.75,
    },
    colors: {
      topSurface: [120, 180, 90],
      subSurface: [90, 140, 70],
      deep: [60, 100, 50],
      skyTop: 0x039be5,
      skyMid: 0x4fc3f7,
      skyLow: 0xb3e5fc,
      skyBottom: 0x0277bd,
      waterColor: [40, 140, 180],
      waterAlpha: 0.5,
    },
  },
  {
    id: 'lunar',
    name: 'Lunar Surface',
    description: 'Barren moonscape with shallow craters',
    terrainStyle: {
      minHeight: 0.4,
      maxHeight: 0.6,
      octaves: 3,
      flatness: 0.4,
      islands: false,
      cavern: false,
      terraced: 8,
    },
    colors: {
      topSurface: [180, 180, 185],
      subSurface: [140, 140, 145],
      deep: [90, 90, 95],
      skyTop: 0x050510,
      skyMid: 0x0a0a1e,
      skyLow: 0x080818,
      skyBottom: 0x020208,
    },
  },
];

/** Real gameplay maps (excludes the "random" meta-option). */
export const PLAYABLE_MAP_PRESETS = MAP_PRESETS;

/** Picks a random playable map id. */
export function randomMapId(): string {
  const idx = Math.floor(Math.random() * PLAYABLE_MAP_PRESETS.length);
  return PLAYABLE_MAP_PRESETS[idx]!.id;
}

export function getMapPreset(id: string): MapPreset {
  return MAP_PRESETS.find((m) => m.id === id) ?? MAP_PRESETS[0]!;
}
