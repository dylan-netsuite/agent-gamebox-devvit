import * as Phaser from 'phaser';
import { generateHeightMap, generateCeilingMap } from './TerrainGenerator';
import type { Crater } from '../../../shared/types/game';
import type { MapPreset } from '../../../shared/types/maps';
import { getMapPreset } from '../../../shared/types/maps';

export class TerrainEngine {
  private scene: Phaser.Scene;
  private collisionMask: Uint8Array;
  private renderTexture: Phaser.GameObjects.RenderTexture;
  private terrainWidth: number;
  private terrainHeight: number;
  private heightMap: number[];
  private dirty = true;
  private mapPreset: MapPreset;

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

  private buildCollisionMask(seed: number): void {
    this.collisionMask.fill(0);
    for (let x = 0; x < this.terrainWidth; x++) {
      const surfaceY = this.heightMap[x]!;
      for (let y = surfaceY; y < this.terrainHeight; y++) {
        this.collisionMask[y * this.terrainWidth + x] = 1;
      }
    }

    if (this.mapPreset.terrainStyle.cavern) {
      const ceilingMap = generateCeilingMap(
        this.terrainWidth,
        this.terrainHeight,
        seed,
      );
      for (let x = 0; x < this.terrainWidth; x++) {
        const ceilY = ceilingMap[x]!;
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
    for (let y = 0; y < this.terrainHeight; y++) {
      if (this.collisionMask[y * this.terrainWidth + ix] === 1) {
        return y;
      }
    }
    return this.terrainHeight;
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
  }

  applyCraters(craters: Crater[]): void {
    for (const c of craters) {
      this.carve(c.x, c.y, c.radius);
    }
  }

  redraw(): void {
    if (!this.dirty && this.renderTexture.texture.key !== '__DEFAULT') return;

    const canvas = document.createElement('canvas');
    canvas.width = this.terrainWidth;
    canvas.height = this.terrainHeight;
    const ctxObj = canvas.getContext('2d')!;

    const imageData = ctxObj.createImageData(this.terrainWidth, this.terrainHeight);
    const data = imageData.data;
    const c = this.mapPreset.colors;

    for (let y = 0; y < this.terrainHeight; y++) {
      for (let x = 0; x < this.terrainWidth; x++) {
        const idx = y * this.terrainWidth + x;
        const pixIdx = idx * 4;

        if (this.collisionMask[idx] === 1) {
          const surfaceY = this.findLocalSurface(x, y);
          const depth = y - surfaceY;

          if (depth <= 2) {
            data[pixIdx] = c.topSurface[0];
            data[pixIdx + 1] = c.topSurface[1];
            data[pixIdx + 2] = c.topSurface[2];
            data[pixIdx + 3] = 255;
          } else if (depth <= 6) {
            data[pixIdx] = c.subSurface[0];
            data[pixIdx + 1] = c.subSurface[1];
            data[pixIdx + 2] = c.subSurface[2];
            data[pixIdx + 3] = 255;
          } else {
            const shade = Math.max(0.3, 1 - depth * 0.002);
            data[pixIdx] = Math.floor(c.deep[0] * shade);
            data[pixIdx + 1] = Math.floor(c.deep[1] * shade);
            data[pixIdx + 2] = Math.floor(c.deep[2] * shade);
            data[pixIdx + 3] = 255;
          }
        } else {
          data[pixIdx] = 0;
          data[pixIdx + 1] = 0;
          data[pixIdx + 2] = 0;
          data[pixIdx + 3] = 0;
        }
      }
    }

    ctxObj.putImageData(imageData, 0, 0);

    this.renderTexture.clear();
    this.renderTexture.drawFrame('__canvas_terrain');

    if (this.scene.textures.exists('__canvas_terrain')) {
      this.scene.textures.remove('__canvas_terrain');
    }
    this.scene.textures.addCanvas('__canvas_terrain', canvas);
    this.renderTexture.clear();
    this.renderTexture.drawFrame('__canvas_terrain');

    this.dirty = false;
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
