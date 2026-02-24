import { redis } from '@devvit/web/server';
import type {
  LobbyPlayer,
  LobbyInfo,
  LobbyStatus,
  MultiplayerGameConfig,
} from '../../shared/types/multiplayer';

const LOBBY_TTL_SECONDS = 7200;

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

function lobbyStateKey(code: string): string {
  return `blokus_lobby_${code}_state`;
}

function lobbyPlayersKey(code: string): string {
  return `blokus_lobby_${code}_players`;
}

function lobbyConfigKey(code: string): string {
  return `blokus_lobby_${code}_config`;
}

function lobbyHeartbeatKey(code: string, userId: string): string {
  return `blokus_lobby_${code}_hb_${sanitizeId(userId)}`;
}

function lobbyMovesKey(code: string): string {
  return `blokus_lobby_${code}_moves`;
}

function lobbyPassesKey(code: string): string {
  return `blokus_lobby_${code}_passes`;
}

function postLobbiesKey(postId: string): string {
  return `blokus_${sanitizeId(postId)}_lobbies`;
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

async function setWithTTL(key: string, value: string): Promise<void> {
  await redis.set(key, value);
  await redis.expire(key, LOBBY_TTL_SECONDS);
}

async function refreshTTL(code: string): Promise<void> {
  await redis.expire(lobbyStateKey(code), LOBBY_TTL_SECONDS);
  await redis.expire(lobbyPlayersKey(code), LOBBY_TTL_SECONDS);
  await redis.expire(lobbyConfigKey(code), LOBBY_TTL_SECONDS);
}

export async function createLobby(
  postId: string,
  hostUserId: string,
  hostUsername: string,
): Promise<LobbyInfo> {
  let code = generateCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await redis.get(lobbyStateKey(code));
    if (!existing) break;
    code = generateCode();
    attempts++;
  }

  const info: LobbyInfo = {
    lobbyCode: code,
    postId,
    hostUserId,
    hostUsername,
    playerCount: 0,
    maxPlayers: 2,
    status: 'waiting',
    createdAt: Date.now(),
  };

  await setWithTTL(lobbyStateKey(code), JSON.stringify(info));
  await setWithTTL(lobbyPlayersKey(code), JSON.stringify([]));

  const lobbiesKey = postLobbiesKey(postId);
  const existing = await redis.get(lobbiesKey);
  const codes: string[] = existing ? (JSON.parse(existing) as string[]) : [];
  codes.push(code);
  await redis.set(lobbiesKey, JSON.stringify(codes));

  return info;
}

export async function getLobbyInfo(code: string): Promise<LobbyInfo | null> {
  const raw = await redis.get(lobbyStateKey(code));
  if (!raw) return null;
  return JSON.parse(raw) as LobbyInfo;
}

export async function saveLobbyInfo(info: LobbyInfo): Promise<void> {
  await setWithTTL(lobbyStateKey(info.lobbyCode), JSON.stringify(info));
}

export async function findOpenLobby(postId: string): Promise<LobbyInfo | null> {
  const lobbiesKey = postLobbiesKey(postId);
  const raw = await redis.get(lobbiesKey);
  if (!raw) return null;
  const codes = JSON.parse(raw) as string[];

  const liveCodes: string[] = [];
  let found: LobbyInfo | null = null;

  for (const code of codes) {
    const info = await getLobbyInfo(code);
    if (!info) continue;
    liveCodes.push(code);
    if (!found && info.status === 'waiting' && info.playerCount < info.maxPlayers) {
      found = info;
    }
  }

  if (liveCodes.length !== codes.length) {
    await redis.set(lobbiesKey, JSON.stringify(liveCodes));
  }

  return found;
}

export async function updateLobbyStatus(code: string, status: LobbyStatus): Promise<void> {
  const info = await getLobbyInfo(code);
  if (info) {
    info.status = status;
    await saveLobbyInfo(info);
    await refreshTTL(code);
  }
}

