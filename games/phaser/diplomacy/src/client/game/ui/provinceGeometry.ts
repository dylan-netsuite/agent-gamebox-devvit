/* eslint-disable @typescript-eslint/no-explicit-any */
import { PROVINCES } from '../../../shared/data/provinces';
import mapData from '../data/diplomacy_map.json';

export interface Point {
  x: number;
  y: number;
}

export type Polygon = Point[];

/** Cache for computed province polygons */
let cellCache: Map<string, Polygon> | null = null;

// Map bounds for coordinate transformation
const MIN_LON = -25;
const MAX_LON = 45;
const MIN_LAT = 30;
const MAX_LAT = 75;
const MAP_WIDTH = 1200;
const MAP_HEIGHT = 900;

function transformCoordinate(lon: number, lat: number): Point {
  const x = ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * MAP_WIDTH;
  const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * MAP_HEIGHT;
  return { x, y };
}

/**
 * Get all province polygons from the GeoJSON data.
 * Computed once and cached.
 */
export function getProvinceCells(): Map<string, Polygon> {
  if (cellCache) return cellCache;

  cellCache = new Map();

  // Create a map from province name to ID for faster lookup
  const nameToId = new Map<string, string>();
  for (const [id, province] of Object.entries(PROVINCES)) {
    nameToId.set(province.name, id);
    // Add manual mappings for known discrepancies
    if (id === 'NAO') nameToId.set('North Atlantic', id);
    if (id === 'NTH') nameToId.set('North Sea', id);
    if (id === 'ENG') nameToId.set('English Channel', id);
    if (id === 'MAO') nameToId.set('Mid-Atlantic Ocean', id);
    if (id === 'WES') nameToId.set('Western Mediterranean', id);
    if (id === 'TYS') nameToId.set('Tyrrhenian Sea', id);
    if (id === 'ION') nameToId.set('Ionian Sea', id);
    if (id === 'ADR') nameToId.set('Adriatic Sea', id);
    if (id === 'AEG') nameToId.set('Aegean Sea', id);
    if (id === 'EAS') nameToId.set('Eastern Mediterranean', id);
    if (id === 'BLA') nameToId.set('Black Sea', id);
    if (id === 'BAR') nameToId.set('Barents Sea', id);
    if (id === 'NWG') nameToId.set('Norwegian Sea', id);
    if (id === 'SKA') nameToId.set('Skagerrak', id);
    if (id === 'HEL') nameToId.set('Helgoland Bight', id);
    if (id === 'BAL') nameToId.set('Baltic Sea', id);
    if (id === 'BOT') nameToId.set('Gulf of Bothnia', id);
    if (id === 'GOL') nameToId.set('Gulf of Lyon', id);
    if (id === 'IRI') nameToId.set('Irish Sea', id);
    
    // Country names that might differ
    if (id === 'STP') nameToId.set('St Petersburg', id);
    if (id === 'LVP') nameToId.set('Liverpool', id);
  }

  // Parse GeoJSON features
  const features = (mapData as any).features || [];

  for (const feature of features) {
    const name = feature.properties?.name;
    if (!name) continue;

    const id = nameToId.get(name);
    if (!id) {
      // console.warn(`No province ID found for GeoJSON name: ${name}`);
      continue;
    }

    const geometry = feature.geometry;
    let coordinates: any[] = [];

    if (geometry.type === 'Polygon') {
      coordinates = geometry.coordinates[0]; // Outer ring
    } else if (geometry.type === 'MultiPolygon') {
      // Find the largest polygon by vertex count as a heuristic for main landmass
      let maxLen = 0;
      for (const poly of geometry.coordinates) {
        if (poly[0].length > maxLen) {
          maxLen = poly[0].length;
          coordinates = poly[0];
        }
      }
    }

    if (coordinates && coordinates.length > 0) {
      const polygon: Polygon = coordinates.map((coord: any) => {
        return transformCoordinate(coord[0], coord[1]);
      });
      cellCache.set(id, polygon);
    }
  }

  // Fallback for missing provinces: use simple box around center
  for (const [id, province] of Object.entries(PROVINCES)) {
    if (!cellCache.has(id)) {
      // console.warn(`Missing polygon for province: ${id} (${province.name})`);
      const cx = province.x;
      const cy = province.y;
      const size = 20;
      cellCache.set(id, [
        { x: cx - size, y: cy - size },
        { x: cx + size, y: cy - size },
        { x: cx + size, y: cy + size },
        { x: cx - size, y: cy + size },
      ]);
    }
  }

  return cellCache;
}

/**
 * Test if a point is inside a polygon (ray-casting algorithm).
 */
export function pointInPolygon(point: Point, polygon: Polygon): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const pi = polygon[i]!;
    const pj = polygon[j]!;

    if (pi.y > point.y !== pj.y > point.y &&
        point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Compute the centroid of a polygon (for label placement).
 */
export function polygonCentroid(polygon: Polygon): Point {
  if (polygon.length === 0) return { x: 0, y: 0 };
  let cx = 0;
  let cy = 0;
  let area = 0;
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const pi = polygon[i]!;
    const pj = polygon[(i + 1) % n]!;
    const cross = pi.x * pj.y - pj.x * pi.y;
    area += cross;
    cx += (pi.x + pj.x) * cross;
    cy += (pi.y + pj.y) * cross;
  }

  area /= 2;
  if (Math.abs(area) < 0.001) {
    const avg = polygon.reduce(
      (acc, p) => ({ x: acc.x + p.x / n, y: acc.y + p.y / n }),
      { x: 0, y: 0 }
    );
    return avg;
  }

  cx /= 6 * area;
  cy /= 6 * area;
  return { x: cx, y: cy };
}
