import { NextRequest, NextResponse } from "next/server";
import { evaluateCoordinate } from "@/lib/evaluateCoordinate";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latRaw = searchParams.get("lat");
  const lonRaw = searchParams.get("lon");

  if (latRaw === null || lonRaw === null) {
    return NextResponse.json(
      { error: "Missing required query parameters: lat and lon." },
      { status: 400 }
    );
  }

  const lat = Number(latRaw);
  const lon = Number(lonRaw);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return NextResponse.json(
      { error: "Invalid latitude: must be a finite number between -90 and 90." },
      { status: 400 }
    );
  }

  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    return NextResponse.json(
      { error: "Invalid longitude: must be a finite number between -180 and 180." },
      { status: 400 }
    );
  }

  try {
    const site = await evaluateCoordinate(lat, lon);
    return NextResponse.json({ site }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to evaluate coordinate.",
      },
      { status: 500 }
    );
  }
}
