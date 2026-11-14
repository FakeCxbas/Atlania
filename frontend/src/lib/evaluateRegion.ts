import { evaluateCoordinate } from '@/lib/evaluateCoordinate';
import type { AnalogSite } from '@/types/analog';

const TARGET_META: Record<string, { name: string; body: 'Moon' | 'Mars' }> = {
  shackleton: { name: 'Shackleton Crater', body: 'Moon' },
  mare_tranquillitatis: { name: 'Mare Tranquillitatis', body: 'Moon' },
  jezero: { name: 'Jezero Crater', body: 'Mars' },
  olympus_mons: { name: 'Olympus Mons', body: 'Mars' },
};

export interface RegionBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface RegionPointFeatureProperties {
  id: string;
  rank: number;
  lat: number;
  lon: number;
  best_asi_score: number;
  best_target: string;
  best_target_name: string;
  body: 'Moon' | 'Mars';
  rationale: string;
}

export interface RegionGeoJsonFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: RegionPointFeatureProperties;
}

export interface RegionGeoJsonCollection {
  type: 'FeatureCollection';
  features: RegionGeoJsonFeature[];
}

export interface RegionEvaluationResult {
  bounds: RegionBounds;
  grid_size: number;
  evaluated_count: number;
  failed_count: number;
  points: AnalogSite[];
  geojson: RegionGeoJsonCollection;
}

export interface RegionScanSummary {
  maxAsi: number;
  minAsi: number;
  meanAsi: number;
  elevMinM: number;
  elevMaxM: number;
  maxSlopeDeg: number;
  beatenCatalogCount: number;
  totalCatalogCount: number;
  topCatalogSiteName: string | null;
  topCatalogAsi: number;
}

export function validateRegionBounds(bounds: RegionBounds, gridSize = 3): void {
  const { minLat, maxLat, minLon, maxLon } = bounds;
  if (
    !Number.isFinite(minLat) ||
    !Number.isFinite(maxLat) ||
    !Number.isFinite(minLon) ||
    !Number.isFinite(maxLon)
  ) {
    throw new Error('Region bounds must be finite numbers.');
  }
  if (minLat < -90 || maxLat > 90 || minLat >= maxLat) {
    throw new Error('Latitude bounds must satisfy -90 <= minLat < maxLat <= 90.');
  }
  if (minLon < -180 || maxLon > 180 || minLon >= maxLon) {
    throw new Error('Longitude bounds must satisfy -180 <= minLon < maxLon <= 180.');
  }
  if (!Number.isInteger(gridSize) || gridSize < 2 || gridSize > 4) {
    throw new Error('gridSize must be an integer between 2 and 4.');
  }
}

export function buildRegionGrid(
  bounds: RegionBounds,
  gridSize = 3
): Array<{ lat: number; lon: number }> {
  validateRegionBounds(bounds, gridSize);
  const points: Array<{ lat: number; lon: number }> = [];
  const latStep = (bounds.maxLat - bounds.minLat) / (gridSize - 1);
  const lonStep = (bounds.maxLon - bounds.minLon) / (gridSize - 1);

  for (let row = 0; row < gridSize; row += 1) {
    const lat = Number((bounds.minLat + row * latStep).toFixed(4));
    for (let col = 0; col < gridSize; col += 1) {
      const lon = Number((bounds.minLon + col * lonStep).toFixed(4));
      points.push({ lat, lon });
    }
  }
  return points;
}

export function getPointTargetScore(
  site: AnalogSite,
  targetId?: string | null
): {
  asi: number;
  targetId: string;
  targetName: string;
  body: 'Moon' | 'Mars';
  strengths: string[];
} {
  const targeted = targetId ? site.scores[targetId] : undefined;
  if (targeted && targetId) {
    const ref = TARGET_META[targetId];
    return {
      asi: targeted.overall_asi,
      targetId,
      targetName: ref?.name ?? targetId,
      body: ref?.body ?? 'Moon',
      strengths: targeted.analogy_strengths,
    };
  }
  const ref = TARGET_META[site.best_target];
  return {
    asi: site.overall_asi,
    targetId: site.best_target,
    targetName: ref?.name ?? site.best_target,
    body: ref?.body ?? 'Moon',
    strengths: site.analogy_strengths,
  };
}

