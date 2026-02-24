type SoundId = 'select' | 'tick' | 'submit' | 'reveal' | 'roundEnd' | 'gameOver' | 'correct' | 'duplicate';

let audioCtx: AudioContext | null = null;
let muted = false;

function ctx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const SoundManager = {
  mute(m: boolean) { muted = m; },
  isMuted(): boolean { return muted; },

  play(id: SoundId) {
    if (muted) return;
    try {
      switch (id) {
        case 'select': this._select(); break;
        case 'tick': this._tick(); break;
        case 'submit': this._submit(); break;
        case 'reveal': this._reveal(); break;
        case 'roundEnd': this._roundEnd(); break;
        case 'gameOver': this._gameOver(); break;
        case 'correct': this._correct(); break;
        case 'duplicate': this._duplicate(); break;
      }
    } catch { /* Audio unavailable */ }
  },

  _select() {
    const ac = ctx();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  },

  _tick() {
    const ac = ctx();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, t);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.05, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  },

  _submit() {
    const ac = ctx();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523, t);
    osc.frequency.setValueAtTime(659, t + 0.08);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  },

  _reveal() {
    const ac = ctx();
    const t = ac.currentTime;
    const notes = [440, 554, 659];
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.1);
      const g = ac.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.15, t + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.01, t + i * 0.1 + 0.2);
      osc.connect(g).connect(ac.destination);
      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.25);
    });
  },

  _roundEnd() {
    const ac = ctx();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.3);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  },

  _gameOver() {
    const ac = ctx();
    const t = ac.currentTime;
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.15);
      const g = ac.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.2, t + i * 0.15);
      g.gain.exponentialRampToValueAtTime(0.01, t + i * 0.15 + 0.3);
      osc.connect(g).connect(ac.destination);
      osc.start(t + i * 0.15);
      osc.stop(t + i * 0.15 + 0.35);
    });
  },

  _correct() {
    const ac = ctx();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523, t);
    osc.frequency.setValueAtTime(784, t + 0.06);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  },

  _duplicate() {
    const ac = ctx();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.setValueAtTime(150, t + 0.08);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  },
};
