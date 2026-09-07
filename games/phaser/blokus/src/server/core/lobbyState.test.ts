import { createDevvitTest } from '@devvit/test/server/vitest';
import { expect } from 'vitest';
import {
  getGameMoves,
  getGamePasses,
  saveGameMoves,
  saveGamePasses,
} from './lobbyState';

const test = createDevvitTest();

test('a new lobby has no replay history', async () => {
  expect(await getGameMoves('NEW')).toBeNull();
  expect(await getGamePasses('NEW')).toBeNull();
});

test('reconnect history persists separately for each lobby', async () => {
  const moves = JSON.stringify([{ pieceId: 1, cells: [[0, 0]], player: 1 }]);
  const passes = JSON.stringify([2]);
  await saveGameMoves('PLAYING', moves);
  await saveGamePasses('PLAYING', passes);

  expect(await getGameMoves('PLAYING')).toBe(moves);
  expect(await getGamePasses('PLAYING')).toBe(passes);
  expect(await getGameMoves('OTHER')).toBeNull();
  expect(await getGamePasses('OTHER')).toBeNull();
});
