#!/usr/bin/env node
/*
  Extracts province polygons from a Diplomacy SVG and emits a TS module:
  Usage: node tools/extract-board-polygons.js "/path/to/Diplomacy.svg" \
         /absolute/path/to/src/shared/data/board.generated.ts

  Notes:
  - Parses <g title="..."> blocks and pulls the largest <polygon> or <polyline> "points" list within.
  - Skips <path> for now.
  - Derives province ID from the first <text> content inside the group (e.g., NTH, Bel, Par). Uppercases it.
  - Scales coordinates from the SVG viewbox (610x560) to our world (2000x1400).
*/
const fs = require('fs');
const path = require('path');

if (process.argv.length < 4) {
  console.error('Usage: node tools/extract-board-polygons.js \'/path/to/Diplomacy.svg\' /absolute/output.ts');
  process.exit(1);
}

const inputPath = process.argv[2];
const outputPath = process.argv[3];

const svg = fs.readFileSync(inputPath, 'utf8');

// Extract groups by title
const groupRegex = /<g\s+title="([^"]+)">([\s\S]*?)<\/g>/g;

// Helpers
function parsePointsAttr(pointsStr) {
  // points attr can be "x1,y1 x2,y2 ..." possibly with extra spaces
  const pts = pointsStr
    .trim()
    .split(/\s+/)
    .map((p) => p.split(',').map(Number))
    .filter((arr) => arr.length === 2 && arr.every((n) => Number.isFinite(n)))
    .map(([x, y]) => ({ x, y }));
  return pts;
}

