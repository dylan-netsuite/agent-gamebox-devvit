import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { CATEGORIES, QUESTIONS, DJ_CATEGORIES, DJ_QUESTIONS } from '../data/questions';
import type { Question } from '../data/questions';
import { FINAL_JEOPARDY } from '../data/finalJeopardy';
import type { FinalJeopardyQuestion } from '../data/finalJeopardy';
import { soundManager } from '../audio/SoundManager';
import { checkAnswer } from '../utils/answerMatcher';
import type { AnswerResult, GameData, QuestionStatsResponse, SavedGameState } from '../../../shared/types/api';
import { decodeHtmlEntities } from '../utils/textCleaner';

interface BoardCell {
  rectangle: Phaser.GameObjects.Rectangle;
  shadow: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
  categoryIndex: number;
  valueIndex: number;
  value: number;
}

interface OverlayElements {
  background: Phaser.GameObjects.Rectangle;
  panel: Phaser.GameObjects.Rectangle;
  panelBorder: Phaser.GameObjects.Graphics;
  headerText: Phaser.GameObjects.Text;
  timerText: Phaser.GameObjects.Text;
  timerBarBg: Phaser.GameObjects.Graphics;
  timerBar: Phaser.GameObjects.Rectangle;
  questionText: Phaser.GameObjects.Text;
  answerText: Phaser.GameObjects.Text;
  inputDom: Phaser.GameObjects.DOMElement;
  submitButton: Phaser.GameObjects.Text;
  submitBg: Phaser.GameObjects.Graphics;
  skipButton: Phaser.GameObjects.Text;
  skipBg: Phaser.GameObjects.Graphics;
  resultText: Phaser.GameObjects.Text;
  communityText: Phaser.GameObjects.Text;
  timingText: Phaser.GameObjects.Text;
  dividerLine: Phaser.GameObjects.Graphics;
  answerRevealed: boolean;
  timedOut: boolean;
  scored: boolean;
}

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  categoryCells: Phaser.GameObjects.Rectangle[] = [];
  categoryShadows: Phaser.GameObjects.Rectangle[] = [];
  categoryTexts: Phaser.GameObjects.Text[] = [];
  questionCells: BoardCell[] = [];

  // Score bar
  private scoreBarBg: Phaser.GameObjects.Graphics | null = null;
  private score = 0;
  private scoreText: Phaser.GameObjects.Text | null = null;
  private gameDescText: Phaser.GameObjects.Text | null = null;

  // Timer
  private timerEvent: Phaser.Time.TimerEvent | null = null;
  private timerSeconds = 0;
  private readonly TIMER_DURATION = 15;
  private readonly FINAL_TIMER_DURATION = 30;
  private currentTimerDuration = 15;

  // Overlay state
  private overlay: OverlayElements | null = null;
  private activeQuestion: Question | null = null;
  private activeCategoryIndex = -1;
  private activeValueIndex = -1;
  private usedCells: Set<string> = new Set();

  // Daily Double
  private dailyDoubleCells: string[] = [];
  private isDailyDouble = false;
  private dailyDoubleWager = 0;

  // Final Jeopardy
  private isFinalJeopardy = false;
  private finalJeopardyWager = 0;
  private finalJeopardyElements: Phaser.GameObjects.GameObject[] = [];

  // Wager input overlay
  private wagerOverlayElements: Phaser.GameObjects.GameObject[] = [];

  // Stats tracking
  private gameResults: AnswerResult[] = [];
  private gameId = 0;
  private answerStartTime = 0;

  // Exit button
  private exitBtnBg: Phaser.GameObjects.Graphics | null = null;
  private exitBtnText: Phaser.GameObjects.Text | null = null;

  // Board configuration
  readonly NUM_CATEGORIES = 6;
  readonly NUM_ROWS = 5;
  readonly J_DOLLAR_VALUES = [200, 400, 600, 800, 1000];
  readonly DJ_DOLLAR_VALUES = [400, 800, 1200, 1600, 2000];
  readonly TOTAL_CELLS = 30;
  private currentDollarValues: number[] = [200, 400, 600, 800, 1000];

  // Round management
  private currentRound: 'J' | 'DJ' = 'J';

  // Dynamic game data (from server or fallback to static)
  private gameCategories: string[] = CATEGORIES;
  private gameQuestions: (Question | null)[][] = QUESTIONS;
  private djGameCategories: string[] = DJ_CATEGORIES;
  private djGameQuestions: (Question | null)[][] = DJ_QUESTIONS;
  private djDailyDoubleCells: string[] = [];
  private djMissingClueCount = 0;
  private gameFinalJeopardy: FinalJeopardyQuestion = FINAL_JEOPARDY;
  private gameDescription = '';
  private missingClueCount = 0;

  // Color palette
  private readonly COLOR_BG_DARK = 0x0308a0;
  private readonly COLOR_CELL = 0x0a10d6;
  private readonly COLOR_CELL_HOVER = 0x1a22ff;
  private readonly COLOR_CELL_USED = 0x030570;
  private readonly COLOR_CATEGORY = 0x04086e;
  private readonly COLOR_GOLD = 0xffd700;
  private readonly COLOR_SHADOW = 0x020266;

  private get sf(): number {
    return Math.min(this.scale.width / 1024, this.scale.height / 768);
  }

  constructor() {
    super('Game');
  }

  // Saved state to restore after create()
  private pendingSavedState: SavedGameState | null = null;

  init(data?: { gameData?: GameData | null; savedState?: SavedGameState | null }) {
    this.gameResults = [];
    this.gameId = 0;
    this.pendingSavedState = data?.savedState ?? null;
    if (data?.gameData) {
      this.gameId = data.gameData.gameId;
      this.loadGameData(data.gameData);
    } else {
      // Fallback to static data
      this.gameCategories = CATEGORIES;
      this.gameQuestions = QUESTIONS;
      this.djGameCategories = DJ_CATEGORIES;
      this.djGameQuestions = DJ_QUESTIONS;
      this.djMissingClueCount = 0;
      this.gameFinalJeopardy = FINAL_JEOPARDY;
      this.gameDescription = 'Practice Game';
      this.missingClueCount = 0;
    }
  }

  /**
   * Convert server GameData into the local Question[][] format.
   */
  private loadGameData(gameData: GameData): void {
    const d = decodeHtmlEntities;

    this.gameCategories = gameData.categories.slice(0, 6).map(d);

    while (this.gameCategories.length < 6) {
      this.gameCategories.push(`Category ${this.gameCategories.length + 1}`);
    }

    const questions: (Question | null)[][] = Array.from({ length: 6 }, () =>
      Array(5).fill(null) as (Question | null)[]
    );

    this.missingClueCount = 0;
    for (const clue of gameData.clues) {
      const catIdx = clue.col - 1;
      const rowIdx = clue.row - 1;
      if (catIdx >= 0 && catIdx < 6 && rowIdx >= 0 && rowIdx < 5) {
        const catArr = questions[catIdx];
        if (catArr) {
          catArr[rowIdx] = {
            category: d(clue.category),
            value: clue.value,
            question: d(clue.question),
            answer: d(clue.answer),
          };
        }
      }
    }

    for (let c = 0; c < 6; c++) {
      const catArr = questions[c];
      if (!catArr) continue;
      for (let r = 0; r < 5; r++) {
        if (!catArr[r]) this.missingClueCount++;
      }
    }

    this.gameQuestions = questions;

    if (gameData.djCategories && gameData.djClues && gameData.djClues.length > 0) {
      this.djGameCategories = gameData.djCategories.slice(0, 6).map(d);
      while (this.djGameCategories.length < 6) {
        this.djGameCategories.push(`Category ${this.djGameCategories.length + 1}`);
      }

      const djQuestions: (Question | null)[][] = Array.from({ length: 6 }, () =>
        Array(5).fill(null) as (Question | null)[]
      );
      this.djMissingClueCount = 0;
      for (const clue of gameData.djClues) {
        const catIdx = clue.col - 1;
        const rowIdx = clue.row - 1;
        if (catIdx >= 0 && catIdx < 6 && rowIdx >= 0 && rowIdx < 5) {
          const catArr = djQuestions[catIdx];
          if (catArr) {
            catArr[rowIdx] = {
              category: d(clue.category),
              value: clue.value,
              question: d(clue.question),
              answer: d(clue.answer),
            };
          }
        }
      }
      for (let c = 0; c < 6; c++) {
        const catArr = djQuestions[c];
        if (!catArr) continue;
        for (let r = 0; r < 5; r++) {
          if (!catArr[r]) this.djMissingClueCount++;
        }
      }
      this.djGameQuestions = djQuestions;
    } else {
      this.djGameCategories = DJ_CATEGORIES;
      this.djGameQuestions = DJ_QUESTIONS;
      this.djMissingClueCount = 0;
    }

    if (gameData.finalJeopardy) {
      this.gameFinalJeopardy = {
        category: d(gameData.finalJeopardy.category),
        question: d(gameData.finalJeopardy.question),
        answer: d(gameData.finalJeopardy.answer),
      };
    } else {
      this.gameFinalJeopardy = FINAL_JEOPARDY;
    }

    this.gameDescription = gameData.description || '';
  }

  create() {
    this.overlay = null;
    this.activeQuestion = null;
    this.activeCategoryIndex = -1;
    this.activeValueIndex = -1;
    this.usedCells = new Set();
    this.categoryCells = [];
    this.categoryShadows = [];
    this.categoryTexts = [];
    this.questionCells = [];
    this.score = 0;
    this.scoreText = null;
    this.scoreBarBg = null;
    this.exitBtnBg = null;
    this.exitBtnText = null;
    this.timerEvent = null;
    this.timerSeconds = 0;
    this.currentTimerDuration = this.TIMER_DURATION;
    this.isDailyDouble = false;
    this.dailyDoubleWager = 0;
    this.isFinalJeopardy = false;
    this.finalJeopardyWager = 0;
    this.finalJeopardyElements = [];
    this.wagerOverlayElements = [];
    this.gameDescText = null;
    this.currentRound = 'J';
    this.currentDollarValues = this.J_DOLLAR_VALUES;

    // Restore from saved state if present
    if (this.pendingSavedState) {
      const ss = this.pendingSavedState;
      this.score = ss.score;
      this.gameResults = ss.gameResults ?? [];
      this.gameDescription = ss.gameDescription;
      if (ss.round === 'DJ') {
        this.currentRound = 'DJ';
        this.currentDollarValues = this.DJ_DOLLAR_VALUES;
        this.gameCategories = this.djGameCategories;
        this.missingClueCount = this.djMissingClueCount;
      }
      for (const key of ss.usedCells) {
        this.usedCells.add(key);
      }
      this.pendingSavedState = null;
    }

    // Pick 1 Daily Double for Jeopardy round
    this.dailyDoubleCells = this.pickDailyDoubles(this.gameQuestions, 1);

    // Pick 2 Daily Doubles for Double Jeopardy round
    this.djDailyDoubleCells = this.pickDailyDoubles(this.djGameQuestions, 2);

    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(this.COLOR_BG_DARK);
    this.camera.fadeIn(500, 0, 0, 0);

    this.createBoard();
    this.createScoreDisplay();
    this.animateBoardIn();

    this.updateLayout(this.scale.width, this.scale.height);
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.updateLayout(gameSize.width, gameSize.height);
    });
  }

  // ---------------------------------------------------------------------------
  // Daily Double placement
  // ---------------------------------------------------------------------------

  private pickDailyDoubles(questions: (Question | null)[][], count: number): string[] {
    const cells: string[] = [];
    let attempts = 0;
    while (cells.length < count && attempts < 100) {
      const col = Math.floor(Math.random() * this.NUM_CATEGORIES);
      const row = Math.floor(Math.random() * this.NUM_ROWS);
      const key = `${col}-${row}`;
      if (questions[col]?.[row] && !cells.includes(key)) {
        cells.push(key);
      }
      attempts++;
    }
    return cells;
  }

  // ---------------------------------------------------------------------------
  // Board creation
  // ---------------------------------------------------------------------------

  createBoard() {
    const { width, height } = this.scale;
    const sf = this.sf;
    const boardMargin = Math.max(4, 16 * sf);
    const scoreBarHeight = Math.max(36, 56 * sf);
    const availableWidth = width - boardMargin * 2;
    const availableHeight = height - boardMargin * 2 - scoreBarHeight;
    const cellWidth = availableWidth / this.NUM_CATEGORIES;
    const categoryRowHeight = Math.max(40, 76 * sf);
    const questionRowHeight = (availableHeight - categoryRowHeight) / this.NUM_ROWS;

    this.createCategoryRow(boardMargin, boardMargin, cellWidth, categoryRowHeight);

    let yPos = boardMargin + categoryRowHeight;
    for (let row = 0; row < this.NUM_ROWS; row++) {
      this.createQuestionRow(boardMargin, yPos, cellWidth, questionRowHeight, row);
      yPos += questionRowHeight;
    }
  }

  createCategoryRow(x: number, y: number, cellWidth: number, cellHeight: number) {
    for (let col = 0; col < this.NUM_CATEGORIES; col++) {
      const cellX = x + col * cellWidth;
      const cx = cellX + cellWidth / 2;
      const cy = y + cellHeight / 2;
      const cw = cellWidth - 4;
      const ch = cellHeight - 4;
      const categoryName = this.gameCategories[col] ?? `Category ${col + 1}`;

      const shadow = this.add.rectangle(cx + 2, cy + 2, cw, ch, this.COLOR_SHADOW).setAlpha(0.5);
      this.categoryShadows.push(shadow);

      const rect = this.add.rectangle(cx, cy, cw, ch, this.COLOR_CATEGORY).setStrokeStyle(2, this.COLOR_GOLD, 0.6);

      const catFontSize = Math.max(8, Math.round(16 * this.sf));
      const wrapWidth = Math.max(cellWidth - 8, 40);
      const text = this.add
        .text(cx, cy, categoryName.toUpperCase(), {
          fontFamily: 'Arial Black',
          fontSize: `${catFontSize}px`,
          color: '#FFFFFF',
          align: 'center',
          wordWrap: { width: wrapWidth },
          shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 3, fill: true },
        })
        .setOrigin(0.5);

      this.categoryCells.push(rect);
      this.categoryTexts.push(text);
    }
  }

  createQuestionRow(x: number, y: number, cellWidth: number, cellHeight: number, rowIndex: number) {
    const dollarValue = this.currentDollarValues[rowIndex] ?? 200;

    for (let col = 0; col < this.NUM_CATEGORIES; col++) {
      const cellX = x + col * cellWidth;
      const cx = cellX + cellWidth / 2;
      const cy = y + cellHeight / 2;
      const cw = cellWidth - 4;
      const ch = cellHeight - 4;
      const cellKey = `${col}-${rowIndex}`;
      const isUsed = this.usedCells.has(cellKey);

      // Check if this cell has a question (may be missing from scrape)
      const activeQuestions = this.currentRound === 'DJ' ? this.djGameQuestions : this.gameQuestions;
      const hasQuestion = !!activeQuestions[col]?.[rowIndex];
      const isMissing = !hasQuestion && !isUsed;

      // Missing clues appear as used cells and are pre-marked
      if (isMissing) {
        this.usedCells.add(cellKey);
      }
      const showAsUsed = isUsed || isMissing;

      const shadow = this.add.rectangle(cx + 2, cy + 2, cw, ch, this.COLOR_SHADOW).setAlpha(showAsUsed ? 0.2 : 0.5);

      const rect = this.add
        .rectangle(cx, cy, cw, ch, showAsUsed ? this.COLOR_CELL_USED : this.COLOR_CELL)
        .setStrokeStyle(1, 0x4444ff, 0.4);

      const valFontSize = Math.max(14, Math.round(32 * this.sf));
      const text = this.add
        .text(cx, cy, showAsUsed ? '' : `$${dollarValue}`, {
          fontFamily: 'Arial Black',
          fontSize: `${valFontSize}px`,
          color: '#FFD700',
          align: 'center',
          shadow: { offsetX: 1, offsetY: 2, color: '#8B6914', blur: 0, fill: true },
        })
        .setOrigin(0.5);

      if (!showAsUsed) {
        rect
          .setInteractive({ useHandCursor: true })
          .on('pointerover', () => {
            rect.setFillStyle(this.COLOR_CELL_HOVER);
            shadow.setAlpha(0.7);
            this.tweens.add({ targets: [rect, text, shadow], scaleX: 1.03, scaleY: 1.03, duration: 100, ease: 'Back.easeOut' });
          })
          .on('pointerout', () => {
            rect.setFillStyle(this.COLOR_CELL);
            shadow.setAlpha(0.5);
            this.tweens.add({ targets: [rect, text, shadow], scaleX: 1, scaleY: 1, duration: 100, ease: 'Back.easeIn' });
          })
          .on('pointerdown', () => this.showQuestion(col, rowIndex));
      }

      this.questionCells.push({ rectangle: rect, shadow, text, categoryIndex: col, valueIndex: rowIndex, value: dollarValue });
    }
  }

  // ---------------------------------------------------------------------------
  // Board entrance animation
  // ---------------------------------------------------------------------------

  private animateBoardIn(): void {
    this.categoryCells.forEach((cell, i) => {
      const targetY = cell.y;
      cell.setAlpha(0);
      cell.y -= 30;
      this.tweens.add({ targets: cell, alpha: 1, y: targetY, duration: 300, delay: i * 60, ease: 'Back.easeOut' });
    });
    this.categoryTexts.forEach((text, i) => {
      const targetY = text.y;
      text.setAlpha(0);
      text.y -= 30;
      this.tweens.add({ targets: text, alpha: 1, y: targetY, duration: 300, delay: i * 60, ease: 'Back.easeOut' });
    });
    this.categoryShadows.forEach((shadow, i) => {
      shadow.setAlpha(0);
      this.tweens.add({ targets: shadow, alpha: 0.5, duration: 300, delay: i * 60 });
    });
    this.questionCells.forEach((cell) => {
      const delay = 200 + cell.categoryIndex * 40 + cell.valueIndex * 80;
      const targetY = cell.rectangle.y;
      const targetShadowY = cell.shadow.y;
      cell.rectangle.setAlpha(0); cell.rectangle.y += 20;
      cell.text.setAlpha(0); cell.text.y += 20;
      cell.shadow.setAlpha(0);
      this.tweens.add({ targets: cell.rectangle, alpha: 1, y: targetY, duration: 250, delay, ease: 'Back.easeOut' });
      this.tweens.add({ targets: cell.text, alpha: 1, y: targetY, duration: 250, delay, ease: 'Back.easeOut' });
      this.tweens.add({ targets: cell.shadow, alpha: 0.5, y: targetShadowY, duration: 250, delay });
    });
  }

  // ---------------------------------------------------------------------------
  // Score display
  // ---------------------------------------------------------------------------

  private createScoreDisplay(): void {
    const { width, height } = this.scale;
    const barH = Math.max(32, Math.round(48 * this.sf));
    const barY = height - barH;

    if (this.scoreBarBg) this.scoreBarBg.destroy();
    this.scoreBarBg = this.add.graphics();
    this.scoreBarBg.fillStyle(0x000000, 0.4);
    this.scoreBarBg.fillRect(0, barY, width, barH);
    this.scoreBarBg.lineStyle(1, this.COLOR_GOLD, 0.3);
    this.scoreBarBg.lineBetween(0, barY, width, barY);

    const scoreStr = this.score < 0 ? `-$${Math.abs(this.score)}` : `$${this.score}`;
    this.scoreText = this.add
      .text(width / 2, height - barH / 2, scoreStr, {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(16, Math.round(26 * this.sf))}px`,
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center',
        shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 6, fill: false, stroke: false },
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Show game description (air date / game type) on the score bar
    if (this.gameDescText) this.gameDescText.destroy();
    if (this.gameDescription) {
      this.gameDescText = this.add
        .text(16, height - barH / 2, this.gameDescription, {
          fontFamily: 'Arial',
          fontSize: `${Math.max(9, Math.round(13 * this.sf))}px`,
          color: '#8888BB',
          align: 'left',
          fontStyle: 'italic',
        })
        .setOrigin(0, 0.5)
        .setDepth(10);
    }

    // EXIT button on the right side of the score bar
    if (this.exitBtnBg) this.exitBtnBg.destroy();
    if (this.exitBtnText) this.exitBtnText.destroy();
    const exitBtnW = Math.max(50, 70 * this.sf);
    const exitBtnH = Math.max(22, 28 * this.sf);
    const exitBtnX = width - exitBtnW - 10;
    const exitBtnY = height - barH / 2 - exitBtnH / 2;

    this.exitBtnBg = this.add.graphics().setDepth(10);
    this.exitBtnBg.fillStyle(0x333366, 0.9);
    this.exitBtnBg.fillRoundedRect(exitBtnX, exitBtnY, exitBtnW, exitBtnH, Math.max(4, 6 * this.sf));
    this.exitBtnBg.lineStyle(1, 0xffd700, 0.4);
    this.exitBtnBg.strokeRoundedRect(exitBtnX, exitBtnY, exitBtnW, exitBtnH, Math.max(4, 6 * this.sf));

    this.exitBtnText = this.add
      .text(exitBtnX + exitBtnW / 2, height - barH / 2, 'EXIT', {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(9, Math.round(12 * this.sf))}px`,
        color: '#AAAADD',
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        if (!this.exitBtnBg) return;
        this.exitBtnBg.clear();
        this.exitBtnBg.fillStyle(0x4444aa, 1);
        this.exitBtnBg.fillRoundedRect(exitBtnX, exitBtnY, exitBtnW, exitBtnH, Math.max(4, 6 * this.sf));
        this.exitBtnBg.lineStyle(1, 0xffd700, 0.7);
        this.exitBtnBg.strokeRoundedRect(exitBtnX, exitBtnY, exitBtnW, exitBtnH, Math.max(4, 6 * this.sf));
      })
      .on('pointerout', () => {
        if (!this.exitBtnBg) return;
        this.exitBtnBg.clear();
        this.exitBtnBg.fillStyle(0x333366, 0.9);
        this.exitBtnBg.fillRoundedRect(exitBtnX, exitBtnY, exitBtnW, exitBtnH, Math.max(4, 6 * this.sf));
        this.exitBtnBg.lineStyle(1, 0xffd700, 0.4);
        this.exitBtnBg.strokeRoundedRect(exitBtnX, exitBtnY, exitBtnW, exitBtnH, Math.max(4, 6 * this.sf));
      })
      .on('pointerdown', () => this.exitAndSave());
  }

  private updateScoreDisplay(): void {
    if (this.scoreText) {
      const scoreStr = this.score < 0 ? `-$${Math.abs(this.score)}` : `$${this.score}`;
      this.scoreText.setText(scoreStr);
      this.tweens.add({ targets: this.scoreText, scaleX: 1.1, scaleY: 1.1, duration: 250, yoyo: true, ease: 'Sine.easeInOut' });
    }
  }

  // ---------------------------------------------------------------------------
  // Question overlay
  // ---------------------------------------------------------------------------

  private showQuestion(categoryIndex: number, valueIndex: number): void {
    const cellKey = `${categoryIndex}-${valueIndex}`;
    if (this.overlay || this.usedCells.has(cellKey)) return;

    const activeQuestions = this.currentRound === 'DJ' ? this.djGameQuestions : this.gameQuestions;
    const categoryQuestions = activeQuestions[categoryIndex];
    if (!categoryQuestions) return;
    const question = categoryQuestions[valueIndex];
    if (!question) return;

    this.activeQuestion = question;
    this.activeCategoryIndex = categoryIndex;
    this.activeValueIndex = valueIndex;
    this.currentTimerDuration = this.TIMER_DURATION;

    const activeDDCells = this.currentRound === 'DJ' ? this.djDailyDoubleCells : this.dailyDoubleCells;
    if (activeDDCells.includes(cellKey)) {
      this.isDailyDouble = true;
      soundManager.dailyDouble();
      this.showDailyDoubleSplash(question);
    } else {
      this.isDailyDouble = false;
      this.dailyDoubleWager = 0;
      this.createOverlay(question);
      this.startTimer();
    }
  }

  private showDailyDoubleSplash(question: Question): void {
    const { width, height } = this.scale;

    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9).setInteractive().setDepth(100);
    bg.setAlpha(0);

    const splashText = this.add
      .text(width / 2, height / 2, 'DAILY\nDOUBLE!', {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(36, Math.round(72 * this.sf))}px`,
        color: '#FFD700',
        stroke: '#8B6914',
        strokeThickness: Math.max(3, Math.round(6 * this.sf)),
        align: 'center',
        shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 20, fill: false, stroke: true },
      })
      .setOrigin(0.5)
      .setDepth(102)
      .setScale(0.3)
      .setAlpha(0);

    this.tweens.add({ targets: bg, alpha: 1, duration: 300 });
    this.tweens.add({ targets: splashText, scaleX: 1, scaleY: 1, alpha: 1, duration: 500, ease: 'Back.easeOut', delay: 100 });
    this.tweens.add({ targets: splashText, scaleX: 1.05, scaleY: 1.05, duration: 400, yoyo: true, repeat: 1, delay: 600, ease: 'Sine.easeInOut' });

    this.time.delayedCall(1800, () => {
      this.tweens.add({
        targets: [bg, splashText],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          bg.destroy();
          splashText.destroy();
          // Show wager input instead of auto-calculating
          const maxBoardValue = this.currentDollarValues[this.currentDollarValues.length - 1] ?? 1000;
          const maxWager = Math.max(this.score, maxBoardValue);
          const minWager = 5;
          this.showWagerInput({
            title: 'DAILY DOUBLE',
            category: question.category,
            minWager: minWager,
            maxWager: maxWager,
            onSubmit: (wager: number) => {
              this.dailyDoubleWager = wager;
              this.createOverlay(question);
              this.startTimer();
            },
          });
        },
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Wager input overlay
  // ---------------------------------------------------------------------------

  private showWagerInput(options: {
    title: string;
    category: string;
    minWager: number;
    maxWager: number;
    onSubmit: (wager: number) => void;
  }): void {
    const { width, height } = this.scale;
    const { title, category, minWager, maxWager, onSubmit } = options;

    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85)
      .setInteractive().setDepth(100).setAlpha(0);
    this.tweens.add({ targets: bg, alpha: 1, duration: 250 });

    const panelW = width * 0.7;
    const panelH = height * 0.65;
    const px = width / 2;
    const py = height / 2;

    const panel = this.add.rectangle(px, py, panelW, panelH, 0x0a0e8a)
      .setDepth(101).setScale(0.8).setAlpha(0);

    const panelBorder = this.add.graphics().setDepth(101).setAlpha(0);
    panelBorder.lineStyle(3, 0xffd700, 0.9);
    panelBorder.strokeRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 10);

    this.tweens.add({ targets: [panel, panelBorder], scaleX: 1, scaleY: 1, alpha: 1, duration: 300, ease: 'Back.easeOut' });

    // Title
    const sf = this.sf;
    const titleText = this.add.text(px, py - panelH * 0.36, title, {
      fontFamily: 'Arial Black', fontSize: `${Math.max(20, Math.round(36 * sf))}px`, color: '#FFD700',
      stroke: '#8B6914', strokeThickness: Math.max(2, Math.round(4 * sf)), align: 'center',
      shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 15, fill: false, stroke: true },
    }).setOrigin(0.5).setDepth(102).setAlpha(0);
    this.tweens.add({ targets: titleText, alpha: 1, duration: 300, delay: 150 });

    // Category
    const catText = this.add.text(px, py - panelH * 0.22, `Category: ${category}`, {
      fontFamily: 'Arial', fontSize: `${Math.max(13, Math.round(20 * sf))}px`, color: '#FFFFFF', align: 'center',
      wordWrap: { width: panelW * 0.85 },
    }).setOrigin(0.5).setDepth(102).setAlpha(0);
    this.tweens.add({ targets: catText, alpha: 1, duration: 300, delay: 200 });

    // Score display
    const scoreStr = this.score < 0 ? `-$${Math.abs(this.score)}` : `$${this.score}`;
    const scoreLabel = this.add.text(px, py - panelH * 0.10, `Your Score: ${scoreStr}`, {
      fontFamily: 'Arial', fontSize: `${Math.max(12, Math.round(18 * sf))}px`, color: '#AAAADD', align: 'center', fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(102).setAlpha(0);
    this.tweens.add({ targets: scoreLabel, alpha: 0.8, duration: 300, delay: 250 });

    // Wager range
    const rangeText = this.add.text(px, py + panelH * 0.02, `Wager between $${minWager} and $${maxWager}`, {
      fontFamily: 'Arial', fontSize: `${Math.max(11, Math.round(16 * sf))}px`, color: '#8888BB', align: 'center',
    }).setOrigin(0.5).setDepth(102).setAlpha(0);
    this.tweens.add({ targets: rangeText, alpha: 0.8, duration: 300, delay: 300 });

    // Number input
    const inputW = Math.min(panelW * 0.6, 280);
    const inputHtml = `<input type="number" min="${minWager}" max="${maxWager}" value="${maxWager}" style="
      width: ${inputW}px; padding: 12px 16px;
      font-family: 'Arial Black', sans-serif; font-size: ${Math.max(16, Math.round(22 * sf))}px; color: #FFD700;
      background: rgba(10, 14, 138, 0.9); border: 2px solid rgba(255, 215, 0, 0.6);
      border-radius: 8px; outline: none; text-align: center; box-sizing: border-box;
      -moz-appearance: textfield;
    " />`;

    const inputDom = this.add.dom(px, py + panelH * 0.15).createFromHTML(inputHtml).setDepth(104).setAlpha(0);
    this.tweens.add({ targets: inputDom, alpha: 1, duration: 300, delay: 350 });

    // Validation text
    const validationText = this.add.text(px, py + panelH * 0.26, '', {
      fontFamily: 'Arial', fontSize: `${Math.max(10, Math.round(14 * sf))}px`, color: '#FF4444', align: 'center',
    }).setOrigin(0.5).setDepth(102).setAlpha(0);

    // Submit button
    const btnW = Math.max(120, Math.round(160 * sf));
    const btnH = Math.max(36, Math.round(44 * sf));
    const btnY = py + panelH * 0.36;

    const submitBg = this.add.graphics().setDepth(102).setAlpha(0);
    this.drawPillButton(submitBg, px - btnW / 2, btnY - btnH / 2, btnW, btnH, 0x1a1aff, 0xffd700);

    const submitBtn = this.add.text(px, btnY, 'WAGER', {
      fontFamily: 'Arial Black', fontSize: `${Math.max(14, Math.round(20 * sf))}px`, color: '#FFD700', align: 'center',
    }).setOrigin(0.5).setDepth(103).setAlpha(0);

    this.tweens.add({ targets: [submitBtn, submitBg], alpha: 1, duration: 300, delay: 400 });

    const doSubmit = () => {
      const inputEl = inputDom.node.querySelector('input') as HTMLInputElement | null;
      const raw = parseInt(inputEl?.value ?? '', 10);
      if (isNaN(raw) || raw < minWager || raw > maxWager) {
        validationText.setText(`Enter $${minWager} – $${maxWager}`);
        validationText.setAlpha(1);
        return;
      }
      this.destroyWagerOverlay();
      onSubmit(raw);
    };

    submitBtn.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        submitBg.clear();
        this.drawPillButton(submitBg, px - btnW / 2, btnY - btnH / 2, btnW, btnH, 0x2a2aff, 0xffd700);
        this.tweens.add({ targets: submitBtn, scaleX: 1.05, scaleY: 1.05, duration: 100 });
      })
      .on('pointerout', () => {
        submitBg.clear();
        this.drawPillButton(submitBg, px - btnW / 2, btnY - btnH / 2, btnW, btnH, 0x1a1aff, 0xffd700);
        this.tweens.add({ targets: submitBtn, scaleX: 1, scaleY: 1, duration: 100 });
      })
      .on('pointerdown', doSubmit);

    // Enter key to submit
    const inputEl = inputDom.node.querySelector('input') as HTMLInputElement | null;
    if (inputEl) {
      inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') doSubmit();
      });
      this.time.delayedCall(500, () => inputEl.focus());
    }

    this.wagerOverlayElements = [bg, panel, panelBorder, titleText, catText, scoreLabel, rangeText, inputDom, validationText, submitBg, submitBtn];
  }

  private destroyWagerOverlay(): void {
    for (const el of this.wagerOverlayElements) {
      el.destroy();
    }
    this.wagerOverlayElements = [];
  }

  private getActiveWager(): number {
    if (this.isFinalJeopardy) return this.finalJeopardyWager;
    if (this.isDailyDouble) return this.dailyDoubleWager;
    return this.activeQuestion?.value ?? 0;
  }

  private createOverlay(question: { category: string; value?: number; question: string; answer: string }): void {
    const { width, height } = this.scale;
    const wager = this.getActiveWager();
    const isFJOrDD = this.isDailyDouble || this.isFinalJeopardy;
    const accentColor = isFJOrDD ? 0xffd700 : 0x4488ff;

    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.0).setInteractive().setDepth(100);
    this.tweens.add({ targets: bg, fillAlpha: 0.75, duration: 250 });

    const panelW = width * 0.82;
    const panelH = height * 0.78;
    const px = width / 2;
    const py = height / 2;

    const panel = this.add.rectangle(px, py, panelW, panelH, 0x0a0e8a).setDepth(101).setScale(0.8).setAlpha(0);

    const panelBorder = this.add.graphics().setDepth(101).setAlpha(0);
    panelBorder.lineStyle(isFJOrDD ? 3 : 2, accentColor, 0.9);
    panelBorder.strokeRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 8);

    this.tweens.add({ targets: [panel, panelBorder], scaleX: 1, scaleY: 1, alpha: 1, duration: 300, ease: 'Back.easeOut' });

    // Header
    let headerStr: string;
    if (this.isFinalJeopardy) {
      headerStr = `FINAL JEOPARDY  —  Wager: $${wager}`;
    } else if (this.isDailyDouble) {
      headerStr = `DAILY DOUBLE  —  Wager: $${wager}`;
    } else {
      headerStr = `${question.category}  —  $${question.value ?? 0}`;
    }

    const headerText = this.add
      .text(px, py - panelH * 0.40, headerStr, {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(14, Math.round(22 * this.sf))}px`,
        color: isFJOrDD ? '#FFD700' : '#FFFFFF',
        align: 'center',
        wordWrap: { width: panelW * 0.9 },
        shadow: { offsetX: 0, offsetY: 0, color: isFJOrDD ? '#FFD700' : '#4488ff', blur: isFJOrDD ? 10 : 6, fill: false, stroke: true },
      })
      .setOrigin(0.5)
      .setDepth(102)
      .setAlpha(0);

    this.tweens.add({ targets: headerText, alpha: 1, duration: 200, delay: 150 });

    // Divider
    const dividerLine = this.add.graphics().setDepth(102).setAlpha(0);
    dividerLine.lineStyle(1, accentColor, 0.4);
    dividerLine.lineBetween(px - panelW * 0.4, py - panelH * 0.33, px + panelW * 0.4, py - panelH * 0.33);
    this.tweens.add({ targets: dividerLine, alpha: 1, duration: 200, delay: 200 });

    // Timer text
    const timerDuration = this.currentTimerDuration;
    const timerText = this.add
      .text(px, py - panelH * 0.27, `0:${String(timerDuration).padStart(2, '0')}`, {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(16, Math.round(24 * this.sf))}px`,
        color: '#FFFFFF',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(102)
      .setAlpha(0);
    this.tweens.add({ targets: timerText, alpha: 1, duration: 200, delay: 200 });

    // Timer bar
    const barWidth = panelW * 0.65;
    const barHeight = 8;
    const barY = py - panelH * 0.21;

    const timerBarBg = this.add.graphics().setDepth(102).setAlpha(0);
    timerBarBg.fillStyle(0x222244, 1);
    timerBarBg.fillRoundedRect(px - barWidth / 2, barY - barHeight / 2, barWidth, barHeight, 4);
    this.tweens.add({ targets: timerBarBg, alpha: 1, duration: 200, delay: 250 });

    const timerBar = this.add.rectangle(px, barY, barWidth, barHeight, 0x22cc22).setDepth(103).setAlpha(0);
    this.tweens.add({ targets: timerBar, alpha: 1, duration: 200, delay: 250 });

    // Question text
    const questionText = this.add
      .text(px, py - panelH * 0.05, question.question, {
        fontFamily: 'Georgia, serif',
        fontSize: `${Math.max(14, Math.round(22 * this.sf))}px`,
        color: '#EEEEFF',
        align: 'center',
        wordWrap: { width: panelW * 0.82 },
        lineSpacing: 10,
      })
      .setOrigin(0.5)
      .setDepth(102)
      .setAlpha(0);
    this.tweens.add({ targets: questionText, alpha: 1, y: { from: py, to: py - panelH * 0.05 }, duration: 300, delay: 300 });

    // Answer text (hidden until scored)
    const answerText = this.add
      .text(px, py + panelH * 0.14, question.answer, {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(13, Math.round(20 * this.sf))}px`,
        color: '#FFD700',
        align: 'center',
        wordWrap: { width: panelW * 0.82 },
        shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 8, fill: false, stroke: true },
      })
      .setOrigin(0.5)
      .setDepth(102)
      .setAlpha(0);

    // --- Text input (DOM element) ---
    const inputY = py + panelH * 0.24;
    const inputW = Math.min(panelW * 0.7, 360);

    const inputHtml = `<input type="text" placeholder="Type your answer..." style="
      width: ${inputW}px;
      padding: 10px 16px;
      font-family: 'Arial', sans-serif;
      font-size: 16px;
      color: #FFFFFF;
      background: rgba(10, 14, 138, 0.9);
      border: 2px solid rgba(68, 136, 255, 0.6);
      border-radius: 24px;
      outline: none;
      text-align: center;
      box-sizing: border-box;
    " />`;

    const inputDom = this.add.dom(px, inputY).createFromHTML(inputHtml).setDepth(104).setAlpha(0);
    this.tweens.add({ targets: inputDom, alpha: 1, duration: 300, delay: 400 });

    // Listen for Enter key on input
    const inputEl = inputDom.node.querySelector('input') as HTMLInputElement | null;
    if (inputEl) {
      inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          this.submitAnswer();
        }
      });
    }

    // Submit + Skip buttons side by side
    const subBtnW = Math.max(80, Math.round(110 * this.sf));
    const subBtnH = Math.max(30, Math.round(38 * this.sf));
    const subBtnY = py + panelH * 0.35;
    const btnGap = Math.max(8, 12 * this.sf);
    const submitCx = px - btnGap / 2 - subBtnW / 2;
    const skipCx = px + btnGap / 2 + subBtnW / 2;

    const submitBg = this.add.graphics().setDepth(102).setAlpha(0);
    this.drawPillButton(submitBg, submitCx - subBtnW / 2, subBtnY - subBtnH / 2, subBtnW, subBtnH, 0x1a1aff, 0xffd700);

    const submitButton = this.add
      .text(submitCx, subBtnY, 'Submit', {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(12, Math.round(16 * this.sf))}px`,
        color: '#FFD700',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(103)
      .setAlpha(0);

    this.tweens.add({ targets: [submitButton, submitBg], alpha: 1, duration: 300, delay: 450 });

    submitButton
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        submitBg.clear();
        this.drawPillButton(submitBg, submitCx - subBtnW / 2, subBtnY - subBtnH / 2, subBtnW, subBtnH, 0x2a2aff, 0xffd700);
        this.tweens.add({ targets: submitButton, scaleX: 1.05, scaleY: 1.05, duration: 100 });
      })
      .on('pointerout', () => {
        submitBg.clear();
        this.drawPillButton(submitBg, submitCx - subBtnW / 2, subBtnY - subBtnH / 2, subBtnW, subBtnH, 0x1a1aff, 0xffd700);
        this.tweens.add({ targets: submitButton, scaleX: 1, scaleY: 1, duration: 100 });
      })
      .on('pointerdown', () => this.submitAnswer());

    // Skip button
    const skipBg = this.add.graphics().setDepth(102).setAlpha(0);
    this.drawPillButton(skipBg, skipCx - subBtnW / 2, subBtnY - subBtnH / 2, subBtnW, subBtnH, 0x333366, 0x8888bb);

    const skipButton = this.add
      .text(skipCx, subBtnY, 'Skip', {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(12, Math.round(16 * this.sf))}px`,
        color: '#AAAADD',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(103)
      .setAlpha(0);

    this.tweens.add({ targets: [skipButton, skipBg], alpha: 1, duration: 300, delay: 450 });

    skipButton
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        skipBg.clear();
        this.drawPillButton(skipBg, skipCx - subBtnW / 2, subBtnY - subBtnH / 2, subBtnW, subBtnH, 0x4444aa, 0xaaaadd);
        this.tweens.add({ targets: skipButton, scaleX: 1.05, scaleY: 1.05, duration: 100 });
      })
      .on('pointerout', () => {
        skipBg.clear();
        this.drawPillButton(skipBg, skipCx - subBtnW / 2, subBtnY - subBtnH / 2, subBtnW, subBtnH, 0x333366, 0x8888bb);
        this.tweens.add({ targets: skipButton, scaleX: 1, scaleY: 1, duration: 100 });
      })
      .on('pointerdown', () => this.skipQuestion());

    // Result text (hidden, shown after scoring)
    const resultText = this.add
      .text(px, py + panelH * 0.30, '', {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(16, Math.round(26 * this.sf))}px`,
        color: '#FFFFFF',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(104)
      .setAlpha(0);

    // Community stats text (hidden, shown after scoring)
    const communityText = this.add
      .text(px, py + panelH * 0.38, '', {
        fontFamily: 'Arial',
        fontSize: `${Math.max(10, Math.round(14 * this.sf))}px`,
        color: '#AAAADD',
        align: 'center',
        fontStyle: 'italic',
      })
      .setOrigin(0.5)
      .setDepth(104)
      .setAlpha(0);

    // Timing stats text (hidden, shown after scoring)
    const timingText = this.add
      .text(px, py + panelH * 0.44, '', {
        fontFamily: 'Arial',
        fontSize: `${Math.max(9, Math.round(12 * this.sf))}px`,
        color: '#8899CC',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(104)
      .setAlpha(0);

    this.overlay = {
      background: bg,
      panel,
      panelBorder,
      headerText,
      timerText,
      timerBarBg,
      timerBar,
      questionText,
      answerText,
      inputDom,
      submitButton,
      submitBg,
      skipButton,
      skipBg,
      resultText,
      communityText,
      timingText,
      dividerLine,
      answerRevealed: false,
      timedOut: false,
      scored: false,
    };
  }

  private drawPillButton(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, fill: number, stroke: number): void {
    g.fillStyle(fill, 1);
    g.fillRoundedRect(x, y, w, h, h / 2);
    g.lineStyle(2, stroke, 0.7);
    g.strokeRoundedRect(x, y, w, h, h / 2);
  }

  // ---------------------------------------------------------------------------
  // Answer submission & scoring
  // ---------------------------------------------------------------------------

  private submitAnswer(): void {
    if (!this.overlay || this.overlay.scored) return;

    const inputEl = this.overlay.inputDom.node.querySelector('input') as HTMLInputElement | null;
    const playerAnswer = inputEl?.value ?? '';
    const correctAnswer = this.activeQuestion?.answer ?? '';

    this.stopTimer();
    this.overlay.scored = true;
    this.overlay.answerRevealed = true;

    // Disable input
    if (inputEl) {
      inputEl.disabled = true;
      inputEl.style.opacity = '0.5';
    }

    // Hide submit + skip buttons
    this.tweens.add({ targets: [this.overlay.submitButton, this.overlay.submitBg, this.overlay.skipButton, this.overlay.skipBg], alpha: 0, duration: 150 });
    this.overlay.submitButton.removeInteractive();
    this.overlay.skipButton.removeInteractive();

    // Check answer
    const result = checkAnswer(playerAnswer, correctAnswer);
    const wager = this.getActiveWager();
    const isTimedOut = this.overlay.timedOut;

    if (result.correct) {
      this.score += wager;
      soundManager.correct();
      this.overlay.resultText.setText(`CORRECT!  +$${wager}`);
      this.overlay.resultText.setColor('#44FF44');
    } else if (isTimedOut) {
      // Timer ran out — no deduction
      soundManager.timeUp();
      this.overlay.resultText.setText("TIME'S UP!");
      this.overlay.resultText.setColor('#FFAA44');
    } else {
      // Wrong answer — deduct points
      this.score -= wager;
      soundManager.wrong();
      this.overlay.resultText.setText(`WRONG!  -$${wager}`);
      this.overlay.resultText.setColor('#FF4444');
    }
    this.updateScoreDisplay();

    // Track result for stats (timed-out = skipped, not counted as wrong)
    this.gameResults.push({
      value: this.isFinalJeopardy ? 0 : (this.activeQuestion?.value ?? 0),
      correct: result.correct,
      isDailyDouble: this.isDailyDouble,
      isFinalJeopardy: this.isFinalJeopardy,
      skipped: isTimedOut && !result.correct,
    });

    // Show result text
    this.tweens.add({
      targets: this.overlay.resultText,
      alpha: 1,
      duration: 300,
    });

    // Show correct answer
    this.tweens.add({
      targets: this.overlay.answerText,
      alpha: 1,
      duration: 300,
      delay: 200,
    });

    // Calculate elapsed answer time
    const elapsed = this.answerStartTime > 0
      ? Math.round((Date.now() - this.answerStartTime) / 100) / 10
      : this.currentTimerDuration;

    // Fetch and display community stats for this question
    this.fetchQuestionStats(this.getQuestionId(), result.correct, elapsed);

    const wasFinalJeopardy = this.isFinalJeopardy;

    // Auto-close after delay
    this.time.delayedCall(2200, () => {
      this.animateOverlayOut(() => {
        if (wasFinalJeopardy) {
          this.submitGameStats();
          this.deleteSavedGame();
          this.cameras.main.fadeOut(600, 0, 0, 0);
          this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('GameOver', { score: this.score });
          });
          return;
        }
        // Auto-save progress after each question
        this.saveGameState();
        if (this.usedCells.size >= this.TOTAL_CELLS) {
          if (this.currentRound === 'J') {
            this.transitionToDoubleJeopardy();
          } else {
            this.startFinalJeopardy();
          }
        }
      });
    });
  }

  private skipQuestion(): void {
    if (!this.overlay || this.overlay.scored) return;

    this.stopTimer();
    this.overlay.scored = true;
    this.overlay.answerRevealed = true;

    // Disable input
    const inputEl = this.overlay.inputDom.node.querySelector('input') as HTMLInputElement | null;
    if (inputEl) {
      inputEl.disabled = true;
      inputEl.style.opacity = '0.5';
    }

    // Hide submit + skip buttons
    this.tweens.add({ targets: [this.overlay.submitButton, this.overlay.submitBg, this.overlay.skipButton, this.overlay.skipBg], alpha: 0, duration: 150 });
    this.overlay.submitButton.removeInteractive();
    this.overlay.skipButton.removeInteractive();

    // Show "SKIPPED" — no score change
    this.overlay.resultText.setText('SKIPPED');
    this.overlay.resultText.setColor('#AAAADD');

    // Track as skipped (not counted in stats)
    this.gameResults.push({
      value: this.isFinalJeopardy ? 0 : (this.activeQuestion?.value ?? 0),
      correct: false,
      isDailyDouble: this.isDailyDouble,
      isFinalJeopardy: this.isFinalJeopardy,
      skipped: true,
    });

    // Show result text
    this.tweens.add({ targets: this.overlay.resultText, alpha: 1, duration: 300 });

    // Show correct answer
    this.tweens.add({ targets: this.overlay.answerText, alpha: 1, duration: 300, delay: 200 });

    const wasFinalJeopardy = this.isFinalJeopardy;

    // Auto-close after delay
    this.time.delayedCall(2200, () => {
      this.animateOverlayOut(() => {
        if (wasFinalJeopardy) {
          this.submitGameStats();
          this.deleteSavedGame();
          this.cameras.main.fadeOut(600, 0, 0, 0);
          this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('GameOver', { score: this.score });
          });
          return;
        }
        this.saveGameState();
        if (this.usedCells.size >= this.TOTAL_CELLS) {
          if (this.currentRound === 'J') {
            this.transitionToDoubleJeopardy();
          } else {
            this.startFinalJeopardy();
          }
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Board state persistence
  // ---------------------------------------------------------------------------

  private saveGameState(): void {
    const state: SavedGameState = {
      gameId: this.gameId,
      round: this.currentRound,
      score: this.score,
      usedCells: Array.from(this.usedCells),
      gameResults: this.gameResults,
      gameDescription: this.gameDescription,
      savedAt: new Date().toISOString(),
    };
    fetch('/api/game/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    }).catch((err) => console.error('Failed to save game state:', err));
  }

  private deleteSavedGame(): void {
    fetch('/api/game/save', { method: 'DELETE' })
      .catch((err) => console.error('Failed to delete saved game:', err));
  }

  private exitAndSave(): void {
    if (this.overlay) return;
    this.saveGameState();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('MainMenu');
    });
  }

  // ---------------------------------------------------------------------------
  // Timer
  // ---------------------------------------------------------------------------

  private startTimer(): void {
    this.answerStartTime = Date.now();
    this.timerSeconds = this.currentTimerDuration;
    this.updateTimerDisplay();
    this.updateTimerBar();

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => this.tickTimer(),
      callbackScope: this,
      loop: true,
    });
  }

  private tickTimer(): void {
    this.timerSeconds--;
    this.updateTimerDisplay();
    this.updateTimerBar();

    if (this.timerSeconds <= 5 && this.timerSeconds > 0) {
      soundManager.tickUrgent();
      if (this.overlay) {
        this.overlay.timerText.setColor('#FF4444');
      }
    } else if (this.timerSeconds > 5) {
      soundManager.tickNormal();
    }

    if (this.timerSeconds <= 0) {
      this.stopTimer();
      if (this.overlay && !this.overlay.scored) {
        this.overlay.timedOut = true;
        this.submitAnswer();
      }
    }
  }

  private stopTimer(): void {
    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = null;
    }
  }

  private updateTimerDisplay(): void {
    if (!this.overlay) return;
    const secs = Math.max(0, this.timerSeconds);
    this.overlay.timerText.setText(`0:${String(secs).padStart(2, '0')}`);
  }

  private updateTimerBar(): void {
    if (!this.overlay) return;
    const fraction = Math.max(0, this.timerSeconds / this.currentTimerDuration);
    const { width } = this.scale;
    const panelW = width * 0.82;
    const fullWidth = panelW * 0.65;
    const newWidth = fullWidth * fraction;

    this.tweens.add({ targets: this.overlay.timerBar, width: newWidth, duration: 400, ease: 'Cubic.easeOut' });

    let color: number;
    if (fraction > 0.5) color = 0x22cc22;
    else if (fraction > 0.25) color = 0xddcc22;
    else color = 0xcc2222;
    this.overlay.timerBar.setFillStyle(color);
  }

  // ---------------------------------------------------------------------------
  // Overlay teardown
  // ---------------------------------------------------------------------------

  private animateOverlayOut(onComplete?: () => void): void {
    if (!this.overlay) {
      onComplete?.();
      return;
    }

    const allElements: Phaser.GameObjects.GameObject[] = [
      this.overlay.background,
      this.overlay.panel,
      this.overlay.panelBorder,
      this.overlay.headerText,
      this.overlay.timerText,
      this.overlay.timerBarBg,
      this.overlay.timerBar,
      this.overlay.questionText,
      this.overlay.answerText,
      this.overlay.inputDom,
      this.overlay.submitButton,
      this.overlay.submitBg,
      this.overlay.skipButton,
      this.overlay.skipBg,
      this.overlay.resultText,
      this.overlay.communityText,
      this.overlay.timingText,
      this.overlay.dividerLine,
    ];

    this.tweens.add({
      targets: allElements,
      alpha: 0,
      duration: 250,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.destroyOverlay();
        onComplete?.();
      },
    });
  }

  private destroyOverlay(): void {
    if (!this.overlay) return;

    this.stopTimer();

    this.overlay.background.destroy();
    this.overlay.panel.destroy();
    this.overlay.panelBorder.destroy();
    this.overlay.headerText.destroy();
    this.overlay.timerText.destroy();
    this.overlay.timerBarBg.destroy();
    this.overlay.timerBar.destroy();
    this.overlay.questionText.destroy();
    this.overlay.answerText.destroy();
    this.overlay.inputDom.destroy();
    this.overlay.submitButton.destroy();
    this.overlay.submitBg.destroy();
    this.overlay.skipButton.destroy();
    this.overlay.skipBg.destroy();
    this.overlay.resultText.destroy();
    this.overlay.communityText.destroy();
    this.overlay.timingText.destroy();
    this.overlay.dividerLine.destroy();
    this.overlay = null;

    if (!this.isFinalJeopardy && this.activeCategoryIndex >= 0 && this.activeValueIndex >= 0) {
      this.markCellUsed(this.activeCategoryIndex, this.activeValueIndex);
    }

    this.activeQuestion = null;
    this.activeCategoryIndex = -1;
    this.activeValueIndex = -1;
    this.isDailyDouble = false;
    this.dailyDoubleWager = 0;
  }

  private markCellUsed(categoryIndex: number, valueIndex: number): void {
    const cellKey = `${categoryIndex}-${valueIndex}`;
    this.usedCells.add(cellKey);

    const cell = this.questionCells.find((c) => c.categoryIndex === categoryIndex && c.valueIndex === valueIndex);
    if (cell) {
      this.tweens.add({ targets: cell.rectangle, fillColor: this.COLOR_CELL_USED, duration: 400 });
      this.tweens.add({ targets: cell.shadow, alpha: 0.2, duration: 400 });
      this.tweens.add({ targets: cell.text, alpha: 0, scaleX: 0.5, scaleY: 0.5, duration: 300, onComplete: () => cell.text.setText('') });
      cell.rectangle.removeInteractive();
      cell.rectangle.off('pointerover');
      cell.rectangle.off('pointerout');
      cell.rectangle.off('pointerdown');
    }
  }

  // ---------------------------------------------------------------------------
  // Final Jeopardy
  // ---------------------------------------------------------------------------

  private startFinalJeopardy(): void {
    soundManager.fanfare();
    this.isFinalJeopardy = true;
    this.currentTimerDuration = this.FINAL_TIMER_DURATION;

    const { width, height } = this.scale;

    // Animate board out
    this.categoryCells.forEach((c, i) => {
      this.tweens.add({ targets: c, alpha: 0, scaleX: 0.8, scaleY: 0.8, duration: 300, delay: i * 30, onComplete: () => c.destroy() });
    });
    this.categoryShadows.forEach((s, i) => {
      this.tweens.add({ targets: s, alpha: 0, duration: 300, delay: i * 30, onComplete: () => s.destroy() });
    });
    this.categoryTexts.forEach((t, i) => {
      this.tweens.add({ targets: t, alpha: 0, duration: 300, delay: i * 30, onComplete: () => t.destroy() });
    });
    this.questionCells.forEach((c, i) => {
      this.tweens.add({
        targets: [c.rectangle, c.text, c.shadow],
        alpha: 0, duration: 200, delay: i * 15,
        onComplete: () => { c.rectangle.destroy(); c.text.destroy(); c.shadow.destroy(); },
      });
    });

    this.categoryCells = [];
    this.categoryShadows = [];
    this.categoryTexts = [];
    this.questionCells = [];

    if (this.scoreText) { this.scoreText.destroy(); this.scoreText = null; }
    if (this.scoreBarBg) { this.scoreBarBg.destroy(); this.scoreBarBg = null; }
    if (this.exitBtnBg) { this.exitBtnBg.destroy(); this.exitBtnBg = null; }
    if (this.exitBtnText) { this.exitBtnText.destroy(); this.exitBtnText = null; }

    this.time.delayedCall(700, () => {
      const titleText = this.add
        .text(width / 2, height * 0.3, 'FINAL\nJEOPARDY!', {
          fontFamily: 'Arial Black',
          fontSize: `${Math.max(32, Math.round(60 * this.sf))}px`,
          color: '#FFD700',
          stroke: '#8B6914',
          strokeThickness: Math.max(3, Math.round(6 * this.sf)),
          align: 'center',
          shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 20, fill: false, stroke: true },
        })
        .setOrigin(0.5)
        .setAlpha(0)
        .setScale(0.5);

      this.tweens.add({ targets: titleText, alpha: 1, scaleX: 1, scaleY: 1, duration: 600, ease: 'Back.easeOut' });

      const categoryText = this.add
        .text(width / 2, height * 0.55, `Category: ${this.gameFinalJeopardy.category}`, {
          fontFamily: 'Arial Black',
          fontSize: `${Math.max(16, Math.round(26 * this.sf))}px`,
          color: '#FFFFFF',
          align: 'center',
        })
        .setOrigin(0.5)
        .setAlpha(0);

      this.tweens.add({ targets: categoryText, alpha: 1, duration: 500, delay: 400 });

      this.finalJeopardyElements = [titleText, categoryText];

      // After showing title + category, show wager input
      this.time.delayedCall(2000, () => {
        this.tweens.add({
          targets: this.finalJeopardyElements,
          alpha: 0,
          duration: 400,
          onComplete: () => {
            this.finalJeopardyElements.forEach((el) => el.destroy());
            this.finalJeopardyElements = [];

            const maxWager = Math.max(this.score, 0);
            if (maxWager <= 0) {
              // Can't wager anything -- skip wager input
              this.finalJeopardyWager = 0;
              this.showFinalJeopardyClue();
            } else {
              this.showWagerInput({
                title: 'FINAL JEOPARDY',
                category: this.gameFinalJeopardy.category,
                minWager: 0,
                maxWager,
                onSubmit: (wager: number) => {
                  this.finalJeopardyWager = wager;
                  this.showFinalJeopardyClue();
                },
              });
            }
          },
        });
      });
    });
  }

  private showFinalJeopardyClue(): void {
    this.createScoreDisplay();
    soundManager.finalJeopardy();

    const fjQuestion = {
      category: this.gameFinalJeopardy.category,
      question: this.gameFinalJeopardy.question,
      answer: this.gameFinalJeopardy.answer,
    };
    this.activeQuestion = { ...fjQuestion, value: this.finalJeopardyWager };
    this.createOverlay(fjQuestion);
    this.startTimer();
  }

  // ---------------------------------------------------------------------------
  // Double Jeopardy transition
  // ---------------------------------------------------------------------------

  private transitionToDoubleJeopardy(): void {
    soundManager.fanfare();
    const { width, height } = this.scale;

    // Animate current board out
    this.categoryCells.forEach((c, i) => {
      this.tweens.add({ targets: c, alpha: 0, scaleX: 0.8, scaleY: 0.8, duration: 300, delay: i * 30, onComplete: () => c.destroy() });
    });
    this.categoryShadows.forEach((s, i) => {
      this.tweens.add({ targets: s, alpha: 0, duration: 300, delay: i * 30, onComplete: () => s.destroy() });
    });
    this.categoryTexts.forEach((t, i) => {
      this.tweens.add({ targets: t, alpha: 0, duration: 300, delay: i * 30, onComplete: () => t.destroy() });
    });
    this.questionCells.forEach((c, i) => {
      this.tweens.add({
        targets: [c.rectangle, c.text, c.shadow],
        alpha: 0, duration: 200, delay: i * 15,
        onComplete: () => { c.rectangle.destroy(); c.text.destroy(); c.shadow.destroy(); },
      });
    });

    this.categoryCells = [];
    this.categoryShadows = [];
    this.categoryTexts = [];
    this.questionCells = [];

    if (this.scoreText) { this.scoreText.destroy(); this.scoreText = null; }
    if (this.scoreBarBg) { this.scoreBarBg.destroy(); this.scoreBarBg = null; }
    if (this.gameDescText) { this.gameDescText.destroy(); this.gameDescText = null; }
    if (this.exitBtnBg) { this.exitBtnBg.destroy(); this.exitBtnBg = null; }
    if (this.exitBtnText) { this.exitBtnText.destroy(); this.exitBtnText = null; }

    // Show "DOUBLE JEOPARDY!" splash
    this.time.delayedCall(600, () => {
      const splashBg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9).setDepth(100);

      const splashText = this.add
        .text(width / 2, height / 2, 'DOUBLE\nJEOPARDY!', {
          fontFamily: 'Arial Black', fontSize: `${Math.max(32, Math.round(64 * this.sf))}px`, color: '#FFD700',
          stroke: '#8B6914', strokeThickness: Math.max(3, Math.round(6 * this.sf)), align: 'center',
          shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 20, fill: false, stroke: true },
        })
        .setOrigin(0.5).setDepth(102).setScale(0.3).setAlpha(0);

      this.tweens.add({ targets: splashText, scaleX: 1, scaleY: 1, alpha: 1, duration: 600, ease: 'Back.easeOut' });
      this.tweens.add({ targets: splashText, scaleX: 1.05, scaleY: 1.05, duration: 400, yoyo: true, repeat: 1, delay: 700, ease: 'Sine.easeInOut' });

      this.time.delayedCall(2200, () => {
        this.tweens.add({
          targets: [splashBg, splashText],
          alpha: 0,
          duration: 400,
          onComplete: () => {
            splashBg.destroy();
            splashText.destroy();

            // Switch to DJ round
            this.currentRound = 'DJ';
            this.currentDollarValues = this.DJ_DOLLAR_VALUES;
            this.gameCategories = this.djGameCategories;

            // Reset used cells for DJ board, pre-marking missing clues
            this.usedCells = new Set();
            this.missingClueCount = this.djMissingClueCount;

            // Create the new board
            this.createBoard();
            this.createScoreDisplay();
            this.animateBoardIn();
          },
        });
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Responsive layout
  // ---------------------------------------------------------------------------

  private restoreAfterResize(savedResultText: string, savedResultColor: string): void {
    if (!this.overlay) return;
    this.overlay.scored = true;
    this.overlay.resultText.setText(savedResultText);
    this.overlay.resultText.setColor(savedResultColor);
    this.restoreInputState();
  }

  private restoreInputState(): void {
    if (!this.overlay) return;
    if (this.overlay.scored) {
      this.overlay.answerRevealed = true;
      this.overlay.answerText.setAlpha(1);
      this.overlay.inputDom.setAlpha(0.5);
      this.overlay.submitButton.setAlpha(0);
      this.overlay.submitBg.setAlpha(0);
      this.overlay.skipButton.setAlpha(0);
      this.overlay.skipBg.setAlpha(0);
      this.overlay.resultText.setAlpha(1);
    }
  }

  updateLayout(width: number, height: number) {
    this.cameras.resize(width, height);

    if (this.isFinalJeopardy && this.finalJeopardyElements.length > 0) return;

    this.categoryCells.forEach((c) => c.destroy());
    this.categoryShadows.forEach((s) => s.destroy());
    this.categoryTexts.forEach((t) => t.destroy());
    this.questionCells.forEach((c) => { c.rectangle.destroy(); c.text.destroy(); c.shadow.destroy(); });
    this.categoryCells = [];
    this.categoryShadows = [];
    this.categoryTexts = [];
    this.questionCells = [];

    if (this.scoreText) { this.scoreText.destroy(); this.scoreText = null; }
    if (this.scoreBarBg) { this.scoreBarBg.destroy(); this.scoreBarBg = null; }
    if (this.gameDescText) { this.gameDescText.destroy(); this.gameDescText = null; }
    if (this.exitBtnBg) { this.exitBtnBg.destroy(); this.exitBtnBg = null; }
    if (this.exitBtnText) { this.exitBtnText.destroy(); this.exitBtnText = null; }

    if (!this.isFinalJeopardy) {
      this.createBoard();
    }
    this.createScoreDisplay();

    if (this.overlay && this.activeQuestion) {
      const question = this.activeQuestion;
      const wasScored = this.overlay.scored;
      const savedTimerSecs = this.timerSeconds;
      const savedResultText = this.overlay.resultText.text;
      const savedResultColor = this.overlay.resultText.style.color as string;
      const savedCommunityText = this.overlay.communityText.text;
      const savedTimingText = this.overlay.timingText.text;

      this.overlay.background.destroy();
      this.overlay.panel.destroy();
      this.overlay.panelBorder.destroy();
      this.overlay.headerText.destroy();
      this.overlay.timerText.destroy();
      this.overlay.timerBarBg.destroy();
      this.overlay.timerBar.destroy();
      this.overlay.questionText.destroy();
      this.overlay.answerText.destroy();
      this.overlay.inputDom.destroy();
      this.overlay.submitButton.destroy();
      this.overlay.submitBg.destroy();
      this.overlay.skipButton.destroy();
      this.overlay.skipBg.destroy();
      this.overlay.resultText.destroy();
      this.overlay.communityText.destroy();
      this.overlay.timingText.destroy();
      this.overlay.dividerLine.destroy();
      this.overlay = null;

      this.createOverlay(question);
      this.timerSeconds = savedTimerSecs;
      this.updateTimerDisplay();
      this.updateTimerBar();

      if (wasScored) {
        this.restoreAfterResize(savedResultText, savedResultColor);
        // createOverlay() above re-assigns this.overlay; use fresh reference
        const ov = this.overlay as OverlayElements | null;
        if (savedCommunityText && ov) {
          ov.communityText.setText(savedCommunityText);
          ov.communityText.setAlpha(1);
        }
        if (savedTimingText && ov) {
          ov.timingText.setText(savedTimingText);
          ov.timingText.setAlpha(1);
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Question ID + community stats
  // ---------------------------------------------------------------------------

  private getQuestionId(): string {
    const prefix = this.gameId ? `g${this.gameId}` : 's';
    if (this.isFinalJeopardy) return `${prefix}_FJ`;
    const col = this.activeCategoryIndex;
    const row = this.activeValueIndex;
    return `${prefix}_${this.currentRound}_${col}_${row}`;
  }

  private fetchQuestionStats(questionId: string, correct: boolean, elapsed: number): void {
    fetch('/api/question-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, correct, elapsed }),
    })
      .then((res) => res.json())
      .then((data: QuestionStatsResponse) => {
        if (data.success && data.total > 0 && this.overlay) {
          const pct = Math.round((data.correct / data.total) * 100);
          const plural = data.total === 1 ? 'player' : 'players';
          this.overlay.communityText.setText(`${pct}% of ${data.total} ${plural} got this right`);
          this.tweens.add({ targets: this.overlay.communityText, alpha: 1, duration: 300 });

          const yourTime = data.yourTime.toFixed(1);
          const parts = [`Your time: ${yourTime}s`];
          if (data.avgCorrectTime !== null) {
            parts.push(`Avg correct: ${data.avgCorrectTime.toFixed(1)}s`);
          }
          this.overlay.timingText.setText(parts.join('  •  '));
          this.tweens.add({ targets: this.overlay.timingText, alpha: 1, duration: 300, delay: 100 });
        }
      })
      .catch((err) => console.error('Failed to fetch question stats:', err));
  }

  // ---------------------------------------------------------------------------
  // Stats submission
  // ---------------------------------------------------------------------------

  private submitGameStats(): void {
    const payload = {
      score: this.score,
      description: this.gameDescription,
      answers: this.gameResults,
    };
    fetch('/api/stats/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => console.error('Failed to submit stats:', err));
  }
}
