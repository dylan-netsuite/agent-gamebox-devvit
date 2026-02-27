import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { soundManager } from '../audio/SoundManager';

/**
 * Animated intro splash -- plays once after loading, before the MainMenu.
 * Shows a cinematic Jeopardy reveal with sequenced animations.
 */
export class IntroSplash extends Scene {
  private autoAdvanceTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super('IntroSplash');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(0x000000);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Starfield background particles
    for (let i = 0; i < 40; i++) {
      const star = this.add.graphics();
      const size = 1 + Math.random() * 2;
      const alpha = 0.3 + Math.random() * 0.5;
      star.fillStyle(0xffffff, alpha);
      star.fillCircle(0, 0, size);
      star.setPosition(Math.random() * width, Math.random() * height);
      star.setAlpha(0);

      this.tweens.add({
        targets: star,
        alpha: alpha,
        duration: 300 + Math.random() * 500,
        delay: i * 30,
      });
    }

    // Subtle gold horizontal rays from center
    const rays = this.add.graphics().setAlpha(0);
    rays.fillStyle(0xffd700, 0.06);
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const len = Math.max(width, height) * 0.7;
      rays.fillRect(
        width / 2 - 1,
        height / 2 - 1,
        Math.cos(angle) * len,
        Math.sin(angle) * 3,
      );
    }
    this.tweens.add({ targets: rays, alpha: 1, duration: 1000, delay: 200 });

    // "THIS..." text
    const thisText = this.add
      .text(width / 2, height * 0.32, 'THIS...', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#8888BB',
        align: 'center',
        fontStyle: 'italic',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: thisText,
      alpha: 1,
      duration: 600,
      delay: 400,
    });

    // "IS" text
    const isText = this.add
      .text(width / 2, height * 0.39, 'IS', {
        fontFamily: 'Arial Black',
        fontSize: '28px',
        color: '#AAAADD',
        align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: isText,
      alpha: 1,
      duration: 400,
      delay: 900,
    });

    // Main title
    const title = this.add
      .text(width / 2, height * 0.52, 'JEOPARDY!', {
        fontFamily: 'Arial Black',
        fontSize: '72px',
        color: '#FFD700',
        stroke: '#8B6914',
        strokeThickness: 6,
        align: 'center',
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: '#FFD700',
          blur: 30,
          fill: false,
          stroke: true,
        },
      })
      .setOrigin(0.5)
      .setScale(0.2)
      .setAlpha(0);

    this.tweens.add({
      targets: title,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 800,
      delay: 1200,
      ease: 'Back.easeOut',
      onStart: () => soundManager.fanfare(),
    });

    // Title pulse
    this.tweens.add({
      targets: title,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 1200,
      delay: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Decorative gold line
    const line = this.add.graphics().setAlpha(0);
    line.lineStyle(2, 0xffd700, 0.5);
    line.lineBetween(width * 0.2, height * 0.66, width * 0.8, height * 0.66);
    this.tweens.add({ targets: line, alpha: 1, duration: 400, delay: 2000 });

    // "Tap to begin" prompt
    const tapText = this.add
      .text(width / 2, height * 0.74, 'Tap to begin', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#8888BB',
        align: 'center',
        fontStyle: 'italic',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: tapText,
      alpha: 0.7,
      duration: 500,
      delay: 2500,
    });

    // Click or tap to advance
    this.input.once('pointerdown', () => this.advance());

    // Auto-advance after 5 seconds
    this.autoAdvanceTimer = this.time.delayedCall(5000, () => this.advance());
  }

  private advance(): void {
    if (this.autoAdvanceTimer) {
      this.autoAdvanceTimer.destroy();
      this.autoAdvanceTimer = null;
    }
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('MainMenu');
    });
  }

}
