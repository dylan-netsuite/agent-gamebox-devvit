import * as Phaser from 'phaser';
import type { TerrainEngine } from '../engine/TerrainEngine';

const WORM_WIDTH = 16;
const WORM_HEIGHT = 20;
const MOVE_SPEED = 2;
const GRAVITY = 4;
const MAX_CLIMB = 8;

/**
 * Worm entity that walks along terrain using the collision mask.
 * Rendered as a simple colored rectangle with eyes.
 */
export class Worm {
  private terrain: TerrainEngine;
  private graphics: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;

  x: number;
  y: number;
  health: number;
  maxHealth: number;
  name: string;
  color: number;
  facingRight: boolean;
  alive: boolean;
  private falling: boolean;
  private fallVelocity: number;

  constructor(
    scene: Phaser.Scene,
    terrain: TerrainEngine,
    x: number,
    name: string,
    color: number,
    health: number = 100,
  ) {
    this.terrain = terrain;
    this.x = x;
    this.name = name;
    this.color = color;
    this.health = health;
    this.maxHealth = health;
    this.facingRight = true;
    this.alive = true;
    this.falling = false;
    this.fallVelocity = 0;

    const surfaceY = terrain.getSurfaceY(x);
    this.y = surfaceY - WORM_HEIGHT;

    this.graphics = scene.add.graphics();
    this.nameText = scene.add
      .text(x, this.y - 14, name, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '10px',
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5, 1)
      .setShadow(1, 1, '#000000', 2);

    this.draw();
  }

  moveLeft(): void {
    if (!this.alive || this.falling) return;
    this.facingRight = false;
    this.tryMove(-MOVE_SPEED);
  }

  moveRight(): void {
    if (!this.alive || this.falling) return;
    this.facingRight = true;
    this.tryMove(MOVE_SPEED);
  }

  private tryMove(dx: number): void {
    const newX = this.x + dx;
    if (newX < 0 || newX >= this.terrain.getWidth()) return;

    const currentFootY = this.y + WORM_HEIGHT;
    const newSurfaceY = this.terrain.getSurfaceY(newX);
    const climb = currentFootY - newSurfaceY;

    if (climb > MAX_CLIMB) return;

    if (climb >= 0) {
      this.x = newX;
      this.y = newSurfaceY - WORM_HEIGHT;
    } else {
      this.x = newX;
      this.checkFalling();
    }
  }

  private checkFalling(): void {
    const footY = this.y + WORM_HEIGHT;
    if (!this.terrain.isSolid(this.x, footY)) {
      this.falling = true;
      this.fallVelocity = 0;
    }
  }

  update(): void {
    if (!this.alive) return;

    if (this.falling) {
      this.fallVelocity = Math.min(this.fallVelocity + 0.5, GRAVITY);
      this.y += this.fallVelocity;

      const footY = this.y + WORM_HEIGHT;
      if (this.terrain.isSolid(this.x, footY)) {
        const surfaceY = this.terrain.getSurfaceY(this.x);
        this.y = surfaceY - WORM_HEIGHT;
        this.falling = false;
        this.fallVelocity = 0;
      }

      if (this.y > this.terrain.getHeight()) {
        this.alive = false;
        this.health = 0;
      }
    } else {
      this.checkFalling();
    }

    this.draw();
  }

  private draw(): void {
    this.graphics.clear();

    if (!this.alive) {
      this.graphics.setVisible(false);
      this.nameText.setVisible(false);
      return;
    }

    const x = this.x - WORM_WIDTH / 2;
    const y = this.y;

    // Body
    this.graphics.fillStyle(this.color, 1);
    this.graphics.fillRoundedRect(x, y, WORM_WIDTH, WORM_HEIGHT, 4);

    // Eyes
    const eyeOffsetX = this.facingRight ? 3 : -3;
    const eyeX = this.x + eyeOffsetX;
    const eyeY = y + 6;
    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillCircle(eyeX - 2, eyeY, 3);
    this.graphics.fillCircle(eyeX + 2, eyeY, 3);
    this.graphics.fillStyle(0x000000, 1);
    const pupilOffset = this.facingRight ? 1 : -1;
    this.graphics.fillCircle(eyeX - 2 + pupilOffset, eyeY, 1.5);
    this.graphics.fillCircle(eyeX + 2 + pupilOffset, eyeY, 1.5);

    // Health bar
    const barWidth = WORM_WIDTH + 4;
    const barHeight = 3;
    const barX = x - 2;
    const barY = y - 6;
    const healthFraction = this.health / this.maxHealth;

    this.graphics.fillStyle(0x000000, 0.5);
    this.graphics.fillRect(barX, barY, barWidth, barHeight);

    const barColor = healthFraction > 0.5 ? 0x4caf50 : healthFraction > 0.25 ? 0xffc107 : 0xf44336;
    this.graphics.fillStyle(barColor, 1);
    this.graphics.fillRect(barX, barY, barWidth * healthFraction, barHeight);

    // Update name position
    this.nameText.setPosition(this.x, this.y - 10);
  }

  takeDamage(amount: number): void {
    if (!this.alive) return;
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  getCenter(): { x: number; y: number } {
    return { x: this.x, y: this.y + WORM_HEIGHT / 2 };
  }

  destroy(): void {
    this.graphics.destroy();
    this.nameText.destroy();
  }
}
