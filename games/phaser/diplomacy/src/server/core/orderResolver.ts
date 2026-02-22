import type { Unit, GameState, RetreatOption } from '../../shared/types/game';
import type { Order, MoveOrder, SupportOrder, OrderResult } from '../../shared/types/orders';
import { ADJACENCIES, isAdjacent, determineCoast, getValidMoves } from '../../shared/data/adjacencies';
import { PROVINCES } from '../../shared/data/provinces';

interface ResolutionState {
  orders: Map<string, Order>;
  units: Map<string, Unit>;
  results: Map<string, OrderResult>;
  dislodged: Map<string, string>; // province -> dislodged from (attacker's origin)
  cutSupports: Set<string>;
}

/**
 * Resolve a set of orders for one turn.
 * Returns the results and list of dislodged units.
 */
export function resolveOrders(
  gameState: GameState,
  allOrders: Record<string, Order[]>
): { results: OrderResult[]; dislodged: RetreatOption[]; log: string[] } {
  const log: string[] = [];
  const rs: ResolutionState = {
    orders: new Map(),
    units: new Map(),
    results: new Map(),
    dislodged: new Map(),
    cutSupports: new Set(),
  };

  // Index units by province
  for (const unit of gameState.units) {
    rs.units.set(unit.province, unit);
  }

  // Collect all orders; default to hold for units without orders
  for (const unit of gameState.units) {
    const country = unit.country;
    const countryOrders = allOrders[country] ?? [];
    const order = countryOrders.find((o) => o.province === unit.province);

    if (order) {
      rs.orders.set(unit.province, order);
    } else {
      rs.orders.set(unit.province, {
        type: 'hold',
        country,
        unitType: unit.type,
        province: unit.province,
      });
    }
  }

  // Phase 1: Validate orders
  validateOrders(rs, log);

  // Phase 2: Cut supports
  cutSupports(rs);

  // Phase 3: Resolve moves
  resolveMoves(rs, log);

  // Phase 4: Determine dislodged units and retreat options
  const dislodged = determineDislodged(rs, gameState);

  // Compile results
  const results: OrderResult[] = [];
  for (const [province, order] of rs.orders) {
    const result = rs.results.get(province);
    results.push(result ?? { order, success: true });
  }

  return { results, dislodged, log };
}

function validateOrders(rs: ResolutionState, log: string[]): void {
  for (const [province, order] of rs.orders) {
    const unit = rs.units.get(province);
    if (!unit) {
      rs.orders.set(province, {
        type: 'hold',
        country: order.country,
        unitType: order.unitType,
        province,
      });
      continue;
    }

    if (order.type === 'move') {
      const valid = isAdjacent(province, order.destination, unit.type, unit.coast);
      if (!valid) {
        log.push(`Invalid move: ${unit.type} ${province} -> ${order.destination}`);
        rs.orders.set(province, {
          type: 'hold',
          country: order.country,
          unitType: order.unitType,
          province,
        });
        rs.results.set(province, {
          order,
          success: false,
          reason: 'Invalid move destination',
        });
      }
    }

    if (order.type === 'support') {
      const canReach = canUnitReach(unit, order.supportedDestination ?? order.supportedProvince);
      if (!canReach) {
        log.push(`Invalid support: ${unit.type} ${province} cannot reach target`);
        rs.orders.set(province, {
          type: 'hold',
          country: order.country,
          unitType: order.unitType,
          province,
        });
        rs.results.set(province, {
          order,
          success: false,
          reason: 'Supporting unit cannot reach target province',
        });
      }
    }

    if (order.type === 'convoy') {
      if (unit.type !== 'Fleet') {
        rs.orders.set(province, {
          type: 'hold',
          country: order.country,
          unitType: order.unitType,
          province,
        });
        rs.results.set(province, {
          order,
          success: false,
          reason: 'Only fleets can convoy',
        });
      }
      const prov = PROVINCES[province];
      if (prov && prov.type !== 'water') {
        rs.orders.set(province, {
          type: 'hold',
          country: order.country,
          unitType: order.unitType,
          province,
        });
        rs.results.set(province, {
          order,
          success: false,
          reason: 'Fleet must be in water to convoy',
        });
      }
    }
  }
}

