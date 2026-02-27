import { Scene, GameObjects } from 'phaser';
import * as Phaser from 'phaser';
import type { GameResponse, GameData, SavedGameResponse, SavedGameState } from '../../../shared/types/api';

export class MainMenu extends Scene {
  private allObjects: GameObjects.GameObject[] = [];
  private loadingText: GameObjects.Text | null = null;
  private isLoading = false;
  private savedState: SavedGameState | null = null;

  constructor() {
    super('MainMenu');
  }

  private get sf(): number {
    return Math.min(this.scale.width / 1024, this.scale.height / 768);
  }

  init(): void {
    this.allObjects = [];
    this.loadingText = null;
    this.isLoading = false;
    this.savedState = null;
  }

  create() {
    this.cameras.main.setBackgroundColor(0x060ce9);
    this.cameras.main.fadeIn(600, 0, 0, 0);

    this.checkForSavedGame();

    this.scale.on('resize', () => {
      if (!this.isLoading) {
        this.destroyAll();
        this.buildUI();
      }
    });
  }

  private checkForSavedGame(): void {
    fetch('/api/game/save')
      .then((res) => res.json())
      .then((data: SavedGameResponse) => {
        if (data.success && data.state) {
          this.savedState = data.state;
        }
        this.buildUI();
      })
      .catch(() => {
        this.buildUI();
      });
  }

  private destroyAll(): void {
    for (const obj of this.allObjects) obj.destroy();
    this.allObjects = [];
    this.loadingText = null;
  }

