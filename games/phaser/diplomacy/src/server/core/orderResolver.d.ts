import type { GameState, RetreatOption } from '../../shared/types/game';
import type { Order, OrderResult } from '../../shared/types/orders';
/**
 * Resolve a set of orders for one turn.
 * Returns the results and list of dislodged units.
 */
export declare function resolveOrders(gameState: GameState, allOrders: Record<string, Order[]>): {
    results: OrderResult[];
    dislodged: RetreatOption[];
    log: string[];
};
/**
 * Apply resolved orders to the game state.
 * Moves successful units, removes dislodged units (they go to retreat phase).
 */
export declare function applyResults(gameState: GameState, results: OrderResult[], dislodged: RetreatOption[]): void;
