import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { SITE_TRANSLATIONS, translateSite } from "../src/lib/spanishTranslations.ts";

const dataset = JSON.parse(await readFile(new URL("../public/data/analogs.json", import.meta.url), "utf8"));
const geojson = JSON.parse(await readFile(new URL("../public/data/analogs.geojson", import.meta.url), "utf8"));

test("published catalog contains 60 fully translated sites, including 12 in Ecuador", () => {
  assert.equal(dataset.sites.length, 60);
  assert.equal(new Set(dataset.sites.map((site) => site.id)).size, 60);
  assert.equal(dataset.sites.filter((site) => site.country === "Ecuador").length, 12);
  for (const site of dataset.sites) {
    const translation = SITE_TRANSLATIONS[site.id];
    for (const key of ["name", "country", "rationale", "caveat"]) {
      assert.ok(translation?.[key]?.trim(), `${site.id}: missing ${key}`);
    }
    const translated = translateSite(site);
    assert.equal(translated.rationale, translation.rationale);
    assert.equal(translated.analogy_breakdowns.site_specific, translation.caveat);
  }
});

test("published JSON and GeoJSON retain complete live telemetry and matching records", () => {
  assert.deepEqual(dataset.methodology.source_counts, { nasa_power: 60, fallback: 0 });
  assert.deepEqual(dataset.methodology.dem_source_counts, { open_meteo: 60, fallback: 0 });
  assert.equal(geojson.features.length, 60);
  assert.deepEqual(geojson.methodology, dataset.methodology);
  for (const [index, site] of dataset.sites.entries()) {
    assert.equal(site.climatology.source, "nasa_power");
    assert.equal(site.dem_telemetry.source, "open_meteo");
    assert.deepEqual(geojson.features[index].properties, site);
    assert.deepEqual(geojson.features[index].geometry.coordinates, [site.longitude, site.latitude]);
  }
});

test("Mare Tranquillitatis keeps Mauna Loa and Galapagos as the leading analogs", () => {
  const ranked = [...dataset.sites].sort((a, b) => b.scores["mare-tranquillitatis"].overall_asi - a.scores["mare-tranquillitatis"].overall_asi);
  assert.deepEqual(ranked.slice(0, 2).map((site) => site.id), ["mauna-loa-hiseas", "galapagos-lava-tubes"]);
  assert.ok(ranked.slice(2).every((site) => site.scores["mare-tranquillitatis"].overall_asi < 87.5));
});
