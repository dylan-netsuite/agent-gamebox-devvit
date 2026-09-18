import type { WorldDefinition } from "../shared/worlds";

/**
 * One parameterised coastal renderer instead of a hand-drawn module per world.
 * Region I adds four worlds with three different grid sizes, and worlds 4-7 are
 * pure data against the same verified spec — bespoke art would have to be
 * re-authored for every new viewBox. These stay intentionally spare, editable
 * vector placeholders for the owner's future artwork, in the same spirit as the
 * original Sandy Shore covers.
 *
 * Colours come from per-world CSS custom properties so light and dark themes
 * both work without a second set of drawings.
 */
type Band = { top: number; height: number; width: number };

// Deterministic placement: the same world always draws the same scenery.
const seeded = (seed: number) => () =>
  (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

const line = 'stroke="var(--cover-line)" fill="none"';
const fill = 'fill="var(--cover-fill)"';

function sand({ top, height, width }: Band, random: () => number) {
  const ripples = Array.from({ length: 5 }, (_, i) => {
    const y = top + 40 + ((height - 80) * i) / 4;
    const lift = 26 + random() * 30;
    return `M${8} ${y}q${width / 4} -${lift} ${width / 2} 0t${width / 2} 0`;
  }).join("");
  const shells = Array.from({ length: 2 }, () => {
    const x = 60 + random() * (width - 140);
    const y = top + 70 + random() * (height - 150);
    return `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(.8)" ${line} stroke-width="3">
      <path d="M0 22C-34 6-32-16-21-21c7-10 16-7 21-2 7-10 17-10 21 0C38-21 35 4 0 22Z" ${fill}/>
      <path d="M0 22-21-21M0 22 0-24M0 22 21-24"/></g>`;
  }).join("");
  return `<g ${line} stroke-width="3.5" stroke-linecap="round" opacity=".85">${`<path d="${ripples}"/>`}</g>${shells}`;
}

function glass({ top, height, width }: Band, random: () => number) {
  const shards = Array.from({ length: 7 }, () => {
    const x = 30 + random() * (width - 80);
    const y = top + 40 + random() * (height - 90);
    const s = 18 + random() * 26;
    const tilt = Math.round(random() * 90 - 45);
    return `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${tilt})">
      <path d="M0 0 ${s.toFixed(0)} ${(s * 0.4).toFixed(0)} ${(s * 0.7).toFixed(0)} ${s.toFixed(0)} -${(s * 0.3).toFixed(0)} ${(s * 0.8).toFixed(0)}Z"
        ${fill} stroke="var(--cover-line)" stroke-width="2.5" stroke-linejoin="round" opacity=".75"/></g>`;
  }).join("");
  const hum = Array.from({ length: 3 }, (_, i) => {
    const y = top + 60 + ((height - 120) * i) / 2;
    return `M20 ${y}q${width / 6} -14 ${width / 3} 0t${width / 3} 0t${width / 3} 0`;
  }).join("");
  return `${shards}<g ${line} stroke-width="2" stroke-linecap="round" opacity=".5"><path d="${hum}"/></g>`;
}

function wrack({ top, height, width }: Band, random: () => number) {
  const planks = Array.from({ length: 3 }, (_, i) => {
    const x = 24 + random() * (width - 150);
    const y = top + 50 + ((height - 110) * i) / 2;
    const w = 70 + random() * 60;
    const tilt = Math.round(random() * 24 - 12);
    return `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${tilt})">
      <rect width="${w.toFixed(0)}" height="17" rx="7" ${fill} stroke="var(--cover-line)" stroke-width="2.5"/>
      <path d="M8 8.5h${(w - 16).toFixed(0)}" ${line} stroke-width="1.5" opacity=".6"/></g>`;
  }).join("");
  const coil = `<g transform="translate(${(width * 0.62).toFixed(0)} ${(top + height * 0.68).toFixed(0)})" ${line} stroke-width="3">
    <circle r="30"/><circle r="21"/><circle r="12"/><path d="M30 0q26 6 30 30"/></g>`;
  const kelp = Array.from({ length: 2 }, () => {
    const x = 20 + random() * (width - 40);
    return `M${x.toFixed(0)} ${top + 20}q22 ${(height / 3).toFixed(0)} -8 ${(height / 2).toFixed(0)}t10 ${(height / 3).toFixed(0)}`;
  }).join("");
  return `${planks}${coil}<g ${line} stroke-width="3" stroke-linecap="round" opacity=".55"><path d="${kelp}"/></g>`;
}

function pier({ top, height, width }: Band, random: () => number) {
  const posts = Array.from({ length: 3 }, (_, i) => {
    const x = 40 + ((width - 110) * i) / 2 + random() * 18;
    const h = height * (0.45 + random() * 0.3);
    return `<g transform="translate(${x.toFixed(0)} ${(top + height - h).toFixed(0)})">
      <rect width="22" height="${h.toFixed(0)}" rx="5" ${fill} stroke="var(--cover-line)" stroke-width="2.5"/>
      <path d="M0 ${(h * 0.3).toFixed(0)}h22M0 ${(h * 0.62).toFixed(0)}h22" ${line} stroke-width="1.5" opacity=".55"/></g>`;
  }).join("");
  const fog = Array.from({ length: 4 }, (_, i) => {
    const y = top + 36 + ((height - 70) * i) / 3;
    const inset = 14 + random() * 40;
    return `<rect x="${inset.toFixed(0)}" y="${y.toFixed(0)}" width="${(width - inset * 2).toFixed(0)}" height="13" rx="6.5" fill="var(--cover-glow)" opacity=".55"/>`;
  }).join("");
  return `${fog}${posts}`;
}

const MOTIFS = { sand, glass, wrack, pier } as const;

/** One cover group per discovery, spanning the rows that discovery occupies. */
export function coastCovers(world: WorldDefinition): string[] {
  const motif = MOTIFS[world.motif as keyof typeof MOTIFS] ?? sand;
  const width = world.cols * 100;
  return world.days.map((day, index) => {
    const first = Math.min(day.across.row, day.down.row);
    const last = Math.max(
      day.across.row,
      day.down.row + day.down.length - 1,
      day.across.row,
    );
    const top = Math.max(0, first * 100 - 34);
    const bottom = Math.min(world.rows * 100, (last + 1) * 100 + 34);
    return motif(
      { top, height: bottom - top, width },
      seeded(index * 7919 + world.id.length * 131 + 17),
    );
  });
}
