import express from 'express';
import { createServer, context } from '@devvit/web/server';
import { createPost } from './core/post';
import { getGameState, saveGameState, createInitialState } from './core/gameState';
import type { InitResponse, ErrorResponse } from '../shared/types/api';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

const router = express.Router();

router.get('/api/init', async (_req, res): Promise<void> => {
  const { postId, userId } = context;
  if (!postId) {
    res.status(400).json({ status: 'error', message: 'Missing postId' } satisfies ErrorResponse);
    return;
  }

  let gameState = await getGameState(postId);
  if (!gameState) {
    gameState = createInitialState(postId);
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

router.post('/internal/on-app-install', (_req, res): void => {
  res.json({ status: 'success', message: 'Worms app installed' });
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
