/** WGS84 Web Mercator tiles. No browser globals are accessed until loading. */
const EARTH_RADIUS_M = 6378137;
const CIRCUMFERENCE_M = 2 * Math.PI * EARTH_RADIUS_M;
const MAX_LAT = 85.0511287798066;
const TILE_SIZE = 256;
const DEG = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

function finite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
}

function validateZoom(zoom: number): void {
  if (!Number.isInteger(zoom) || zoom < 0 || zoom > 24) {
    throw new RangeError("zoom must be an integer from 0 to 24");
  }
}

/** Latitude is clamped; longitude stays unwrapped to support antimeridian crops. */
export function latLonToTileFloat(lat: number, lon: number, zoom: number): { x: number; y: number } {
  finite(lat, "lat");
  finite(lon, "lon");
  validateZoom(zoom);
  const n = 2 ** zoom;
  const phi = clamp(lat, -MAX_LAT, MAX_LAT) * DEG;
  return { x: ((lon + 180) / 360) * n, y: clamp((1 - Math.asinh(Math.tan(phi)) / Math.PI) * n / 2, 0, n) };
}

export function tileToLatLon(x: number, y: number, zoom: number): { lat: number; lon: number } {
  finite(x, "x");
  finite(y, "y");
  validateZoom(zoom);
  const n = 2 ** zoom;
  return { lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) / DEG, lon: x / n * 360 - 180 };
}

export function metersPerPixelAtLat(lat: number, zoom: number, tileSize = TILE_SIZE): number {
  finite(lat, "lat");
  validateZoom(zoom);
  if (!Number.isFinite(tileSize) || tileSize <= 0) throw new RangeError("tileSize must be positive");
  return CIRCUMFERENCE_M * Math.cos(clamp(lat, -MAX_LAT, MAX_LAT) * DEG) / (tileSize * 2 ** zoom);
}

export function decodeTerrariumPixel(r: number, g: number, b: number): number {
  return r * 256 + g + b / 256 - 32768;
}

function validateGrid(values: Float32Array, size: number): void {
  if (!Number.isInteger(size) || size < 1 || values.length !== size * size) {
    throw new RangeError("gridSize must be positive and match the square grid length");
  }
  for (const value of values) finite(value, "grid value");
}

export interface TerrainMetrics {
  minElevationM: number;
  maxElevationM: number;
  reliefM: number;
  meanSlopeDeg: number;
  maxSlopeDeg: number;
  roverTraversablePct: number;
}

/** Row-major north to south, west to east. Normals use x=east, y=up, z=south.
 * Slopes describe the sampled surface, not a certified rover safety assessment.
 * A singleton grid has zero slope and an upward normal.
 */
export function computeTerrainMetrics(elevations: Float32Array, gridSize: number, cellSizeMeters: number): TerrainMetrics & {
  slopesDeg: Float32Array; normals: Float32Array;
} {
  validateGrid(elevations, gridSize);
  if (!Number.isFinite(cellSizeMeters) || cellSizeMeters <= 0) throw new RangeError("cellSizeMeters must be positive");
  const slopesDeg = new Float32Array(elevations.length);
  const normals = new Float32Array(elevations.length * 3);
  let minElevationM = Infinity;
  let maxElevationM = -Infinity;
  let sumSlope = 0;
  let maxSlopeDeg = 0;
  let traversable = 0;
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const i = row * gridSize + col;
      const left = Math.max(0, col - 1), right = Math.min(gridSize - 1, col + 1);
      const top = Math.max(0, row - 1), bottom = Math.min(gridSize - 1, row + 1);
      const dx = gridSize === 1 ? 0 : (elevations[row * gridSize + right] - elevations[row * gridSize + left]) / ((right - left) * cellSizeMeters);
      const dz = gridSize === 1 ? 0 : (elevations[bottom * gridSize + col] - elevations[top * gridSize + col]) / ((bottom - top) * cellSizeMeters);
      const length = Math.hypot(dx, 1, dz);
      const slope = Math.atan(Math.hypot(dx, dz)) / DEG;
      slopesDeg[i] = slope;
      normals.set([dx === 0 ? 0 : -dx / length, 1 / length, dz === 0 ? 0 : -dz / length], i * 3);
      minElevationM = Math.min(minElevationM, elevations[i]);
      maxElevationM = Math.max(maxElevationM, elevations[i]);
      sumSlope += slope;
      maxSlopeDeg = Math.max(maxSlopeDeg, slope);
      if (slope <= 15) traversable++;
    }
  }
  return { minElevationM, maxElevationM, reliefM: maxElevationM - minElevationM,
    meanSlopeDeg: sumSlope / elevations.length, maxSlopeDeg,
    roverTraversablePct: traversable / elevations.length * 100, slopesDeg, normals };
}