  private buildUI(): void {
    const { width, height } = this.scale;
    this.cameras.resize(width, height);
    const sf = this.sf;

    // Decorative gold lines
    const decorTop = this.add.graphics();
    decorTop.fillStyle(0xffd700, 0.3);
    decorTop.fillRect(width * 0.1, height * 0.1, width * 0.8, 3);
    decorTop.fillRect(width * 0.15, height * 0.115, width * 0.7, 2);
    this.allObjects.push(decorTop);

    const decorBottom = this.add.graphics();
    decorBottom.fillStyle(0xffd700, 0.3);
    decorBottom.fillRect(width * 0.1, height * 0.88, width * 0.8, 3);
    decorBottom.fillRect(width * 0.15, height * 0.895, width * 0.7, 2);
    this.allObjects.push(decorBottom);

    // Title
    const titleFontSize = Math.max(28, Math.round(80 * sf));
    const title = this.add
      .text(width / 2, height * 0.25, 'JEOPARDY!', {
        fontFamily: 'Arial Black',
        fontSize: `${titleFontSize}px`,
        color: '#FFD700',
        stroke: '#8B6914',
        strokeThickness: Math.max(3, Math.round(6 * sf)),
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
      .setAlpha(0);
    this.allObjects.push(title);

    this.tweens.add({
      targets: title,
      alpha: 1,
      y: { from: height * 0.22, to: height * 0.25 },
      duration: 800,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: title,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Subtitle
    const subtitleFontSize = Math.max(14, Math.round(22 * sf));
    const subtitle = this.add
      .text(width / 2, height * 0.38, 'Choose Your Game', {
        fontFamily: 'Arial',
        fontSize: `${subtitleFontSize}px`,
        color: '#AAAADD',
        align: 'center',
        fontStyle: 'italic',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.allObjects.push(subtitle);

    this.tweens.add({
      targets: subtitle,
      alpha: 0.8,
      duration: 1000,
      delay: 400,
    });

    // Resume button (if saved game exists)
    const gameBtnW = Math.max(180, Math.round(300 * sf));
    const gameBtnH = Math.max(38, Math.round(52 * sf));
    const gameBtnFontSize = Math.max(14, Math.round(24 * sf));
    const gameBtnRadius = Math.max(8, Math.round(12 * sf));

    let nextGameY = 0.46;

    if (this.savedState) {
      const resumeY = height * 0.44;
      this.createResumeButton(
        width / 2,
        resumeY,
        gameBtnW,
        gameBtnH,
        gameBtnFontSize,
        gameBtnRadius,
      );
      nextGameY = 0.56;
    }

    // Game buttons
    this.createGameButton(
      'latest',
      'LATEST GAME',
      "Yesterday's episode",
      width / 2,
      height * nextGameY,
      gameBtnW,
      gameBtnH,
      gameBtnFontSize,
      gameBtnRadius,
      600,
    );

    this.createGameButton(
      'onthisday',
      'ON THIS DAY',
      'A random game from this date in history',
      width / 2,
      height * (nextGameY + 0.13),
      gameBtnW,
      gameBtnH,
      gameBtnFontSize,
      gameBtnRadius,
      800,
    );

    // Small buttons
    const smallBtnW = Math.max(130, Math.round(200 * sf));
    const smallBtnH = Math.max(36, Math.round(42 * sf));
    const smallBtnFontSize = Math.max(12, Math.round(18 * sf));
    const smallBtnRadius = Math.max(6, Math.round(10 * sf));
    const smallBase = this.savedState ? 0.77 : 0.69;

    this.createSmallButton(
      'MY STATS',
      width / 2,
      height * smallBase,
      smallBtnW,
      smallBtnH,
      smallBtnFontSize,
      smallBtnRadius,
      1000,
      () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('StatsScene');
        });
      },
    );

    this.createSmallButton(
      'COMMUNITY',
      width / 2,
      height * (smallBase + 0.08),
      smallBtnW,
      smallBtnH,
      smallBtnFontSize,
      smallBtnRadius,
      1050,
      () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('CommunityStatsScene');
        });
      },
    );

    this.createSmallButton(
      'LEADERBOARD',
      width / 2,
      height * (smallBase + 0.16),
      smallBtnW,
      smallBtnH,
      smallBtnFontSize,
      smallBtnRadius,
      1100,
      () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('LeaderboardScene');
        });
      },
    );

    // Loading text (hidden by default)
    const loadingFontSize = Math.max(12, Math.round(18 * sf));
    this.loadingText = this.add
      .text(width / 2, height * 0.95, '', {
        fontFamily: 'Arial',
        fontSize: `${loadingFontSize}px`,
        color: '#AAAADD',
        align: 'center',
        fontStyle: 'italic',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.allObjects.push(this.loadingText);
  }

  private createResumeButton(
    cx: number,
    cy: number,
    btnW: number,
    btnH: number,
    fontSize: number,
    radius: number,
  ): void {
    const btnX = cx - btnW / 2;
    const btnY = cy - btnH / 2;

    const bg = this.add.graphics();
    this.drawRoundedButton(bg, btnX, btnY, btnW, btnH, radius, 0x226622, 0x44ff44);
    this.allObjects.push(bg);

    const btn = this.add
      .text(cx, cy, '▶  RESUME GAME', {
        fontFamily: 'Arial Black',
        fontSize: `${fontSize}px`,
        color: '#44FF44',
        align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.allObjects.push(btn);

    this.tweens.add({ targets: btn, alpha: 1, duration: 600, delay: 400 });

    // Subtext showing saved game info
    const sf = this.sf;
    const ss = this.savedState!;
    const scoreStr = ss.score < 0 ? `-$${Math.abs(ss.score)}` : `$${ss.score}`;
    const roundLabel = ss.round === 'DJ' ? 'Double Jeopardy' : 'Jeopardy';
    const remaining = 30 - ss.usedCells.length;
    const subStr = `${ss.gameDescription || roundLabel}  •  ${scoreStr}  •  ${remaining} clues left`;
    const subtext = this.add
      .text(cx, cy + btnH / 2 + Math.max(6, Math.round(12 * sf)), subStr, {
        fontFamily: 'Arial',
        fontSize: `${Math.max(9, Math.round(12 * sf))}px`,
        color: '#88CC88',
        align: 'center',
        fontStyle: 'italic',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.allObjects.push(subtext);

    this.tweens.add({ targets: subtext, alpha: 0.8, duration: 600, delay: 600 });

    btn
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        if (this.isLoading) return;
        bg.clear();
        this.drawRoundedButton(bg, btnX, btnY, btnW, btnH, radius, 0x338833, 0x44ff44);
        this.tweens.add({ targets: btn, scaleX: 1.06, scaleY: 1.06, duration: 150, ease: 'Back.easeOut' });
      })
      .on('pointerout', () => {
        if (this.isLoading) return;
        bg.clear();
        this.drawRoundedButton(bg, btnX, btnY, btnW, btnH, radius, 0x226622, 0x44ff44);
        this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 150, ease: 'Back.easeIn' });
      })
      .on('pointerdown', () => {
        if (this.isLoading) return;
        this.resumeSavedGame();
      });
  }

  private resumeSavedGame(): void {
    if (!this.savedState) return;
    this.isLoading = true;

    if (this.loadingText) {
      this.loadingText.setText('Resuming game...');
      this.tweens.add({ targets: this.loadingText, alpha: 1, duration: 300 });
    }

    const ss = this.savedState;

    fetch(`/api/game?type=latest&gameId=${ss.gameId}`)
      .then((res) => res.json())
      .then((data: GameResponse) => {
        if (data.success && data.data) {
          this.cameras.main.fadeOut(400, 0, 0, 0);
          this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('Game', { gameData: data.data, savedState: ss });
          });
        } else {
          this.cameras.main.fadeOut(400, 0, 0, 0);
          this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('Game', { gameData: null, savedState: ss });
          });
        }
      })
      .catch(() => {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('Game', { gameData: null, savedState: ss });
        });
      });
  }

  private createGameButton(
    type: 'latest' | 'onthisday',
    label: string,
    subtextStr: string,
    cx: number,
    cy: number,
    btnW: number,
    btnH: number,
    fontSize: number,
    radius: number,
    delay: number,
  ): void {
    const btnX = cx - btnW / 2;
    const btnY = cy - btnH / 2;

    const bg = this.add.graphics();
    this.drawRoundedButton(bg, btnX, btnY, btnW, btnH, radius, 0x1a1aff, 0xffd700);
    this.allObjects.push(bg);

    const btn = this.add
      .text(cx, cy, label, {
        fontFamily: 'Arial Black',
        fontSize: `${fontSize}px`,
        color: '#FFD700',
        align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.allObjects.push(btn);

    this.tweens.add({ targets: btn, alpha: 1, duration: 600, delay });

    btn
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        if (this.isLoading) return;
        bg.clear();
        this.drawRoundedButton(bg, btnX, btnY, btnW, btnH, radius, 0x2a2aff, 0xffd700);
        this.tweens.add({ targets: btn, scaleX: 1.06, scaleY: 1.06, duration: 150, ease: 'Back.easeOut' });
      })
      .on('pointerout', () => {
        if (this.isLoading) return;
        bg.clear();
        this.drawRoundedButton(bg, btnX, btnY, btnW, btnH, radius, 0x1a1aff, 0xffd700);
        this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 150, ease: 'Back.easeIn' });
      })
      .on('pointerdown', () => {
        if (this.isLoading) return;
        void this.loadGame(type);
      });

    // Subtext
    const subtextFontSize = Math.max(9, Math.round(14 * this.sf));
    const subtext = this.add
      .text(cx, cy + btnH / 2 + Math.max(6, Math.round(14 * this.sf)), subtextStr, {
        fontFamily: 'Arial',
        fontSize: `${subtextFontSize}px`,
        color: '#8888BB',
        align: 'center',
        fontStyle: 'italic',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.allObjects.push(subtext);

    this.tweens.add({ targets: subtext, alpha: 0.7, duration: 600, delay: delay + 200 });
  }

  private createSmallButton(
    label: string,
    cx: number,
    cy: number,
    btnW: number,
    btnH: number,
    fontSize: number,
    radius: number,
    delay: number,
    onClick: () => void,
  ): void {
    const btnX = cx - btnW / 2;
    const btnY = cy - btnH / 2;

    const bg = this.add.graphics();
    this.drawRoundedButton(bg, btnX, btnY, btnW, btnH, radius, 0x04086e, 0xffd700);
    this.allObjects.push(bg);

    const btn = this.add
      .text(cx, cy, label, {
        fontFamily: 'Arial Black',
        fontSize: `${fontSize}px`,
        color: '#FFD700',
        align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.allObjects.push(btn);

    this.tweens.add({ targets: btn, alpha: 1, duration: 600, delay });

    btn
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        if (this.isLoading) return;
        bg.clear();
        this.drawRoundedButton(bg, btnX, btnY, btnW, btnH, radius, 0x1a1aff, 0xffd700);
        this.tweens.add({ targets: btn, scaleX: 1.06, scaleY: 1.06, duration: 150, ease: 'Back.easeOut' });
      })
      .on('pointerout', () => {
        if (this.isLoading) return;
        bg.clear();
        this.drawRoundedButton(bg, btnX, btnY, btnW, btnH, radius, 0x04086e, 0xffd700);
        this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 150, ease: 'Back.easeIn' });
      })
      .on('pointerdown', () => {
        if (this.isLoading) return;
        onClick();
      });
  }

  private async loadGame(type: 'latest' | 'onthisday'): Promise<void> {
    this.isLoading = true;

    if (this.loadingText) {
      this.loadingText.setText('Loading game...');
      this.tweens.add({ targets: this.loadingText, alpha: 1, duration: 300 });
    }

    // Dim all interactive elements
    const dimTargets = this.allObjects.filter(
      (obj) => obj !== this.loadingText && obj instanceof GameObjects.Text,
    );
    this.tweens.add({ targets: dimTargets, alpha: 0.3, duration: 300 });

    let dots = 0;
    const dotInterval = setInterval(() => {
      dots = (dots + 1) % 4;
      if (this.loadingText) {
        this.loadingText.setText('Loading game' + '.'.repeat(dots));
      }
    }, 500);

    try {
      const response = await fetch(`/api/game?type=${type}`);
      const data: GameResponse = await response.json();

      clearInterval(dotInterval);

      if (data.success && data.data) {
        this.startGameWithData(data.data);
      } else {
        if (this.loadingText) {
          this.loadingText.setText('Using practice questions...');
        }
        this.time.delayedCall(1000, () => {
          this.startGameWithData(null);
        });
      }
    } catch (error) {
      clearInterval(dotInterval);
      console.error('Failed to load game:', error);

      if (this.loadingText) {
        this.loadingText.setText('Using practice questions...');
      }
      this.time.delayedCall(1000, () => {
        this.startGameWithData(null);
      });
    }
  }

  private startGameWithData(gameData: GameData | null): void {
    // Clear any existing save when starting a new game
    fetch('/api/game/save', { method: 'DELETE' }).catch(() => {});
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('Game', { gameData });
    });
  }

  private drawRoundedButton(
    g: GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fill: number,
    stroke: number,
  ): void {
    g.fillStyle(fill, 1);
    g.fillRoundedRect(x, y, w, h, r);
    g.lineStyle(2, stroke, 0.8);
    g.strokeRoundedRect(x, y, w, h, r);
  }
}
