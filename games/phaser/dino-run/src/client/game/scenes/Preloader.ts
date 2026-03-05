import { Scene } from 'phaser';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0xf7f7f7);

    const titleY = height / 2 - 30;
    const title = this.add
      .text(width / 2, titleY, 'DINO RUN', {
        fontFamily: '"Arial Black", "Impact", sans-serif',
        fontSize: `${Math.min(32, width * 0.05)}px`,
        color: '#535353',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: title,
      alpha: 1,
      scaleX: { from: 0.7, to: 1 },
      scaleY: { from: 0.7, to: 1 },
      duration: 400,
      ease: 'Back.easeOut',
    });

    const barW = Math.min(width * 0.5, 240);
    const barH = 4;
    const barX = (width - barW) / 2;
    const barY = height / 2 + 10;

    const barBg = this.add.graphics();
    barBg.fillStyle(0xe0e0e0, 1);
    barBg.fillRoundedRect(barX, barY, barW, barH, 2);

    const barFill = this.add.graphics();
    const fillProgress = { value: 0 };

    this.tweens.add({
      targets: fillProgress,
      value: 1,
      duration: 300,
      ease: 'Power2',
      onUpdate: () => {
        barFill.clear();
        barFill.fillStyle(0x535353, 1);
        barFill.fillRoundedRect(barX, barY, barW * fillProgress.value, barH, 2);
      },
    });

    this.time.delayedCall(450, () => {
      this.scene.start('MainMenu');
    });
  }
}
