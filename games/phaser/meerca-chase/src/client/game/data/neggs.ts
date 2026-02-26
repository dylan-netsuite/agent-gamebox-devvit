export interface NeggType {
  id: string;
  name: string;
  points: number;
  color: number;
  highlightColor: number;
  weight: number;
}

export const NEGG_TYPES: NeggType[] = [
  { id: 'blue', name: 'Blue Negg', points: 1, color: 0x4a9eff, highlightColor: 0x7ab8ff, weight: 40 },
  { id: 'green', name: 'Green Negg', points: 2, color: 0x00c853, highlightColor: 0x5efc82, weight: 25 },
  { id: 'yellow', name: 'Yellow Negg', points: 5, color: 0xffd700, highlightColor: 0xffe44d, weight: 18 },
  { id: 'red', name: 'Red Negg', points: 10, color: 0xff4444, highlightColor: 0xff7777, weight: 10 },
  { id: 'rainbow', name: 'Rainbow Negg', points: 20, color: 0xe040fb, highlightColor: 0xea80fc, weight: 4 },
  { id: 'fish', name: 'Fish Negg', points: -5, color: 0x607d8b, highlightColor: 0x90a4ae, weight: 3 },
];

export function pickRandomNegg(): NeggType {
  const totalWeight = NEGG_TYPES.reduce((sum, n) => sum + n.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const negg of NEGG_TYPES) {
    roll -= negg.weight;
    if (roll <= 0) return negg;
  }
  return NEGG_TYPES[0]!;
}
