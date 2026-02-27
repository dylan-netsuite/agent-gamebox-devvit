import * as Phaser from 'phaser';
import { generateHeightMap, generateCeilingMap } from './TerrainGenerator';
import type { Crater } from '../../../shared/types/game';
import type { MapPreset } from '../../../shared/types/maps';
import { getMapPreset } from '../../../shared/types/maps';

function hashNoise(x: number, y: number, seed: number): number {
  let h = seed + x * 374761393 + y * 668265263;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

export class TerrainEngine {
  private scene: Phaser.Scene;
  private collisionMask: Uint8Array;
  private renderTexture: Phaser.GameObjects.RenderTexture;
  private terrainWidth: number;
  private terrainHeight: number;
  private heightMap: number[];
  private dirty = true;
  private mapPreset: MapPreset;
  private recentCraters: Crater[] = [];
  private seed: number;
  private redrawScheduled = false;
  private persistentCanvas: HTMLCanvasElement | null = null;
  private dirtyMinX = 0;
  private dirtyMinY = 0;
  private dirtyMaxX = 0;
  private dirtyMaxY = 0;
  private fullRedrawNeeded = true;

  constructor(
    scene: Phaser.Scene,
    width: number,
    height: number,
    seed: number,
    mapId?: string,
  ) {
    this.scene = scene;
    this.terrainWidth = width;
    this.terrainHeight = height;
    this.seed = seed;
    this.collisionMask = new Uint8Array(width * height);
    this.mapPreset = getMapPreset(mapId ?? 'hills');

    this.heightMap = generateHeightMap({
      width,
      height,
      seed,
      style: this.mapPreset.terrainStyle,
    });
    this.buildCollisionMask(seed);

    this.renderTexture = scene.add.renderTexture(0, 0, width, height);
    this.renderTexture.setOrigin(0, 0);
    this.redraw();
  }

  getMapPreset(): MapPreset {
    return this.mapPreset;
  }

  private ceilingMap: number[] | null = null;

  private buildCollisionMask(seed: number): void {
    this.collisionMask.fill(0);
    for (let x = 0; x < this.terrainWidth; x++) {
      const surfaceY = this.heightMap[x]!;
      for (let y = surfaceY; y < this.terrainHeight; y++) {
        this.collisionMask[y * this.terrainWidth + x] = 1;
      }
    }

    if (this.mapPreset.terrainStyle.cavern) {
      this.ceilingMap = generateCeilingMap(
        this.terrainWidth,
        this.terrainHeight,
        seed,
        this.heightMap,
      );
      for (let x = 0; x < this.terrainWidth; x++) {
        const ceilY = this.ceilingMap[x]!;
        for (let y = 0; y < ceilY; y++) {
          this.collisionMask[y * this.terrainWidth + x] = 1;
        }
      }
    }
  }

  isSolid(x: number, y: number): boolean {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= this.terrainWidth || iy < 0 || iy >= this.terrainHeight) {
      return iy >= this.terrainHeight;
    }
    return this.collisionMask[iy * this.terrainWidth + ix] === 1;
  }

  getSurfaceY(x: number): number {
    const ix = Math.max(0, Math.min(Math.floor(x), this.terrainWidth - 1));
    const w = this.terrainWidth;

    let y = 0;
    // Skip any initial solid region (cavern ceiling)
    while (y < this.terrainHeight && this.collisionMask[y * w + ix] === 1) {
      y++;
    }
    // Now in empty space — find the next solid region (floor)
    while (y < this.terrainHeight && this.collisionMask[y * w + ix] === 0) {
      y++;
    }
    return y < this.terrainHeight ? y : this.terrainHeight;
  }

  addCrater(cx: number, cy: number, radius: number): void {
    this.recentCraters.push({ x: cx, y: cy, radius });
    this.carve(cx, cy, radius);
  }

  getRecentCraters(): Crater[] {
    const craters = [...this.recentCraters];
    this.recentCraters = [];
    return craters;
  }

  carve(cx: number, cy: number, radius: number): void {
    const r2 = radius * radius;
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(this.terrainWidth - 1, Math.ceil(cx + radius));
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(this.terrainHeight - 1, Math.ceil(cy + radius));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) {
          this.collisionMask[y * this.terrainWidth + x] = 0;
        }
      }
    }
    this.dirty = true;

    const margin = 4;
    const rMinX = Math.max(0, minX - margin);
    const rMinY = Math.max(0, minY - margin);
    const rMaxX = Math.min(this.terrainWidth - 1, maxX + margin);
    const rMaxY = Math.min(this.terrainHeight - 1, maxY + margin);
    if (this.fullRedrawNeeded) return;
    this.dirtyMinX = Math.min(this.dirtyMinX, rMinX);
    this.dirtyMinY = Math.min(this.dirtyMinY, rMinY);
    this.dirtyMaxX = Math.max(this.dirtyMaxX, rMaxX);
    this.dirtyMaxY = Math.max(this.dirtyMaxY, rMaxY);
  }

  scheduleRedraw(): void {
    if (this.redrawScheduled) return;
    this.redrawScheduled = true;
    requestAnimationFrame(() => {
      this.redrawScheduled = false;
      this.redraw();
    });
  }

  applyCraters(craters: Crater[]): void {
    for (const c of craters) {
      this.carve(c.x, c.y, c.radius);
    }
  }

  redraw(): void {
    if (!this.dirty && this.renderTexture.texture.key !== '__DEFAULT') return;

    const w = this.terrainWidth;
    const h = this.terrainHeight;
    const c = this.mapPreset.colors;

    if (this.fullRedrawNeeded || !this.persistentCanvas) {
      this.fullRedrawNeeded = false;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      this.persistentCanvas = canvas;
      const ctxObj = canvas.getContext('2d')!;
      const imageData = ctxObj.createImageData(w, h);
      this.renderRegion(imageData.data, 0, 0, w - 1, h - 1, c, w);
      if (!this.mapPreset.terrainStyle.cavern) {
        this.addGrassTufts(imageData.data, w, h, c.topSurface);
      }
      ctxObj.putImageData(imageData, 0, 0);
    } else {
      const rX = this.dirtyMinX;
      const rY = this.dirtyMinY;
      const rW = this.dirtyMaxX - rX + 1;
      const rH = this.dirtyMaxY - rY + 1;
      if (rW > 0 && rH > 0) {
        const ctxObj = this.persistentCanvas.getContext('2d')!;
        const patch = ctxObj.createImageData(rW, rH);
        this.renderRegionPatch(patch.data, rX, rY, this.dirtyMaxX, this.dirtyMaxY, c, w, rW);
        ctxObj.putImageData(patch, rX, rY);
      }
    }

    this.dirtyMinX = w;
    this.dirtyMinY = h;
    this.dirtyMaxX = 0;
    this.dirtyMaxY = 0;

    if (this.scene.textures.exists('__canvas_terrain')) {
      this.scene.textures.remove('__canvas_terrain');
    }
    this.scene.textures.addCanvas('__canvas_terrain', this.persistentCanvas);
    this.renderTexture.clear();
    this.renderTexture.drawFrame('__canvas_terrain');

    this.dirty = false;
  }

  private renderRegion(
    data: Uint8ClampedArray,
    minX: number, minY: number, maxX: number, maxY: number,
    c: MapPreset['colors'], stride: number,
  ): void {
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const idx = y * stride + x;
        const pixIdx = idx * 4;
        this.renderPixel(data, pixIdx, x, y, c, stride);
      }
    }
  }

  private renderRegionPatch(
    data: Uint8ClampedArray,
    minX: number, minY: number, maxX: number, maxY: number,
    c: MapPreset['colors'], stride: number, patchW: number,
  ): void {
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const pIdx = ((y - minY) * patchW + (x - minX)) * 4;
        this.renderPixel(data, pIdx, x, y, c, stride);
      }
    }
  }

  private renderPixel(
    data: Uint8ClampedArray, pixIdx: number,
    x: number, y: number,
    c: MapPreset['colors'], w: number,
  ): void {
    const idx = y * w + x;
    if (this.collisionMask[idx] === 1) {
      const isCeiling = this.ceilingMap != null && y < this.ceilingMap[x]!;
      const surfaceY = this.findLocalSurface(x, y);
      const depth = y - surfaceY;
      const noise = hashNoise(x, y, this.seed);
      const variation = (noise - 0.5) * 16;
      const isEdge = this.isTerrainEdge(x, y);
      const edgeBrightness = isEdge ? 15 : 0;

      if (isCeiling) {
        const ceilDepth = this.ceilingMap ? this.ceilingMap[x]! - y : 0;
        const ceilShade = Math.max(0.4, 1 - ceilDepth * 0.003);
        data[pixIdx] = clamp(c.deep[0] * 0.7 * ceilShade + variation * 0.2 + edgeBrightness * 0.5);
        data[pixIdx + 1] = clamp(c.deep[1] * 0.7 * ceilShade + variation * 0.2 + edgeBrightness * 0.5);
        data[pixIdx + 2] = clamp((c.deep[2] + 15) * ceilShade + variation * 0.15);
        data[pixIdx + 3] = 255;
      } else if (depth <= 2) {
        const grassNoise = hashNoise(x, depth, this.seed + 100);
        data[pixIdx] = clamp(c.topSurface[0] + variation * 0.5 + grassNoise * 10 + edgeBrightness);
        data[pixIdx + 1] = clamp(c.topSurface[1] + variation * 0.3 + grassNoise * 8 + edgeBrightness);
        data[pixIdx + 2] = clamp(c.topSurface[2] + variation * 0.3);
        data[pixIdx + 3] = 255;
      } else if (depth <= 6) {
        data[pixIdx] = clamp(c.subSurface[0] + variation * 0.4 + edgeBrightness * 0.5);
        data[pixIdx + 1] = clamp(c.subSurface[1] + variation * 0.4 + edgeBrightness * 0.5);
        data[pixIdx + 2] = clamp(c.subSurface[2] + variation * 0.3);
        data[pixIdx + 3] = 255;
      } else {
        const shade = Math.max(0.3, 1 - depth * 0.002);
        data[pixIdx] = clamp(c.deep[0] * shade + variation * 0.3);
        data[pixIdx + 1] = clamp(c.deep[1] * shade + variation * 0.3);
        data[pixIdx + 2] = clamp(c.deep[2] * shade + variation * 0.2);
        data[pixIdx + 3] = 255;
      }
    } else {
      data[pixIdx] = 0;
      data[pixIdx + 1] = 0;
      data[pixIdx + 2] = 0;
      data[pixIdx + 3] = 0;
    }
  }

  private isTerrainEdge(x: number, y: number): boolean {
    if (x <= 0 || x >= this.terrainWidth - 1 || y <= 0 || y >= this.terrainHeight - 1)
      return false;
    const w = this.terrainWidth;
    return (
      this.collisionMask[(y - 1) * w + x] === 0 ||
      this.collisionMask[(y + 1) * w + x] === 0 ||
      this.collisionMask[y * w + x - 1] === 0 ||
      this.collisionMask[y * w + x + 1] === 0
    );
  }

  private addGrassTufts(
    data: Uint8ClampedArray,
    w: number,
    h: number,
    surfaceColor: [number, number, number],
  ): void {
    const tufSpacing = 8;
    for (let x = 2; x < w - 2; x += tufSpacing) {
      const noise = hashNoise(x, 0, this.seed + 500);
      if (noise < 0.4) continue;

      for (let y = 1; y < h - 1; y++) {
        const below = this.collisionMask[y * w + x];
        const above = this.collisionMask[(y - 1) * w + x];
        if (below === 1 && above === 0) {
          const tufHeight = 1 + Math.floor(noise * 3);
          const tufWidth = 1 + Math.floor(hashNoise(x, 1, this.seed + 501) * 2);
          for (let ty = 1; ty <= tufHeight; ty++) {
            const py = y - ty;
            if (py < 0) break;
            for (let tx = -tufWidth; tx <= tufWidth; tx++) {
              const px = x + tx;
              if (px < 0 || px >= w) continue;
              if (this.collisionMask[py * w + px] === 1) continue;
              const pIdx = (py * w + px) * 4;
              const brighten = (1 - ty / (tufHeight + 1)) * 30;
              data[pIdx] = clamp(surfaceColor[0] + brighten - 10);
              data[pIdx + 1] = clamp(surfaceColor[1] + brighten + 10);
              data[pIdx + 2] = clamp(surfaceColor[2] - 15);
              data[pIdx + 3] = Math.floor(200 * (1 - ty / (tufHeight + 2)));
            }
          }
          break;
        }
      }
    }
  }

  private findLocalSurface(x: number, y: number): number {
    for (let sy = y; sy >= 0; sy--) {
      if (this.collisionMask[sy * this.terrainWidth + x] === 0) {
        return sy + 1;
      }
    }
    return 0;
  }

  getWidth(): number {
    return this.terrainWidth;
  }

  getHeight(): number {
    return this.terrainHeight;
  }

  getRenderTexture(): Phaser.GameObjects.RenderTexture {
    return this.renderTexture;
  }

  destroy(): void {
    this.renderTexture.destroy();
    if (this.scene.textures.exists('__canvas_terrain')) {
      this.scene.textures.remove('__canvas_terrain');
    }
  }
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}
