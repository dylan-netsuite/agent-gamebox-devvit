import { redis } from '@devvit/web/server';
import type { GameState, Country, PlayerInfo, GamePhase, BuildOption, TurnSnapshot } from '../../shared/types/game';
import { ALL_COUNTRIES, WIN_CONDITION } from '../../shared/types/game';
import { STARTING_UNITS, STARTING_SUPPLY_CENTERS } from '../../shared/data/startingPositions';
import { getHomeSupplyCenters } from '../../shared/data/provinces';

function gameKey(postId: string): string {
  return `game:${postId}:state`;
}

export async function getGameState(postId: string): Promise<GameState | null> {
  const raw = await redis.get(gameKey(postId));
  if (!raw) return null;
  return JSON.parse(raw) as GameState;
}

export async function saveGameState(state: GameState): Promise<void> {
  await redis.set(gameKey(state.postId), JSON.stringify(state));
}

export async function createGame(postId: string): Promise<GameState> {
  const state: GameState = {
    gameId: `game-${Date.now()}`,
    postId,
    phase: 'waiting',
    turn: { year: 1901, season: 'Spring' },
    players: [],
    units: [...STARTING_UNITS.map((u) => ({ ...u }))],
    supplyCenters: { ...STARTING_SUPPLY_CENTERS },
    dislodged: [],
    builds: [],
    winner: null,
    turnLog: [],
    ordersSubmitted: [],
    turnTimeLimitMs: null,
    turnDeadline: null,
  };
  await saveGameState(state);
  return state;
}

function userGamesKey(userId: string): string {
  return `user:${userId}:games`;
}

export async function addUserGame(userId: string, postId: string): Promise<void> {
  await redis.zAdd(userGamesKey(userId), { member: postId, score: Date.now() });
}

export async function getUserGamePostIds(userId: string): Promise<string[]> {
  const entries = await redis.zRange(userGamesKey(userId), 0, -1);
  return entries.map((e) => e.member);
}

export async function joinGame(
  postId: string,
  userId: string,
  username: string,
  country: Country
): Promise<{ state: GameState; player: PlayerInfo }> {
  const state = await getGameState(postId);
  if (!state) throw new Error('Game not found');
  if (state.phase !== 'waiting') throw new Error('Game already started');

  const existing = state.players.find((p) => p.country === country);
  if (existing) throw new Error(`${country} is already taken`);

  const alreadyJoined = state.players.find((p) => p.userId === userId);
  if (alreadyJoined) throw new Error('You already joined this game');

  const player: PlayerInfo = { userId, username, country };
  state.players.push(player);

  await saveGameState(state);
  await addUserGame(userId, postId);
  return { state, player };
}

export async function startGame(postId: string): Promise<GameState> {
  const state = await getGameState(postId);
  if (!state) throw new Error('Game not found');
  if (state.players.length < 2) throw new Error('Need at least 2 players');

  state.phase = 'orders';
  state.ordersSubmitted = [];
  state.turnLog = [`=== ${state.turn.season} ${state.turn.year} ===`];
  state.turnDeadline = state.turnTimeLimitMs ? Date.now() + state.turnTimeLimitMs : null;

  await saveGameState(state);
  return state;
}

export function getActivePlayers(state: GameState): Country[] {
  return state.players
    .filter((p) => state.units.some((u) => u.country === p.country))
    .map((p) => p.country);
}

export function countSupplyCenters(state: GameState, country: Country): number {
  return Object.values(state.supplyCenters).filter((c) => c === country).length;
}

export function checkWinner(state: GameState): Country | null {
  for (const country of ALL_COUNTRIES) {
    if (countSupplyCenters(state, country) >= WIN_CONDITION) {
      return country;
    }
  }
  return null;
}

export function advanceTurn(state: GameState): void {
  if (state.turn.season === 'Spring') {
    state.turn = { year: state.turn.year, season: 'Fall' };
  } else {
    state.turn = { year: state.turn.year + 1, season: 'Spring' };
  }
  state.ordersSubmitted = [];
}

export function updateSupplyCenters(state: GameState): void {
  for (const unit of state.units) {
    const sc = state.supplyCenters[unit.province];
    if (sc !== undefined) {
      state.supplyCenters[unit.province] = unit.country;
    }
  }
}

export function calculateBuilds(state: GameState): BuildOption[] {
  const builds: BuildOption[] = [];

  for (const player of state.players) {
    const country = player.country;
    const scCount = countSupplyCenters(state, country);
    const unitCount = state.units.filter((u) => u.country === country).length;
    const delta = scCount - unitCount;

    if (delta === 0) continue;

    let validProvinces: string[] = [];

    if (delta > 0) {
      const homeSCs = getHomeSupplyCenters(country).map((p) => p.id);
      validProvinces = homeSCs.filter((sc) => {
        const occupied = state.units.some((u) => u.province === sc);
        const owned = state.supplyCenters[sc] === country;
        return !occupied && owned;
      });
    } else {
      validProvinces = state.units
        .filter((u) => u.country === country)
        .map((u) => u.province);
    }

    builds.push({ country, delta, validProvinces });
  }

  return builds;
}

export function setPhase(state: GameState, phase: GamePhase): void {
  state.phase = phase;
  if (state.turnTimeLimitMs && (phase === 'orders' || phase === 'retreats' || phase === 'builds')) {
    state.turnDeadline = Date.now() + state.turnTimeLimitMs;
  } else if (phase === 'complete' || phase === 'waiting') {
    state.turnDeadline = null;
  }
}

function historyKey(postId: string): string {
  return `game:${postId}:history`;
}

export async function saveTurnSnapshot(
  state: GameState,
  phase: TurnSnapshot['phase']
): Promise<void> {
  const snapshot: TurnSnapshot = {
    turn: { ...state.turn },
    phase,
    units: state.units.map((u) => ({ ...u })),
    supplyCenters: { ...state.supplyCenters },
    log: [...state.turnLog],
  };
  await redis.zAdd(historyKey(state.postId), {
    member: JSON.stringify(snapshot),
    score: Date.now(),
  });
}

export async function getTurnHistory(postId: string): Promise<TurnSnapshot[]> {
  const entries = await redis.zRange(historyKey(postId), 0, -1);
  return entries.map((e) => JSON.parse(e.member) as TurnSnapshot);
}
