export type WeaponType = 'bazooka' | 'grenade' | 'shotgun' | 'dynamite' | 'airstrike';

export type FiringMode = 'projectile' | 'hitscan' | 'placed' | 'targeted';

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
  shotgun: {
    id: 'shotgun',
    name: 'Shotgun',
    blastRadius: 15,
    damage: 25,
    affectedByWind: false,
    fuse: 0,
    bounces: false,
    description: 'Two quick hitscan shots',
    firingMode: 'hitscan',
    projectileSpeed: 0,
    projectileGravity: 0,
    shotCount: 2,
    bounceFriction: 0,
    icon: '🔫',
  },
  dynamite: {
    id: 'dynamite',
    name: 'Dynamite',
    blastRadius: 70,
    damage: 75,
    affectedByWind: false,
    fuse: 4,
    bounces: false,
    description: 'Throw a stick of dynamite — big boom after 4 seconds',
    firingMode: 'projectile',
    projectileSpeed: 5,
    projectileGravity: 0.18,
    shotCount: 1,
    bounceFriction: 0,
    icon: '🧨',
  },
  airstrike: {
    id: 'airstrike',
    name: 'Airstrike',
    blastRadius: 25,
    damage: 30,
    affectedByWind: true,
    fuse: 0,
    bounces: false,
    description: '5 missiles rain from the sky',
    firingMode: 'targeted',
    projectileSpeed: 5,
    projectileGravity: 0.08,
    shotCount: 5,
    bounceFriction: 0,
    icon: '✈️',
  },
};

export const WEAPON_ORDER: WeaponType[] = ['bazooka', 'grenade', 'shotgun', 'dynamite', 'airstrike'];
