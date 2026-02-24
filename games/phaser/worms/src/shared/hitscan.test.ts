import { describe, it, expect } from 'vitest';
import {
  castHitscanRay,
  type HitscanTarget,
  type TerrainQuery,
} from './hitscan';

function makeTerrain(
  width = 2400,
  height = 1200,
  solidFn?: (x: number, y: number) => boolean,
): TerrainQuery {
  return {
    isSolid: solidFn ?? (() => false),
    getWidth: () => width,
    getHeight: () => height,
  };
}

function makeTarget(
  x: number,
  y: number,
  id = 'target',
  alive = true,
): HitscanTarget {
  return { x, y, alive, id };
}

describe('castHitscanRay', () => {
  describe('shooter exclusion', () => {
    it('should not hit the shooter', () => {
      const terrain = makeTerrain();
      const shooter = makeTarget(100, 200, 'shooter');
      const enemy = makeTarget(300, 200, 'enemy');
      const result = castHitscanRay(100, 210, 0, terrain, [shooter, enemy], 'shooter');

      expect(result.directHitTarget).not.toBeNull();
      expect(result.directHitTarget!.id).toBe('enemy');
    });

    it('should hit a worm at the origin when no shooterId excludes it', () => {
      const terrain = makeTerrain();
      const worm = makeTarget(100, 200, 'worm');
      const result = castHitscanRay(100, 210, 0, terrain, [worm]);

      expect(result.directHitTarget).not.toBeNull();
      expect(result.directHitTarget!.id).toBe('worm');
    });

    it('should never self-hit regardless of aim angle', () => {
      const terrain = makeTerrain();
      const shooter = makeTarget(500, 400, 'shooter');
      const angles = [0, Math.PI / 4, Math.PI / 2, Math.PI, -Math.PI / 4, -Math.PI / 2];

      for (const angle of angles) {
        const result = castHitscanRay(500, 410, angle, terrain, [shooter], 'shooter');
        expect(result.directHitTarget).toBeNull();
      }
    });
  });

  describe('direct worm hit', () => {
    it('should hit an enemy directly in front', () => {
      const terrain = makeTerrain();
      const enemy = makeTarget(200, 300, 'enemy');
      const result = castHitscanRay(100, 310, 0, terrain, [enemy], 'shooter');

      expect(result.directHitTarget).not.toBeNull();
      expect(result.directHitTarget!.id).toBe('enemy');
      expect(result.hitX).toBeGreaterThanOrEqual(190);
      expect(result.hitX).toBeLessThanOrEqual(210);
    });

    it('should miss an enemy off to the side', () => {
      const terrain = makeTerrain();
      const enemy = makeTarget(200, 100, 'enemy');
      const result = castHitscanRay(100, 310, 0, terrain, [enemy], 'shooter');

      expect(result.directHitTarget).toBeNull();
    });

    it('should skip dead targets', () => {
      const terrain = makeTerrain();
      const dead = makeTarget(200, 300, 'dead', false);
      const result = castHitscanRay(100, 310, 0, terrain, [dead], 'shooter');

      expect(result.directHitTarget).toBeNull();
    });

    it('should hit the closest target when multiple are in line', () => {
      const terrain = makeTerrain();
      const near = makeTarget(200, 300, 'near');
      const far = makeTarget(400, 300, 'far');
      const result = castHitscanRay(100, 310, 0, terrain, [near, far], 'shooter');

      expect(result.directHitTarget).not.toBeNull();
      expect(result.directHitTarget!.id).toBe('near');
    });
  });

  describe('terrain collision', () => {
    it('should stop at solid terrain', () => {
      const terrain = makeTerrain(2400, 1200, (x) => x >= 500);
      const result = castHitscanRay(100, 600, 0, terrain, [], 'shooter');

      expect(result.directHitTarget).toBeNull();
      expect(result.hitX).toBeLessThanOrEqual(502);
      expect(result.hitX).toBeGreaterThanOrEqual(498);
    });

    it('should hit a worm standing on terrain before hitting the terrain', () => {
      const terrain = makeTerrain(2400, 1200, (x, y) => y >= 500);
      const enemy = makeTarget(300, 488, 'enemy');
      const result = castHitscanRay(100, 498, 0, terrain, [enemy], 'shooter');

      expect(result.directHitTarget).not.toBeNull();
      expect(result.directHitTarget!.id).toBe('enemy');
    });
  });

  describe('boundary conditions', () => {
    it('should stop at world boundaries', () => {
      const terrain = makeTerrain(800, 600);
      const result = castHitscanRay(700, 300, 0, terrain, [], 'shooter');

      expect(result.directHitTarget).toBeNull();
      expect(result.hitX).toBeGreaterThanOrEqual(800);
    });

    it('should handle shooting straight up', () => {
      const terrain = makeTerrain();
      const result = castHitscanRay(500, 500, -Math.PI / 2, terrain, [], 'shooter');

      expect(result.directHitTarget).toBeNull();
    });

    it('should handle shooting straight down', () => {
      const terrain = makeTerrain(2400, 1200, (_, y) => y >= 800);
      const result = castHitscanRay(500, 100, Math.PI / 2, terrain, [], 'shooter');

      expect(result.directHitTarget).toBeNull();
      expect(result.hitY).toBeLessThanOrEqual(802);
      expect(result.hitY).toBeGreaterThanOrEqual(798);
    });
  });

  describe('worm hitbox geometry', () => {
    it('should detect hits within the 20x24 hitbox', () => {
      const terrain = makeTerrain();
      const target = makeTarget(500, 400, 'target');
      // Hitbox is [490, 510] x [398, 422]
      // Shoot at the left edge of the hitbox
      const result = castHitscanRay(100, 410, 0, terrain, [target], 'shooter');
      expect(result.directHitTarget).not.toBeNull();
    });

    it('should miss outside the hitbox', () => {
      const terrain = makeTerrain();
      const target = makeTarget(500, 400, 'target');
      // Shoot above the hitbox (wy - 2 = 398, so y=396 is outside)
      const result = castHitscanRay(100, 396, 0, terrain, [target], 'shooter');
      expect(result.directHitTarget).toBeNull();
    });
  });
});