export async function saveLobbyGameConfig(code: string, config: MultiplayerGameConfig): Promise<void> {
  await setWithTTL(lobbyConfigKey(code), JSON.stringify(config));
}

export async function getLobbyPlayers(code: string): Promise<LobbyPlayer[]> {
  const raw = await redis.get(lobbyPlayersKey(code));
  if (!raw) return [];
  return JSON.parse(raw) as LobbyPlayer[];
}

export async function saveLobbyPlayers(code: string, players: LobbyPlayer[]): Promise<void> {
  await setWithTTL(lobbyPlayersKey(code), JSON.stringify(players));
}

export async function addLobbyPlayer(
  code: string,
  userId: string,
  username: string,
): Promise<{ players: LobbyPlayer[]; isHost: boolean }> {
  const players = await getLobbyPlayers(code);
  const existing = players.find((p) => p.userId === userId);
  if (existing) {
    return { players, isHost: players[0]?.userId === userId };
  }

  if (players.length >= 2) {
    return { players, isHost: false };
  }

  const playerNumber = (players.length + 1) as 1 | 2;
  players.push({
    userId,
    username,
    playerNumber,
    ready: false,
  });

  await saveLobbyPlayers(code, players);

  const info = await getLobbyInfo(code);
  if (info) {
    info.playerCount = players.length;
    if (!info.hostUserId || players.length === 1) {
      info.hostUserId = userId;
      info.hostUsername = username;
    }
    await saveLobbyInfo(info);
  }

  await refreshTTL(code);

  return { players, isHost: players[0]?.userId === userId };
}

export async function removeLobbyPlayer(
  code: string,
  userId: string,
): Promise<LobbyPlayer[]> {
  let players = await getLobbyPlayers(code);
  players = players.filter((p) => p.userId !== userId);
  players.forEach((p, i) => {
    p.playerNumber = (i + 1) as 1 | 2;
  });
  await saveLobbyPlayers(code, players);

  const info = await getLobbyInfo(code);
  if (info) {
    info.playerCount = players.length;
    if (info.hostUserId === userId && players.length > 0) {
      info.hostUserId = players[0]!.userId;
      info.hostUsername = players[0]!.username;
    }
    await saveLobbyInfo(info);
  }

  return players;
}

export async function setPlayerReady(
  code: string,
  userId: string,
  ready: boolean,
): Promise<LobbyPlayer[]> {
  const players = await getLobbyPlayers(code);
  const player = players.find((p) => p.userId === userId);
  if (player) {
    player.ready = ready;
    await saveLobbyPlayers(code, players);
  }
  return players;
}

// ── Heartbeat ──

const HEARTBEAT_TTL = 60;

export async function setHeartbeat(code: string, userId: string): Promise<void> {
  const key = lobbyHeartbeatKey(code, userId);
  await redis.set(key, String(Date.now()));
  await redis.expire(key, HEARTBEAT_TTL);
}

export async function getHeartbeat(code: string, userId: string): Promise<number | null> {
  const raw = await redis.get(lobbyHeartbeatKey(code, userId));
  if (!raw) return null;
  return parseInt(raw, 10);
}

const STALE_THRESHOLD_MS = 30_000;

export async function isPlayerStale(code: string, userId: string): Promise<boolean> {
  const ts = await getHeartbeat(code, userId);
  if (ts === null) return true;
  return Date.now() - ts > STALE_THRESHOLD_MS;
}

// ── Game Move History ──

export async function getGameMoves(code: string): Promise<string | null> {
  return await redis.get(lobbyMovesKey(code));
}

export async function saveGameMoves(code: string, movesJson: string): Promise<void> {
  await setWithTTL(lobbyMovesKey(code), movesJson);
}

export async function getGamePasses(code: string): Promise<string | null> {
  return await redis.get(lobbyPassesKey(code));
}

export async function saveGamePasses(code: string, passesJson: string): Promise<void> {
  await setWithTTL(lobbyPassesKey(code), passesJson);
}
