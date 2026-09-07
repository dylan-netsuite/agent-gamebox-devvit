// Small, replaceable illustrations. None are mounted before a path is accepted.
const illustrations = [
  `<g data-world="leaves" fill="none" stroke="#587253" stroke-width="2"><path d="M136 185q-11-35-3-52m-1 31q-25-12-25-31m26 18q25-8 22-29"/><path fill="#91a77b" stroke="none" d="M133 149q-22-6-23-26 25 0 23 26m2-4q1-25 25-24-2 22-25 24m-4 30q-25 1-30-20 28-3 30 20"/><path fill="#b89a79" stroke="none" d="M119 181q10-9 22-1l-3 6-24 1z"/><circle cx="118" cy="134" r="1" fill="#304a40"/><circle cx="147" cy="130" r="1" fill="#304a40"/></g>`,
  `<g data-world="pool"><path d="M310 108c30-10 60 3 54 23s-47 34-64 14-12-26 10-37" fill="#9abcb4"/><path d="M305 125q22-12 44-3m-30 14q16 3 24-4" fill="none" stroke="#dce6d7" stroke-width="2" stroke-linecap="round"/><path d="M351 104q-7-13-2-24m2 24q8-9 9-20" fill="none" stroke="#637d56" stroke-width="2"/><ellipse cx="303" cy="147" rx="12" ry="5" fill="#bac0a2"/><path d="M327 111q6-11 14-3l-7 5z" fill="#718c64"/></g>`,
  `<g data-world="gate" transform="translate(0 55)" fill="none" stroke-linecap="round"><path d="M112 360l-5-39q23-34 49-3l-4 43" stroke="#839477" stroke-width="9"/><path d="M120 357l-4-32q16-21 31-4l-2 37m-28-15 29-3m-16-22 1 39" stroke="#a57e5b" stroke-width="3"/><path d="M93 366q17-12 27-3m24 1q17-9 23 0" stroke="#637d56" stroke-width="3"/><path d="M155 328q16-7 13-18-13 1-13 18" fill="#91a77b" stroke="none"/></g>`,
];
export function createGarden() {
  const art = document.getElementById("scenery")!;
  const motion = document.getElementById("motion") as HTMLButtonElement;
  const sound = document.getElementById("sound") as HTMLButtonElement;
  const theme = document.getElementById("theme") as HTMLButtonElement;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  let count = 0,
    paused = false,
    sounding = false;
  let audio: AudioContext | undefined;
  function sync() {
    const stopped = paused || preference.matches;
    document.body.dataset.paused = String(stopped || document.hidden);
    motion.setAttribute("aria-pressed", String(stopped));
    motion.setAttribute(
      "aria-label",
      stopped ? "Resume animations" : "Pause animations",
    );
    motion.disabled = preference.matches;
    motion.title = preference.matches
      ? "Reduced motion enabled"
      : stopped
        ? "Resume animations"
        : "Pause animations";
  }
  motion.addEventListener("click", () => {
    paused = !paused;
    sync();
  });
  preference.addEventListener("change", sync);
  document.addEventListener("visibilitychange", () => {
    sync();
    if (audio)
      void (
        document.hidden || !sounding ? audio.suspend() : audio.resume()
      ).catch(() => {});
  });
  theme.addEventListener("click", () => {
    const dark = document.documentElement.classList.toggle("dark");
    theme.setAttribute(
      "aria-label",
      dark ? "Switch to light theme" : "Switch to dark theme",
    );
  });
  sound.addEventListener("click", () => {
    void (async () => {
      sound.disabled = true;
      try {
        if (sounding) {
          await audio?.close();
          audio = undefined;
          sounding = false;
        } else {
          audio = new AudioContext();
          await audio.resume();
          sounding = audio.state === "running";
        }
      } catch {
        void audio?.close().catch(() => {});
        audio = undefined;
        sounding = false;
      }
      sound.setAttribute("aria-pressed", String(sounding));
      sound.title = sounding ? "Sound on" : "Sound off";
      sound.disabled = false;
    })();
  });
  sync();
  return {
    update(completed: number, celebrate = false) {
      if (count !== completed) {
        art.innerHTML = illustrations
          .slice(0, completed)
          .map(
            (svg, i) =>
              `<g class="${celebrate && i >= count ? "reveal-art" : ""}">${svg}</g>`,
          )
          .join("");
        count = completed;
      }
      if (
        celebrate &&
        sounding &&
        audio?.state === "running" &&
        !document.hidden
      ) {
        const context = audio;
        [349.23, 440, 587.33].forEach((frequency, i) => {
          const oscillator = context.createOscillator(),
            gain = context.createGain(),
            start = context.currentTime + i * 0.14;
          oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.05, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
          oscillator.connect(gain).connect(context.destination);
          oscillator.start(start);
          oscillator.stop(start + 0.55);
          oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
          };
        });
      }
    },
  };
}
