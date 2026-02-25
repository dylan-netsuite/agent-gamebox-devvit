import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { GolfBall } from '../objects/GolfBall';
import { AimArrow } from '../objects/AimArrow';
import { PowerMeter } from '../objects/PowerMeter';
import { Hole } from '../objects/Hole';
import { Walls } from '../objects/Walls';
import { Obstacles } from '../objects/Obstacles';
import { HOLES, type HoleDefinition } from '../data/holes';
import {
  MAX_SHOT_VELOCITY,
  toScreen,
  DESIGN_WIDTH,
  DESIGN_HEIGHT,
  getScaleFactor,
} from '../utils/physics';
import { fadeIn, SCENE_COLORS } from '../utils/transitions';

type GameState = 'aiming' | 'power' | 'simulating' | 'sinking' | 'water_reset';

interface Sparkle {
  x: number;
  y: number;
  phase: number;
  speed: number;
  size: number;
}

export class Game extends Scene {
  private ball!: GolfBall;
  private arrow!: AimArrow;
  private powerMeter!: PowerMeter;
  private hole!: Hole;
  private walls!: Walls;
  private obstacles!: Obstacles;

  private state: GameState = 'aiming';
  private currentHoleIndex: number = 0;
  private strokes: number = 0;
  private scores: number[] = [];
  private lastBallPos: { x: number; y: number } = { x: 0, y: 0 };

  private hud!: Phaser.GameObjects.Container;
  private strokeLabel!: Phaser.GameObjects.Text;

  private bgGraphics!: Phaser.GameObjects.Graphics;
  private sparkleGraphics!: Phaser.GameObjects.Graphics;
  private sparkles: Sparkle[] = [];
  private elapsed: number = 0;

  constructor() {
    super('Game');
  }

  init(data?: { holeIndex?: number; scores?: number[] }) {
    this.currentHoleIndex = data?.holeIndex ?? 0;
    this.scores = data?.scores ?? [];
    this.strokes = 0;
    this.state = 'aiming';
  }

  create() {
    fadeIn(this, SCENE_COLORS.dark);
    this.elapsed = 0;

    this.bgGraphics = this.add.graphics();
    this.bgGraphics.setDepth(0);

    this.sparkleGraphics = this.add.graphics();
    this.sparkleGraphics.setDepth(1);

    this.initSparkles();
    this.loadHole(HOLES[this.currentHoleIndex]!);
    this.createHUD();
    this.setupInput();

    this.scale.on('resize', () => {
      this.cleanupHole();
      this.bgGraphics.destroy();
      this.bgGraphics = this.add.graphics();
      this.bgGraphics.setDepth(0);
      this.sparkleGraphics.destroy();
      this.sparkleGraphics = this.add.graphics();
      this.sparkleGraphics.setDepth(1);
      this.initSparkles();
      this.loadHole(HOLES[this.currentHoleIndex]!);
      this.hud.destroy();
      this.createHUD();
    });
  }

