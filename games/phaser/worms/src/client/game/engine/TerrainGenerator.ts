import type { TerrainStyle } from '../../../shared/types/maps';

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export interface HeightMapOptions {
  width: number;
  height: number;
  seed: number;
  style?: TerrainStyle;
}

const DEFAULT_STYLE: TerrainStyle = {
  minHeight: 0.3,
  maxHeight: 0.75,
  octaves: 5,
  flatness: 0,
  islands: false,
  cavern: false,
};

export function generateHeightMap(opts: Partial<HeightMapOptions> = {}): number[] {
  const width = opts.width ?? 2400;
  const height = opts.height ?? 1200;
  const seed = opts.seed ?? 42;
  const style = opts.style ?? DEFAULT_STYLE;
  const rng = seededRandom(seed);

  const heightMap = new Array<number>(width);

  const layers: { frequency: number; amplitude: number; phase: number }[] = [];
  let totalAmplitude = 0;
  for (let i = 0; i < style.octaves; i++) {
    const amplitude = 1 / (i + 1);
    totalAmplitude += amplitude;
    layers.push({
      frequency: (i + 1) * 0.003 + rng() * 0.002,
      amplitude,
      phase: rng() * Math.PI * 2,
    });
  }

  for (let x = 0; x < width; x++) {
    let value = 0;
    for (const layer of layers) {
      value += Math.sin(x * layer.frequency + layer.phase) * layer.amplitude;
    }
    value /= totalAmplitude;

    // Flatness: lerp toward 0 (center)
    if (style.flatness > 0) {
      value = value * (1 - style.flatness);
    }

    const normalized = (value + 1) / 2;
    let heightFraction = style.minHeight + normalized * (style.maxHeight - style.minHeight);

    // Islands: carve gaps below a water threshold
    if (style.islands) {
      const waterThreshold = 0.35;
      if (heightFraction < waterThreshold) {
        heightFraction = 0.05;
      }
    }

    heightMap[x] = Math.floor(height * (1 - heightFraction));
  }

  return heightMap;
}

/**
 * Generate a cavern ceiling heightmap (terrain that hangs from top).
 * Returns an array of Y values representing the bottom of the ceiling.
 */
export function generateCeilingMap(
  width: number,
  height: number,
  seed: number,
): number[] {
  const rng = seededRandom(seed + 9999);
  const ceilingMap = new Array<number>(width);

  const layers: { frequency: number; amplitude: number; phase: number }[] = [];
  let totalAmplitude = 0;
  for (let i = 0; i < 4; i++) {
    const amplitude = 1 / (i + 1);
    totalAmplitude += amplitude;
    layers.push({
      frequency: (i + 1) * 0.004 + rng() * 0.003,
      amplitude,
      phase: rng() * Math.PI * 2,
    });
  }

  for (let x = 0; x < width; x++) {
    let value = 0;
    for (const layer of layers) {
      value += Math.sin(x * layer.frequency + layer.phase) * layer.amplitude;
    }
    value /= totalAmplitude;
    const normalized = (value + 1) / 2;
    // Ceiling hangs from top 5% to 25% of the world
    const depth = 0.05 + normalized * 0.2;
    ceilingMap[x] = Math.floor(height * depth);
  }

  return ceilingMap;
}
