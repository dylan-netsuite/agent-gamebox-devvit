type SoundName = 'order' | 'submit' | 'phase' | 'chat' | 'resolve' | 'victory';

let audioCtx: AudioContext | null = null;
let muted = false;
let volume = 0.3;

function getCtx(): AudioContext | null {
  if (audioCtx) return audioCtx;
  try {
    audioCtx = new AudioContext();
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', vol = volume) {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playChord(freqs: number[], duration: number, type: OscillatorType = 'sine') {
  for (const f of freqs) playTone(f, duration, type, volume / freqs.length);
}

const sounds: Record<SoundName, () => void> = {
  order: () => {
    playTone(880, 0.08, 'square');
    setTimeout(() => playTone(1100, 0.06, 'square'), 50);
  },
  submit: () => {
    playTone(523, 0.1, 'triangle');
    setTimeout(() => playTone(659, 0.1, 'triangle'), 80);
    setTimeout(() => playTone(784, 0.15, 'triangle'), 160);
  },
  phase: () => {
    playChord([440, 554, 659], 0.3, 'sine');
  },
  chat: () => {
    playTone(1200, 0.04, 'sine');
  },
  resolve: () => {
    playTone(392, 0.15, 'triangle');
    setTimeout(() => playTone(523, 0.15, 'triangle'), 120);
    setTimeout(() => playTone(659, 0.2, 'triangle'), 240);
    setTimeout(() => playTone(784, 0.3, 'triangle'), 380);
  },
  victory: () => {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      setTimeout(() => playTone(f, 0.25, 'triangle'), i * 200);
    });
  },
};

class SoundManagerImpl {
  private controlEl: HTMLElement | null = null;

  init(_scene: Phaser.Scene) {
    if (this.controlEl) return;
    const el = document.createElement('button');
    el.id = 'sound-toggle';
    el.textContent = muted ? '🔇' : '🔊';
    el.title = 'Toggle sound';
    el.onclick = () => {
      muted = !muted;
      el.textContent = muted ? '🔇' : '🔊';
    };
    const app = document.getElementById('app') ?? document.body;
    app.appendChild(el);
    this.controlEl = el;
  }

  play(name: SoundName) {
    sounds[name]?.();
  }

  setVolume(v: number) {
    volume = Math.max(0, Math.min(1, v));
  }

  destroy() {
    this.controlEl?.remove();
    this.controlEl = null;
  }
}

export const SoundManager = new SoundManagerImpl();
