import { redis } from '@devvit/web/server';
import type { GameState, Country, PlayerInfo, Unit } from '../../shared/types/game';
import { ALL_COUNTRIES, COUNTRY_NAMES } from '../../shared/types/game';
import type { Order, MoveOrder, SupportOrder, HoldOrder } from '../../shared/types/orders';
import { saveGameState, getActivePlayers } from './gameState';
import { ADJACENCIES, getValidMoves, determineCoast } from '../../shared/data/adjacencies';
import { PROVINCES } from '../../shared/data/provinces';
import { resolveOrders, applyResults } from './orderResolver';

// ── Helpers ─────────────────────────────────────────

export function isBot(player: PlayerInfo): boolean {
  return player.userId.startsWith('bot:');
}

export function getBotCountries(state: GameState): Country[] {
  return state.players.filter((p) => isBot(p)).map((p) => p.country);
}

export function fillBots(state: GameState): void {
  const takenCountries = new Set(state.players.map((p) => p.country));
  for (const country of ALL_COUNTRIES) {
    if (takenCountries.has(country)) continue;
    state.players.push({
      userId: `bot:${country.toLowerCase()}`,
      username: `Bot (${COUNTRY_NAMES[country]})`,
      country,
    });
  }
}

const NAVAL_POWERS: Set<Country> = new Set(['ENGLAND', 'TURKEY']);
const MAX_CANDIDATES = 40;

function getEnemyUnits(state: GameState, country: Country): Unit[] {
  return state.units.filter((u) => u.country !== country);
}

function getMyUnits(state: GameState, country: Country): Unit[] {
  return state.units.filter((u) => u.country === country);
}

function getMySCs(state: GameState, country: Country): string[] {
  return Object.entries(state.supplyCenters)
    .filter(([, owner]) => owner === country)
    .map(([id]) => id);
}

function getTargetSCs(state: GameState, country: Country): string[] {
  return Object.entries(state.supplyCenters)
    .filter(([, owner]) => owner !== country)
    .map(([id]) => id);
}

function distanceTo(from: string, targets: Set<string>, unitType: 'Army' | 'Fleet', coast?: string): number {
  if (targets.has(from)) return 0;
  const visited = new Set<string>([from]);
  let frontier = [from];
  let depth = 0;
  while (frontier.length > 0 && depth < 20) {
    depth++;
    const next: string[] = [];
    for (const prov of frontier) {
      const moves = getValidMoves(prov, unitType, depth === 1 ? coast : undefined);
      for (const m of moves) {
        if (targets.has(m)) return depth;
        if (!visited.has(m)) {
          visited.add(m);
          const provData = PROVINCES[m];
          if (unitType === 'Army' && provData?.type === 'water') continue;
          if (unitType === 'Fleet' && provData?.type === 'inland') continue;
          next.push(m);
        }
      }
    }
    frontier = next;
  }
  return 999;
}

function findThreatenedSCs(state: GameState, country: Country): string[] {
  const mySCs = getMySCs(state, country);
  const enemies = getEnemyUnits(state, country);
  const enemyPositions = new Set(enemies.map((u) => u.province));

  return mySCs.filter((sc) => {
    const adj = ADJACENCIES[sc];
    if (!adj) return false;
    const allAdj = new Set([...adj.army, ...adj.fleet]);
    for (const ep of enemyPositions) {
      if (allAdj.has(ep)) return true;
    }
    return false;
  });
}

function scoreTarget(
  sc: string,
  unitProvince: string,
  unitType: 'Army' | 'Fleet',
  unitCoast: string | undefined,
  state: GameState,
  _country: Country
): number {
  const owner = state.supplyCenters[sc];
  const isNeutral = owner === null;
  const dist = distanceTo(unitProvince, new Set([sc]), unitType, unitCoast);
  return dist * 10 + (isNeutral ? 0 : 5);
}

// ── Position Scoring (Tier 2) ───────────────────────

