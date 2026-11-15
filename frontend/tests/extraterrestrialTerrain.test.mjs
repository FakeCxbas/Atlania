import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildExtraterrestrialTerrainData } from "../src/lib/extraterrestrialTerrain.ts";

const analogs = JSON.parse(
  readFileSync(new URL("../public/data/analogs.json", import.meta.url), "utf8")
);

test("builds valid parametric 3D terrain for all Moon and Mars reference targets", () => {
  const refs = Object.values(analogs.references);
  assert.equal(refs.length, 6);

  for (const target of refs) {
    const result = buildExtraterrestrialTerrainData(target, {
      radiusMeters: 2400,
      gridSize: 48,
    });

    assert.equal(result.gridSize, 48);
    assert.equal(result.elevations.length, 48 * 48);
    assert.equal(result.slopesDeg.length, 48 * 48);
    assert.equal(result.normals.length, 48 * 48 * 3);
    assert.equal(result.surfaceRgba.length, 48 * 48 * 4);
    assert.ok(Number.isFinite(result.metrics.reliefM) && result.metrics.reliefM > 0);
    assert.ok(
      result.metrics.roverTraversablePct >= 0 && result.metrics.roverTraversablePct <= 100
    );
    assert.ok(result.morphologyLabel.length > 0);
  }
});

test("canyon and polar crater targets exhibit steeper mean slopes than mare plain", () => {
  const refs = analogs.references;
  const mare = buildExtraterrestrialTerrainData(refs["mare-tranquillitatis"], { gridSize: 64 });
  const shackleton = buildExtraterrestrialTerrainData(refs["shackleton-crater"], { gridSize: 64 });
  const valles = buildExtraterrestrialTerrainData(refs["valles-marineris"], { gridSize: 64 });

  assert.ok(
    shackleton.metrics.meanSlopeDeg > mare.metrics.meanSlopeDeg,
    `Expected Shackleton (${shackleton.metrics.meanSlopeDeg}) > Mare (${mare.metrics.meanSlopeDeg})`
  );
  assert.ok(
    valles.metrics.meanSlopeDeg > mare.metrics.meanSlopeDeg,
    `Expected Valles Marineris (${valles.metrics.meanSlopeDeg}) > Mare (${mare.metrics.meanSlopeDeg})`
  );
});
