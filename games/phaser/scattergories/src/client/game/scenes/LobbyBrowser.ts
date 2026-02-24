import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { context } from '@devvit/web/client';
import { SoundManager } from '../systems/SoundManager';
import { MultiplayerManager } from '../systems/MultiplayerManager';
import type { LobbyInfo, LobbyPlayer } from '../../../shared/types/multiplayer';

interface LobbyListEntry extends LobbyInfo {
  players: LobbyPlayer[];
}

export class LobbyBrowser extends Scene {
  private statusText!: Phaser.GameObjects.Text;
  private codeInput = '';
  private codeDisplay!: Phaser.GameObjects.Text;
  private postId = '';
  private busy = false;
  private dotsTimer: Phaser.Time.TimerEvent | null = null;
  private dotCount = 0;
  private lobbyListContainer: Phaser.GameObjects.Container | null = null;
  private lobbyListLabel!: Phaser.GameObjects.Text;
  private refreshTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super('LobbyBrowser');
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.busy = false;
    this.codeInput = '';
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.postId = '';

    void this.fetchPostId();

    this.add
      .text(cx, 24, 'ONLINE PLAY', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000000', 4);

    this.statusText = this.add
      .text(cx, 52, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#3498db',
      })
      .setOrigin(0.5);

    const panelW = Math.min(width - 32, 360);

    this.createActionButton(cx, 80, panelW, 44, '⚡', 'QUICK MATCH', 'Find an open game', 0x3498db, () => {
      void this.quickMatch();
    });

    this.createActionButton(cx, 134, panelW, 44, '➕', 'CREATE LOBBY', 'Start a new game room', 0x2ecc71, () => {
      void this.createLobby();
    });