function scorePosition(state: GameState, country: Country): number {
  let score = 0;

  const mySCs = getMySCs(state, country);
  const myUnits = getMyUnits(state, country);
  const enemyUnits = getEnemyUnits(state, country);
  const enemyPositions = new Set(enemyUnits.map((u) => u.province));
  const targetSCSet = new Set(getTargetSCs(state, country));

  // Supply centers owned (most important)
  score += mySCs.length * 100;

  // Units alive
  score += myUnits.length * 30;

  // Units adjacent to target SCs (positional advantage)
  for (const unit of myUnits) {
    const moves = getValidMoves(unit.province, unit.type, unit.coast);
    for (const m of moves) {
      if (targetSCSet.has(m)) {
        score += 15;
        break;
      }
    }
  }

  // Units threatening enemy SCs (offensive pressure)
  const enemySCs = Object.entries(state.supplyCenters)
    .filter(([, owner]) => owner !== null && owner !== country)
    .map(([id]) => id);
  for (const unit of myUnits) {
    const moves = getValidMoves(unit.province, unit.type, unit.coast);
    for (const sc of enemySCs) {
      if (moves.includes(sc)) {
        score += 5;
        break;
      }
    }
  }

  // Penalty for own SCs threatened by enemies
  for (const sc of mySCs) {
    const adj = ADJACENCIES[sc];
    if (!adj) continue;
    const allAdj = new Set([...adj.army, ...adj.fleet]);
    for (const ep of enemyPositions) {
      if (allAdj.has(ep)) {
        score -= 20;
        break;
      }
    }
  }

  return score;
}

// ── Simulation (Tier 2) ─────────────────────────────

function deepCloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

function buildHoldOrders(state: GameState, country: Country): Order[] {
  return state.units
    .filter((u) => u.country === country)
    .map((u): HoldOrder => ({
      type: 'hold',
      country,
      unitType: u.type,
      province: u.province,
    }));
}

function simulateAndScore(
  state: GameState,
  candidateOrders: Order[],
  country: Country,
  activeCountries: Country[]
): number {
  const clone = deepCloneState(state);

  const allOrders: Record<string, Order[]> = {};
  allOrders[country] = candidateOrders;
  for (const c of activeCountries) {
    if (c === country) continue;
    allOrders[c] = buildHoldOrders(clone, c);
  }

  const { results, dislodged } = resolveOrders(clone, allOrders);
  applyResults(clone, results, dislodged);

  return scorePosition(clone, country);
}

// ── Candidate Generation (Tier 2) ───────────────────

function generateAlternativeOrders(unit: Unit, state: GameState, country: Country): Order[] {
  const alternatives: Order[] = [];
  const moves = getValidMoves(unit.province, unit.type, unit.coast);

  // Hold
  alternatives.push({
    type: 'hold',
    country,
    unitType: unit.type,
    province: unit.province,
  } as HoldOrder);

  // All valid moves
  for (const dest of moves) {
    const coast = determineCoast(unit.province, dest);
    alternatives.push({
      type: 'move',
      country,
      unitType: unit.type,
      province: unit.province,
      destination: dest,
      ...(coast ? { coast: coast as 'NC' | 'SC' | 'EC' } : {}),
    } as MoveOrder);
  }

  return alternatives;
}