export function buildSiteRationale(site: AnalogSite, targetId?: string | null): string {
  const { strengths } = getPointTargetScore(site, targetId);
  if (strengths.length > 0) {
    return strengths.slice(0, 2).join(' · ');
  }
  const slope = site.dem_telemetry.dem_slope_deg.toFixed(1);
  const meanTemp = ((site.climatology.tmax_c + site.climatology.tmin_c) / 2).toFixed(1);
  return `Elevation ${Math.round(site.elevation_m)} m, ${slope} deg slope, ${meanTemp} C mean`;
}

export function buildRegionGeoJson(
  points: AnalogSite[],
  targetId?: string | null
): { sortedPoints: AnalogSite[]; geojson: RegionGeoJsonCollection } {
  const sortedPoints = [...points].sort(
    (a, b) => getPointTargetScore(b, targetId).asi - getPointTargetScore(a, targetId).asi
  );

  const features: RegionGeoJsonFeature[] = sortedPoints.map((site, idx) => {
    const scored = getPointTargetScore(site, targetId);
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [site.longitude, site.latitude],
      },
      properties: {
        id: site.id,
        rank: idx + 1,
        lat: site.latitude,
        lon: site.longitude,
        best_asi_score: scored.asi,
        best_target: scored.targetId,
        best_target_name: scored.targetName,
        body: scored.body,
        rationale: buildSiteRationale(site, targetId),
      },
    };
  });

  return {
    sortedPoints,
    geojson: {
      type: 'FeatureCollection',
      features,
    },
  };
}

export function rankRegionResult(
  result: RegionEvaluationResult,
  targetId?: string | null
): RegionEvaluationResult {
  const { sortedPoints, geojson } = buildRegionGeoJson(result.points, targetId);
  return {
    ...result,
    points: sortedPoints,
    geojson,
  };
}

export function summarizeRegionScan(
  points: AnalogSite[],
  catalogSites: AnalogSite[],
  targetId?: string | null
): RegionScanSummary | null {
  if (points.length === 0) return null;

  const scores = points.map((p) => getPointTargetScore(p, targetId).asi);
  const maxAsi = Math.max(...scores);
  const minAsi = Math.min(...scores);
  const meanAsi = scores.reduce((acc, v) => acc + v, 0) / scores.length;

  const elevations = points.map((p) => p.elevation_m);
  const elevMinM = Math.min(...elevations);
  const elevMaxM = Math.max(...elevations);
  const maxSlopeDeg = Math.max(...points.map((p) => p.dem_telemetry.dem_slope_deg));

  const catalogRanked = catalogSites
    .map((site) => ({
      name: site.name,
      asi: getPointTargetScore(site, targetId).asi,
    }))
    .sort((a, b) => b.asi - a.asi);

  const beatenCatalogCount = catalogRanked.filter((c) => maxAsi > c.asi).length;

  return {
    maxAsi,
    minAsi,
    meanAsi,
    elevMinM,
    elevMaxM,
    maxSlopeDeg,
    beatenCatalogCount,
    totalCatalogCount: catalogRanked.length,
    topCatalogSiteName: catalogRanked[0]?.name ?? null,
    topCatalogAsi: catalogRanked[0]?.asi ?? 0,
  };
}

export async function evaluateRegion(
  bounds: RegionBounds,
  gridSize = 3,
  targetId?: string | null
): Promise<RegionEvaluationResult> {
  const coords = buildRegionGrid(bounds, gridSize);
  const settled = await Promise.allSettled(
    coords.map(({ lat, lon }) => evaluateCoordinate(lat, lon))
  );

  const points: AnalogSite[] = [];
  let failedCount = 0;

  for (const result of settled) {
    if (result.status === 'fulfilled') {
      points.push(result.value);
    } else {
      failedCount += 1;
    }
  }

  if (points.length === 0) {
    throw new Error('All region grid evaluations failed against upstream telemetry services.');
  }

  const { sortedPoints, geojson } = buildRegionGeoJson(points, targetId);

  return {
    bounds,
    grid_size: gridSize,
    evaluated_count: sortedPoints.length,
    failed_count: failedCount,
    points: sortedPoints,
    geojson,
  };
}
