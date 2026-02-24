import express from 'express';
import type {
  LeaderboardEntry,
  LeaderboardResponse,
  StatsResponse,
  SubmitResultRequest,
  UserStats,
  CommunityStatsResponse,
} from '../shared/types/api';
import type { MultiplayerMessage, MultiplayerGameConfig } from '../shared/types/multiplayer';
import { redis, createServer, context, realtime } from '@devvit/web/server';
import { createPost } from './core/post';
import {
  createLobby,
  getLobbyInfo,
  findOpenLobby,
  getLobbyPlayers,
  addLobbyPlayer,
  removeLobbyPlayer,
  setPlayerReady,
  updateLobbyStatus,
  saveLobbyGameConfig,
  getLobbyGameConfig,
  setHeartbeat,
  isPlayerStale,
  getGameMoves,
  saveGameMoves,
  setPlayerDisconnected,
  getPlayerDisconnectedAt,
  clearPlayerDisconnected,
  isDisconnectGraceExpired,
  setTurnStart,
  getTurnStart,
} from './core/lobbyState';
import { BoardValidator } from '../shared/logic/BoardValidator';
import type { BlokusMove } from '../shared/types/multiplayer';

function lobbyChannel(code: string): string {
  return `blokus_lobby_${code}`;
}

async function broadcast(lobbyCode: string, message: MultiplayerMessage): Promise<void> {
  await realtime.send(lobbyChannel(lobbyCode), JSON.parse(JSON.stringify(message)));
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

const router = express.Router();

// ── Stats helpers ──

function emptyStats(): UserStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    totalScore: 0,
    bestScore: -999,
    totalPiecesPlaced: 0,
    perfectGames: 0,
  };
}

function statsKey(userId: string): string {
  return `blokus:stats:${userId}`;
}

async function getUserStats(userId: string): Promise<UserStats> {
  try {
    const raw = await redis.get(statsKey(userId));
    if (raw) return JSON.parse(raw) as UserStats;
  } catch {
    // miss
  }
  return emptyStats();
}

async function saveUserStats(userId: string, stats: UserStats): Promise<void> {
  await redis.set(statsKey(userId), JSON.stringify(stats));
}

async function getUsername(userId: string): Promise<string> {
  try {
    const name = await redis.hGet('blokus:lb:names', userId);
    if (name) return name;
  } catch {
    // ignore
  }
  return userId.replace('t2_', 'u/');
}

// ── Stats endpoints ──

router.get('/api/stats', async (_req, res): Promise<void> => {
  try {
    const userId = context.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' } as StatsResponse);
      return;
    }
    const stats = await getUserStats(userId);
    res.json({ success: true, stats } as StatsResponse);
  } catch (error) {
    console.error('Error in GET /api/stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as StatsResponse);
  }
});

