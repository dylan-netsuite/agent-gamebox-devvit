import express from 'express';
import type {
  LeaderboardEntry,
  LeaderboardResponse,
  StatsResponse,
  SubmitResultRequest,
  UserStats,
  CommunityStatsResponse,
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
