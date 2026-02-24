import * as Phaser from 'phaser';
import type { Worm } from '../entities/Worm';
import type { TerrainEngine } from '../engine/TerrainEngine';
import { TEAM_COLORS } from '../../../shared/types/game';

const MAP_W = 150;
const MAP_H = 75;
const BG_COLOR = 0x0f1923;
const BG_ALPHA = 0.75;
const TERRAIN_COLOR = 0x3a6b35;

export class Minimap {
  private container: Phaser.GameObjects.Container;
  private gfx: Phaser.GameObjects.Graphics;
  private worldW: number;
  private worldH: number;
  private getWorms: () => Worm[];
  private scene: Phaser.Scene;
  private terrainSampled = false;
  private terrainPoints: number[] = [];

  constructor(
    scene: Phaser.Scene,
    terrain: TerrainEngine,
    worldW: number,
    worldH: number,
    getWorms: () => Worm[],
    onClickPan: (worldX: number, worldY: number) => void,
  ) {
    this.scene = scene;
    this.worldW = worldW;
    this.worldH = worldH;
    this.getWorms = getWorms;

    const cam = scene.cameras.main;
    const x = cam.width - MAP_W - 8;

    this.container = scene.add.container(x, 8).setDepth(200).setScrollFactor(0);

    this.gfx = scene.add.graphics();
    this.container.add(this.gfx);

    this.sampleTerrain(terrain);

    const hitArea = scene.add
      .rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0);
    this.container.add(hitArea);

    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const localX = pointer.x - this.container.x;
      const localY = pointer.y - this.container.y;
      const wx = (localX / MAP_W) * worldW;
      const wy = (localY / MAP_H) * worldH;
      onClickPan(wx, wy);
    });
  }

  private sampleTerrain(terrain: TerrainEngine): void {
    const samples = MAP_W;
    for (let i = 0; i < samples; i++) {
      const wx = (i / samples) * this.worldW;
      const sy = terrain.getSurfaceY(wx);
      this.terrainPoints.push(sy);
    }
    this.terrainSampled = true;
  }

  update(): void {
    this.gfx.clear();

    this.gfx.fillStyle(BG_COLOR, BG_ALPHA);
    this.gfx.fillRoundedRect(0, 0, MAP_W, MAP_H, 6);
    this.gfx.lineStyle(1, 0x2a3a4a, 0.5);
    this.gfx.strokeRoundedRect(0, 0, MAP_W, MAP_H, 6);

    if (this.terrainSampled) {
      this.gfx.fillStyle(TERRAIN_COLOR, 0.6);
      this.gfx.beginPath();
      this.gfx.moveTo(0, MAP_H);
      for (let i = 0; i < this.terrainPoints.length; i++) {
        const my = (this.terrainPoints[i]! / this.worldH) * MAP_H;
        this.gfx.lineTo(i, my);
      }
      this.gfx.lineTo(MAP_W, MAP_H);
      this.gfx.closePath();
      this.gfx.fillPath();
    }

    const worms = this.getWorms();
    for (const w of worms) {
      if (!w.alive) continue;
      const mx = (w.x / this.worldW) * MAP_W;
      const my = (w.y / this.worldH) * MAP_H;
      const colorHex = parseInt((TEAM_COLORS[w.team] ?? '#ffffff').replace('#', ''), 16);
      this.gfx.fillStyle(colorHex, 1);
      this.gfx.fillCircle(mx, my, 2.5);
    }

    const cam = this.scene.cameras.main;
    const vx = (cam.scrollX / this.worldW) * MAP_W;
    const vy = (cam.scrollY / this.worldH) * MAP_H;
    const vw = (cam.width / cam.zoom / this.worldW) * MAP_W;
    const vh = (cam.height / cam.zoom / this.worldH) * MAP_H;
    this.gfx.lineStyle(1, 0xffffff, 0.6);
    this.gfx.strokeRect(
      Math.max(0, vx),
      Math.max(0, vy),
      Math.min(vw, MAP_W - Math.max(0, vx)),
      Math.min(vh, MAP_H - Math.max(0, vy)),
    );
  }

  reposition(cam: Phaser.Cameras.Scene2D.Camera): void {
    const z = cam.zoom;
    this.container.setScale(1 / z);
    this.container.setPosition((cam.width - MAP_W - 8) / z, 8 / z);
  }

  destroy(): void {
    this.container.destroy();
  }
}
