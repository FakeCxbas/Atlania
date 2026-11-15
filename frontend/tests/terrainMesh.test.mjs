import test from "node:test";
import { deflateSync } from "node:zlib";
import assert from "node:assert/strict";
import {
  latLonToTileFloat, tileToLatLon, metersPerPixelAtLat, decodeTerrariumPixel,
  computeTerrainMetrics, buildSlopeColorTextureData, buildHypsometricTextureData,
  isLikelyBlankOrGrayTile, buildTerrainDataset, decodePngToRgba,
} from "../src/lib/terrainMesh.ts";

const near = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const grid = (size, fn) => Float32Array.from({ length: size * size }, (_, i) => fn(i % size, Math.floor(i / size)));
const rgba = (count, fn) => Uint8ClampedArray.from({ length: count * 4 }, (_, i) => fn(Math.floor(i / 4))[i % 4]);
const color = (data, i) => Array.from(data.slice(i * 4, i * 4 + 4));

// Encode independent fixtures with real chunk CRCs and split IDAT streams.
function pngChunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  let crc = 0xffffffff;
  for (const byte of body) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  const chunk = Buffer.alloc(data.length + 12);
  chunk.writeUInt32BE(data.length);
  body.copy(chunk, 4);
  chunk.writeUInt32BE((crc ^ 0xffffffff) >>> 0, chunk.length - 4);
  return chunk;
}

function makePng(width, height, channels, pixels, filter = 0) {
  const stride = width * channels;
  const scanlines = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    const f = typeof filter === "function" ? filter(y) : filter;
    scanlines[y * (stride + 1)] = f;
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x;
      const left = x < channels ? 0 : pixels[i - channels];
      const up = y === 0 ? 0 : pixels[i - stride];
      const corner = y === 0 || x < channels ? 0 : pixels[i - stride - channels];
      const estimate = left + up - corner;
      const candidates = [left, up, corner];
      const distances = candidates.map((v) => Math.abs(v - estimate));
      const paeth = candidates[distances.indexOf(Math.min(...distances))];
      const prediction = [0, left, up, Math.floor((left + up) / 2), paeth][f] ?? 0;
      scanlines[y * (stride + 1) + 1 + x] = (pixels[i] - prediction + 256) % 256;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = channels === 3 ? 2 : 6;
  const compressed = deflateSync(scanlines);
  const split = Math.floor(compressed.length / 2);
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header), pngChunk("tEXt", Buffer.from("test\0fixture")),
    pngChunk("IDAT", compressed.subarray(0, split)), pngChunk("IDAT", compressed.subarray(split)),
    pngChunk("IEND", Buffer.alloc(0))]);
  return png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength);
}

for (const channels of [3, 4]) for (const filter of [0, 1, 2, 3, 4]) {
  test(`PNG exact ${channels === 3 ? "RGB" : "RGBA"} bytes with filter ${filter}`, async () => {
    const pixels = Uint8Array.from({ length: 7 * 6 * channels }, (_, i) => (i * 73 + i * i * 19) % 256);
    const decoded = await decodePngToRgba(makePng(7, 6, channels, pixels, filter));
    assert.equal(decoded.width, 7);
    assert.equal(decoded.height, 6);
    assert.ok(decoded.data instanceof Uint8ClampedArray);
    assert.deepEqual(decoded.data, rgba(42, (i) => [...pixels.slice(i * channels, i * channels + 3), channels === 4 ? pixels[i * channels + 3] : 255]));
  });
}

test("PNG rejects malformed, truncated, unsupported and invalid-filter data", async () => {
  await assert.rejects(decodePngToRgba(new ArrayBuffer(8)), /Invalid PNG/);
  const valid = makePng(1, 1, 3, [128, 0, 0]);
  await assert.rejects(decodePngToRgba(valid.slice(0, -1)), /Invalid PNG/);
  await assert.rejects(decodePngToRgba(makePng(1, 1, 3, [128, 0, 0], 5)), /Invalid PNG/);
  const unsupported = valid.slice(0);
  new Uint8Array(unsupported)[24] = 16;
  await assert.rejects(decodePngToRgba(unsupported), /Unsupported PNG format/);
});

