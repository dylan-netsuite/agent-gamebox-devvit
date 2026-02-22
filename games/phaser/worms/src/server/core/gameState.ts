import { redis } from '@devvit/web/server';
import type { GameState } from '../../shared/types/game';

function gameKey(postId: string): string {
  return `worms:${postId}:state`;
}

export async function getGameState(postId: string): Promise<GameState | null> {
  const raw = await redis.get(gameKey(postId));
  if (!raw) return null;
  return JSON.parse(raw) as GameState;
}

export async function saveGameState(state: GameState): Promise<void> {
  await redis.set(gameKey(state.postId), JSON.stringify(state));
}

export function createInitialState(postId: string): GameState {
  return {
    postId,
    phase: 'lobby',
    players: [],
    turn: {
      activePlayerIndex: 0,
      activeWormIndex: 0,
      turnNumber: 0,
      timeRemaining: 45,
      wind: 0,
    },
    craters: [],
    terrainSeed: Math.floor(Math.random() * 1_000_000),
    winner: null,
  };
}
