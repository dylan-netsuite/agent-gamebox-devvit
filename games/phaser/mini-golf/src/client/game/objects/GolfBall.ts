import * as Phaser from 'phaser';
import {
  BALL_RADIUS,
  BALL_RESTITUTION,
  BALL_FRICTION,
  BALL_FRICTION_AIR,
  BALL_FRICTION_STATIC,
  BALL_DENSITY,
  getBallSpeed,
  BALL_STOP_VELOCITY,
  scaleValue,
} from '../utils/physics';

export class GolfBall {
  scene: Phaser.Scene;
  body: MatterJS.BodyType;
  graphics: Phaser.GameObjects.Graphics;
  trail: Phaser.GameObjects.Graphics;
  private trailPoints: { x: number; y: number; alpha: number }[] = [];
  private defaultFrictionAir: number;
  radius: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.radius = scaleValue(scene, BALL_RADIUS);
    this.defaultFrictionAir = BALL_FRICTION_AIR;

    this.body = scene.matter.add.circle(x, y, this.radius, {
      restitution: BALL_RESTITUTION,
      friction: BALL_FRICTION,
      frictionAir: BALL_FRICTION_AIR,
      frictionStatic: BALL_FRICTION_STATIC,
      density: BALL_DENSITY,
      label: 'golfBall',
    });

    this.trail = scene.add.graphics();
    this.trail.setDepth(1);

    this.graphics = scene.add.graphics();
    this.graphics.setDepth(10);
    this.drawBall();
  }

  private drawBall(): void {
    this.graphics.clear();
    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillCircle(0, 0, this.radius);
    this.graphics.lineStyle(1, 0xcccccc, 0.6);
    this.graphics.strokeCircle(0, 0, this.radius);
    this.graphics.fillStyle(0xeeeeee, 0.4);
    this.graphics.fillCircle(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.3);
  }

  update(): void {
    this.graphics.setPosition(this.body.position.x, this.body.position.y);

    const speed = getBallSpeed(this.body);
    if (speed > 0.5) {
      this.trailPoints.unshift({
        x: this.body.position.x,
        y: this.body.position.y,
        alpha: 0.3,
      });
    }

    if (this.trailPoints.length > 20) {
      this.trailPoints.length = 20;
    }

    this.trail.clear();
    for (let i = 0; i < this.trailPoints.length; i++) {
      const p = this.trailPoints[i]!;
      p.alpha *= 0.88;
      if (p.alpha < 0.01) {
        this.trailPoints.length = i;
        break;
      }
      this.trail.fillStyle(0xffffff, p.alpha);
      const r = this.radius * (1 - i / this.trailPoints.length) * 0.6;
      this.trail.fillCircle(p.x, p.y, r);
    }

    if (speed < BALL_STOP_VELOCITY && speed > 0) {
      this.scene.matter.body.setVelocity(this.body, { x: 0, y: 0 });
    }
  }

  setPosition(x: number, y: number): void {
    this.scene.matter.body.setPosition(this.body, { x, y });
    this.scene.matter.body.setVelocity(this.body, { x: 0, y: 0 });
    this.trailPoints.length = 0;
    this.trail.clear();
  }

  applyShot(angle: number, power: number): void {
    const fx = Math.cos(angle) * power;
    const fy = Math.sin(angle) * power;
    this.scene.matter.body.setVelocity(this.body, { x: fx, y: fy });
  }

  setFrictionAir(value: number): void {
    (this.body as unknown as { frictionAir: number }).frictionAir = value;
  }

  resetFrictionAir(): void {
    (this.body as unknown as { frictionAir: number }).frictionAir = this.defaultFrictionAir;
  }

  isStopped(): boolean {
    return getBallSpeed(this.body) < BALL_STOP_VELOCITY;
  }

  getSpeed(): number {
    return getBallSpeed(this.body);
  }

  destroy(): void {
    this.scene.matter.world.remove(this.body);
    this.graphics.destroy();
    this.trail.destroy();
  }
}