type Color = readonly [number, number, number];
type Stop = readonly [number, Color];

function ramp(value: number, stops: readonly Stop[], data: Uint8ClampedArray, offset: number): void {
  let upper = 1;
  while (upper < stops.length - 1 && value > stops[upper][0]) upper++;
  const [lo, a] = stops[upper - 1], [hi, b] = stops[upper];
  const t = clamp((value - lo) / (hi - lo), 0, 1);
  for (let c = 0; c < 3; c++) data[offset + c] = Math.round(a[c] + (b[c] - a[c]) * t);
  data[offset + 3] = 255;
}

/** Teal through 10°, then continuous transitions to emerald at 15°, amber
 * at 25°, and oxide at 30°. Oxide saturates above 30° (no hard color jumps).
 */
export function buildSlopeColorTextureData(slopesDeg: Float32Array, gridSize: number): Uint8ClampedArray {
  validateGrid(slopesDeg, gridSize);
  const data = new Uint8ClampedArray(slopesDeg.length * 4);
  const stops: readonly Stop[] = [[10, [6, 182, 212]], [15, [16, 185, 129]], [25, [245, 158, 11]], [30, [224, 122, 95]]];
  slopesDeg.forEach((slope, i) => ramp(slope, stops, data, i * 4));
  return data;
}

/** Dark aerospace ramp with narrow, non-antialiased contours at 10–90%.
 * Contours occupy 0.6% of total relief. Flat terrain has no contours.
 */
export function buildHypsometricTextureData(elevations: Float32Array, minElev: number, maxElev: number, gridSize: number): Uint8ClampedArray {
  validateGrid(elevations, gridSize);
  finite(minElev, "minElev");
  finite(maxElev, "maxElev");
  if (maxElev < minElev) throw new RangeError("maxElev must be >= minElev");
  const data = new Uint8ClampedArray(elevations.length * 4);
  const stops: readonly Stop[] = [[0, [13, 20, 36]], [0.35, [6, 182, 212]], [0.65, [16, 185, 129]], [0.85, [148, 163, 184]], [1, [226, 232, 240]]];
  elevations.forEach((elevation, i) => {
    const t = maxElev === minElev ? 0 : clamp((elevation - minElev) / (maxElev - minElev), 0, 1);
    ramp(t, stops, data, i * 4);
    const contour = Math.round(t * 10);
    if (contour > 0 && contour < 10 && Math.abs(t - contour / 10) <= 0.003) {
      data.set([6, 9, 19, 255], i * 4);
    }
  });
  return data;
}

/** Heuristic: flat RGB, transparent imagery, or predominantly neutral gray
 * with little contrast (including sparse placeholder lettering). Real uniform
 * ocean/snow may also trigger fallback; this is not a semantic classifier.
 */
export function isLikelyBlankOrGrayTile(rgbaData: Uint8ClampedArray): boolean {
  if (rgbaData.length % 4 !== 0) throw new RangeError("Expected complete RGBA pixels");
  const pixels = rgbaData.length / 4;
  if (pixels === 0) return true;
  const count = Math.min(pixels, 4096);
  let visible = 0, neutral = 0;
  const sums = [0, 0, 0], squares = [0, 0, 0];
  for (let sample = 0; sample < count; sample++) {
    // Evenly distributed non-strided samples reduce aliasing on tile patterns.
    const i = Math.floor((sample + 0.5) * pixels / count) * 4;
    if (rgbaData[i + 3] < 128) continue;
    visible++;
    const r = rgbaData[i], g = rgbaData[i + 1], b = rgbaData[i + 2];
    if (Math.max(r, g, b) - Math.min(r, g, b) <= 8) neutral++;
    for (let c = 0; c < 3; c++) {
      sums[c] += rgbaData[i + c];
      squares[c] += rgbaData[i + c] ** 2;
    }
  }
  if (visible < count * 0.9) return true;
  const variance = sums.map((sum, c) => Math.max(0, squares[c] / visible - (sum / visible) ** 2));
  return Math.max(...variance) < 9 || (neutral / visible > 0.95 && Math.max(...variance) < 625);
}

export interface TerrainDatasetOptions {
  lat: number;
  lon: number;
  radiusMeters?: number;
  gridSize?: number;
  demZoom?: number;
  satZoom?: number;
}

