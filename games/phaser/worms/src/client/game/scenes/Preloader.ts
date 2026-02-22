import { Scene } from 'phaser';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.add
      .text(cx, cy - 30, 'WORMS', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '42px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000000', 4);

    this.add
      .text(cx, cy + 15, 'Loading terrain...', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '16px',
        color: '#e0e0e0',
      })
      .setOrigin(0.5);

    this.time.delayedCall(500, () => {
      this.scene.start('GamePlay');
    });
  }
}
