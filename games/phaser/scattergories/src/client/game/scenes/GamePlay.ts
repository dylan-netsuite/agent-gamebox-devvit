import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { SoundManager } from '../systems/SoundManager';
import type { MultiplayerManager } from '../systems/MultiplayerManager';
import type { RoundConfig, ScatterMessage } from '../../../shared/types/multiplayer';
import type { RoundResult, PlayerScore } from '../../../shared/types/game';
import { VALID_LETTERS, CATEGORY_LISTS, TOTAL_ROUNDS, ROUND_TIMER_SECONDS, CATEGORIES_PER_LIST } from '../../../shared/types/categories';
import { scoreSinglePlayer } from './singlePlayerScoring';
import { scoreLocalMultiplayer } from './localScoring';
import type { AIPlayer } from '../systems/AIOpponent';
import { createAIPlayers, generateAIAnswers } from '../systems/AIOpponent';

export type GameMode = 'single' | 'multiplayer' | 'local';

export interface GamePlayData {
  mode: GameMode;
  multiplayerManager?: MultiplayerManager;
  round?: RoundConfig;
  usedListIds?: number[];
  usedLetters?: string[];
  totalScore?: number;
  roundNumber?: number;
  localPlayers?: string[];
  localPlayerIndex?: number;
  localAllAnswers?: string[][];
  localScores?: number[];
}

export class GamePlay extends Scene {
  private mode: GameMode = 'single';
  private mp: MultiplayerManager | null = null;
  private messageHandler: ((msg: ScatterMessage) => void) | null = null;

  private currentLetter = '';
  private categories: string[] = [];
  private categoryListId = 0;
  private roundNumber = 1;
  private timeRemaining = ROUND_TIMER_SECONDS;
  private submitted = false;
  private answers: string[] = [];

  private timerText!: Phaser.GameObjects.Text;
  private submitBtn!: Phaser.GameObjects.Container;
  private submitLabel!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private timerEvent: Phaser.Time.TimerEvent | null = null;
  private inputContainer: HTMLDivElement | null = null;
  private inputElements: HTMLInputElement[] = [];
  private categoryTexts: Phaser.GameObjects.Text[] = [];

  private usedListIds: number[] = [];
  private usedLetters: string[] = [];
  private totalScore = 0;

  private aiPlayers: AIPlayer[] = [];

  private localPlayers: string[] = [];
  private localPlayerIndex = 0;
  private localAllAnswers: string[][] = [];
  private localScores: number[] = [];

  constructor() {
    super('GamePlay');
  }

