import { Scene } from 'phaser';
import { context } from '@devvit/web/client';
import { MultiplayerManager } from '../systems/MultiplayerManager';
import type { LobbyInfo, LobbyPlayer } from '../../../shared/types/multiplayer';

interface ReconnectResponse {
  status: string;
  lobby: {
    info: LobbyInfo;
    players: LobbyPlayer[];
  } | null;
}

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  preload() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.add
      .text(cx, cy - 50, 'SCATTERGORIES', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '36px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000000', 4);

    this.add
      .text(cx, cy + 10, 'Loading...', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '14px',
        color: '#3498db',
      })
      .setOrigin(0.5);

    const barW = 200;
    const barH = 8;
    const barX = cx - barW / 2;
    const barY = cy + 35;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x222244, 1);
    barBg.fillRoundedRect(barX, barY, barW, barH, 4);

    const barFill = this.add.graphics();

    this.load.on('progress', (value: number) => {
      barFill.clear();
      barFill.fillStyle(0x3498db, 1);
      barFill.fillRoundedRect(barX, barY, barW * value, barH, 4);
    });
  }

  create() {
    void this.checkReconnect();
  }

  private async checkReconnect(): Promise<void> {
    try {
      const res = await fetch('/api/reconnect');
      if (!res.ok) {
        this.scene.start('ModeSelect');
        return;
      }

      const data = (await res.json()) as ReconnectResponse;
      if (!data.lobby) {
        this.scene.start('ModeSelect');
        return;
      }

      const { info } = data.lobby;
      const lobbyCode = info.lobbyCode;
      const postId = info.postId;
      const userId = context.userId ?? '';
      const username = context.username ?? 'Player';

      const mp = new MultiplayerManager(postId, userId, username, lobbyCode);

      if (info.status === 'waiting') {
        this.scene.start('Lobby', { mp, lobbyCode });
      } else {
        this.scene.start('ModeSelect');
      }
    } catch (err) {
      console.error('[Preloader] Reconnect check failed:', err);
      this.scene.start('ModeSelect');
    }
  }
}
