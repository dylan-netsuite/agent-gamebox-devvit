import { Scene } from 'phaser';
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

  constructor() {
    super('RoundResults');
  }

  create(data: RoundResultsData) {
    const { result, roundNumber, mode } = data;
    this.mp = data.mp ?? null;
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const { width, height } = this.scale;
    const cx = width / 2;

    SoundManager.play('roundEnd');

    this.add
      .text(cx, 16, `ROUND ${roundNumber} RESULTS`, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000000', 4);

    this.add
      .text(cx, 40, `Letter: ${result.letter}`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#3498db',
      })
      .setOrigin(0.5);

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

    this.add.text(tableX + 8, startY + rowH / 2, 'Category', {
      fontFamily: 'monospace',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#8899aa',
    }).setOrigin(0, 0.5);

    playerResults.forEach((pr, pi) => {
      const colX = tableX + catColW + pi * playerColW + playerColW / 2;
      this.add.text(colX, startY + rowH / 2, pr.username.slice(0, 10), {
        fontFamily: 'monospace',
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#8899aa',
      }).setOrigin(0.5, 0.5);
    });

    for (let catIdx = 0; catIdx < result.categories.length; catIdx++) {
      const y = startY + rowH + catIdx * rowH;

      if (catIdx % 2 === 0) {
        const bg = this.add.graphics();
        bg.fillStyle(0x16213e, 0.5);
        bg.fillRect(tableX, y, tableW, rowH);
      }

      this.add.text(tableX + 8, y + rowH / 2, result.categories[catIdx]!.slice(0, 20), {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '9px',
        color: '#aaaacc',
      }).setOrigin(0, 0.5);

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

        if (answer.duplicate) {
          const lineY = y + rowH / 2;
          const lineW = text.width;
          const line = this.add.graphics();
          line.lineStyle(1, 0xe74c3c, 0.8);
          line.lineBetween(colX - lineW / 2, lineY, colX + lineW / 2, lineY);
        }
      });
    }

    const scoresY = startY + rowH + result.categories.length * rowH + 8;
    const scoreBg = this.add.graphics();
    scoreBg.fillStyle(0x0f1a30, 0.9);
    scoreBg.fillRoundedRect(tableX, scoresY, tableW, rowH * 2, 6);

    this.add.text(tableX + 8, scoresY + rowH / 2, 'Round Score:', {
      fontFamily: 'monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    this.add.text(tableX + 8, scoresY + rowH + rowH / 2, 'Total Score:', {
      fontFamily: 'monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    playerResults.forEach((pr, pi) => {
      const colX = tableX + catColW + pi * playerColW + playerColW / 2;

      this.add.text(colX, scoresY + rowH / 2, `${pr.roundScore}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#3498db',
      }).setOrigin(0.5, 0.5);

      this.add.text(colX, scoresY + rowH + rowH / 2, `${pr.totalScore}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#f39c12',
      }).setOrigin(0.5, 0.5);
    });

    const btnY = Math.min(scoresY + rowH * 2 + 20, height - 50);
    const isFinalRound = roundNumber >= TOTAL_ROUNDS;

    if (isFinalRound && mode === 'single') {
      this.createButton(cx, btnY, 'VIEW FINAL SCORES', 0x3498db, () => {
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
    } else if (!isFinalRound) {
      if (mode === 'single') {
        this.createButton(cx, btnY, 'NEXT ROUND', 0x2ecc71, () => {
          SoundManager.play('select');
          this.scene.start('GamePlay', {
            mode: 'single',
            usedListIds: data.usedListIds,
            usedLetters: data.usedLetters,
            totalScore: data.totalScore,
            roundNumber: roundNumber + 1,
          });
        });
      } else {
        this.add.text(cx, btnY + 10, 'Next round starting soon...', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#8899aa',
        }).setOrigin(0.5);

        if (this.mp) {
          this.messageHandler = (msg: ScatterMessage) => {
            if (msg.type === 'round-start') {
              if (this.messageHandler && this.mp) {
                this.mp.offMessage(this.messageHandler);
              }
              this.scene.start('GamePlay', {
                mode: 'multiplayer',
                multiplayerManager: this.mp,
                round: msg.round,
              });
            } else if (msg.type === 'game-over') {
              if (this.messageHandler && this.mp) {
                this.mp.offMessage(this.messageHandler);
              }
              this.scene.start('GameOver', {
                scores: msg.scores,
                winnerId: msg.winnerId,
                winnerName: msg.winnerName,
                mp: this.mp,
              });
            }
          };
          this.mp.onMessage(this.messageHandler);
        }
      }
    } else {
      this.add.text(cx, btnY + 10, 'Waiting for final results...', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#8899aa',
      }).setOrigin(0.5);

      if (this.mp) {
        this.messageHandler = (msg: ScatterMessage) => {
          if (msg.type === 'game-over') {
            if (this.messageHandler && this.mp) {
              this.mp.offMessage(this.messageHandler);
            }
            this.scene.start('GameOver', {
              scores: msg.scores,
              winnerId: msg.winnerId,
              winnerName: msg.winnerName,
              mp: this.mp,
            });
          }
        };
        this.mp.onMessage(this.messageHandler);
      }
    }
  }

  private createButton(cx: number, y: number, label: string, color: number, action: () => void): void {
    const btnW = 200;
    const btnH = 40;
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(cx - btnW / 2, y, btnW, btnH, 8);

    this.add.text(cx, y + btnH / 2, label, {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    const zone = this.add
      .zone(cx, y + btnH / 2, btnW, btnH)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerdown', action);
  }

  shutdown(): void {
    if (this.messageHandler && this.mp) {
      this.mp.offMessage(this.messageHandler);
    }
  }
}
