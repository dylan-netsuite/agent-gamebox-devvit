import { Scene } from 'phaser';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x1a0a2e);

    const titleY = height / 2 - 40;
    const title = this.add
      .text(width / 2, titleY, 'MEERCA CHASE', {
        fontFamily: '"Arial Black", "Impact", sans-serif',
        fontSize: `${Math.min(32, width * 0.06)}px`,
        color: '#ffd700',
        stroke: '#8b6914',
        strokeThickness: 2,
        shadow: { offsetX: 0, offsetY: 0, color: '#ffaa00', blur: 20, fill: false, stroke: true },
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(2);

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
    barBg.fillStyle(0x0d0620, 1);
    barBg.fillRoundedRect(barX, barY, barW, barH, 3);
    barBg.setDepth(2);

    const barFill = this.add.graphics();
    barFill.setDepth(2);
    const fillProgress = { value: 0 };

    this.tweens.add({
      targets: fillProgress,
      value: 1,
      duration: 350,
      ease: 'Power2',
      onUpdate: () => {
        barFill.clear();
        barFill.fillStyle(0xffd700, 1);
        barFill.fillRoundedRect(barX, barY, barW * fillProgress.value, barH, 3);
      },
    });

    this.time.delayedCall(500, () => {
      this.scene.start('MainMenu');
    });
  }
}
