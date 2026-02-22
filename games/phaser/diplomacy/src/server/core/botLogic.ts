import { redis } from '@devvit/web/server';
import type { GameState, Country, PlayerInfo } from '../../shared/types/game';
import { ALL_COUNTRIES, COUNTRY_NAMES } from '../../shared/types/game';
import type { Order, HoldOrder } from '../../shared/types/orders';
import { saveGameState, getActivePlayers } from './gameState';

export function isBot(player: PlayerInfo): boolean {
  return player.userId.startsWith('bot:');
}

export function getBotCountries(state: GameState): Country[] {
  return state.players.filter((p) => isBot(p)).map((p) => p.country);
}

/**
 * Fill all unclaimed country slots with bot players.
 */
export function fillBots(state: GameState): void {
  const takenCountries = new Set(state.players.map((p) => p.country));

  for (const country of ALL_COUNTRIES) {
    if (takenCountries.has(country)) continue;

    const player: PlayerInfo = {
      userId: `bot:${country.toLowerCase()}`,
      username: `Bot (${COUNTRY_NAMES[country]})`,
      country,
    };
    state.players.push(player);
  }
}

/**
 * Generate hold orders for all of a bot's units.
 */
function generateBotOrders(state: GameState, country: Country): Order[] {
  const orders: Order[] = [];
  const units = state.units.filter((u) => u.country === country);

  for (const unit of units) {
    const holdOrder: HoldOrder = {
      type: 'hold',
      country,
      unitType: unit.type,
      province: unit.province,
    };
    orders.push(holdOrder);
  }

  return orders;
}

/**
 * Auto-submit orders for all bots that haven't submitted yet.
 */
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

/**
 * Auto-submit retreat decisions for all bots (disband everything).
 */
export async function autoSubmitBotRetreats(state: GameState): Promise<void> {
  const botCountries = new Set(getBotCountries(state));
  const botDislodged = state.dislodged.filter((d) => botCountries.has(d.unit.country));

  if (botDislodged.length === 0) return;

  // Bots disband all dislodged units
  const processedProvinces = new Set<string>();
  for (const d of botDislodged) {
    processedProvinces.add(d.from);
  }

  state.dislodged = state.dislodged.filter(
    (d) => !processedProvinces.has(d.from)
  );

  await saveGameState(state);
}

/**
 * Auto-submit build/disband decisions for all bots.
 */
export async function autoSubmitBotBuilds(state: GameState): Promise<void> {
  const botCountries = new Set(getBotCountries(state));
  const botBuilds = state.builds.filter((b) => botCountries.has(b.country));

  if (botBuilds.length === 0) return;

  for (const build of botBuilds) {
    if (build.delta > 0) {
      // Build armies at available home SCs
      let built = 0;
      for (const prov of build.validProvinces) {
        if (built >= build.delta) break;
        const occupied = state.units.some((u) => u.province === prov);
        if (!occupied) {
          state.units.push({
            type: 'Army',
            country: build.country,
            province: prov,
          });
          built++;
        }
      }
    } else if (build.delta < 0) {
      // Disband units (remove from the end of the list)
      let toDisband = Math.abs(build.delta);
      const countryUnits = state.units.filter((u) => u.country === build.country);
      for (let i = countryUnits.length - 1; i >= 0 && toDisband > 0; i--) {
        state.units = state.units.filter((u) => u !== countryUnits[i]);
        toDisband--;
      }
    }
  }

  // Remove bot builds from pending
  state.builds = state.builds.filter((b) => !botCountries.has(b.country));

  await saveGameState(state);
}
