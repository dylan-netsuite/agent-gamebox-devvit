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

    // Semi-transparent overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.15);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(50);

    // Panel background
    const panelW = Math.min(width * 0.7, 300);
    const panelH = Math.min(height * 0.65, 200);
    const panel = this.add.graphics();
    panel.fillStyle(0xf7f7f7, 0.95);
    panel.fillRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 6);
    panel.lineStyle(2, 0x535353, 0.3);
    panel.strokeRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 6);
    panel.setDepth(51);

    const sf = Math.min(width / 800, height / 400);
    const titleSize = Math.max(18, Math.round(24 * sf));
    const scoreSize = Math.max(24, Math.round(32 * sf));
    const labelSize = Math.max(10, Math.round(12 * sf));

    // GAME OVER title
    this.add
      .text(cx, cy - panelH * 0.32, 'GAME OVER', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${titleSize}px`,
        color: '#535353',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(52);

    // Score
    this.add
      .text(cx, cy - panelH * 0.05, String(this.score).padStart(5, '0'), {
        fontFamily: '"Courier New", monospace',
        fontSize: `${scoreSize}px`,
        color: '#535353',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(52);

    // High score indicator
    const isNewHigh = this.score >= this.highScore && this.score > 0;
    const hiText = isNewHigh ? 'NEW HIGH SCORE!' : `HI ${String(this.highScore).padStart(5, '0')}`;
    const hiColor = isNewHigh ? '#e85d04' : '#999';

    this.add
      .text(cx, cy + panelH * 0.12, hiText, {
        fontFamily: '"Courier New", monospace',
        fontSize: `${labelSize}px`,
        color: hiColor,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(52);

    // Restart button
    const restartIcon = this.add.image(cx, cy + panelH * 0.32, 'restart-icon');
    restartIcon.setDepth(52);
    restartIcon.setInteractive({ useHandCursor: true });
    restartIcon.on('pointerdown', () => this.doRestart());

    // Restart text
    this.add
      .text(cx, cy + panelH * 0.32 + 24, 'TAP or SPACE', {
        fontFamily: '"Courier New", monospace',
        fontSize: `${Math.max(8, Math.round(9 * sf))}px`,
        color: '#aaa',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(52);

    // Delay before allowing restart to prevent accidental restarts
    this.time.delayedCall(500, () => {
      this.canRestart = true;
    });

    // Keyboard restart
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
