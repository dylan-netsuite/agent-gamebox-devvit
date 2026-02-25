import * as Phaser from 'phaser';

export const BALL_RADIUS = 8;
export const BALL_RESTITUTION = 0.7;
export const BALL_FRICTION = 0.02;
export const BALL_FRICTION_AIR = 0.025;
export const BALL_FRICTION_STATIC = 0.1;
export const BALL_DENSITY = 0.002;

export const WALL_RESTITUTION = 0.7;

export const MAX_SHOT_FORCE = 0.06;
export const POWER_OSCILLATION_HZ = 1.8;
export const CAPTURE_VELOCITY_THRESHOLD = 1.8;
export const BALL_STOP_VELOCITY = 0.15;

export const SAND_FRICTION_AIR = 0.15;
export const ICE_FRICTION_AIR = 0.001;

export const BUMPER_RESTITUTION = 1.5;

export const DESIGN_WIDTH = 800;
export const DESIGN_HEIGHT = 600;

export function getBallSpeed(ball: MatterJS.BodyType): number {
  return Math.sqrt(ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y);
}

export function isBallStopped(ball: MatterJS.BodyType): boolean {
  return getBallSpeed(ball) < BALL_STOP_VELOCITY;
}

export function getScaleFactor(scene: Phaser.Scene): { sx: number; sy: number; s: number } {
  const { width, height } = scene.scale;
  const sx = width / DESIGN_WIDTH;
  const sy = height / DESIGN_HEIGHT;
  const s = Math.min(sx, sy);
  return { sx, sy, s };
}

export function toScreen(
  scene: Phaser.Scene,
  x: number,
  y: number
): { x: number; y: number } {
  const { width, height } = scene.scale;
  const { s } = getScaleFactor(scene);
  const ox = (width - DESIGN_WIDTH * s) / 2;
  const oy = (height - DESIGN_HEIGHT * s) / 2;
  return { x: ox + x * s, y: oy + y * s };
}

export function scaleValue(scene: Phaser.Scene, v: number): number {
  return v * getScaleFactor(scene).s;
}
