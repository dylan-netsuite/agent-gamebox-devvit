import * as Phaser from 'phaser';
import { Scene, GameObjects } from 'phaser';
import type { GameState, Country, PlayerInfo } from '../../../shared/types/game';
import { ALL_COUNTRIES, COUNTRY_COLORS, COUNTRY_NAMES } from '../../../shared/types/game';
import type { InitResponse, JoinGameResponse, ErrorResponse, StartGameResponse } from '../../../shared/types/api';

const LOBBY_POLL_MS = 3000;

export class MainMenu extends Scene {
  private gameState: GameState | null = null;
  private currentPlayer: PlayerInfo | null = null;
  private statusText!: GameObjects.Text;
  private countryButtons: GameObjects.Container[] = [];
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private playerListTexts: GameObjects.Text[] = [];

  constructor() {
    super('MainMenu');
  }

  create() {
    const { width } = this.scale;

    this.cameras.main.setBackgroundColor('#0f0f1a');

    this.add
      .text(width / 2, 40, 'DIPLOMACY', {
        fontFamily: 'Georgia, serif',
        fontSize: '36px',
        color: '#e6c200',
        letterSpacing: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 72, 'The Game of International Intrigue', {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#778899',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(width / 2, 100, 'Connecting...', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#aabbcc',
      })
      .setOrigin(0.5);

    void this.loadGameState();
  }

  private async loadGameState(): Promise<void> {
    try {
      const res = await fetch('/api/init');
      const data = (await res.json()) as InitResponse;
      this.gameState = data.gameState;
      this.currentPlayer = data.currentPlayer;

      if (this.gameState?.phase === 'orders' || this.gameState?.phase === 'retreats' || this.gameState?.phase === 'builds') {
        this.scene.start('GamePlay', { gameState: this.gameState, currentPlayer: this.currentPlayer });
        return;
      }

      if (this.gameState?.phase === 'complete') {
        this.scene.start('GameOver', { gameState: this.gameState });
        return;
      }

      this.updateStatus();
      this.createCountrySelection();
      this.createPlayerList();
      this.createStartButton();
      this.startPolling();
    } catch {
      this.statusText.setText('Failed to connect. Tap to retry.');
      this.statusText.setInteractive({ useHandCursor: true });
      this.statusText.on('pointerdown', () => this.scene.restart());
    }
  }

  private startPolling() {
    this.stopPolling();
    this.pollTimer = setInterval(() => void this.pollLobby(), LOBBY_POLL_MS);
  }

  private stopPolling() {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
  }

  private async pollLobby(): Promise<void> {
    try {
      const res = await fetch('/api/game/state');
      if (!res.ok) return;
      const state = (await res.json()) as GameState;

      if (state.phase === 'orders' || state.phase === 'retreats' || state.phase === 'builds') {
        this.stopPolling();
        const initRes = await fetch('/api/init');
        const initData = (await initRes.json()) as InitResponse;
        this.scene.start('GamePlay', { gameState: initData.gameState, currentPlayer: initData.currentPlayer });
        return;
      }

      if (state.players.length !== this.gameState?.players.length) {
        this.stopPolling();
        this.scene.restart();
      }
    } catch { /* ignore */ }
  }

  private updateStatus(): void {
    if (!this.gameState) { this.statusText.setText('No game found.'); return; }
    const playerCount = this.gameState.players.length;
    if (this.currentPlayer) {
      this.statusText.setText(`You are ${COUNTRY_NAMES[this.currentPlayer.country]}. ${playerCount}/7 players joined.`);
    } else {
      this.statusText.setText(`${playerCount}/7 players. Choose a country to join.`);
    }
  }

  private createCountrySelection(): void {
    const { width } = this.scale;
    const startY = 130;
    const rowHeight = 72;

    const maxCols = Math.min(7, Math.max(3, Math.floor(width / 90)));
    const cols = maxCols;
    const colWidth = Math.min(140, (width - 20) / cols);
    const totalWidth = cols * colWidth;
    const startX = (width - totalWidth) / 2 + colWidth / 2;

    ALL_COUNTRIES.forEach((country, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * colWidth;
      const y = startY + row * rowHeight;

      const container = this.add.container(x, y);

      const taken = this.gameState?.players.find((p) => p.country === country);
      const isMe = this.currentPlayer?.country === country;
      const color = Phaser.Display.Color.HexStringToColor(COUNTRY_COLORS[country]).color;

      const circleRadius = Math.min(24, colWidth * 0.2);
      const bg = this.add.circle(0, 0, circleRadius, color, isMe ? 1 : taken ? 0.3 : 0.7);
      bg.setStrokeStyle(2, isMe ? 0xe6c200 : 0x334455);

      const initial = this.add
        .text(0, 0, country.charAt(0), {
          fontFamily: 'Georgia, serif',
          fontSize: '20px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      const label = this.add
        .text(0, 32, COUNTRY_NAMES[country], {
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          color: taken ? '#556677' : '#aabbcc',
          align: 'center',
        })
        .setOrigin(0.5);

      container.add([bg, initial, label]);

      if (taken) {
        const playerName = this.add
          .text(0, 44, isMe ? '(You)' : taken.username, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '9px',
            color: isMe ? '#e6c200' : '#667788',
          })
          .setOrigin(0.5);
        container.add(playerName);
      }

      if (!taken && !this.currentPlayer) {
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => bg.setStrokeStyle(3, 0xe6c200));
        bg.on('pointerout', () => bg.setStrokeStyle(2, 0x334455));
        bg.on('pointerdown', () => void this.joinCountry(country));
      }

      this.countryButtons.push(container);
    });
  }

  private createPlayerList(): void {
    if (!this.gameState) return;
    const { width, height } = this.scale;
    const startY = 280;

    const headerText = this.add
      .text(width / 2, startY, 'Players', {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#e6c200',
      })
      .setOrigin(0.5);
    this.playerListTexts.push(headerText);

    if (this.gameState.players.length === 0) {
      const emptyText = this.add
        .text(width / 2, startY + 22, 'No players yet — be the first to join!', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: '#667788',
          fontStyle: 'italic',
        })
        .setOrigin(0.5);
      this.playerListTexts.push(emptyText);
    } else {
      this.gameState.players.forEach((player, i) => {
        const isMe = player.userId === this.currentPlayer?.userId;
        const color = COUNTRY_COLORS[player.country];
        const text = `${COUNTRY_NAMES[player.country]}: ${player.username}${isMe ? ' (You)' : ''}`;
        const pText = this.add
          .text(width / 2, startY + 22 + i * 18, text, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
            color: isMe ? '#e6c200' : color,
          })
          .setOrigin(0.5);
        this.playerListTexts.push(pText);
      });
    }
  }

  private async joinCountry(country: Country): Promise<void> {
    try {
      this.statusText.setText('Joining...');
      const res = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country }),
      });
      if (!res.ok) {
        const err = (await res.json()) as ErrorResponse;
        this.statusText.setText(err.message);
        return;
      }
      const data = (await res.json()) as JoinGameResponse;
      this.gameState = data.gameState;
      this.currentPlayer = data.player;
      this.stopPolling();
      this.scene.restart();
    } catch { this.statusText.setText('Failed to join. Try again.'); }
  }

  private createStartButton(): void {
    if (!this.gameState || this.gameState.phase !== 'waiting') return;
    const { width, height } = this.scale;

    if (this.currentPlayer && this.gameState.players.length < 7) {
      const fillY = height - 110;
      const fillBg = this.add.rectangle(width / 2, fillY, 200, 32, 0x1a2a3a);
      fillBg.setStrokeStyle(2, 0x4488aa);
      fillBg.setInteractive({ useHandCursor: true });
      this.add.text(width / 2, fillY, 'FILL WITH BOTS', {
        fontFamily: 'Georgia, serif', fontSize: '13px', color: '#4488aa', letterSpacing: 2,
      }).setOrigin(0.5);
      fillBg.on('pointerover', () => fillBg.setStrokeStyle(3, 0x66aacc));
      fillBg.on('pointerout', () => fillBg.setStrokeStyle(2, 0x4488aa));
      fillBg.on('pointerdown', () => void this.fillBots());
    }

    const y = height - 65;
    const canStart = this.gameState.players.length >= 2 && this.currentPlayer;
    const bg = this.add.rectangle(width / 2, y, 200, 40, 0x2c3e50);
    bg.setStrokeStyle(2, canStart ? 0xe6c200 : 0x334455);
    this.add.text(width / 2, y, 'START GAME', {
      fontFamily: 'Georgia, serif', fontSize: '16px', color: canStart ? '#e6c200' : '#556677', letterSpacing: 3,
    }).setOrigin(0.5);

    if (canStart) {
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => bg.setStrokeStyle(3, 0xe6c200));
      bg.on('pointerout', () => bg.setStrokeStyle(2, 0xe6c200));
      bg.on('pointerdown', () => void this.startGame());
    }

    const refreshY = height - 30;
    const refreshText = this.add
      .text(width / 2, refreshY, 'Refresh', {
        fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#667788',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    refreshText.on('pointerdown', () => { this.stopPolling(); this.scene.restart(); });
  }

  private async fillBots(): Promise<void> {
    try {
      this.statusText.setText('Filling with bots...');
      const res = await fetch('/api/game/fill-bots', { method: 'POST' });
      if (!res.ok) { const err = (await res.json()) as ErrorResponse; this.statusText.setText(err.message); return; }
      this.stopPolling();
      this.scene.restart();
    } catch { this.statusText.setText('Failed to fill bots.'); }
  }

  private async startGame(): Promise<void> {
    try {
      this.statusText.setText('Starting game...');
      const res = await fetch('/api/game/start', { method: 'POST' });
      if (!res.ok) { const err = (await res.json()) as ErrorResponse; this.statusText.setText(err.message); return; }
      const data = (await res.json()) as StartGameResponse;
      this.stopPolling();
      this.scene.start('GamePlay', { gameState: data.gameState, currentPlayer: this.currentPlayer });
    } catch { this.statusText.setText('Failed to start game.'); }
  }

  shutdown(): void {
    this.stopPolling();
  }
}
