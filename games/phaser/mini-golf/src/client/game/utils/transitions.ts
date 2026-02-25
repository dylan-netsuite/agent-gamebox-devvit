import { Scene } from 'phaser';

export const SCENE_COLORS = {
  dark: 0x1a472a,
  green: 0x2d8a4e,
  pink: 0xff69b4,
  gold: 0xffd700,
  teal: 0x00ced1,
} as const;

export function fadeIn(scene: Scene, color: number = SCENE_COLORS.dark): void {
  const { width, height } = scene.scale;
  const overlay = scene.add.graphics();
  overlay.fillStyle(color, 1);
  overlay.fillRect(0, 0, width, height);
  overlay.setDepth(9999);

  scene.tweens.add({
    targets: overlay,
    alpha: 0,
    duration: 300,
    ease: 'Power2',
    onComplete: () => overlay.destroy(),
  });
}

export function transitionTo(
  scene: Scene,
  target: string,
  data?: Record<string, unknown>,
  color: number = SCENE_COLORS.dark
): void {
  const { width, height } = scene.scale;
  const overlay = scene.add.graphics();
  overlay.fillStyle(color, 1);
  overlay.fillRect(0, 0, width, height);
  overlay.setAlpha(0);
  overlay.setDepth(9999);

  scene.tweens.add({
    targets: overlay,
    alpha: 1,
    duration: 200,
    ease: 'Power2',
    onComplete: () => {
      scene.scene.start(target, data);
    },
  });
}