function canUnitReach(unit: Unit, target: string): boolean {
  const adj = ADJACENCIES[unit.province];
  if (!adj) return false;

  if (unit.type === 'Army') {
    return adj.army.includes(target);
  }

  if (adj.coastFleet && unit.coast) {
    const coastAdj = adj.coastFleet[unit.coast];
    return coastAdj ? coastAdj.includes(target) : false;
  }
  return adj.fleet.includes(target);
}

function cutSupports(rs: ResolutionState): void {
  for (const [province, order] of rs.orders) {
    if (order.type !== 'support') continue;

    const supportTarget = (order as SupportOrder).supportedDestination ??
      (order as SupportOrder).supportedProvince;

    // Check if any move order targets this supporting unit's province
    for (const [attackerProvince, attackerOrder] of rs.orders) {
      if (attackerOrder.type !== 'move') continue;
      if ((attackerOrder as MoveOrder).destination !== province) continue;

      // Support is NOT cut if the attack comes from the province being supported into
      if (attackerProvince === supportTarget) continue;

      // Support is cut
      rs.cutSupports.add(province);
      break;
    }
  }
}

function getAttackStrength(
  province: string,
  destination: string,
  rs: ResolutionState
): number {
  let strength = 1;

  for (const [supProvince, supOrder] of rs.orders) {
    if (supOrder.type !== 'support') continue;
    if (rs.cutSupports.has(supProvince)) continue;

    const support = supOrder as SupportOrder;
    if (
      support.supportedProvince === province &&
      support.supportedDestination === destination
    ) {
      strength++;
    }
  }

  return strength;
}

function getDefendStrength(province: string, rs: ResolutionState): number {
  const order = rs.orders.get(province);
  if (!order) return 0;

  // A unit that is moving away has 0 defense strength at its origin
  if (order.type === 'move') return 0;

  let strength = 1;

  for (const [supProvince, supOrder] of rs.orders) {
    if (supOrder.type !== 'support') continue;
    if (rs.cutSupports.has(supProvince)) continue;

    const support = supOrder as SupportOrder;
    if (
      support.supportedProvince === province &&
      !support.supportedDestination
    ) {
      strength++;
    }
  }

  return strength;
}

function getHoldStrength(province: string, rs: ResolutionState): number {
  if (!rs.units.has(province)) return 0;

  const order = rs.orders.get(province);
  if (!order) return 0;
  if (order.type === 'move') return 0;

  return getDefendStrength(province, rs);
}

