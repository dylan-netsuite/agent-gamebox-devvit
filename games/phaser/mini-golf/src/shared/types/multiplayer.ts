export interface PlayerInfo {
  id: number;
  name: string;
  color: number;
  colorHex: string;
}

export interface MultiplayerConfig {
  players: PlayerInfo[];
}

export interface MultiplayerScores {
  [playerId: number]: number[];
}

export const PLAYER_COLORS: { fill: number; hex: string }[] = [
  { fill: 0xff6b6b, hex: '#FF6B6B' },
  { fill: 0x4ecdc4, hex: '#4ECDC4' },
  { fill: 0xffe66d, hex: '#FFE66D' },
  { fill: 0xa78bfa, hex: '#A78BFA' },
];

export const DEFAULT_PLAYER_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];

export function getHolesPlayed(scores: MultiplayerScores): number {
  const lengths = Object.values(scores).map(s => s.length);
  return lengths.length > 0 ? Math.max(...lengths) : 0;
}

export function createMultiplayerConfig(playerCount: number, names?: string[]): MultiplayerConfig {
  const players: PlayerInfo[] = [];
  for (let i = 0; i < playerCount; i++) {
    const c = PLAYER_COLORS[i]!;
    players.push({
      id: i,
      name: names?.[i] || DEFAULT_PLAYER_NAMES[i]!,
      color: c.fill,
      colorHex: c.hex,
    });
  }
  return { players };
}
