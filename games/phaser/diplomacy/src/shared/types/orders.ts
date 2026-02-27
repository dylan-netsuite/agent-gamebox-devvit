import type { Country, UnitType } from './game';

export type OrderType = 'hold' | 'move' | 'support' | 'convoy';
export type RetreatOrderType = 'retreat' | 'disband';
export type BuildOrderType = 'build' | 'disband' | 'waive';

export interface HoldOrder {
  type: 'hold';
  country: Country;
  unitType: UnitType;
  province: string;
}

export interface MoveOrder {
  type: 'move';
  country: Country;
  unitType: UnitType;
  province: string;
  destination: string;
  coast?: 'NC' | 'SC' | 'EC';
  viaConvoy?: boolean;
}

export interface SupportOrder {
  type: 'support';
  country: Country;
  unitType: UnitType;
  province: string;
  supportedProvince: string;
  supportedDestination?: string;
}

export interface ConvoyOrder {
  type: 'convoy';
  country: Country;
  unitType: UnitType;
  province: string;
  convoyedProvince: string;
  convoyedDestination: string;
}

export type Order = HoldOrder | MoveOrder | SupportOrder | ConvoyOrder;

export interface RetreatOrder {
  type: RetreatOrderType;
  country: Country;
  unitType: UnitType;
  province: string;
  destination?: string;
  coast?: 'NC' | 'SC' | 'EC';
}

export interface BuildOrder {
  type: BuildOrderType;
  country: Country;
  unitType?: UnitType;
  province?: string;
  coast?: 'NC' | 'SC' | 'EC';
}

export interface OrderResult {
  order: Order;
  success: boolean;
  reason?: string;
}

export function formatOrder(order: Order): string {
  const prefix = `${order.unitType === 'Army' ? 'A' : 'F'} ${order.province}`;
  switch (order.type) {
    case 'hold':
      return `${prefix} Holds`;
    case 'move':
      return `${prefix} -> ${order.destination}${order.coast ? ` (${order.coast})` : ''}`;
    case 'support': {
      if (order.supportedDestination) {
        return `${prefix} S ${order.supportedProvince} -> ${order.supportedDestination}`;
      }
      return `${prefix} S ${order.supportedProvince}`;
    }
    case 'convoy':
      return `${prefix} C ${order.convoyedProvince} -> ${order.convoyedDestination}`;
  }
}
