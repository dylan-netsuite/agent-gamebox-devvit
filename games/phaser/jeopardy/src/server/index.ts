import express from 'express';
import type { CommunityStatsResponse, GameResponse, GameResult, GameType, LeaderboardEntry, LeaderboardResponse, QuestionStatsRequest, QuestionStatsResponse, SavedGameResponse, SavedGameState, StatsResponse, UserStats } from '../shared/types/api';
import { redis, createServer, context } from '@devvit/web/server';
import { createPost } from './core/post';
import { cleanHtmlText, findLatestGame, findOnThisDayGame, scrapeGame } from './scraper';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

const router = express.Router();

// ---------------------------------------------------------------------------
// Redis cache helpers
// ---------------------------------------------------------------------------

const CACHE_TTL_GAME = 60 * 60 * 24 * 30; // 30 days for game data
const CACHE_TTL_LATEST = 60 * 60 * 6; // 6 hours for "latest" lookups

async function getCachedGame(gameId: number): Promise<GameResponse | null> {
  try {
    const cached = await redis.get(`jeopardy:game:${gameId}`);
    if (cached) {
      return JSON.parse(cached) as GameResponse;
    }
  } catch {
    // Cache miss or parse error
  }
  return null;
}

async function setCachedGame(gameId: number, response: GameResponse, ttl: number): Promise<void> {
  try {
    const key = `jeopardy:game:${gameId}`;
    await redis.set(key, JSON.stringify(response));
    await redis.expire(key, ttl);
  } catch {
    // Cache write failure is non-fatal
  }
}

async function getCachedLatest(): Promise<GameResponse | null> {
  try {
    const cached = await redis.get('jeopardy:latest');
    if (cached) {
      return JSON.parse(cached) as GameResponse;
    }
  } catch {
    // Cache miss
  }
  return null;
}

async function setCachedLatest(response: GameResponse): Promise<void> {
  try {
    await redis.set('jeopardy:latest', JSON.stringify(response));
    await redis.expire('jeopardy:latest', CACHE_TTL_LATEST);
  } catch {
    // Non-fatal
  }
}

/**
 * Fix corrupted ampersand sequences from old cache entries.
 * Redis/JSON round-trips can mangle `&amp;` into garbled Unicode + `mp;`.
 */
function fixCorruptedText(text: string): string {
  return cleanHtmlText(text.replace(/[^\x00-\x7F]{1,3}mp;/g, '&'));
}

/**
 * Sanitize all text fields in a GameResponse to fix encoding issues from old cache entries.
 */
function sanitizeGameResponse(response: GameResponse): GameResponse {
  if (!response.data) return response;
  const d = response.data;
  d.categories = d.categories.map(fixCorruptedText);
  if (d.djCategories) d.djCategories = d.djCategories.map(fixCorruptedText);
  for (const clue of d.clues) {
    clue.question = fixCorruptedText(clue.question);
    clue.answer = fixCorruptedText(clue.answer);
    clue.category = fixCorruptedText(clue.category);
  }
  if (d.djClues) {
    for (const clue of d.djClues) {
      clue.question = fixCorruptedText(clue.question);
      clue.answer = fixCorruptedText(clue.answer);
      clue.category = fixCorruptedText(clue.category);
    }
  }
  if (d.finalJeopardy) {
    d.finalJeopardy.question = fixCorruptedText(d.finalJeopardy.question);
    d.finalJeopardy.answer = fixCorruptedText(d.finalJeopardy.answer);
    d.finalJeopardy.category = fixCorruptedText(d.finalJeopardy.category);
  }
  return response;
}

// ---------------------------------------------------------------------------
// Game endpoint
// ---------------------------------------------------------------------------