    const codeY = 196;
    this.add
      .text(cx, codeY, 'JOIN BY CODE', {
        fontFamily: 'monospace',
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#8899aa',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    const inputW = 170;
    const inputH = 34;
    const inputX = cx - inputW / 2;
    const inputY = codeY + 16;

    const inputBg = this.add.graphics();
    inputBg.fillStyle(0x0a0a1a, 1);
    inputBg.fillRoundedRect(inputX, inputY, inputW, inputH, 8);
    inputBg.lineStyle(2, 0x2a3a5a, 1);
    inputBg.strokeRoundedRect(inputX, inputY, inputW, inputH, 8);

    this.codeDisplay = this.add
      .text(cx, inputY + inputH / 2, '______', {
        fontFamily: 'monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffffff',
        letterSpacing: 4,
      })
      .setOrigin(0.5);

    const joinBtnW = 70;
    const joinBtnX = cx + inputW / 2 + 8;
    const joinBg = this.add.graphics();
    joinBg.fillStyle(0x2ecc71, 1);
    joinBg.fillRoundedRect(joinBtnX, inputY, joinBtnW, inputH, 8);

    this.add
      .text(joinBtnX + joinBtnW / 2, inputY + inputH / 2, 'JOIN', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const joinZone = this.add
      .zone(joinBtnX + joinBtnW / 2, inputY + inputH / 2, joinBtnW, inputH)
      .setInteractive({ useHandCursor: true });

    joinZone.on('pointerdown', () => {
      SoundManager.play('select');
      void this.joinByCode();
    });

    const lobbyListY = inputY + inputH + 16;
    this.lobbyListLabel = this.add
      .text(cx, lobbyListY, 'OPEN LOBBIES', {
        fontFamily: 'monospace',
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#8899aa',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    this.lobbyListContainer = this.add.container(0, lobbyListY + 16);

    void this.refreshLobbyList();
    this.refreshTimer = this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => { void this.refreshLobbyList(); },
    });

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Backspace') {
          this.codeInput = this.codeInput.slice(0, -1);
          this.updateCodeDisplay();
        } else if (event.key === 'Enter' && this.codeInput.length === 6) {
          void this.joinByCode();
        } else if (event.key === 'Escape') {
          SoundManager.play('select');
          this.scene.start('ModeSelect');
        } else if (/^[a-zA-Z0-9]$/.test(event.key) && this.codeInput.length < 6) {
          this.codeInput += event.key.toUpperCase();
          this.updateCodeDisplay();
        }
      });
    }

    this.add
      .text(cx, height - 16, '[ ESC \u2014 Back ]', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#666688',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        SoundManager.play('select');
        this.scene.start('ModeSelect');
      });
  }

  private async fetchPostId(): Promise<void> {
    try {
      const res = await fetch('/api/init');
      if (res.ok) {
        const data = (await res.json()) as { postId: string };
        this.postId = data.postId;
      }
    } catch { /* ignore */ }
  }

  private updateCodeDisplay(): void {
    const display = this.codeInput.padEnd(6, '_');
    this.codeDisplay.setText(display.split('').join(' '));
  }

  private startLoadingDots(baseText: string): void {
    this.dotCount = 0;
    this.statusText.setText(baseText);
    this.dotsTimer?.destroy();
    this.dotsTimer = this.time.addEvent({
      delay: 400,
      loop: true,
      callback: () => {
        this.dotCount = (this.dotCount + 1) % 4;
        this.statusText.setText(baseText + '.'.repeat(this.dotCount));
      },
    });
  }

  private stopLoadingDots(): void {
    this.dotsTimer?.destroy();
    this.dotsTimer = null;
  }

  private createActionButton(
    cx: number, y: number, w: number, h: number,
    icon: string, title: string, desc: string,
    color: number, action: () => void,
  ): void {
    const x = cx - w / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.95);
    bg.fillRoundedRect(x, y, w, h, 10);
    bg.lineStyle(1, color, 0.4);
    bg.strokeRoundedRect(x, y, w, h, 10);

    this.add.text(x + 18, y + h / 2, icon, { fontSize: '22px' }).setOrigin(0, 0.5);
    this.add.text(x + 50, y + h / 2 - 8, title, {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0, 0.5);
    this.add.text(x + 50, y + h / 2 + 10, desc, {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#8899aa',
    }).setOrigin(0, 0.5);

    const zone = this.add.zone(cx, y + h / 2, w, h).setInteractive({ useHandCursor: true });

    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1e2d4f, 0.95);
      bg.fillRoundedRect(x, y, w, h, 10);
      bg.lineStyle(2, color, 0.8);
      bg.strokeRoundedRect(x, y, w, h, 10);
    });
    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x16213e, 0.95);
      bg.fillRoundedRect(x, y, w, h, 10);
      bg.lineStyle(1, color, 0.4);
      bg.strokeRoundedRect(x, y, w, h, 10);
    });
    zone.on('pointerdown', action);
  }

  private async ensurePostId(): Promise<boolean> {
    if (this.postId) return true;
    await this.fetchPostId();
    if (!this.postId) {
      this.statusText.setText('Error: Could not connect to server');
      return false;
    }
    return true;
  }

  private async quickMatch(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    if (!(await this.ensurePostId())) { this.busy = false; return; }
    this.startLoadingDots('Searching for open games');
    try {
      const lobby = await MultiplayerManager.findOpenLobby();
      if (lobby) {
        this.stopLoadingDots();
        this.startLoadingDots(`Found lobby ${lobby.lobbyCode}! Joining`);
        const result = await MultiplayerManager.joinLobbyByCode(lobby.lobbyCode);
        this.stopLoadingDots();
        this.goToLobby(result.lobbyCode);
      } else {
        this.stopLoadingDots();
        this.startLoadingDots('No open games. Creating one');
        const result = await MultiplayerManager.createLobby();
        this.stopLoadingDots();
        this.goToLobby(result.lobbyCode);
      }
    } catch (err) {
      this.stopLoadingDots();
      this.statusText.setText(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      this.busy = false;
    }
  }

  private async createLobby(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    if (!(await this.ensurePostId())) { this.busy = false; return; }
    this.startLoadingDots('Creating lobby');
    try {
      const result = await MultiplayerManager.createLobby();
      this.stopLoadingDots();
      this.goToLobby(result.lobbyCode);
    } catch (err) {
      this.stopLoadingDots();
      this.statusText.setText(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      this.busy = false;
    }
  }

  private async joinByCode(): Promise<void> {
    if (this.busy) return;
    if (this.codeInput.length !== 6) {
      this.statusText.setText('Enter a 6-character lobby code');
      return;
    }
    this.busy = true;
    if (!(await this.ensurePostId())) { this.busy = false; return; }
    this.startLoadingDots(`Joining ${this.codeInput}`);
    try {
      const result = await MultiplayerManager.joinLobbyByCode(this.codeInput);
      this.stopLoadingDots();
      this.goToLobby(result.lobbyCode);
    } catch (err) {
      this.stopLoadingDots();
      this.statusText.setText(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      this.busy = false;
    }
  }

  private async refreshLobbyList(): Promise<void> {
    try {
      const res = await fetch('/api/lobbies/list');
      if (!res.ok) return;
      const data = (await res.json()) as { lobbies: LobbyListEntry[] };
      this.renderLobbyList(data.lobbies);
    } catch { /* ignore */ }
  }

  private renderLobbyList(lobbies: LobbyListEntry[]): void {
    if (!this.lobbyListContainer) return;
    this.lobbyListContainer.removeAll(true);

    const { width } = this.scale;
    const cx = width / 2;
    const listW = Math.min(width - 32, 360);
    const rowH = 32;

    if (lobbies.length === 0) {
      const emptyText = this.add.text(cx, 4, 'No open lobbies — create one!', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#555577',
      }).setOrigin(0.5, 0);
      this.lobbyListContainer.add(emptyText);
      return;
    }

    const now = Date.now();
    lobbies.forEach((lobby, i) => {
      const y = i * (rowH + 4);
      const x = cx - listW / 2;

      const bg = this.add.graphics();
      bg.fillStyle(0x16213e, 0.9);
      bg.fillRoundedRect(x, y, listW, rowH, 6);
      bg.lineStyle(1, 0x2a3a5a, 0.6);
      bg.strokeRoundedRect(x, y, listW, rowH, 6);
      this.lobbyListContainer!.add(bg);

      const hostText = this.add.text(x + 10, y + rowH / 2, lobby.hostUsername.slice(0, 12), {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '10px',
        color: '#ffffff',
      }).setOrigin(0, 0.5);
      this.lobbyListContainer!.add(hostText);

      const countText = this.add.text(x + listW * 0.5, y + rowH / 2, `${lobby.playerCount}/${lobby.maxPlayers}`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#3498db',
      }).setOrigin(0.5, 0.5);
      this.lobbyListContainer!.add(countText);

      const ageMs = now - lobby.createdAt;
      const ageStr = ageMs < 60000 ? `${Math.floor(ageMs / 1000)}s` : `${Math.floor(ageMs / 60000)}m`;
      const ageText = this.add.text(x + listW * 0.7, y + rowH / 2, ageStr + ' ago', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#666688',
      }).setOrigin(0.5, 0.5);
      this.lobbyListContainer!.add(ageText);

      const joinBtnW = 50;
      const joinBtnX = x + listW - joinBtnW - 6;
      const joinBg = this.add.graphics();
      joinBg.fillStyle(0x2ecc71, 1);
      joinBg.fillRoundedRect(joinBtnX, y + 4, joinBtnW, rowH - 8, 4);
      this.lobbyListContainer!.add(joinBg);

      const joinLabel = this.add.text(joinBtnX + joinBtnW / 2, y + rowH / 2, 'JOIN', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#ffffff',
      }).setOrigin(0.5);
      this.lobbyListContainer!.add(joinLabel);

      const zone = this.add.zone(joinBtnX + joinBtnW / 2, y + rowH / 2, joinBtnW, rowH)
        .setInteractive({ useHandCursor: true });
      this.lobbyListContainer!.add(zone);

      zone.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(0x1e2d4f, 0.95);
        bg.fillRoundedRect(x, y, listW, rowH, 6);
        bg.lineStyle(2, 0x2ecc71, 0.8);
        bg.strokeRoundedRect(x, y, listW, rowH, 6);
      });
      zone.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(0x16213e, 0.9);
        bg.fillRoundedRect(x, y, listW, rowH, 6);
        bg.lineStyle(1, 0x2a3a5a, 0.6);
        bg.strokeRoundedRect(x, y, listW, rowH, 6);
      });
      zone.on('pointerdown', () => {
        SoundManager.play('select');
        void this.joinLobbyByCode(lobby.lobbyCode);
      });
    });

    const countLabel = lobbies.length === 1 ? '1 lobby' : `${lobbies.length} lobbies`;
    this.lobbyListLabel.setText(`OPEN LOBBIES (${countLabel})`);
  }

  private async joinLobbyByCode(code: string): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    if (!(await this.ensurePostId())) { this.busy = false; return; }
    this.startLoadingDots(`Joining ${code}`);
    try {
      const result = await MultiplayerManager.joinLobbyByCode(code);
      this.stopLoadingDots();
      this.goToLobby(result.lobbyCode);
    } catch (err) {
      this.stopLoadingDots();
      this.statusText.setText(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      this.busy = false;
    }
  }

  private goToLobby(lobbyCode: string): void {
    const mp = new MultiplayerManager(
      this.postId,
      context.userId ?? '',
      context.username ?? 'Player',
      lobbyCode,
    );
    this.scene.start('Lobby', { mp, lobbyCode });
  }

  shutdown(): void {
    this.refreshTimer?.destroy();
    this.refreshTimer = null;
    this.dotsTimer?.destroy();
    this.dotsTimer = null;
  }
}