export interface TerrainDataset {
  elevations: Float32Array;
  slopesDeg: Float32Array;
  normals: Float32Array;
  metrics: TerrainMetrics;
  satelliteCanvas: HTMLCanvasElement;
  widthMeters: number;
  heightMeters: number;
  effectiveSatZoom: number;
  demZoom: number;
}

interface Bounds { left: number; top: number; right: number; bottom: number }
interface Tile { x: number; y: number }

function canvas2d(width: number, height: number): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("A 2D canvas context is required for terrain tiles");
  return { canvas, context };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const finish = (error?: Error): void => {
      clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      if (error) { image.src = ""; reject(error); } else resolve(image);
    };
    const timeout = setTimeout(() => finish(new Error(`Tile timed out: ${url}`)), 20000);
    image.crossOrigin = "anonymous";
    image.onload = () => finish(image.naturalWidth === TILE_SIZE && image.naturalHeight === TILE_SIZE ? undefined : new Error(`Invalid tile dimensions: ${url}`));
    image.onerror = () => finish(new Error(`Unable to load tile: ${url}`));
    image.src = url;
  });
}

function tilesFor(bounds: Bounds, zoom: number, dem: boolean): Tile[] {
  // DEM interpolation samples pixel centers, with a one-pixel halo at seams.
  const left = Math.floor((bounds.left - (dem ? 0.5 : 0)) / TILE_SIZE);
  const right = dem ? Math.floor((Math.floor(bounds.right - 0.5) + 1) / TILE_SIZE) : Math.ceil(bounds.right / TILE_SIZE) - 1;
  const top = Math.max(0, Math.floor((bounds.top - (dem ? 0.5 : 0)) / TILE_SIZE));
  const bottom = Math.min(2 ** zoom - 1, dem ? Math.floor((Math.floor(bounds.bottom - 0.5) + 1) / TILE_SIZE) : Math.ceil(bounds.bottom / TILE_SIZE) - 1);
  if ((right - left + 1) * (bottom - top + 1) > 4096) throw new RangeError("Requested extent exceeds 4096 tiles; reduce radius or zoom");
  const tiles: Tile[] = [];
  for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) tiles.push({ x, y });
  return tiles;
}

/** Bound concurrent requests and wait for workers before releasing a failed level. */
async function visitTiles(tiles: Tile[], visit: (tile: Tile) => Promise<void>): Promise<void> {
  let next = 0;
  let failed = false;
  let failure: unknown;
  await Promise.all(Array.from({ length: Math.min(8, tiles.length) }, async () => {
    while (!failed && next < tiles.length) {
      const tile = tiles[next++];
      try { await visit(tile); } catch (error) { failed = true; failure = error; }
    }
  }));
  if (failed) throw failure;
}

/** Local metric square in Web Mercator using scale at its center. Dimensions
 * are ground meters at that latitude; projection scale varies across the crop.
 * Grid vertices include the bounds, so cell spacing is width/(gridSize-1).
 * DEM failures are fatal; imagery retries whole levels down to z13, then throws.
 */
