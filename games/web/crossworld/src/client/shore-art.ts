import { SANDY_SHORE, type WorldDefinition } from "../shared/worlds";
import { hedgeCovers, hedgeLanterns } from "./hedge-art";
import { coastCovers } from "./coast-art";
import { readPreference, writePreference } from "./preferences";
export function createShoreArt(world: WorldDefinition = SANDY_SHORE) {
  const art = document.getElementById("scenery")!;
  // The scenery shares the tile grid's coordinate space at 100 units per cell,
  // so it follows each world's own row and column count.
  const width = world.cols * 100,
    height = world.rows * 100;
  const hedge = world.motif === "hedge";
  const covers = hedge ? hedgeCovers : coastCovers(world);
  art.setAttribute("viewBox", `0 0 ${width} ${height}`);
  art.innerHTML = `<defs><mask id="clear-tiles"><rect width="${width}" height="${height}" fill="white"/><g id="tile-mask"></g></mask></defs><g mask="url(#clear-tiles)">${covers.map((svg, i) => `<g class="cover" data-cover="${i}">${svg}</g>`).join("")}</g>${hedge ? hedgeLanterns : ""}`;
  const motion = document.getElementById("motion") as HTMLButtonElement;
  const sound = document.getElementById("sound") as HTMLButtonElement;
  const theme = document.getElementById("theme") as HTMLButtonElement;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  let paused = readPreference("motion") === "paused",
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
    writePreference("motion", paused ? "paused" : "on");
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
  if (readPreference("theme") === "dark")
    document.documentElement.classList.add("dark");
  const syncTheme = () =>
    theme.setAttribute(
      "aria-label",
      document.documentElement.classList.contains("dark")
        ? "Switch to light theme"
        : "Switch to dark theme",
    );
  syncTheme();
  theme.addEventListener("click", () => {
    const dark = document.documentElement.classList.toggle("dark");
    writePreference("theme", dark ? "dark" : "light");
    syncTheme();
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
      completed = 0,
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
      art
        .querySelectorAll<SVGGElement>("[data-lantern]")
        .forEach((node, i) => node.classList.toggle("lit", i < completed));
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
