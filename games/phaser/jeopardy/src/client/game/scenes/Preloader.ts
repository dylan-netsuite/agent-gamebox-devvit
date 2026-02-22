import { Scene } from 'phaser';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  init() {
    const { width, height } = this.scale;
    const sf = Math.min(width / 1024, height / 768);

    this.cameras.main.setBackgroundColor(0x030570);

    // Loading title
    this.add
      .text(width / 2, height * 0.38, 'JEOPARDY!', {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(24, Math.round(48 * sf))}px`,
        color: '#FFD700',
        stroke: '#8B6914',
        strokeThickness: Math.max(2, Math.round(4 * sf)),
        align: 'center',
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000000',
          blur: 6,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setAlpha(0.8);

    // Progress bar container (rounded)
    const barW = Math.min(400, width * 0.5);
    const barH = 16;
    const barX = width / 2 - barW / 2;
    const barY = height * 0.52;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x111133, 1);
    barBg.fillRoundedRect(barX, barY, barW, barH, 8);
    barBg.lineStyle(1, 0xffd700, 0.3);
    barBg.strokeRoundedRect(barX, barY, barW, barH, 8);

    // Progress bar fill
    const barFill = this.add.graphics();

    // Loading text
    const loadingText = this.add
      .text(width / 2, height * 0.58, 'Loading...', {
        fontFamily: 'Arial',
        fontSize: `${Math.max(10, Math.round(14 * sf))}px`,
        color: '#AAAADD',
        align: 'center',
        fontStyle: 'italic',
      })
      .setOrigin(0.5)
      .setAlpha(0.6);

    this.load.on('progress', (progress: number) => {
      barFill.clear();
      const fillW = Math.max(4, (barW - 4) * progress);
      barFill.fillStyle(0xffd700, 1);
      barFill.fillRoundedRect(barX + 2, barY + 2, fillW, barH - 4, 6);

      loadingText.setText(`Loading... ${Math.round(progress * 100)}%`);
    });
  }

  preload() {
    this.load.setPath('../assets');
    this.load.image('logo', 'logo.png');
  }

  create() {
    // Fade out to MainMenu (skipping IntroSplash)
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MainMenu');
    });
  }
}
