import express from 'express';
import type {
  DailyPuzzleResponse,
  LeaderboardEntry,
  LeaderboardResponse,
  PuzzleBest,
  PuzzleConfig,
  PuzzleProgressResponse,
  StatsResponse,
  SubmitResultRequest,
  UserPuzzleResponse,
  UserPuzzleSubmission,
  UserStats,
  Vehicle,
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
    puzzlesSolved: 0,
    totalMoves: 0,
    totalTime: 0,
    bestStreak: 0,
    currentStreak: 0,
    dailyStreak: 0,
    lastDailyDate: null,
    starsEarned: 0,
    puzzlesCreated: 0,
  };
}

function statsKey(userId: string): string {
  return `rh:stats:${userId}`;
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

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---- Daily Puzzle ----

router.get('/api/daily-puzzle', async (_req, res): Promise<void> => {
  try {
    const today = getTodayStr();
    const cached = await redis.get(`rh:daily:${today}`);

    if (cached) {
      const puzzle = JSON.parse(cached) as PuzzleConfig;
      const userId = context.userId;
      let userResult = null;

      if (userId) {
        try {
          const resultRaw = await redis.get(`rh:daily:result:${today}:${userId}`);
          if (resultRaw) userResult = JSON.parse(resultRaw);
        } catch {
          // miss
        }
      }

      const response: DailyPuzzleResponse = {
        success: true,
        puzzle,
        date: today,
        userResult,
      };
      res.json(response);
      return;
    }

    const response: DailyPuzzleResponse = {
      success: false,
      error: 'No daily puzzle set. Client will use local fallback.',
    };
    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/daily-puzzle:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as DailyPuzzleResponse);
  }
});

