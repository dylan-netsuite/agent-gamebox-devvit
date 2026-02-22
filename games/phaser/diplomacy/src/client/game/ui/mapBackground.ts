/**
 * Generates an SVG string that serves as the map background.
 * Includes: ocean gradient, grid lines, landmass fills, rivers,
 * mountain symbols, supply center dots, compass rose, country labels,
 * and a decorative frame.
 *
 * The SVG viewBox uses province-coordinate space so it aligns
 * exactly with the interactive polygon layer.
 */

import {
  CONTINENT,
  BRITISH_ISLES,
  NORTH_AFRICA,
} from './coastlines';
import { PROVINCES } from '../../../shared/data/provinces';
import type { Polygon } from './provinceGeometry';

// ── helpers ──────────────────────────────────────────────

function polyToPath(polygon: Polygon): string {
  if (polygon.length === 0) return '';
  return (
    polygon
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ') + ' Z'
  );
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── mountain symbol builder ──────────────────────────────

function mountainRow(
  pts: { x: number; y: number }[],
  size: number
): string {
  return pts
    .map(
      (p) =>
        `<polygon points="${p.x},${p.y - size} ${(p.x - size * 0.7).toFixed(1)},${(p.y + size * 0.4).toFixed(1)} ${(p.x + size * 0.7).toFixed(1)},${(p.y + size * 0.4).toFixed(1)}"/>`
    )
    .join('\n      ');
}

// ── river data (quadratic bezier curves in province-space) ───

const RIVERS = {
  rhine:
    'M 385,435 Q 370,410 355,378 Q 345,350 338,320 Q 332,298 328,275',
  danube:
    'M 398,388 Q 430,398 452,402 Q 480,412 508,424 Q 540,440 565,455 Q 598,468 640,478',
  vistula:
    'M 522,322 Q 505,298 492,275 Q 482,258 475,242',
  dnieper:
    'M 642,225 Q 628,280 615,332 Q 608,362 625,408',
  rhone:
    'M 328,428 Q 322,458 317,488 Q 320,518 332,542',
};

// ── mountain range positions ─────────────────────────────

const ALPS = [
  { x: 338, y: 468 },
  { x: 355, y: 453 },
  { x: 372, y: 440 },
  { x: 390, y: 428 },
  { x: 406, y: 420 },
  { x: 422, y: 413 },
  { x: 438, y: 407 },
];

const PYRENEES = [
  { x: 198, y: 503 },
  { x: 216, y: 499 },
  { x: 234, y: 495 },
  { x: 250, y: 491 },
];

const CARPATHIANS = [
  { x: 508, y: 373 },
  { x: 524, y: 386 },
  { x: 540, y: 400 },
  { x: 552, y: 418 },
  { x: 562, y: 436 },
];

const SCANDINAVIAN_MTS = [
  { x: 384, y: 133 },
  { x: 398, y: 148 },
  { x: 412, y: 162 },
  { x: 425, y: 178 },
];

// ── country label data ───────────────────────────────────

const COUNTRY_LABELS = [
  { name: 'ENGLAND', x: 248, y: 282 },
  { name: 'FRANCE', x: 268, y: 442 },
  { name: 'GERMANY', x: 412, y: 336 },
  { name: 'AUSTRIA', x: 478, y: 422 },
  { name: 'ITALY', x: 422, y: 532 },
  { name: 'RUSSIA', x: 602, y: 262 },
  { name: 'TURKEY', x: 662, y: 556 },
];

// ── main generator ───────────────────────────────────────

/**
 * Generate the complete SVG string.
 * @param pixelW  rasterisation width  (default 1600)
 * @param pixelH  rasterisation height (default 1600)
 */
export function generateMapSVG(pixelW = 1600, pixelH = 1600): string {
  // viewBox covers province-coordinate space with generous padding
  const vb = '10 -50 800 800';

  // ── landmass paths ──
  // const landPaths = [CONTINENT, BRITISH_ISLES, NORTH_AFRICA, SICILY, SARDINIA, CORSICA, CRETE]
  //   .map((p) => `<path d="${polyToPath(p)}"/>`)
  //   .join('\n    ');

  // ── coastline strokes (slightly bolder than land fills) ──
  const coastStrokes = [CONTINENT, BRITISH_ISLES, NORTH_AFRICA]
    .map((p) => `<path d="${polyToPath(p)}"/>`)
    .join('\n    ');

  // ── grid lines ──
  const grid: string[] = [];
  for (let x = 100; x <= 750; x += 80) {
    grid.push(`<line x1="${x}" y1="-50" x2="${x}" y2="750"/>`);
  }
  for (let y = 0; y <= 740; y += 80) {
    grid.push(`<line x1="10" y1="${y}" x2="810" y2="${y}"/>`);
  }

  // ── supply-center dots ──
  const scDots: string[] = [];
  for (const prov of Object.values(PROVINCES)) {
    if (prov.supplyCenter) {
      scDots.push(`<circle cx="${prov.x}" cy="${prov.y}" r="4.5"/>`);
    }
  }

  // ── compass rose at ~NAO area ──
  const cx = 108;
  const cy = 252;
  const compass = `
    <g transform="translate(${cx},${cy})" opacity="0.28">
      <circle r="28" fill="none" stroke="#4a7090" stroke-width="0.8"/>
      <circle r="20" fill="none" stroke="#4a7090" stroke-width="0.5"/>
      <circle r="3" fill="#4a7090" opacity="0.5"/>
      <line x1="0" y1="-32" x2="0" y2="32" stroke="#4a7090" stroke-width="0.6"/>
      <line x1="-32" y1="0" x2="32" y2="0" stroke="#4a7090" stroke-width="0.6"/>
      <line x1="-22" y1="-22" x2="22" y2="22" stroke="#4a7090" stroke-width="0.3"/>
      <line x1="22" y1="-22" x2="-22" y2="22" stroke="#4a7090" stroke-width="0.3"/>
      <polygon points="0,-32 -4,-10 4,-10" fill="#4a7090"/>
      <polygon points="0,32 -3,12 3,12" fill="#4a7090" opacity="0.5"/>
      <polygon points="-32,0 -12,-3 -12,3" fill="#4a7090" opacity="0.5"/>
      <polygon points="32,0 12,-3 12,3" fill="#4a7090" opacity="0.5"/>
      <text y="-36" text-anchor="middle" font-size="9" fill="#5a8aaa" font-family="Georgia,serif" font-weight="bold">${esc('N')}</text>
      <text y="44" text-anchor="middle" font-size="7" fill="#4a7090" font-family="Georgia,serif">${esc('S')}</text>
      <text x="-38" y="3" text-anchor="middle" font-size="7" fill="#4a7090" font-family="Georgia,serif">${esc('W')}</text>
      <text x="38" y="3" text-anchor="middle" font-size="7" fill="#4a7090" font-family="Georgia,serif">${esc('E')}</text>
    </g>`;

  // ── country labels ──
  const labels = COUNTRY_LABELS.map(
    (l) =>
      `<text x="${l.x}" y="${l.y}" text-anchor="middle" font-size="26" ` +
      `letter-spacing="10" fill="#6a8a9a" font-family="Georgia,serif">${esc(l.name)}</text>`
  ).join('\n    ');

  // ── title cartouche ──
  const titleX = 410;
  const titleY = -28;
  const title = `
    <g opacity="0.22">
      <text x="${titleX}" y="${titleY}" text-anchor="middle"
        font-size="16" letter-spacing="14" fill="#8aa0b0"
        font-family="Georgia,serif" font-weight="bold">${esc('DIPLOMACY')}</text>
      <line x1="${titleX - 80}" y1="${titleY + 6}" x2="${titleX + 80}" y2="${titleY + 6}"
        stroke="#6a8090" stroke-width="0.5"/>
    </g>`;

  // ── wave patterns for ocean texture ──
  const waves: string[] = [];
  for (let y = -20; y < 740; y += 35) {
    const xOff = (y % 70 === 0) ? 0 : 18;
    for (let x = 20 + xOff; x < 800; x += 55) {
      waves.push(
        `<path d="M${x},${y} q8,-3 16,0 q8,3 16,0" fill="none" stroke="#5080a0" stroke-width="0.5"/>`
      );
    }
  }

  // ── assemble SVG ──
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${pixelW}" height="${pixelH}">
  <defs>
    <radialGradient id="og" cx="0.45" cy="0.42" r="0.72">
      <stop offset="0%" stop-color="#82b4d8"/>
      <stop offset="60%" stop-color="#7aaac8"/>
      <stop offset="100%" stop-color="#6a9cc0"/>
    </radialGradient>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise"/>
      <feColorMatrix type="saturate" values="0" in="noise" result="gray"/>
      <feBlend in="SourceGraphic" in2="gray" mode="multiply"/>
    </filter>
  </defs>

  <!-- Ocean base -->
  <rect x="10" y="-50" width="800" height="800" fill="url(#og)"/>

  <!-- Ocean wave texture -->
  <g opacity="0.18">
    ${waves.join('\n    ')}
  </g>

  <!-- Grid lines -->
  <g stroke="#4a7898" stroke-width="0.5" opacity="0.20">
    ${grid.join('\n    ')}
  </g>

  <!-- Coastline accents -->
  <g fill="none" stroke="#3868a0" stroke-width="2.8" opacity="0.25" stroke-linejoin="round">
    ${coastStrokes}
  </g>

  <!-- Rivers -->
  <g fill="none" stroke="#3870a0" stroke-width="2.8" opacity="0.40"
     stroke-linecap="round" stroke-linejoin="round">
    <path d="${RIVERS.rhine}"/>
    <path d="${RIVERS.danube}"/>
    <path d="${RIVERS.vistula}"/>
    <path d="${RIVERS.dnieper}"/>
    <path d="${RIVERS.rhone}"/>
  </g>

  <!-- Mountain ranges -->
  <g fill="#5a7858" fill-opacity="0.15" stroke="#5a7858" stroke-width="1.6" opacity="0.30">
    <!-- Alps -->
    ${mountainRow(ALPS, 9)}
    <!-- Pyrenees -->
    ${mountainRow(PYRENEES, 7)}
    <!-- Carpathians -->
    ${mountainRow(CARPATHIANS, 8)}
    <!-- Scandinavian Mountains -->
    ${mountainRow(SCANDINAVIAN_MTS, 6.5)}
  </g>

  <!-- Supply-center dots -->
  <g fill="#8a7a50" opacity="0.22">
    ${scDots.join('\n    ')}
  </g>

  <!-- Compass rose -->
  ${compass}

  <!-- Title -->
  ${title}

  <!-- Country name labels -->
  <g opacity="0.14" font-style="italic">
    ${labels}
  </g>

  <!-- Decorative double frame -->
  <rect x="15" y="-45" width="790" height="790" fill="none"
    stroke="#2a4050" stroke-width="1.5" opacity="0.24" rx="4"/>
  <rect x="18" y="-42" width="784" height="784" fill="none"
    stroke="#2a4050" stroke-width="0.5" opacity="0.14" rx="3"/>
</svg>`;
}
