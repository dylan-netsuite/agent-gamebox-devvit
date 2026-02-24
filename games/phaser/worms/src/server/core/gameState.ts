import { redis } from '@devvit/web/server';
import type { GameState, PlayerStats } from '../../shared/types/game';
import type {
  LobbyPlayer,
  LobbyInfo,
  LobbyStatus,
  MultiplayerGameConfig,
} from '../../shared/types/multiplayer';

const LOBBY_TTL_SECONDS = 7200; // 2 hours

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

function gameKey(postId: string): string {
  return `worms_${sanitizeId(postId)}_state`;
}

function lobbyStateKey(code: string): string {
  return `worms_lobby_${code}_state`;
}

function lobbyPlayersKey(code: string): string {
  return `worms_lobby_${code}_players`;
}

function lobbyConfigKey(code: string): string {
  return `worms_lobby_${code}_config`;
}

function postLobbiesKey(postId: string): string {
  return `worms_${sanitizeId(postId)}_lobbies`;
}

const LOBBY_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += LOBBY_CODE_CHARS[Math.floor(Math.random() * LOBBY_CODE_CHARS.length)];
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

// --- Game State (legacy, kept for backward compat) ---

export async function getGameState(postId: string): Promise<GameState | null> {
  const raw = await redis.get(gameKey(postId));
  if (!raw) return null;
  const state = JSON.parse(raw) as GameState;
  if (!state.mode) state.mode = 'online';
  if (state.hostUserId === undefined) state.hostUserId = null;
  return state;
}

export async function saveGameState(state: GameState): Promise<void> {
  await redis.set(gameKey(state.postId), JSON.stringify(state));
}

export function createInitialState(postId: string): GameState {
  return {
    postId,
    phase: 'lobby',
    mode: 'online',
    hostUserId: null,
    players: [],
    turn: {
      activePlayerIndex: 0,
      activeWormIndex: 0,
      turnNumber: 0,
      timeRemaining: 45,
      wind: 0,
    },
    craters: [],
    terrainSeed: Math.floor(Math.random() * 1_000_000),
    winner: null,
  };
}

// --- Lobby Registry ---

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
    maxPlayers: 4,
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

export async function listOpenLobbies(postId: string): Promise<LobbyInfo[]> {
  const lobbiesKey = postLobbiesKey(postId);
  const raw = await redis.get(lobbiesKey);
  if (!raw) return [];
  const codes = JSON.parse(raw) as string[];

  const results: LobbyInfo[] = [];
  const liveCodes: string[] = [];

  for (const code of codes) {
    const info = await getLobbyInfo(code);
    if (!info) continue;
    liveCodes.push(code);
    if (info.status === 'waiting' && info.playerCount < info.maxPlayers) {
      results.push(info);
    }
  }

  if (liveCodes.length !== codes.length) {
    await redis.set(lobbiesKey, JSON.stringify(liveCodes));
  }

  return results;
}

export async function updateLobbyStatus(code: string, status: LobbyStatus): Promise<void> {
  const info = await getLobbyInfo(code);
  if (info) {
    info.status = status;
    await saveLobbyInfo(info);
    await refreshTTL(code);
  }
}

// --- Game Config Storage (for reconnection) ---

export async function saveLobbyGameConfig(code: string, config: MultiplayerGameConfig): Promise<void> {
  await setWithTTL(lobbyConfigKey(code), JSON.stringify(config));
}

export async function getLobbyGameConfig(code: string): Promise<MultiplayerGameConfig | null> {
  const raw = await redis.get(lobbyConfigKey(code));
  if (!raw) return null;
  return JSON.parse(raw) as MultiplayerGameConfig;
}

// --- Reconnection ---

export async function findUserLobby(
  postId: string,
  userId: string,
): Promise<{ info: LobbyInfo; players: LobbyPlayer[]; config: MultiplayerGameConfig | null } | null> {
  const lobbiesKey = postLobbiesKey(postId);
  const raw = await redis.get(lobbiesKey);
  if (!raw) return null;
  const codes = JSON.parse(raw) as string[];

  for (const code of codes) {
    const info = await getLobbyInfo(code);
    if (!info || info.status === 'finished') continue;

    const players = await getLobbyPlayers(code);
    const inLobby = players.some((p) => p.userId === userId);
    if (inLobby) {
      const config = await getLobbyGameConfig(code);
      return { info, players, config };
    }
  }
  return null;
}

// --- Lobby Players ---

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

  const teamIndex = players.length;
  if (teamIndex >= 4) {
    return { players, isHost: false };
  }

  players.push({
    userId,
    username,
    characterId: 'banana-sam',
    teamIndex,
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
    p.teamIndex = i;
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

export async function setPlayerCharacter(
  code: string,
  userId: string,
  characterId: string,
): Promise<LobbyPlayer[]> {
  const players = await getLobbyPlayers(code);
  const player = players.find((p) => p.userId === userId);
  if (player) {
    player.characterId = characterId;
    await saveLobbyPlayers(code, players);
  }
  return players;
}

// --- Player Stats ---

function statsKey(postId: string, userId: string): string {
  return `worms_${sanitizeId(postId)}_stats_${sanitizeId(userId)}`;
}

function leaderboardKey(postId: string): string {
  return `worms_${sanitizeId(postId)}_leaderboard`;
}

export async function getUserStats(postId: string, userId: string): Promise<PlayerStats | null> {
  const raw = await redis.get(statsKey(postId, userId));
  if (!raw) return null;
  return JSON.parse(raw) as PlayerStats;
}

export async function recordGameResult(
  postId: string,
  players: { userId: string; username: string }[],
  winnerUserId: string | null,
): Promise<void> {
  for (const p of players) {
    const key = statsKey(postId, p.userId);
    const raw = await redis.get(key);
    const stats: PlayerStats = raw
      ? (JSON.parse(raw) as PlayerStats)
      : { userId: p.userId, username: p.username, wins: 0, losses: 0, gamesPlayed: 0 };

    stats.username = p.username;
    stats.gamesPlayed++;
    if (winnerUserId === p.userId) {
      stats.wins++;
    } else if (winnerUserId) {
      stats.losses++;
    }

    await redis.set(key, JSON.stringify(stats));

    const lbKey = leaderboardKey(postId);
    const lbRaw = await redis.get(lbKey);
    const lb: Record<string, PlayerStats> = lbRaw ? (JSON.parse(lbRaw) as Record<string, PlayerStats>) : {};
    lb[p.userId] = stats;
    await redis.set(lbKey, JSON.stringify(lb));
  }
}

export async function getLeaderboard(postId: string): Promise<PlayerStats[]> {
  const key = leaderboardKey(postId);
  const raw = await redis.get(key);
  if (!raw) return [];
  const lb = JSON.parse(raw) as Record<string, PlayerStats>;
  return Object.values(lb).sort((a, b) => b.wins - a.wins || a.losses - b.losses);
}
