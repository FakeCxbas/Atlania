import type { AnalogDataset, AnalogSite } from "../types/analog";

export const DIMENSIONS = [
  { key: "topography", label: "Topography & Slope" },
  { key: "geology", label: "Geology & Mineralogy" },
  { key: "thermal", label: "Thermal Regime" },
  { key: "hydrology_ice", label: "Aridity / Ice Potential" },
  { key: "subsurface_ops", label: "Subsurface & Ops" },
] as const;

export function createDossier(
  dataset: AnalogDataset,
  site: AnalogSite,
  targetId: string,
) {
  const resolvedTargetId = site.scores[targetId] ? targetId : site.best_target;
  return {
    schema_version: dataset.schema_version,
    methodology: dataset.methodology,
    site,
    comparison: {
      target_id: resolvedTargetId,
      target: dataset.references[resolvedTargetId],
      score: site.scores[resolvedTargetId],
    },
  };
}

// Keep dataset prose literal when inserted into Markdown tables or headings.
function escapeMarkdown(value: string) {
  return value
    .replace(/([\\`*_{}\[\]<>()#+.!|~-])/g, "\\$1")
    .replace(/\r?\n/g, " ");
}

export function dossierMarkdown(dossier: ReturnType<typeof createDossier>) {
  const { site, comparison, methodology } = dossier;
  const { score, target, target_id } = comparison;
  const e = escapeMarkdown;
  return [
    `# ASI Dossier: ${e(site.name)}`,
    "",
    `Country: ${e(site.country)} | Coordinates: ${site.latitude}, ${site.longitude} | Elevation: ${site.elevation_m} m`,
    "",
    e(site.rationale),
    "",
    `Prior status: ${e(site.prior_status)}`,
    "",
    `## Selected comparison: ${e(target?.name ?? target_id)}`,
    `ASI: ${score.overall_asi.toFixed(2)} / 100`,
    "",
    "| Dimension | Score / 100 | Weight |",
    "| --- | ---: | ---: |",
    ...DIMENSIONS.map(
      ({ key, label }) =>
        `| ${label} | ${score.dimensions[key].toFixed(2)} | ${(score.weights[key] * 100).toFixed(0)}% |`,
    ),
    "",
    "## Analogy strengths",
    ...(score.analogy_strengths.length
      ? score.analogy_strengths.map((s) => `- ${e(s)}`)
      : ["No dimension reaches the 70/100 strength threshold."]),
    "",
    "## Analogy breakdowns",
    ...Object.entries(score.analogy_breakdowns).map(
      ([key, value]) => `- ${e(key.replaceAll("_", " "))}: ${e(value)}`,
    ),
    "",
    "## Terrain telemetry & mission context",
    `Discovery tier: ${e(site.discovery_tier)}`,
    `Mission testbeds: ${site.mission_testbeds.map(e).join(", ")}`,
    `DEM elevation: ${site.dem_telemetry.elevation_m} m | Slope: ${site.dem_telemetry.dem_slope_deg}° | Roughness: ${site.dem_telemetry.dem_roughness_m} m`,
    `DEM source: ${site.dem_telemetry.source} | Attribution: ${e(site.dem_telemetry.attribution)}`,
    `DEM fallback reason: ${e(site.dem_telemetry.fallback_reason ?? "None")}`,
    "DEM measurements are context only; ASI terrain scores retain illustrative priors.",
    "",
    "## Earth climatology & sources",
    `Source: ${site.climatology.source === "nasa_power" ? "NASA POWER climatology" : "FALLBACK — illustrative estimates, not observations"}`,
    `Fallback reason: ${e(site.climatology.fallback_reason ?? "None")}`,
    `Temperature min/max: ${site.climatology.tmin_c} / ${site.climatology.tmax_c} °C`,
    `Precipitation: ${site.climatology.precipitation_mm_day} mm/day`,
    `Wind: ${site.climatology.wind_m_s} m/s | Relative humidity: ${site.climatology.relative_humidity_pct}%`,
    `Solar irradiance: ${site.climatology.solar_irradiance_kwh_m2_day} kWh/m²/day | Surface pressure: ${site.climatology.surface_pressure_kpa} kPa`,
    `Aggregation: ${e(site.climatology.aggregation)}`,
    `POWER source: ${site.climatology.source_url}`,
    `Target source: ${target?.source_url ?? "Unavailable"}`,
    "",
    "## Methodology & limitations",
    `${e(methodology.name)} v${e(methodology.version)} | Dataset schema: ${e(dossier.schema_version)}`,
    "ASI = sum(target weight × dimension score). Strengths require a dimension score of at least 70/100.",
    e(methodology.interpretation),
    e(methodology.climate_limitations),
    "",
  ].join("\n");
}

export function downloadDossier(
  dataset: AnalogDataset,
  site: AnalogSite,
  targetId: string,
  format: "json" | "md",
) {
  const dossier = createDossier(dataset, site, targetId);
  const content =
    format === "json"
      ? JSON.stringify(dossier, null, 2)
      : dossierMarkdown(dossier);
  const blob = new Blob([content], {
    type:
      format === "json"
        ? "application/json;charset=utf-8"
        : "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    `asi-${site.id}-${dossier.comparison.target_id}.${format}`.replace(
      /[^a-zA-Z0-9._-]/g,
      "-",
    );
  document.body.append(link);
  link.click();
  link.remove();
  // Allow the browser to start reading the object URL before releasing it.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildQgisGeoJson(
  sites: AnalogSite[],
  references: Record<string, { name: string; body: "Moon" | "Mars" }>,
) {
  return {
    type: "FeatureCollection" as const,
    name: "planetary_analog_sites_epsg4326",
    crs: {
      type: "name",
      properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
    },
    features: sites.map((site) => {
      const ref = references[site.best_target];
      const bestScore = site.scores[site.best_target];
      return {
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [site.longitude, site.latitude] as [number, number],
        },
        properties: {
          id: site.id,
          name: site.name,
          country: site.country,
          discovery_tier: site.discovery_tier,
          elevation_m: site.elevation_m,
          dem_slope_deg: site.dem_telemetry.dem_slope_deg,
          dem_roughness_m: site.dem_telemetry.dem_roughness_m,
          best_target: site.best_target,
          best_target_name: ref?.name ?? site.best_target,
          target_body: ref?.body ?? "Moon",
          overall_asi: site.overall_asi,
          topography_score: bestScore?.dimensions.topography ?? null,
          geology_score: bestScore?.dimensions.geology ?? null,
          thermal_score: bestScore?.dimensions.thermal ?? null,
          hydrology_ice_score: bestScore?.dimensions.hydrology_ice ?? null,
          subsurface_ops_score: bestScore?.dimensions.subsurface_ops ?? null,
          analogy_strengths: site.analogy_strengths.join(" | "),
          analogy_limitations: Object.values(site.analogy_breakdowns).join(" | "),
          mission_testbeds: site.mission_testbeds.join(" | "),
          climate_source: site.climatology.source,
          dem_source: site.dem_telemetry.source,
        },
      };
    }),
  };
}

export function downloadQgisGeoJson(
  sites: AnalogSite[],
  references: Record<string, { name: string; body: "Moon" | "Mars" }>,
  filename = "planetary-analogs-qgis.geojson",
) {
  const fc = buildQgisGeoJson(sites, references);
  const blob = new Blob([JSON.stringify(fc, null, 2)], {
    type: "application/geo+json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
