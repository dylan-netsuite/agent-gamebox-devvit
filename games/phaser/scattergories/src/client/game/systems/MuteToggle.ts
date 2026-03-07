import type { Scene } from 'phaser';
import { SoundManager } from './SoundManager';

interface MuteToggleOptions {
  x: number;
  y: number;
  fontSize?: string;
  originX?: number;
  originY?: number;
}

export function createMuteToggle(scene: Scene, opts: MuteToggleOptions): void {
  const { x, y, fontSize = '18px', originX = 0, originY = 0 } = opts;

  const muteText = scene.add
    .text(x, y, SoundManager.isMuted() ? '🔇' : '🔊', { fontSize })
    .setOrigin(originX, originY);

  const hitSize = parseInt(fontSize, 10) + 12;
  const zoneX = originX === 1 ? muteText.x - hitSize / 2 : muteText.x + hitSize / 2;
  const zoneY = muteText.y + hitSize / 2;

  const zone = scene.add
    .zone(zoneX, zoneY, hitSize, hitSize)
    .setInteractive({ useHandCursor: true });

  zone.on('pointerdown', () => {
    const newMuted = !SoundManager.isMuted();
    SoundManager.mute(newMuted);
    muteText.setText(newMuted ? '🔇' : '🔊');
    if (!newMuted) SoundManager.play('select');
  });
}
