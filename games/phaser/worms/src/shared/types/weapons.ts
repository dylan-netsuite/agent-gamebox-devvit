export type WeaponType =
  | 'bazooka'
  | 'grenade'
  | 'banana-cannon'
  | 'firecracker'
  | 'pigeon-strike'
  | 'confetti-bomb'
  | 'blow-dart'
  | 'teleport'
  | 'ninja-rope';

export type FiringMode = 'projectile' | 'hitscan' | 'placed' | 'targeted' | 'teleport' | 'rope';

export interface WeaponDef {
  id: WeaponType;
  name: string;
  blastRadius: number;
  damage: number;
  affectedByWind: boolean;
  fuse: number;
  bounces: boolean;
  description: string;
  firingMode: FiringMode;
  projectileSpeed: number;
  projectileGravity: number;
  shotCount: number;
  bounceFriction: number;
  icon: string;
  cluster?: boolean;
  clusterCount?: number;
  clusterDamage?: number;
  clusterRadius?: number;
  hitscanRange?: number;
  hitscanDriftStart?: number;
  hitscanWindMul?: number;
  hitscanSpreadMax?: number;
}

export const WEAPONS: Record<WeaponType, WeaponDef> = {
  bazooka: {
    id: 'bazooka',
    name: 'Bazooka',
    blastRadius: 40,
    damage: 45,
    affectedByWind: true,
    fuse: 0,
    bounces: false,
    description: 'A rocket affected by wind and gravity',
    firingMode: 'projectile',
    projectileSpeed: 8,
    projectileGravity: 0.12,
    shotCount: 1,
    bounceFriction: 0,
    icon: '🚀',
  },
  grenade: {
    id: 'grenade',
    name: 'Grenade',
    blastRadius: 35,
    damage: 40,
    affectedByWind: true,
    fuse: 3,
    bounces: true,
    description: 'Bounces and explodes after 3 seconds',
    firingMode: 'projectile',
    projectileSpeed: 7,
    projectileGravity: 0.15,
    shotCount: 1,
    bounceFriction: 0.5,
    icon: '💣',
  },
  'banana-cannon': {
    id: 'banana-cannon',
    name: 'Banana Cannon',
    blastRadius: 20,
    damage: 25,
    affectedByWind: false,
    fuse: 0,
    bounces: false,
    description: 'Two close-range banana blasts — devastating up close, scatters at distance',
    firingMode: 'hitscan',
    projectileSpeed: 0,
    projectileGravity: 0,
    shotCount: 2,
    bounceFriction: 0,
    icon: '🍌',
    hitscanRange: 175,
    hitscanDriftStart: 70,
    hitscanWindMul: 2,
    hitscanSpreadMax: 1.2,
  },
  firecracker: {
    id: 'firecracker',
    name: 'Firecracker',
    blastRadius: 70,
    damage: 75,
    affectedByWind: false,
    fuse: 4,
    bounces: false,
    description: 'Toss a firecracker — big sparkly boom after 4 seconds',
    firingMode: 'projectile',
    projectileSpeed: 5,
    projectileGravity: 0.18,
    shotCount: 1,
    bounceFriction: 0,
    icon: '🧨',
  },
  'pigeon-strike': {
    id: 'pigeon-strike',
    name: 'Pigeon Strike',
    blastRadius: 25,
    damage: 30,
    affectedByWind: true,
    fuse: 0,
    bounces: false,
    description: '5 pigeons dive-bomb from the sky',
    firingMode: 'targeted',
    projectileSpeed: 5,
    projectileGravity: 0.08,
    shotCount: 5,
    bounceFriction: 0,
    icon: '🐦',
  },
  'confetti-bomb': {
    id: 'confetti-bomb',
    name: 'Confetti Bomb',
    blastRadius: 20,
    damage: 20,
    affectedByWind: true,
    fuse: 2,
    bounces: true,
    description: 'Splits into 4 party poppers on detonation',
    firingMode: 'projectile',
    projectileSpeed: 7,
    projectileGravity: 0.14,
    shotCount: 1,
    bounceFriction: 0.4,
    icon: '🎊',
    cluster: true,
    clusterCount: 4,
    clusterDamage: 18,
    clusterRadius: 18,
  },
  'blow-dart': {
    id: 'blow-dart',
    name: 'Blow Dart',
    blastRadius: 8,
    damage: 50,
    affectedByWind: false,
    fuse: 0,
    bounces: false,
    description: 'Long-range dart — accurate up close, heavy drift at distance',
    firingMode: 'hitscan',
    projectileSpeed: 0,
    projectileGravity: 0,
    shotCount: 1,
    bounceFriction: 0,
    icon: '🎯',
    hitscanRange: 350,
    hitscanDriftStart: 150,
    hitscanWindMul: 10,
    hitscanSpreadMax: 1.8,
  },
  teleport: {
    id: 'teleport',
    name: 'Teleport',
    blastRadius: 0,
    damage: 0,
    affectedByWind: false,
    fuse: 0,
    bounces: false,
    description: 'Instantly teleport to the aimed location',
    firingMode: 'teleport',
    projectileSpeed: 0,
    projectileGravity: 0,
    shotCount: 0,
    bounceFriction: 0,
    icon: '⚡',
  },
  'ninja-rope': {
    id: 'ninja-rope',
    name: 'Ninja Rope',
    blastRadius: 0,
    damage: 0,
    affectedByWind: false,
    fuse: 0,
    bounces: false,
    description: 'Fire a grappling hook to swing across the map',
    firingMode: 'rope',
    projectileSpeed: 12,
    projectileGravity: 0,
    shotCount: 0,
    bounceFriction: 0,
    icon: '🪝',
  },
};

export const WEAPON_ORDER: WeaponType[] = [
  'bazooka',
  'grenade',
  'banana-cannon',
  'firecracker',
  'pigeon-strike',
  'confetti-bomb',
  'blow-dart',
  'teleport',
  'ninja-rope',
];
