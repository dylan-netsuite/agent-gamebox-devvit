import artwork from "./garden.svg";

export function createGarden() {
  const scene = document.getElementById("garden-scene")!;
  const illustration = document.createElement("img");
  illustration.src = artwork;
  illustration.alt = "";
  illustration.width = 1200;
  illustration.height = 800;
  document.getElementById("garden-art")!.append(illustration);
  const dialogue = document.getElementById("garden-dialogue")!;
  const caption = document.getElementById("garden-caption")!;
  const replay = document.getElementById("replay") as HTMLButtonElement;
  const motion = document.getElementById("motion") as HTMLButtonElement;
  const sound = document.getElementById("sound") as HTMLButtonElement;
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let paused = false;
  let accepted = false;
  let inspected = false;
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
    [293.66, 349.23, 440, 587.33].forEach((frequency, index) => {
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

  const places = {
    arch: [
      "THE CROOKED GATE",
      "The gate has grown around its own key. Beyond it, the path bends in a direction you cannot quite remember.",
    ],
    fountain: [
      "MURMURING FOUNTAIN",
      "The fountain clears its throat. ‘A penny for your thoughts? No? A peculiar word will do.’",
    ],
    glasshouse: [
      "THE GLASSHOUSE",
      "Something inside has been rearranging the pots. All the labels face the wall. All the flowers face you.",
    ],
  } as const;
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    "[data-place]",
  )) {
    button.addEventListener("click", () => {
      const place = places[button.dataset.place as keyof typeof places];
      inspected = true;
      document.getElementById("place-title")!.textContent = place[0];
      dialogue.textContent = place[1];
      for (const landmark of document.querySelectorAll("[data-place]"))
        landmark.setAttribute("aria-pressed", String(landmark === button));
      document.getElementById("place-note")!.focus({ preventScroll: true });
    });
  }

  return {
    update(isAccepted: boolean, playDiscovery = false) {
      accepted = isAccepted;
      scene.classList.toggle("is-bloomed", accepted);
      scene.dataset.state = accepted ? "bloomed" : "waiting";
      replay.hidden = !accepted;
      if (!inspected)
        dialogue.textContent = accepted
          ? "“There. Now they’ll be repeating that to one another all night.”"
          : "“Mind where you plant your words. They tend to take root.”";
      caption.textContent = accepted
        ? "The Whisper Bed stirs. Your word belongs to the garden now."
        : "Not everything here is waiting to be found. Some things are waiting to be named.";
      if (playDiscovery) celebrate();
    },
  };
}
