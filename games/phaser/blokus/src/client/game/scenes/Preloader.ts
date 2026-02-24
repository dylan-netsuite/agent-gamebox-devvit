import { Scene } from 'phaser';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  init() {
    const { width, height } = this.scale;
    const sf = Math.min(width / 1024, height / 768);

    this.cameras.main.setBackgroundColor(0x0d0d1a);

    this.add
      .text(width / 2, height * 0.35, 'BLOKUS', {
        fontFamily: '"Arial Black", Impact, sans-serif',
        fontSize: `${Math.round(48 * sf)}px`,
        color: '#4a90d9',
        stroke: '#1a3a6a',
        strokeThickness: 4 * sf,
      })
      .setOrigin(0.5)
      .setAlpha(0.8);

    const barW = Math.round(280 * sf);
    const barH = Math.round(24 * sf);
    const barX = width / 2 - barW / 2;
    const barY = height * 0.5;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x111133, 1);
    barBg.fillRoundedRect(barX, barY, barW, barH, 8);

    const barFill = this.add.graphics();

    const loadingText = this.add
      .text(width / 2, barY + barH + 16 * sf, 'Loading... 0%', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.round(14 * sf)}px`,
        color: '#6688aa',
      })
      .setOrigin(0.5);

    this.load.on('progress', (progress: number) => {
      barFill.clear();
      const fillW = Math.max(4, (barW - 4) * progress);
      barFill.fillStyle(0x4a90d9, 1);
      barFill.fillRoundedRect(barX + 2, barY + 2, fillW, barH - 4, 6);
      loadingText.setText(`Loading... ${Math.round(progress * 100)}%`);
    });
  }

  preload() {
    // No external assets needed - everything is procedurally generated
  }

  create() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MainMenu');
    });
  }
}