router.post('/api/stats/submit', async (req, res): Promise<void> => {
  try {
    const userId = context.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const body = req.body as SubmitResultRequest;
    const stats = await getUserStats(userId);

    stats.gamesPlayed++;
    stats.totalScore += body.playerScore;
    stats.totalPiecesPlaced += body.playerPiecesPlaced;

    if (body.won) stats.gamesWon++;
    if (body.perfect) stats.perfectGames++;
    if (body.playerScore > stats.bestScore) {
      stats.bestScore = body.playerScore;
    }

    await saveUserStats(userId, stats);

    await redis.zAdd('blokus:lb:score', { member: userId, score: stats.bestScore });

    const username = context.username;
    if (username) {
      await redis.hSet('blokus:lb:names', { [userId]: username });
    }

    try {
      await redis.hIncrBy('blokus:community', 'gamesPlayed', 1);
      await redis.hIncrBy('blokus:community', 'totalPiecesPlaced', body.playerPiecesPlaced);
    } catch {
      // non-fatal
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/stats/submit:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/api/leaderboard', async (_req, res): Promise<void> => {
  try {
    const entries: LeaderboardEntry[] = [];
    const topMembers = await redis.zRange('blokus:lb:score', 0, 19, { by: 'rank', reverse: true });

    for (let i = 0; i < topMembers.length; i++) {
      const m = topMembers[i]!;
      const username = await getUsername(m.member);
      const userStats = await getUserStats(m.member);

      entries.push({
        rank: i + 1,
        userId: m.member,
        username,
        bestScore: m.score,
        gamesWon: userStats.gamesWon,
      });
    }

    const response: LeaderboardResponse = { success: true, entries };

    const userId = context.userId;
    if (userId) {
      try {
        const rank = await redis.zRank('blokus:lb:score', userId);
        if (rank !== undefined && rank !== null) {
          const totalMembers = await redis.zCard('blokus:lb:score');
          response.userRank = totalMembers - rank;
        }
      } catch {
        // not on board
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/leaderboard:', error);
    res.status(500).json({ success: false, entries: [], error: 'Internal server error' } as LeaderboardResponse);
  }
});

router.get('/api/community-stats', async (_req, res): Promise<void> => {
  try {
    let gamesPlayed = 0;
    let totalPiecesPlaced = 0;

    try {
      const gp = await redis.hGet('blokus:community', 'gamesPlayed');
      if (gp) gamesPlayed = parseInt(gp, 10);
      const tp = await redis.hGet('blokus:community', 'totalPiecesPlaced');
      if (tp) totalPiecesPlaced = parseInt(tp, 10);
    } catch {
      // miss
    }

    res.json({ success: true, gamesPlayed, totalPiecesPlaced } as CommunityStatsResponse);
  } catch (error) {
    console.error('Error in GET /api/community-stats:', error);
    res.status(500).json({ success: false, gamesPlayed: 0, totalPiecesPlaced: 0, error: 'Internal server error' } as CommunityStatsResponse);
  }
});

// ── Lobby CRUD ──

router.post('/api/lobbies/create', async (_req, res): Promise<void> => {
  const { postId, userId, username } = context;
  if (!postId || !userId) {
    res.status(400).json({ status: 'error', message: 'Missing postId or userId' });
    return;
  }

  const info = await createLobby(postId, userId, username ?? `Player ${userId.slice(0, 4)}`);
  const { players, isHost } = await addLobbyPlayer(info.lobbyCode, userId, username ?? `Player ${userId.slice(0, 4)}`);

  res.json({ status: 'ok', lobbyCode: info.lobbyCode, players, isHost });
});

router.post('/api/lobbies/join', async (req, res): Promise<void> => {
  const { userId, username } = context;
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' });
    return;
  }

  const body = req.body as { lobbyCode?: string } | undefined;
  const code = body?.lobbyCode?.toUpperCase();
  if (!code) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode' });
    return;
  }

  const info = await getLobbyInfo(code);
  if (!info) {
    res.status(404).json({ status: 'error', message: 'Lobby not found' });
    return;
  }

  if (info.status === 'playing') {
    const players = await getLobbyPlayers(code);
    const myPlayer = players.find((p) => p.userId === userId);
    if (myPlayer) {
      res.json({ status: 'ok', lobbyCode: code, players, isHost: false, reconnect: true });
      return;
    }
    res.status(400).json({ status: 'error', message: 'Game already in progress' });
    return;
  }

  if (info.status !== 'waiting') {
    res.status(400).json({ status: 'error', message: 'Lobby is not accepting players' });
    return;
  }
  if (info.playerCount >= info.maxPlayers) {
    res.status(400).json({ status: 'error', message: 'Lobby is full' });
    return;
  }

  const { players, isHost } = await addLobbyPlayer(code, userId, username ?? `Player ${userId.slice(0, 4)}`);

  await broadcast(code, {
    type: 'lobby-update',
    lobbyCode: code,
    players,
    hostUserId: info.hostUserId,
  });

  res.json({ status: 'ok', lobbyCode: code, players, isHost });
});

router.get('/api/lobbies/open', async (_req, res): Promise<void> => {
  const { postId } = context;
  if (!postId) {
    res.status(400).json({ status: 'error', message: 'Missing postId' });
    return;
  }

  const lobby = await findOpenLobby(postId);
  if (!lobby) {
    res.status(404).json({ status: 'error', message: 'No open lobbies' });
    return;
  }

  res.json({ status: 'ok', lobby });
});

// ── In-Lobby Actions ──

router.post('/api/game/join', async (req, res): Promise<void> => {
  const { userId, username } = context;
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' });
    return;
  }

  const body = req.body as { lobbyCode?: string } | undefined;
  const code = body?.lobbyCode?.toUpperCase();
  if (!code) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode' });
    return;
  }

  const info = await getLobbyInfo(code);
  if (!info || info.status !== 'waiting') {
    res.status(400).json({ status: 'error', message: 'Lobby not available' });
    return;
  }

  const { players, isHost } = await addLobbyPlayer(code, userId, username ?? `Player ${userId.slice(0, 4)}`);

  await broadcast(code, {
    type: 'lobby-update',
    lobbyCode: code,
    players,
    hostUserId: info.hostUserId,
  });

  res.json({ status: 'ok', players, isHost });
});

