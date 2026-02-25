import { Scene } from 'phaser';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x1a472a);

    const g = this.add.graphics();
    g.fillGradientStyle(0x1a472a, 0x1a472a, 0x0d3320, 0x0d3320, 1, 1, 1, 1);
    g.fillRect(0, 0, width, height);

    const glow = this.add.graphics();
    glow.fillStyle(0xff69b4, 0.08);
    glow.fillEllipse(width / 2, height * 0.4, width * 0.6, height * 0.3);

    const titleY = height / 2 - 40;
    const title = this.add
      .text(width / 2, titleY, 'MINI GOLF', {
        fontFamily: '"Arial Black", "Impact", sans-serif',
        fontSize: `${Math.min(36, width * 0.06)}px`,
        color: '#ff69b4',
        stroke: '#8b0a50',
        strokeThickness: 2,
        shadow: { offsetX: 0, offsetY: 0, color: '#ff1493', blur: 20, fill: false, stroke: true },
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
    barBg.fillStyle(0x0d3320, 1);
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
        barFill.fillStyle(0xff69b4, 1);
        barFill.fillRoundedRect(barX, barY, barW * fillProgress.value, barH, 3);
      },
    });

    this.time.delayedCall(500, () => {
      this.scene.start('MainMenu');
    });
  }
}
