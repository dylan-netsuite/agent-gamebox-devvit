import express from 'express';
import { createServer, context, realtime } from '@devvit/web/server';
import { createPost } from './core/post';
import {
  getGameState,
  saveGameState,
  createInitialState,
  createLobby,
  getLobbyInfo,
  saveLobbyInfo,
  findOpenLobby,
  listOpenLobbies,
  getLobbyPlayers,
  addLobbyPlayer,
  removeLobbyPlayer,
  setPlayerReady,
  setPlayerCharacter,
  updateLobbyStatus,
  saveLobbyGameConfig,
  findUserLobby,
  recordGameResult,
  getLeaderboard,
  getUserStats,
} from './core/gameState';
import type { InitResponse, ErrorResponse } from '../shared/types/api';
import type { MultiplayerMessage, MultiplayerGameConfig } from '../shared/types/multiplayer';

function lobbyChannel(code: string): string {
  return `worms_lobby_${code}`;
}

async function broadcast(lobbyCode: string, message: MultiplayerMessage): Promise<void> {
  await realtime.send(lobbyChannel(lobbyCode), JSON.parse(JSON.stringify(message)));
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

const router = express.Router();

// --- Init ---

router.get('/api/init', async (_req, res): Promise<void> => {
  const { postId, userId } = context;
  if (!postId) {
    res.status(400).json({ status: 'error', message: 'Missing postId' } satisfies ErrorResponse);
    return;
  }

  let gameState = await getGameState(postId);
  if (!gameState || gameState.phase === 'finished') {
    gameState = createInitialState(postId);
    if (userId) gameState.hostUserId = userId;
    await saveGameState(gameState);
  }

  const currentPlayer = userId
    ? gameState.players.find((p) => p.userId === userId) ?? null
    : null;

  const response: InitResponse = {
    type: 'init',
    postId,
    gameState,
    currentPlayer,
  };
  res.json(response);
});

router.get('/api/game/state', async (_req, res): Promise<void> => {
  const { postId } = context;
  if (!postId) {
    res.status(400).json({ status: 'error', message: 'Missing postId' } satisfies ErrorResponse);
    return;
  }
  const gameState = await getGameState(postId);
  if (!gameState) {
    res.status(404).json({ status: 'error', message: 'Game not found' } satisfies ErrorResponse);
    return;
  }
  res.json(gameState);
});

// --- Reconnect ---

router.get('/api/reconnect', async (_req, res): Promise<void> => {
  const { postId, userId } = context;
  if (!postId || !userId) {
    res.json({ status: 'ok', lobby: null });
    return;
  }

  const result = await findUserLobby(postId, userId);
  if (!result) {
    res.json({ status: 'ok', lobby: null });
    return;
  }

  res.json({
    status: 'ok',
    lobby: {
      info: result.info,
      players: result.players,
      config: result.config,
    },
  });
});

// --- Lobby CRUD ---

router.post('/api/lobbies/create', async (_req, res): Promise<void> => {
  const { postId, userId, username } = context;
  if (!postId || !userId) {
    res.status(400).json({ status: 'error', message: 'Missing postId or userId' } satisfies ErrorResponse);
    return;
  }

  const info = await createLobby(postId, userId, username ?? `Player ${userId.slice(0, 4)}`);
  const { players, isHost } = await addLobbyPlayer(info.lobbyCode, userId, username ?? `Player ${userId.slice(0, 4)}`);

  res.json({ status: 'ok', lobbyCode: info.lobbyCode, players, isHost });
});

router.post('/api/lobbies/join', async (req, res): Promise<void> => {
  const { userId, username } = context;
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' } satisfies ErrorResponse);
    return;
  }

  const body = req.body as { lobbyCode?: string } | undefined;
  const code = body?.lobbyCode?.toUpperCase();
  if (!code) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode' } satisfies ErrorResponse);
    return;
  }

  const info = await getLobbyInfo(code);
  if (!info) {
    res.status(404).json({ status: 'error', message: 'Lobby not found' } satisfies ErrorResponse);
    return;
  }
  if (info.status !== 'waiting') {
    res.status(400).json({ status: 'error', message: 'Lobby is not accepting players' } satisfies ErrorResponse);
    return;
  }
  if (info.playerCount >= info.maxPlayers) {
    res.status(400).json({ status: 'error', message: 'Lobby is full' } satisfies ErrorResponse);
    return;
  }

  const { players, isHost } = await addLobbyPlayer(code, userId, username ?? `Player ${userId.slice(0, 4)}`);

  await broadcast(code, {
    type: 'lobby-update',
    lobbyCode: code,
    players,
    phase: 'lobby',
    hostUserId: info.hostUserId,
  });

  res.json({ status: 'ok', lobbyCode: code, players, isHost });
});