function generateCandidates(
  state: GameState,
  country: Country,
  baseline: Order[]
): Order[][] {
  const candidates: Order[][] = [baseline];
  const units = getMyUnits(state, country);

  // For each unit, try swapping its order with alternatives
  for (let i = 0; i < units.length && candidates.length < MAX_CANDIDATES; i++) {
    const unit = units[i];
    const alternatives = generateAlternativeOrders(unit, state, country);

    for (const alt of alternatives) {
      if (candidates.length >= MAX_CANDIDATES) break;

      // Skip if this is the same as the baseline order for this unit
      const baselineOrder = baseline.find((o) => o.province === unit.province);
      if (baselineOrder && isSameOrder(baselineOrder, alt)) continue;

      // Create a new candidate by replacing this unit's order
      const candidate = baseline.map((o) =>
        o.province === unit.province ? alt : o
      );

      // Check for self-bounces and fix them
      const destinations = new Set<string>();
      let hasBounce = false;
      for (const o of candidate) {
        if (o.type === 'move') {
          const dest = (o as MoveOrder).destination;
          if (destinations.has(dest)) { hasBounce = true; break; }
          destinations.add(dest);
        }
      }
      if (hasBounce) continue;

      candidates.push(candidate);
    }
  }

  // Also generate a few "coordinated" variants: two units swapped together
  if (units.length >= 2 && candidates.length < MAX_CANDIDATES) {
    for (let i = 0; i < units.length - 1 && candidates.length < MAX_CANDIDATES; i++) {
      for (let j = i + 1; j < units.length && candidates.length < MAX_CANDIDATES; j++) {
        const unitA = units[i];
        const unitB = units[j];
        const movesA = getValidMoves(unitA.province, unitA.type, unitA.coast);
        const movesB = getValidMoves(unitB.province, unitB.type, unitB.coast);

        // Try: A moves to a target, B supports A's move
        for (const dest of movesA) {
          if (candidates.length >= MAX_CANDIDATES) break;
          if (!movesB.includes(dest)) continue;

          const coastA = determineCoast(unitA.province, dest);
          const candidate = baseline.map((o) => {
            if (o.province === unitA.province) {
              return {
                type: 'move',
                country,
                unitType: unitA.type,
                province: unitA.province,
                destination: dest,
                ...(coastA ? { coast: coastA as 'NC' | 'SC' | 'EC' } : {}),
              } as MoveOrder;
            }
            if (o.province === unitB.province) {
              return {
                type: 'support',
                country,
                unitType: unitB.type,
                province: unitB.province,
                supportedProvince: unitA.province,
                supportedDestination: dest,
              } as SupportOrder;
            }
            return o;
          });

          // Check for self-bounces
          const destinations = new Set<string>();
          let hasBounce = false;
          for (const o of candidate) {
            if (o.type === 'move') {
              const d = (o as MoveOrder).destination;
              if (destinations.has(d)) { hasBounce = true; break; }
              destinations.add(d);
            }
          }
          if (!hasBounce) candidates.push(candidate);
        }
      }
    }
  }

  return candidates;
}

function isSameOrder(a: Order, b: Order): boolean {
  if (a.type !== b.type) return false;
  if (a.type === 'hold' && b.type === 'hold') return true;
  if (a.type === 'move' && b.type === 'move') {
    return (a as MoveOrder).destination === (b as MoveOrder).destination;
  }
  if (a.type === 'support' && b.type === 'support') {
    const sa = a as SupportOrder;
    const sb = b as SupportOrder;
    return sa.supportedProvince === sb.supportedProvince &&
      sa.supportedDestination === sb.supportedDestination;
  }
  return false;
}

// ── Tier 1 Baseline Generator ───────────────────────