function resolveMoves(rs: ResolutionState, log: string[]): void {
  // Group moves by destination
  const movesByDest = new Map<string, string[]>();

  for (const [province, order] of rs.orders) {
    if (order.type !== 'move') continue;
    const dest = (order as MoveOrder).destination;
    const existing = movesByDest.get(dest) ?? [];
    existing.push(province);
    movesByDest.set(dest, existing);
  }

  // Resolve each contested destination
  for (const [dest, attackers] of movesByDest) {
    const holdStrength = getHoldStrength(dest, rs);

    // Calculate attack strengths
    const attacks = attackers.map((prov) => ({
      province: prov,
      strength: getAttackStrength(prov, dest, rs),
    }));

    // Sort by strength descending
    attacks.sort((a, b) => b.strength - a.strength);

    const strongest = attacks[0]!;
    const secondStrength =
      attacks.length > 1 ? attacks[1]!.strength : 0;

    // Check if the province being attacked has a unit moving out
    const defenderOrder = rs.orders.get(dest);
    const defenderMovingOut = defenderOrder?.type === 'move';

    // Head-to-head battle: if defender is moving to attacker's province
    let headToHead = false;
    if (
      defenderOrder?.type === 'move' &&
      (defenderOrder as MoveOrder).destination === strongest.province
    ) {
      headToHead = true;
    }

    if (attacks.length === 1) {
      // Single attacker vs defender
      if (headToHead) {
        // Head to head: both need to beat each other
        const defAttackStr = getAttackStrength(
          dest,
          strongest.province,
          rs
        );
        if (
          strongest.strength > defAttackStr &&
          strongest.strength > holdStrength
        ) {
          // Attacker wins the head-to-head
          markMoveSuccess(strongest.province, dest, rs, log);
          markMoveFailed(dest, rs, log, 'Lost head-to-head');
        } else if (defAttackStr > strongest.strength) {
          // Defender wins head-to-head (will be resolved when processing that destination)
          markMoveFailed(strongest.province, rs, log, 'Lost head-to-head');
        } else {
          // Neither can advance - standoff
          markMoveFailed(strongest.province, rs, log, 'Head-to-head standoff');
          markMoveFailed(dest, rs, log, 'Head-to-head standoff');
        }
      } else if (defenderMovingOut) {
        // Defender is moving to a different province
        // Attacker just needs strength > 0 (which it always has)
        // But if defender's move fails, defender is still there
        // We'll handle this in a second pass
        if (strongest.strength > holdStrength) {
          markMoveSuccess(strongest.province, dest, rs, log);
        } else {
          markMoveFailed(
            strongest.province,
            rs,
            log,
            'Not enough strength'
          );
        }
      } else {
        // Normal attack vs hold
        if (strongest.strength > holdStrength) {
          markMoveSuccess(strongest.province, dest, rs, log);
          markDislodged(dest, strongest.province, rs);
        } else {
          markMoveFailed(
            strongest.province,
            rs,
            log,
            `Held (attack ${strongest.strength} vs defense ${holdStrength})`
          );
        }
      }
    } else {
      // Multiple attackers - standoff if top two are equal
      if (strongest.strength > secondStrength && strongest.strength > holdStrength) {
        markMoveSuccess(strongest.province, dest, rs, log);
        if (!defenderMovingOut && rs.units.has(dest)) {
          markDislodged(dest, strongest.province, rs);
        }
        // All other attackers fail
        for (let i = 1; i < attacks.length; i++) {
          markMoveFailed(attacks[i]!.province, rs, log, 'Outgunned in standoff');
        }
      } else {
        // Standoff - nobody moves
        for (const attack of attacks) {
          markMoveFailed(
            attack.province,
            rs,
            log,
            `Standoff at ${dest} (strength ${attack.strength})`
          );
        }
      }
    }
  }

  // Mark all non-move orders as successful (if not already marked)
  for (const [province, order] of rs.orders) {
    if (!rs.results.has(province)) {
      rs.results.set(province, { order, success: true });
    }
  }

  // Second pass: handle failed moves that block other moves
  resolveChainedMoves(rs, log);
}

function resolveChainedMoves(rs: ResolutionState, _chainLog: string[]): void {
  // If a move succeeded to a province where a unit was supposed to move out,
  // but that unit's move failed, we have a problem. The unit is still there
  // and gets dislodged.
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 20) {
    changed = false;
    iterations++;

    for (const [province, result] of rs.results) {
      if (!result.success) continue;
      if (result.order.type !== 'move') continue;

      const dest = (result.order as MoveOrder).destination;
      const destResult = rs.results.get(dest);

      if (destResult && destResult.order.type === 'move' && !destResult.success) {
        // Unit at dest tried to move but failed - it's still there
        // Check if the attacker was strong enough to dislodge
        const attackStr = getAttackStrength(province, dest, rs);
        const holdStr = 1; // Unit holding (failed move counts as hold with strength 1)

        if (attackStr > holdStr && !rs.dislodged.has(dest)) {
          markDislodged(dest, province, rs);
          changed = true;
        } else if (attackStr <= holdStr) {
          // Actually, the move should have failed
          rs.results.set(province, {
            order: result.order,
            success: false,
            reason: 'Blocked by unit that failed to move',
          });
          changed = true;
        }
      }
    }
  }
}