router.post('/api/game/leave', async (req, res): Promise<void> => {
  const { userId } = context;
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' });
    return;
  }

  const body = req.body as { lobbyCode?: string } | undefined;
  const code = body?.lobbyCode?.toUpperCase();
  if (!code) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode' });
    return;
  }

  const players = await removeLobbyPlayer(code, userId);

  await broadcast(code, { type: 'player-left', userId });

  const info = await getLobbyInfo(code);
  if (info?.status === 'playing') {
    await updateLobbyStatus(code, 'finished');
    boardCache.delete(code);
  }

  await broadcast(code, {
    type: 'lobby-update',
    lobbyCode: code,
    players,
    hostUserId: info?.hostUserId ?? (players[0]?.userId ?? ''),
  });

  res.json({ status: 'ok' });
});

router.post('/api/game/ready', async (req, res): Promise<void> => {
  const { userId } = context;
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' });
    return;
  }

  const body = req.body as { lobbyCode?: string; ready?: boolean } | undefined;
  const code = body?.lobbyCode?.toUpperCase();
  if (!code) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode' });
    return;
  }

  const ready = body?.ready ?? true;
  const players = await setPlayerReady(code, userId, ready);
  const info = await getLobbyInfo(code);

  await broadcast(code, {
    type: 'lobby-update',
    lobbyCode: code,
    players,
    hostUserId: info?.hostUserId ?? '',
  });

  res.json({ status: 'ok', players });
});

router.post('/api/game/start', async (req, res): Promise<void> => {
  const { userId } = context;
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' });
    return;
  }

  const body = req.body as { lobbyCode?: string } | undefined;
  const code = body?.lobbyCode?.toUpperCase();
  if (!code) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode' });
    return;
  }

  const info = await getLobbyInfo(code);
  if (!info) {
    res.status(404).json({ status: 'error', message: 'Lobby not found' });
    return;
  }
  if (info.hostUserId !== userId) {
    res.status(403).json({ status: 'error', message: 'Only host can start' });
    return;
  }

  let players = await getLobbyPlayers(code);
  if (players.length < 2) {
    res.status(400).json({ status: 'error', message: 'Need 2 players' });
    return;
  }

  const hostPlayer = players.find((p) => p.userId === info.hostUserId);
  if (hostPlayer && !hostPlayer.ready) {
    players = await setPlayerReady(code, info.hostUserId, true);
  }

  const allReady = players.every((p) => p.ready);
  if (!allReady) {
    res.status(400).json({ status: 'error', message: 'Not all players ready' });
    return;
  }

  await updateLobbyStatus(code, 'playing');

  const TURN_TIMER_SECONDS = 90;

  const config: MultiplayerGameConfig = {
    lobbyCode: code,
    players,
    turnTimerSeconds: TURN_TIMER_SECONDS,
  };

  await saveLobbyGameConfig(code, config);

  boardCache.delete(code);
  await saveGameMoves(code, JSON.stringify([]));

  for (const p of players) {
    await setHeartbeat(code, p.userId);
  }
  await setTurnStart(code);

  await broadcast(code, { type: 'game-start', config });
  res.json({ status: 'ok', config });
});

