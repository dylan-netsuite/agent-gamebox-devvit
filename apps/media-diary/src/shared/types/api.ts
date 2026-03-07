export type MediaCategory = 'watched' | 'read' | 'listened';

export type WatchedType = 'tv' | 'movie';
export type ReadType = 'book' | 'magazine' | 'comic' | 'article';
export type ListenedType = 'album' | 'song' | 'playlist' | 'podcast';

export type MediaType = WatchedType | ReadType | ListenedType;

export const MEDIA_TYPES_BY_CATEGORY: Record<MediaCategory, readonly MediaType[]> = {
  watched: ['tv', 'movie'] as const,
  read: ['book', 'magazine', 'comic', 'article'] as const,
  listened: ['album', 'song', 'playlist', 'podcast'] as const,
};

export const CATEGORY_LABELS: Record<MediaCategory, string> = {
  watched: 'Watched',
  read: 'Read',
  listened: 'Listened',
};

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  tv: 'TV Show',
  movie: 'Movie',
  book: 'Book',
  magazine: 'Magazine',
  comic: 'Comic',
  article: 'Article',
  album: 'Album',
  song: 'Song',
  playlist: 'Playlist',
  podcast: 'Podcast',
};

export const CATEGORY_ICONS: Record<MediaCategory, string> = {
  watched: '🎬',
  read: '📚',
  listened: '🎵',
};

export interface MediaEntry {
  id: string;
  category: MediaCategory;
  type: MediaType;
  title: string;
  date: string;
  rating: number;
  comments: string;
  createdAt: string;
}

export interface CreateEntryRequest {
  category: MediaCategory;
  type: MediaType;
  title: string;
  date: string;
  rating: number;
  comments: string;
}

export interface UpdateEntryRequest {
  title?: string | undefined;
  date?: string | undefined;
  rating?: number | undefined;
  comments?: string | undefined;
}

export interface EntryResponse {
  success: boolean;
  entry?: MediaEntry | undefined;
  error?: string | undefined;
}

export interface EntriesResponse {
  success: boolean;
  entries: MediaEntry[];
  total: number;
  error?: string | undefined;
}

export interface DeleteResponse {
  success: boolean;
  error?: string | undefined;
}

export interface DiaryStats {
  totalEntries: number;
  byCategory: Record<MediaCategory, number>;
  averageRating: number;
  recentStreak: number;
}

export interface StatsResponse {
  success: boolean;
  stats?: DiaryStats | undefined;
  error?: string | undefined;
}
