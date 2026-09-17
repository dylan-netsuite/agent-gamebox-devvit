import { SANDY_SHORE, type WorldDefinition } from "../shared/worlds";
import { hedgeCovers, hedgeLanterns } from "./hedge-art";
import { readPreference, writePreference } from "./preferences";
// Intentionally spare, editable vector placeholders for the owner's future artwork.
const covers = [
  `<g fill="none" stroke="#b29b65" stroke-width="1.5" stroke-linecap="round">
    <path d="M60 228q76-106 174-23t91 21M32 251q117-86 242 13M84 283q72-37 136-1"/>
    <path d="M113 92q49-51 99 4M96 113q68-53 137 11M130 131q39-23 66-1"/>
    <path d="M64 205q47-49 83-28M219 153q15 9 24 21" opacity=".5"/>
    <path d="M80 309h12m145-7h7m-75-118h6M104 62h5"/>
   </g><path d="M60 228q76-106 174-23t91 21q-105 54-265 2" fill="#dac68c" opacity=".22"/>`,
  `<path d="M330 137c73-22 118 60 88 109-19 31-30 51-22 94 20 84-72 139-158 109-45-16-71-58-28-77 37-17 71-7 84-45 18-49-5-69-8-103-3-41 18-78 44-87Z" fill="#c2ddd0" stroke="#83b5a4" stroke-width="1.5"/>
   <g fill="none" stroke="#83b5a4" stroke-width="1.3"><path d="M338 158c47-19 76 43 60 74-29 55-31 51-22 117 9 66-68 89-115 68-25-11-29-23-5-29 48-10 57-16 64-67 7-57-35-126 18-163Z"/><path d="M344 180q33-9 35 24m-90 197q46 5 70-27"/><path d="M359 261h22m-36 6h14m-117 141h23" stroke="#fffdf2" stroke-width="3"/></g>
   <g fill="#b29b65"><circle cx="418" cy="294" r="2"/><circle cx="435" cy="280" r="1.5"/><circle cx="267" cy="460" r="2"/></g>`,
  `<g fill="none" stroke="#819d77" stroke-width="2" stroke-linecap="round">
    <path d="M202 593q-40-76-30-114m30 114q20-77 58-97m-58 97q-8-55 5-87M258 798q-45-56-36-101m36 101q-3-92 41-118m-41 118q-18-27-42-29M254 949q-39-59-29-104m29 104q23-55 14-101"/>
    <path d="M172 479q-11 55 18 81m70-64q-40 2-48 58M222 697q-16 45 21 62m56-79q-49 2-42 67M225 845q-32 37 20 70" fill="#bac6a0"/>
    <path d="M40 551q70-36 130 0m140 11q74-34 135-9" stroke="#c1bb91"/>
   </g>`,
  `<defs><g id="shore-shell"><path d="M0 27C-47 7-44-22-29-28c9-14 22-9 29-2 9-14 23-14 29 0C52-28 48 5 0 27Z" fill="#e9cbb0" stroke="#b8886c" stroke-width="1.5"/><path d="M0 27-29-28M0 27 0-30M0 27 29-30M0 27-16-34M0 27 17-35" fill="none" stroke="#b8886c" stroke-width="1"/><path d="M-8 25h16" stroke="#b8886c" stroke-width="3"/></g></defs>
   <use href="#shore-shell" transform="translate(59 648) rotate(-26)"/><use href="#shore-shell" transform="translate(38 771) rotate(20) scale(.82)"/><use href="#shore-shell" transform="translate(60 911) rotate(-30) scale(.75)"/><use href="#shore-shell" transform="translate(158 756) rotate(15) scale(.6)"/>
   <g fill="none" stroke="#b8886c" stroke-width="1"><path d="M12 689q15 5 28-1m49 174q15 9 34 2m12-161 12 2"/></g>`,
  `<g fill="#d8d4bd" stroke="#a5a38c" stroke-width="1.5"><path d="M422 624q-14-44 17-50t46 27q12 36-21 56t-42-33Z"/><path d="M429 744q-22-22-4-44t39-1q31 32 5 45t-40 0Z"/><path d="M430 876q-15-46 12-56t45 32q10 34-15 40t-42-16Z"/><path d="M298 952q-1-30 34-31t37 25q-1 29-36 29t-35-23Z"/><path d="M188 952q-19-17-1-39t37 9q22 23 5 36t-41-6Z"/><path d="M78 955q12-31 40-20t23 29q-5 16-33 13t-30-22Z"/></g>
   <g fill="none" stroke="#f8f2df" stroke-width="2"><path d="M438 589q20-3 28 11m-30 105 24 20m-18 109 27 10m-156 94 36 2m-160-11 24 17m-112 3 22 11"/></g>`,
];
export function createShoreArt(world: WorldDefinition = SANDY_SHORE) {
  const art = document.getElementById("scenery")!;
  art.innerHTML = `<defs><mask id="clear-tiles"><rect width="500" height="1000" fill="white"/><g id="tile-mask"></g></mask></defs><g mask="url(#clear-tiles)">${(world.id === "haunted-hedge" ? hedgeCovers : covers).map((svg, i) => `<g class="cover" data-cover="${i}">${svg}</g>`).join("")}</g>${world.id === "haunted-hedge" ? hedgeLanterns : ""}`;
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
