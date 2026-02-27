import * as Phaser from 'phaser';

const DEFAULT_DURATION = 350;
const DEFAULT_COLOR = 0x0d0d1a;

/**
 * Tinted fade-out → scene start → tinted fade-in on the target scene.
 * Accent color gives visual continuity between scenes.
 */
export function transitionTo(
  scene: Phaser.Scene,
  target: string,
  data?: Record<string, unknown>,
  fadeColor: number = DEFAULT_COLOR,
  duration: number = DEFAULT_DURATION
): void {
  const r = (fadeColor >> 16) & 0xff;
  const g = (fadeColor >> 8) & 0xff;
  const b = fadeColor & 0xff;

  scene.cameras.main.fadeOut(duration, r, g, b);
  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    scene.scene.start(target, data);
  });
}

/**
 * Fade-in on create() — call this at the start of each scene.
 */
export function fadeIn(
  scene: Phaser.Scene,
  fadeColor: number = DEFAULT_COLOR,
  duration: number = 400
): void {
  const r = (fadeColor >> 16) & 0xff;
  const g = (fadeColor >> 8) & 0xff;
  const b = fadeColor & 0xff;

  scene.cameras.main.fadeIn(duration, r, g, b);
}

export const SCENE_COLORS = {
  dark: 0x0d0d1a,
  teal: 0x2a9d8f,
  gold: 0xe9c46a,
  purple: 0x6a4c93,
  red: 0xe63946,
  blue: 0x457b9d,
} as const;
