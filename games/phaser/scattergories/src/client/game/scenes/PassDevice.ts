import { Scene } from 'phaser';
import { SoundManager } from '../systems/SoundManager';
import type { GamePlayData } from './GamePlay';

export interface PassDeviceData extends GamePlayData {
  nextPlayerName: string;
}

export class PassDevice extends Scene {
  constructor() {
    super('PassDevice');
  }

  create(data: PassDeviceData) {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.cameras.main.setBackgroundColor('#0f1a30');
    this.cameras.main.setAlpha(0);
    this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: 300, ease: 'Sine.easeOut' });

    const shieldIcon = this.add
      .text(cx, cy - 60, '🔒', { fontSize: '48px' })
      .setOrigin(0.5);
    shieldIcon.setAlpha(0);
    this.tweens.add({ targets: shieldIcon, alpha: 1, y: cy - 50, duration: 500, delay: 100, ease: 'Back.easeOut' });

    const passText = this.add
      .text(cx, cy, 'PASS THE DEVICE TO', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#8899aa',
        letterSpacing: 2,
      })
      .setOrigin(0.5);
    passText.setAlpha(0);
    this.tweens.add({ targets: passText, alpha: 1, duration: 400, delay: 300 });

    const nameText = this.add
      .text(cx, cy + 30, data.nextPlayerName, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#f39c12',
      })
      .setOrigin(0.5);
    nameText.setAlpha(0);
    nameText.setScale(0.8);
    this.tweens.add({
      targets: nameText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      delay: 400,
      ease: 'Back.easeOut',
    });

    const tapText = this.add
      .text(cx, cy + 80, 'TAP ANYWHERE WHEN READY', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#3498db',
      })
      .setOrigin(0.5);
    tapText.setAlpha(0);
    this.tweens.add({
      targets: tapText,
      alpha: 1,
      duration: 400,
      delay: 800,
      onComplete: () => {
        this.tweens.add({
          targets: tapText,
          alpha: 0.4,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      },
    });

    this.time.delayedCall(900, () => {
      this.input.once('pointerdown', () => {
        SoundManager.play('select');
        this.tweens.add({
          targets: this.cameras.main,
          alpha: 0,
          duration: 200,
          ease: 'Sine.easeIn',
          onComplete: () => {
            this.scene.start('GamePlay', data);
          },
        });
      });

      if (this.input.keyboard) {
        this.input.keyboard.once('keydown', () => {
          SoundManager.play('select');
          this.tweens.add({
            targets: this.cameras.main,
            alpha: 0,
            duration: 200,
            ease: 'Sine.easeIn',
            onComplete: () => {
              this.scene.start('GamePlay', data);
            },
          });
        });
      }
    });
  }
}