test("Web Mercator known landmarks, poles, unwrapped longitude and inverse", () => {
  assert.deepEqual(latLonToTileFloat(0, 0, 0), { x: 0.5, y: 0.5 });
  assert.deepEqual(tileToLatLon(1, 1, 1), { lat: 0, lon: 0 });
  near(latLonToTileFloat(90, -180, 3).y, 0);
  near(latLonToTileFloat(-90, 180, 3).y, 8);
  assert.equal(latLonToTileFloat(0, 181, 0).x > 1, true);
  for (const [lat, lon] of [[-0.67, -90.5], [-24.5, -69.2], [28.99, -13.7], [80, 179.99], [-80, -179.99], [35, 181]]) {
    for (const zoom of [0, 8, 13, 16, 24]) {
      const tile = latLonToTileFloat(lat, lon, zoom);
      const inverse = tileToLatLon(tile.x, tile.y, zoom);
      near(inverse.lat, lat);
      near(inverse.lon, lon);
    }
  }
});

test("ground pixel scale uses WGS84 circumference, cosine latitude and tile size", () => {
  near(metersPerPixelAtLat(0, 0), 156543.03392804097);
  near(metersPerPixelAtLat(60, 0), metersPerPixelAtLat(0, 0) / 2);
  near(metersPerPixelAtLat(-60, 10), metersPerPixelAtLat(60, 10));
  near(metersPerPixelAtLat(0, 13, 512), metersPerPixelAtLat(0, 14));
  assert.ok(metersPerPixelAtLat(90, 10) > 0);
});

test("Mercator helpers reject non-finite coordinates and invalid scales", () => {
  for (const bad of [NaN, Infinity, -Infinity]) {
    assert.throws(() => latLonToTileFloat(bad, 0, 1), RangeError);
    assert.throws(() => latLonToTileFloat(0, bad, 1), RangeError);
    assert.throws(() => tileToLatLon(bad, 0, 1), RangeError);
    assert.throws(() => tileToLatLon(0, bad, 1), RangeError);
    assert.throws(() => metersPerPixelAtLat(bad, 1), RangeError);
  }
  for (const zoom of [-1, 1.5, 25, NaN]) {
    assert.throws(() => latLonToTileFloat(0, 0, zoom), RangeError);
    assert.throws(() => tileToLatLon(0, 0, zoom), RangeError);
    assert.throws(() => metersPerPixelAtLat(0, zoom), RangeError);
  }
  for (const size of [0, -1, NaN, Infinity]) assert.throws(() => metersPerPixelAtLat(0, 1, size), RangeError);
});

test("Terrarium decodes zero, negative, maximum and fractional elevations", () => {
  assert.equal(decodeTerrariumPixel(128, 0, 0), 0);
  assert.equal(decodeTerrariumPixel(0, 0, 0), -32768);
  assert.equal(decodeTerrariumPixel(127, 255, 128), -0.5);
  assert.equal(decodeTerrariumPixel(128, 100, 64), 100.25);
  assert.equal(decodeTerrariumPixel(255, 255, 255), 32767 + 255 / 256);
});

test("flat and singleton terrain have upward normals, zero slope, and full traversability", () => {
  for (const size of [1, 2, 5]) {
    const elevations = grid(size, () => -120);
    const original = elevations.slice();
    const result = computeTerrainMetrics(elevations, size, 10);
    assert.equal(result.minElevationM, -120);
    assert.equal(result.maxElevationM, -120);
    assert.equal(result.reliefM, 0);
    assert.equal(result.meanSlopeDeg, 0);
    assert.equal(result.maxSlopeDeg, 0);
    assert.equal(result.roverTraversablePct, 100);
    assert.deepEqual(elevations, original);
    assert.ok(result.slopesDeg instanceof Float32Array);
    assert.ok(result.normals instanceof Float32Array);
    for (let i = 0; i < size * size; i++) assert.deepEqual(Array.from(result.normals.slice(i * 3, i * 3 + 3)), [0, 1, 0]);
  }
});

