import { Scene } from 'phaser';
import { context } from '@devvit/web/client';
import { SoundManager } from '../audio/SoundManager';
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
    const sf = Math.min(width / 800, height / 600, 1.5);

    this.busy = false;
    this.codeInput = '';
    this.cameras.main.setBackgroundColor(0x0d0d1a);
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.postId = '';

    void this.fetchPostId();

    this.add
      .text(cx, Math.round(24 * sf), 'ONLINE PLAY', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${Math.round(22 * sf)}px`,
        color: '#4a90d9',
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(cx, Math.round(52 * sf), '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.round(10 * sf)}px`,
        color: '#6688aa',
      })
      .setOrigin(0.5);

    const panelW = Math.min(width - 32, 360);

    this.createActionButton(cx, Math.round(90 * sf), panelW, Math.round(52 * sf), sf, '⚡', 'QUICK MATCH', 'Find or create a game', 0x4a90d9, () => {
      void this.quickMatch();
    });

    this.createActionButton(cx, Math.round(160 * sf), panelW, Math.round(52 * sf), sf, '➕', 'CREATE LOBBY', 'Start a new game room', 0x3a7ab8, () => {
      void this.createLobby();
    });

    const codeY = Math.round(240 * sf);
    this.add
      .text(cx, codeY, 'JOIN BY CODE', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${Math.round(10 * sf)}px`,
        color: '#8899aa',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    const inputW = Math.round(180 * sf);
    const inputH = Math.round(40 * sf);
    const inputX = cx - inputW / 2;
    const inputY = codeY + Math.round(20 * sf);

    const inputBg = this.add.graphics();
    inputBg.fillStyle(0x0a0a1a, 1);
    inputBg.fillRoundedRect(inputX, inputY, inputW, inputH, 8);
    inputBg.lineStyle(2, 0x2a3a5a, 1);
    inputBg.strokeRoundedRect(inputX, inputY, inputW, inputH, 8);

    this.codeDisplay = this.add
      .text(cx, inputY + inputH / 2, '_ _ _ _ _ _', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${Math.round(18 * sf)}px`,
        color: '#ffffff',
        letterSpacing: 4,
      })
      .setOrigin(0.5);

    const joinBtnW = Math.round(80 * sf);
    const joinBtnX = cx + inputW / 2 + 10;
    const joinBg = this.add.graphics();
    joinBg.fillStyle(0x4a90d9, 1);
    joinBg.fillRoundedRect(joinBtnX, inputY, joinBtnW, inputH, 8);

    this.add
      .text(joinBtnX + joinBtnW / 2, inputY + inputH / 2, 'JOIN', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${Math.round(13 * sf)}px`,
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const joinZone = this.add
      .zone(joinBtnX + joinBtnW / 2, inputY + inputH / 2, joinBtnW, inputH)
      .setInteractive({ useHandCursor: true });

    joinZone.on('pointerdown', () => {
      SoundManager.playSelect();
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
          SoundManager.playSelect();
          this.scene.start('ModeSelect');
        } else if (/^[a-zA-Z0-9]$/.test(event.key) && this.codeInput.length < 6) {
          this.codeInput += event.key.toUpperCase();
          this.updateCodeDisplay();
        }
      });
    }

    this.add
      .text(cx, height - Math.round(16 * sf), '[ Back to Menu ]', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.round(10 * sf)}px`,
        color: '#666688',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        SoundManager.playSelect();
        this.scene.start('ModeSelect');
      });
  }

  private async fetchPostId(): Promise<void> {
    try {
      this.postId = context.postId ?? '';
    } catch {
      // ignore
    }
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
    cx: number, y: number, w: number, h: number, sf: number,
    icon: string, title: string, desc: string,
    color: number, action: () => void,
  ): void {
    const x = cx - w / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(x, y, w, h, 10);
    bg.lineStyle(1, color, 0.4);
    bg.strokeRoundedRect(x, y, w, h, 10);

    this.add
      .text(x + 18, y + h / 2, icon, { fontSize: `${Math.round(20 * sf)}px` })
      .setOrigin(0, 0.5);

    this.add
      .text(x + 50, y + h / 2 - 8, title, {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${Math.round(13 * sf)}px`,
        color: '#ffffff',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(x + 50, y + h / 2 + 10, desc, {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.round(9 * sf)}px`,
        color: '#8899aa',
      })
      .setOrigin(0, 0.5);

    const zone = this.add
      .zone(cx, y + h / 2, w, h)
      .setInteractive({ useHandCursor: true });

    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x222244, 0.95);
      bg.fillRoundedRect(x, y, w, h, 10);
      bg.lineStyle(2, color, 0.8);
      bg.strokeRoundedRect(x, y, w, h, 10);
    });

    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1a1a2e, 0.95);
      bg.fillRoundedRect(x, y, w, h, 10);
      bg.lineStyle(1, color, 0.4);
      bg.strokeRoundedRect(x, y, w, h, 10);
    });

    zone.on('pointerdown', action);
  }

  private async quickMatch(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
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
    this.startLoadingDots(`Joining ${this.codeInput}`);
    try {
      const result = await MultiplayerManager.joinLobbyByCode(this.codeInput) as {
        lobbyCode: string;
        players: import('../../../shared/types/multiplayer').LobbyPlayer[];
        isHost: boolean;
        reconnect?: boolean;
      };
      this.stopLoadingDots();
      if (result.reconnect) {
        this.startLoadingDots('Reconnecting to game');
        await this.reconnectToGame(result.lobbyCode);
      } else {
        this.goToLobby(result.lobbyCode);
      }
    } catch (err) {
      this.stopLoadingDots();
      this.statusText.setText(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      this.busy = false;
    }
  }

  private async reconnectToGame(lobbyCode: string): Promise<void> {
    const mp = new MultiplayerManager(
      this.postId,
      context.userId ?? '',
      context.username ?? 'Player',
      lobbyCode,
    );
    await mp.connect();
    const data = await mp.reconnect();
    this.stopLoadingDots();
    if (!data) {
      this.statusText.setText('Game has ended or reconnect failed');
      return;
    }
    this.cameras.main.fadeOut(300, 0, 0, 0);
    let reconnectMoves: import('../../../shared/types/multiplayer').BlokusMove[] = [];
    try {
      reconnectMoves = JSON.parse(data.movesJson) as import('../../../shared/types/multiplayer').BlokusMove[];
    } catch {
      reconnectMoves = [];
    }
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Game', {
        multiplayer: true,
        mp,
        playerNumber: data.playerNumber,
        opponentName: data.opponentName,
        turnTimerSeconds: data.config.turnTimerSeconds ?? 90,
        reconnectMoves,
      });
    });
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
}