function polygonArea(points) {
  // Shoelace formula
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

// Viewbox -> world scaling
const viewW = 610;
const viewH = 560;
const worldW = 2000;
const worldH = 1400;
const scaleX = worldW / viewW;
const scaleY = worldH / viewH;

function scalePoints(points) {
  return points.map(({ x, y }) => ({ x: +(x * scaleX).toFixed(2), y: +(y * scaleY).toFixed(2) }));
}

// Province ID derivation:
// - First <text> content uppercased (e.g., Bel -> BEL, NTH -> NTH)
// - Handle known inconsistencies
function toProvinceId(textContent) {
  const raw = textContent.trim();
  let id = raw.toUpperCase();
  // Normalize a few cases
  if (id === 'NWG') id = 'NRG'; // Norwegian Sea abbreviation used as NWG in some maps
  if (id === 'LYO') id = 'GOL'; // Gulf of Lyon
  if (id === 'STP') id = 'STP'; // St Petersburg
  if (id === 'NAO') id = 'NAT'; // North Atlantic Ocean
  if (id === 'MAO') id = 'MID'; // Mid-Atlantic Ocean
  return id;
}

// --- New strategy ---
// Some provinces (e.g., Spain, Bulgaria, St Petersburg) are encoded as multiple
// <g title="... (nc|sc|ec)"> with only <polyline> borders. To recover a proper
// fill polygon, we aggregate all sibling groups by their base title (strip the
// coast suffix) and attempt to stitch their polylines into a closed ring.

function stripCoastSuffix(title) {
  return title.replace(/\s*\((?:nc|sc|ec)\)\s*$/i, '').trim();
}

function pointsEqual(a, b, eps = 0.5) {
  return Math.hypot(a.x - b.x, a.y - b.y) <= eps;
}

// Greedily join multiple polylines into a single closed ring when endpoints touch
function joinPolylinesIntoRing(lines) {
  if (lines.length === 0) return null;
  // Copy to avoid mutating callers
  const remaining = lines.map((l) => [...l]);
  // Start with the longest line (more likely to be outer boundary)
  remaining.sort((a, b) => b.length - a.length);
  let ring = remaining.shift();

  // Iteratively attach any segment whose endpoint matches our head or tail
  let madeProgress = true;
  while (remaining.length > 0 && madeProgress) {
    madeProgress = false;
    for (let i = 0; i < remaining.length; i++) {
      const cand = remaining[i];
      const head = ring[0];
      const tail = ring[ring.length - 1];
      const cHead = cand[0];
      const cTail = cand[cand.length - 1];

      if (pointsEqual(tail, cHead)) {
        // append forward
        ring = ring.concat(cand.slice(1));
        remaining.splice(i, 1);
        madeProgress = true;
        break;
      } else if (pointsEqual(tail, cTail)) {
        // append reversed
        const rev = [...cand].reverse();
        ring = ring.concat(rev.slice(1));
        remaining.splice(i, 1);
        madeProgress = true;
        break;
      } else if (pointsEqual(head, cTail)) {
        // prepend forward
        ring = cand.slice(0, cand.length - 1).concat(ring);
        remaining.splice(i, 1);
        madeProgress = true;
        break;
      } else if (pointsEqual(head, cHead)) {
        // prepend reversed
        const rev = [...cand].reverse();
        ring = rev.slice(0, rev.length - 1).concat(ring);
        remaining.splice(i, 1);
        madeProgress = true;
        break;
      }
    }
  }

  // Ensure closure, even if slightly open. If endpoints are near, snap them.
  if (!pointsEqual(ring[0], ring[ring.length - 1])) {
    // Snap tail to head to close
    ring = ring.concat([ { x: ring[0].x, y: ring[0].y } ]);
  }
  return ring;
}

// Convex hull (Graham scan) as a conservative fallback when stitching fails
function convexHull(points) {
  if (points.length <= 3) return points;
  const pts = Array.from(new Map(points.map((p) => [p.x + ',' + p.y, p])).values()).sort((a, b) =>
    a.x === b.x ? a.y - b.y : a.x - b.x,
  );
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

// Parse a subset of SVG path (M, L, A, Z) into ordered points
function parsePathToPoints(d) {
  let cur = null;
  const pts = [];
  function addPoint(p) {
    if (!cur || !pointsEqual(cur, p)) pts.push(p);
    cur = p;
  }
  function angle(u, v) {
    const dot = u.x * v.x + u.y * v.y;
    const det = u.x * v.y - u.y * v.x;
    return Math.atan2(det, dot);
  }
  function arcToPoints(x0, y0, rx, ry, phiDeg, fa, fs, x1, y1, segments = 12) {
    const phi = (phiDeg * Math.PI) / 180;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);
    const dx2 = (x0 - x1) / 2;
    const dy2 = (y0 - y1) / 2;
    const x1p = cosPhi * dx2 + sinPhi * dy2;
    const y1p = -sinPhi * dx2 + cosPhi * dy2;

    rx = Math.abs(rx);
    ry = Math.abs(ry);
    // Correct radii
    let lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lambda > 1) {
      const s = Math.sqrt(lambda);
      rx *= s;
      ry *= s;
    }
    const rx2 = rx * rx;
    const ry2 = ry * ry;
    const x1p2 = x1p * x1p;
    const y1p2 = y1p * y1p;
    const sign = fa !== fs ? 1 : -1;
    const num = rx2 * ry2 - rx2 * y1p2 - ry2 * x1p2;
    const den = rx2 * y1p2 + ry2 * x1p2;
    const cpFactor = sign * Math.sqrt(Math.max(0, num / den));
    const cxp = (cpFactor * rx * y1p) / ry;
    const cyp = (-cpFactor * ry * x1p) / rx;

    const cx = cosPhi * cxp - sinPhi * cyp + (x0 + x1) / 2;
    const cy = sinPhi * cxp + cosPhi * cyp + (y0 + y1) / 2;

    const v1 = { x: (x1p - cxp) / rx, y: (y1p - cyp) / ry };
    const v2 = { x: (-x1p - cxp) / rx, y: (-y1p - cyp) / ry };
    let theta1 = Math.atan2(v1.y, v1.x);
    let dtheta = angle(v1, v2);
    if (!fs && dtheta > 0) dtheta -= 2 * Math.PI;
    if (fs && dtheta < 0) dtheta += 2 * Math.PI;

    const points = [];
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const theta = theta1 + dtheta * t;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      const x = cx + rx * cosPhi * cosT - ry * sinPhi * sinT;
      const y = cy + rx * sinPhi * cosT + ry * cosPhi * sinT;
      points.push({ x, y });
    }
    return points;
  }

  const segRe = /([MLAZ])\s*([^MLAZ]*)/gi;
  let m;
  while ((m = segRe.exec(d)) !== null) {
    const cmd = m[1].toUpperCase();
    const body = m[2].trim();
    if (cmd === 'M' || cmd === 'L') {
      const parts = body.split(/[\s,]+/).filter(Boolean);
      for (let i = 0; i + 1 < parts.length; i += 2) {
        const x = Number(parts[i]);
        const y = Number(parts[i + 1]);
        if (Number.isFinite(x) && Number.isFinite(y)) addPoint({ x, y });
      }
    } else if (cmd === 'A') {
      // rx,ry rot fa,fs x,y (may repeat)
      const nums = body.split(/[\s,]+/).filter(Boolean).map(Number);
      for (let i = 0; i + 6 < nums.length; i += 7) {
        const [rx, ry, rot, fa, fs, x, y] = nums.slice(i, i + 7);
        if (cur) {
          const arcPts = arcToPoints(cur.x, cur.y, rx, ry, rot, fa, fs, x, y, 10);
          for (const p of arcPts) addPoint(p);
        } else {
          addPoint({ x, y });
        }
      }
    } else if (cmd === 'Z') {
      // close path; nothing extra: we'll close later globally
    }
  }
  return pts;
}