router.get('/api/lobbies/open', async (_req, res): Promise<void> => {
  const { postId } = context;
  if (!postId) {
    res.status(400).json({ status: 'error', message: 'Missing postId' } satisfies ErrorResponse);
    return;
  }

  const lobby = await findOpenLobby(postId);
  if (!lobby) {
    res.status(404).json({ status: 'error', message: 'No open lobbies' } satisfies ErrorResponse);
    return;
  }

  res.json({ status: 'ok', lobby });
});

router.get('/api/lobbies/list', async (_req, res): Promise<void> => {
  const { postId } = context;
  if (!postId) {
    res.status(400).json({ status: 'error', message: 'Missing postId' } satisfies ErrorResponse);
    return;
  }

  const lobbies = await listOpenLobbies(postId);
  res.json({ status: 'ok', lobbies });
});

// --- In-Lobby Actions (all take lobbyCode in body) ---

router.get('/api/game/lobby', async (req, res): Promise<void> => {
  const code = (req.query.code as string)?.toUpperCase();
  if (!code) {
    res.status(400).json({ status: 'error', message: 'Missing lobby code' } satisfies ErrorResponse);
    return;
  }

  const players = await getLobbyPlayers(code);
  const info = await getLobbyInfo(code);
  res.json({
    players,
    phase: info?.status === 'waiting' ? 'lobby' : (info?.status ?? 'lobby'),
    hostUserId: info?.hostUserId ?? null,
    lobbyCode: code,
  });
});

router.post('/api/game/join', async (req, res): Promise<void> => {
  const { userId, username } = context;
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' } satisfies ErrorResponse);
    return;
  }

  const body = req.body as { lobbyCode?: string } | undefined;
  const code = body?.lobbyCode?.toUpperCase();
  if (!code) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode' } satisfies ErrorResponse);
    return;
  }

  const info = await getLobbyInfo(code);
  if (!info || info.status !== 'waiting') {
    res.status(400).json({ status: 'error', message: 'Lobby not available' } satisfies ErrorResponse);
    return;
  }

  const { players, isHost } = await addLobbyPlayer(code, userId, username ?? `Player ${userId.slice(0, 4)}`);

  await broadcast(code, {
    type: 'lobby-update',
    lobbyCode: code,
    players,
    phase: 'lobby',
    hostUserId: info.hostUserId,
  });

  res.json({ status: 'ok', players, isHost });
});

router.post('/api/game/leave', async (req, res): Promise<void> => {
  const { userId } = context;
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' } satisfies ErrorResponse);
    return;
  }

  const body = req.body as { lobbyCode?: string } | undefined;
  const code = body?.lobbyCode?.toUpperCase();
  if (!code) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode' } satisfies ErrorResponse);
    return;
  }

  const players = await removeLobbyPlayer(code, userId);

  await broadcast(code, { type: 'player-left', userId });

  const info = await getLobbyInfo(code);
  await broadcast(code, {
    type: 'lobby-update',
    lobbyCode: code,
    players,
    phase: info?.status === 'waiting' ? 'lobby' : 'playing',
    hostUserId: info?.hostUserId ?? (players[0]?.userId ?? ''),
  });

  res.json({ status: 'ok' });
});

