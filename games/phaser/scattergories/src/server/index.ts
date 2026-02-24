import express from 'express';
import { createServer, context, realtime } from '@devvit/web/server';
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
  saveRoundConfig,
  getRoundConfig,
  getUsedTracker,
  saveUsedTracker,
  savePlayerAnswers,
  getPlayerAnswers,
  getScores,
  saveScores,
  findUserLobby,
  recordGameResult,
  getLeaderboard,
  getUserStats,
} from './core/gameState';
import { pickRoundConfig } from './core/categories';
import { scoreRound } from './core/scoring';
import type { InitResponse, ErrorResponse } from '../shared/types/api';
import type { ScatterMessage, RoundConfig } from '../shared/types/multiplayer';
import type { PlayerScore } from '../shared/types/game';
import { TOTAL_ROUNDS } from '../shared/types/categories';

function lobbyChannel(code: string): string {
  return `scatter_lobby_${code}`;
}

async function broadcast(lobbyCode: string, message: ScatterMessage): Promise<void> {
  await realtime.send(lobbyChannel(lobbyCode), JSON.parse(JSON.stringify(message)));
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

const router = express.Router();

// --- Init ---

router.get('/api/init', async (_req, res): Promise<void> => {
  const { postId } = context;
  if (!postId) {
    res.status(400).json({ status: 'error', message: 'Missing postId' } satisfies ErrorResponse);
    return;
  }
  const response: InitResponse = { type: 'init', postId };
  res.json(response);
});

// --- Reconnect ---

router.get('/api/reconnect', async (_req, res): Promise<void> => {
  const { postId, userId } = context;
  if (!postId || !userId) {
    res.json({ status: 'ok', lobby: null });
    return;
  }
  const lobby = await findUserLobby(postId, userId);
  res.json({ status: 'ok', lobby });
});

// --- Lobby CRUD ---

router.post('/api/lobbies/create', async (_req, res): Promise<void> => {
  const { postId, userId, username } = context;
  if (!postId || !userId) {
    res.status(400).json({ status: 'error', message: 'Missing context' } satisfies ErrorResponse);
    return;
  }
  const info = await createLobby(postId, userId, username ?? 'Player');
  const { players, isHost } = await addLobbyPlayer(info.lobbyCode, userId, username ?? 'Player');
  res.json({ status: 'ok', lobbyCode: info.lobbyCode, players, isHost });
});

router.post('/api/lobbies/join', async (req, res): Promise<void> => {
  const { userId, username } = context;
  const { lobbyCode } = req.body as { lobbyCode: string };
  if (!userId || !lobbyCode) {
    res.status(400).json({ status: 'error', message: 'Missing userId or lobbyCode' } satisfies ErrorResponse);
    return;
  }
  const info = await getLobbyInfo(lobbyCode);
  if (!info) {
    res.status(404).json({ status: 'error', message: 'Lobby not found' } satisfies ErrorResponse);
    return;
  }
  if (info.status !== 'waiting') {
    res.status(400).json({ status: 'error', message: 'Game already in progress' } satisfies ErrorResponse);
    return;
  }
  if (info.playerCount >= info.maxPlayers) {
    res.status(400).json({ status: 'error', message: 'Lobby is full' } satisfies ErrorResponse);
    return;
  }
  const { players, isHost } = await addLobbyPlayer(lobbyCode, userId, username ?? 'Player');
  await broadcast(lobbyCode, {
    type: 'lobby-update',
    lobbyCode,
    players,
    phase: 'lobby',
    hostUserId: info.hostUserId,
  });
  res.json({ status: 'ok', lobbyCode, players, isHost });
});

router.get('/api/lobbies/open', async (_req, res): Promise<void> => {
  const { postId } = context;
  if (!postId) {
    res.status(400).json({ status: 'error', message: 'Missing postId' } satisfies ErrorResponse);
    return;
  }
  const lobby = await findOpenLobby(postId);
  res.json({ status: 'ok', lobby });
});

// --- In-Lobby ---

router.get('/api/game/lobby', async (req, res): Promise<void> => {
  const code = req.query['code'] as string;
  if (!code) {
    res.status(400).json({ status: 'error', message: 'Missing code' } satisfies ErrorResponse);
    return;
  }
  const info = await getLobbyInfo(code);
  const players = await getLobbyPlayers(code);
  res.json({ status: 'ok', info, players });
});

router.post('/api/game/join', async (req, res): Promise<void> => {
  const { userId, username } = context;
  const { lobbyCode } = req.body as { lobbyCode: string };
  if (!userId || !lobbyCode) {
    res.status(400).json({ status: 'error', message: 'Missing data' } satisfies ErrorResponse);
    return;
  }
  const { players, isHost } = await addLobbyPlayer(lobbyCode, userId, username ?? 'Player');
  const info = await getLobbyInfo(lobbyCode);
  if (info) {
    await broadcast(lobbyCode, {
      type: 'lobby-update',
      lobbyCode,
      players,
      phase: 'lobby',
      hostUserId: info.hostUserId,
    });
  }
  res.json({ status: 'ok', players, isHost });
});

router.post('/api/game/leave', async (req, res): Promise<void> => {
  const { userId } = context;
  const { lobbyCode } = req.body as { lobbyCode: string };
  if (!userId || !lobbyCode) {
    res.status(400).json({ status: 'error', message: 'Missing data' } satisfies ErrorResponse);
    return;
  }
  const players = await removeLobbyPlayer(lobbyCode, userId);
  const info = await getLobbyInfo(lobbyCode);
  if (info) {
    await broadcast(lobbyCode, {
      type: 'lobby-update',
      lobbyCode,
      players,
      phase: 'lobby',
      hostUserId: info.hostUserId,
    });
  }
  await broadcast(lobbyCode, { type: 'player-left', userId });
  res.json({ status: 'ok', players });
});

router.post('/api/game/ready', async (req, res): Promise<void> => {
  const { userId } = context;
  const { lobbyCode, ready } = req.body as { lobbyCode: string; ready: boolean };
  if (!userId || !lobbyCode) {
    res.status(400).json({ status: 'error', message: 'Missing data' } satisfies ErrorResponse);
    return;
  }
  const players = await setPlayerReady(lobbyCode, userId, ready);
  const info = await getLobbyInfo(lobbyCode);
  if (info) {
    await broadcast(lobbyCode, {
      type: 'lobby-update',
      lobbyCode,
      players,
      phase: 'lobby',
      hostUserId: info.hostUserId,
    });
  }
  res.json({ status: 'ok', players });
});

// --- Game Start ---

router.post('/api/game/start', async (req, res): Promise<void> => {
  const { userId } = context;
  const { lobbyCode } = req.body as { lobbyCode: string };
  if (!userId || !lobbyCode) {
    res.status(400).json({ status: 'error', message: 'Missing data' } satisfies ErrorResponse);
    return;
  }

  const info = await getLobbyInfo(lobbyCode);
  if (!info || info.hostUserId !== userId) {
    res.status(403).json({ status: 'error', message: 'Only host can start' } satisfies ErrorResponse);
    return;
  }

  const players = await getLobbyPlayers(lobbyCode);
  if (players.length < 2) {
    res.status(400).json({ status: 'error', message: 'Need at least 2 players' } satisfies ErrorResponse);
    return;
  }

  await updateLobbyStatus(lobbyCode, 'playing');

  const used = await getUsedTracker(lobbyCode);
  const roundConfig = pickRoundConfig(1, used.listIds, used.letters);
  used.listIds.push(roundConfig.categoryListId);
  used.letters.push(roundConfig.letter);
  await saveUsedTracker(lobbyCode, used);
  await saveRoundConfig(lobbyCode, roundConfig);

  const scores: Record<string, number> = {};
  for (const p of players) {
    scores[p.userId] = 0;
  }
  await saveScores(lobbyCode, scores);

  await broadcast(lobbyCode, { type: 'game-start', round: roundConfig });
  res.json({ status: 'ok', round: roundConfig });
});

// --- Submit Answers ---

router.post('/api/game/submit-answers', async (req, res): Promise<void> => {
  const { userId } = context;
  const { lobbyCode, answers } = req.body as { lobbyCode: string; answers: string[] };
  if (!userId || !lobbyCode || !answers) {
    res.status(400).json({ status: 'error', message: 'Missing data' } satisfies ErrorResponse);
    return;
  }

  const roundConfig = await getRoundConfig(lobbyCode);
  if (!roundConfig) {
    res.status(400).json({ status: 'error', message: 'No active round' } satisfies ErrorResponse);
    return;
  }

  await savePlayerAnswers(lobbyCode, roundConfig.roundNumber, userId, answers);

  const players = await getLobbyPlayers(lobbyCode);
  const submitter = players.find((p) => p.userId === userId);
  if (submitter) {
    await broadcast(lobbyCode, {
      type: 'player-submitted',
      userId,
      username: submitter.username,
    });
  }

  let allSubmitted = true;
  for (const p of players) {
    const pa = await getPlayerAnswers(lobbyCode, roundConfig.roundNumber, p.userId);
    if (!pa) {
      allSubmitted = false;
      break;
    }
  }

  if (allSubmitted) {
    await finalizeRound(lobbyCode, roundConfig, players.map((p) => ({ userId: p.userId, username: p.username })));
  }

  res.json({ status: 'ok', allSubmitted });
});

// --- Finalize Round (called when timer expires or all submit) ---

router.post('/api/game/finalize-round', async (req, res): Promise<void> => {
  const { userId } = context;
  const { lobbyCode } = req.body as { lobbyCode: string };
  if (!lobbyCode || !userId) {
    res.status(400).json({ status: 'error', message: 'Missing lobbyCode or userId' } satisfies ErrorResponse);
    return;
  }

  const players = await getLobbyPlayers(lobbyCode);
  if (!players.some((p) => p.userId === userId)) {
    res.status(403).json({ status: 'error', message: 'Not a member of this lobby' } satisfies ErrorResponse);
    return;
  }

  const roundConfig = await getRoundConfig(lobbyCode);
  if (!roundConfig) {
    res.status(400).json({ status: 'error', message: 'No active round' } satisfies ErrorResponse);
    return;
  }

  await finalizeRound(lobbyCode, roundConfig, players.map((p) => ({ userId: p.userId, username: p.username })));
  res.json({ status: 'ok' });
});

async function finalizeRound(
  lobbyCode: string,
  roundConfig: RoundConfig,
  players: { userId: string; username: string }[],
): Promise<void> {
  const submissions = [];
  for (const p of players) {
    const answers = (await getPlayerAnswers(lobbyCode, roundConfig.roundNumber, p.userId)) ?? new Array(12).fill('') as string[];
    submissions.push({ userId: p.userId, username: p.username, answers });
  }

  const totalScores = new Map<string, number>();
  const existingScores = await getScores(lobbyCode);
  for (const [uid, score] of Object.entries(existingScores)) {
    totalScores.set(uid, score);
  }

  const result = scoreRound(
    roundConfig.roundNumber,
    roundConfig.letter,
    roundConfig.categoryListId,
    roundConfig.categories,
    submissions,
    totalScores,
  );

  const updatedScores: Record<string, number> = {};
  for (const [uid, score] of totalScores) {
    updatedScores[uid] = score;
  }
  await saveScores(lobbyCode, updatedScores);

  const playerScores: PlayerScore[] = result.playerResults.map((pr) => ({
    userId: pr.userId,
    username: pr.username,
    totalScore: pr.totalScore,
    roundScores: [pr.roundScore],
  }));

  if (roundConfig.roundNumber >= TOTAL_ROUNDS) {
    const info = await getLobbyInfo(lobbyCode);
    const sorted = [...playerScores].sort((a, b) => b.totalScore - a.totalScore);
    const winner = sorted[0]!;

    await broadcast(lobbyCode, { type: 'round-results', results: result, scores: playerScores });
    await broadcast(lobbyCode, {
      type: 'game-over',
      scores: playerScores,
      winnerId: winner.userId,
      winnerName: winner.username,
    });

    await updateLobbyStatus(lobbyCode, 'finished');

    if (info) {
      await recordGameResult(
        info.postId,
        players.map((p) => ({
          userId: p.userId,
          username: p.username,
          score: totalScores.get(p.userId) ?? 0,
        })),
        winner.userId,
      );
    }
  } else {
    await broadcast(lobbyCode, { type: 'round-results', results: result, scores: playerScores });

    const used = await getUsedTracker(lobbyCode);
    const nextRound = pickRoundConfig(roundConfig.roundNumber + 1, used.listIds, used.letters);
    used.listIds.push(nextRound.categoryListId);
    used.letters.push(nextRound.letter);
    await saveUsedTracker(lobbyCode, used);
    await saveRoundConfig(lobbyCode, nextRound);

    setTimeout(() => {
      void broadcast(lobbyCode, { type: 'round-start', round: nextRound });
    }, 5000);
  }
}

// --- Rematch ---

router.post('/api/game/rematch', async (req, res): Promise<void> => {
  const { userId, username } = context;
  const { lobbyCode: _oldCode } = req.body as { lobbyCode: string };
  const { postId } = context;
  if (!userId || !postId) {
    res.status(400).json({ status: 'error', message: 'Missing data' } satisfies ErrorResponse);
    return;
  }

  const info = await createLobby(postId, userId, username ?? 'Player');
  const { players } = await addLobbyPlayer(info.lobbyCode, userId, username ?? 'Player');

  if (_oldCode) {
    await broadcast(_oldCode, { type: 'rematch', lobbyCode: info.lobbyCode });
  }

  res.json({ status: 'ok', lobbyCode: info.lobbyCode, players });
});

// --- Stats & Leaderboard ---

router.get('/api/stats', async (_req, res): Promise<void> => {
  const { postId, userId } = context;
  if (!postId || !userId) {
    res.status(400).json({ status: 'error', message: 'Missing context' } satisfies ErrorResponse);
    return;
  }
  const stats = await getUserStats(postId, userId);
  res.json({ status: 'ok', stats });
});

router.get('/api/leaderboard', async (_req, res): Promise<void> => {
  const { postId } = context;
  if (!postId) {
    res.status(400).json({ status: 'error', message: 'Missing postId' } satisfies ErrorResponse);
    return;
  }
  const leaderboard = await getLeaderboard(postId);
  res.json({ status: 'ok', leaderboard });
});

// --- Post Creation ---

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