// First pass: collect data per base title
const families = new Map();
let match;
while ((match = groupRegex.exec(svg)) !== null) {
  const [, title, inner] = match;
  const base = stripCoastSuffix(title);
  const fam = families.get(base) || { titleVariants: [], inners: [], text: null };
  fam.titleVariants.push(title);
  fam.inners.push(inner);
  // Prefer a text label if present (used to derive province code)
  if (!fam.text) {
    const textMatch = inner.match(/<text[^>]*>([^<]+)<\/text>/);
    if (textMatch) fam.text = textMatch[1];
  }
  families.set(base, fam);
}

const results = {};
const waterOverlaysRaw = [];

for (const [base, fam] of families.entries()) {
  if (!fam.text) continue; // no label; likely unit icons or helpers
  const pid = toProvinceId(fam.text);

  // Collect polygons and polylines across all sibling groups
  const polygons = [];
  const polylines = [];
  const groupHasLand = fam.inners.some((inn) => /class\s*=\s*"l"/i.test(inn));
  for (const inner of fam.inners) {
    const polyRegex = /<(polygon|polyline)[^>]*\spoints="([^"]+)"/g;
    let pm;
    while ((pm = polyRegex.exec(inner)) !== null) {
      const fullTag = pm[0];
      const [_, type, pointsStr] = pm;
      try {
        const pts = parsePointsAttr(pointsStr);
        if (pts.length < 3) continue;
        if (groupHasLand && /class\s*=\s*"w"/i.test(fullTag)) {
          waterOverlaysRaw.push(pts);
        }
        if (type === 'polygon') polygons.push(pts);
        else polylines.push(pts);
      } catch {}
    }
    // Collect path points (supporting M, L; approximate A by endpoint)
    const pathRegex = /<path[^>]*\sd="([^"]+)"/g;
    let dm;
    while ((dm = pathRegex.exec(inner)) !== null) {
      const d = dm[1];
      const pts = parsePathToPoints(d);
      if (pts.length >= 3) {
        // store as polyline candidate; hull will be taken later
        polylines.push(pts);
      }
    }
  }

  let chosen = null;
  if (polygons.length > 0) {
    // Pick largest filled polygon
    chosen = polygons.reduce((best, cur) => (polygonArea(cur) > polygonArea(best) ? cur : best), polygons[0]);
  } else if (polylines.length > 0) {
    // Try to stitch multiple coastline polylines into a closed ring
    let ring = joinPolylinesIntoRing(polylines);
    if (ring && ring.length >= 3) chosen = ring;
    if (!chosen) {
      const merged = polylines.flat();
      const hull = convexHull(merged);
      if (hull && hull.length >= 3) chosen = hull;
    }
  }

  if (chosen) {
    results[pid] = scalePoints(chosen);
  }
}

// Emit TS module
const header = `// Auto-generated from ${path.basename(inputPath)}. Do not edit by hand.\n`;
const content =
  header +
  'export const boardPolygons: Record<string, Array<{ x: number; y: number }>> = ' +
  JSON.stringify(results, null, 2) +
  ';\n' +
  'export const waterOverlays: Array<Array<{ x: number; y: number }>> = ' +
  JSON.stringify(waterOverlaysRaw.map(scalePoints), null, 2) +
  ';\n';

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, content, 'utf8');
console.log(`Wrote ${outputPath} with ${Object.keys(results).length} provinces`);


