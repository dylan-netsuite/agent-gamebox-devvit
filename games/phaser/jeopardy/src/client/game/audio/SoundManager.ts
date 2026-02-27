/**
 * Synthesizes game sounds using the Web Audio API.
 * No audio files needed -- all tones are generated programmatically.
 */
export class SoundManager {
  private ctx: AudioContext | null = null;
  private _muted = false;

  get muted(): boolean {
    return this._muted;
  }

  set muted(value: boolean) {
    this._muted = value;
  }

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private tone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.3,
    startDelay = 0,
  ): void {
    if (this._muted) return;
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    gain.gain.setValueAtTime(volume, ctx.currentTime + startDelay);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + startDelay + duration,
    );
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + startDelay);
    osc.stop(ctx.currentTime + startDelay + duration + 0.05);
  }

  /** Normal timer tick (>5s remaining) */
  tickNormal(): void {
    this.tone(440, 0.05, 'sine', 0.15);
  }

  /** Urgent timer tick (<=5s remaining) */
  tickUrgent(): void {
    this.tone(880, 0.08, 'sine', 0.25);
  }

  /** Correct answer */
  correct(): void {
    this.tone(523, 0.15, 'sine', 0.3, 0);
    this.tone(659, 0.15, 'sine', 0.3, 0.15);
  }

  /** Wrong answer */
  wrong(): void {
    this.tone(200, 0.3, 'sawtooth', 0.2);
  }

  /** Daily Double reveal */
  dailyDouble(): void {
    this.tone(523, 0.1, 'sine', 0.3, 0);
    this.tone(659, 0.1, 'sine', 0.3, 0.1);
    this.tone(784, 0.1, 'sine', 0.3, 0.2);
    this.tone(1047, 0.2, 'sine', 0.3, 0.3);
  }

  /** Time's up */
  timeUp(): void {
    if (this._muted) return;
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.4);
    gain.gain.value = 0.3;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.45);
  }

  /** Board complete / Final Jeopardy fanfare */
  fanfare(): void {
    this.tone(523, 0.2, 'sine', 0.3, 0);
    this.tone(659, 0.2, 'sine', 0.3, 0.2);
    this.tone(784, 0.2, 'sine', 0.3, 0.4);
    this.tone(1047, 0.4, 'sine', 0.35, 0.6);
  }

  /** Final Jeopardy intro tone */
  finalJeopardy(): void {
    this.tone(523, 1.0, 'sine', 0.25);
  }
}

export const soundManager = new SoundManager();