function generateBaselineOrders(state: GameState, country: Country): Order[] {
  const units = getMyUnits(state, country);
  if (units.length === 0) return [];

  const threatened = new Set(findThreatenedSCs(state, country));
  const targetSCs = getTargetSCs(state, country);
  const targetSet = new Set(targetSCs);
  const enemyPositions = new Set(getEnemyUnits(state, country).map((u) => u.province));
  const myPositions = new Set(units.map((u) => u.province));

  const orders: Order[] = [];
  const claimedDestinations = new Map<string, number>();

  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const moves = getValidMoves(unit.province, unit.type, unit.coast);

    const threatenedAdj = moves.filter((m) => threatened.has(m) && !myPositions.has(m));
    if (threatenedAdj.length > 0) {
      const dest = threatenedAdj[0];
      const existing = claimedDestinations.get(dest);
      if (existing !== undefined) {
        orders.push({
          type: 'support', country, unitType: unit.type, province: unit.province,
          supportedProvince: orders[existing].province, supportedDestination: dest,
        } as SupportOrder);
        continue;
      }
      const coast = determineCoast(unit.province, dest);
      const moveOrder: MoveOrder = {
        type: 'move', country, unitType: unit.type, province: unit.province,
        destination: dest, ...(coast ? { coast: coast as 'NC' | 'SC' | 'EC' } : {}),
      };
      orders.push(moveOrder);
      claimedDestinations.set(dest, orders.length - 1);
      continue;
    }

    if (threatened.has(unit.province)) {
      orders.push({ type: 'hold', country, unitType: unit.type, province: unit.province } as HoldOrder);
      continue;
    }

    const reachableSCs = moves.filter((m) => targetSet.has(m));
    if (reachableSCs.length > 0) {
      const scored = reachableSCs.map((sc) => ({
        sc,
        score: scoreTarget(sc, unit.province, unit.type, unit.coast, state, country),
        defended: enemyPositions.has(sc),
      }));
      scored.sort((a, b) => {
        if (a.defended !== b.defended) return a.defended ? 1 : -1;
        return a.score - b.score;
      });

      const best = scored[0];
      const existing = claimedDestinations.get(best.sc);
      if (existing !== undefined) {
        orders.push({
          type: 'support', country, unitType: unit.type, province: unit.province,
          supportedProvince: orders[existing].province, supportedDestination: best.sc,
        } as SupportOrder);
        continue;
      }

      const coast = determineCoast(unit.province, best.sc);
      const moveOrder: MoveOrder = {
        type: 'move', country, unitType: unit.type, province: unit.province,
        destination: best.sc, ...(coast ? { coast: coast as 'NC' | 'SC' | 'EC' } : {}),
      };
      orders.push(moveOrder);
      claimedDestinations.set(best.sc, orders.length - 1);
      continue;
    }

    const bestTarget = targetSCs
      .map((sc) => ({ sc, dist: distanceTo(unit.province, new Set([sc]), unit.type, unit.coast) }))
      .filter((t) => t.dist < 999)
      .sort((a, b) => {
        const aNeut = state.supplyCenters[a.sc] === null ? 0 : 1;
        const bNeut = state.supplyCenters[b.sc] === null ? 0 : 1;
        if (aNeut !== bNeut) return aNeut - bNeut;
        return a.dist - b.dist;
      })[0];

    if (bestTarget) {
      const steppingMoves = moves
        .filter((m) => !myPositions.has(m) && !claimedDestinations.has(m))
        .map((m) => ({ prov: m, dist: distanceTo(m, new Set([bestTarget.sc]), unit.type) }))
        .sort((a, b) => a.dist - b.dist);

      if (steppingMoves.length > 0 && steppingMoves[0].dist < distanceTo(unit.province, new Set([bestTarget.sc]), unit.type, unit.coast)) {
        const dest = steppingMoves[0].prov;
        const coast = determineCoast(unit.province, dest);
        const moveOrder: MoveOrder = {
          type: 'move', country, unitType: unit.type, province: unit.province,
          destination: dest, ...(coast ? { coast: coast as 'NC' | 'SC' | 'EC' } : {}),
        };
        orders.push(moveOrder);
        claimedDestinations.set(dest, orders.length - 1);
        continue;
      }
    }

    const supportable = orders.filter(
      (o): o is MoveOrder => o.type === 'move' && moves.includes(o.destination)
    );
    if (supportable.length > 0) {
      const target = supportable[0];
      orders.push({
        type: 'support', country, unitType: unit.type, province: unit.province,
        supportedProvince: target.province, supportedDestination: target.destination,
      } as SupportOrder);
      continue;
    }

    orders.push({ type: 'hold', country, unitType: unit.type, province: unit.province } as HoldOrder);
  }

  return orders;
}

// ── Main Order Generator (Tier 2) ───────────────────

function generateBotOrders(state: GameState, country: Country): Order[] {
  const units = getMyUnits(state, country);
  if (units.length === 0) return [];

  const baseline = generateBaselineOrders(state, country);
  const activeCountries = getActivePlayers(state);

  // Generate candidate order sets
  const candidates = generateCandidates(state, country, baseline);

  // Simulate each candidate and pick the best
  let bestOrders = baseline;
  let bestScore = -Infinity;

  for (const candidate of candidates) {
    const score = simulateAndScore(state, candidate, country, activeCountries);
    if (score > bestScore) {
      bestScore = score;
      bestOrders = candidate;
    }
  }

  return bestOrders;
}

// ── Auto-Submit Orders ──────────────────────────────

export async function autoSubmitBotOrders(state: GameState): Promise<void> {
  const botCountries = getBotCountries(state);
  const activePlayers = getActivePlayers(state);

  for (const country of botCountries) {
    if (!activePlayers.includes(country)) continue;
    if (state.ordersSubmitted.includes(country)) continue;

    const orders = generateBotOrders(state, country);
    const orderKey = `game:${state.postId}:orders:${state.turn.season}:${state.turn.year}:${country}`;
    await redis.set(orderKey, JSON.stringify(orders));
    state.ordersSubmitted.push(country);
  }

  await saveGameState(state);
}

