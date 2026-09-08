// Intentionally spare, editable vector placeholders for the owner's future artwork.
const covers = [
  `<path d="M95 152q55-75 112 0-43 19-112 0m-41 106q112-100 226 0-112 37-226 0" fill="#e7d697"/><path d="M120 138q30-19 57 0M100 241q64-28 116-2" fill="none" stroke="#f7e9b8" stroke-width="5" stroke-linecap="round"/>`,
  `<path d="M324 154q60-22 83 44t-17 92q37 74-12 150t-167 6q-51-57 31-79l61-29q-19-48 10-76-28-68 11-108" fill="#bbdcd0"/><path d="M335 196q19-14 38 3m-55 191q31 13 58-3m-150 30 48 2" stroke="#e9efcc" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  `<path d="M203 622q-52-49-27-100 54 29 27 100m61 104q-8-73 43-98 14 60-43 98m-32 148q-57-28-45-70 55 7 45 70" fill="#d8daa7"/><path d="M75 554q68-47 111 3m112 0q74-44 133 1M237 635q-31-44-22-68m31 93q25-31 25-68m-20 177q-29-28-23-65m18 88q35-30 30-76" fill="none" stroke="#96b496" stroke-width="8" stroke-linecap="round"/>`,
  `<path d="M48 659q-39-18-29-61t65-14q33 34-36 75m-17 122q-49-19-15-51t66-15q41 42-51 66m28 144q-60 9-52-47t62-15q41 35-10 62m95-205q-37-5-32-35t43-13q27 33-11 48" fill="#dcb8a0"/><path d="M33 605l16 35m-27 96 26 28m-15 109 22 37m82-220 15 17" fill="none" stroke="#f8e3b8" stroke-width="4" stroke-linecap="round"/>`,
  `<path d="M435 584q41-21 51 19t-18 67q-39 16-42-28t9-58m1 151q-14-28 8-37t35 19q12 29-7 44t-36-26m-11 118q5-46 44-35t22 63q-35 40-66-28M309 935q36-31 62-2t-10 48q-51 8-52-46m-120-14q39-9 54 24t-35 36q-50-4-19-60M80 950q24-28 51-9t2 36q-27 11-53-27" fill="#cec7b0"/><path d="M444 606q17-8 23 10m-23 225 29 4m-150 104 31-3" fill="none" stroke="#e8dfc1" stroke-width="4" stroke-linecap="round"/>`,
];
export function createShoreArt() {
  const art = document.getElementById("scenery")!;
  art.innerHTML = `<defs><mask id="clear-tiles"><rect width="500" height="1000" fill="white"/><g id="tile-mask"></g></mask></defs><g mask="url(#clear-tiles)">${covers.map((svg, i) => `<g class="cover" data-cover="${i}">${svg}</g>`).join("")}</g>`;
  const motion = document.getElementById("motion") as HTMLButtonElement;
  const sound = document.getElementById("sound") as HTMLButtonElement;
  const theme = document.getElementById("theme") as HTMLButtonElement;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  let paused = false,
    sounding = false;
  let audio: AudioContext | undefined;
  function sync() {
    const stopped = paused || preference.matches;
    document.body.dataset.paused = String(stopped || document.hidden);
    motion.setAttribute("aria-pressed", String(stopped));
    motion.textContent = stopped ? "Motion paused" : "Pause motion";
    motion.disabled = preference.matches;
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
      sound.textContent = sounding ? "Sound on" : "Sound off";
      sound.disabled = false;
    })();
  });
  sync();
  return {
    update(
      discovered: number,
      cells: { row: number; col: number }[],
      animate = false,
    ) {
      // Clear any future illustration where an earlier pair already has readable tiles.
      document.getElementById("tile-mask")!.innerHTML = cells
        .map(
          ({ row, col }) =>
            `<rect x="${col * 100 - 2}" y="${row * 100 - 2}" width="104" height="104" fill="black"/>`,
        )
        .join("");
      art.querySelectorAll<SVGGElement>("[data-cover]").forEach((node, i) => {
        node.style.transition = animate ? "" : "none";
        node.classList.toggle("discovered", i < discovered);
      });
    },
    celebrate() {
      if (!sounding || audio?.state !== "running" || document.hidden) return;
      const context = audio;
      [349.23, 440, 587.33].forEach((frequency, i) => {
        const oscillator = context.createOscillator(),
          gain = context.createGain(),
          start = context.currentTime + i * 0.14;
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.04, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.45);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
      });
    },
  };
}
