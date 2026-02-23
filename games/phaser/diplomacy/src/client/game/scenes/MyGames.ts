import * as Phaser from 'phaser';
import { Scene, GameObjects } from 'phaser';
import type { GameSummary, MyGamesResponse } from '../../../shared/types/api';
import { COUNTRY_COLORS, COUNTRY_NAMES } from '../../../shared/types/game';
import type { Country } from '../../../shared/types/game';

const CARD_HEIGHT = 72;
const CARD_GAP = 8;
const CARD_MARGIN_X = 24;

export class MyGames extends Scene {
  private games: GameSummary[] = [];
  private scrollY = 0;
  private maxScroll = 0;
  private isDragging = false;
  private dragStartY = 0;
  private scrollStartY = 0;
  private container!: GameObjects.Container;

  constructor() {
    super('MyGames');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0f0f1a');

    this.add
      .text(width / 2, 32, 'MY GAMES', {
        fontFamily: 'Georgia, serif',
        fontSize: '28px',
        color: '#e6c200',
        letterSpacing: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 60, 'Your active Diplomacy games', {
        fontFamily: 'Georgia, serif',
        fontSize: '12px',
        color: '#778899',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

    const backBtn = this.add
      .text(20, 28, '\u2190 Back', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#667788',
      })
      .setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setColor('#aabbcc'));
    backBtn.on('pointerout', () => backBtn.setColor('#667788'));
    backBtn.on('pointerdown', () => this.scene.start('MainMenu'));

    this.container = this.add.container(0, 0);

    const loadingText = this.add
      .text(width / 2, height / 2, 'Loading your games...', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#8899aa',
      })
      .setOrigin(0.5);

    this.setupScrolling();

    void this.loadGames().then(() => {
      loadingText.destroy();
    });
  }

  private async loadGames(): Promise<void> {
    try {
      const res = await fetch('/api/user/games');
      if (!res.ok) {
        this.showError('Failed to load games');
        return;
      }
      const data = (await res.json()) as MyGamesResponse;
      this.games = data.games;
      this.renderGames();
    } catch {
      this.showError('Network error');
    }
  }

