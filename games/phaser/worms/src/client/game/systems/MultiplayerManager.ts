import { connectRealtime } from '@devvit/web/client';
import type {
  MultiplayerMessage,
  PlayerAction,
  TurnResult,
  LobbyPlayer,
  MultiplayerGameConfig,
  LobbyInfo,
} from '../../../shared/types/multiplayer';

type MessageHandler = (msg: MultiplayerMessage) => void;

export class MultiplayerManager {
  private connection: { disconnect: () => Promise<void> } | null = null;
  private handlers: MessageHandler[] = [];
  private _connected = false;
  private _postId: string;
  private _userId: string;
  private _username: string;
  private _lobbyCode: string;

  constructor(postId: string, userId: string, username: string, lobbyCode: string) {
    this._postId = postId;
    this._userId = userId;
    this._username = username;
    this._lobbyCode = lobbyCode;
  }

  get postId(): string { return this._postId; }
  get userId(): string { return this._userId; }
  get username(): string { return this._username; }
  get lobbyCode(): string { return this._lobbyCode; }
  get connected(): boolean { return this._connected; }

  onMessage(handler: MessageHandler): void {
    this.handlers.push(handler);
  }

  offMessage(handler: MessageHandler): void {
    this.handlers = this.handlers.filter((h) => h !== handler);
  }

  async connect(): Promise<void> {
    if (this.connection) return;

    const channel = `worms_lobby_${this._lobbyCode}`;
    this.connection = await connectRealtime({
      channel,
      onConnect: () => {
        this._connected = true;
        console.log(`[MP] Connected to channel ${channel}`);
      },
      onDisconnect: () => {
        this._connected = false;
        console.log(`[MP] Disconnected from channel ${channel}`);
      },
      onMessage: (data: unknown) => {
        const msg = data as MultiplayerMessage;
        for (const handler of this.handlers) {
          try {
            handler(msg);
          } catch (err) {
            console.error('[MP] Handler error:', err);
          }
        }
      },
    });
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.disconnect();
      this.connection = null;
      this._connected = false;
    }
  }

  // --- Static lobby operations (no connection needed) ---

  static async createLobby(): Promise<{ lobbyCode: string; players: LobbyPlayer[]; isHost: boolean }> {
    const res = await fetch('/api/lobbies/create', { method: 'POST' });
    return (await res.json()) as { lobbyCode: string; players: LobbyPlayer[]; isHost: boolean; status: string };
  }

  static async joinLobbyByCode(lobbyCode: string): Promise<{ lobbyCode: string; players: LobbyPlayer[]; isHost: boolean }> {
    const res = await fetch('/api/lobbies/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lobbyCode }),
    });
    if (!res.ok) {
      const err = (await res.json()) as { message?: string };
      throw new Error(err.message ?? 'Failed to join lobby');
    }
    return (await res.json()) as { lobbyCode: string; players: LobbyPlayer[]; isHost: boolean; status: string };
  }

  static async findOpenLobby(): Promise<LobbyInfo | null> {
    const res = await fetch('/api/lobbies/open');
    if (!res.ok) return null;
    const data = (await res.json()) as { lobby: LobbyInfo };
    return data.lobby;
  }

  // --- Instance lobby operations ---

  async joinLobby(): Promise<{ players: LobbyPlayer[]; isHost: boolean }> {
    const res = await fetch('/api/game/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lobbyCode: this._lobbyCode }),
    });
    return (await res.json()) as { players: LobbyPlayer[]; isHost: boolean; status: string };
  }

  async leaveLobby(): Promise<void> {
    await fetch('/api/game/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lobbyCode: this._lobbyCode }),
    });
  }

  async setReady(ready: boolean): Promise<void> {
    await fetch('/api/game/ready', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lobbyCode: this._lobbyCode, ready }),
    });
  }

  async selectCharacter(characterId: string): Promise<void> {
    await fetch('/api/game/select-character', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lobbyCode: this._lobbyCode, characterId }),
    });
  }

  async startGame(config: { mapId: string; turnTimer: number; wormsPerTeam: number }): Promise<MultiplayerGameConfig | null> {
    const res = await fetch('/api/game/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lobbyCode: this._lobbyCode, ...config }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { config: MultiplayerGameConfig };
    return data.config;
  }

  async sendAction(action: PlayerAction): Promise<void> {
    await fetch('/api/game/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lobbyCode: this._lobbyCode, action }),
    });
  }

  async sendTurnResult(result: TurnResult): Promise<void> {
    await fetch('/api/game/turn-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lobbyCode: this._lobbyCode, result }),
    });
  }

  async sendEndTurn(turnOrderIndex: number, wind: number): Promise<void> {
    await fetch('/api/game/end-turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lobbyCode: this._lobbyCode, turnOrderIndex, wind }),
    });
  }

  async sendGameOver(winningTeam: number): Promise<void> {
    await fetch('/api/game/game-over', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lobbyCode: this._lobbyCode, winningTeam }),
    });
  }

  async requestRematch(): Promise<string | null> {
    const res = await fetch('/api/game/rematch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lobbyCode: this._lobbyCode }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lobbyCode: string };
    return data.lobbyCode;
  }
}
