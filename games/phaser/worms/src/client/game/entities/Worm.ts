import * as Phaser from 'phaser';
import type { TerrainEngine } from '../engine/TerrainEngine';
import { getCharacterDraw } from '../characters/CharacterRegistry';
import type { CharacterDrawFn } from '../characters/types';
import { SoundManager } from '../systems/SoundManager';

const WORM_WIDTH = 16;
const WORM_HEIGHT = 20;
const MOVE_SPEED = 2;
const GRAVITY = 4;
const MAX_CLIMB = 8;
const JUMP_VELOCITY = -6;
const BACKFLIP_VY = -8;
const BACKFLIP_VX = 4;
const FALL_DAMAGE_THRESHOLD = 40;
const FALL_DAMAGE_PER_PIXEL = 0.8;

export class Worm {
  private terrain: TerrainEngine;
  private graphics: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private hpText: Phaser.GameObjects.Text;
  private scene: Phaser.Scene;
  private characterDraw: CharacterDrawFn;

  x: number;
  y: number;
  health: number;
  maxHealth: number;
  name: string;
  color: number;
  team: number;
  characterId: string;
  facingRight: boolean;
  alive: boolean;
  private falling: boolean;
  private fallVelocity: number;
  private fallStartY: number;
  private horizontalVelocity: number;
  private grounded: boolean;
  private deathPlayed: boolean;

  constructor(
    scene: Phaser.Scene,
    terrain: TerrainEngine,
    x: number,
    name: string,
    color: number,
    team: number,
    health: number = 100,
    characterId: string = 'banana-sam',
  ) {
    this.scene = scene;
    this.terrain = terrain;
    this.x = x;
    this.name = name;
    this.color = color;
    this.team = team;
    this.characterId = characterId;
    this.characterDraw = getCharacterDraw(characterId);
    this.health = health;
    this.maxHealth = health;
    this.facingRight = true;
    this.alive = true;
    this.falling = false;
    this.fallVelocity = 0;
    this.fallStartY = 0;
    this.horizontalVelocity = 0;
    this.grounded = true;
    this.deathPlayed = false;

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

    this.hpText = scene.add
      .text(x, this.y - 20, `${health}`, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5, 1)
      .setShadow(1, 1, '#000000', 3)
      .setDepth(25);

    this.draw();
  }

  moveLeft(): void {
    if (!this.alive || !this.grounded) return;
    this.facingRight = false;
    this.tryMove(-MOVE_SPEED);
  }

  moveRight(): void {
    if (!this.alive || !this.grounded) return;
    this.facingRight = true;
    this.tryMove(MOVE_SPEED);
  }

  jump(): void {
    if (!this.alive || !this.grounded) return;
    SoundManager.play('jump');
    this.fallVelocity = JUMP_VELOCITY;
    this.falling = true;
    this.grounded = false;
    this.fallStartY = this.y;
  }

  backflip(): void {
    if (!this.alive || !this.grounded) return;
    this.fallVelocity = BACKFLIP_VY;
    this.horizontalVelocity = this.facingRight ? -BACKFLIP_VX : BACKFLIP_VX;
    this.falling = true;
    this.grounded = false;
    this.fallStartY = this.y;
  }

  applyKnockback(forceX: number, forceY: number): void {
    if (!this.alive) return;
    this.horizontalVelocity += forceX;
    this.fallVelocity += forceY;
    if (!this.falling) {
      this.falling = true;
      this.grounded = false;
      this.fallStartY = this.y;
    }
  }

