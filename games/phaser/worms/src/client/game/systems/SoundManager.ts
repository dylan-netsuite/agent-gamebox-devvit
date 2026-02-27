type SoundId =
  | 'explosion'
  | 'fire'
  | 'bounce'
  | 'damage'
  | 'turn'
  | 'gameover'
  | 'select'
  | 'jump'
  | 'death'
  | 'tick'
  | 'parachute-open'
  | 'parachute-land'
  | 'rope-fire'
  | 'rope-attach'
  | 'rope-release'
  | 'banana-fire'
  | 'dart-fire';

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

function noise(ac: AudioContext, duration: number): AudioBufferSourceNode {
  const buf = ac.createBuffer(1, ac.sampleRate * duration, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  return src;
}

export const SoundManager = {
  mute(m: boolean) {
    muted = m;
  },

  isMuted(): boolean {
    return muted;
  },

  play(id: SoundId) {
    if (muted) return;
    try {
      switch (id) {
        case 'explosion':
          this._explosion();
          break;
        case 'fire':
          this._fire();
          break;
        case 'bounce':
          this._bounce();
          break;
        case 'damage':
          this._damage();
          break;
        case 'turn':
          this._turn();
          break;
        case 'gameover':
          this._gameover();
          break;
        case 'select':
          this._select();
          break;
        case 'jump':
          this._jump();
          break;
        case 'death':
          this._death();
          break;
        case 'tick':
          this._tick();
          break;
        case 'parachute-open':
          this._parachuteOpen();
          break;
        case 'parachute-land':
          this._parachuteLand();
          break;
        case 'rope-fire':
          this._ropeFire();
          break;
        case 'rope-attach':
          this._ropeAttach();
          break;
        case 'rope-release':
          this._ropeRelease();
          break;
        case 'banana-fire':
          this._bananaFire();
          break;
        case 'dart-fire':
          this._dartFire();
          break;
      }
    } catch {
      // Audio unavailable
    }
  },

  _explosion() {
    const ac = ctx();
    const t = ac.currentTime;
    const n = noise(ac, 0.5);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.6, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(1200, t);
    f.frequency.exponentialRampToValueAtTime(80, t + 0.4);
    n.connect(f).connect(g).connect(ac.destination);
    n.start(t);
    n.stop(t + 0.5);

    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);
    const og = ac.createGain();
    og.gain.setValueAtTime(0.5, t);
    og.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    osc.connect(og).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  },

  _fire() {
    const ac = ctx();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.15);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  },

  _bounce() {
    const ac = ctx();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.08);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  },

  _damage() {
    const ac = ctx();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.setValueAtTime(200, t + 0.05);
    osc.frequency.setValueAtTime(150, t + 0.1);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  },

  _turn() {
    const ac = ctx();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.setValueAtTime(550, t + 0.08);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  },

  _gameover() {
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

  _jump() {
    const ac = ctx();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  },

  _death() {
    const ac = ctx();
    const t = ac.currentTime;
    const notes = [400, 350, 300, 200];
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + i * 0.12);
      const g = ac.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.15, t + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.01, t + i * 0.12 + 0.15);
      osc.connect(g).connect(ac.destination);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.2);
    });
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

  _parachuteOpen() {
    const ac = ctx();
    const t = ac.currentTime;
    const n = noise(ac, 0.35);
    const f = ac.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(800, t);
    f.frequency.exponentialRampToValueAtTime(2000, t + 0.2);
    f.Q.setValueAtTime(1.5, t);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
    n.connect(f).connect(g).connect(ac.destination);
    n.start(t);
    n.stop(t + 0.35);
  },

  _parachuteLand() {
    const ac = ctx();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  },

  _ropeFire() {
    const ac = ctx();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  },

  _ropeAttach() {
    const ac = ctx();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.setValueAtTime(1100, t + 0.03);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  },

  _ropeRelease() {
    const ac = ctx();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  },

  _bananaFire() {
    const ac = ctx();
    const t = ac.currentTime;
    // Squelchy pop: low sine burst + filtered noise
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);
    const og = ac.createGain();
    og.gain.setValueAtTime(0.35, t);
    og.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    osc.connect(og).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.15);

    const n = noise(ac, 0.08);
    const f = ac.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(1500, t);
    f.Q.setValueAtTime(3, t);
    const ng = ac.createGain();
    ng.gain.setValueAtTime(0.15, t);
    ng.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    n.connect(f).connect(ng).connect(ac.destination);
    n.start(t);
    n.stop(t + 0.08);
  },

  _dartFire() {
    const ac = ctx();
    const t = ac.currentTime;
    // Breathy whoosh: high-pass noise sweep
    const n = noise(ac, 0.2);
    const f = ac.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.setValueAtTime(2000, t);
    f.frequency.exponentialRampToValueAtTime(4000, t + 0.1);
    f.frequency.exponentialRampToValueAtTime(1500, t + 0.2);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    n.connect(f).connect(g).connect(ac.destination);
    n.start(t);
    n.stop(t + 0.2);
  },
};