export async function buildTerrainDataset({ lat, lon, radiusMeters = 2800, gridSize = 192, demZoom = 13, satZoom = 16 }: TerrainDatasetOptions): Promise<TerrainDataset> {
  finite(lat, "lat");
  finite(lon, "lon");
  if (Math.abs(lat) > MAX_LAT) throw new RangeError("Latitude is outside Web Mercator coverage");
  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) throw new RangeError("radiusMeters must be positive");
  if (!Number.isInteger(gridSize) || gridSize < 2 || gridSize > 2048) throw new RangeError("gridSize must be between 2 and 2048");
  validateZoom(demZoom);
  validateZoom(satZoom);
  if (satZoom < 13) throw new RangeError("satZoom must be at least 13");
  if (typeof document === "undefined" || typeof Image === "undefined") throw new Error("buildTerrainDataset requires a browser with canvas support");
  const center = latLonToTileFloat(lat, ((lon + 180) % 360 + 360) % 360 - 180, 0);
  const half = radiusMeters / (CIRCUMFERENCE_M * Math.cos(lat * DEG));
  if (half >= 0.5 || center.y - half < 0 || center.y + half > 1) throw new RangeError("Bounding box exceeds Web Mercator coverage");
  const boundsAt = (zoom: number): Bounds => {
    const scale = TILE_SIZE * 2 ** zoom;
    return { left: (center.x - half) * scale, right: (center.x + half) * scale,
      top: (center.y - half) * scale, bottom: (center.y + half) * scale };
  };
  const wrappedX = (x: number, zoom: number): number => ((x % 2 ** zoom) + 2 ** zoom) % 2 ** zoom;
  const demBounds = boundsAt(demZoom);
  const demTiles = new Map<string, Float32Array>();
  await visitTiles(tilesFor(demBounds, demZoom, true), async ({ x, y }) => {
    const image = await loadImage(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${demZoom}/${wrappedX(x, demZoom)}/${y}.png`);
    const { canvas, context } = canvas2d(TILE_SIZE, TILE_SIZE);
    context.drawImage(image, 0, 0);
    const rgba = context.getImageData(0, 0, TILE_SIZE, TILE_SIZE).data;
    const values = new Float32Array(TILE_SIZE * TILE_SIZE);
    for (let i = 0; i < values.length; i++) {
      if (rgba[i * 4 + 3] !== 255) throw new Error("DEM tile contains missing elevation pixels");
      values[i] = decodeTerrariumPixel(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]);
    }
    demTiles.set(`${x},${y}`, values);
    canvas.width = canvas.height = 0;
  });
  const pixel = (x: number, y: number): number => {
    y = clamp(y, 0, TILE_SIZE * 2 ** demZoom - 1);
    const tx = Math.floor(x / TILE_SIZE), ty = Math.floor(y / TILE_SIZE);
    const tile = demTiles.get(`${tx},${ty}`);
    if (!tile) throw new Error("Missing DEM interpolation tile");
    return tile[(y - ty * TILE_SIZE) * TILE_SIZE + x - tx * TILE_SIZE];
  };
  const elevations = new Float32Array(gridSize * gridSize);
  for (let row = 0; row < gridSize; row++) {
    const y = demBounds.top + row / (gridSize - 1) * (demBounds.bottom - demBounds.top) - 0.5;
    const iy = Math.floor(y), fy = y - iy;
    for (let col = 0; col < gridSize; col++) {
      const x = demBounds.left + col / (gridSize - 1) * (demBounds.right - demBounds.left) - 0.5;
      const ix = Math.floor(x), fx = x - ix;
      const north = pixel(ix, iy) * (1 - fx) + pixel(ix + 1, iy) * fx;
      const south = pixel(ix, iy + 1) * (1 - fx) + pixel(ix + 1, iy + 1) * fx;
      elevations[row * gridSize + col] = north * (1 - fy) + south * fy;
    }
  }
  demTiles.clear();
  const { slopesDeg, normals, ...metrics } = computeTerrainMetrics(elevations, gridSize, radiusMeters * 2 / (gridSize - 1));
  let lastError: unknown;
  for (let zoom = satZoom; zoom >= 13; zoom--) {
    const bounds = boundsAt(zoom);
    const { canvas, context } = canvas2d(1024, 1024);
    try {
      await visitTiles(tilesFor(bounds, zoom, false), async ({ x, y }) => {
        const image = await loadImage(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${wrappedX(x, zoom)}`);
        const scratch = canvas2d(TILE_SIZE, TILE_SIZE);
        scratch.context.drawImage(image, 0, 0);
        const blank = isLikelyBlankOrGrayTile(scratch.context.getImageData(0, 0, TILE_SIZE, TILE_SIZE).data);
        scratch.canvas.width = scratch.canvas.height = 0;
        if (blank) throw new Error(`Unusable satellite tile at zoom ${zoom}`);
        // Crop source rectangles explicitly; adjacent tiles share exact edges.
        const left = Math.max(bounds.left, x * TILE_SIZE), top = Math.max(bounds.top, y * TILE_SIZE);
        const right = Math.min(bounds.right, (x + 1) * TILE_SIZE), bottom = Math.min(bounds.bottom, (y + 1) * TILE_SIZE);
        const scale = 1024 / (bounds.right - bounds.left);
        context.drawImage(image, left - x * TILE_SIZE, top - y * TILE_SIZE, right - left, bottom - top,
          (left - bounds.left) * scale, (top - bounds.top) * scale, (right - left) * scale, (bottom - top) * scale);
      });
      return { elevations, slopesDeg, normals, metrics, satelliteCanvas: canvas,
        widthMeters: radiusMeters * 2, heightMeters: radiusMeters * 2, effectiveSatZoom: zoom, demZoom };
    } catch (error) {
      lastError = error;
      canvas.width = canvas.height = 0;
    }
  }
  throw new Error(`Satellite imagery unavailable through zoom 13: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}
