import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { PLAYER_COLORS, PLAYER_COLOR_NAMES } from '../logic/BoardLogic';
import { SoundManager } from '../audio/SoundManager';
import type { MultiplayerManager } from '../systems/MultiplayerManager';
import type { LobbyPlayer, MultiplayerMessage } from '../../../shared/types/multiplayer';

export interface LobbySceneData {
  mp: MultiplayerManager;
  lobbyCode: string;
}

export class Lobby extends Scene {
  private mp!: MultiplayerManager;
  private lobbyCode = '';
  private players: LobbyPlayer[] = [];
  private hostUserId = '';
  private isHost = false;
  private myReady = false;

  private playerSlots: Phaser.GameObjects.Container[] = [];
  private statusText!: Phaser.GameObjects.Text;
  private startBtn!: Phaser.GameObjects.Container;
  private readyBtn!: Phaser.GameObjects.Container;
  private messageHandler!: (msg: MultiplayerMessage) => void;

  constructor() {
    super('Lobby');
  }

  create(data: LobbySceneData) {
    this.mp = data.mp;
    this.lobbyCode = data.lobbyCode ?? data.mp.lobbyCode;
    this.myReady = false;
    this.cameras.main.setBackgroundColor(0x0d0d1a);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    const { width, height } = this.scale;
    const cx = width / 2;
    const sf = Math.min(width / 800, height / 600, 1.5);

    this.add
      .text(cx, Math.round(20 * sf), 'BLOKUS LOBBY', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${Math.round(20 * sf)}px`,
        color: '#4a90d9',
      })
      .setOrigin(0.5);

    const codeBoxY = Math.round(50 * sf);
    const codeBoxW = Math.min(width - 40, 300);
    const codeBoxH = Math.round(50 * sf);
    const codeBoxX = cx - codeBoxW / 2;

    const codeBg = this.add.graphics();
    codeBg.fillStyle(0x111122, 1);
    codeBg.fillRoundedRect(codeBoxX, codeBoxY, codeBoxW, codeBoxH, 10);
    codeBg.lineStyle(2, 0x4a90d9, 0.6);
    codeBg.strokeRoundedRect(codeBoxX, codeBoxY, codeBoxW, codeBoxH, 10);

    this.add
      .text(cx, codeBoxY + Math.round(14 * sf), 'LOBBY CODE', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.round(8 * sf)}px`,
        color: '#4a90d9',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, codeBoxY + Math.round(34 * sf), this.lobbyCode.split('').join(' '), {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${Math.round(20 * sf)}px`,
        color: '#ffffff',
        letterSpacing: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, codeBoxY + codeBoxH + Math.round(8 * sf), 'Share this code with a friend!', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.round(9 * sf)}px`,
        color: '#666688',
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(cx, codeBoxY + codeBoxH + Math.round(24 * sf), 'Connecting...', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.round(10 * sf)}px`,
        color: '#6688aa',
      })
      .setOrigin(0.5);

    const slotsStartY = codeBoxY + codeBoxH + Math.round(44 * sf);
    this.createPlayerSlots(cx, slotsStartY, width, sf);
    this.createButtons(cx, height, sf);

    this.messageHandler = (msg: MultiplayerMessage) => {
      if (msg.type === 'lobby-update') {
        this.players = msg.players;
        this.hostUserId = msg.hostUserId;
        this.isHost = msg.hostUserId === this.mp.userId;
        this.refreshSlots();
        this.refreshButtons();
      } else if (msg.type === 'game-start') {
        this.mp.offMessage(this.messageHandler);
        const myPlayer = msg.config.players.find((p) => p.userId === this.mp.userId);
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('Game', {
            multiplayer: true,
            mp: this.mp,
            playerNumber: myPlayer?.playerNumber ?? 1,
            opponentName: msg.config.players.find((p) => p.userId !== this.mp.userId)?.username ?? 'Opponent',
          });
        });
      } else if (msg.type === 'player-left') {
        this.statusText.setText('A player left the lobby');
      }
    };
    this.mp.onMessage(this.messageHandler);

    void this.joinLobby();
  }

  private async joinLobby(): Promise<void> {
    try {
      await this.mp.connect();
      const { players, isHost } = await this.mp.joinLobby();
      this.players = players;
      this.isHost = isHost;
      this.hostUserId = isHost ? this.mp.userId : (players[0]?.userId ?? '');
      this.statusText.setText(
        `Connected as ${this.mp.username} ${isHost ? '(Host)' : ''}`,
      );
      this.refreshSlots();
      this.refreshButtons();
    } catch (err) {
      console.error('[Lobby] Join error:', err);
      this.statusText.setText('Failed to join lobby');
    }
  }

  private createPlayerSlots(cx: number, startY: number, width: number, sf: number): void {
    const slotW = Math.min(width - 24, 380);
    const slotH = Math.round(50 * sf);

    for (let i = 0; i < 2; i++) {
      const y = startY + i * (slotH + Math.round(8 * sf));
      const container = this.add.container(cx, y);

      const bg = this.add.graphics();
      bg.fillStyle(0x1a1a2e, 0.8);
      bg.fillRoundedRect(-slotW / 2, 0, slotW, slotH, 8);
      bg.lineStyle(1, 0x2a3a5a, 0.6);
      bg.strokeRoundedRect(-slotW / 2, 0, slotW, slotH, 8);
      container.add(bg);

      const dot = this.add.graphics();
      container.add(dot);

      const labelText = this.add
        .text(-slotW / 2 + 16, 8, `Player ${i + 1} (${PLAYER_COLOR_NAMES[i]})`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: `${Math.round(9 * sf)}px`,
          color: '#666688',
        });
      container.add(labelText);

      const nameText = this.add
        .text(-slotW / 2 + 40, slotH / 2 + 4, 'Waiting...', {
          fontFamily: '"Arial Black", sans-serif',
          fontSize: `${Math.round(12 * sf)}px`,
          color: '#555577',
        })
        .setOrigin(0, 0.5);
      container.add(nameText);

      const readyText = this.add
        .text(slotW / 2 - 16, slotH / 2, '', {
          fontFamily: '"Arial Black", sans-serif',
          fontSize: `${Math.round(10 * sf)}px`,
          color: '#44cc44',
        })
        .setOrigin(1, 0.5);
      container.add(readyText);

      container.setData('bg', bg);
      container.setData('dot', dot);
      container.setData('nameText', nameText);
      container.setData('readyText', readyText);
      container.setData('slotW', slotW);
      container.setData('slotH', slotH);

      this.playerSlots.push(container);
    }
  }

  private refreshSlots(): void {
    for (let i = 0; i < 2; i++) {
      const container = this.playerSlots[i]!;
      const dot = container.getData('dot') as Phaser.GameObjects.Graphics;
      const nameText = container.getData('nameText') as Phaser.GameObjects.Text;
      const readyText = container.getData('readyText') as Phaser.GameObjects.Text;
      const slotH = container.getData('slotH') as number;
      const slotW = container.getData('slotW') as number;

      dot.clear();

      if (i < this.players.length) {
        const p = this.players[i]!;
        const color = PLAYER_COLORS[i]!;

        dot.fillStyle(color, 1);
        dot.fillCircle(-slotW / 2 + 24, slotH / 2 + 4, 6);

        const hostTag = p.userId === this.hostUserId ? ' [HOST]' : '';
        nameText.setText(`${p.username}${hostTag}`);
        nameText.setColor('#ffffff');

        readyText.setText(p.ready ? 'READY' : '');
      } else {
        nameText.setText('Waiting for player...');
        nameText.setColor('#555577');
        readyText.setText('');
      }
    }
  }

  private createButtons(cx: number, height: number, sf: number): void {
    const btnW = Math.round(130 * sf);
    const btnH = Math.round(36 * sf);
    const btnY = height - Math.round(60 * sf);

    this.readyBtn = this.add.container(cx - Math.round(75 * sf), btnY);
    const readyBg = this.add.graphics();
    readyBg.fillStyle(0x3a7ab8, 1);
    readyBg.fillRoundedRect(0, 0, btnW, btnH, 8);
    this.readyBtn.add(readyBg);

    const readyLabel = this.add
      .text(btnW / 2, btnH / 2, 'READY', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${Math.round(12 * sf)}px`,
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.readyBtn.add(readyLabel);

    const readyZone = this.add
      .zone(btnW / 2, btnH / 2, btnW, btnH)
      .setInteractive({ useHandCursor: true });
    this.readyBtn.add(readyZone);

    readyZone.on('pointerdown', () => {
      this.myReady = !this.myReady;
      SoundManager.playSelect();
      readyLabel.setText(this.myReady ? 'UNREADY' : 'READY');
      readyBg.clear();
      readyBg.fillStyle(this.myReady ? 0x44cc44 : 0x3a7ab8, 1);
      readyBg.fillRoundedRect(0, 0, btnW, btnH, 8);
      void this.mp.setReady(this.myReady);
    });

    this.startBtn = this.add.container(cx + Math.round(75 * sf), btnY);
    const startBg = this.add.graphics();
    startBg.fillStyle(0xe8913a, 1);
    startBg.fillRoundedRect(-btnW, 0, btnW, btnH, 8);
    this.startBtn.add(startBg);

    const startLabel = this.add
      .text(-btnW / 2, btnH / 2, 'START GAME', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${Math.round(12 * sf)}px`,
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.startBtn.add(startLabel);

    const startZone = this.add
      .zone(-btnW / 2, btnH / 2, btnW, btnH)
      .setInteractive({ useHandCursor: true });
    this.startBtn.add(startZone);

    startZone.on('pointerdown', () => {
      if (!this.isHost) return;
      SoundManager.playSelect();
      void this.mp.startGame();
    });

    this.startBtn.setVisible(false);

    this.add
      .text(cx, height - Math.round(16 * sf), '[ Back ]', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.round(10 * sf)}px`,
        color: '#666688',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        void this.mp.leaveLobby();
        this.mp.offMessage(this.messageHandler);
        this.scene.start('LobbyBrowser');
      });

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => {
        void this.mp.leaveLobby();
        this.mp.offMessage(this.messageHandler);
        this.scene.start('LobbyBrowser');
      });
    }
  }

  private refreshButtons(): void {
    this.startBtn.setVisible(this.isHost);

    const allReady = this.players.length >= 2 &&
      this.players.every((p) => p.ready || p.userId === this.hostUserId);
    this.startBtn.setAlpha(allReady ? 1 : 0.4);
  }

  shutdown(): void {
    this.mp.offMessage(this.messageHandler);
  }
}
