export type PlanetaryBody = "Moon" | "Mars";

export interface TargetProfile {
  id: string;
  name: string;
  body: PlanetaryBody;
  terrain?: {
    slope_deg: number;
    roughness: number;
    geology: number[];
    ice: number;
    aqueous_history: number;
    lava_tubes: number;
    shelter: number;
  };
  temperature_mean_c: number;
  temperature_range_c: number;
  dryness: number;
  weights?: number[];
  context: string;
  source_url: string;
  instrument?: string;
  pds_dataset?: string;
  gravity_ms2?: number;
  pressure_kpa?: number;
  temp_min_c?: number;
  temp_max_c?: number;
  mineralogy_summary?: string;
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

export interface DemTelemetry {
  elevation_m: number;
  dem_slope_deg: number;
  dem_roughness_m: number;
  source: "open_meteo" | "fallback";
  fallback_reason: string | null;
  attribution: string;
}

export interface NasaPowerClimatology {
  tmax_c: number;
  tmin_c: number;
  precipitation_mm_day: number;
  wind_m_s: number;
  relative_humidity_pct: number;
  solar_irradiance_kwh_m2_day: number;
  surface_pressure_kpa: number;
  source: "nasa_power" | "fallback";
  fallback_reason: string | null;
  source_url: string;
  period?: string | null;
  aggregation: string;
}

export interface SatelliteSensorProfile {
  mission: string;
  instrument: string;
  spectrum?: string;
  band?: string;
  collects: string;
  site_application: string;
  limitations: string;
  source_url: string;
}

export interface SatelliteObservatory {
  optical: SatelliteSensorProfile;
  radar_sar: SatelliteSensorProfile;
  thermal_tir: SatelliteSensorProfile;
  summary: string;
}

export interface AnalogSite {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  dem_telemetry: DemTelemetry;
  discovery_tier: "Under-Recognized" | "Regional Highlight" | "Benchmark";
  mission_testbeds: string[];
  terrain: {
    slope_deg: number;
    roughness: number;
    geology?: Record<string, number> | number[];
    lava_tubes: number;
    shelter: number;
    ice: number;
    aqueous_history?: number;
  };
  climatology: NasaPowerClimatology;
  rationale: string;
  prior_status: string;
  scores: Record<string, TargetScore>;
  best_target: string;
  overall_asi: number;
  analogy_strengths: string[];
  analogy_breakdowns: Record<string, string>;
  satellite_observatory?: SatelliteObservatory;
}

export interface AnalogDataset {
  schema_version: string;
  methodology: {
    name: string;
    version: string;
    dimensions?: string[];
    score_equation?: string;
    interpretation: string;
    climate_limitations: string;
    dem_attribution?: string;
    source_counts: {
      nasa_power: number;
      fallback: number;
    };
    dem_source_counts?: {
      open_meteo: number;
      fallback: number;
    };
  };
  references: Record<string, TargetProfile>;
  sites: AnalogSite[];
}
