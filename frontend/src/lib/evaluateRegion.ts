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

export function buildSiteRationale(site: AnalogSite): string {
  if (site.analogy_strengths.length > 0) {
    return site.analogy_strengths.slice(0, 2).join(' · ');
  }
  const slope = site.dem_telemetry.dem_slope_deg.toFixed(1);
  const meanTemp = ((site.climatology.tmax_c + site.climatology.tmin_c) / 2).toFixed(1);
  return `Elevation ${Math.round(site.elevation_m)} m, ${slope} deg slope, ${meanTemp} C mean`;
}

export async function evaluateRegion(
  bounds: RegionBounds,
  gridSize = 3
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

  points.sort((a, b) => b.overall_asi - a.overall_asi);

  const features: RegionGeoJsonFeature[] = points.map((site) => {
    const ref = TARGET_META[site.best_target];
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [site.longitude, site.latitude],
      },
      properties: {
        id: site.id,
        lat: site.latitude,
        lon: site.longitude,
        best_asi_score: site.overall_asi,
        best_target: site.best_target,
        best_target_name: ref?.name ?? site.best_target,
        body: ref?.body ?? 'Moon',
        rationale: buildSiteRationale(site),
      },
    };
  });

  return {
    bounds,
    grid_size: gridSize,
    evaluated_count: points.length,
    failed_count: failedCount,
    points,
    geojson: {
      type: 'FeatureCollection',
      features,
    },
  };
}