// ── Server Board State Cache ──

const boardCache = new Map<string, BoardValidator>();

async function getOrCreateBoard(code: string): Promise<BoardValidator> {
  const cached = boardCache.get(code);
  if (cached) return cached;

  const movesJson = await getGameMoves(code);
  const board = movesJson ? BoardValidator.deserialize(movesJson) : new BoardValidator();
  boardCache.set(code, board);
  return board;
}

async function persistBoard(code: string, board: BoardValidator): Promise<void> {
  await saveGameMoves(code, board.serialize());
}

// ── Game Actions (server-validated) ──

router.post('/api/game/move', async (req, res): Promise<void> => {
  const { userId } = context;
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' });
    return;
  }

  const body = req.body as { lobbyCode?: string; move?: unknown } | undefined;
  const code = body?.lobbyCode?.toUpperCase();
  if (!code || !body?.move) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode or move' });
    return;
  }

  const move = body.move as BlokusMove;

  const board = await getOrCreateBoard(code);
  const validation = board.validateMove(move);

  if (!validation.valid) {
    console.warn(`[MoveValidation] Rejected move from ${userId}: ${validation.reason}`);
    await broadcast(code, { type: 'move-rejected', reason: validation.reason!, userId });
    res.status(400).json({ status: 'error', message: validation.reason });
    return;
  }

  board.applyMove(move);
  await persistBoard(code, board);
  await setTurnStart(code);

  await broadcast(code, { type: 'player-move', move, userId });
  res.json({ status: 'ok' });
});

router.post('/api/game/pass', async (req, res): Promise<void> => {
  const { userId } = context;
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' });
    return;
  }

  const body = req.body as { lobbyCode?: string; player?: number } | undefined;
  const code = body?.lobbyCode?.toUpperCase();
  if (!code) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode' });
    return;
  }

  const player = (body?.player ?? 1) as 1 | 2;
  const board = await getOrCreateBoard(code);
  const validation = board.applyPass(player);

  if (!validation.valid) {
    console.warn(`[MoveValidation] Rejected pass from ${userId}: ${validation.reason}`);
    res.status(400).json({ status: 'error', message: validation.reason });
    return;
  }

  await persistBoard(code, board);
  await setTurnStart(code);

  await broadcast(code, { type: 'player-pass', player, userId });
  res.json({ status: 'ok' });
});

// ── Heartbeat ──

router.post('/api/game/heartbeat', async (req, res): Promise<void> => {
  const { userId } = context;
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' });
    return;
  }

  const body = req.body as { lobbyCode?: string } | undefined;
  const code = body?.lobbyCode?.toUpperCase();
  if (!code) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode' });
    return;
  }

  await setHeartbeat(code, userId);

  const wasDisconnected = await getPlayerDisconnectedAt(code, userId);
  if (wasDisconnected) {
    await clearPlayerDisconnected(code, userId);
    console.log(`[Heartbeat] Player ${userId} reconnected in lobby ${code}`);
    await broadcast(code, { type: 'player-reconnected', userId });
  }

  const info = await getLobbyInfo(code);
  if (info && info.status === 'playing') {
    const players = await getLobbyPlayers(code);
    const opponent = players.find((p) => p.userId !== userId);

    if (opponent) {
      const stale = await isPlayerStale(code, opponent.userId);
      if (stale) {
        const alreadyDc = await getPlayerDisconnectedAt(code, opponent.userId);
        if (!alreadyDc) {
          await setPlayerDisconnected(code, opponent.userId);
          console.log(`[Heartbeat] Player ${opponent.userId} stale in ${code}, starting grace period`);
          await broadcast(code, { type: 'player-disconnected', userId: opponent.userId });
        } else {
          const expired = await isDisconnectGraceExpired(code, opponent.userId);
          if (expired) {
            console.log(`[Heartbeat] Grace expired for ${opponent.userId} in ${code}, forfeiting`);
            await broadcast(code, { type: 'player-left', userId: opponent.userId });
            await updateLobbyStatus(code, 'finished');
            boardCache.delete(code);
          }
        }
      }
    }

    const gameConfig = await getLobbyGameConfig(code);
    const turnTimerMs = (gameConfig?.turnTimerSeconds ?? 90) * 1000;
    const turnStart = await getTurnStart(code);
    if (turnStart && Date.now() - turnStart > turnTimerMs) {
      const board = await getOrCreateBoard(code);
      const currentTurnPlayer = board.turn;
      console.log(`[TurnTimer] Turn timeout for player ${currentTurnPlayer} in ${code}`);
      board.applyPass(currentTurnPlayer);
      await persistBoard(code, board);
      await setTurnStart(code);
      await broadcast(code, { type: 'turn-timeout', player: currentTurnPlayer });
      await broadcast(code, { type: 'player-pass', player: currentTurnPlayer, userId: '' });
    }
  }

  res.json({ status: 'ok' });
});