  get isGrounded(): boolean {
    return this.grounded;
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
      if (!this.falling) {
        this.fallStartY = this.y;
      }
      this.falling = true;
      this.grounded = false;
    }
  }

  update(): void {
    if (!this.alive) return;

    if (this.falling) {
      this.fallVelocity = Math.min(this.fallVelocity + 0.5, GRAVITY);
      this.y += this.fallVelocity;

      if (this.horizontalVelocity !== 0) {
        const newX = this.x + this.horizontalVelocity;
        if (newX >= 0 && newX < this.terrain.getWidth()) {
          if (!this.terrain.isSolid(newX, this.y + WORM_HEIGHT / 2)) {
            this.x = newX;
          } else {
            this.horizontalVelocity = 0;
          }
        }
        this.horizontalVelocity *= 0.98;
        if (Math.abs(this.horizontalVelocity) < 0.1) {
          this.horizontalVelocity = 0;
        }
      }

      const footY = this.y + WORM_HEIGHT;
      if (this.terrain.isSolid(this.x, footY)) {
        const surfaceY = this.terrain.getSurfaceY(this.x);
        this.y = surfaceY - WORM_HEIGHT;
        this.onLand();
      }

      if (this.y > this.terrain.getHeight()) {
        this.alive = false;
        this.health = 0;
        this.playDeath();
      }
    } else {
      this.checkFalling();
    }

    this.draw();
  }

  private onLand(): void {
    const fallDistance = this.y - this.fallStartY;
    this.falling = false;
    this.grounded = true;
    this.fallVelocity = 0;
    this.horizontalVelocity = 0;

    if (fallDistance > FALL_DAMAGE_THRESHOLD) {
      const damage = Math.round((fallDistance - FALL_DAMAGE_THRESHOLD) * FALL_DAMAGE_PER_PIXEL);
      if (damage > 0) {
        this.takeDamage(damage);
        this.showFallDamage(damage);
      }
    }
  }

  private showFallDamage(damage: number): void {
    const color = damage >= 40 ? '#ff2222' : damage >= 20 ? '#ff8844' : '#ffcc00';
    const text = this.scene.add
      .text(this.x, this.y - 20, `-${damage}`, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color,
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(200)
      .setScale(1.4);

    this.scene.tweens.add({
      targets: text,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });

    this.scene.tweens.add({
      targets: text,
      y: this.y - 55,
      alpha: 0,
      duration: 1400,
      ease: 'Power2',
      delay: 200,
      onComplete: () => text.destroy(),
    });
  }

  private draw(): void {
    this.graphics.clear();

    if (!this.alive) {
      this.graphics.setVisible(false);
      this.nameText.setVisible(false);
      this.hpText.setVisible(false);
      return;
    }

    const x = this.x - WORM_WIDTH / 2;
    const y = this.y;
    const bobOffset = this.grounded ? Math.sin(this.scene.time.now * 0.003) * 1.5 : 0;
    const drawY = y + bobOffset;

    this.characterDraw(this.graphics, x, drawY, WORM_WIDTH, WORM_HEIGHT, this.facingRight, this.color);

    const barWidth = WORM_WIDTH + 10;
    const barHeight = 5;
    const barX = this.x - barWidth / 2;
    const barY = drawY - 8;
    const healthFraction = this.health / this.maxHealth;

    this.graphics.lineStyle(1, 0x000000, 0.7);
    this.graphics.strokeRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

    this.graphics.fillStyle(0x000000, 0.6);
    this.graphics.fillRect(barX, barY, barWidth, barHeight);

    const barColor =
      healthFraction > 0.5 ? 0x4caf50 : healthFraction > 0.25 ? 0xffc107 : 0xf44336;
    this.graphics.fillStyle(barColor, 1);
    this.graphics.fillRect(barX, barY, barWidth * healthFraction, barHeight);

    this.nameText.setPosition(this.x, drawY - 12);
    this.hpText.setText(`${this.health}`);
    this.hpText.setPosition(this.x, drawY - 22);
  }

  takeDamage(amount: number): void {
    if (!this.alive) return;
    SoundManager.play('damage');
    this.health = Math.max(0, this.health - amount);
    this.playHitFlash();
    if (this.health <= 0) {
      this.alive = false;
      this.playDeath();
    }
  }

  private playHitFlash(): void {
    const flash = this.scene.add.graphics().setDepth(30);
    flash.fillStyle(0xffffff, 0.8);
    flash.fillRoundedRect(
      this.x - WORM_WIDTH / 2 - 2,
      this.y - 2,
      WORM_WIDTH + 4,
      WORM_HEIGHT + 4,
      4,
    );
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy(),
    });
  }

  private playDeath(): void {
    if (this.deathPlayed) return;
    this.deathPlayed = true;
    SoundManager.play('death');

    const tombstone = this.scene.add
      .text(this.x, this.y, '🪦', { fontSize: '20px' })
      .setOrigin(0.5, 1)
      .setDepth(15)
      .setAlpha(0);

    this.scene.tweens.add({
      targets: tombstone,
      alpha: 1,
      y: this.y - 5,
      duration: 600,
      ease: 'Bounce.easeOut',
    });

    this.scene.tweens.add({
      targets: [this.graphics, this.nameText, this.hpText],
      alpha: 0,
      duration: 400,
      onComplete: () => {
        this.graphics.setVisible(false);
        this.nameText.setVisible(false);
        this.hpText.setVisible(false);
      },
    });
  }

  getCenter(): { x: number; y: number } {
    return { x: this.x, y: this.y + WORM_HEIGHT / 2 };
  }

  destroy(): void {
    this.graphics.destroy();
    this.nameText.destroy();
    this.hpText.destroy();
  }
}
