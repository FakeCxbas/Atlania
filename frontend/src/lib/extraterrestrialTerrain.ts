import { computeTerrainMetrics, type TerrainMetrics } from "./terrainMesh.ts";
import type { TargetProfile } from "../types/analog.ts";

export interface ExtraterrestrialTerrainData {
  elevations: Float32Array;
  slopesDeg: Float32Array;
  normals: Float32Array;
  metrics: TerrainMetrics;
  surfaceRgba: Uint8ClampedArray;
  widthMeters: number;
  heightMeters: number;
  gridSize: number;
  morphologyLabel: string;
  sourceBadge: string;
}

function hash2D(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  const a = hash2D(ix, iy, seed);
  const b = hash2D(ix + 1, iy, seed);
  const c = hash2D(ix, iy + 1, seed);
  const d = hash2D(ix + 1, iy + 1, seed);

  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number, seed: number, octaves = 5): number {
  let value = 0;
  let amplitude = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * (smoothNoise(x * freq, y * freq, seed + i * 13) * 2 - 1);
    norm += amplitude;
    amplitude *= 0.5;
    freq *= 2.04;
  }
  return value / norm;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

function targetSeed(id: string): number {
  let acc = 17;
  for (let i = 0; i < id.length; i++) {
    acc = (acc * 31 + id.charCodeAt(i)) % 9973;
  }
  return acc;
}

function craterBowl(dx: number, dy: number, radius: number, depth: number, rimHeight: number): number {
  const r = Math.hypot(dx, dy) / radius;
  if (r < 0.82) {
    const t = r / 0.82;
    return -depth * (1 - t * t);
  }
  if (r < 1.35) {
    const t = (r - 0.82) / (1.35 - 0.82);
    return rimHeight * Math.sin(t * Math.PI) * (1 - t * 0.45);
  }
  return 0;
}

function secondaryCraters(nx: number, ny: number, seed: number, count: number, scale: number): number {
  let h = 0;
  for (let i = 0; i < count; i++) {
    const cx = (hash2D(i, 1, seed) - 0.5) * 1.7;
    const cy = (hash2D(i, 2, seed) - 0.5) * 1.7;
    const cr = 0.04 + hash2D(i, 3, seed) * 0.11;
    const depth = (0.04 + hash2D(i, 4, seed) * 0.1) * scale;
    h += craterBowl(nx - cx, ny - cy, cr, depth, depth * 0.22);
  }
  return h;
}

function getMorphologyMeta(target: TargetProfile): { label: string; badge: string } {
  switch (target.id) {
    case "shackleton-crater":
      return {
        label: "Cráter de impacto polar y pared en sombra permanente",
        badge: target.instrument || "LRO Diviner + LOLA",
      };
    case "mare-tranquillitatis":
      return {
        label: "Llanura basáltica lunar con claraboya de tubo de lava",
        badge: target.instrument || "LRO LROC NAC",
      };
    case "mouton-mons":
      return {
        label: "Meseta elevada del Polo Sur lunar craterizada",
        badge: target.instrument || "LRO LOLA + LROC",
      };
    case "jezero-crater":
      return {
        label: "Abanico deltaico lacustre y piso basáltico de cráter",
        badge: target.instrument || "MRO HiRISE + CRISM",
      };
    case "olympus-mons-flank":
      return {
        label: "Flanco volcánico en escudo con coladas y tubo de lava",
        badge: target.instrument || "MRO HiRISE + MOLA",
      };
    case "valles-marineris":
      return {
        label: "Cañón tectónico escarpado con estratos de sulfatos",
        badge: target.instrument || "MRO CTX + CRISM",
      };
    default:
      return {
        label:
          target.body === "Moon"
            ? "Superficie lunar de regolito y cráteres"
            : "Superficie marciana basáltica-sedimentaria",
        badge: target.instrument || (target.body === "Moon" ? "LRO LOLA" : "MRO MOLA"),
      };
  }
}

/**
 * Generates a deterministic parametric 3D terrain dataset calibrated to the
 * slope, roughness, and geological morphology of a Moon or Mars reference profile.
 */