router.get('/api/game', async (req, res): Promise<void> => {
  const gameType = (req.query.type as GameType) || 'latest';

  try {
    // If a specific gameId is requested (for resume), try cache directly
    const requestedGameId = req.query.gameId ? parseInt(req.query.gameId as string, 10) : null;
    if (requestedGameId && !isNaN(requestedGameId)) {
      const cached = await getCachedGame(requestedGameId);
      if (cached) {
        res.json(sanitizeGameResponse(cached));
        return;
      }
    }

    // For "latest", check the dedicated latest cache first
    if (gameType === 'latest') {
      const cachedLatest = await getCachedLatest();
      if (cachedLatest) {
        res.json(sanitizeGameResponse(cachedLatest));
        return;
      }
    }

    // Find the game ID and air date
    let lookup: { gameId: number; airDate: string } | null = null;

    if (gameType === 'latest') {
      lookup = await findLatestGame();
    } else if (gameType === 'onthisday') {
      lookup = await findOnThisDayGame();
    }

    if (!lookup) {
      const response: GameResponse = {
        success: false,
        error: `No game found for type: ${gameType}`,
        fallback: true,
      };
      res.json(response);
      return;
    }

    // Check if we have cached game data for this gameId
    const cachedGame = await getCachedGame(lookup.gameId);
    if (cachedGame) {
      if (cachedGame.data) {
        cachedGame.data.gameType = gameType;
      }
      if (gameType === 'latest') {
        await setCachedLatest(cachedGame);
      }
      res.json(sanitizeGameResponse(cachedGame));
      return;
    }

    // Scrape the game
    console.log(`[api/game] Scraping game ${lookup.gameId} (${lookup.airDate})`);
    const gameData = await scrapeGame(lookup.gameId, lookup.airDate, gameType);

    if (!gameData) {
      console.error(`[api/game] Scrape returned null for game ${lookup.gameId}`);
      const response: GameResponse = {
        success: false,
        error: 'Failed to scrape game data from j-archive',
        fallback: true,
      };
      res.json(response);
      return;
    }

    if (gameData.clues.length < 5) {
      console.warn(`[api/game] Game ${lookup.gameId} has only ${gameData.clues.length} J clues`);
      const response: GameResponse = {
        success: false,
        error: `Insufficient clues (${gameData.clues.length}) for game ${lookup.gameId}`,
        fallback: true,
      };
      res.json(response);
      return;
    }

    const response: GameResponse = {
      success: true,
      data: gameData,
    };

    console.log(
      `[api/game] Serving game ${lookup.gameId}: J=${gameData.clues.length}, DJ=${gameData.djClues?.length ?? 0}, FJ=${gameData.finalJeopardy ? 'yes' : 'no'}`
    );

    // Cache the game data
    await setCachedGame(lookup.gameId, response, CACHE_TTL_GAME);

    // Also cache as "latest" if applicable
    if (gameType === 'latest') {
      await setCachedLatest(response);
    }

    res.json(response);
  } catch (error) {
    console.error('Error in /api/game:', error);
    const response: GameResponse = {
      success: false,
      error: 'Internal server error',
      fallback: true,
    };
    res.status(500).json(response);
  }
});

// ---------------------------------------------------------------------------
// Stats helpers
// ---------------------------------------------------------------------------

function emptyStats(): UserStats {
  return {
    totalAnswered: 0,
    totalCorrect: 0,
    gamesPlayed: 0,
    bestGame: null,
    longestStreak: 0,
    currentStreak: 0,
    correctByValue: {},
    finalJeopardy: { correct: 0, total: 0 },
  };
}

function statsKey(userId: string): string {
  return `jeopardy:stats:${userId}`;
}

async function getUserStats(userId: string): Promise<UserStats> {
  try {
    const raw = await redis.get(statsKey(userId));
    if (raw) return JSON.parse(raw) as UserStats;
  } catch {
    // Parse error or cache miss
  }
  return emptyStats();
}

async function saveUserStats(userId: string, stats: UserStats): Promise<void> {
  await redis.set(statsKey(userId), JSON.stringify(stats));
}

// ---------------------------------------------------------------------------
// Leaderboard helpers
// ---------------------------------------------------------------------------

const LB_BEST_KEY = 'jeopardy:lb:best';
const LB_GAMES_KEY = 'jeopardy:lb:games';
const LB_NAMES_KEY = 'jeopardy:lb:names';
const COMMUNITY_KEY = 'jeopardy:community';

