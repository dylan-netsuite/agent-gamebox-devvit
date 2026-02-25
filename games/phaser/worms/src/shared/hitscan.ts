export interface HitscanTarget {
  x: number;
  y: number;
  alive: boolean;
  id?: string;
}

export interface HitscanResult {
  hitX: number;
  hitY: number;
  directHitTarget: HitscanTarget | null;
}

export interface TerrainQuery {
  isSolid(x: number, y: number): boolean;
  getWidth(): number;
  getHeight(): number;
}

export function castHitscanRay(
  originX: number,
  originY: number,
  angle: number,
  terrain: TerrainQuery,
  targets: HitscanTarget[],
  shooterId?: string,
): HitscanResult {
  const maxDist = 1500;
  const step = 2;
  const dx = Math.cos(angle) * step;
  const dy = Math.sin(angle) * step;

  let hitX = originX;
  let hitY = originY;

  for (let d = 0; d < maxDist; d += step) {
    hitX += dx;
    hitY += dy;
    if (hitX < 0 || hitX >= terrain.getWidth() || hitY >= terrain.getHeight()) break;

    for (const target of targets) {
      if (!target.alive) continue;
      if (shooterId !== undefined && target.id === shooterId) continue;
      const wx = target.x;
      const wy = target.y;
      if (hitX >= wx - 10 && hitX <= wx + 10 && hitY >= wy - 2 && hitY <= wy + 22) {
        return { hitX, hitY, directHitTarget: target };
      }
    }

    if (terrain.isSolid(hitX, hitY)) break;
  }

  return { hitX, hitY, directHitTarget: null };
}
