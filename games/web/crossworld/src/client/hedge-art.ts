// Small, editable garden illustrations in the same 500×1000 coordinate space as the tiles.
export const hedgeCovers = [
  `<g fill="none" stroke="var(--garden-line)" stroke-width="2" stroke-linecap="round"><path d="M10 303V76q2-52 50-55t58 55v142"/><path class="gate-leaf" d="m30 210 4-131 39-11 24 17-3 126M53 75l-3 137M76 77l-2 133M31 137l63-9"/><path d="M13 345q39-49 65-36t68-28M80 41q39-11 43 26m-110 68q-22 48 5 68"/></g><g fill="var(--hedge-light)" stroke="var(--garden-line)" stroke-width="1.4"><path d="M15 79q-18-21-6-37 25 8 6 37m87 44q-1-27 25-26 4 26-25 26M47 293q-29-3-29-24 26-8 29 24"/></g>`,
  `<path d="M95 18q50-16 78 5 72-25 113-7 36-15 69 8 28-23 72-2 53-8 58 47l-6 314q-1 60-61 37-17-17-11-55l1-238q-7-28-37-23l-246-2q-58-8-30-84Z" fill="var(--hedge-dark)" stroke="var(--garden-line)" stroke-width="1.5"/><path d="M121 44q58-15 93 1m63-7q47 1 68 11m89 96q20 50 7 80m-4 31q23 40 1 70" fill="none" stroke="var(--hedge-light)" stroke-width="2"/><g class="garden-eyes" fill="var(--lantern-light)"><ellipse cx="216" cy="61" rx="4" ry="3"/><ellipse cx="237" cy="59" rx="4" ry="3"/><ellipse cx="439" cy="186" rx="3.5" ry="2.5"/><ellipse cx="458" cy="186" rx="3.5" ry="2.5"/></g>`,
  `<g fill="none" stroke="var(--mist-line)" stroke-width="2" stroke-linecap="round"><path d="M5 429q70-30 143-4t148 0 191 10M21 456q84-16 151 7t147-5 166 8M214 267q67-16 52 49t-25 80m-14 94q44 21 14 71t8 105"/><path d="M43 484q64 12 117-1M277 517q-31 28-19 41" opacity=".5"/></g><g fill="var(--hedge-light)" opacity=".8"><ellipse cx="260" cy="319" rx="3" ry="7" transform="rotate(-18 260 319)"/><ellipse cx="277" cy="339" rx="3" ry="7" transform="rotate(-18 277 339)"/><ellipse cx="231" cy="585" rx="3" ry="7" transform="rotate(20 231 585)"/><ellipse cx="247" cy="605" rx="3" ry="7" transform="rotate(20 247 605)"/></g>`,
  `<path d="M375 664q-36-28-13-66 39-20 88 4 53 15 32 62-13 20-47 22-35 0-60-22Z" fill="var(--garden-stone)" stroke="var(--garden-line)" stroke-width="1.5"/><ellipse cx="423" cy="627" rx="51" ry="20" fill="var(--mist-fill)" stroke="var(--garden-line)" stroke-width="1.2"/><path d="M438 615q-15 4-6 17-26-4-8-20" fill="var(--lantern-light)"/><g fill="none" stroke="var(--garden-line)" stroke-width="1.5"><path d="M372 645q18 23 49 24m43-17-24 14M446 707q-21 31 7 70t-7 86M425 913q30 8 51-10"/></g><g fill="var(--hedge-light)"><path d="M451 741q-27-26-6-31 24 13 6 31m3 61q35-8 19-27-29 3-19 27"/></g>`,
  `<path d="M13 704q-4-40 42-30 48-9 45 40l-6 151q-2 22 23 20l233 14q38 3 28 47-7 27-58 21l-275-3q-41 0-35-49Z" fill="var(--hedge-light)" stroke="var(--garden-line)" stroke-width="1.5"/><g fill="none" stroke="var(--garden-line)" stroke-width="2" stroke-linecap="round"><path d="m20 930 5-99q19-53 60 0l3 102M34 926l2-93m17 95 2-108m17 111-1-94M122 945q37-14 69 1m58-11 59 6"/></g><path d="M51 747q-30 0-16-20-3 14 16 20" fill="var(--lantern-light)"/><path d="M113 768q39 5 56-9" fill="none" stroke="var(--mist-line)" stroke-width="2"/>`,
];
const places = [
  [170, 145],
  [150, 345],
  [50, 545],
  [250, 745],
  [150, 845],
];
export const hedgeLanterns = places
  .map(
    ([x, y], i) =>
      `<g class="garden-lantern" data-lantern="${i}" transform="translate(${x} ${y})"><circle class="lantern-glow" r="24" cy="3"/><path class="lantern-body" d="M-10-9 0-16 10-9v27h-20Z"/><path d="M-11-9h22M-13 21h26M0-22v6" fill="none" stroke="var(--garden-line)" stroke-width="1.5"/></g>`,
  )
  .join("");
