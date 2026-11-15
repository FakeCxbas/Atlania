import { NextRequest, NextResponse } from 'next/server';
import { evaluateRegion, validateRegionBounds } from '@/lib/evaluateRegion';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const minLat = Number(searchParams.get('minLat'));
  const maxLat = Number(searchParams.get('maxLat'));
  const minLon = Number(searchParams.get('minLon'));
  const maxLon = Number(searchParams.get('maxLon'));
  const gridSizeParam = searchParams.get('gridSize');
  const gridSize = gridSizeParam ? Number(gridSizeParam) : 3;
  const targetId = searchParams.get('targetId');

  try {
    validateRegionBounds({ minLat, maxLat, minLon, maxLon }, gridSize);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid region parameters.' },
      { status: 400 }
    );
  }

  try {
    const result = await evaluateRegion({ minLat, maxLat, minLon, maxLon }, gridSize, targetId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to evaluate region.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
