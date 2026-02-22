import { Scene } from 'phaser';
import * as Phaser from 'phaser';

export class GameOver extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  private allObjects: Phaser.GameObjects.GameObject[] = [];
  private finalScore = 0;
  private scoreText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super('GameOver');
  }

  init(data: { score?: number }) {
    this.finalScore = data.score ?? 0;
  }

  private get sf(): number {
    return Math.min(this.scale.width / 1024, this.scale.height / 768);
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x030570);
    this.camera.fadeIn(600, 0, 0, 0);
    this.allObjects = [];
    this.scoreText = null;

    this.buildUI();

    this.scale.on('resize', () => {
      this.destroyAll();
      this.buildUI();
    });
  }

  private destroyAll(): void {
    for (const obj of this.allObjects) obj.destroy();
    this.allObjects = [];
    this.scoreText = null;
  }

  private buildUI(): void {
    const { width, height } = this.scale;
    const sf = this.sf;

    // Gold decorative lines
    const decorLine1 = this.add.graphics();
    decorLine1.fillStyle(0xffd700, 0.3);
    decorLine1.fillRect(width * 0.15, height * 0.18, width * 0.7, 2);
    decorLine1.fillRect(width * 0.2, height * 0.19, width * 0.6, 1);
    decorLine1.setAlpha(0);
    this.allObjects.push(decorLine1);

    const decorLine2 = this.add.graphics();
    decorLine2.fillStyle(0xffd700, 0.3);
    decorLine2.fillRect(width * 0.15, height * 0.82, width * 0.7, 2);
    decorLine2.fillRect(width * 0.2, height * 0.83, width * 0.6, 1);
    decorLine2.setAlpha(0);
    this.allObjects.push(decorLine2);

    // Game Over title
    const gameOverText = this.add
      .text(width / 2, height * 0.28, 'GAME OVER', {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(28, Math.round(56 * sf))}px`,
        color: '#FFD700',
        stroke: '#8B6914',
        strokeThickness: Math.max(3, Math.round(5 * sf)),
        align: 'center',
        shadow: {
          offsetX: 3,
          offsetY: 3,
          color: '#000000',
          blur: 8,
          fill: true,
          stroke: true,
        },
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(0.7);
    this.allObjects.push(gameOverText);

    this.tweens.add({
      targets: gameOverText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      ease: 'Back.easeOut',
      delay: 200,
    });

    this.tweens.add({
      targets: [decorLine1, decorLine2],
      alpha: 1,
      duration: 500,
      delay: 400,
    });

    // Score label
    const scoreLabelText = this.add
      .text(width / 2, height * 0.42, 'Final Score', {
        fontFamily: 'Arial',
        fontSize: `${Math.max(14, Math.round(20 * sf))}px`,
        color: '#AAAADD',
        align: 'center',
        fontStyle: 'italic',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.allObjects.push(scoreLabelText);

    this.tweens.add({
      targets: scoreLabelText,
      alpha: 0.8,
      duration: 400,
      delay: 600,
    });

    // Score value
    this.scoreText = this.add
      .text(width / 2, height * 0.52, '$0', {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(28, Math.round(52 * sf))}px`,
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: Math.max(2, Math.round(4 * sf)),
        align: 'center',
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: '#FFD700',
          blur: 12,
          fill: false,
          stroke: true,
        },
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.allObjects.push(this.scoreText);

    this.tweens.add({
      targets: this.scoreText,
      alpha: 1,
      duration: 400,
      delay: 800,
      onComplete: () => this.animateScoreCountUp(),
    });

    // Replay button
    const btnW = Math.max(160, Math.round(220 * sf));
    const btnH = Math.max(38, Math.round(50 * sf));
    const btnY = height * 0.7;

    const replayBg = this.add.graphics().setAlpha(0);
    this.drawPillButton(replayBg, width / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 0x1a1aff, 0xffd700);
    this.allObjects.push(replayBg);

    const replayButton = this.add
      .text(width / 2, btnY, 'PLAY AGAIN', {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(14, Math.round(22 * sf))}px`,
        color: '#FFD700',
        align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.allObjects.push(replayButton);

    this.tweens.add({
      targets: [replayButton, replayBg],
      alpha: 1,
      duration: 500,
      delay: 1800,
    });

    replayButton
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        replayBg.clear();
        this.drawPillButton(replayBg, width / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 0x2a2aff, 0xffd700);
        this.tweens.add({ targets: replayButton, scaleX: 1.05, scaleY: 1.05, duration: 100 });
      })
      .on('pointerout', () => {
        replayBg.clear();
        this.drawPillButton(replayBg, width / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 0x1a1aff, 0xffd700);
        this.tweens.add({ targets: replayButton, scaleX: 1, scaleY: 1, duration: 100 });
      })
      .on('pointerdown', () => {
        this.camera.fadeOut(400, 0, 0, 0);
        this.camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('MainMenu');
        });
      });
  }

  private animateScoreCountUp(): void {
    if (!this.scoreText || this.finalScore === 0) {
      if (this.scoreText) this.scoreText.setText('$0');
      return;
    }

    const isNegative = this.finalScore < 0;
    const absTarget = Math.abs(this.finalScore);
    const duration = Math.min(1500, Math.max(500, absTarget / 2));
    const scoreRef = this.scoreText;

    this.tweens.addCounter({
      from: 0,
      to: absTarget,
      duration,
      ease: 'Cubic.easeOut',
      onUpdate: (tween) => {
        const val = Math.round(tween.getValue());
        const str = isNegative ? `-$${val}` : `$${val}`;
        scoreRef.setText(str);
      },
      onComplete: () => {
        this.tweens.add({
          targets: scoreRef,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 400,
          yoyo: true,
          ease: 'Sine.easeInOut',
        });
      },
    });
  }

  private drawPillButton(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, fill: number, stroke: number): void {
    g.fillStyle(fill, 1);
    g.fillRoundedRect(x, y, w, h, h / 2);
    g.lineStyle(2, stroke, 0.7);
    g.strokeRoundedRect(x, y, w, h, h / 2);
  }
}
