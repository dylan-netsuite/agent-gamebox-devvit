/**
 * Procedural terrain heightmap generator using layered sine waves
 * with a seeded PRNG for deterministic generation across clients.
 */

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
  minHeight: number;
  maxHeight: number;
  octaves: number;
}

const DEFAULT_OPTIONS: HeightMapOptions = {
  width: 2400,
  height: 1200,
  seed: 42,
  minHeight: 0.3,
  maxHeight: 0.75,
  octaves: 5,
};

export function generateHeightMap(opts: Partial<HeightMapOptions> = {}): number[] {
  const o = { ...DEFAULT_OPTIONS, ...opts };
  const rng = seededRandom(o.seed);
  const heightMap = new Array<number>(o.width);

  const layers: { frequency: number; amplitude: number; phase: number }[] = [];
  let totalAmplitude = 0;
  for (let i = 0; i < o.octaves; i++) {
    const amplitude = 1 / (i + 1);
    totalAmplitude += amplitude;
    layers.push({
      frequency: (i + 1) * 0.003 + rng() * 0.002,
      amplitude,
      phase: rng() * Math.PI * 2,
    });
  }

  for (let x = 0; x < o.width; x++) {
    let value = 0;
    for (const layer of layers) {
      value += Math.sin(x * layer.frequency + layer.phase) * layer.amplitude;
    }
    value /= totalAmplitude;

    const normalized = (value + 1) / 2;
    const heightFraction = o.minHeight + normalized * (o.maxHeight - o.minHeight);
    heightMap[x] = Math.floor(o.height * (1 - heightFraction));
  }

  return heightMap;
}