// ── Reconnect ──

router.post('/api/game/reconnect', async (req, res): Promise<void> => {
  const { userId } = context;
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' });
    return;
  }

  const body = req.body as { lobbyCode?: string } | undefined;
  const code = body?.lobbyCode?.toUpperCase();
  if (!code) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode' });
    return;
  }

  const info = await getLobbyInfo(code);
  if (!info || info.status !== 'playing') {
    res.status(400).json({ status: 'error', message: 'Game not in progress' });
    return;
  }

  const players = await getLobbyPlayers(code);
  const myPlayer = players.find((p) => p.userId === userId);
  if (!myPlayer) {
    res.status(403).json({ status: 'error', message: 'Not a player in this game' });
    return;
  }

  const config = await getLobbyGameConfig(code);
  const movesJson = await getGameMoves(code);

  await setHeartbeat(code, userId);
  await clearPlayerDisconnected(code, userId);
  await broadcast(code, { type: 'player-reconnected', userId });

  res.json({
    status: 'ok',
    config,
    movesJson: movesJson ?? '[]',
    playerNumber: myPlayer.playerNumber,
    opponentName: players.find((p) => p.userId !== userId)?.username ?? 'Opponent',
  });
});

router.post('/api/game/game-over', async (req, res): Promise<void> => {
  const { userId } = context;
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' });
    return;
  }

  const body = req.body as {
    lobbyCode?: string;
    winnerPlayer?: number | null;
    p1Score?: number;
    p2Score?: number;
  } | undefined;
  const code = body?.lobbyCode?.toUpperCase();
  if (!code) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode' });
    return;
  }

  await updateLobbyStatus(code, 'finished');
  boardCache.delete(code);

  await broadcast(code, {
    type: 'game-over',
    winnerPlayer: (body?.winnerPlayer ?? null) as 1 | 2 | null,
    p1Score: body?.p1Score ?? 0,
    p2Score: body?.p2Score ?? 0,
  });

  res.json({ status: 'ok' });
});

router.post('/api/game/rematch', async (req, res): Promise<void> => {
  const { postId, userId, username } = context;
  if (!postId || !userId) {
    res.status(400).json({ status: 'error', message: 'Missing postId or userId' });
    return;
  }

  const body = req.body as { lobbyCode?: string } | undefined;
  const oldCode = body?.lobbyCode?.toUpperCase();
  if (!oldCode) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode' });
    return;
  }

  const oldPlayers = await getLobbyPlayers(oldCode);
  if (oldPlayers.length < 2) {
    res.status(400).json({ status: 'error', message: 'Not enough players for rematch' });
    return;
  }

  const info = await createLobby(postId, userId, username ?? 'Player');
  const newCode = info.lobbyCode;

  for (const p of oldPlayers) {
    await addLobbyPlayer(newCode, p.userId, p.username);
  }

  await broadcast(oldCode, { type: 'rematch', lobbyCode: newCode });

  res.json({ status: 'ok', lobbyCode: newCode });
});

// ── Internal ──

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();
    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({ status: 'error', message: 'Failed to create post' });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();
    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({ status: 'error', message: 'Failed to create post' });
  }
});

app.use(router);

const port = process.env.WEBBIT_PORT || 3000;

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
