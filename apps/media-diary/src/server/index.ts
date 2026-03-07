import express from 'express';
import type {
  CreateEntryRequest,
  DeleteResponse,
  DiaryStats,
  EntriesResponse,
  EntryResponse,
  MediaCategory,
  MediaEntry,
  StatsResponse,
  UpdateEntryRequest,
} from '../shared/types/api';
import { redis, createServer, context } from '@devvit/web/server';
import { createPost } from './core/post';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

const router = express.Router();

function entriesKey(userId: string): string {
  return `md:entries:${userId}`;
}

function entryKey(userId: string, entryId: string): string {
  return `md:entry:${userId}:${entryId}`;
}

function statsKey(userId: string): string {
  return `md:stats:${userId}`;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function getEntry(userId: string, entryId: string): Promise<MediaEntry | null> {
  try {
    const raw = await redis.get(entryKey(userId, entryId));
    if (raw) return JSON.parse(raw) as MediaEntry;
  } catch {
    // miss
  }
  return null;
}

async function saveEntry(userId: string, entry: MediaEntry): Promise<void> {
  await redis.set(entryKey(userId, entry.id), JSON.stringify(entry));
  const dateScore = new Date(entry.date).getTime();
  await redis.zAdd(entriesKey(userId), { member: entry.id, score: dateScore });
}

async function removeEntry(userId: string, entryId: string): Promise<void> {
  await redis.del(entryKey(userId, entryId));
  await redis.zRem(entriesKey(userId), [entryId]);
}

async function rebuildStats(userId: string): Promise<DiaryStats> {
  const allIds = await redis.zRange(entriesKey(userId), 0, -1, { by: 'rank' });
  const byCategory: Record<MediaCategory, number> = { watched: 0, read: 0, listened: 0 };
  let totalRating = 0;
  let totalEntries = 0;

  for (const item of allIds) {
    const entry = await getEntry(userId, item.member);
    if (entry) {
      totalEntries++;
      byCategory[entry.category]++;
      totalRating += entry.rating;
    }
  }

  const stats: DiaryStats = {
    totalEntries,
    byCategory,
    averageRating: totalEntries > 0 ? Math.round((totalRating / totalEntries) * 10) / 10 : 0,
    recentStreak: 0,
  };

  await redis.set(statsKey(userId), JSON.stringify(stats));
  return stats;
}

router.get('/api/entries', async (req, res): Promise<void> => {
  try {
    const userId = context.userId;
    if (!userId) {
      res.status(401).json({ success: false, entries: [], total: 0, error: 'Not authenticated' } as EntriesResponse);
      return;
    }

    const category = req.query['category'] as MediaCategory | undefined;
    const allIds = await redis.zRange(entriesKey(userId), 0, -1, { by: 'rank', reverse: true });

    const entries: MediaEntry[] = [];
    for (const item of allIds) {
      const entry = await getEntry(userId, item.member);
      if (entry) {
        if (category && entry.category !== category) continue;
        entries.push(entry);
      }
    }

    res.json({ success: true, entries, total: entries.length } as EntriesResponse);
  } catch (error) {
    console.error('Error in GET /api/entries:', error);
    res.status(500).json({ success: false, entries: [], total: 0, error: 'Internal server error' } as EntriesResponse);
  }
});

router.post('/api/entries', async (req, res): Promise<void> => {
  try {
    const userId = context.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' } as EntryResponse);
      return;
    }

    const body = req.body as CreateEntryRequest;

    if (!body.title || !body.category || !body.type || !body.date || body.rating == null) {
      res.status(400).json({ success: false, error: 'Missing required fields' } as EntryResponse);
      return;
    }

    if (body.rating < 1 || body.rating > 10) {
      res.status(400).json({ success: false, error: 'Rating must be between 1 and 10' } as EntryResponse);
      return;
    }

    const entry: MediaEntry = {
      id: generateId(),
      category: body.category,
      type: body.type,
      title: body.title.trim(),
      date: body.date,
      rating: body.rating,
      comments: (body.comments || '').trim(),
      createdAt: new Date().toISOString(),
    };

    await saveEntry(userId, entry);
    await rebuildStats(userId);

    res.json({ success: true, entry } as EntryResponse);
  } catch (error) {
    console.error('Error in POST /api/entries:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as EntryResponse);
  }
});

router.put('/api/entries/:id', async (req, res): Promise<void> => {
  try {
    const userId = context.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' } as EntryResponse);
      return;
    }

    const entryId = req.params['id'];
    if (!entryId) {
      res.status(400).json({ success: false, error: 'Missing entry ID' } as EntryResponse);
      return;
    }

    const existing = await getEntry(userId, entryId);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Entry not found' } as EntryResponse);
      return;
    }

    const body = req.body as UpdateEntryRequest;
    if (body.title !== undefined) existing.title = body.title.trim();
    if (body.date !== undefined) existing.date = body.date;
    if (body.rating !== undefined) {
      if (body.rating < 1 || body.rating > 10) {
        res.status(400).json({ success: false, error: 'Rating must be between 1 and 10' } as EntryResponse);
        return;
      }
      existing.rating = body.rating;
    }
    if (body.comments !== undefined) existing.comments = body.comments.trim();

    await saveEntry(userId, existing);
    await rebuildStats(userId);

    res.json({ success: true, entry: existing } as EntryResponse);
  } catch (error) {
    console.error('Error in PUT /api/entries/:id:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as EntryResponse);
  }
});

router.delete('/api/entries/:id', async (req, res): Promise<void> => {
  try {
    const userId = context.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' } as DeleteResponse);
      return;
    }

    const entryId = req.params['id'];
    if (!entryId) {
      res.status(400).json({ success: false, error: 'Missing entry ID' } as DeleteResponse);
      return;
    }

    const existing = await getEntry(userId, entryId);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Entry not found' } as DeleteResponse);
      return;
    }

    await removeEntry(userId, entryId);
    await rebuildStats(userId);

    res.json({ success: true } as DeleteResponse);
  } catch (error) {
    console.error('Error in DELETE /api/entries/:id:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as DeleteResponse);
  }
});

router.get('/api/stats', async (_req, res): Promise<void> => {
  try {
    const userId = context.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' } as StatsResponse);
      return;
    }

    let stats: DiaryStats | null = null;
    try {
      const raw = await redis.get(statsKey(userId));
      if (raw) stats = JSON.parse(raw) as DiaryStats;
    } catch {
      // miss
    }

    if (!stats) {
      stats = await rebuildStats(userId);
    }

    res.json({ success: true, stats } as StatsResponse);
  } catch (error) {
    console.error('Error in GET /api/stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as StatsResponse);
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
