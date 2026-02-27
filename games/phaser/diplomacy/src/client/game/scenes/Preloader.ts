import { Scene } from 'phaser';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  preload() {
    // No assets to preload - map is rendered procedurally
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.add
      .text(cx, cy - 20, 'DIPLOMACY', {
        fontFamily: 'Georgia, serif',
        fontSize: '36px',
        color: '#e6c200',
        letterSpacing: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy + 20, 'Loading...', {
        fontFamily: 'Georgia, serif',
        fontSize: '16px',
        color: '#8899aa',
      })
      .setOrigin(0.5);

    this.time.delayedCall(500, () => {
      this.scene.start('MainMenu');
    });
  }
}
