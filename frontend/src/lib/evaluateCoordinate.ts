import type { AnalogSite, DimensionScores, TargetProfile, TargetScore } from "@/types/analog";

const POWER_URL = "https://power.larc.nasa.gov/api/temporal/climatology/point";
const ELEVATION_URL = "https://api.open-meteo.com/v1/elevation";
const DEM_STEP_DEG = 0.01;
const DIMENSIONS: (keyof DimensionScores)[] = [
  "topography",
  "geology",
  "thermal",
  "hydrology_ice",
  "subsurface_ops",
];

interface ReferenceSpec {
  profile: TargetProfile;
  slope_deg: number;
  roughness: number;
  geology: [number, number, number, number, number];
  ice: number;
  aqueous_history: number;
  lava_tubes: number;
  shelter: number;
  weights: [number, number, number, number, number];
}

const REFERENCES: Record<string, ReferenceSpec> = {
  "shackleton-crater": {
    profile: {
      id: "shackleton-crater",
      name: "Shackleton Crater / Lunar South Pole (Artemis)",
      body: "Moon",
      temperature_mean_c: -183,
      temperature_range_c: 10,
      dryness: 1,
      context:
        "Cold-trap interior scenario; does not represent the illuminated rim.",
      source_url:
        "https://science.nasa.gov/resource/shackleton-craters-illuminated-rim-shadowed-interior/",
    },
    slope_deg: 20,
    roughness: 0.85,
    geology: [0.05, 1, 0.05, 0, 1],
    ice: 0.95,
    aqueous_history: 0,
    lava_tubes: 0,
    shelter: 0.25,
    weights: [0.25, 0.2, 0.2, 0.3, 0.05],
  },
  "mare-tranquillitatis": {
    profile: {
      id: "mare-tranquillitatis",
      name: "Mare Tranquillitatis / Lunar Lava Tubes",
      body: "Moon",
      temperature_mean_c: 17,
      temperature_range_c: 2,
      dryness: 1,
      context:
        "Shaded pit / hypothetical connected cave scenario; 17 C is modeled pit shade.",
      source_url:
        "https://www.nasa.gov/solar-system/nasas-lro-finds-lunar-pits-harbor-comfortable-temperatures/",
    },
    slope_deg: 5,
    roughness: 0.55,
    geology: [1, 0.8, 0, 0, 0.1],
    ice: 0,
    aqueous_history: 0,
    lava_tubes: 1,
    shelter: 1,
    weights: [0.15, 0.3, 0.15, 0.1, 0.3],
  },
  "jezero-crater": {
    profile: {
      id: "jezero-crater",
      name: "Jezero Crater / Mars Delta and Basalt",
      body: "Mars",
      temperature_mean_c: -60,
      temperature_range_c: 70,
      dryness: 1,
      context:
        "Present dry surface thermal scenario combined with ancient aqueous geology.",
      source_url:
        "https://www.jpl.nasa.gov/news/nasas-perseverance-rover-deciphers-ancient-history-of-martian-lake/",
    },
    slope_deg: 6,
    roughness: 0.6,
    geology: [0.8, 0.8, 1, 0.3, 0.5],
    ice: 0.1,
    aqueous_history: 1,
    lava_tubes: 0,
    shelter: 0.1,
    weights: [0.2, 0.35, 0.15, 0.25, 0.05],
  },
  "olympus-mons-flank": {
    profile: {
      id: "olympus-mons-flank",
      name: "Olympus Mons Flank / Mars Volcanic Lava Tubes",
      body: "Mars",
      temperature_mean_c: -80,
      temperature_range_c: 80,
      dryness: 1,
      context:
        "Exposed volcanic flank thermal scenario with tube exploration relevance.",
      source_url: "https://science.nasa.gov/photojournal/the-flows-of-olympus/",
    },
    slope_deg: 5,
    roughness: 0.65,
    geology: [1, 0.7, 0.1, 0, 0.2],
    ice: 0.1,
    aqueous_history: 0.05,
    lava_tubes: 1,
    shelter: 0.9,
    weights: [0.25, 0.3, 0.15, 0.1, 0.2],
  },
  "mouton-mons": {
    profile: {
      id: "mouton-mons",
      name: "Mons Mouton / Lunar South Pole Plateau (Artemis III)",
      body: "Moon",
      temperature_mean_c: -110,
      temperature_range_c: 45,
      dryness: 1,
      context: "Broad flat-topped south polar massif near Shackleton; candidate Artemis III landing zone with low slope and prolonged solar illumination.",
      source_url: "https://www.nasa.gov/reference/artemis-iii-candidate-landing-regions/",
    },
    slope_deg: 8,
    roughness: 0.65,
    geology: [0.05, 0.95, 0.05, 0, 0.85],
    ice: 0.75,
    aqueous_history: 0,
    lava_tubes: 0,
    shelter: 0.35,
    weights: [0.3, 0.25, 0.2, 0.2, 0.05],
  },
  "valles-marineris": {
    profile: {
      id: "valles-marineris",
      name: "Valles Marineris / Coprates Chasma Canyon & Sulfates",
      body: "Mars",
      temperature_mean_c: -55,
      temperature_range_c: 65,
      dryness: 1,
      context: "Deep tectonic canyon system with steep layered walls, recurring slope lineae candidates, and polyhydrated sulfate deposits.",
      source_url: "https://science.nasa.gov/resource/valles-marineris-the-grand-canyon-of-mars/",
    },
    slope_deg: 24,
    roughness: 0.9,
    geology: [0.75, 0.7, 0.9, 0.85, 0.2],
    ice: 0.15,
    aqueous_history: 0.85,
    lava_tubes: 0.2,
    shelter: 0.4,
    weights: [0.25, 0.3, 0.15, 0.2, 0.1],
  },
};

