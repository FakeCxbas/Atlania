export type PlanetaryBody = "Moon" | "Mars";

export interface TargetProfile {
  id: string;
  name: string;
  body: PlanetaryBody;
  temperature_mean_c: number;
  temperature_range_c: number;
  dryness: number;
  context: string;
  source_url: string;
}

export interface DimensionScores {
  topography: number;
  geology: number;
  thermal: number;
  hydrology_ice: number;
  subsurface_ops: number;
}

export interface TargetScore {
  dimensions: DimensionScores;
  overall_asi: number;
  weights: DimensionScores;
  analogy_strengths: string[];
  analogy_breakdowns: Record<string, string>;
}

export interface NasaPowerClimatology {
  tmax_c: number;
  tmin_c: number;
  precipitation_mm_day: number;
  wind_m_s: number;
  relative_humidity_pct: number;
  source: "nasa_power" | "fallback";
  fallback_reason: string | null;
  source_url: string;
  aggregation: string;
}

export interface AnalogSite {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  terrain: {
    slope_deg: number;
    roughness: number;
    lava_tubes: number;
    shelter: number;
    ice: number;
  };
  climatology: NasaPowerClimatology;
  rationale: string;
  prior_status: string;
  scores: Record<string, TargetScore>;
  best_target: string;
  overall_asi: number;
  analogy_strengths: string[];
  analogy_breakdowns: Record<string, string>;
}

export interface AnalogDataset {
  schema_version: string;
  methodology: {
    name: string;
    version: string;
    interpretation: string;
    climate_limitations: string;
    source_counts: {
      nasa_power: number;
      fallback: number;
    };
  };
  references: Record<string, TargetProfile>;
  sites: AnalogSite[];
}