  create(data: GamePlayData) {
    this.mode = data.mode ?? 'single';
    this.mp = data.multiplayerManager ?? null;
    this.submitted = false;
    this.answers = new Array(CATEGORIES_PER_LIST).fill('');
    this.categoryTexts = [];

    this.cameras.main.setBackgroundColor('#1a1a2e');

    if (this.mode === 'multiplayer' && data.round) {
      this.currentLetter = data.round.letter;
      this.categories = data.round.categories;
      this.categoryListId = data.round.categoryListId;
      this.roundNumber = data.round.roundNumber;
    } else if (this.mode === 'local') {
      this.localPlayers = data.localPlayers ?? ['Player 1', 'Player 2'];
      this.localPlayerIndex = data.localPlayerIndex ?? 0;
      this.localAllAnswers = data.localAllAnswers ?? [];
      this.localScores = data.localScores ?? new Array(this.localPlayers.length).fill(0);

      if (data.usedListIds) this.usedListIds = data.usedListIds;
      if (data.usedLetters) this.usedLetters = data.usedLetters;
      if (data.roundNumber != null) this.roundNumber = data.roundNumber;

      if (this.localPlayerIndex === 0) {
        this.localAllAnswers = [];
        this.pickSinglePlayerRound();
      } else {
        this.currentLetter = data.round?.letter ?? this.currentLetter;
        this.categories = data.round?.categories ?? this.categories;
        this.categoryListId = data.round?.categoryListId ?? this.categoryListId;
      }
    } else {
      if (data.usedListIds) this.usedListIds = data.usedListIds;
      if (data.usedLetters) this.usedLetters = data.usedLetters;
      if (data.totalScore != null) this.totalScore = data.totalScore;
      if (data.roundNumber != null) this.roundNumber = data.roundNumber;
      this.aiPlayers = createAIPlayers(2);
      this.pickSinglePlayerRound();
    }

    this.buildUI();
    this.createDOMInputs();
    this.startTimer();

    if (this.mp) {
      this.messageHandler = (msg: ScatterMessage) => {
        if (msg.type === 'player-submitted') {
          this.statusText.setText(`${msg.username} submitted!`);
        } else if (msg.type === 'round-results') {
          this.handleRoundResults(msg.results, msg.scores);
        } else if (msg.type === 'game-over') {
          this.cleanupDOM();
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

  private pickSinglePlayerRound(): void {
    const availableLists = CATEGORY_LISTS.filter((l) => !this.usedListIds.includes(l.id));
    const list = availableLists[Math.floor(Math.random() * availableLists.length)] ?? CATEGORY_LISTS[0]!;
    this.categoryListId = list.id;
    this.categories = list.categories;
    this.usedListIds.push(list.id);

    const availableLetters = VALID_LETTERS.filter((l) => !this.usedLetters.includes(l));
    this.currentLetter = availableLetters[Math.floor(Math.random() * availableLetters.length)] ?? 'A';
    this.usedLetters.push(this.currentLetter);
  }

  private headerBg!: Phaser.GameObjects.Graphics;
  private letterText!: Phaser.GameObjects.Text;
  private diceRollEvent: Phaser.Time.TimerEvent | null = null;

  private buildUI(): void {
    const { width } = this.scale;
    const cx = width / 2;

    const headerH = 70;
    this.headerBg = this.add.graphics();
    this.headerBg.fillStyle(0x0f1a30, 0.95);
    this.headerBg.fillRect(0, 0, width, headerH);

    this.letterText = this.add
      .text(cx, 20, '?', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#3498db',
      })
      .setOrigin(0.5);

    this.animateLetterRoll(cx);

    const roundLabel = `Round ${this.roundNumber}/${TOTAL_ROUNDS}`;
    this.add
      .text(width - 16, 10, roundLabel, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#8899aa',
      })
      .setOrigin(1, 0);

    this.timerText = this.add
      .text(width - 16, 26, this.formatTime(this.timeRemaining), {
        fontFamily: 'monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#2ecc71',
      })
      .setOrigin(1, 0);

    let statusMsg = '';
    if (this.mode === 'local') {
      statusMsg = `${this.localPlayers[this.localPlayerIndex]}'s turn`;
    }

    this.statusText = this.add
      .text(16, 52, statusMsg, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#8899aa',
      })
      .setOrigin(0, 0);

    if (this.mode === 'local') {
      const playerTag = this.add
        .text(16, 10, this.localPlayers[this.localPlayerIndex] ?? '', {
          fontFamily: 'Segoe UI, system-ui, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#f39c12',
        })
        .setOrigin(0, 0);
      playerTag.setAlpha(0);
      this.tweens.add({ targets: playerTag, alpha: 1, duration: 400, delay: 200 });
    }

    const listStartY = headerH + 8;
    const rowH = 34;
    const listW = Math.min(width - 16, 420);
    const listX = cx - listW / 2;

    for (let i = 0; i < this.categories.length; i++) {
      const y = listStartY + i * rowH;

      if (i % 2 === 0) {
        const rowBg = this.add.graphics();
        rowBg.fillStyle(0x16213e, 0.4);
        rowBg.fillRect(listX, y, listW, rowH);
      }

      this.add
        .text(listX + 8, y + rowH / 2, `${i + 1}.`, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#555577',
        })
        .setOrigin(0, 0.5);

      const catText = this.add
        .text(listX + 30, y + rowH / 2, this.categories[i]!, {
          fontFamily: 'Segoe UI, system-ui, sans-serif',
          fontSize: '12px',
          color: '#ccccdd',
          wordWrap: { width: listW * 0.45 },
        })
        .setOrigin(0, 0.5);

      this.categoryTexts.push(catText);
    }

    const btnY = listStartY + this.categories.length * rowH + 12;
    this.submitBtn = this.add.container(cx, btnY);

    const btnW = 180;
    const btnH = 40;
    const submitBg = this.add.graphics();
    submitBg.fillStyle(0x2ecc71, 1);
    submitBg.fillRoundedRect(-btnW / 2, 0, btnW, btnH, 8);
    this.submitBtn.add(submitBg);

    this.submitLabel = this.add
      .text(0, btnH / 2, 'SUBMIT ANSWERS', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.submitBtn.add(this.submitLabel);

    const submitZone = this.add
      .zone(0, btnH / 2, btnW, btnH)
      .setInteractive({ useHandCursor: true });
    this.submitBtn.add(submitZone);

    submitZone.on('pointerdown', () => {
      void this.submitAnswers(false);
    });
  }

  private createDOMInputs(): void {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return;

    this.inputContainer = document.createElement('div');
    this.inputContainer.className = 'scatter-inputs-overlay';
    gameContainer.appendChild(this.inputContainer);

    const { width, height } = this.scale;
    const cx = width / 2;
    const headerH = 70;
    const rowH = 34;
    const listW = Math.min(width - 16, 420);
    const listX = cx - listW / 2;
    const inputW = Math.min(listW * 0.42, 180);

    const canvas = gameContainer.querySelector('canvas');
    const scaleX = canvas ? canvas.clientWidth / width : 1;
    const scaleY = canvas ? canvas.clientHeight / height : 1;

    this.inputElements = [];

    for (let i = 0; i < this.categories.length; i++) {
      const y = headerH + 8 + i * rowH;

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'scatter-input';
      input.placeholder = `${this.currentLetter}...`;
      input.maxLength = 40;
      input.autocomplete = 'off';
      input.autocapitalize = 'off';
      input.spellcheck = false;

      const inputLeft = (listX + listW - inputW - 8) * scaleX;
      const inputTop = y * scaleY;

      input.style.position = 'absolute';
      input.style.left = `${inputLeft}px`;
      input.style.top = `${inputTop}px`;
      input.style.width = `${inputW * scaleX}px`;
      input.style.height = `${(rowH - 6) * scaleY}px`;
      input.style.fontSize = `${12 * scaleY}px`;
      input.style.pointerEvents = 'auto';

      const idx = i;
      input.addEventListener('input', () => {
        this.answers[idx] = input.value;
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const nextInput = this.inputElements[idx + 1];
          if (nextInput) {
            nextInput.focus();
          } else {
            void this.submitAnswers();
          }
        }
      });

      this.inputContainer.appendChild(input);
      this.inputElements.push(input);
    }

    if (this.inputElements[0]) {
      this.inputElements[0].focus();
    }
  }

