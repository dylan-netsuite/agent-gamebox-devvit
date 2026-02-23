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
}

export interface TerrainColors {
  topSurface: [number, number, number];
  subSurface: [number, number, number];
  deep: [number, number, number];
  skyTop: number;
  skyMid: number;
  skyLow: number;
  skyBottom: number;
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
    description: 'Scattered islands over deep water',
    terrainStyle: {
      minHeight: 0.15,
      maxHeight: 0.6,
      octaves: 4,
      flatness: 0,
      islands: true,
      cavern: false,
    },
    colors: {
      topSurface: [194, 178, 128],
      subSurface: [160, 140, 100],
      deep: [120, 100, 80],
      skyTop: 0x00bcd4,
      skyMid: 0x80deea,
      skyLow: 0xb2ebf2,
      skyBottom: 0x0097a7,
    },
  },
  {
    id: 'cavern',
    name: 'Underground Cavern',
    description: 'Dark cave with stalactites and tight spaces',
    terrainStyle: {
      minHeight: 0.2,
      maxHeight: 0.85,
      octaves: 6,
      flatness: 0,
      islands: false,
      cavern: true,
    },
    colors: {
      topSurface: [100, 100, 110],
      subSurface: [70, 70, 80],
      deep: [50, 45, 55],
      skyTop: 0x1a1a2e,
      skyMid: 0x16213e,
      skyLow: 0x0f3460,
      skyBottom: 0x1a1a2e,
    },
  },
  {
    id: 'flatlands',
    name: 'Flat Arena',
    description: 'Mostly flat terrain — pure aim battles',
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
    description: 'Extreme peaks and deep valleys',
    terrainStyle: {
      minHeight: 0.1,
      maxHeight: 0.9,
      octaves: 4,
      flatness: 0,
      islands: false,
      cavern: false,
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
];

export function getMapPreset(id: string): MapPreset {
  return MAP_PRESETS.find((m) => m.id === id) ?? MAP_PRESETS[0]!;
}
