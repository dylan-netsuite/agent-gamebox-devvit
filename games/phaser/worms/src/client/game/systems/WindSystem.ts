/**
 * Per-turn wind system. Wind applies a constant horizontal force
 * to airborne projectiles. Value ranges from -10 (strong left) to +10 (strong right).
 */
export class WindSystem {
  private wind = 0;
  private readonly minWind = -10;
  private readonly maxWind = 10;
  private readonly forceFactor = 0.005;

  getWind(): number {
    return this.wind;
  }

  getWindForce(): number {
    return this.wind * this.forceFactor;
  }

  getWindLabel(): string {
    const abs = Math.abs(this.wind);
    if (abs < 2) return 'Calm';
    if (abs < 5) return 'Light';
    if (abs < 8) return 'Moderate';
    return 'Strong';
  }

  randomize(): void {
    this.wind =
      this.minWind + Math.random() * (this.maxWind - this.minWind);
    this.wind = Math.round(this.wind * 10) / 10;
  }

  setWind(value: number): void {
    this.wind = Math.max(this.minWind, Math.min(this.maxWind, value));
  }
}
