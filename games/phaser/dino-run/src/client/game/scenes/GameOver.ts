import { Scene } from 'phaser';
import { DinoGame } from './Game';

interface GameOverData {
  score: number;
  highScore: number;
}

export class GameOver extends Scene {
  private score = 0;
  private highScore = 0;
  private canRestart = false;

  constructor() {
    super('GameOver');
  }

  init(data: GameOverData) {
    this.score = data.score;
    this.highScore = data.highScore;
    this.canRestart = false;
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(50);

    // Animate overlay fade in
    this.tweens.add({
      targets: overlay,
      alpha: 0.2,
      duration: 300,
      ease: 'Power2',
    });

    const panelW = Math.min(width * 0.7, 320);
    const panelH = Math.min(height * 0.7, 220);
    const sf = Math.min(width / 800, height / 400);

    // Panel slides down from above
    const panelContainer = this.add.container(cx, cy - 100);
    panelContainer.setDepth(51);
    panelContainer.setAlpha(0);

    const panel = this.add.graphics();
    panel.fillStyle(0xf7f7f7, 0.97);
    panel.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 8);
    panel.lineStyle(2, 0x535353, 0.2);
    panel.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 8);
    panelContainer.add(panel);

    // GAME OVER title with red accent
    const titleSize = Math.max(20, Math.round(28 * sf));
    const titleText = this.add
      .text(0, -panelH * 0.32, 'GAME OVER', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${titleSize}px`,
        color: '#e85d04',
        align: 'center',
      })
      .setOrigin(0.5);
    panelContainer.add(titleText);

    // Score with large display
    const scoreSize = Math.max(28, Math.round(38 * sf));
    const scoreText = this.add
      .text(0, -panelH * 0.05, String(this.score).padStart(5, '0'), {
        fontFamily: '"Courier New", monospace',
        fontSize: `${scoreSize}px`,
        color: '#535353',
        align: 'center',
      })
      .setOrigin(0.5);
    panelContainer.add(scoreText);

    // High score
    const isNewHigh = this.score >= this.highScore && this.score > 0;
    const labelSize = Math.max(10, Math.round(13 * sf));

    if (isNewHigh) {
      const hiText = this.add
        .text(0, panelH * 0.12, 'NEW HIGH SCORE!', {
          fontFamily: '"Courier New", monospace',
          fontSize: `${labelSize}px`,
          color: '#e85d04',
          align: 'center',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      panelContainer.add(hiText);

      // Pulse animation for new high score
      this.tweens.add({
        targets: hiText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      const hiText = this.add
        .text(0, panelH * 0.12, `HI ${String(this.highScore).padStart(5, '0')}`, {
          fontFamily: '"Courier New", monospace',
          fontSize: `${labelSize}px`,
          color: '#999',
          align: 'center',
        })
        .setOrigin(0.5);
      panelContainer.add(hiText);
    }

    // Restart icon
    const restartIcon = this.add.image(0, panelH * 0.32, 'restart-icon');
    restartIcon.setInteractive({ useHandCursor: true });
    restartIcon.on('pointerdown', () => this.doRestart());
    panelContainer.add(restartIcon);

    const restartLabel = this.add
      .text(0, panelH * 0.32 + 24, 'TAP or SPACE', {
        fontFamily: '"Courier New", monospace',
        fontSize: `${Math.max(8, Math.round(9 * sf))}px`,
        color: '#aaa',
        align: 'center',
      })
      .setOrigin(0.5);
    panelContainer.add(restartLabel);

    // Slide-down entrance
    this.tweens.add({
      targets: panelContainer,
      y: cy,
      alpha: 1,
      duration: 350,
      ease: 'Back.easeOut',
    });

    // Score count-up animation
    const counter = { val: 0 };
    this.tweens.add({
      targets: counter,
      val: this.score,
      duration: 600,
      delay: 350,
      ease: 'Power2',
      onUpdate: () => {
        scoreText.setText(String(Math.floor(counter.val)).padStart(5, '0'));
      },
    });

    this.time.delayedCall(600, () => {
      this.canRestart = true;
    });

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', () => {
        if (this.canRestart) this.doRestart();
      });
    }

    this.input.on('pointerdown', () => {
      if (this.canRestart) this.doRestart();
    });
  }

  private doRestart(): void {
    const gameScene = this.scene.get('DinoGame') as DinoGame;
    gameScene.restart();
  }
}
