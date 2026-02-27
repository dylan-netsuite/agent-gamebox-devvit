import type { Country } from './game';

export type ProvinceType = 'inland' | 'coastal' | 'water';

export interface Province {
  id: string;
  name: string;
  type: ProvinceType;
  supplyCenter: boolean;
  homeCountry?: Country;
  coasts?: string[];
  x: number;
  y: number;
}

export interface AdjacencyEntry {
  /** Province IDs this province is adjacent to for armies */
  army: string[];
  /** Province IDs this province is adjacent to for fleets */
  fleet: string[];
  /** Specific coast adjacencies for provinces with multiple coasts */
  coastFleet?: Record<string, string[]>;
}

export type ProvinceMap = Record<string, Province>;
export type AdjacencyMap = Record<string, AdjacencyEntry>;
