import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { context } from '@devvit/web/client';
import { SoundManager } from '../systems/SoundManager';
import { MultiplayerManager } from '../systems/MultiplayerManager';

export class LobbyBrowser extends Scene {
  private statusText!: Phaser.GameObjects.Text;
  private codeInput = '';
  private codeDisplay!: Phaser.GameObjects.Text;
  private postId = '';
  private busy = false;
  private dotsTimer: Phaser.Time.TimerEvent | null = null;
  private dotCount = 0;

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

    this.cameras.main.setAlpha(0);
    this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: 300, ease: 'Sine.easeOut' });

    void this.fetchPostId();

    this.add
      .text(cx, 22, 'LIVE MULTIPLAYER', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000000', 4);

    this.statusText = this.add
      .text(cx, 48, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#3498db',
      })
      .setOrigin(0.5);

    const panelW = Math.min(width - 32, 360);

    this.createActionButton(cx, 72, panelW, 56, '⚡', 'QUICK MATCH', 'Find or create a game instantly', 0x3498db, () => {
      void this.quickMatch();
    });

    this.createActionButton(cx, 140, panelW, 56, '➕', 'CREATE LOBBY', 'Start a private room for friends', 0x2ecc71, () => {
      void this.createLobby();
    });

    const codeY = 216;
    const codePanelH = 90;

    const codePanelBg = this.add.graphics();
    codePanelBg.fillStyle(0x16213e, 0.6);
    codePanelBg.fillRoundedRect(cx - panelW / 2, codeY, panelW, codePanelH, 10);
    codePanelBg.lineStyle(1, 0xf39c12, 0.3);
    codePanelBg.strokeRoundedRect(cx - panelW / 2, codeY, panelW, codePanelH, 10);

    this.add
      .text(cx, codeY + 14, '🔑  JOIN BY CODE', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const inputW = 180;
    const inputH = 36;
    const inputX = cx - inputW / 2 - 20;
    const inputY = codeY + 36;

    const inputBg = this.add.graphics();
    inputBg.fillStyle(0x0a0a1a, 1);
    inputBg.fillRoundedRect(inputX, inputY, inputW, inputH, 8);
    inputBg.lineStyle(2, 0x2a3a5a, 1);
    inputBg.strokeRoundedRect(inputX, inputY, inputW, inputH, 8);

    this.codeDisplay = this.add
      .text(inputX + inputW / 2, inputY + inputH / 2, '_ _ _ _ _ _', {
        fontFamily: 'monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    const joinBtnW = 72;
    const joinBtnX = inputX + inputW + 10;
    const joinBg = this.add.graphics();
    joinBg.fillStyle(0xf39c12, 1);
    joinBg.fillRoundedRect(joinBtnX, inputY, joinBtnW, inputH, 8);

    this.add
      .text(joinBtnX + joinBtnW / 2, inputY + inputH / 2, 'JOIN', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '13px',
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
      .text(cx, height - 16, '[ ESC — Back ]', {
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
    const display = this.codeInput.padEnd(6, '_').split('').join(' ');
    this.codeDisplay.setText(display);
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
    this.dotsTimer?.destroy();
    this.dotsTimer = null;
  }
}