router.post('/api/game/ready', async (req, res): Promise<void> => {
  const { userId } = context;
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' } satisfies ErrorResponse);
    return;
  }

  const body = req.body as { lobbyCode?: string; ready?: boolean } | undefined;
  const code = body?.lobbyCode?.toUpperCase();
  if (!code) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode' } satisfies ErrorResponse);
    return;
  }

  const ready = body?.ready ?? true;
  const players = await setPlayerReady(code, userId, ready);
  const info = await getLobbyInfo(code);

  await broadcast(code, {
    type: 'lobby-update',
    lobbyCode: code,
    players,
    phase: 'lobby',
    hostUserId: info?.hostUserId ?? '',
  });

  res.json({ status: 'ok', players });
});

router.post('/api/game/select-character', async (req, res): Promise<void> => {
  const { userId } = context;
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' } satisfies ErrorResponse);
    return;
  }

  const body = req.body as { lobbyCode?: string; characterId?: string } | undefined;
  const code = body?.lobbyCode?.toUpperCase();
  if (!code) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode' } satisfies ErrorResponse);
    return;
  }

  const characterId = body?.characterId ?? 'banana-sam';
  const players = await setPlayerCharacter(code, userId, characterId);
  const info = await getLobbyInfo(code);

  await broadcast(code, {
    type: 'lobby-update',
    lobbyCode: code,
    players,
    phase: 'lobby',
    hostUserId: info?.hostUserId ?? '',
  });

  res.json({ status: 'ok', players });
});

router.post('/api/game/start', async (req, res): Promise<void> => {
  const { userId } = context;
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' } satisfies ErrorResponse);
    return;
  }

  const body = req.body as { lobbyCode?: string; mapId?: string; turnTimer?: number; wormsPerTeam?: number } | undefined;
  const code = body?.lobbyCode?.toUpperCase();
  if (!code) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode' } satisfies ErrorResponse);
    return;
  }

  const info = await getLobbyInfo(code);
  if (!info) {
    res.status(404).json({ status: 'error', message: 'Lobby not found' } satisfies ErrorResponse);
    return;
  }
  if (info.hostUserId !== userId) {
    res.status(403).json({ status: 'error', message: 'Only host can start' } satisfies ErrorResponse);
    return;
  }

  const players = await getLobbyPlayers(code);
  if (players.length < 2) {
    res.status(400).json({ status: 'error', message: 'Need at least 2 players' } satisfies ErrorResponse);
    return;
  }

  const allReady = players.every((p) => p.ready || p.userId === info.hostUserId);
  if (!allReady) {
    res.status(400).json({ status: 'error', message: 'Not all players ready' } satisfies ErrorResponse);
    return;
  }

  await updateLobbyStatus(code, 'playing');

  const terrainSeed = Math.floor(Math.random() * 1_000_000);
  const config: MultiplayerGameConfig = {
    numTeams: players.length,
    wormsPerTeam: body?.wormsPerTeam ?? 2,
    mapId: body?.mapId ?? 'hills',
    turnTimer: body?.turnTimer ?? 45,
    terrainSeed,
    players,
  };

  await saveLobbyGameConfig(code, config);
  await broadcast(code, { type: 'game-start', config });
  res.json({ status: 'ok', config });
});

router.post('/api/game/action', async (req, res): Promise<void> => {
  const { userId } = context;
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' } satisfies ErrorResponse);
    return;
  }

  const body = req.body as { lobbyCode?: string; action?: unknown } | undefined;
  const code = body?.lobbyCode?.toUpperCase();
  if (!code || !body?.action) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode or action' } satisfies ErrorResponse);
    return;
  }

  await broadcast(code, {
    type: 'player-action',
    action: body.action as import('../shared/types/multiplayer').PlayerAction,
    playerId: userId,
  });

  res.json({ status: 'ok' });
});

