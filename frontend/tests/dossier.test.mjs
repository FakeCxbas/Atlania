import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createDossier, dossierMarkdown } from "../src/lib/dossier.ts";

const dataset = JSON.parse(
  await readFile(
    new URL("../public/data/analogs.json", import.meta.url),
    "utf8",
  ),
);

test("exports every site's selected comparison, rather than its best-match score", () => {
  for (const site of dataset.sites) {
    for (const targetId of Object.keys(site.scores)) {
      const dossier = JSON.parse(
        JSON.stringify(createDossier(dataset, site, targetId)),
      );
      assert.equal(dossier.comparison.target_id, targetId);
      assert.deepEqual(dossier.comparison.score, site.scores[targetId]);
      assert.deepEqual(dossier.comparison.target, dataset.references[targetId]);
      assert.deepEqual(dossier.site, site);
      assert.deepEqual(dossier.methodology, dataset.methodology);
      const markdown = dossierMarkdown(dossier);
      assert.ok(
        markdown.includes(
          `ASI: ${site.scores[targetId].overall_asi.toFixed(2)} / 100`,
        ),
      );
      assert.ok(markdown.includes(site.climatology.source_url));
      assert.ok(
        markdown.includes(
          `Solar irradiance: ${site.climatology.solar_irradiance_kwh_m2_day}`,
        ),
      );
      assert.ok(
        markdown.includes(`DEM elevation: ${site.dem_telemetry.elevation_m}`),
      );
      assert.ok(markdown.includes(dataset.references[targetId].source_url));
      for (const value of Object.values(
        site.scores[targetId].analogy_breakdowns,
      )) {
        assert.ok(markdown.replaceAll("\\", "").includes(value));
      }
    }
  }
});

test("an unavailable comparison falls back to the current site's best target", () => {
  const site = dataset.sites[0];
  assert.equal(
    createDossier(dataset, site, "unknown").comparison.target_id,
    site.best_target,
  );
});

test("fallback climate is explicitly labeled with its reason", () => {
  const site = structuredClone(dataset.sites[0]);
  site.climatology.source = "fallback";
  site.climatology.fallback_reason = "Source unavailable";
  const markdown = dossierMarkdown(
    createDossier(dataset, site, site.best_target),
  );
  assert.ok(
    markdown.includes("FALLBACK — illustrative estimates, not observations"),
  );
  assert.ok(markdown.includes("Source unavailable"));
});

test("empty strengths and Markdown-special site names remain readable", () => {
  const site = structuredClone(dataset.sites[0]);
  site.name = "Example [site] | *name*\n# extra heading";
  site.scores[site.best_target].analogy_strengths = [];
  const markdown = dossierMarkdown(
    createDossier(dataset, site, site.best_target),
  );
  assert.ok(
    markdown.includes("No dimension reaches the 70/100 strength threshold."),
  );
  assert.ok(
    markdown.startsWith(
      "# ASI Dossier: Example \\[site\\] \\| \\*name\\* \\# extra heading\n",
    ),
  );
});