  private cleanupDOM(): void {
    if (this.inputContainer) {
      this.inputContainer.remove();
      this.inputContainer = null;
    }
    this.inputElements = [];
  }

  private animateLetterRoll(_cx: number): void {
    let rollCount = 0;
    const totalRolls = 12;
    SoundManager.play('diceRoll');

    this.diceRollEvent = this.time.addEvent({
      delay: 80,
      repeat: totalRolls - 1,
      callback: () => {
        rollCount++;
        if (rollCount < totalRolls) {
          const randomLetter = VALID_LETTERS[Math.floor(Math.random() * VALID_LETTERS.length)]!;
          this.letterText.setText(randomLetter);
          this.tweens.add({
            targets: this.letterText,
            scaleX: 1.15, scaleY: 1.15,
            duration: 40,
            yoyo: true,
            ease: 'Sine.easeOut',
          });
        } else {
          this.letterText.setText(this.currentLetter);
          this.tweens.add({
            targets: this.letterText,
            scaleX: 1.3, scaleY: 1.3,
            duration: 150,
            yoyo: true,
            ease: 'Back.easeOut',
          });
          this.letterText.setColor('#ffffff');
          this.time.delayedCall(200, () => {
            this.letterText.setColor('#3498db');
          });
        }
      },
    });
  }

