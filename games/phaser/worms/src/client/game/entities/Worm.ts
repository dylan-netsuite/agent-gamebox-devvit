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
const FALL_DAMAGE_THRESHOLD = 60;
const AIR_CONTROL_SPEED = 1.5;
const FALL_DAMAGE_PER_PIXEL = 0.5;
const PARACHUTE_MAX_FALL_SPEED = 1.0;
const PARACHUTE_DRAG = 0.9;

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
  private _parachuteOpen: boolean;
  private parachuteGraphics: Phaser.GameObjects.Graphics;

  private _ropeAnchor: { x: number; y: number } | null = null;
  private _ropeLength = 0;
  private _ropeAngle = 0;
  private _ropeAngularVel = 0;
  private ropeGraphics: Phaser.GameObjects.Graphics;

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
    this._parachuteOpen = false;

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

    this.parachuteGraphics = scene.add.graphics().setDepth(24);
    this.ropeGraphics = scene.add.graphics().setDepth(24);

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

  airMoveLeft(): void {
    if (!this.alive || this.grounded) return;
    this.facingRight = false;
    this.horizontalVelocity = Math.max(this.horizontalVelocity - AIR_CONTROL_SPEED * 0.3, -AIR_CONTROL_SPEED);
  }

  airMoveRight(): void {
    if (!this.alive || this.grounded) return;
    this.facingRight = true;
    this.horizontalVelocity = Math.min(this.horizontalVelocity + AIR_CONTROL_SPEED * 0.3, AIR_CONTROL_SPEED);
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

  get parachuteOpen(): boolean {
    return this._parachuteOpen;
  }

  openParachute(): void {
    if (!this.alive || this.grounded) return;
    this._parachuteOpen = true;
    SoundManager.play('parachute-open');
  }

  closeParachute(): void {
    this._parachuteOpen = false;
  }

  isFallingDangerously(): boolean {
    return this.falling && !this._parachuteOpen && (this.y - this.fallStartY) > FALL_DAMAGE_THRESHOLD * 0.7;
  }

  get isOnRope(): boolean {
    return this._ropeAnchor !== null;
  }

  attachRope(anchorX: number, anchorY: number): void {
    if (!this.alive) return;
    const dx = this.x - anchorX;
    const dy = this.y - anchorY;
    this._ropeLength = Math.sqrt(dx * dx + dy * dy);
    this._ropeAngle = Math.atan2(dx, dy);
    this._ropeAngularVel = 0;
    this._ropeAnchor = { x: anchorX, y: anchorY };
    this.falling = false;
    this.grounded = false;
    this.fallVelocity = 0;
    this.horizontalVelocity = 0;
    SoundManager.play('rope-attach');
  }

  detachRope(): void {
    if (!this._ropeAnchor) return;
    const tangentialSpeed = this._ropeAngularVel * this._ropeLength;
    this.horizontalVelocity = Math.cos(this._ropeAngle) * tangentialSpeed;
    this.fallVelocity = -Math.abs(Math.sin(this._ropeAngle) * tangentialSpeed) - 1;
    this._ropeAnchor = null;
    this._ropeLength = 0;
    this._ropeAngularVel = 0;
    this.falling = true;
    this.grounded = false;
    this.fallStartY = this.y;
    SoundManager.play('rope-release');
  }

  adjustRopeLength(delta: number): void {
    if (!this._ropeAnchor) return;
    this._ropeLength = Math.max(30, Math.min(200, this._ropeLength + delta));
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

    if (this._ropeAnchor) {
      const ROPE_GRAVITY = 0.004;
      this._ropeAngularVel += Math.sin(this._ropeAngle) * ROPE_GRAVITY;
      this._ropeAngularVel *= 0.995;
      this._ropeAngle += this._ropeAngularVel;

      this.x = this._ropeAnchor.x + Math.sin(this._ropeAngle) * this._ropeLength;
      this.y = this._ropeAnchor.y + Math.cos(this._ropeAngle) * this._ropeLength;

      if (this.y > this.terrain.getHeight()) {
        this._ropeAnchor = null;
        this.alive = false;
        this.health = 0;
        this.playDeath();
      }

      this.draw();
      return;
    }

    if (this.falling) {
      if (this._parachuteOpen) {
        this.fallVelocity = Math.min(this.fallVelocity + 0.15, PARACHUTE_MAX_FALL_SPEED);
        this.horizontalVelocity *= PARACHUTE_DRAG;
      } else {
        this.fallVelocity = Math.min(this.fallVelocity + 0.5, GRAVITY);
      }
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
    const hadParachute = this._parachuteOpen;
    this.falling = false;
    this.grounded = true;
    this.fallVelocity = 0;
    this.horizontalVelocity = 0;
    this._parachuteOpen = false;

    if (hadParachute) {
      SoundManager.play('parachute-land');
    } else if (fallDistance > FALL_DAMAGE_THRESHOLD) {
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
    this.parachuteGraphics.clear();
    this.ropeGraphics.clear();

    if (!this.alive) {
      this.graphics.setVisible(false);
      this.parachuteGraphics.setVisible(false);
      this.ropeGraphics.setVisible(false);
      this.nameText.setVisible(false);
      this.hpText.setVisible(false);
      return;
    }

    const x = this.x - WORM_WIDTH / 2;
    const y = this.y;
    const bobOffset = this.grounded ? Math.sin(this.scene.time.now * 0.003) * 1.5 : 0;
    const drawY = y + bobOffset;

    this.characterDraw(this.graphics, x, drawY, WORM_WIDTH, WORM_HEIGHT, this.facingRight, this.color);

    if (this._parachuteOpen) {
      this.drawParachute(this.x, drawY);
    }

    if (this._ropeAnchor) {
      this.drawRope(this.x, drawY, this._ropeAnchor.x, this._ropeAnchor.y);
      this.drawSwingArc(this._ropeAnchor.x, this._ropeAnchor.y);
      this.drawMomentumArrow(this.x, drawY);
    }

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

  private drawParachute(cx: number, topY: number): void {
    const g = this.parachuteGraphics;
    const canopyW = 32;
    const canopyH = 16;
    const canopyTop = topY - 28;

    g.fillStyle(0xffffff, 0.85);
    g.fillEllipse(cx, canopyTop + canopyH / 2, canopyW, canopyH);

    g.fillStyle(0xe94560, 0.7);
    g.fillEllipse(cx - canopyW * 0.22, canopyTop + canopyH / 2, canopyW * 0.3, canopyH * 0.85);
    g.fillEllipse(cx + canopyW * 0.22, canopyTop + canopyH / 2, canopyW * 0.3, canopyH * 0.85);

    g.lineStyle(1, 0x666666, 0.7);
    g.beginPath();
    g.moveTo(cx - canopyW / 2 + 2, canopyTop + canopyH);
    g.lineTo(cx, topY - 2);
    g.moveTo(cx + canopyW / 2 - 2, canopyTop + canopyH);
    g.lineTo(cx, topY - 2);
    g.moveTo(cx - canopyW / 4, canopyTop + canopyH - 1);
    g.lineTo(cx, topY - 2);
    g.moveTo(cx + canopyW / 4, canopyTop + canopyH - 1);
    g.lineTo(cx, topY - 2);
    g.strokePath();
  }

  private drawRope(wormX: number, wormY: number, anchorX: number, anchorY: number): void {
    const g = this.ropeGraphics;
    const speed = Math.abs(this._ropeAngularVel);
    const tension = Math.min(1, speed / 0.03);

    const thickness = 3 - tension * 1.5;
    const r = Math.round(0x8b + tension * (0xff - 0x8b));
    const gVal = Math.round(0x69 + tension * (0xaa - 0x69));
    const b = Math.round(0x14 + tension * (0x44 - 0x14));
    const ropeColor = (r << 16) | (gVal << 8) | b;

    const midX = (anchorX + wormX) / 2;
    const midY = (anchorY + wormY) / 2;
    const sag = (1 - tension) * this._ropeLength * 0.15;
    const ctrlX = midX;
    const ctrlY = midY + sag;

    g.lineStyle(thickness, ropeColor, 0.9);
    g.beginPath();
    g.moveTo(anchorX, anchorY);
    const steps = 16;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const inv = 1 - t;
      const px = inv * inv * anchorX + 2 * inv * t * ctrlX + t * t * wormX;
      const py = inv * inv * anchorY + 2 * inv * t * ctrlY + t * t * wormY;
      g.lineTo(px, py);
    }
    g.strokePath();

    if (tension > 0.5) {
      g.lineStyle(thickness + 2, ropeColor, (tension - 0.5) * 0.3);
      g.beginPath();
      g.moveTo(anchorX, anchorY);
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const inv = 1 - t;
        const px = inv * inv * anchorX + 2 * inv * t * ctrlX + t * t * wormX;
        const py = inv * inv * anchorY + 2 * inv * t * ctrlY + t * t * wormY;
        g.lineTo(px, py);
      }
      g.strokePath();
    }

    g.fillStyle(0x555555, 1);
    g.fillCircle(anchorX, anchorY, 4);
    g.fillStyle(0x888888, 1);
    g.fillCircle(anchorX, anchorY, 2);
  }

  private drawSwingArc(anchorX: number, anchorY: number): void {
    if (!this._ropeAnchor) return;
    const g = this.ropeGraphics;
    const arcPoints = 24;
    const sweepRange = Math.PI * 0.8;
    const startAngle = this._ropeAngle - sweepRange / 2;

    g.lineStyle(1, 0xffffff, 0.12);
    g.beginPath();
    for (let i = 0; i <= arcPoints; i++) {
      const a = startAngle + (i / arcPoints) * sweepRange;
      const px = anchorX + Math.sin(a) * this._ropeLength;
      const py = anchorY + Math.cos(a) * this._ropeLength;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.strokePath();

    g.fillStyle(0xffffff, 0.25);
    const dotAngle = this._ropeAngle;
    g.fillCircle(
      anchorX + Math.sin(dotAngle) * this._ropeLength,
      anchorY + Math.cos(dotAngle) * this._ropeLength,
      3,
    );
  }

  private drawMomentumArrow(wormX: number, wormY: number): void {
    if (!this._ropeAnchor) return;
    const g = this.ropeGraphics;
    const tangentialSpeed = this._ropeAngularVel * this._ropeLength;
    const vx = Math.cos(this._ropeAngle) * tangentialSpeed;
    const vy = -Math.abs(Math.sin(this._ropeAngle) * tangentialSpeed) - 1;
    const speed = Math.sqrt(vx * vx + vy * vy);

    if (speed < 0.5) return;

    const scale = Math.min(speed * 8, 50);
    const nx = vx / speed;
    const ny = vy / speed;
    const endX = wormX + nx * scale;
    const endY = wormY + ny * scale;

    const dangerThreshold = FALL_DAMAGE_THRESHOLD * 0.7;
    const launchVy = vy;
    const estimatedFall = launchVy < 0 ? (launchVy * launchVy) / (2 * 0.5) : 0;
    const danger = Math.min(1, estimatedFall / dangerThreshold);
    const arrowR = Math.round(danger * 0xff + (1 - danger) * 0x3f);
    const arrowG = Math.round((1 - danger) * 0xb9 + danger * 0x44);
    const arrowColor = (arrowR << 16) | (arrowG << 8) | 0x50;

    g.lineStyle(2, arrowColor, 0.7);
    g.beginPath();
    g.moveTo(wormX, wormY);
    g.lineTo(endX, endY);
    g.strokePath();

    const headLen = 6;
    const angle = Math.atan2(ny, nx);
    g.fillStyle(arrowColor, 0.7);
    g.fillTriangle(
      endX,
      endY,
      endX - Math.cos(angle - 0.4) * headLen,
      endY - Math.sin(angle - 0.4) * headLen,
      endX - Math.cos(angle + 0.4) * headLen,
      endY - Math.sin(angle + 0.4) * headLen,
    );
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
      targets: [this.graphics, this.parachuteGraphics, this.ropeGraphics, this.nameText, this.hpText],
      alpha: 0,
      duration: 400,
      onComplete: () => {
        this.graphics.setVisible(false);
        this.parachuteGraphics.setVisible(false);
        this.ropeGraphics.setVisible(false);
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
    this.parachuteGraphics.destroy();
    this.ropeGraphics.destroy();
    this.nameText.destroy();
    this.hpText.destroy();
  }
}