test("inclined planes have exact finite differences at interiors, edges and corners", () => {
  for (const [east, south] of [[1, 0], [0, -1], [0.1, 0.2], [-0.5, 0.75]]) {
    const elevations = grid(5, (x, z) => -50 + 20 * (east * x + south * z));
    const result = computeTerrainMetrics(elevations, 5, 20);
    const slope = Math.atan(Math.hypot(east, south)) * 180 / Math.PI;
    near(result.meanSlopeDeg, slope);
    near(result.maxSlopeDeg, slope);
    assert.equal(result.minElevationM, Math.min(...elevations));
    assert.equal(result.maxElevationM, Math.max(...elevations));
    assert.equal(result.reliefM, Math.max(...elevations) - Math.min(...elevations));
    assert.equal(result.roverTraversablePct, slope <= 15 ? 100 : 0);
    for (let i = 0; i < 25; i++) {
      near(result.slopesDeg[i], slope, 4e-6);
      const [nx, ny, nz] = result.normals.slice(i * 3, i * 3 + 3);
      near(Math.hypot(nx, ny, nz), 1);
      near(nx + east * ny, 0);
      near(nz + south * ny, 0);
    }
  }
});

test("quadratic terrain uses central interior and one-sided boundary derivatives", () => {
  const result = computeTerrainMetrics(grid(3, (x) => x * x), 3, 1);
  const expected = [1, 2, 3].map((gradient) => Math.atan(gradient) * 180 / Math.PI);
  for (let i = 0; i < 9; i++) near(result.slopesDeg[i], expected[i % 3], 4e-6);
  near(result.meanSlopeDeg, expected.reduce((a, b) => a + b) / 3);
});

test("traversability counts cells near the 15 degree cutoff and mixed terrain", () => {
  for (const [degrees, pct] of [[14.999, 100], [15.001, 0]]) {
    const result = computeTerrainMetrics(grid(3, (x) => x * Math.tan(degrees * Math.PI / 180)), 3, 1);
    assert.equal(result.roverTraversablePct, pct);
  }
  const result = computeTerrainMetrics(grid(3, (x) => [0, 0, 2][x]), 3, 1);
  near(result.roverTraversablePct, 100 / 3);
  const exact = computeTerrainMetrics(grid(2, (x) => x), 2, 1 / Math.tan(15 * Math.PI / 180));
  assert.equal(exact.roverTraversablePct, 100);
});

test("grid helpers reject mismatched, empty and non-finite grids", () => {
  for (const [values, size] of [[new Float32Array(), 0], [new Float32Array(3), 2], [new Float32Array(4), 1.5], [new Float32Array([NaN]), 1], [new Float32Array([Infinity]), 1]]) {
    assert.throws(() => computeTerrainMetrics(values, size, 1), RangeError);
    assert.throws(() => buildSlopeColorTextureData(values, size), RangeError);
    assert.throws(() => buildHypsometricTextureData(values, 0, 1, size), RangeError);
  }
  for (const spacing of [0, -1, NaN, Infinity]) assert.throws(() => computeTerrainMetrics(new Float32Array(4), 2, spacing), RangeError);
});

test("slope colors have exact stops, smooth interpolation, saturation and opaque alpha", () => {
  const slopes = new Float32Array([-5, 0, 10, 12.5, 15, 20, 25, 27.5, 90]);
  const data = buildSlopeColorTextureData(slopes, 3);
  assert.ok(data instanceof Uint8ClampedArray);
  assert.equal(data.length, 36);
  for (const i of [0, 1, 2]) assert.deepEqual(color(data, i), [6, 182, 212, 255]);
  assert.deepEqual(color(data, 3), [11, 184, 171, 255]);
  assert.deepEqual(color(data, 4), [16, 185, 129, 255]);
  assert.deepEqual(color(data, 5), [131, 172, 70, 255]);
  assert.deepEqual(color(data, 6), [245, 158, 11, 255]);
  assert.deepEqual(color(data, 7), [235, 140, 53, 255]);
  assert.deepEqual(color(data, 8), [224, 122, 95, 255]);
});

test("hypsometric ramp clamps, supports negative/flat elevations and crisp 10% contours", () => {
  const data = buildHypsometricTextureData(new Float32Array([-200, -100, -90, -89, -65, -35, -15, 0, 200]), -100, 0, 3);
  assert.deepEqual(color(data, 0), [13, 20, 36, 255]);
  assert.deepEqual(color(data, 1), color(data, 0));
  assert.deepEqual(color(data, 2), [6, 9, 19, 255]);
  assert.notDeepEqual(color(data, 3), color(data, 2));
  assert.deepEqual(color(data, 4), [6, 182, 212, 255]);
  assert.deepEqual(color(data, 5), [16, 185, 129, 255]);
  assert.deepEqual(color(data, 6), [148, 163, 184, 255]);
  assert.deepEqual(color(data, 7), [226, 232, 240, 255]);
  assert.deepEqual(color(data, 8), color(data, 7));
  for (let contour = 1; contour <= 9; contour++) {
    assert.deepEqual(color(buildHypsometricTextureData(new Float32Array([contour * 10]), 0, 100, 1), 0), [6, 9, 19, 255]);
  }
  assert.deepEqual(color(buildHypsometricTextureData(new Float32Array([-5]), -5, -5, 1), 0), [13, 20, 36, 255]);
  for (const [min, max] of [[2, 1], [NaN, 1], [0, Infinity]]) assert.throws(() => buildHypsometricTextureData(new Float32Array([0]), min, max, 1), RangeError);
});