function markMoveSuccess(
  from: string,
  to: string,
  rs: ResolutionState,
  log: string[]
): void {
  const order = rs.orders.get(from);
  if (!order) return;
  if (rs.results.has(from)) return;

  rs.results.set(from, { order, success: true });
  log.push(`${order.unitType} ${from} -> ${to} succeeds`);
}

function markMoveFailed(
  province: string,
  rs: ResolutionState,
  log: string[],
  reason: string
): void {
  const order = rs.orders.get(province);
  if (!order) return;
  if (rs.results.has(province)) return;

  rs.results.set(province, { order, success: false, reason });
  log.push(`${order.unitType} ${province} fails: ${reason}`);
}

function markDislodged(province: string, from: string, rs: ResolutionState): void {
  rs.dislodged.set(province, from);
}

function determineDislodged(
  rs: ResolutionState,
  _gameState: GameState
): RetreatOption[] {
  const retreats: RetreatOption[] = [];

  for (const [province, attackerFrom] of rs.dislodged) {
    const unit = rs.units.get(province);
    if (!unit) continue;

    // Find valid retreat destinations
    const adj = ADJACENCIES[province];
    if (!adj) continue;

    const moveList = getValidMoves(province, unit.type, unit.coast);
    const validDests = moveList.filter((dest) => {
      // Can't retreat to the province the attacker came from
      if (dest === attackerFrom) return false;

      // Can't retreat to an occupied province
      const occupied = isOccupiedAfterResolution(dest, rs);
      if (occupied) return false;

      // Can't retreat to a province where a standoff occurred
      const standoff = wasStandoffAt(dest, rs);
      if (standoff) return false;

      return true;
    });

    retreats.push({
      unit: { ...unit },
      from: province,
      validDestinations: validDests,
    });
  }

  return retreats;
}

function isOccupiedAfterResolution(province: string, rs: ResolutionState): boolean {
  // Check if a unit successfully moved to this province
  for (const [, result] of rs.results) {
    if (
      result.success &&
      result.order.type === 'move' &&
      (result.order as MoveOrder).destination === province
    ) {
      return true;
    }
  }

  // Check if a unit is still there (didn't move out or wasn't dislodged)
  if (rs.units.has(province) && !rs.dislodged.has(province)) {
    const order = rs.orders.get(province);
    if (order?.type !== 'move') return true;

    const result = rs.results.get(province);
    if (result && !result.success) return true;
  }

  return false;
}

function wasStandoffAt(province: string, rs: ResolutionState): boolean {
  let failedMoves = 0;
  for (const [_from, result] of rs.results) {
    if (
      !result.success &&
      result.order.type === 'move' &&
      (result.order as MoveOrder).destination === province &&
      (result.reason?.includes('standoff') || result.reason?.includes('Standoff'))
    ) {
      failedMoves++;
    }
  }
  return failedMoves >= 2;
}

/**
 * Apply resolved orders to the game state.
 * Moves successful units, removes dislodged units (they go to retreat phase).
 */
export function applyResults(
  gameState: GameState,
  results: OrderResult[],
  dislodged: RetreatOption[]
): void {
  const dislodgedProvinces = new Set(dislodged.map((d) => d.from));

  // Process successful moves
  for (const result of results) {
    if (!result.success) continue;
    if (result.order.type !== 'move') continue;

    const move = result.order as MoveOrder;
    const unit = gameState.units.find((u) => u.province === move.province);
    if (unit) {
      unit.province = move.destination;
      // Update coast for multi-coast provinces
      const coast = move.coast ?? determineCoast(move.province, move.destination);
      if (coast) {
        unit.coast = coast as 'NC' | 'SC' | 'EC';
      } else {
        delete unit.coast;
      }
    }
  }

  // Remove dislodged units from the board (they'll be handled in retreat phase)
  gameState.units = gameState.units.filter(
    (u) => !dislodgedProvinces.has(u.province)
  );
}
