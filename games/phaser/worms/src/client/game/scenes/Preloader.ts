import { Scene } from 'phaser';
import { CHARACTERS } from '../../../shared/types/characters';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  preload() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    const titleText = this.add
      .text(cx, cy - 50, 'WORMS', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '42px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000000', 4);

    const loadingText = this.add
      .text(cx, cy + 10, 'Loading fighters...', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '14px',
        color: '#88aacc',
      })
      .setOrigin(0.5);

    const barW = 200;
    const barH = 8;
    const barX = cx - barW / 2;
    const barY = cy + 35;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x222244, 1);
    barBg.fillRoundedRect(barX, barY, barW, barH, 4);

    const barFill = this.add.graphics();

    this.load.on('progress', (value: number) => {
      barFill.clear();
      barFill.fillStyle(0xe94560, 1);
      barFill.fillRoundedRect(barX, barY, barW * value, barH, 4);
    });

    this.load.on('complete', () => {
      titleText.destroy();
      loadingText.destroy();
      barBg.destroy();
      barFill.destroy();
    });

    for (const char of CHARACTERS) {
      this.load.image(char.portrait, `portraits/${char.id}.jpg`);
    }
  }

  create() {
    this.scene.start('GameSetup');
  }
}
