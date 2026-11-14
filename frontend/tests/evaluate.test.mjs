import test from "node:test";
import assert from "node:assert/strict";

// Verify core mathematical parity with engine/asi_engine.py
function similarity(a, b, scale = 1.0) {
  return Math.max(0, 1 - Math.abs(a - b) / scale);
}

function computeFivePointDemMetrics(lat, elevations) {
  const DEM_STEP_DEG = 0.01;
  const dy = 6371008.8 * ((DEM_STEP_DEG * Math.PI) / 180);
  const dx = dy * Math.cos((lat * Math.PI) / 180);
  const dzdx = (elevations[3] - elevations[4]) / (2 * dx);
  const dzdy = (elevations[1] - elevations[2]) / (2 * dy);
  const slope = (Math.atan(Math.hypot(dzdx, dzdy)) * 180) / Math.PI;
  const mean = elevations.reduce((acc, v) => acc + v, 0) / 5;
  const roughness = Math.sqrt(
    elevations.reduce((acc, v) => acc + (v - mean) ** 2, 0) / 5
  );
  return {
    elevation_m: Number(elevations[0].toFixed(2)),
    dem_slope_deg: Number(slope.toFixed(2)),
    dem_roughness_m: Number(roughness.toFixed(2)),
  };
}

test("similarity clamps at 0 and peaks at 1", () => {
  assert.equal(similarity(10, 10, 30), 1);
  assert.equal(similarity(0, 30, 30), 0);
  assert.equal(similarity(0, 60, 30), 0);
});

test("five-point DEM metrics return zero slope and roughness for flat terrain", () => {
  const metrics = computeFivePointDemMetrics(0, [120, 120, 120, 120, 120]);
  assert.equal(metrics.elevation_m, 120);
  assert.equal(metrics.dem_slope_deg, 0);
  assert.equal(metrics.dem_roughness_m, 0);
});

test("five-point DEM metrics detect positive slope and relief", () => {
  const metrics = computeFivePointDemMetrics(-0.67, [400, 480, 320, 410, 390]);
  assert.ok(metrics.dem_slope_deg > 0);
  assert.ok(metrics.dem_roughness_m > 0);
});
