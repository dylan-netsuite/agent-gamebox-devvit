import * as Phaser from 'phaser';
import { generateHeightMap } from './TerrainGenerator';
import type { Crater } from '../../../shared/types/game';

/**
 * Bitmap-based destructible terrain engine.
 *
 * Maintains a collision mask (Uint8Array) where 1 = solid, 0 = empty.
 * Renders terrain to a Phaser RenderTexture with grass-top and dirt layers.
 * Supports carving circular craters for explosions.
 */
export class TerrainEngine {
  private scene: Phaser.Scene;
  private collisionMask: Uint8Array;
  private renderTexture: Phaser.GameObjects.RenderTexture;
  private terrainWidth: number;
  private terrainHeight: number;
  private heightMap: number[];
  private dirty = true;

  constructor(scene: Phaser.Scene, width: number, height: number, seed: number) {
    this.scene = scene;
    this.terrainWidth = width;
    this.terrainHeight = height;
    this.collisionMask = new Uint8Array(width * height);

    this.heightMap = generateHeightMap({ width, height, seed });
    this.buildCollisionMask();

    this.renderTexture = scene.add.renderTexture(0, 0, width, height);
    this.renderTexture.setOrigin(0, 0);
    this.redraw();
  }

  private buildCollisionMask(): void {
    this.collisionMask.fill(0);
    for (let x = 0; x < this.terrainWidth; x++) {
      const surfaceY = this.heightMap[x]!;
      for (let y = surfaceY; y < this.terrainHeight; y++) {
        this.collisionMask[y * this.terrainWidth + x] = 1;
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
    const ctx = canvas.getContext('2d')!;

    const imageData = ctx.createImageData(this.terrainWidth, this.terrainHeight);
    const data = imageData.data;

    for (let y = 0; y < this.terrainHeight; y++) {
      for (let x = 0; x < this.terrainWidth; x++) {
        const idx = y * this.terrainWidth + x;
        const pixIdx = idx * 4;

        if (this.collisionMask[idx] === 1) {
          const surfaceY = this.findLocalSurface(x, y);
          const depth = y - surfaceY;

          if (depth <= 2) {
            // Grass top
            data[pixIdx] = 76;
            data[pixIdx + 1] = 175;
            data[pixIdx + 2] = 80;
            data[pixIdx + 3] = 255;
          } else if (depth <= 6) {
            // Dark grass transition
            data[pixIdx] = 56;
            data[pixIdx + 1] = 142;
            data[pixIdx + 2] = 60;
            data[pixIdx + 3] = 255;
          } else {
            // Dirt with depth variation
            const shade = Math.max(0, 1 - depth * 0.002);
            data[pixIdx] = Math.floor(121 * shade);
            data[pixIdx + 1] = Math.floor(85 * shade);
            data[pixIdx + 2] = Math.floor(72 * shade);
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

    ctx.putImageData(imageData, 0, 0);

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