test("blank detection catches empty, solid, transparent and gray tiles with lettering", () => {
  assert.equal(isLikelyBlankOrGrayTile(new Uint8ClampedArray()), true);
  for (const rgb of [[0, 0, 0], [255, 255, 255], [120, 120, 120], [20, 130, 210]]) {
    assert.equal(isLikelyBlankOrGrayTile(rgba(256 * 256, () => [...rgb, 255])), true);
  }
  assert.equal(isLikelyBlankOrGrayTile(rgba(4096, (i) => [i % 256, 120, 40, 0])), true);
  assert.equal(isLikelyBlankOrGrayTile(rgba(65536, (i) => { const v = i % 100 < 2 ? 80 : 180 + i % 3; return [v, v, v, 255]; })), true);
  assert.throws(() => isLikelyBlankOrGrayTile(new Uint8ClampedArray(3)), RangeError);
});

test("blank detection retains textured color imagery and high-contrast grayscale", () => {
  assert.equal(isLikelyBlankOrGrayTile(rgba(65536, (i) => [i % 251, (i * 7) % 239, (i * 13) % 233, 255])), false);
  assert.equal(isLikelyBlankOrGrayTile(rgba(4096, (i) => { const v = i % 2 ? 255 : 0; return [v, v, v, 255]; })), false);
});

// Deterministic browser doubles exercise the public loader without network/DOM.
function mockBrowser(t, satelliteStatus = () => "good", demStatus = "dem") {
  const requests = [], draws = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.deepEqual(options, { mode: "cors" });
    assert.ok(url.includes("terrarium"));
    requests.push(url);
    if (demStatus === "fail") return new Response(null, { status: 503 });
    // A continuous plane in global DEM pixel coordinates, across seams.
    const [z, x, y] = url.split("/").slice(-3).map((v) => parseInt(v, 10));
    const pixels = rgba(65536, (i) => {
      const worldX = x * 256 + i % 256, worldY = y * 256 + Math.floor(i / 256);
      const height = 100 + (worldX - 2 ** z * 128) / 4 + (worldY - 2 ** z * 128) / 8;
      // Wrapped test locations use a constant DEM to avoid overflow.
      const encoded = 32768 + (Math.abs(height) < 30000 ? height : 100);
      return [Math.floor(encoded / 256), Math.floor(encoded) % 256, Math.round((encoded % 1) * 256), 255];
    });
    return new Response(makePng(256, 256, 4, pixels, (y) => y % 5));
  });
  class MockImage {
    naturalWidth = 256;
    naturalHeight = 256;
    set src(url) {
      if (!url) return;
      assert.equal(this.crossOrigin, "anonymous");
      this.url = url;
      requests.push(url);
      const parts = url.split("/").slice(-3).map(Number);
      this.zoom = parts[0];
      this.status = url.includes("terrarium") ? demStatus : satelliteStatus(this.zoom, url);
      queueMicrotask(() => this.status === "fail" ? this.onerror?.() : this.onload?.());
    }
  }
  t.mock.method(globalThis, "setTimeout", () => 0);
  t.mock.method(globalThis, "clearTimeout", () => {});
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const oldImage = Object.getOwnPropertyDescriptor(globalThis, "Image");
  Object.defineProperty(globalThis, "Image", { configurable: true, value: MockImage });
  Object.defineProperty(globalThis, "document", { configurable: true, value: {
    createElement() {
      const canvas = { width: 0, height: 0 };
      let image;
      canvas.getContext = () => ({
        drawImage(img, ...args) { image = img; if (canvas.width === 1024) draws.push({ canvas, args, url: img.url }); },
        getImageData() {
          if (image.status === "dem") {
            throw new Error("DEM canvas readback must not occur");
          }
          return { data: image.status === "blank" ? rgba(65536, () => [180, 180, 180, 255]) : rgba(65536, (i) => [i % 251, i % 131, i % 71, 255]) };
        },
      });
      return canvas;
    },
  } });
  t.after(() => {
    if (oldDocument) Object.defineProperty(globalThis, "document", oldDocument); else delete globalThis.document;
    if (oldImage) Object.defineProperty(globalThis, "Image", oldImage); else delete globalThis.Image;
  });
  return { requests, draws };
}