router.post('/api/daily-puzzle/submit', async (req, res): Promise<void> => {
  try {
    const userId = context.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const body = req.body as SubmitResultRequest;
    const today = getTodayStr();

    const existing = await redis.get(`rh:daily:result:${today}:${userId}`);
    if (existing) {
      res.json({ success: true, message: 'Already submitted today' });
      return;
    }

    await redis.set(`rh:daily:result:${today}:${userId}`, JSON.stringify({
      puzzleId: body.puzzleId,
      moves: body.moves,
      timeSeconds: body.timeSeconds,
      completed: true,
      stars: body.stars,
    }));

    await redis.zAdd(`rh:lb:daily:${today}:moves`, { member: userId, score: body.moves });
    await redis.zAdd(`rh:lb:daily:${today}:time`, { member: userId, score: body.timeSeconds });

    const username = context.username;
    if (username) {
      await redis.hSet('rh:lb:names', { [userId]: username });
    }

    const stats = await getUserStats(userId);
    if (stats.lastDailyDate === getTodayStr()) {
      // already counted
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      if (stats.lastDailyDate === yesterdayStr) {
        stats.dailyStreak++;
      } else {
        stats.dailyStreak = 1;
      }
      stats.lastDailyDate = today;
    }
    await saveUserStats(userId, stats);

    res.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/daily-puzzle/submit:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ---- Stats ----

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

    stats.puzzlesSolved++;
    stats.totalMoves += body.moves;
    stats.totalTime += body.timeSeconds;
    stats.starsEarned += body.stars;
    stats.currentStreak++;
    if (stats.currentStreak > stats.bestStreak) {
      stats.bestStreak = stats.currentStreak;
    }

    await saveUserStats(userId, stats);

    await redis.zAdd('rh:lb:alltime:solved', { member: userId, score: stats.puzzlesSolved });

    const avgTime = stats.puzzlesSolved > 0 ? Math.round(stats.totalTime / stats.puzzlesSolved) : 0;
    await redis.zAdd('rh:lb:alltime:speed', { member: userId, score: avgTime });

    const username = context.username;
    if (username) {
      await redis.hSet('rh:lb:names', { [userId]: username });
    }

    try {
      await redis.hIncrBy('rh:community', 'puzzlesSolved', 1);
      await redis.hIncrBy('rh:community', 'totalMoves', body.moves);
    } catch {
      // non-fatal
    }

    if (body.isDaily) {
      const today = getTodayStr();
      const existing = await redis.get(`rh:daily:result:${today}:${userId}`);
      if (!existing) {
        await redis.set(`rh:daily:result:${today}:${userId}`, JSON.stringify({
          puzzleId: body.puzzleId,
          moves: body.moves,
          timeSeconds: body.timeSeconds,
          completed: true,
          stars: body.stars,
        }));
        await redis.zAdd(`rh:lb:daily:${today}:moves`, { member: userId, score: body.moves });
        await redis.zAdd(`rh:lb:daily:${today}:time`, { member: userId, score: body.timeSeconds });
      }
    }

    // Per-puzzle best tracking
    try {
      const progressKey = `rh:progress:${userId}:${body.puzzleId}`;
      const existingRaw = await redis.get(progressKey);
      const existing: PuzzleBest | null = existingRaw ? JSON.parse(existingRaw) as PuzzleBest : null;

      if (
        !existing ||
        body.stars > existing.stars ||
        (body.stars === existing.stars && body.moves < existing.bestMoves)
      ) {
        const best: PuzzleBest = {
          stars: Math.max(body.stars, existing?.stars ?? 0),
          bestMoves: existing ? Math.min(body.moves, existing.bestMoves) : body.moves,
          bestTime: existing ? Math.min(body.timeSeconds, existing.bestTime) : body.timeSeconds,
        };
        await redis.set(progressKey, JSON.stringify(best));
        await redis.zAdd(`rh:progress-index:${userId}`, { member: body.puzzleId, score: Date.now() });
      }
    } catch {
      // non-fatal
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/stats/submit:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ---- Puzzle Progress ----

router.get('/api/puzzle-progress', async (_req, res): Promise<void> => {
  try {
    const userId = context.userId;
    if (!userId) {
      res.json({ success: true, progress: {} } as PuzzleProgressResponse);
      return;
    }

    const members = await redis.zRange(`rh:progress-index:${userId}`, 0, 99, { by: 'rank' });
    const progress: Record<string, PuzzleBest> = {};

    for (const m of members) {
      try {
        const raw = await redis.get(`rh:progress:${userId}:${m.member}`);
        if (raw) {
          progress[m.member] = JSON.parse(raw) as PuzzleBest;
        }
      } catch {
        // skip
      }
    }

    res.json({ success: true, progress } as PuzzleProgressResponse);
  } catch (error) {
    console.error('Error in GET /api/puzzle-progress:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as PuzzleProgressResponse);
  }
});

// ---- Leaderboard ----

async function getUsername(userId: string): Promise<string> {
  try {
    const name = await redis.hGet('rh:lb:names', userId);
    if (name) return name;
  } catch {
    // ignore
  }
  return userId.replace('t2_', 'u/');
}

router.get('/api/leaderboard', async (req, res): Promise<void> => {
  try {
    const type = (req.query.type as string) || 'daily';
    const entries: LeaderboardEntry[] = [];

    if (type === 'daily') {
      const today = getTodayStr();
      const topMembers = await redis.zRange(`rh:lb:daily:${today}:moves`, 0, 19, { by: 'rank' });

      for (let i = 0; i < topMembers.length; i++) {
        const m = topMembers[i]!;
        const username = await getUsername(m.member);
        let bestTime = 0;
        try {
          const t = await redis.zScore(`rh:lb:daily:${today}:time`, m.member);
          if (t !== undefined && t !== null) bestTime = t;
        } catch {
          // ignore
        }

        entries.push({
          rank: i + 1,
          userId: m.member,
          username,
          bestMoves: m.score,
          bestTime,
          puzzlesSolved: 1,
        });
      }

      const response: LeaderboardResponse = { success: true, entries, type: 'daily', date: today };

      const userId = context.userId;
      if (userId) {
        try {
          const rank = await redis.zRank(`rh:lb:daily:${today}:moves`, userId);
          if (rank !== undefined && rank !== null) {
            response.userRank = rank + 1;
          }
        } catch {
          // not on board
        }
      }

      res.json(response);
    } else {
      const topMembers = await redis.zRange('rh:lb:alltime:solved', 0, 19, { by: 'rank', reverse: true });

      for (let i = 0; i < topMembers.length; i++) {
        const m = topMembers[i]!;
        const username = await getUsername(m.member);
        let avgTime = 0;
        try {
          const t = await redis.zScore('rh:lb:alltime:speed', m.member);
          if (t !== undefined && t !== null) avgTime = t;
        } catch {
          // ignore
        }

        entries.push({
          rank: i + 1,
          userId: m.member,
          username,
          bestMoves: 0,
          bestTime: avgTime,
          puzzlesSolved: m.score,
        });
      }

      const response: LeaderboardResponse = { success: true, entries, type: 'alltime' };

      const userId = context.userId;
      if (userId) {
        try {
          const rank = await redis.zRank('rh:lb:alltime:solved', userId);
          if (rank !== undefined && rank !== null) {
            const totalMembers = await redis.zCard('rh:lb:alltime:solved');
            response.userRank = totalMembers - rank;
          }
        } catch {
          // not on board
        }
      }

      res.json(response);
    }
  } catch (error) {
    console.error('Error in GET /api/leaderboard:', error);
    res.status(500).json({ success: false, entries: [], type: 'daily', error: 'Internal server error' } as LeaderboardResponse);
  }
});

// ---- User Puzzles ----

router.get('/api/user-puzzles', async (_req, res): Promise<void> => {
  try {
    const userId = context.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' } as UserPuzzleResponse);
      return;
    }

    const members = await redis.zRange(`rh:user-puzzles:${userId}`, 0, 49, { by: 'rank', reverse: true });
    const puzzles: PuzzleConfig[] = [];

    for (const m of members) {
      try {
        const raw = await redis.get(`rh:user-puzzle:${m.member}`);
        if (raw) puzzles.push(JSON.parse(raw) as PuzzleConfig);
      } catch {
        // skip
      }
    }

    res.json({ success: true, puzzles } as UserPuzzleResponse);
  } catch (error) {
    console.error('Error in GET /api/user-puzzles:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as UserPuzzleResponse);
  }
});

router.post('/api/user-puzzles', async (req, res): Promise<void> => {
  try {
    const userId = context.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const body = req.body as UserPuzzleSubmission;
    if (!body.vehicles || !Array.isArray(body.vehicles)) {
      res.status(400).json({ success: false, error: 'Invalid puzzle data' });
      return;
    }

    const puzzleId = `user-${userId}-${Date.now()}`;
    const puzzle: PuzzleConfig = {
      id: puzzleId,
      name: body.name || 'Custom Puzzle',
      difficulty: 'intermediate',
      vehicles: body.vehicles as Vehicle[],
      minMoves: body.minMoves || 0,
      author: context.username ?? userId,
    };

    await redis.set(`rh:user-puzzle:${puzzleId}`, JSON.stringify(puzzle));
    await redis.zAdd(`rh:user-puzzles:${userId}`, { member: puzzleId, score: Date.now() });

    const stats = await getUserStats(userId);
    stats.puzzlesCreated++;
    await saveUserStats(userId, stats);

    res.json({ success: true, puzzleId });
  } catch (error) {
    console.error('Error in POST /api/user-puzzles:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ---- Internal ----

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
