import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { SoundManager } from '../systems/SoundManager';
import type { MultiplayerManager } from '../systems/MultiplayerManager';
import type { RoundResult, PlayerScore } from '../../../shared/types/game';
import type { ScatterMessage } from '../../../shared/types/multiplayer';
import { TOTAL_ROUNDS } from '../../../shared/types/categories';

export interface RoundResultsData {
  result: RoundResult;
  roundNumber: number;
  totalRounds: number;
  mode: 'single' | 'multiplayer';
  mp?: MultiplayerManager | null;
  scores?: PlayerScore[];
  usedListIds?: number[];
  usedLetters?: string[];
  totalScore?: number;
}

export class RoundResults extends Scene {
  private mp: MultiplayerManager | null = null;
  private messageHandler: ((msg: ScatterMessage) => void) | null = null;
  private bufferedNextRound: import('../../../shared/types/multiplayer').RoundConfig | null = null;
  private nextRoundBtnZone: Phaser.GameObjects.Zone | null = null;
  private nextRoundBtnBg: Phaser.GameObjects.Graphics | null = null;
  private nextRoundLabel: Phaser.GameObjects.Text | null = null;
  private revealTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super('RoundResults');
  }

  create(data: RoundResultsData) {
    const { result, roundNumber, mode } = data;
    this.mp = data.mp ?? null;
    this.bufferedNextRound = null;
    this.nextRoundBtnZone = null;
    this.nextRoundBtnBg = null;
    this.nextRoundLabel = null;
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const { width, height } = this.scale;
    const cx = width / 2;

    this.cameras.main.setAlpha(0);
    this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: 300, ease: 'Sine.easeOut' });

    SoundManager.play('roundEnd');

    const titleText = this.add
      .text(cx, 16, `ROUND ${roundNumber} RESULTS`, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000000', 4);
    titleText.setAlpha(0);
    this.tweens.add({ targets: titleText, alpha: 1, duration: 400, delay: 100, ease: 'Sine.easeOut' });

    const letterText = this.add
      .text(cx, 40, `Letter: ${result.letter}`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#3498db',
      })
      .setOrigin(0.5);
    letterText.setAlpha(0);
    this.tweens.add({ targets: letterText, alpha: 1, duration: 400, delay: 200, ease: 'Sine.easeOut' });

    const tableW = Math.min(width - 16, 440);
    const tableX = cx - tableW / 2;
    const startY = 60;
    const rowH = 26;
    const catColW = tableW * 0.35;

    const playerResults = result.playerResults;
    const playerColW = Math.min((tableW - catColW) / playerResults.length, 120);

    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x2a3a5a, 0.8);
    headerBg.fillRoundedRect(tableX, startY, tableW, rowH, 6);
    headerBg.setAlpha(0);
    this.tweens.add({ targets: headerBg, alpha: 1, duration: 300, delay: 300, ease: 'Sine.easeOut' });

    const catHeaderText = this.add.text(tableX + 8, startY + rowH / 2, 'Category', {
      fontFamily: 'monospace',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#8899aa',
    }).setOrigin(0, 0.5);
    catHeaderText.setAlpha(0);
    this.tweens.add({ targets: catHeaderText, alpha: 1, duration: 300, delay: 300 });

    playerResults.forEach((pr, pi) => {
      const colX = tableX + catColW + pi * playerColW + playerColW / 2;
      const nameText = this.add.text(colX, startY + rowH / 2, pr.username.slice(0, 10), {
        fontFamily: 'monospace',
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#8899aa',
      }).setOrigin(0.5, 0.5);
      nameText.setAlpha(0);
      this.tweens.add({ targets: nameText, alpha: 1, duration: 300, delay: 300 });
    });

    const revealDelay = 500;
    const revealInterval = 120;
    let revealIdx = 0;

    const rowObjects: Phaser.GameObjects.GameObject[][] = [];
    for (let catIdx = 0; catIdx < result.categories.length; catIdx++) {
      const y = startY + rowH + catIdx * rowH;
      const objs: Phaser.GameObjects.GameObject[] = [];

      if (catIdx % 2 === 0) {
        const bg = this.add.graphics();
        bg.fillStyle(0x16213e, 0.5);
        bg.fillRect(tableX, y, tableW, rowH);
        bg.setAlpha(0);
        objs.push(bg);
      }

      const catText = this.add.text(tableX + 8, y + rowH / 2, result.categories[catIdx]!.slice(0, 20), {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '9px',
        color: '#aaaacc',
      }).setOrigin(0, 0.5);
      catText.setAlpha(0);
      objs.push(catText);

      playerResults.forEach((pr, pi) => {
        const answer = pr.answers[catIdx]!;
        const colX = tableX + catColW + pi * playerColW + playerColW / 2;

        let displayText = answer.answer || '--';
        let color = '#555577';

        if (answer.answer && answer.valid && !answer.duplicate) {
          color = '#2ecc71';
          displayText = answer.answer.slice(0, 12);
        } else if (answer.duplicate) {
          color = '#e74c3c';
          displayText = answer.answer.slice(0, 12);
        } else if (answer.answer && !answer.valid) {
          color = '#e74c3c';
          displayText = answer.answer.slice(0, 12);
        }

        const text = this.add.text(colX, y + rowH / 2, displayText, {
          fontFamily: 'monospace',
          fontSize: '9px',
          color,
        }).setOrigin(0.5, 0.5);
        text.setAlpha(0);
        objs.push(text);

        if (answer.duplicate) {
          const lineY = y + rowH / 2;
          const lineW = text.width;
          const line = this.add.graphics();
          line.lineStyle(1, 0xe74c3c, 0.8);
          line.lineBetween(colX - lineW / 2, lineY, colX + lineW / 2, lineY);
          line.setAlpha(0);
          objs.push(line);
        }
      });

      rowObjects.push(objs);
    }

    this.time.delayedCall(revealDelay, () => {
      this.revealTimer = this.time.addEvent({
        delay: revealInterval,
        repeat: rowObjects.length - 1,
        callback: () => {
          if (revealIdx < rowObjects.length) {
            const objs = rowObjects[revealIdx]!;
            objs.forEach((obj) => {
              this.tweens.add({ targets: obj, alpha: 1, duration: 200, ease: 'Sine.easeOut' });
            });
            const hasDuplicate = playerResults.some((pr) => pr.answers[revealIdx]?.duplicate);
            SoundManager.play(hasDuplicate ? 'duplicate' : 'correct');
            revealIdx++;
          }
        },
      });
    });

    const scoresY = startY + rowH + result.categories.length * rowH + 8;
    const scoresDelay = revealDelay + rowObjects.length * revealInterval + 200;

    const scoreBg = this.add.graphics();
    scoreBg.fillStyle(0x0f1a30, 0.9);
    scoreBg.fillRoundedRect(tableX, scoresY, tableW, rowH * 2, 6);
    scoreBg.setAlpha(0);
    this.tweens.add({ targets: scoreBg, alpha: 1, duration: 300, delay: scoresDelay });

    const roundScoreLabel = this.add.text(tableX + 8, scoresY + rowH / 2, 'Round Score:', {
      fontFamily: 'monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0, 0.5);
    roundScoreLabel.setAlpha(0);
    this.tweens.add({ targets: roundScoreLabel, alpha: 1, duration: 300, delay: scoresDelay });

    const totalScoreLabel = this.add.text(tableX + 8, scoresY + rowH + rowH / 2, 'Total Score:', {
      fontFamily: 'monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0, 0.5);
    totalScoreLabel.setAlpha(0);
    this.tweens.add({ targets: totalScoreLabel, alpha: 1, duration: 300, delay: scoresDelay });

    playerResults.forEach((pr, pi) => {
      const colX = tableX + catColW + pi * playerColW + playerColW / 2;

      const rText = this.add.text(colX, scoresY + rowH / 2, `${pr.roundScore}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#3498db',
      }).setOrigin(0.5, 0.5);
      rText.setAlpha(0);
      this.tweens.add({ targets: rText, alpha: 1, duration: 300, delay: scoresDelay + 100 });

      const tText = this.add.text(colX, scoresY + rowH + rowH / 2, `${pr.totalScore}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#f39c12',
      }).setOrigin(0.5, 0.5);
      tText.setAlpha(0);
      this.tweens.add({ targets: tText, alpha: 1, duration: 300, delay: scoresDelay + 200 });
    });

    const btnY = Math.min(scoresY + rowH * 2 + 20, height - 50);
    const btnDelay = scoresDelay + 400;
    const isFinalRound = roundNumber >= TOTAL_ROUNDS;

    if (isFinalRound && mode === 'single') {
      this.createAnimatedButton(cx, btnY, 'VIEW FINAL SCORES', 0x3498db, btnDelay, () => {
        this.fadeOutAndRun(() => {
          const scores: PlayerScore[] = playerResults.map((pr) => ({
            userId: pr.userId,
            username: pr.username,
            totalScore: pr.totalScore,
            roundScores: [pr.roundScore],
          }));
          this.scene.start('GameOver', {
            scores,
            winnerId: scores[0]?.userId ?? '',
            winnerName: scores[0]?.username ?? '',
            mp: null,
            mode: 'single',
          });
        });
      });
    } else if (!isFinalRound) {
      if (mode === 'single') {
        this.createAnimatedButton(cx, btnY, 'NEXT ROUND', 0x2ecc71, btnDelay, () => {
          SoundManager.play('select');
          this.fadeOutAndRun(() => {
            this.scene.start('GamePlay', {
              mode: 'single',
              usedListIds: data.usedListIds,
              usedLetters: data.usedLetters,
              totalScore: data.totalScore,
              roundNumber: roundNumber + 1,
            });
          });
        });
      } else {
        this.createMultiplayerNextRoundButton(cx, btnY, btnDelay);

        if (this.mp) {
          this.messageHandler = (msg: ScatterMessage) => {
            if (msg.type === 'round-start') {
              this.bufferedNextRound = msg.round;
              this.enableNextRoundButton();
            } else if (msg.type === 'game-over') {
              if (this.messageHandler && this.mp) {
                this.mp.offMessage(this.messageHandler);
              }
              this.fadeOutAndRun(() => {
                this.scene.start('GameOver', {
                  scores: msg.scores,
                  winnerId: msg.winnerId,
                  winnerName: msg.winnerName,
                  mp: this.mp,
                });
              });
            }
          };
          this.mp.onMessage(this.messageHandler);
        }
      }
    } else {
      const waitText = this.add.text(cx, btnY + 10, 'Waiting for final results...', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#8899aa',
      }).setOrigin(0.5);
      waitText.setAlpha(0);
      this.tweens.add({ targets: waitText, alpha: 1, duration: 300, delay: btnDelay });

      if (this.mp) {
        this.messageHandler = (msg: ScatterMessage) => {
          if (msg.type === 'game-over') {
            if (this.messageHandler && this.mp) {
              this.mp.offMessage(this.messageHandler);
            }
            this.fadeOutAndRun(() => {
              this.scene.start('GameOver', {
                scores: msg.scores,
                winnerId: msg.winnerId,
                winnerName: msg.winnerName,
                mp: this.mp,
              });
            });
          }
        };
        this.mp.onMessage(this.messageHandler);
      }
    }
  }

  private createAnimatedButton(cx: number, y: number, label: string, color: number, delay: number, action: () => void): void {
    const btnW = 200;
    const btnH = 40;
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(cx - btnW / 2, y, btnW, btnH, 8);
    bg.setAlpha(0);

    const text = this.add.text(cx, y + btnH / 2, label, {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);
    text.setAlpha(0);

    const zone = this.add
      .zone(cx, y + btnH / 2, btnW, btnH)
      .setInteractive({ useHandCursor: true });
    zone.setAlpha(0);

    this.tweens.add({ targets: [bg, text, zone], alpha: 1, duration: 400, delay, ease: 'Back.easeOut' });
    zone.on('pointerdown', action);
  }

  private createMultiplayerNextRoundButton(cx: number, btnY: number, delay: number): void {
    const btnW = 200;
    const btnH = 40;
    this.nextRoundBtnBg = this.add.graphics();
    this.nextRoundBtnBg.fillStyle(0x555577, 1);
    this.nextRoundBtnBg.fillRoundedRect(cx - btnW / 2, btnY, btnW, btnH, 8);
    this.nextRoundBtnBg.setAlpha(0);

    this.nextRoundLabel = this.add.text(cx, btnY + btnH / 2, 'Reviewing...', {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.nextRoundLabel.setAlpha(0);

    this.nextRoundBtnZone = this.add
      .zone(cx, btnY + btnH / 2, btnW, btnH);

    this.tweens.add({
      targets: [this.nextRoundBtnBg, this.nextRoundLabel],
      alpha: 1, duration: 400, delay, ease: 'Back.easeOut',
    });

    if (this.bufferedNextRound) {
      this.enableNextRoundButton();
    }
  }

  private enableNextRoundButton(): void {
    if (!this.nextRoundBtnBg || !this.nextRoundLabel || !this.nextRoundBtnZone) return;

    const btnW = 200;
    const btnH = 40;
    const btnY = this.nextRoundBtnBg.y;
    const cx = this.nextRoundLabel.x;

    this.nextRoundBtnBg.clear();
    this.nextRoundBtnBg.fillStyle(0x2ecc71, 1);
    this.nextRoundBtnBg.fillRoundedRect(cx - btnW / 2, btnY, btnW, btnH, 8);

    this.nextRoundLabel.setText('NEXT ROUND ▶');

    this.nextRoundBtnZone.setInteractive({ useHandCursor: true });
    this.nextRoundBtnZone.on('pointerdown', () => {
      if (!this.bufferedNextRound) return;
      SoundManager.play('select');
      if (this.messageHandler && this.mp) {
        this.mp.offMessage(this.messageHandler);
      }
      this.fadeOutAndRun(() => {
        this.scene.start('GamePlay', {
          mode: 'multiplayer',
          multiplayerManager: this.mp,
          round: this.bufferedNextRound,
        });
      });
    });

    this.tweens.add({
      targets: this.nextRoundBtnBg,
      scaleX: 1.05, scaleY: 1.05,
      duration: 150,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }

  private fadeOutAndRun(callback: () => void): void {
    this.tweens.add({
      targets: this.cameras.main,
      alpha: 0,
      duration: 250,
      ease: 'Sine.easeIn',
      onComplete: callback,
    });
  }

  shutdown(): void {
    this.revealTimer?.destroy();
    if (this.messageHandler && this.mp) {
      this.mp.offMessage(this.messageHandler);
    }
  }
}