// ── Retreats Phase ──────────────────────────────────

export async function autoSubmitBotRetreats(state: GameState): Promise<void> {
  const botCountries = new Set(getBotCountries(state));
  const botDislodged = state.dislodged.filter((d) => botCountries.has(d.unit.country));

  if (botDislodged.length === 0) return;

  const processedProvinces = new Set<string>();
  const retreatedTo = new Set<string>();

  for (const d of botDislodged) {
    const country = d.unit.country;
    const mySCs = new Set(getMySCs(state, country));
    const validDests = d.validDestinations.filter((dest) => !retreatedTo.has(dest));

    if (validDests.length === 0) {
      processedProvinces.add(d.from);
      continue;
    }

    // Prefer retreating to a supply center, then closest to our SCs
    const scored = validDests.map((dest) => {
      const isSC = state.supplyCenters[dest] !== undefined;
      const isOwnSC = state.supplyCenters[dest] === country;
      const dist = distanceTo(dest, mySCs, d.unit.type);
      return { dest, score: (isOwnSC ? -200 : isSC ? -100 : 0) + dist };
    });
    scored.sort((a, b) => a.score - b.score);

    const best = scored[0];
    const coast = determineCoast(d.from, best.dest);
    const newUnit: Unit = {
      type: d.unit.type,
      country: d.unit.country,
      province: best.dest,
      ...(coast ? { coast: coast as 'NC' | 'SC' | 'EC' } : {}),
    };
    state.units.push(newUnit);
    retreatedTo.add(best.dest);
    processedProvinces.add(d.from);
  }

  state.dislodged = state.dislodged.filter((d) => !processedProvinces.has(d.from));
  await saveGameState(state);
}

// ── Builds Phase ────────────────────────────────────

export async function autoSubmitBotBuilds(state: GameState): Promise<void> {
  const botCountries = new Set(getBotCountries(state));
  const botBuilds = state.builds.filter((b) => botCountries.has(b.country));

  if (botBuilds.length === 0) return;

  for (const build of botBuilds) {
    if (build.delta > 0) {
      const isNaval = NAVAL_POWERS.has(build.country);
      const enemySCSet = new Set(
        Object.entries(state.supplyCenters)
          .filter(([, owner]) => owner !== null && owner !== build.country)
          .map(([id]) => id)
      );

      const available = build.validProvinces
        .filter((prov) => !state.units.some((u) => u.province === prov))
        .map((prov) => {
          const provData = PROVINCES[prov];
          const isCoastal = provData?.type === 'coastal';
          return { prov, isCoastal, dist: distanceTo(prov, enemySCSet, 'Army') };
        })
        .sort((a, b) => a.dist - b.dist);

      let built = 0;
      for (const { prov, isCoastal } of available) {
        if (built >= build.delta) break;
        const unitType = isNaval && isCoastal ? 'Fleet' : 'Army';
        const provData = PROVINCES[prov];
        const newUnit: Unit = { type: unitType, country: build.country, province: prov };
        if (unitType === 'Fleet' && provData?.coasts) {
          newUnit.coast = provData.coasts[0] as 'NC' | 'SC' | 'EC';
        }
        state.units.push(newUnit);
        built++;
      }
    } else if (build.delta < 0) {
      const enemySCSet = new Set(
        Object.entries(state.supplyCenters)
          .filter(([, owner]) => owner !== null && owner !== build.country)
          .map(([id]) => id)
      );

      const countryUnits = state.units
        .filter((u) => u.country === build.country)
        .map((u) => ({ unit: u, dist: distanceTo(u.province, enemySCSet, u.type, u.coast) }))
        .sort((a, b) => b.dist - a.dist);

      let toDisband = Math.abs(build.delta);
      for (const { unit } of countryUnits) {
        if (toDisband <= 0) break;
        state.units = state.units.filter((u) => u !== unit);
        toDisband--;
      }
    }
  }

  state.builds = state.builds.filter((b) => !botCountries.has(b.country));
  await saveGameState(state);
}
