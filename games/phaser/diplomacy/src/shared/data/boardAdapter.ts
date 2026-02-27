import { boardPolygons, waterOverlays } from './board.generated';
import { PROVINCES } from './provinces';

type Point = { x: number; y: number };

const GENERATED_TO_PROVINCE: Record<string, string> = {
  NRG: 'NWG',
  NAT: 'NAO',
  MID: 'MAO',
  NWY: 'NOR',
};

const PROVINCE_TO_GENERATED: Record<string, string> = {};
for (const [gen, prov] of Object.entries(GENERATED_TO_PROVINCE)) {
  PROVINCE_TO_GENERATED[prov] = gen;
}

export function getProvincePolygons(): Record<string, Point[]> {
  const result: Record<string, Point[]> = {};

  for (const [genId, polygon] of Object.entries(boardPolygons)) {
    const provinceId = GENERATED_TO_PROVINCE[genId] ?? genId;
    const nonPlayable = new Set(['SWI', 'IRE', 'SIC', 'COR']);
    if (PROVINCES[provinceId] || nonPlayable.has(genId)) {
      result[provinceId] = polygon;
    }
  }

  return result;
}

export function getWaterOverlays(): Point[][] {
  return waterOverlays;
}

export { PROVINCE_TO_GENERATED, GENERATED_TO_PROVINCE };