router.post('/api/game/turn-result', async (req, res): Promise<void> => {
  const { userId } = context;
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' } satisfies ErrorResponse);
    return;
  }

  const body = req.body as { lobbyCode?: string; result?: unknown } | undefined;
  const code = body?.lobbyCode?.toUpperCase();
  if (!code || !body?.result) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode or result' } satisfies ErrorResponse);
    return;
  }

  const result = body.result as import('../shared/types/multiplayer').TurnResult;

  await broadcast(code, {
    type: 'turn-result',
    result,
    playerId: userId,
  });

  res.json({ status: 'ok' });
});

router.post('/api/game/end-turn', async (req, res): Promise<void> => {
  const { userId } = context;
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' } satisfies ErrorResponse);
    return;
  }

  const body = req.body as { lobbyCode?: string; turnOrderIndex?: number; wind?: number } | undefined;
  const code = body?.lobbyCode?.toUpperCase();
  if (!code) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode' } satisfies ErrorResponse);
    return;
  }

  await broadcast(code, {
    type: 'turn-advance',
    turnOrderIndex: body?.turnOrderIndex ?? 0,
    wind: body?.wind ?? 0,
  });

  res.json({ status: 'ok' });
});

router.post('/api/game/game-over', async (req, res): Promise<void> => {
  const { userId } = context;
  if (!userId) {
    res.status(400).json({ status: 'error', message: 'Missing userId' } satisfies ErrorResponse);
    return;
  }

  const body = req.body as { lobbyCode?: string; winningTeam?: number } | undefined;
  const code = body?.lobbyCode?.toUpperCase();
  if (!code) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode' } satisfies ErrorResponse);
    return;
  }

  const winningTeam = body?.winningTeam ?? -1;
  await updateLobbyStatus(code, 'finished');

  const players = await getLobbyPlayers(code);
  const winnerPlayer = winningTeam >= 0 ? players[winningTeam] : null;
  const playerInfos = players.map((p) => ({ userId: p.userId, username: p.username }));
  const { postId } = context;
  if (postId) {
    await recordGameResult(postId, playerInfos, winnerPlayer?.userId ?? null);
  }

  await broadcast(code, { type: 'game-over', winningTeam });

  res.json({ status: 'ok' });
});

router.post('/api/game/rematch', async (req, res): Promise<void> => {
  const { postId, userId, username } = context;
  if (!postId || !userId) {
    res.status(400).json({ status: 'error', message: 'Missing postId or userId' } satisfies ErrorResponse);
    return;
  }

  const body = req.body as { lobbyCode?: string } | undefined;
  const oldCode = body?.lobbyCode?.toUpperCase();
  if (!oldCode) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode' } satisfies ErrorResponse);
    return;
  }

  const oldPlayers = await getLobbyPlayers(oldCode);
  if (oldPlayers.length < 2) {
    res.status(400).json({ status: 'error', message: 'Not enough players for rematch' } satisfies ErrorResponse);
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

router.get('/api/stats', async (_req, res): Promise<void> => {
  const { postId, userId } = context;
  if (!postId || !userId) {
    res.json({ status: 'ok', stats: null });
    return;
  }
  const stats = await getUserStats(postId, userId);
  res.json({ status: 'ok', stats });
});

router.get('/api/leaderboard', async (_req, res): Promise<void> => {
  const { postId } = context;
  if (!postId) {
    res.json({ status: 'ok', leaderboard: [] });
    return;
  }
  const leaderboard = await getLeaderboard(postId);
  res.json({ status: 'ok', leaderboard });
});

// --- Internal ---

router.post('/internal/on-app-install', (_req, res): void => {
  res.json({ status: 'success', message: 'Reddit Royale app installed' });
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
