export interface TerrainConfig {
  width: number;
  height: number;
  seed: number;
  waterLevel: number;
  groundColor: string;
  dirtColor: string;
}

export const DEFAULT_TERRAIN_CONFIG: TerrainConfig = {
  width: 2400,
  height: 1200,
  seed: 0,
  waterLevel: 1100,
  groundColor: '#4CAF50',
  dirtColor: '#795548',
};