  private showError(msg: string): void {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, msg, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#e74c3c',
      })
      .setOrigin(0.5);
  }

  private renderGames(): void {
    this.container.removeAll(true);

    const { width, height } = this.scale;
    const cardWidth = Math.min(500, width - CARD_MARGIN_X * 2);
    const startX = (width - cardWidth) / 2;
    const startY = 88;

    if (this.games.length === 0) {
      const emptyY = height / 2 - 20;
      const noGames = this.add
        .text(width / 2, emptyY, 'No active games yet', {
          fontFamily: 'Georgia, serif',
          fontSize: '16px',
          color: '#556677',
        })
        .setOrigin(0.5);
      this.container.add(noGames);

      const hint = this.add
        .text(width / 2, emptyY + 28, 'Join a game from the lobby, or ask a moderator to create a new post.', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: '#445566',
          wordWrap: { width: cardWidth },
          align: 'center',
        })
        .setOrigin(0.5);
      this.container.add(hint);
      return;
    }

    const yourTurnGames = this.games.filter((g) => g.isYourTurn && g.phase !== 'complete');
    const waitingGames = this.games.filter((g) => !g.isYourTurn && g.phase !== 'complete' && g.phase !== 'waiting');
    const lobbyGames = this.games.filter((g) => g.phase === 'waiting');
    const completedGames = this.games.filter((g) => g.phase === 'complete');

    let y = startY;

    const sections: [string, GameSummary[]][] = [
      ['YOUR TURN', yourTurnGames],
      ['WAITING FOR OTHERS', waitingGames],
      ['IN LOBBY', lobbyGames],
      ['COMPLETED', completedGames],
    ];

    for (const [title, games] of sections) {
      if (games.length === 0) continue;

      const header = this.add
        .text(startX, y, title, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          color: title === 'YOUR TURN' ? '#e6c200' : '#667788',
          letterSpacing: 2,
          fontStyle: 'bold',
        });
      this.container.add(header);
      y += 20;

      for (const game of games) {
        this.createGameCard(startX, y, cardWidth, game);
        y += CARD_HEIGHT + CARD_GAP;
      }

      y += 8;
    }

    this.maxScroll = Math.max(0, y - height + 20);
  }

  private createGameCard(x: number, y: number, w: number, game: GameSummary): void {
    const country = game.country as Country;
    const countryColor = Phaser.Display.Color.HexStringToColor(COUNTRY_COLORS[country]).color;
    const isComplete = game.phase === 'complete';
    const isYourTurn = game.isYourTurn && !isComplete;

    const bg = this.add.rectangle(x + w / 2, y + CARD_HEIGHT / 2, w, CARD_HEIGHT, 0x1a2a3a, 0.9);
    bg.setStrokeStyle(isYourTurn ? 2 : 1, isYourTurn ? 0xe6c200 : 0x334455);
    bg.setInteractive({ useHandCursor: true });
    this.container.add(bg);

    const flagCircle = this.add.circle(x + 28, y + CARD_HEIGHT / 2, 16, countryColor);
    this.container.add(flagCircle);

    const initial = this.add
      .text(x + 28, y + CARD_HEIGHT / 2, country.charAt(0), {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.container.add(initial);

    const nameText = this.add
      .text(x + 54, y + 12, COUNTRY_NAMES[country], {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: isComplete ? '#667788' : '#ddeeff',
        fontStyle: 'bold',
      });
    this.container.add(nameText);

    const phaseLabel = this.formatPhase(game);
    const phaseText = this.add
      .text(x + 54, y + 32, phaseLabel, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: '#8899aa',
      });
    this.container.add(phaseText);

    const turnLabel = `${game.turn.season} ${game.turn.year} \u2022 ${game.playerCount}/7 players`;
    const turnText = this.add
      .text(x + 54, y + 48, turnLabel, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '10px',
        color: '#556677',
      });
    this.container.add(turnText);

    if (isYourTurn) {
      const badge = this.add
        .text(x + w - 12, y + 14, 'YOUR TURN', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '9px',
          color: '#0f0f1a',
          backgroundColor: '#e6c200',
          padding: { x: 6, y: 3 },
          fontStyle: 'bold',
        })
        .setOrigin(1, 0);
      this.container.add(badge);
    } else if (isComplete) {
      const winLabel = game.winner
        ? (game.winner === game.country ? 'VICTORY' : 'DEFEATED')
        : 'DRAW';
      const winColor = game.winner === game.country ? '#2ecc71' : (game.winner ? '#e74c3c' : '#8899aa');
      const badge = this.add
        .text(x + w - 12, y + 14, winLabel, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '9px',
          color: winColor,
          fontStyle: 'bold',
        })
        .setOrigin(1, 0);
      this.container.add(badge);
    }

    bg.on('pointerover', () => {
      bg.setFillStyle(0x243a4a, 0.95);
      if (!isYourTurn) bg.setStrokeStyle(2, 0x4488aa);
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x1a2a3a, 0.9);
      bg.setStrokeStyle(isYourTurn ? 2 : 1, isYourTurn ? 0xe6c200 : 0x334455);
    });
    bg.on('pointerdown', () => {
      this.navigateToGame(game.postId);
    });
  }

  private formatPhase(game: GameSummary): string {
    switch (game.phase) {
      case 'waiting': return 'Waiting for players...';
      case 'orders': return game.isYourTurn ? 'Submit your orders!' : 'Waiting for orders...';
      case 'retreats': return game.isYourTurn ? 'Retreat your units!' : 'Waiting for retreats...';
      case 'builds': return game.isYourTurn ? 'Build/disband units!' : 'Waiting for builds...';
      case 'complete': return 'Game Over';
      default: return game.phase;
    }
  }

  private navigateToGame(postId: string): void {
    try {
      const url = `https://www.reddit.com/comments/${postId.replace('t3_', '')}`;
      window.open(url, '_blank');
    } catch { /* fallback: do nothing */ }
  }

  private setupScrolling(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.dragStartY = pointer.y;
      this.scrollStartY = this.scrollY;
    });
    this.input.on('pointerup', () => { this.isDragging = false; });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || !pointer.isDown) return;
      const dy = pointer.y - this.dragStartY;
      this.scrollY = Phaser.Math.Clamp(this.scrollStartY - dy, 0, this.maxScroll);
      this.container.y = -this.scrollY;
    });
    this.input.on('wheel', (
      _pointer: Phaser.Input.Pointer,
      _over: Phaser.GameObjects.GameObject[],
      _dx: number,
      deltaY: number
    ) => {
      this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY * 0.5, 0, this.maxScroll);
      this.container.y = -this.scrollY;
    });
  }
}
