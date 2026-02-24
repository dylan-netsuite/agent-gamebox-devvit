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

    if (style.ridged) {
      value = 1 - Math.abs(value);
      value = value * 2 - 1;
    }

    if (style.flatness > 0) {
      value = value * (1 - style.flatness);
    }

    const normalized = (value + 1) / 2;
    let heightFraction = style.minHeight + normalized * (style.maxHeight - style.minHeight);

    if (style.plateaus) {
      const plateauLevels = 4;
      heightFraction =
        Math.round(heightFraction * plateauLevels) / plateauLevels;
    }

    if (style.terraced != null && style.terraced > 0) {
      const steps = style.terraced;
      heightFraction = Math.round(heightFraction * steps) / steps;
    }

    if (style.islands) {
      const waterThreshold = 0.35;
      if (heightFraction < waterThreshold) {
        const fade = heightFraction / waterThreshold;
        if (fade < 0.7) {
          heightFraction = 0.05;
        } else {
          heightFraction = 0.05 + (heightFraction - waterThreshold * 0.7) * 2;
        }
      }
    }

    heightMap[x] = Math.floor(height * (1 - heightFraction));
  }

  return heightMap;
}

/**
 * Generate a cavern ceiling heightmap (terrain that hangs from top).
 * Returns an array of Y values representing the bottom of the ceiling.
 * The ceiling occupies roughly the top 25-45% of the world, with
 * stalactite-like downward spikes for visual interest.
 */
export function generateCeilingMap(
  width: number,
  height: number,
  seed: number,
  floorMap?: number[],
): number[] {
  const rng = seededRandom(seed + 9999);
  const ceilingMap = new Array<number>(width);

  const layers: { frequency: number; amplitude: number; phase: number }[] = [];
  let totalAmplitude = 0;
  for (let i = 0; i < 5; i++) {
    const amplitude = 1 / (i + 1);
    totalAmplitude += amplitude;
    layers.push({
      frequency: (i + 1) * 0.003 + rng() * 0.002,
      amplitude,
      phase: rng() * Math.PI * 2,
    });
  }

  // Stalactite layer — higher frequency spikes that hang down
  const stalactiteFreq = 0.025 + rng() * 0.015;
  const stalactitePhase = rng() * Math.PI * 2;

  for (let x = 0; x < width; x++) {
    let value = 0;
    for (const layer of layers) {
      value += Math.sin(x * layer.frequency + layer.phase) * layer.amplitude;
    }
    value /= totalAmplitude;
    const normalized = (value + 1) / 2;

    // Base ceiling: 25-40% of height
    let depth = 0.25 + normalized * 0.15;

    // Add stalactites: occasional narrow downward spikes
    const stalVal = Math.sin(x * stalactiteFreq + stalactitePhase);
    if (stalVal > 0.6) {
      const spike = (stalVal - 0.6) / 0.4; // 0..1
      depth += spike * 0.12;
    }

    let ceilY = Math.floor(height * depth);

    // Enforce minimum gap above the floor (at least 20% of world height)
    if (floorMap) {
      const minGap = Math.floor(height * 0.20);
      const floorY = floorMap[x]!;
      if (ceilY > floorY - minGap) {
        ceilY = floorY - minGap;
      }
    }

    ceilingMap[x] = Math.max(Math.floor(height * 0.08), ceilY);
  }

  return ceilingMap;
}