export function buildExtraterrestrialTerrainData(
  target: TargetProfile,
  options?: { radiusMeters?: number; gridSize?: number }
): ExtraterrestrialTerrainData {
  const radiusMeters = options?.radiusMeters ?? 2800;
  const gridSize = options?.gridSize ?? 192;
  const widthMeters = radiusMeters * 2;
  const heightMeters = radiusMeters * 2;
  const cellSizeMeters = widthMeters / Math.max(1, gridSize - 1);

  const seed = targetSeed(target.id);
  const slopeDeg = clamp(target.terrain?.slope_deg ?? 10, 1, 45);
  const roughness = clamp(target.terrain?.roughness ?? 0.5, 0.05, 1);
  const isMoon = target.body === "Moon";
  const elevations = new Float32Array(gridSize * gridSize);

  // Target relief scale derived from reference slope and domain size
  const slopeScale = Math.tan((slopeDeg * Math.PI) / 180) * radiusMeters * 0.65;
  const roughAmp = roughness * radiusMeters * 0.06;

  for (let row = 0; row < gridSize; row++) {
    const ny = (row / (gridSize - 1)) * 2 - 1; // -1 (north) .. +1 (south)
    for (let col = 0; col < gridSize; col++) {
      const nx = (col / (gridSize - 1)) * 2 - 1; // -1 (west) .. +1 (east)
      const idx = row * gridSize + col;

      const microNoise = fbm(nx * 4.5, ny * 4.5, seed, 5);
      const fineDetail = fbm(nx * 14, ny * 14, seed + 101, 3);
      let h = microNoise * roughAmp + fineDetail * roughAmp * 0.25;

      if (target.id === "shackleton-crater") {
        // Deep polar crater wall + raised rim
        h += craterBowl(nx + 0.12, ny - 0.08, 0.92, slopeScale * 1.15, slopeScale * 0.22);
        h += secondaryCraters(nx, ny, seed, 14, slopeScale * 0.35);
      } else if (target.id === "mare-tranquillitatis") {
        // Gentle basaltic mare plain with central lava-tube skylight pit
        h += nx * slopeScale * 0.22;
        h += craterBowl(nx - 0.05, ny + 0.04, 0.22, Math.max(140, slopeScale * 1.35), 24);
        h += secondaryCraters(nx, ny, seed, 18, Math.max(80, slopeScale * 0.4));
      } else if (target.id === "mouton-mons") {
        // Elevated plateau with broad ridges and overlapping craters
        const plateau = Math.cos(nx * 1.1) * Math.cos(ny * 0.9) * slopeScale * 0.65;
        h += plateau + secondaryCraters(nx, ny, seed, 16, slopeScale * 0.55);
      } else if (target.id === "jezero-crater") {
        // Western delta fan advancing into crater floor with sinuous channels
        const fanDist = Math.hypot(nx + 0.85, ny);
        const fanPlateau = fanDist < 1.15 ? (1 - smoothNoise(fanDist * 2, 0, seed) * 0.15) * slopeScale * 0.85 * (1 - fanDist / 1.15) : 0;
        const channel = Math.exp(-Math.pow((ny - Math.sin(nx * 3.8) * 0.22) / 0.09, 2)) * slopeScale * 0.22;
        h += fanPlateau - channel + secondaryCraters(nx, ny, seed, 8, slopeScale * 0.25);
      } else if (target.id === "olympus-mons-flank") {
        // Sloped volcanic shield flank + lava lobes + skylight collapse
        const flank = (-nx * 0.65 - ny * 0.35) * slopeScale * 0.95;
        const lobes = Math.sin(nx * 6 + microNoise * 3) * roughAmp * 0.65;
        const skylight = craterBowl(nx - 0.18, ny + 0.12, 0.16, Math.max(120, slopeScale * 0.75), 18);
        h += flank + lobes + skylight + secondaryCraters(nx, ny, seed, 6, slopeScale * 0.2);
      } else if (target.id === "valles-marineris") {
        // Deep tectonic canyon with terraced sulfate walls
        const canyonAxis = ny + Math.sin(nx * 2.2) * 0.14;
        const wall = Math.tanh((Math.abs(canyonAxis) - 0.28) * 4.5);
        const terrace = Math.sin(wall * 7) * slopeScale * 0.04;
        h += wall * slopeScale * 0.9 + terrace;
      } else {
        // Generic fallback
        h += (nx * 0.5 + ny * 0.25) * slopeScale * 0.7;
        if (isMoon) {
          h += secondaryCraters(nx, ny, seed, 14, slopeScale * 0.5);
        }
      }

      elevations[idx] = h;
    }
  }

  const computed = computeTerrainMetrics(elevations, gridSize, cellSizeMeters);
  const { minElevationM, reliefM } = computed;
  const safeRelief = Math.max(1, reliefM);

  // Build procedural surface albedo RGBA texture matching Moon / Mars mineralogy
  const surfaceRgba = new Uint8ClampedArray(gridSize * gridSize * 4);
  for (let row = 0; row < gridSize; row++) {
    const ny = (row / (gridSize - 1)) * 2 - 1;
    for (let col = 0; col < gridSize; col++) {
      const nx = (col / (gridSize - 1)) * 2 - 1;
      const idx = row * gridSize + col;
      const tElev = (elevations[idx] - minElevationM) / safeRelief;
      const slopeT = clamp(computed.slopesDeg[idx] / 35, 0, 1);
      const grain = fbm(nx * 22, ny * 22, seed + 55, 3) * 0.5 + 0.5;

      let r = 128;
      let g = 128;
      let b = 128;

      if (isMoon) {
        if (target.id === "mare-tranquillitatis") {
          // Dark mare basalt with brighter ejecta around pit/craters
          const base = lerp(34, 92, tElev * 0.55 + slopeT * 0.35 + grain * 0.1);
          r = base * 0.96;
          g = base * 0.99;
          b = base * 1.06;
        } else {
          // Anorthositic highlands regolith (cool slate-silver)
          const base = lerp(58, 178, tElev * 0.5 + slopeT * 0.3 + grain * 0.2);
          r = base * 0.95;
          g = base * 0.98;
          b = base * 1.05;
        }
      } else {
        if (target.id === "valles-marineris") {
          // Stratified iron oxide and sulfate bands
          const strata = Math.sin(tElev * 24 + grain * 2) * 0.5 + 0.5;
          r = lerp(88, 222, tElev * 0.45 + strata * 0.35 + slopeT * 0.2);
          g = lerp(42, 126, tElev * 0.45 + strata * 0.35 + grain * 0.15);
          b = lerp(32, 92, tElev * 0.4 + strata * 0.3 + grain * 0.15);
        } else if (target.id === "olympus-mons-flank") {
          // Dark volcanic basalt dusted with iron oxide
          r = lerp(64, 178, tElev * 0.5 + slopeT * 0.25 + grain * 0.25);
          g = lerp(36, 98, tElev * 0.45 + grain * 0.25);
          b = lerp(30, 74, tElev * 0.4 + grain * 0.2);
        } else {
          // Jezero delta / ferric dust + basaltic floor
          r = lerp(96, 224, tElev * 0.55 + grain * 0.25 + slopeT * 0.2);
          g = lerp(54, 134, tElev * 0.5 + grain * 0.25);
          b = lerp(42, 96, tElev * 0.45 + grain * 0.2);
        }
      }

      const off = idx * 4;
      surfaceRgba[off] = clamp(Math.round(r), 0, 255);
      surfaceRgba[off + 1] = clamp(Math.round(g), 0, 255);
      surfaceRgba[off + 2] = clamp(Math.round(b), 0, 255);
      surfaceRgba[off + 3] = 255;
    }
  }

  const meta = getMorphologyMeta(target);

  return {
    elevations,
    slopesDeg: computed.slopesDeg,
    normals: computed.normals,
    metrics: {
      minElevationM: computed.minElevationM,
      maxElevationM: computed.maxElevationM,
      reliefM: computed.reliefM,
      meanSlopeDeg: computed.meanSlopeDeg,
      maxSlopeDeg: computed.maxSlopeDeg,
      roverTraversablePct: computed.roverTraversablePct,
    },
    surfaceRgba,
    widthMeters,
    heightMeters,
    gridSize,
    morphologyLabel: meta.label,
    sourceBadge: meta.badge,
  };
}
