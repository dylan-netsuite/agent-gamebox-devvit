let _ctx: AudioContext | null = null;

function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') void _ctx.resume();
  return _ctx;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.15,
  ramp: 'none' | 'down' | 'up' = 'down',
) {
  const ac = ctx();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;

  if (ramp === 'down') {
    g.gain.setValueAtTime(gain, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  } else if (ramp === 'up') {
    g.gain.setValueAtTime(0.001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(gain, ac.currentTime + duration * 0.8);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  }

  osc.connect(g).connect(ac.destination);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + duration);
}

function noise(duration: number, gain = 0.06) {
  const ac = ctx();
  const buf = ac.createBuffer(1, Math.round(ac.sampleRate * duration), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  src.connect(g).connect(ac.destination);
  src.start();
}

export const SoundManager = {
  playPlace() {
    tone(180, 0.12, 'sine', 0.2);
    tone(120, 0.15, 'sine', 0.1);
    noise(0.06, 0.04);
  },

  playRotate() {
    tone(800, 0.06, 'sine', 0.08);
  },

  playSelect() {
    tone(520, 0.08, 'sine', 0.1);
    tone(660, 0.06, 'sine', 0.06);
  },

  playInvalid() {
    tone(200, 0.12, 'square', 0.08);
    tone(160, 0.12, 'square', 0.06);
  },

  playAiMove() {
    tone(440, 0.1, 'sine', 0.06);
    setTimeout(() => tone(550, 0.1, 'sine', 0.06), 100);
  },

  playUndo() {
    tone(500, 0.15, 'sine', 0.1, 'down');
    setTimeout(() => tone(350, 0.15, 'sine', 0.08, 'down'), 60);
  },

  playGameOver(won: boolean) {
    if (won) {
      [523, 659, 784, 1047].forEach((f, i) =>
        setTimeout(() => tone(f, 0.2, 'sine', 0.12), i * 120),
      );
    } else {
      [400, 350, 300, 250].forEach((f, i) =>
        setTimeout(() => tone(f, 0.25, 'sine', 0.1), i * 140),
      );
    }
  },

  playPass() {
    tone(250, 0.1, 'triangle', 0.06);
  },
};