  private initSparkles(): void {
    const { width, height } = this.scale;
    this.sparkles = [];
    // Mix of large prominent sparkles and small subtle ones
    for (let i = 0; i < 15; i++) {
      this.sparkles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.8,
        size: 5 + Math.random() * 8,
      });
    }
    for (let i = 0; i < 25; i++) {
      this.sparkles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.5,
        size: 1.5 + Math.random() * 3,
      });
    }
  }

  private loadHole(def: HoleDefinition): void {
    this.drawBackground();

    this.walls = new Walls(this);
    this.walls.drawFill(def.walls, 0x2d8a4e, 0.9);
    this.walls.buildFromPolygons(def.walls, 0xff69b4);

    this.obstacles = new Obstacles(this);

    for (const obs of def.obstacles) {
      switch (obs.type) {
        case 'bumper':
          this.obstacles.addBumper(obs);
          break;
        case 'windmill':
          this.obstacles.addWindmill(obs);
          break;
        case 'ramp':
          if (obs.width && obs.height && obs.forceY !== undefined) {
            this.obstacles.addRampZone(
              { x: obs.x, y: obs.y, width: obs.width, height: obs.height },
              obs.forceX ?? 0,
              obs.forceY
            );
          }
          break;
        case 'conveyor':
          if (obs.width && obs.height) {
            this.obstacles.addConveyorZone(
              { x: obs.x, y: obs.y, width: obs.width, height: obs.height },
              obs.forceX ?? 0,
              obs.forceY ?? 0
            );
          }
          break;
      }
    }

    if (def.frictionZones) {
      for (const z of def.frictionZones) this.obstacles.addZone('sand', z);
    }
    if (def.slickZones) {
      for (const z of def.slickZones) this.obstacles.addZone('ice', z);
    }
    if (def.waterZones) {
      for (const z of def.waterZones) this.obstacles.addZone('water', z);
    }
    if (def.teleporters) {
      for (const tp of def.teleporters) this.obstacles.addTeleporter(tp);
    }

    const cupPos = toScreen(this, def.cup.x, def.cup.y);
    this.hole = new Hole(this, cupPos.x, cupPos.y);

    const teePos = toScreen(this, def.tee.x, def.tee.y);
    this.ball = new GolfBall(this, teePos.x, teePos.y);
    this.lastBallPos = { x: teePos.x, y: teePos.y };

    this.arrow = new AimArrow(this);
    this.arrow.updatePosition(teePos.x, teePos.y);

    this.powerMeter = new PowerMeter(this);
  }

  private drawBackground(): void {
    const { width, height } = this.scale;

    // Rich dark grass base
    this.bgGraphics.fillStyle(0x14381f, 1);
    this.bgGraphics.fillRect(0, 0, width, height);

    // Dense grass fiber texture — many small strokes for realistic look
    const fiberCount = Math.floor((width * height) / 120);
    for (let i = 0; i < fiberCount; i++) {
      const fx = Math.random() * width;
      const fy = Math.random() * height;
      const shade = [0x1a4a2a, 0x164020, 0x1e5530, 0x123518, 0x0f2d14][
        Math.floor(Math.random() * 5)
      ]!;
      const a = 0.2 + Math.random() * 0.5;
      this.bgGraphics.fillStyle(shade, a);
      // Tiny elongated dots to simulate grass blades
      const bw = 0.5 + Math.random() * 1.5;
      const bh = 1.5 + Math.random() * 3;
      this.bgGraphics.fillRect(fx, fy, bw, bh);
    }

    // Scattered lighter highlights
    const highlightCount = Math.floor(fiberCount * 0.15);
    for (let i = 0; i < highlightCount; i++) {
      const fx = Math.random() * width;
      const fy = Math.random() * height;
      this.bgGraphics.fillStyle(0x2a6b3a, 0.15 + Math.random() * 0.2);
      this.bgGraphics.fillCircle(fx, fy, 0.5 + Math.random() * 1);
    }

    // Darker vignette around edges
    const vignetteSize = Math.max(width, height) * 0.15;
    // Top
    this.bgGraphics.fillStyle(0x0a1f10, 0.25);
    this.bgGraphics.fillRect(0, 0, width, vignetteSize);
    // Bottom
    this.bgGraphics.fillStyle(0x0a1f10, 0.25);
    this.bgGraphics.fillRect(0, height - vignetteSize, width, vignetteSize);
    // Left
    this.bgGraphics.fillStyle(0x0a1f10, 0.2);
    this.bgGraphics.fillRect(0, 0, vignetteSize, height);
    // Right
    this.bgGraphics.fillStyle(0x0a1f10, 0.2);
    this.bgGraphics.fillRect(width - vignetteSize, 0, vignetteSize, height);
  }

  private drawSparkles(): void {
    this.sparkleGraphics.clear();
    const t = this.elapsed / 1000;

    for (const sp of this.sparkles) {
      const alpha = 0.3 + Math.sin(t * sp.speed + sp.phase) * 0.4;
      if (alpha < 0.08) continue;

      const s = sp.size;

      if (s > 5) {
        // Large sparkles — proper diamond 4-point star
        this.sparkleGraphics.fillStyle(0xffffff, alpha);
        this.sparkleGraphics.beginPath();
        this.sparkleGraphics.moveTo(sp.x, sp.y - s);
        this.sparkleGraphics.lineTo(sp.x + s * 0.18, sp.y - s * 0.18);
        this.sparkleGraphics.lineTo(sp.x + s, sp.y);
        this.sparkleGraphics.lineTo(sp.x + s * 0.18, sp.y + s * 0.18);
        this.sparkleGraphics.lineTo(sp.x, sp.y + s);
        this.sparkleGraphics.lineTo(sp.x - s * 0.18, sp.y + s * 0.18);
        this.sparkleGraphics.lineTo(sp.x - s, sp.y);
        this.sparkleGraphics.lineTo(sp.x - s * 0.18, sp.y - s * 0.18);
        this.sparkleGraphics.closePath();
        this.sparkleGraphics.fillPath();

        // Inner glow
        this.sparkleGraphics.fillStyle(0xffffff, alpha * 0.6);
        this.sparkleGraphics.fillCircle(sp.x, sp.y, s * 0.2);
      } else {
        // Small sparkles — simple cross
        this.sparkleGraphics.fillStyle(0xffffff, alpha);
        this.sparkleGraphics.fillRect(sp.x - s / 2, sp.y - 0.5, s, 1);
        this.sparkleGraphics.fillRect(sp.x - 0.5, sp.y - s / 2, 1, s);
      }
    }
  }

  private createHUD(): void {
    const { width, height } = this.scale;
    const def = HOLES[this.currentHoleIndex]!;

    this.hud = this.add.container(0, 0);
    this.hud.setDepth(200);

    const hudH = 58;
    const hudY = height - hudH;
    const cx = width / 2;

    const hudBg = this.add.graphics();

    // Red outer border frame
    hudBg.fillStyle(0xcc2200, 1);
    hudBg.fillRect(0, hudY - 3, width, hudH + 3);

    // Gold border line
    hudBg.fillStyle(0xd4a843, 1);
    hudBg.fillRect(2, hudY - 1, width - 4, hudH - 1);

    // Dark brown main panel
    hudBg.fillStyle(0x3d2b1f, 0.97);
    hudBg.fillRect(4, hudY + 2, width - 8, hudH - 6);

    // Inner gold border
    hudBg.lineStyle(1.5, 0xc8a84e, 0.7);
    hudBg.strokeRect(7, hudY + 5, width - 14, hudH - 12);

    // Red inner accent line
    hudBg.lineStyle(1, 0xcc2200, 0.4);
    hudBg.strokeRect(5, hudY + 3, width - 10, hudH - 8);

    this.hud.add(hudBg);

    // Peppermint swirls flanking the hole label
    this.drawPeppermintSwirl(cx - 95, hudY + hudH / 2, 11);
    this.drawPeppermintSwirl(cx + 95, hudY + hudH / 2, 11);

    // HOLE label — larger, more ornate banner
    const holeBannerW = 170;
    const holeBannerH = 32;
    const bannerY = hudY + (hudH - holeBannerH) / 2;
    const holeBannerBg = this.add.graphics();

    // Outer banner border (dark gold)
    holeBannerBg.fillStyle(0x8b6914, 1);
    holeBannerBg.fillRoundedRect(cx - holeBannerW / 2, bannerY, holeBannerW, holeBannerH, 7);
    // Inner banner fill (warm gold)
    holeBannerBg.fillStyle(0xc8a84e, 0.9);
    holeBannerBg.fillRoundedRect(
      cx - holeBannerW / 2 + 2,
      bannerY + 2,
      holeBannerW - 4,
      holeBannerH - 4,
      6
    );
    // Highlight on top half
    holeBannerBg.fillStyle(0xddc060, 0.4);
    holeBannerBg.fillRoundedRect(
      cx - holeBannerW / 2 + 3,
      bannerY + 3,
      holeBannerW - 6,
      (holeBannerH - 6) / 2,
      { tl: 5, tr: 5, bl: 0, br: 0 }
    );
    this.hud.add(holeBannerBg);

    const holeText = this.add
      .text(cx, hudY + hudH / 2, `HOLE ${def.id}`, {
        fontFamily: '"Arial Black", "Impact", sans-serif',
        fontSize: '18px',
        color: '#3d2b1f',
        stroke: '#c8a84e',
        strokeThickness: 1,
      })
      .setOrigin(0.5);
    this.hud.add(holeText);

    // SCORE on left with green gumdrop
    const scoreX = 28;
    this.drawGumdrop(scoreX, hudY + hudH / 2, 8, 0x32cd32);

    this.strokeLabel = this.add
      .text(scoreX + 20, hudY + hudH / 2, `SCORE: ${this.strokes}`, {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: '13px',
        color: '#e8e0c8',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(0, 0.5);
    this.hud.add(this.strokeLabel);

    // PAR on right with purple gumdrop
    const parX = width - 28;
    this.drawGumdrop(parX, hudY + hudH / 2, 8, 0x9370db);

    const parLabel = this.add
      .text(parX - 20, hudY + hudH / 2, `PAR ${def.par}`, {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: '13px',
        color: '#e8e0c8',
        stroke: '#000000',
        strokeThickness: 1,
      })
      .setOrigin(1, 0.5);
    this.hud.add(parLabel);
  }

  private drawPeppermintSwirl(cx: number, cy: number, r: number): void {
    const g = this.add.graphics();
    g.setDepth(201);

    // White base circle
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx, cy, r);

    // Red spiral segments
    const segments = 6;
    for (let i = 0; i < segments; i++) {
      const startAngle = (i * Math.PI * 2) / segments;
      const endAngle = startAngle + Math.PI / segments;

      g.fillStyle(0xcc0000, 0.9);
      g.beginPath();
      g.moveTo(cx, cy);
      g.arc(cx, cy, r, startAngle, endAngle, false);
      g.closePath();
      g.fillPath();
    }

    // Center dot
    g.fillStyle(0xcc0000, 1);
    g.fillCircle(cx, cy, r * 0.2);

    // Outer ring
    g.lineStyle(1, 0xdddddd, 0.6);
    g.strokeCircle(cx, cy, r);

    this.hud.add(g);
  }

  private drawGumdrop(cx: number, cy: number, r: number, color: number): void {
    const g = this.add.graphics();
    g.setDepth(201);

    // Gumdrop body
    g.fillStyle(color, 1);
    g.fillCircle(cx, cy, r);

    // Highlight
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(cx - r * 0.25, cy - r * 0.3, r * 0.35);

    this.hud.add(g);
  }

  private setupInput(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.state === 'aiming') {
        this.arrow.updateAngle(pointer.x, pointer.y);
      }
    });

    this.input.on('pointerdown', () => {
      if (this.state === 'aiming') {
        this.state = 'power';
        this.powerMeter.start();
      }
    });

    this.input.on('pointerup', () => {
      if (this.state === 'power') {
        const power = this.powerMeter.stop();
        this.executeShot(power);
      }
    });
  }

  private executeShot(power: number): void {
    this.strokes++;
    this.strokeLabel.setText(`SCORE: ${this.strokes}`);

    this.lastBallPos = {
      x: this.ball.body.position.x,
      y: this.ball.body.position.y,
    };

    const velocity = power * MAX_SHOT_VELOCITY * getScaleFactor(this).s;
    this.ball.applyShot(this.arrow.angle, velocity);

    this.state = 'simulating';
    this.arrow.setVisible(false);
  }

  override update(_time: number, delta: number): void {
    if (this.state === 'sinking') return;

    this.elapsed += delta;
    this.drawSparkles();

    this.ball.update();
    this.ball.clampSpeed(MAX_SHOT_VELOCITY * getScaleFactor(this).s * 1.5);
    this.powerMeter.update(delta);

    if (this.state === 'aiming') {
      this.arrow.updatePosition(this.ball.body.position.x, this.ball.body.position.y);
      this.arrow.draw(this.powerMeter.active ? this.powerMeter.power : 0);
    }

    if (this.state === 'power') {
      this.arrow.draw(this.powerMeter.power);
    }

    if (this.state === 'simulating') {
      const result = this.obstacles.update(delta, this.ball);

      if (result.inWater) {
        this.handleWaterHazard();
        return;
      }

      this.hole.applyAttraction(this.ball);

      if (this.hole.canCapture(this.ball)) {
        this.sinkBall();
        return;
      }

      if (this.ball.isStopped()) {
        this.state = 'aiming';
        this.arrow.setVisible(true);
        this.arrow.updatePosition(this.ball.body.position.x, this.ball.body.position.y);
      }
    }

    if (this.state === 'water_reset') {
      if (this.ball.isStopped()) {
        this.state = 'aiming';
        this.arrow.setVisible(true);
        this.arrow.updatePosition(this.ball.body.position.x, this.ball.body.position.y);
      }
    }
  }

  private handleWaterHazard(): void {
    this.strokes++;
    this.strokeLabel.setText(`SCORE: ${this.strokes}`);
    this.state = 'water_reset';

    this.showPenaltyText();

    this.ball.setPosition(this.lastBallPos.x, this.lastBallPos.y);
    this.state = 'aiming';
    this.arrow.setVisible(true);
    this.arrow.updatePosition(this.lastBallPos.x, this.lastBallPos.y);
  }

  private showPenaltyText(): void {
    const text = this.add
      .text(this.ball.body.position.x, this.ball.body.position.y - 30, '+1 PENALTY', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: '16px',
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(300);

    this.tweens.add({
      targets: text,
      y: text.y - 40,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  private sinkBall(): void {
    this.state = 'sinking';
    this.arrow.setVisible(false);

    this.tweens.add({
      targets: this.ball.graphics,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 400,
      ease: 'Power3',
    });

    this.showScoreText();
    this.createSinkParticles();

    this.time.delayedCall(1500, () => {
      this.scores.push(this.strokes);
      this.cleanupHole();

      if (this.currentHoleIndex < HOLES.length - 1) {
        this.scene.start('HoleComplete', {
          holeIndex: this.currentHoleIndex,
          strokes: this.strokes,
          par: HOLES[this.currentHoleIndex]!.par,
          scores: this.scores,
        });
      } else {
        this.scene.start('Scorecard', { scores: this.scores });
      }
    });
  }

  private showScoreText(): void {
    const def = HOLES[this.currentHoleIndex]!;
    const diff = this.strokes - def.par;
    let label: string;
    let color: string;

    if (this.strokes === 1) {
      label = 'HOLE IN ONE!';
      color = '#ffd700';
    } else if (diff <= -2) {
      label = 'EAGLE!';
      color = '#ffd700';
    } else if (diff === -1) {
      label = 'BIRDIE!';
      color = '#32cd32';
    } else if (diff === 0) {
      label = 'PAR';
      color = '#ffffff';
    } else if (diff === 1) {
      label = 'BOGEY';
      color = '#ff8c00';
    } else {
      label = `+${diff}`;
      color = '#ff4444';
    }

    const { width, height } = this.scale;
    const text = this.add
      .text(width / 2, height / 2, label, {
        fontFamily: '"Arial Black", "Impact", sans-serif',
        fontSize: '48px',
        color,
        stroke: '#000000',
        strokeThickness: 4,
        shadow: { offsetX: 0, offsetY: 0, color, blur: 20, fill: false, stroke: true },
      })
      .setOrigin(0.5)
      .setDepth(500)
      .setAlpha(0)
      .setScale(0.5);

    this.tweens.add({
      targets: text,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: text,
      alpha: 0,
      y: text.y - 30,
      delay: 1000,
      duration: 400,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  private createSinkParticles(): void {
    const cx = this.hole.x;
    const cy = this.hole.y;
    const colors = [0xff69b4, 0xffd700, 0x32cd32, 0x00ced1, 0xff6347];

    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const speed = 80 + Math.random() * 60;
      const size = 3 + Math.random() * 4;
      const color = colors[i % colors.length]!;

      const particle = this.add.graphics();
      particle.fillStyle(color, 1);
      particle.fillCircle(0, 0, size);
      particle.setPosition(cx, cy);
      particle.setDepth(400);

      this.tweens.add({
        targets: particle,
        x: cx + Math.cos(angle) * speed,
        y: cy + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 600 + Math.random() * 400,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private cleanupHole(): void {
    this.ball?.destroy();
    this.arrow?.destroy();
    this.powerMeter?.destroy();
    this.hole?.destroy();
    this.walls?.destroy();
    this.obstacles?.destroy();
  }
}