  private startTimer(): void {
    this.timeRemaining = ROUND_TIMER_SECONDS;
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.timeRemaining--;
        this.timerText.setText(this.formatTime(this.timeRemaining));

        if (this.timeRemaining <= 10) {
          this.timerText.setColor('#e74c3c');
          SoundManager.play('tick');

          this.tweens.add({
            targets: this.timerText,
            scaleX: 1.2, scaleY: 1.2,
            duration: 200,
            yoyo: true,
            ease: 'Sine.easeOut',
          });

          const { width } = this.scale;
          this.headerBg.clear();
          this.headerBg.fillStyle(this.timeRemaining % 2 === 0 ? 0x1a0a0a : 0x0f1a30, 0.95);
          this.headerBg.fillRect(0, 0, width, 70);
        } else if (this.timeRemaining <= 30) {
          this.timerText.setColor('#f39c12');
        }

        if (this.timeRemaining <= 0) {
          this.timerEvent?.destroy();
          void this.submitAnswers(true);
        }
      },
    });
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(Math.max(0, seconds) / 60);
    const s = Math.max(0, seconds) % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  private async submitAnswers(timerExpired = false): Promise<void> {
    if (this.submitted) return;
    this.submitted = true;
    this.timerEvent?.destroy();

    for (let i = 0; i < this.inputElements.length; i++) {
      this.answers[i] = this.inputElements[i]?.value ?? '';
    }

    this.inputElements.forEach((input) => {
      input.disabled = true;
      input.style.opacity = '0.5';
    });

    this.submitLabel.setText('SUBMITTED');
    SoundManager.play('submit');

    if (this.mode === 'multiplayer' && this.mp) {
      this.statusText.setText('Waiting for other players...');
      await this.mp.submitAnswers(this.answers);
      if (timerExpired) {
        await this.mp.finalizeRound();
      }
    } else if (this.mode === 'local') {
      this.handleLocalSubmit();
    } else {
      this.handleSinglePlayerSubmit();
    }
  }

  private handleSinglePlayerSubmit(): void {
    const aiAnswerSets = this.aiPlayers.map((ai) =>
      generateAIAnswers(ai, this.categories, this.currentLetter),
    );

    const { result, totalScore: newTotal } = scoreSinglePlayer(
      this.roundNumber,
      this.currentLetter,
      this.categoryListId,
      this.categories,
      this.answers,
      this.totalScore,
      this.aiPlayers,
      aiAnswerSets,
    );
    this.totalScore = newTotal;

    this.time.delayedCall(1000, () => {
      this.cleanupDOM();
      this.scene.start('RoundResults', {
        result,
        roundNumber: this.roundNumber,
        totalRounds: TOTAL_ROUNDS,
        mode: this.mode,
        mp: this.mp,
        usedListIds: this.usedListIds,
        usedLetters: this.usedLetters,
        totalScore: this.totalScore,
      });
    });
  }

  private handleLocalSubmit(): void {
    this.localAllAnswers.push([...this.answers]);

    const nextIndex = this.localPlayerIndex + 1;

    if (nextIndex < this.localPlayers.length) {
      this.time.delayedCall(800, () => {
        this.cleanupDOM();
        this.scene.start('GamePlay', {
          mode: 'local',
          localPlayers: this.localPlayers,
          localPlayerIndex: nextIndex,
          localAllAnswers: this.localAllAnswers,
          localScores: this.localScores,
          usedListIds: this.usedListIds,
          usedLetters: this.usedLetters,
          roundNumber: this.roundNumber,
          round: {
            roundNumber: this.roundNumber,
            letter: this.currentLetter,
            categoryListId: this.categoryListId,
            categories: this.categories,
            timerSeconds: ROUND_TIMER_SECONDS,
          },
        });
      });
    } else {
      const { result, newScores } = scoreLocalMultiplayer(
        this.roundNumber,
        this.currentLetter,
        this.categoryListId,
        this.categories,
        this.localPlayers,
        this.localAllAnswers,
        this.localScores,
      );

      this.time.delayedCall(1000, () => {
        this.cleanupDOM();
        this.scene.start('RoundResults', {
          result,
          roundNumber: this.roundNumber,
          totalRounds: TOTAL_ROUNDS,
          mode: 'local',
          localPlayers: this.localPlayers,
          localScores: newScores,
          usedListIds: this.usedListIds,
          usedLetters: this.usedLetters,
        });
      });
    }
  }

  private handleRoundResults(results: RoundResult, scores: PlayerScore[]): void {
    this.cleanupDOM();
    if (this.messageHandler && this.mp) {
      this.mp.offMessage(this.messageHandler);
    }
    this.scene.start('RoundResults', {
      result: results,
      roundNumber: this.roundNumber,
      totalRounds: TOTAL_ROUNDS,
      mode: this.mode,
      mp: this.mp,
      scores,
    });
  }

  shutdown(): void {
    this.cleanupDOM();
    this.timerEvent?.destroy();
    this.diceRollEvent?.destroy();
    if (this.messageHandler && this.mp) {
      this.mp.offMessage(this.messageHandler);
    }
  }
}
