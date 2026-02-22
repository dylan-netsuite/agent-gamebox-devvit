import express from 'express';
import { redis, createServer, context } from '@devvit/web/server';
import { createPost } from './core/post';
import {
  getGameState,
  saveGameState,
  createGame,
  joinGame,
  startGame,
  getActivePlayers,
  checkWinner,
  advanceTurn,
  updateSupplyCenters,
  calculateBuilds,
  setPhase,
} from './core/gameState';
import { resolveOrders, applyResults } from './core/orderResolver';
import {
  fillBots,
  autoSubmitBotOrders,
  autoSubmitBotRetreats,
  autoSubmitBotBuilds,
} from './core/botLogic';
import type {
  InitResponse,
  ErrorResponse,
  JoinGameRequest,
  SubmitOrdersRequest,
  SubmitRetreatsRequest,
  SubmitBuildsRequest,
} from '../shared/types/api';
import type { Order } from '../shared/types/orders';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

const router = express.Router();

// ─── Init ─────────────────────────────────────────
router.get('/api/init', async (_req, res): Promise<void> => {
  const { postId, userId } = context;
  if (!postId) {
    res.status(400).json({ status: 'error', message: 'Missing postId' } satisfies ErrorResponse);
    return;
  }

  let gameState = await getGameState(postId);
  if (!gameState) {
    gameState = await createGame(postId);
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

// ─── Join Game ────────────────────────────────────
router.post('/api/game/join', async (req, res): Promise<void> => {
  const { postId, userId } = context;
  const username = context.username ?? 'Anonymous';

  if (!postId || !userId) {
    res.status(400).json({ status: 'error', message: 'Missing context' } satisfies ErrorResponse);
    return;
  }

  const body = req.body as JoinGameRequest;
  if (!body.country) {
    res.status(400).json({ status: 'error', message: 'Country required' } satisfies ErrorResponse);
    return;
  }

  try {
    const { state, player } = await joinGame(postId, userId, username, body.country);
    res.json({ type: 'join', gameState: state, player });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to join';
    res.status(400).json({ status: 'error', message } satisfies ErrorResponse);
  }
});

// ─── Start Game ───────────────────────────────────
router.post('/api/game/start', async (_req, res): Promise<void> => {
  const { postId } = context;
  if (!postId) {
    res.status(400).json({ status: 'error', message: 'Missing postId' } satisfies ErrorResponse);
    return;
  }

  try {
    const state = await startGame(postId);
    res.json({ type: 'start', gameState: state });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to start';
    res.status(400).json({ status: 'error', message } satisfies ErrorResponse);
  }
});

// ─── Fill Bots ───────────────────────────────────
router.post('/api/game/fill-bots', async (_req, res): Promise<void> => {
  const { postId } = context;
  if (!postId) {
    res.status(400).json({ status: 'error', message: 'Missing postId' } satisfies ErrorResponse);
    return;
  }

  const state = await getGameState(postId);
  if (!state) {
    res.status(404).json({ status: 'error', message: 'Game not found' } satisfies ErrorResponse);
    return;
  }

  if (state.phase !== 'waiting') {
    res.status(400).json({ status: 'error', message: 'Game already started' } satisfies ErrorResponse);
    return;
  }

  fillBots(state);
  await saveGameState(state);
  res.json({ type: 'fill-bots', gameState: state });
});

// ─── Submit Orders ────────────────────────────────
router.post('/api/game/orders', async (req, res): Promise<void> => {
  const { postId, userId } = context;
  if (!postId || !userId) {
    res.status(400).json({ status: 'error', message: 'Missing context' } satisfies ErrorResponse);
    return;
  }

  const state = await getGameState(postId);
  if (!state) {
    res.status(404).json({ status: 'error', message: 'Game not found' } satisfies ErrorResponse);
    return;
  }

  if (state.phase !== 'orders') {
    res.status(400).json({ status: 'error', message: 'Not in order phase' } satisfies ErrorResponse);
    return;
  }

  const player = state.players.find((p) => p.userId === userId);
  if (!player) {
    res.status(403).json({ status: 'error', message: 'Not a player' } satisfies ErrorResponse);
    return;
  }

  if (state.ordersSubmitted.includes(player.country)) {
    res.status(400).json({ status: 'error', message: 'Orders already submitted' } satisfies ErrorResponse);
    return;
  }

  const body = req.body as SubmitOrdersRequest;

  // Store orders in Redis
  const orderKey = `game:${postId}:orders:${state.turn.season}:${state.turn.year}:${player.country}`;
  await redis.set(orderKey, JSON.stringify(body.orders));
  state.ordersSubmitted.push(player.country);
  await saveGameState(state);

  // Auto-submit hold orders for all bots
  await autoSubmitBotOrders(state);

  // Check if all active players have submitted
  const activePlayers = getActivePlayers(state);
  const allSubmitted = activePlayers.every((c) => state.ordersSubmitted.includes(c));

  if (allSubmitted) {
    // Resolve the turn
    const allOrders: Record<string, Order[]> = {};
    for (const country of activePlayers) {
      const key = `game:${postId}:orders:${state.turn.season}:${state.turn.year}:${country}`;
      const raw = await redis.get(key);
      allOrders[country] = raw ? (JSON.parse(raw) as Order[]) : [];
    }

    const { results, dislodged, log } = resolveOrders(state, allOrders);
    applyResults(state, results, dislodged);
    state.turnLog.push(...log);

    if (dislodged.length > 0) {
      state.dislodged = dislodged;
      setPhase(state, 'retreats');
    } else if (state.turn.season === 'Fall') {
      updateSupplyCenters(state);
      const winner = checkWinner(state);
      if (winner) {
        state.winner = winner;
        setPhase(state, 'complete');
      } else {
        const builds = calculateBuilds(state);
        if (builds.some((b) => b.delta !== 0)) {
          state.builds = builds;
          setPhase(state, 'builds');
        } else {
          advanceTurn(state);
          state.ordersSubmitted = [];
          state.turnLog.push(`=== ${state.turn.season} ${state.turn.year} ===`);
          setPhase(state, 'orders');
        }
      }
    } else {
      advanceTurn(state);
      state.ordersSubmitted = [];
      state.turnLog.push(`=== ${state.turn.season} ${state.turn.year} ===`);
      setPhase(state, 'orders');
    }

    await saveGameState(state);
    res.json({
      type: 'orders',
      success: true,
      message: 'Turn resolved',
      gameState: state,
    });
  } else {
    res.json({
      type: 'orders',
      success: true,
      message: `Orders submitted. Waiting for ${activePlayers.length - state.ordersSubmitted.length} more player(s).`,
      gameState: state,
    });
  }
});

// ─── Submit Retreats ──────────────────────────────
router.post('/api/game/retreats', async (req, res): Promise<void> => {
  const { postId, userId } = context;
  if (!postId || !userId) {
    res.status(400).json({ status: 'error', message: 'Missing context' } satisfies ErrorResponse);
    return;
  }

  const state = await getGameState(postId);
  if (!state || state.phase !== 'retreats') {
    res.status(400).json({ status: 'error', message: 'Not in retreat phase' } satisfies ErrorResponse);
    return;
  }

  const player = state.players.find((p) => p.userId === userId);
  if (!player) {
    res.status(403).json({ status: 'error', message: 'Not a player' } satisfies ErrorResponse);
    return;
  }

  const body = req.body as SubmitRetreatsRequest;
  const processedProvinces = new Set<string>();

  for (const retreat of body.retreats) {
    const option = state.dislodged.find(
      (d) => (d.from === retreat.province || d.unit.province === retreat.province) &&
        d.unit.country === player.country
    );
    if (!option) continue;

    if (retreat.type === 'retreat' && retreat.destination) {
      if (option.validDestinations.includes(retreat.destination)) {
        const newUnit: { type: typeof option.unit.type; country: typeof option.unit.country; province: string; coast?: 'NC' | 'SC' | 'EC' } = {
          type: option.unit.type,
          country: option.unit.country,
          province: retreat.destination,
        };
        if (retreat.coast) newUnit.coast = retreat.coast;
        state.units.push(newUnit);
      }
    }
    // Disband: just don't add the unit back
    processedProvinces.add(option.from);
  }

  // Remove only the processed dislodged units (others remain for other players)
  state.dislodged = state.dislodged.filter(
    (d) => !processedProvinces.has(d.from)
  );

  // Auto-disband bot dislodged units
  await autoSubmitBotRetreats(state);

  // If all dislodged units handled, advance phase
  if (state.dislodged.length > 0) {
    await saveGameState(state);
    res.json({ type: 'retreats', success: true, gameState: state });
    return;
  }

  // Advance to next phase
  if (state.turn.season === 'Fall') {
    updateSupplyCenters(state);
    const winner = checkWinner(state);
    if (winner) {
      state.winner = winner;
      setPhase(state, 'complete');
    } else {
      const builds = calculateBuilds(state);
      if (builds.some((b) => b.delta !== 0)) {
        state.builds = builds;
        setPhase(state, 'builds');
      } else {
        advanceTurn(state);
        state.ordersSubmitted = [];
        state.turnLog.push(`=== ${state.turn.season} ${state.turn.year} ===`);
        setPhase(state, 'orders');
      }
    }
  } else {
    advanceTurn(state);
    state.ordersSubmitted = [];
    state.turnLog.push(`=== ${state.turn.season} ${state.turn.year} ===`);
    setPhase(state, 'orders');
  }

  await saveGameState(state);
  res.json({ type: 'retreats', success: true, gameState: state });
});

// ─── Submit Builds ────────────────────────────────
router.post('/api/game/builds', async (req, res): Promise<void> => {
  const { postId, userId } = context;
  if (!postId || !userId) {
    res.status(400).json({ status: 'error', message: 'Missing context' } satisfies ErrorResponse);
    return;
  }

  const state = await getGameState(postId);
  if (!state || state.phase !== 'builds') {
    res.status(400).json({ status: 'error', message: 'Not in build phase' } satisfies ErrorResponse);
    return;
  }

  const player = state.players.find((p) => p.userId === userId);
  if (!player) {
    res.status(403).json({ status: 'error', message: 'Not a player' } satisfies ErrorResponse);
    return;
  }

  const body = req.body as SubmitBuildsRequest;
  for (const build of body.builds) {
    if (build.type === 'build' && build.unitType && build.province) {
      const newUnit: { type: typeof build.unitType; country: typeof player.country; province: string; coast?: 'NC' | 'SC' | 'EC' } = {
        type: build.unitType,
        country: player.country,
        province: build.province,
      };
      if (build.coast) newUnit.coast = build.coast;
      state.units.push(newUnit);
    } else if (build.type === 'disband' && build.province) {
      state.units = state.units.filter(
        (u) => !(u.province === build.province && u.country === player.country)
      );
    }
  }

  // Remove this player's builds from pending
  state.builds = state.builds.filter((b) => b.country !== player.country);

  // Auto-submit bot builds
  await autoSubmitBotBuilds(state);

  if (state.builds.length === 0) {
    advanceTurn(state);
    state.ordersSubmitted = [];
    state.turnLog.push(`=== ${state.turn.season} ${state.turn.year} ===`);
    setPhase(state, 'orders');
  }

  await saveGameState(state);
  res.json({ type: 'builds', success: true, gameState: state });
});

// ─── Get State ────────────────────────────────────
router.get('/api/game/state', async (_req, res): Promise<void> => {
  const { postId } = context;
  if (!postId) {
    res.status(400).json({ status: 'error', message: 'Missing postId' } satisfies ErrorResponse);
    return;
  }

  const state = await getGameState(postId);
  if (!state) {
    res.status(404).json({ status: 'error', message: 'Game not found' } satisfies ErrorResponse);
    return;
  }

  res.json(state);
});

// ─── Chat ─────────────────────────────────────────
router.post('/api/game/chat', async (req, res): Promise<void> => {
  const { postId, userId } = context;
  const username = context.username ?? 'Anonymous';
  if (!postId || !userId) {
    res.status(400).json({ status: 'error', message: 'Missing context' } satisfies ErrorResponse);
    return;
  }

  const body = req.body as { text?: string; action?: string; after?: number; channel?: string; channels?: string[] };

  if (body.action === 'list') {
    const afterTs = body.after ?? 0;
    const channelsToFetch = body.channels ?? ['global'];
    const allMessages: Array<{ from: string; country: string; text: string; timestamp: number; channel: string }> = [];

    for (const ch of channelsToFetch) {
      const chatKey = ch === 'global' ? `game:${postId}:chat` : `game:${postId}:dm:${ch}`;
      const raw = await redis.zRange(chatKey, afterTs, '+inf', { by: 'score' });
      for (const entry of raw) {
        try {
          const parsed = JSON.parse(entry.member) as { from: string; country: string; text: string; timestamp: number };
          allMessages.push({ ...parsed, channel: ch });
        } catch { /* skip malformed */ }
      }
    }

    res.json({ messages: allMessages });
    return;
  }

  const state = await getGameState(postId);
  if (!state) {
    res.status(404).json({ status: 'error', message: 'Game not found' } satisfies ErrorResponse);
    return;
  }

  const player = state.players.find((p) => p.userId === userId);
  const country = player?.country ?? 'SPECTATOR';

  if (!body.text || body.text.length > 200) {
    res.status(400).json({ status: 'error', message: 'Invalid message' } satisfies ErrorResponse);
    return;
  }

  const channel = body.channel ?? 'global';

  if (channel !== 'global') {
    const parts = channel.split(':');
    if (parts.length !== 2 || !parts.includes(country)) {
      res.status(403).json({ status: 'error', message: 'Cannot send to this channel' } satisfies ErrorResponse);
      return;
    }
  }

  const ts = Date.now();
  const chatKey = channel === 'global' ? `game:${postId}:chat` : `game:${postId}:dm:${channel}`;
  const message = JSON.stringify({ from: username, country, text: body.text, timestamp: ts });
  await redis.zAdd(chatKey, { member: message, score: ts });

  const count = await redis.zCard(chatKey);
  if (count > 200) {
    await redis.zRemRangeByRank(chatKey, 0, count - 201);
  }

  res.json({ success: true });
});

// ─── Internal: Post Creation ──────────────────────
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
