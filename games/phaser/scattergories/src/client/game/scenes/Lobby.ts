import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { SoundManager } from '../systems/SoundManager';
import type { MultiplayerManager } from '../systems/MultiplayerManager';
import type { LobbyPlayer, ScatterMessage } from '../../../shared/types/multiplayer';

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
  private messageHandler!: (msg: ScatterMessage) => void;

  constructor() {
    super('Lobby');
  }

  create(data: LobbySceneData) {
    this.mp = data.mp;
    this.lobbyCode = data.lobbyCode ?? data.mp.lobbyCode;
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const { width, height } = this.scale;
    const cx = width / 2;

    this.add
      .text(cx, 18, 'SCATTERGORIES LOBBY', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000000', 4);

    const codeBoxW = Math.min(width - 40, 300);
    const codeBoxH = 44;
    const codeBoxX = cx - codeBoxW / 2;
    const codeBoxY = 40;

    const codeBg = this.add.graphics();
    codeBg.fillStyle(0x0a0a1a, 1);
    codeBg.fillRoundedRect(codeBoxX, codeBoxY, codeBoxW, codeBoxH, 10);
    codeBg.lineStyle(2, 0x3498db, 0.6);
    codeBg.strokeRoundedRect(codeBoxX, codeBoxY, codeBoxW, codeBoxH, 10);

    this.add
      .text(cx, codeBoxY + 14, 'LOBBY CODE', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#3498db',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, codeBoxY + 32, this.lobbyCode.split('').join(' '), {
        fontFamily: 'monospace',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffffff',
        letterSpacing: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, codeBoxY + codeBoxH + 6, 'Share this code with friends!', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#666688',
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(cx, codeBoxY + codeBoxH + 20, 'Connecting...', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#3498db',
      })
      .setOrigin(0.5);

    const slotsStartY = codeBoxY + codeBoxH + 36;
    this.createPlayerSlots(cx, slotsStartY, width);
    this.createButtons(cx, height);

    this.messageHandler = (msg: ScatterMessage) => {
      if (msg.type === 'lobby-update') {
        this.players = msg.players;
        this.hostUserId = msg.hostUserId;
        this.isHost = msg.hostUserId === this.mp.userId;
        this.refreshSlots();
        this.refreshButtons();
      } else if (msg.type === 'game-start') {
        this.mp.offMessage(this.messageHandler);
        this.scene.start('GamePlay', {
          mode: 'multiplayer',
          multiplayerManager: this.mp,
          round: msg.round,
        });
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

  private createPlayerSlots(cx: number, startY: number, width: number): void {
    const slotW = Math.min(width - 24, 380);
    const slotH = 36;

    for (let i = 0; i < 6; i++) {
      const y = startY + i * (slotH + 4);
      const container = this.add.container(cx, y);

      const bg = this.add.graphics();
      bg.fillStyle(0x16213e, 0.8);
      bg.fillRoundedRect(-slotW / 2, 0, slotW, slotH, 8);
      bg.lineStyle(1, 0x2a3a5a, 0.6);
      bg.strokeRoundedRect(-slotW / 2, 0, slotW, slotH, 8);
      container.add(bg);

      const dot = this.add.graphics();
      container.add(dot);

      const nameText = this.add
        .text(-slotW / 2 + 30, slotH / 2, 'Waiting...', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#555577',
        })
        .setOrigin(0, 0.5);
      container.add(nameText);

      const readyText = this.add
        .text(slotW / 2 - 20, slotH / 2, '', {
          fontFamily: 'monospace',
          fontSize: '10px',
          fontStyle: 'bold',
          color: '#2ecc71',
        })
        .setOrigin(0.5, 0.5);
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
    const slotColors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];
    for (let i = 0; i < 6; i++) {
      const container = this.playerSlots[i]!;
      const dot = container.getData('dot') as Phaser.GameObjects.Graphics;
      const nameText = container.getData('nameText') as Phaser.GameObjects.Text;
      const readyText = container.getData('readyText') as Phaser.GameObjects.Text;
      const slotH = container.getData('slotH') as number;
      const slotW = container.getData('slotW') as number;

      dot.clear();

      if (i < this.players.length) {
        const p = this.players[i]!;
        const colorStr = slotColors[i % slotColors.length]!;
        const colorHex = parseInt(colorStr.replace('#', ''), 16);

        dot.fillStyle(colorHex, 1);
        dot.fillCircle(-slotW / 2 + 16, slotH / 2, 5);

        const hostTag = p.userId === this.hostUserId ? ' [HOST]' : '';
        nameText.setText(`${p.username}${hostTag}`);
        nameText.setColor('#ffffff');

        readyText.setText(p.ready ? 'READY' : '');
        readyText.setColor('#2ecc71');
      } else {
        nameText.setText('Waiting for player...');
        nameText.setColor('#555577');
        readyText.setText('');
      }
    }
  }

  private createButtons(cx: number, height: number): void {
    const btnW = 130;
    const btnH = 36;

    this.readyBtn = this.add.container(cx - 75, height - 52);
    const readyBg = this.add.graphics();
    readyBg.fillStyle(0x3498db, 1);
    readyBg.fillRoundedRect(0, 0, btnW, btnH, 8);
    this.readyBtn.add(readyBg);

    const readyLabel = this.add
      .text(btnW / 2, btnH / 2, 'READY', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
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
      SoundManager.play('select');
      readyLabel.setText(this.myReady ? 'UNREADY' : 'READY');
      readyBg.clear();
      readyBg.fillStyle(this.myReady ? 0x2ecc71 : 0x3498db, 1);
      readyBg.fillRoundedRect(0, 0, btnW, btnH, 8);
      void this.mp.setReady(this.myReady);
    });

    this.startBtn = this.add.container(cx + 75, height - 52);
    const startBg = this.add.graphics();
    startBg.fillStyle(0xe74c3c, 1);
    startBg.fillRoundedRect(-btnW, 0, btnW, btnH, 8);
    this.startBtn.add(startBg);

    const startLabel = this.add
      .text(-btnW / 2, btnH / 2, 'START GAME', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
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
      SoundManager.play('select');
      void this.mp.startGame();
    });

    this.startBtn.setVisible(false);

    const backText = this.add
      .text(cx, height - 12, '[ ESC \u2014 Back to Menu ]', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#666688',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    backText.on('pointerdown', () => {
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
