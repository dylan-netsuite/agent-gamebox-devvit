import { Scene } from 'phaser';
import * as Phaser from 'phaser';

interface GameOverData {
  score: number;
  neggsCaught: number;
  difficulty: 'classic' | 'hard';
}

export class GameOver extends Scene {
  private allObjects: Phaser.GameObjects.GameObject[] = [];
  private score = 0;
  private neggsCaught = 0;
  private difficulty: 'classic' | 'hard' = 'classic';
  private submitted = false;

  constructor() {
    super('GameOver');
  }

  init(data: GameOverData) {
    this.score = data.score ?? 0;
    this.neggsCaught = data.neggsCaught ?? 0;
    this.difficulty = data.difficulty ?? 'classic';
    this.submitted = false;
  }

  create() {
    this.cameras.main.setBackgroundColor(0x1a0a2e);
    this.allObjects = [];
    this.buildUI();
    void this.submitScore();
  }

  private async submitScore(): Promise<void> {
    if (this.submitted) return;
    this.submitted = true;
    try {
      await fetch('/api/score/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: this.score,
          neggsCaught: this.neggsCaught,
          difficulty: this.difficulty,
        }),
      });
    } catch {
      // best-effort
    }
  }

  private buildUI(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const sf = Math.min(width / 800, height / 600);

    const bg = this.add.tileSprite(cx, height / 2, width, height, 'grid-bg');
    bg.setDepth(0);
    this.allObjects.push(bg);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x1a0a2e, 0.75);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(1);
    this.allObjects.push(overlay);

    const titleY = height * 0.15;
    const titleSize = Math.max(24, Math.round(40 * sf));
    const title = this.add
      .text(cx, titleY, 'GAME OVER', {
        fontFamily: '"Arial Black", "Impact", sans-serif',
        fontSize: `${titleSize}px`,
        color: '#ff4444',
        stroke: '#8b0000',
        strokeThickness: 3,
        shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 20, fill: false, stroke: true },
      })
      .setOrigin(0.5)
      .setDepth(3);
    this.allObjects.push(title);

    this.tweens.add({
      targets: title,
      scaleX: { from: 1.5, to: 1 },
      scaleY: { from: 1.5, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 400,
      ease: 'Back.easeOut',
    });

    const scoreY = height * 0.32;
    const scoreSize = Math.max(36, Math.round(56 * sf));
    const scoreLabel = this.add
      .text(cx, scoreY - 20, 'FINAL SCORE', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${Math.max(10, Math.round(12 * sf))}px`,
        color: '#6b5b8a',
        letterSpacing: 3,
      })
      .setOrigin(0.5)
      .setDepth(3);
    this.allObjects.push(scoreLabel);

    const scoreText = this.add
      .text(cx, scoreY + 20, `${this.score}`, {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${scoreSize}px`,
        color: '#ffd700',
        stroke: '#8b6914',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(3);
    this.allObjects.push(scoreText);

    const neggLabel = this.add
      .text(cx, scoreY + scoreSize * 0.6 + 10, `${this.neggsCaught} Neggs collected`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.max(11, Math.round(14 * sf))}px`,
        color: '#a89cc8',
      })
      .setOrigin(0.5)
      .setDepth(3);
    this.allObjects.push(neggLabel);

    const btnW = Math.min(width * 0.6, 260);
    const btnH = Math.max(42, Math.round(48 * sf));
    const gap = Math.max(12, Math.round(14 * sf));
    const labelSize = Math.max(14, Math.round(16 * sf));

    let curY = height * 0.58;

    curY = this.addButton(cx, curY, btnW, btnH, 'PLAY AGAIN', labelSize, 0x00c853, () =>
      this.scene.start('Game', { difficulty: this.difficulty })
    );
    curY += gap;

    curY = this.addButton(cx, curY, btnW, btnH, 'LEADERBOARD', labelSize, 0xffd700, () =>
      this.scene.start('Leaderboard')
    );
    curY += gap;

    this.addButton(cx, curY, btnW, btnH, 'MAIN MENU', labelSize, 0x6b5b8a, () =>
      this.scene.start('MainMenu')
    );
  }

  private addButton(
    cx: number,
    y: number,
    w: number,
    h: number,
    label: string,
    fontSize: number,
    color: number,
    onClick: () => void
  ): number {
    const btnContainer = this.add.container(cx, y + h / 2);
    btnContainer.setDepth(10);
    this.allObjects.push(btnContainer);

    const bg = this.add.graphics();
    bg.fillStyle(0x160b28, 0.9);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    bg.lineStyle(2, color, 0.5);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    btnContainer.add(bg);

    const text = this.add
      .text(0, 0, label, {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${fontSize}px`,
        color: '#e0e8f0',
        align: 'center',
      })
      .setOrigin(0.5);
    btnContainer.add(text);

    const hitArea = this.add
      .rectangle(0, 0, w, h)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.001);
    btnContainer.add(hitArea);

    hitArea.on('pointerover', () => {
      this.tweens.add({ targets: btnContainer, scaleX: 1.04, scaleY: 1.04, duration: 120, ease: 'Power2' });
    });
    hitArea.on('pointerout', () => {
      this.tweens.add({ targets: btnContainer, scaleX: 1, scaleY: 1, duration: 120, ease: 'Power2' });
    });
    hitArea.on('pointerdown', () => {
      this.tweens.add({
        targets: btnContainer,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 80,
        yoyo: true,
        ease: 'Power2',
        onComplete: onClick,
      });
    });

    return y + h;
  }
}
