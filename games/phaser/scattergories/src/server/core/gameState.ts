import { redis } from '@devvit/web/server';
import type { PlayerStats } from '../../shared/types/game';
import type { LobbyInfo, LobbyPlayer, LobbyStatus, RoundConfig } from '../../shared/types/multiplayer';

const LOBBY_TTL_SECONDS = 7200;

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

function lobbyStateKey(code: string): string {
  return `scatter_lobby_${code}_state`;
}

function lobbyPlayersKey(code: string): string {
  return `scatter_lobby_${code}_players`;
}

function lobbyRoundKey(code: string): string {
  return `scatter_lobby_${code}_round`;
}

function lobbyAnswersKey(code: string, round: number, userId: string): string {
  return `scatter_lobby_${code}_answers_${round}_${sanitizeId(userId)}`;
}

function lobbyScoresKey(code: string): string {
  return `scatter_lobby_${code}_scores`;
}

function lobbyUsedKey(code: string): string {
  return `scatter_lobby_${code}_used`;
}

function postLobbiesKey(postId: string): string {
  return `scatter_${sanitizeId(postId)}_lobbies`;
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
  await redis.expire(lobbyRoundKey(code), LOBBY_TTL_SECONDS);
  await redis.expire(lobbyScoresKey(code), LOBBY_TTL_SECONDS);
  await redis.expire(lobbyUsedKey(code), LOBBY_TTL_SECONDS);
}

// --- Lobby CRUD ---

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
    maxPlayers: 6,
    status: 'waiting',
    createdAt: Date.now(),
  };

  await setWithTTL(lobbyStateKey(code), JSON.stringify(info));
  await setWithTTL(lobbyPlayersKey(code), JSON.stringify([]));
  await setWithTTL(lobbyScoresKey(code), JSON.stringify({}));
  await setWithTTL(lobbyUsedKey(code), JSON.stringify({ listIds: [], letters: [] }));

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

export async function listOpenLobbies(postId: string): Promise<(LobbyInfo & { players: LobbyPlayer[] })[]> {
  const lobbiesKey = postLobbiesKey(postId);
  const raw = await redis.get(lobbiesKey);
  if (!raw) return [];
  const codes = JSON.parse(raw) as string[];

  const results: (LobbyInfo & { players: LobbyPlayer[] })[] = [];
  const liveCodes: string[] = [];

  for (const code of codes) {
    const info = await getLobbyInfo(code);
    if (!info) continue;
    liveCodes.push(code);
    if (info.status === 'waiting') {
      const players = await getLobbyPlayers(code);
      results.push({ ...info, players });
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

  if (players.length >= 6) {
    return { players, isHost: false };
  }

  players.push({ userId, username, ready: false });
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

// --- Round State ---

export async function saveRoundConfig(code: string, config: RoundConfig): Promise<void> {
  await setWithTTL(lobbyRoundKey(code), JSON.stringify(config));
}

export async function getRoundConfig(code: string): Promise<RoundConfig | null> {
  const raw = await redis.get(lobbyRoundKey(code));
  if (!raw) return null;
  return JSON.parse(raw) as RoundConfig;
}

// --- Used Lists/Letters Tracking ---

interface UsedTracker {
  listIds: number[];
  letters: string[];
}

export async function getUsedTracker(code: string): Promise<UsedTracker> {
  const raw = await redis.get(lobbyUsedKey(code));
  if (!raw) return { listIds: [], letters: [] };
  return JSON.parse(raw) as UsedTracker;
}

export async function saveUsedTracker(code: string, tracker: UsedTracker): Promise<void> {
  await setWithTTL(lobbyUsedKey(code), JSON.stringify(tracker));
}

// --- Answer Storage ---

export async function savePlayerAnswers(
  code: string,
  round: number,
  userId: string,
  answers: string[],
): Promise<void> {
  await setWithTTL(lobbyAnswersKey(code, round, userId), JSON.stringify(answers));
}

export async function getPlayerAnswers(
  code: string,
  round: number,
  userId: string,
): Promise<string[] | null> {
  const raw = await redis.get(lobbyAnswersKey(code, round, userId));
  if (!raw) return null;
  return JSON.parse(raw) as string[];
}

// --- Score Tracking ---

export async function getScores(code: string): Promise<Record<string, number>> {
  const raw = await redis.get(lobbyScoresKey(code));
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, number>;
}

export async function saveScores(code: string, scores: Record<string, number>): Promise<void> {
  await setWithTTL(lobbyScoresKey(code), JSON.stringify(scores));
}

// --- Reconnection ---

export async function findUserLobby(
  postId: string,
  userId: string,
): Promise<{ info: LobbyInfo; players: LobbyPlayer[] } | null> {
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
      return { info, players };
    }
  }
  return null;
}

// --- Player Stats ---

function statsKey(postId: string, userId: string): string {
  return `scatter_${sanitizeId(postId)}_stats_${sanitizeId(userId)}`;
}

function leaderboardKey(postId: string): string {
  return `scatter_${sanitizeId(postId)}_leaderboard`;
}

export async function getUserStats(postId: string, userId: string): Promise<PlayerStats | null> {
  const raw = await redis.get(statsKey(postId, userId));
  if (!raw) return null;
  return JSON.parse(raw) as PlayerStats;
}

export async function recordGameResult(
  postId: string,
  players: { userId: string; username: string; score: number }[],
  winnerUserId: string | null,
): Promise<void> {
  for (const p of players) {
    const key = statsKey(postId, p.userId);
    const raw = await redis.get(key);
    const stats: PlayerStats = raw
      ? (JSON.parse(raw) as PlayerStats)
      : { userId: p.userId, username: p.username, wins: 0, losses: 0, gamesPlayed: 0, totalScore: 0 };

    stats.username = p.username;
    stats.gamesPlayed++;
    stats.totalScore += p.score;
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
  return Object.values(lb).sort((a, b) => b.wins - a.wins || b.totalScore - a.totalScore);
}
