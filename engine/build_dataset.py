"""Build frontend JSON and RFC 7946 GeoJSON; usable from any working directory."""
from __future__ import annotations

import argparse
from dataclasses import asdict
import json
from pathlib import Path
from typing import Any

import httpx

if __package__:
    from .asi_engine import (DIMENSIONS, EARTH_SITES, GEOLOGY, PRIOR_NOTE,
                             REFERENCE_PROFILES, UNITS, fetch_climatology, fetch_dem, score_site)
else:
    from asi_engine import (DIMENSIONS, EARTH_SITES, GEOLOGY, PRIOR_NOTE,
                            REFERENCE_PROFILES, UNITS, fetch_climatology, fetch_dem, score_site)

DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / "frontend" / "public" / "data"


def build_dataset(*, offline: bool = False, timeout: float = 10.0,
                  client: httpx.Client | None = None) -> dict[str, Any]:
    sites = [score_site(site, fetch_climatology(site, offline=offline, timeout=timeout, client=client),
                        fetch_dem(site, offline=offline, timeout=timeout, client=client))
             for site in EARTH_SITES]
    return {
        "schema_version": "1.0.0",
        "methodology": {
            "name": "Exploratory Analog Similarity Index", "version": "0.2.0",
            "score_range": [0, 100], "dimensions": DIMENSIONS,
            "geology_order": GEOLOGY, "climatology_units": UNITS,
            "prior_status": PRIOR_NOTE,
            "interpretation": "Weighted scenario similarity, not a validated probability, mission readiness score or NASA endorsement.",
            "climate_limitations": "POWER grid-cell 2 m air climate does not resolve caves, summit relief or extraterrestrial surface thermal cycles. Fallback values are illustrative estimates, not observations.",
            "geography": "Representative WGS84 points; live DEM center elevations when available, otherwise approximate priors. Galapagos legacy point samples Santa Cruz; Sierra Negra separately samples Isabela.",
            "dem_method": "Open-Meteo / Copernicus GLO-90; center + N/S/E/W at 0.01 degrees; central-gradient slope and population elevation standard deviation. Telemetry only; ASI terrain priors unchanged.",
            "dem_source_counts": {source: sum(s["dem_telemetry"]["source"] == source for s in sites)
                                  for source in ("open_meteo", "fallback")},
            "formula": "overall_asi = sum(target_weight[d] * dimension_score[d]); details in engine/README.md",
            "thermal_scales_c": {"mean": 100, "range": 100},
            "source_counts": {source: sum(s["climatology"]["source"] == source for s in sites)
                              for source in ("nasa_power", "fallback")},
        },
        "references": {key: asdict(ref) for key, ref in REFERENCE_PROFILES.items()},
        "sites": sites,
    }


def to_geojson(dataset: dict[str, Any]) -> dict[str, Any]:
    return {"type": "FeatureCollection", "schema_version": dataset["schema_version"],
            "methodology": dataset["methodology"], "references": dataset["references"],
            "features": [{"type": "Feature", "id": site["id"],
                          "geometry": {"type": "Point", "coordinates": [site["longitude"], site["latitude"]]},
                          "properties": site} for site in dataset["sites"]]}


def write_dataset(dataset: dict[str, Any], output_dir: Path = DEFAULT_OUTPUT) -> tuple[Path, Path]:
    # Serialize both first, disallowing NaN/Infinity before touching existing outputs.
    outputs = [(output_dir / "analogs.json", dataset),
               (output_dir / "analogs.geojson", to_geojson(dataset))]
    serialized = [(path, json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + "\n")
                  for path, data in outputs]
    output_dir.mkdir(parents=True, exist_ok=True)
    for path, content in serialized:
        path.write_text(content, encoding="utf-8")
    return tuple(path for path, _ in outputs)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", action="store_true", help="Use deterministic illustrative climate and DEM fallback")
    parser.add_argument("--timeout", type=float, default=10, help="HTTP timeout in seconds per network phase")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    if not 0 < args.timeout < float("inf"):
        parser.error("--timeout must be finite and positive")
    with httpx.Client(follow_redirects=True) as client:
        dataset = build_dataset(offline=args.offline, timeout=args.timeout, client=client)
    paths = write_dataset(dataset, args.output_dir)
    print(f"Wrote {len(dataset['sites'])} sites / {len(dataset['references'])} targets: "
          f"{dataset['methodology']['source_counts']}")
    for path in paths:
        print(path)


if __name__ == "__main__":
    main()