async function updateLeaderboard(userId: string, bestScore: number, gamesPlayed: number): Promise<void> {
  await redis.zAdd(LB_BEST_KEY, { member: userId, score: bestScore });
  await redis.zAdd(LB_GAMES_KEY, { member: userId, score: gamesPlayed });

  // Store username if available
  const username = context.username;
  if (username) {
    await redis.hSet(LB_NAMES_KEY, { [userId]: username });
  }
}

async function getUsername(userId: string): Promise<string> {
  try {
    const name = await redis.hGet(LB_NAMES_KEY, userId);
    if (name) return name;
  } catch {
    // ignore
  }
  // Fallback: abbreviated userId
  return userId.replace('t2_', 'u/');
}

// ---------------------------------------------------------------------------
// Stats endpoints
// ---------------------------------------------------------------------------

router.get('/api/stats', async (_req, res): Promise<void> => {
  try {
    const userId = context.userId;
    if (!userId) {
      const response: StatsResponse = { success: false, error: 'Not authenticated' };
      res.status(401).json(response);
      return;
    }
    const stats = await getUserStats(userId);
    const response: StatsResponse = { success: true, stats };
    res.json(response);
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

    const gameResult = req.body as GameResult;
    if (!gameResult || !Array.isArray(gameResult.answers)) {
      res.status(400).json({ success: false, error: 'Invalid game result' });
      return;
    }

    const stats = await getUserStats(userId);
    stats.gamesPlayed++;

    // Process each answer (skipped answers don't count toward stats)
    for (const answer of gameResult.answers) {
      if (answer.skipped) continue;

      if (answer.isFinalJeopardy) {
        stats.finalJeopardy.total++;
        if (answer.correct) stats.finalJeopardy.correct++;
      } else {
        stats.totalAnswered++;
        if (answer.correct) stats.totalCorrect++;

        // Track by value
        const valKey = String(answer.value);
        if (!stats.correctByValue[valKey]) {
          stats.correctByValue[valKey] = { correct: 0, total: 0 };
        }
        stats.correctByValue[valKey].total++;
        if (answer.correct) stats.correctByValue[valKey].correct++;
      }

      // Streak tracking (across all answers including FJ)
      if (answer.correct) {
        stats.currentStreak++;
        if (stats.currentStreak > stats.longestStreak) {
          stats.longestStreak = stats.currentStreak;
        }
      } else {
        stats.currentStreak = 0;
      }
    }

    // Best game
    if (!stats.bestGame || gameResult.score > stats.bestGame.score) {
      stats.bestGame = {
        score: gameResult.score,
        date: new Date().toISOString().split('T')[0] ?? '',
        description: gameResult.description,
      };
    }

    await saveUserStats(userId, stats);

    // Update leaderboard
    if (stats.bestGame) {
      await updateLeaderboard(userId, stats.bestGame.score, stats.gamesPlayed);
    }

    // Increment global community counters (exclude skipped)
    const answered = gameResult.answers.filter((a) => !a.isFinalJeopardy && !a.skipped).length;
    const correct = gameResult.answers.filter((a) => !a.isFinalJeopardy && !a.skipped && a.correct).length;
    try {
      await redis.hIncrBy(COMMUNITY_KEY, 'gamesPlayed', 1);
      if (answered > 0) await redis.hIncrBy(COMMUNITY_KEY, 'questionsAnswered', answered);
      if (correct > 0) await redis.hIncrBy(COMMUNITY_KEY, 'questionsCorrect', correct);
    } catch {
      // Non-fatal: community counter update failed
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/stats/submit:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// Leaderboard endpoint
// ---------------------------------------------------------------------------

router.get('/api/leaderboard', async (_req, res): Promise<void> => {
  try {
    // Get top 20 by best score (descending)
    const topMembers = await redis.zRange(LB_BEST_KEY, 0, 19, { by: 'rank', reverse: true });

    const entries: LeaderboardEntry[] = [];
    for (let i = 0; i < topMembers.length; i++) {
      const m = topMembers[i]!;
      const userId = m.member;
      const bestScore = m.score;

      let gamesPlayed = 0;
      try {
        const g = await redis.zScore(LB_GAMES_KEY, userId);
        if (g !== undefined && g !== null) gamesPlayed = g;
      } catch {
        // ignore
      }

      const username = await getUsername(userId);
      entries.push({ rank: i + 1, userId, username, bestScore, gamesPlayed });
    }

    // Get current user's rank
    const userId = context.userId;
    let userRank: number | undefined;
    let userEntry: LeaderboardEntry | undefined;

    if (userId) {
      try {
        const rank = await redis.zRank(LB_BEST_KEY, userId);
        if (rank !== undefined && rank !== null) {
          // zRank is 0-based ascending; convert to 1-based descending
          const totalMembers = await redis.zCard(LB_BEST_KEY);
          userRank = totalMembers - rank;

          const score = await redis.zScore(LB_BEST_KEY, userId);
          let gp = 0;
          try {
            const g = await redis.zScore(LB_GAMES_KEY, userId);
            if (g !== undefined && g !== null) gp = g;
          } catch {
            // ignore
          }
          const uname = await getUsername(userId);
          userEntry = { rank: userRank, userId, username: uname, bestScore: score ?? 0, gamesPlayed: gp };
        }
      } catch {
        // User not in leaderboard yet
      }
    }

    const response: LeaderboardResponse = {
      success: true,
      entries,
      ...(userRank !== undefined ? { userRank } : {}),
      ...(userEntry !== undefined ? { userEntry } : {}),
    };
    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/leaderboard:', error);
    res.status(500).json({ success: false, entries: [], error: 'Internal server error' } as LeaderboardResponse);
  }
});

// ---------------------------------------------------------------------------
// Saved game state (board persistence)
// ---------------------------------------------------------------------------

const SAVE_KEY_PREFIX = 'jeopardy:save:';

router.get('/api/game/save', async (_req, res): Promise<void> => {
  try {
    const userId = context.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' } as SavedGameResponse);
      return;
    }
    const raw = await redis.get(`${SAVE_KEY_PREFIX}${userId}`);
    if (!raw) {
      res.json({ success: true } as SavedGameResponse);
      return;
    }
    const state = JSON.parse(raw) as SavedGameState;
    res.json({ success: true, state } as SavedGameResponse);
  } catch (error) {
    console.error('Error in GET /api/game/save:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as SavedGameResponse);
  }
});

router.post('/api/game/save', async (req, res): Promise<void> => {
  try {
    const userId = context.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }
    const state = req.body as SavedGameState;
    if (!state || typeof state.gameId !== 'number') {
      res.status(400).json({ success: false, error: 'Invalid state' });
      return;
    }
    await redis.set(`${SAVE_KEY_PREFIX}${userId}`, JSON.stringify(state));
    // Expire saves after 30 days
    await redis.expire(`${SAVE_KEY_PREFIX}${userId}`, 60 * 60 * 24 * 30);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/game/save:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/api/game/save', async (_req, res): Promise<void> => {
  try {
    const userId = context.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }
    await redis.del(`${SAVE_KEY_PREFIX}${userId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/game/save:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// Per-question community stats
// ---------------------------------------------------------------------------

router.post('/api/question-stats', async (req, res): Promise<void> => {
  try {
    const { questionId, correct, elapsed } = req.body as QuestionStatsRequest;
    if (!questionId || typeof correct !== 'boolean') {
      res.status(400).json({ success: false, correct: 0, total: 0, avgCorrectTime: null, yourTime: 0 } as QuestionStatsResponse);
      return;
    }

    const yourTime = typeof elapsed === 'number' && elapsed >= 0 ? elapsed : 0;

    const key = `jeopardy:qstats:${questionId}`;
    let stats = { correct: 0, total: 0, totalCorrectTime: 0 };

    try {
      const raw = await redis.get(key);
      if (raw) {
        const parsed = JSON.parse(raw) as { correct: number; total: number; totalCorrectTime?: number };
        stats = {
          correct: parsed.correct,
          total: parsed.total,
          totalCorrectTime: parsed.totalCorrectTime ?? 0,
        };
      }
    } catch {
      // Parse error or cache miss — start fresh
    }

    stats.total++;
    if (correct) {
      stats.correct++;
      stats.totalCorrectTime += yourTime;
    }

    await redis.set(key, JSON.stringify(stats));

    // Track global community timing for correct answers
    if (correct && yourTime > 0) {
      try {
        await redis.hIncrBy(COMMUNITY_KEY, 'totalCorrectTimeTenths', Math.round(yourTime * 10));
        await redis.hIncrBy(COMMUNITY_KEY, 'totalCorrectAnswers', 1);
      } catch {
        // Non-fatal
      }
    }

    const avgCorrectTime = stats.correct > 0
      ? Math.round((stats.totalCorrectTime / stats.correct) * 10) / 10
      : null;

    const response: QuestionStatsResponse = {
      success: true,
      correct: stats.correct,
      total: stats.total,
      avgCorrectTime,
      yourTime,
    };
    res.json(response);
  } catch (error) {
    console.error('Error in POST /api/question-stats:', error);
    res.status(500).json({ success: false, correct: 0, total: 0, avgCorrectTime: null, yourTime: 0 } as QuestionStatsResponse);
  }
});

// ---------------------------------------------------------------------------
// Community stats dashboard
// ---------------------------------------------------------------------------

router.get('/api/community-stats', async (_req, res): Promise<void> => {
  try {
    const totalPlayers = await redis.zCard(LB_BEST_KEY);

    // Read global counters
    let totalGamesPlayed = 0;
    let totalQuestionsAnswered = 0;
    let totalCorrect = 0;
    let totalCorrectTimeTenths = 0;
    let totalCorrectAnswers = 0;

    try {
      const fields = await redis.hGetAll(COMMUNITY_KEY);
      totalGamesPlayed = parseInt(fields['gamesPlayed'] ?? '0', 10) || 0;
      totalQuestionsAnswered = parseInt(fields['questionsAnswered'] ?? '0', 10) || 0;
      totalCorrect = parseInt(fields['questionsCorrect'] ?? '0', 10) || 0;
      totalCorrectTimeTenths = parseInt(fields['totalCorrectTimeTenths'] ?? '0', 10) || 0;
      totalCorrectAnswers = parseInt(fields['totalCorrectAnswers'] ?? '0', 10) || 0;
    } catch {
      // No community data yet
    }

    const avgCorrectPct = totalQuestionsAnswered > 0
      ? Math.round((totalCorrect / totalQuestionsAnswered) * 100)
      : 0;

    const avgCorrectTime = totalCorrectAnswers > 0
      ? Math.round((totalCorrectTimeTenths / totalCorrectAnswers)) / 10
      : null;

    // Top 3 players
    const topMembers = await redis.zRange(LB_BEST_KEY, 0, 2, { by: 'rank', reverse: true });
    const topPlayers: CommunityStatsResponse['topPlayers'] = [];
    for (let i = 0; i < topMembers.length; i++) {
      const m = topMembers[i]!;
      const username = await getUsername(m.member);
      topPlayers.push({ rank: i + 1, username, bestScore: m.score });
    }

    const response: CommunityStatsResponse = {
      success: true,
      totalPlayers,
      totalGamesPlayed,
      totalQuestionsAnswered,
      totalCorrect,
      avgCorrectPct,
      avgCorrectTime,
      topPlayers,
    };
    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/community-stats:', error);
    res.status(500).json({
      success: false,
      totalPlayers: 0,
      totalGamesPlayed: 0,
      totalQuestionsAnswered: 0,
      totalCorrect: 0,
      avgCorrectPct: 0,
      avgCorrectTime: null,
      topPlayers: [],
      error: 'Internal server error',
    } as CommunityStatsResponse);
  }
});

// ---------------------------------------------------------------------------
// Internal endpoints
// ---------------------------------------------------------------------------

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
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
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

app.use(router);

const port = process.env.WEBBIT_PORT || 3000;

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
