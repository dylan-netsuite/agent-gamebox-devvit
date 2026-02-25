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
  private holeLabel!: Phaser.GameObjects.Text;
  private strokeLabel!: Phaser.GameObjects.Text;
  private parLabel!: Phaser.GameObjects.Text;
  private nameLabel!: Phaser.GameObjects.Text;

  private bgGraphics!: Phaser.GameObjects.Graphics;

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
    this.bgGraphics = this.add.graphics();
    this.bgGraphics.setDepth(0);

    this.loadHole(HOLES[this.currentHoleIndex]!);
    this.createHUD();
    this.setupInput();

    this.scale.on('resize', () => {
      this.cleanupHole();
      this.bgGraphics.destroy();
      this.bgGraphics = this.add.graphics();
      this.bgGraphics.setDepth(0);
      this.loadHole(HOLES[this.currentHoleIndex]!);
      this.hud.destroy();
      this.createHUD();
    });
  }

  private loadHole(def: HoleDefinition): void {
    this.drawBackground();

    this.walls = new Walls(this);
    // Draw green fill first
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
      for (const z of def.frictionZones) {
        this.obstacles.addZone('sand', z);
      }
    }
    if (def.slickZones) {
      for (const z of def.slickZones) {
        this.obstacles.addZone('ice', z);
      }
    }
    if (def.waterZones) {
      for (const z of def.waterZones) {
        this.obstacles.addZone('water', z);
      }
    }
    if (def.teleporters) {
      for (const tp of def.teleporters) {
        this.obstacles.addTeleporter(tp);
      }
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
    this.bgGraphics.fillStyle(0x1a472a, 1);
    this.bgGraphics.fillRect(0, 0, width, height);

    const { s } = getScaleFactor(this);
    const ox = (width - DESIGN_WIDTH * s) / 2;
    const oy = (height - DESIGN_HEIGHT * s) / 2;
    this.bgGraphics.fillStyle(0x0d3320, 0.5);
    this.bgGraphics.fillRect(ox, oy, DESIGN_WIDTH * s, DESIGN_HEIGHT * s);
  }

  private createHUD(): void {
    const { width } = this.scale;
    const def = HOLES[this.currentHoleIndex]!;

    this.hud = this.add.container(0, 0);
    this.hud.setDepth(200);

    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x000000, 0.5);
    hudBg.fillRoundedRect(10, 8, width - 20, 36, 8);
    this.hud.add(hudBg);

    const fontSize = '14px';
    const fontFamily = '"Arial Black", sans-serif';

    this.holeLabel = this.add
      .text(24, 16, `HOLE ${def.id}`, {
        fontFamily,
        fontSize,
        color: '#ff69b4',
      })
      .setOrigin(0, 0);
    this.hud.add(this.holeLabel);

    this.nameLabel = this.add
      .text(width / 2, 16, def.name, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#8fbfa0',
        fontStyle: 'italic',
      })
      .setOrigin(0.5, 0);
    this.hud.add(this.nameLabel);

    this.parLabel = this.add
      .text(width - 120, 16, `PAR ${def.par}`, {
        fontFamily,
        fontSize,
        color: '#ffd700',
      })
      .setOrigin(0, 0);
    this.hud.add(this.parLabel);

    this.strokeLabel = this.add
      .text(width - 30, 16, `${this.strokes}`, {
        fontFamily,
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(1, 0);
    this.hud.add(this.strokeLabel);
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
    this.strokeLabel.setText(`${this.strokes}`);

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

    this.ball.update();
    this.ball.clampSpeed(MAX_SHOT_VELOCITY * getScaleFactor(this).s * 1.2);
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
    this.strokeLabel.setText(`${this.strokes}`);
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
