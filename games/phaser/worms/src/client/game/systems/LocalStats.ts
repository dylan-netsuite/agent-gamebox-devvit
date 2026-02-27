const STORAGE_KEY = 'worms_local_stats';

export interface LocalPlayerStats {
  wins: number;
  losses: number;
  gamesPlayed: number;
  killsTotal: number;
}

function empty(): LocalPlayerStats {
  return { wins: 0, losses: 0, gamesPlayed: 0, killsTotal: 0 };
}

export class LocalStats {
  static load(): LocalPlayerStats {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return empty();
      const parsed = JSON.parse(raw) as Partial<LocalPlayerStats>;
      return {
        wins: parsed.wins ?? 0,
        losses: parsed.losses ?? 0,
        gamesPlayed: parsed.gamesPlayed ?? 0,
        killsTotal: parsed.killsTotal ?? 0,
      };
    } catch {
      return empty();
    }
  }

  private static save(stats: LocalPlayerStats): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // localStorage may be unavailable
    }
  }

  static recordWin(): void {
    const s = this.load();
    s.wins++;
    s.gamesPlayed++;
    this.save(s);
  }

  static recordLoss(): void {
    const s = this.load();
    s.losses++;
    s.gamesPlayed++;
    this.save(s);
  }

  static addKills(count: number): void {
    if (count <= 0) return;
    const s = this.load();
    s.killsTotal += count;
    this.save(s);
  }
}
