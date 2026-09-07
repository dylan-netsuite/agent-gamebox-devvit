import artwork from "./garden.svg?raw";

export function createGarden() {
  const scene = document.getElementById("garden-scene")!;
  document.getElementById("garden-art")!.innerHTML = artwork;
  const dialogue = document.getElementById("pip-dialogue")!;
  const caption = document.getElementById("garden-caption")!;
  const replay = document.getElementById("replay") as HTMLButtonElement;
  const motion = document.getElementById("motion") as HTMLButtonElement;
  const sound = document.getElementById("sound") as HTMLButtonElement;
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let paused = false;
  let accepted = false;
  let sounding = false;
  let audio: AudioContext | undefined;
  let revealTimer: ReturnType<typeof setTimeout> | undefined;

  function syncMotion() {
    const stopped = paused || preference.matches;
    scene.classList.toggle("motion-paused", stopped || document.hidden);
    motion.setAttribute("aria-pressed", String(stopped));
    motion.textContent = preference.matches
      ? "Motion: reduced"
      : paused
        ? "Motion: paused"
        : "Pause motion";
    motion.disabled = preference.matches;
    if (stopped || document.hidden) {
      clearTimeout(revealTimer);
      scene.classList.remove("celebrating");
    }
  }

  function chime() {
    if (!sounding || audio?.state !== "running" || document.hidden) return;
    const start = audio.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      const oscillator = audio!.createOscillator();
      const gain = audio!.createGain();
      const at = start + index * 0.17;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(0.07, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.65);
      oscillator.connect(gain).connect(audio!.destination);
      oscillator.start(at);
      oscillator.stop(at + 0.7);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    });
  }

  function celebrate() {
    if (!accepted) return;
    clearTimeout(revealTimer);
    scene.classList.remove("celebrating");
    if (!paused && !preference.matches && !document.hidden) {
      // Restart the finite presentation; this never makes a game API request.
      void scene.offsetWidth;
      scene.classList.add("celebrating");
      revealTimer = setTimeout(
        () => scene.classList.remove("celebrating"),
        3200,
      );
    }
    chime();
  }

  motion.addEventListener("click", () => {
    paused = !paused;
    syncMotion();
  });
  preference.addEventListener("change", syncMotion);
  document.addEventListener("visibilitychange", () => {
    syncMotion();
    if (document.hidden && audio) void audio.suspend().catch(() => {});
    else if (sounding && audio) void audio.resume().catch(() => {});
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
          if (!sounding) throw new Error("Audio not available");
        }
        sound.textContent = sounding ? "Sound: on" : "Sound: off";
        sound.setAttribute("aria-pressed", String(sounding));
      } catch {
        void audio?.close().catch(() => {});
        audio = undefined;
        sounding = false;
        sound.textContent = "Sound unavailable";
        sound.setAttribute("aria-pressed", "false");
      } finally {
        sound.disabled = false;
      }
    })();
  });
  replay.addEventListener("click", celebrate);
  syncMotion();

  return {
    update(isAccepted: boolean, playDiscovery = false) {
      accepted = isAccepted;
      scene.classList.toggle("is-bloomed", accepted);
      scene.dataset.state = accepted ? "bloomed" : "waiting";
      replay.hidden = !accepted;
      dialogue.textContent = accepted
        ? "“Oh! They like your word. I’ll take a little credit for the watering.”"
        : "“The flowers have plenty to say. They’re just waiting for the right word.”";
      caption.textContent = accepted
        ? "A word planted. A garden awakened."
        : "A small garden. A little possibility.";
      if (playDiscovery) celebrate();
    },
  };
}
