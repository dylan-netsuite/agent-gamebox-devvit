import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { TerrainEngine } from '../engine/TerrainEngine';
import { Worm } from '../entities/Worm';
import { WORM_NAMES, TEAM_COLORS } from '../../../shared/types/game';

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1200;

export class GamePlay extends Scene {
  private terrain: TerrainEngine;
  private worms: Worm[] = [];
  private activeWormIndex = 0;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private skyGradient: Phaser.GameObjects.Graphics;

  constructor() {
    super('GamePlay');
  }

  create() {
    this.cameras.main.setBackgroundColor('#87CEEB');

    this.drawSky();

    const seed = Math.floor(Math.random() * 1_000_000);
    this.terrain = new TerrainEngine(this, WORLD_WIDTH, WORLD_HEIGHT, seed);

    this.spawnWorms();

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.centerCameraOnWorm();

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();

      this.input.keyboard.on('keydown-SPACE', () => {
        this.testExplosion();
      });

      this.input.keyboard.on('keydown-TAB', (event: KeyboardEvent) => {
        event.preventDefault();
        this.cycleWorm();
      });
    }

    this.add
      .text(10, 10, 'Arrow Keys: Move | Space: Test Explosion | Tab: Switch Worm', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: { x: 8, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) return;
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;
      this.terrain.carve(worldX, worldY, 35);
      this.terrain.redraw();
    });

    this.setupCameraDrag();
  }

  private drawSky(): void {
    this.skyGradient = this.add.graphics();
    this.skyGradient.setDepth(-10);

    const skyColors = [
      { y: 0, color: 0x1e90ff },
      { y: WORLD_HEIGHT * 0.3, color: 0x87ceeb },
      { y: WORLD_HEIGHT * 0.7, color: 0xb0e0e6 },
      { y: WORLD_HEIGHT, color: 0x4682b4 },
    ];

    for (let i = 0; i < skyColors.length - 1; i++) {
      const from = skyColors[i]!;
      const to = skyColors[i + 1]!;
      const steps = to.y - from.y;

      for (let y = from.y; y < to.y; y++) {
        const t = (y - from.y) / steps;
        const r = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.IntegerToColor(from.color),
          Phaser.Display.Color.IntegerToColor(to.color),
          1,
          t,
        );
        this.skyGradient.fillStyle(Phaser.Display.Color.GetColor(r.r, r.g, r.b), 1);
        this.skyGradient.fillRect(0, y, WORLD_WIDTH, 1);
      }
    }
  }

  private spawnWorms(): void {
    const spacing = WORLD_WIDTH / 5;
    const names = [...WORM_NAMES];

    for (let i = 0; i < 4; i++) {
      const x = spacing * (i + 1) + (Math.random() - 0.5) * 100;
      const name = names[i] ?? `Worm ${i + 1}`;
      const colorStr = TEAM_COLORS[i % TEAM_COLORS.length]!;
      const color = parseInt(colorStr.replace('#', ''), 16);
      const worm = new Worm(this, this.terrain, x, name, color);
      this.worms.push(worm);
    }
  }

  private get activeWorm(): Worm | undefined {
    return this.worms[this.activeWormIndex];
  }

  private cycleWorm(): void {
    this.activeWormIndex = (this.activeWormIndex + 1) % this.worms.length;
    this.centerCameraOnWorm();
  }

  private centerCameraOnWorm(): void {
    const worm = this.activeWorm;
    if (!worm) return;
    this.cameras.main.pan(worm.x, worm.y, 300, 'Sine.easeInOut');
  }

  private testExplosion(): void {
    const worm = this.activeWorm;
    if (!worm) return;

    const dir = worm.facingRight ? 1 : -1;
    const explosionX = worm.x + dir * 80;
    const explosionY = worm.y + 10;

    this.terrain.carve(explosionX, explosionY, 40);
    this.terrain.redraw();

    this.cameras.main.shake(200, 0.01);

    const particles = this.add.graphics();
    particles.setDepth(50);
    const particleCount = 20;
    const particleData: { x: number; y: number; vx: number; vy: number; life: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      particleData.push({
        x: explosionX,
        y: explosionY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
      });
    }

    const timer = this.time.addEvent({
      delay: 16,
      repeat: 30,
      callback: () => {
        particles.clear();
        for (const p of particleData) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.15;
          p.life -= 0.03;
          if (p.life > 0) {
            const alpha = p.life;
            const color = Phaser.Display.Color.GetColor(
              255,
              Math.floor(200 * p.life),
              Math.floor(50 * p.life),
            );
            particles.fillStyle(color, alpha);
            particles.fillCircle(p.x, p.y, 2 + p.life * 2);
          }
        }
      },
    });

    this.time.delayedCall(500, () => {
      timer.destroy();
      particles.destroy();
    });
  }

  private setupCameraDrag(): void {
    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let camStartX = 0;
    let camStartY = 0;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        dragging = true;
        dragStartX = pointer.x;
        dragStartY = pointer.y;
        camStartX = this.cameras.main.scrollX;
        camStartY = this.cameras.main.scrollY;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (dragging) {
        const dx = dragStartX - pointer.x;
        const dy = dragStartY - pointer.y;
        this.cameras.main.scrollX = camStartX + dx;
        this.cameras.main.scrollY = camStartY + dy;
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.rightButtonDown()) {
        dragging = false;
      }
    });

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gos: unknown[], _dx: number, dy: number) => {
      const cam = this.cameras.main;
      const newZoom = Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.3, 2);
      cam.setZoom(newZoom);
    });
  }

  override update(_time: number, _delta: number) {
    const worm = this.activeWorm;
    if (!worm) return;

    if (this.cursors) {
      if (this.cursors.left.isDown) {
        worm.moveLeft();
      } else if (this.cursors.right.isDown) {
        worm.moveRight();
      }
    }

    for (const w of this.worms) {
      w.update();
    }
  }
}
