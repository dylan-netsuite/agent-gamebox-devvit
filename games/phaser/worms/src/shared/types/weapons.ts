export interface WeaponDef {
  id: string;
  name: string;
  blastRadius: number;
  damage: number;
  affectedByWind: boolean;
  fuse: number;
  bounces: boolean;
  description: string;
}

export const WEAPONS: Record<string, WeaponDef> = {
  bazooka: {
    id: 'bazooka',
    name: 'Bazooka',
    blastRadius: 40,
    damage: 45,
    affectedByWind: true,
    fuse: 0,
    bounces: false,
    description: 'A rocket affected by wind and gravity',
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
  },
  dynamite: {
    id: 'dynamite',
    name: 'Dynamite',
    blastRadius: 70,
    damage: 75,
    affectedByWind: false,
    fuse: 5,
    bounces: false,
    description: 'Place at your feet for a massive explosion',
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
  },
};