test("loader fetches real PNG bytes without DEM canvas readback and resamples across seams", async (t) => {
  const { requests, draws } = mockBrowser(t);
  const result = await buildTerrainDataset({ lat: 0, lon: 0, radiusMeters: 100, gridSize: 3 });
  const mpp = metersPerPixelAtLat(0, 13);
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
    near(result.elevations[row * 3 + col], 100 + ((col - 1) * 100 / mpp - 0.5) / 4 + ((row - 1) * 100 / mpp - 0.5) / 8, 1e-5);
  }
  near(result.metrics.meanSlopeDeg, Math.atan(Math.hypot(0.25, 0.125) / mpp) * 180 / Math.PI, 1e-5);
  assert.equal(result.effectiveSatZoom, 16);
  assert.equal(result.demZoom, 13);
  assert.equal(result.widthMeters, 200);
  assert.equal(result.heightMeters, 200);
  assert.equal(result.satelliteCanvas.width, 1024);
  assert.equal(result.satelliteCanvas.height, 1024);
  assert.equal(result.slopesDeg.length, 9);
  assert.equal(result.normals.length, 27);
  assert.equal(requests.filter((url) => url.includes("terrarium")).length, 4);
  let area = 0;
  for (const { args: [sx, sy, sw, sh, dx, dy, dw, dh] } of draws) {
    assert.ok(sx >= 0 && sy >= 0 && sx + sw <= 256 + 1e-6 && sy + sh <= 256 + 1e-6);
    assert.ok(dx >= 0 && dy >= 0 && dx + dw <= 1024 + 1e-6 && dy + dh <= 1024 + 1e-6);
    area += dw * dh;
  }
  near(area, 1024 * 1024, 1e-4);
});

for (const [delta, connected, expected] of [[256, false, 100], [-256, false, 100], [180, false, 280], [256, true, 356]]) {
  test(`DEM despike delta=${delta}, connected=${connected}`, async (t) => {
    mockBrowser(t);
    const pixels = rgba(65536, (i) => {
      const spike = i === 128 * 256 + 128 || (connected && i === 128 * 256 + 129);
      const encoded = 32768 + 100 + (spike ? delta : 0);
      return [Math.floor(encoded / 256), encoded % 256, 0, 255];
    });
    const png = makePng(256, 256, 4, pixels);
    t.mock.method(globalThis, "fetch", async () => new Response(png));
    const location = tileToLatLon(4096 + 128.5 / 256, 4096 + 128.5 / 256, 13);
    const result = await buildTerrainDataset({ ...location, radiusMeters: 20, gridSize: 3, satZoom: 13 });
    near(result.elevations[4], expected, 1e-4);
  });
}

test("corrupt PNG and network failures never fall back to canvas", async (t) => {
  const { requests } = mockBrowser(t);
  t.mock.method(globalThis, "fetch", async () => new Response(new Uint8Array(8)));
  await assert.rejects(buildTerrainDataset({ lat: 0, lon: 0, radiusMeters: 20, gridSize: 2 }), /Invalid PNG/);
  t.mock.method(globalThis, "fetch", async () => { throw new Error("Network failure"); });
  await assert.rejects(buildTerrainDataset({ lat: 0, lon: 0, radiusMeters: 20, gridSize: 2 }), /Network failure/);
  assert.deepEqual(requests, []);
});

test("only unsupported PNG formats use the legacy image path", async (t) => {
  const { requests } = mockBrowser(t, () => "good", "blank");
  const header = Buffer.alloc(13);
  header.writeUInt32BE(256);
  header.writeUInt32BE(256, 4);
  header[8] = 1;
  header[9] = 0;
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header), pngChunk("IDAT", deflateSync(Buffer.alloc(256 * 33))),
    pngChunk("IEND", Buffer.alloc(0))]);
  t.mock.method(globalThis, "fetch", async () => new Response(png));
  const result = await buildTerrainDataset({ lat: 0, lon: 0, radiusMeters: 20, gridSize: 2, satZoom: 13 });
  assert.ok(requests.some((url) => url.includes("terrarium")));
  assert.equal(result.elevations[0], decodeTerrariumPixel(180, 180, 180));
});