export function similarity(a: number, b: number, scale = 1.0): number {
  return Math.max(0, 1 - Math.abs(a - b) / scale);
}

export function computeFivePointDemMetrics(
  lat: number,
  elevations: number[]
): { elevation_m: number; dem_slope_deg: number; dem_roughness_m: number } {
  if (elevations.length !== 5 || elevations.some((v) => !Number.isFinite(v))) {
    throw new Error("Five finite elevations required");
  }
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

function readPowerAnnual(
  params: Record<string, Record<string, number>>,
  key: string,
  fillValue: number
): number {
  const series = params[key];
  if (!series || typeof series.ANN !== "number" || !Number.isFinite(series.ANN) || series.ANN === fillValue) {
    throw new Error(`Invalid NASA POWER parameter: ${key}`);
  }
  return Number(series.ANN.toFixed(4));
}

export function parsePowerClimatology(
  payload: {
    header?: { fill_value?: number };
    properties?: { parameter?: Record<string, Record<string, number>> };
  },
  sourceUrl: string
): AnalogSite["climatology"] {
  const fill = payload.header?.fill_value ?? -999;
  const params = payload.properties?.parameter;
  if (!params) {
    throw new Error("Missing NASA POWER parameter payload");
  }
  return {
    tmax_c: readPowerAnnual(params, "T2M_MAX", fill),
    tmin_c: readPowerAnnual(params, "T2M_MIN", fill),
    precipitation_mm_day: readPowerAnnual(params, "PRECTOTCORR", fill),
    wind_m_s: readPowerAnnual(params, "WS10M", fill),
    relative_humidity_pct: readPowerAnnual(params, "RH2M", fill),
    solar_irradiance_kwh_m2_day: readPowerAnnual(params, "ALLSKY_SFC_SW_DWN", fill),
    surface_pressure_kpa: readPowerAnnual(params, "PS", fill),
    source: "nasa_power",
    fallback_reason: null,
    source_url: sourceUrl,
    aggregation:
      "T2M_MAX: ANN; T2M_MIN: ANN; PRECTOTCORR: ANN; WS10M: ANN; RH2M: ANN; ALLSKY_SFC_SW_DWN: ANN; PS: ANN",
  };
}

export async function evaluateCoordinate(
  lat: number,
  lon: number
): Promise<AnalogSite> {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error("Latitude must be between -90 and 90 degrees.");
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new Error("Longitude must be between -180 and 180 degrees.");
  }

  const powerParams = new URLSearchParams({
    parameters: "T2M_MAX,T2M_MIN,PRECTOTCORR,WS10M,RH2M,ALLSKY_SFC_SW_DWN,PS",
    community: "RE",
    longitude: lon.toFixed(4),
    latitude: lat.toFixed(4),
    format: "JSON",
  });
  const powerUrl = `${POWER_URL}?${powerParams.toString()}`;

  const wrapLon = (x: number) => ((x + 180) % 360 + 360) % 360 - 180;
  const pts: [number, number][] = [
    [lat, lon],
    [Math.min(90, lat + DEM_STEP_DEG), lon],
    [Math.max(-90, lat - DEM_STEP_DEG), lon],
    [lat, wrapLon(lon + DEM_STEP_DEG)],
    [lat, wrapLon(lon - DEM_STEP_DEG)],
  ];
  const demParams = new URLSearchParams({
    latitude: pts.map((p) => p[0].toFixed(4)).join(","),
    longitude: pts.map((p) => p[1].toFixed(4)).join(","),
  });
  const demUrl = `${ELEVATION_URL}?${demParams.toString()}`;

  const [powerRes, demRes] = await Promise.allSettled([
    fetch(powerUrl, { signal: AbortSignal.timeout(8000) }),
    fetch(demUrl, { signal: AbortSignal.timeout(8000) }),
  ]);

  let climatology: AnalogSite["climatology"] = {
    tmax_c: 20,
    tmin_c: 10,
    precipitation_mm_day: 1,
    wind_m_s: 3,
    relative_humidity_pct: 50,
    solar_irradiance_kwh_m2_day: 4.5,
    surface_pressure_kpa: 101.3,
    source: "fallback",
    fallback_reason: "NASA POWER unavailable",
    source_url: powerUrl,
    aggregation: "Fallback neutral climatology",
  };

  if (powerRes.status === "fulfilled" && powerRes.value.ok) {
    try {
      const json = await powerRes.value.json();
      climatology = parsePowerClimatology(json, powerUrl);
    } catch (err) {
      climatology.fallback_reason = `NASA POWER parse error (${
        err instanceof Error ? err.message : "unknown"
      })`;
    }
  }

  let demTelemetry: AnalogSite["dem_telemetry"] = {
    elevation_m: 0,
    dem_slope_deg: 0,
    dem_roughness_m: 0,
    source: "fallback",
    fallback_reason: "Open-Meteo DEM unavailable",
    attribution: "Open-Meteo / Copernicus DEM GLO-90 (2021)",
  };

  if (demRes.status === "fulfilled" && demRes.value.ok && Math.abs(lat) <= 89.99) {
    try {
      const json = (await demRes.value.json()) as { elevation?: number[] };
      if (Array.isArray(json.elevation) && json.elevation.length === 5) {
        const metrics = computeFivePointDemMetrics(lat, json.elevation);
        demTelemetry = {
          ...metrics,
          source: "open_meteo",
          fallback_reason: null,
          attribution: "Open-Meteo / Copernicus DEM GLO-90 (2021)",
        };
      }
    } catch (err) {
      demTelemetry.fallback_reason = `DEM parse error (${
        err instanceof Error ? err.message : "unknown"
      })`;
    }
  }

  const earthGeology: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  const earthSlope = demTelemetry.source === "open_meteo" ? demTelemetry.dem_slope_deg : 0;
  const earthRoughness =
    demTelemetry.source === "open_meteo"
      ? Math.min(1, demTelemetry.dem_roughness_m / 120)
      : 0;
  const earthIce =
    climatology.tmin_c <= -5 ||
    (climatology.tmin_c <= 0 &&
      (demTelemetry.elevation_m >= 3500 || Math.abs(lat) >= 60))
      ? 0.7
      : climatology.tmin_c <= 5
      ? 0.25
      : 0;
  const earthAqueous = 0;
  const earthLava = 0;
  const earthShelter = 0;

  const meanC = (climatology.tmax_c + climatology.tmin_c) / 2;
  const rangeC = climatology.tmax_c - climatology.tmin_c;
  const dryness =
    (1 / (1 + climatology.precipitation_mm_day)) *
    (1 - 0.5 * (climatology.relative_humidity_pct / 100));

  const scores: Record<string, TargetScore> = {};
  let bestTarget = "shackleton-crater";
  let bestScore = -1;

  for (const [key, ref] of Object.entries(REFERENCES)) {
    const geoUnion = earthGeology.reduce((acc, a, i) => acc + Math.max(a, ref.geology[i]), 0);
    const geoInter = earthGeology.reduce((acc, a, i) => acc + Math.min(a, ref.geology[i]), 0);
    const geology = geoUnion > 0 ? geoInter / geoUnion : 1;

    const raw: DimensionScores = {
      topography:
        0.5 * similarity(earthSlope, ref.slope_deg, 30) +
        0.5 * similarity(earthRoughness, ref.roughness, 1),
      geology,
      thermal:
        0.6 * similarity(meanC, ref.profile.temperature_mean_c, 100) +
        0.4 * similarity(rangeC, ref.profile.temperature_range_c, 100),
      hydrology_ice:
        0.4 * similarity(dryness, ref.profile.dryness, 1) +
        0.4 * similarity(earthIce, ref.ice, 1) +
        0.2 * similarity(earthAqueous, ref.aqueous_history, 1),
      subsurface_ops:
        0.7 * similarity(earthLava, ref.lava_tubes, 1) +
        0.3 * similarity(earthShelter, ref.shelter, 1),
    };

    const dimensions: DimensionScores = {
      topography: Number((100 * raw.topography).toFixed(2)),
      geology: Number((100 * raw.geology).toFixed(2)),
      thermal: Number((100 * raw.thermal).toFixed(2)),
      hydrology_ice: Number((100 * raw.hydrology_ice).toFixed(2)),
      subsurface_ops: Number((100 * raw.subsurface_ops).toFixed(2)),
    };

    const overall = Number(
      (
        100 *
        DIMENSIONS.reduce((acc, dim, idx) => acc + raw[dim] * ref.weights[idx], 0)
      ).toFixed(2)
    );

    const strengths = DIMENSIONS.filter((d) => dimensions[d] >= 70).map(
      (d) => `${d}: ${dimensions[d].toFixed(2)}/100 scenario similarity`
    );

    const breakdowns: Record<string, string> = {
      gravity: `Earth gravity (9.81 m/s2) cannot reproduce ${ref.profile.body} gravity (${
        ref.profile.body === "Moon" ? 1.62 : 3.71
      } m/s2); traction and structural loading differ.`,
      atmosphere_vacuum:
        ref.profile.body === "Moon"
          ? "Earth air does not reproduce lunar vacuum."
          : "Earth air does not reproduce the thin, CO2-dominated Martian atmosphere.",
      radiation:
        "Earth atmosphere and magnetic shielding do not reproduce extraterrestrial ionizing radiation.",
      weathering:
        "Liquid water, oxygen and biology alter terrestrial materials differently from space weathering.",
      site_specific:
        "On-demand coordinate probe uses neutral geological/ice/subsurface priors; only climate and DEM slope are measured live.",
    };

    scores[key] = {
      dimensions,
      overall_asi: overall,
      weights: {
        topography: ref.weights[0],
        geology: ref.weights[1],
        thermal: ref.weights[2],
        hydrology_ice: ref.weights[3],
        subsurface_ops: ref.weights[4],
      },
      analogy_strengths: strengths,
      analogy_breakdowns: breakdowns,
    };

    if (overall > bestScore) {
      bestScore = overall;
      bestTarget = key;
    }
  }

  return {
    id: `probe-${lat.toFixed(3)}-${lon.toFixed(3)}`,
    name: `Live Probe (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
    country: "On-Demand Coordinate",
    latitude: Number(lat.toFixed(4)),
    longitude: Number(lon.toFixed(4)),
    elevation_m: demTelemetry.elevation_m,
    dem_telemetry: demTelemetry,
    discovery_tier: "Under-Recognized",
    mission_testbeds: ["Reconnaissance terrain & climate screening"],
    terrain: {
      slope_deg: earthSlope,
      roughness: earthRoughness,
      lava_tubes: earthLava,
      shelter: earthShelter,
      ice: earthIce,
    },
    climatology,
    rationale:
      "Live coordinate screening combining NASA POWER climatology and Copernicus DEM GLO-90 slope with neutral geological priors.",
    prior_status:
      "Neutral geological/subsurface priors; climate and elevation/slope are live.",
    scores,
    best_target: bestTarget,
    overall_asi: scores[bestTarget].overall_asi,
    analogy_strengths: scores[bestTarget].analogy_strengths,
    analogy_breakdowns: scores[bestTarget].analogy_breakdowns,
  };
}
