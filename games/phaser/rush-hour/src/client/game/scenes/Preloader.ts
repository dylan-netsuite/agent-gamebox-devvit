import { Scene } from 'phaser';
import * as Phaser from 'phaser';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x0d0d1a);

    const g = this.add.graphics();
    g.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0f3460, 0x0f3460, 1, 1, 1, 1);
    g.fillRect(0, 0, width, height);

    const glow = this.add.graphics();
    glow.fillStyle(0xe63946, 0.08);
    glow.fillEllipse(width / 2, height * 0.4, width * 0.6, height * 0.3);

    const titleY = height / 2 - 40;
    const title = this.add
      .text(width / 2, titleY, 'RUSH HOUR', {
        fontFamily: '"Arial Black", "Impact", sans-serif',
        fontSize: `${Math.min(36, width * 0.06)}px`,
        color: '#ff6b6b',
        stroke: '#8b1a1a',
        strokeThickness: 2,
        shadow: { offsetX: 0, offsetY: 0, color: '#e63946', blur: 20, fill: false, stroke: true },
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: title,
      alpha: 1,
      scaleX: { from: 0.7, to: 1 },
      scaleY: { from: 0.7, to: 1 },
      duration: 500,
      ease: 'Back.easeOut',
    });

    const barW = Math.min(width * 0.55, 260);
    const barH = 6;
    const barX = (width - barW) / 2;
    const barY = height / 2 + 10;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x1e2a3a, 1);
    barBg.fillRoundedRect(barX, barY, barW, barH, 3);

    const barFill = this.add.graphics();
    const fillProgress = { value: 0 };

    this.tweens.add({
      targets: fillProgress,
      value: 1,
      duration: 350,
      ease: 'Power2',
      onUpdate: () => {
        barFill.clear();
        barFill.fillStyle(0xe63946, 1);
        barFill.fillRoundedRect(barX, barY, barW * fillProgress.value, barH, 3);
      },
    });

    this.time.delayedCall(500, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('MainMenu');
      });
    });
  }
}