test("loader retries entire satellite levels after gray tiles and errors, through z13", async (t) => {
  const { requests, draws } = mockBrowser(t, (zoom) => zoom === 16 ? "blank" : zoom > 13 ? "fail" : "good");
  const result = await buildTerrainDataset({ lat: 0, lon: 0, radiusMeters: 20, gridSize: 2 });
  assert.equal(result.effectiveSatZoom, 13);
  for (const zoom of [16, 15, 14, 13]) assert.ok(requests.some((url) => url.includes(`/tile/${zoom}/`)));
  assert.ok(draws.filter(({ canvas }) => canvas === result.satelliteCanvas).every(({ url }) => url.includes("/tile/13/")));
});

test("loader refuses unusable imagery at every level instead of returning gray pixels", async (t) => {
  const { requests } = mockBrowser(t, () => "blank");
  await assert.rejects(buildTerrainDataset({ lat: 0, lon: 0, radiusMeters: 20, gridSize: 2, satZoom: 14 }), /unavailable through zoom 13/);
  assert.ok(!requests.some((url) => url.includes("/tile/12/")));
});

test("one bad tile discards the entire higher-resolution satellite canvas", async (t) => {
  let first = true;
  const { draws } = mockBrowser(t, (zoom) => {
    if (zoom === 16 && first) { first = false; return "blank"; }
    return "good";
  });
  const result = await buildTerrainDataset({ lat: 0, lon: 0, radiusMeters: 20, gridSize: 2 });
  assert.equal(result.effectiveSatZoom, 15);
  const discarded = draws.filter(({ url }) => url.includes("/tile/16/"));
  assert.ok(discarded.length > 0);
  assert.ok(discarded.every(({ canvas }) => canvas !== result.satelliteCanvas && canvas.width === 0));
});

test("DEM failures are fatal and do not produce invented elevations", async (t) => {
  const { requests } = mockBrowser(t, () => "good", "fail");
  await assert.rejects(buildTerrainDataset({ lat: 0, lon: 0, radiusMeters: 20, gridSize: 2 }), /Unable to load tile/);
  assert.ok(requests.every((url) => url.includes("terrarium")));
});

test("loader rejects extents crossing Mercator limits and excessive tile counts before fetching", async (t) => {
  const { requests } = mockBrowser(t);
  await assert.rejects(buildTerrainDataset({ lat: 85, lon: 0, radiusMeters: 100000 }), /coverage/);
  await assert.rejects(buildTerrainDataset({ lat: 0, lon: 0, radiusMeters: 30000000 }), /coverage/);
  await assert.rejects(buildTerrainDataset({ lat: 0, lon: 0, demZoom: 24 }), /4096 tiles/);
  assert.equal(requests.length, 0);
});

test("loader wraps antimeridian tile requests into valid indices", async (t) => {
  const { requests } = mockBrowser(t);
  await buildTerrainDataset({ lat: 0, lon: 180, radiusMeters: 20, gridSize: 2, satZoom: 13 });
  for (const url of requests) {
    const [zoom, a, b] = url.split("/").slice(-3).map((v) => parseInt(v, 10));
    assert.ok(a >= 0 && a < 2 ** zoom);
    assert.ok(b >= 0 && b < 2 ** zoom);
  }
  assert.ok(requests.some((url) => url.endsWith("/8191")));
  assert.ok(requests.some((url) => url.endsWith("/0")));
});

test("loader reports invalid options and missing browser explicitly", async () => {
  for (const options of [{ lat: NaN }, { lon: Infinity }, { lat: 89 }, { radiusMeters: 0 }, { gridSize: 1 }, { gridSize: 2049 }, { demZoom: -1 }, { satZoom: 12 }]) {
    await assert.rejects(buildTerrainDataset({ lat: 0, lon: 0, ...options }), RangeError);
  }
  await assert.rejects(buildTerrainDataset({ lat: 0, lon: 0 }), /requires a browser/);
});
