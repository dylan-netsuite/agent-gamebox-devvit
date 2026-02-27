import express from 'express';
import type {
  LeaderboardEntry,
  LeaderboardResponse,
  StatsResponse,
  SubmitRoundRequest,
  UserStats,
} from '../shared/types/api';
import { redis, createServer, context } from '@devvit/web/server';
import { createPost } from './core/post';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

const router = express.Router();

function emptyStats(): UserStats {
  return {
    roundsPlayed: 0,
    bestScore: 999,
    totalStrokes: 0,
    holesInOne: 0,
    averageStrokes: 0,
  };
}

function statsKey(userId: string): string {
  return `mg:stats:${userId}`;
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

    const body = req.body as SubmitRoundRequest;
    const stats = await getUserStats(userId);

    stats.roundsPlayed++;
    stats.totalStrokes += body.totalStrokes;
    if (body.totalStrokes < stats.bestScore) {
      stats.bestScore = body.totalStrokes;
    }
    const holesInOne = body.scores.filter((s) => s === 1).length;
    stats.holesInOne += holesInOne;
    stats.averageStrokes =
      stats.roundsPlayed > 0 ? Math.round(stats.totalStrokes / stats.roundsPlayed) : 0;

    await saveUserStats(userId, stats);

    await redis.zAdd('mg:lb:best', { member: userId, score: stats.bestScore });

    const username = context.username;
    if (username) {
      await redis.hSet('mg:lb:names', { [userId]: username });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/stats/submit:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

async function getUsername(userId: string): Promise<string> {
  try {
    const name = await redis.hGet('mg:lb:names', userId);
    if (name) return name;
  } catch {
    // ignore
  }
  return userId.replace('t2_', 'u/');
}

router.get('/api/leaderboard', async (_req, res): Promise<void> => {
  try {
    const topMembers = await redis.zRange('mg:lb:best', 0, 19, { by: 'rank' });
    const entries: LeaderboardEntry[] = [];

    for (let i = 0; i < topMembers.length; i++) {
      const m = topMembers[i]!;
      const username = await getUsername(m.member);
      entries.push({
        rank: i + 1,
        userId: m.member,
        username,
        bestScore: m.score,
        roundsPlayed: 0,
      });
    }

    const response: LeaderboardResponse = { success: true, entries };

    const userId = context.userId;
    if (userId) {
      try {
        const rank = await redis.zRank('mg:lb:best', userId);
        if (rank !== undefined && rank !== null) {
          response.userRank = rank + 1;
        }
      } catch {
        // not on board
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/leaderboard:', error);
    res
      .status(500)
      .json({ success: false, entries: [], error: 'Internal server error' } as LeaderboardResponse);
  }
});

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
