"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { AnalogSite, TargetProfile } from "@/types/analog";
import type { RegionBounds, RegionEvaluationResult } from "@/lib/evaluateRegion";

interface AnalogMapProps {
  sites: AnalogSite[];
  references: Record<string, TargetProfile>;
  selectedSiteId: string | null;
  onSelectSite: (siteId: string) => void;
  probeMode?: boolean;
  isProbing?: boolean;
  onToggleProbeMode?: () => void;
  onProbeCoordinate?: (lat: number, lon: number) => void;
  regionProbeMode?: boolean;
  isProbingRegion?: boolean;
  regionGridSize?: 3 | 4;
  onChangeRegionGridSize?: (size: 3 | 4) => void;
  onToggleRegionProbeMode?: () => void;
  onProbeRegion?: (bounds: RegionBounds) => void;
  regionResult?: RegionEvaluationResult | null;
}

type BasemapMode = "satellite" | "dark" | "nasa-gibs";

function getBasemapStyle(mode: BasemapMode): string | maplibregl.StyleSpecification {
  if (mode === "dark") {
    return "https://tiles.openfreemap.org/styles/dark";
  }

  if (mode === "nasa-gibs") {
    return {
      version: 8,
      name: "NASA GIBS VIIRS True Color",
      sources: {
        "nasa-gibs": {
          type: "raster",
          tiles: [
            "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/2026-10-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg",
          ],
          tileSize: 256,
          maxzoom: 9,
          attribution: "NASA EOSDIS GIBS / Worldview",
        },
      },
      layers: [
        {
          id: "nasa-gibs-layer",
          type: "raster",
          source: "nasa-gibs",
          minzoom: 0,
          maxzoom: 14,
        },
      ],
    };
  }

  return {
    version: 8,
    name: "Esri World Imagery",
    sources: {
      "esri-satellite": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        maxzoom: 18,
        attribution: "Esri, Maxar, Earthstar Geographics | NASA POWER &amp; PDS",
      },
    },
    layers: [
      {
        id: "esri-satellite-layer",
        type: "raster",
        source: "esri-satellite",
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  };
}

export function AnalogMap({
  sites,
  references,
  selectedSiteId,
  onSelectSite,
  probeMode = false,
  isProbing = false,
  onToggleProbeMode,
  onProbeCoordinate,
  regionProbeMode = false,
  isProbingRegion = false,
  regionGridSize = 3,
  onChangeRegionGridSize,
  onToggleRegionProbeMode,
  onProbeRegion,
  regionResult = null,
}: AnalogMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [basemap, setBasemap] = useState<BasemapMode>("satellite");
  const [dragBox, setDragBox] = useState<{
    startX: number;
    startY: number;
    curX: number;
    curY: number;
  } | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{
    lat: number;
    lon: number;
    zoom: number;
  }>({ lat: -0.67, lon: -78.6, zoom: 2.1 });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getBasemapStyle("satellite"),
      center: [-78.6, -0.67],
      zoom: 2.1,
      minZoom: 1.3,
      maxZoom: 14,
      pitch: 15,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      "top-right"
    );

    map.on("mousemove", (e) => {
      setCursorCoords({
        lat: Number(e.lngLat.lat.toFixed(3)),
        lon: Number(e.lngLat.lng.toFixed(3)),
        zoom: Number(map.getZoom().toFixed(2)),
      });
    });

    map.on("zoomend", () => {
      const c = map.getCenter();
      setCursorCoords({
        lat: Number(c.lat.toFixed(3)),
        lon: Number(c.lng.toFixed(3)),
        zoom: Number(map.getZoom().toFixed(2)),
      });
    });

    mapRef.current = map;

    const markers = markersRef.current;

    return () => {
      markers.forEach((m) => m.remove());
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(getBasemapStyle(basemap));
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    for (const site of sites) {
      const isSelected = site.id === selectedSiteId;
      const target = references[site.best_target];
      const isMars = target?.body === "Mars";
      const ringColor = isMars ? "#E07A5F" : "#06B6D4";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute(
        "aria-label",
        `${site.name}, ${site.country}. ASI ${site.overall_asi.toFixed(1)}% for ${target?.name ?? site.best_target}`
      );
      btn.className = "group relative flex items-center justify-center cursor-pointer";
      btn.style.width = isSelected ? "28px" : "20px";
      btn.style.height = isSelected ? "28px" : "20px";

      const outer = document.createElement("span");
      outer.style.position = "absolute";
      outer.style.inset = "0";
      outer.style.borderRadius = "9999px";
      outer.style.border = `2px solid ${ringColor}`;
      outer.style.backgroundColor = isSelected
        ? `${ringColor}40`
        : "rgba(6, 9, 19, 0.8)";
      outer.style.boxShadow = isSelected
        ? `0 0 18px ${ringColor}`
        : `0 0 8px ${ringColor}66`;

      const core = document.createElement("span");
      core.style.width = isSelected ? "10px" : "7px";
      core.style.height = isSelected ? "10px" : "7px";
      core.style.borderRadius = "9999px";
      core.style.backgroundColor = ringColor;

      btn.appendChild(outer);
      btn.appendChild(core);

      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        onSelectSite(site.id);
      });

      const marker = new maplibregl.Marker({ element: btn })
        .setLngLat([site.longitude, site.latitude])
        .addTo(map);

      markersRef.current.set(site.id, marker);
    }
  }, [sites, references, selectedSiteId, onSelectSite]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedSiteId) return;
    const site = sites.find((s) => s.id === selectedSiteId);
    if (!site) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    map.flyTo({
      center: [site.longitude, site.latitude],
      zoom: Math.max(map.getZoom(), 5.2),
      duration: prefersReducedMotion ? 0 : 900,
      essential: true,
    });
  }, [selectedSiteId, sites]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const activeProbe = probeMode || regionProbeMode;
    map.getCanvas().style.cursor = activeProbe ? "crosshair" : "";

    if (regionProbeMode) {
      map.dragPan.disable();
    } else {
      map.dragPan.enable();
    }

    if (!activeProbe) return;

    const canvas = map.getCanvas();
    let dragStart: { x: number; y: number } | null = null;

    const handleMouseDown = (e: MouseEvent) => {
      if (!regionProbeMode || e.button !== 0) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      dragStart = { x, y };
      setDragBox({ startX: x, startY: y, curX: x, curY: y });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStart) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      setDragBox({ startX: dragStart.x, startY: dragStart.y, curX: x, curY: y });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!dragStart || !onProbeRegion) {
        dragStart = null;
        setDragBox(null);
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const endX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const endY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      const dx = Math.abs(endX - dragStart.x);
      const dy = Math.abs(endY - dragStart.y);

      if (dx >= 14 && dy >= 14) {
        const sw = map.unproject([
          Math.min(dragStart.x, endX),
          Math.max(dragStart.y, endY),
        ]);
        const ne = map.unproject([
          Math.max(dragStart.x, endX),
          Math.min(dragStart.y, endY),
        ]);
        const minLat = Math.max(-89.5, Number(sw.lat.toFixed(4)));
        const maxLat = Math.min(89.5, Number(ne.lat.toFixed(4)));
        const minLon = Math.max(-179.5, Number(sw.lng.toFixed(4)));
        const maxLon = Math.min(179.5, Number(ne.lng.toFixed(4)));
        if (minLat < maxLat && minLon < maxLon) {
          onProbeRegion({ minLat, maxLat, minLon, maxLon });
        }
      } else {
        const center = map.unproject([endX, endY]);
        const zoom = map.getZoom();
        const halfSpan = Math.max(0.08, Math.min(2.5, 4.5 / Math.pow(2, zoom - 2)));
        onProbeRegion({
          minLat: Math.max(-89.5, Number((center.lat - halfSpan).toFixed(4))),
          maxLat: Math.min(89.5, Number((center.lat + halfSpan).toFixed(4))),
          minLon: Math.max(-179.5, Number((center.lng - halfSpan).toFixed(4))),
          maxLon: Math.min(179.5, Number((center.lng + halfSpan).toFixed(4))),
        });
      }

      dragStart = null;
      setDragBox(null);
    };

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      if (probeMode && !regionProbeMode && onProbeCoordinate) {
        onProbeCoordinate(e.lngLat.lat, e.lngLat.lng);
      }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    map.on("click", handleClick);

    return () => {
      map.dragPan.enable();
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      map.off("click", handleClick);
    };
  }, [probeMode, regionProbeMode, onProbeCoordinate, onProbeRegion]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const syncRegionOverlay = () => {
      if (!map.isStyleLoaded()) return;

      const emptyFc: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: [],
      };

      const boundsData: GeoJSON.FeatureCollection = regionResult
        ? {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "Polygon",
                  coordinates: [
                    [
                      [regionResult.bounds.minLon, regionResult.bounds.minLat],
                      [regionResult.bounds.maxLon, regionResult.bounds.minLat],
                      [regionResult.bounds.maxLon, regionResult.bounds.maxLat],
                      [regionResult.bounds.minLon, regionResult.bounds.maxLat],
                      [regionResult.bounds.minLon, regionResult.bounds.minLat],
                    ],
                  ],
                },
              },
            ],
          }
        : emptyFc;

      const gridData: GeoJSON.FeatureCollection = regionResult
        ? (regionResult.geojson as unknown as GeoJSON.FeatureCollection)
        : emptyFc;

      const existingBounds = map.getSource("region-bounds") as
        | maplibregl.GeoJSONSource
        | undefined;
      if (existingBounds) {
        existingBounds.setData(boundsData);
      } else {
        map.addSource("region-bounds", { type: "geojson", data: boundsData });
        map.addLayer({
          id: "region-bounds-fill",
          type: "fill",
          source: "region-bounds",
          paint: {
            "fill-color": "#06B6D4",
            "fill-opacity": 0.08,
          },
        });
        map.addLayer({
          id: "region-bounds-line",
          type: "line",
          source: "region-bounds",
          paint: {
            "line-color": "#06B6D4",
            "line-width": 1.5,
            "line-dasharray": [3, 2],
          },
        });
      }

      const existingGrid = map.getSource("region-grid") as
        | maplibregl.GeoJSONSource
        | undefined;
      if (existingGrid) {
        existingGrid.setData(gridData);
      } else {
        map.addSource("region-grid", { type: "geojson", data: gridData });
        map.addLayer({
          id: "region-grid-points",
          type: "circle",
          source: "region-grid",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "best_asi_score"],
              0,
              8,
              60,
              12,
              100,
              16,
            ],
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "best_asi_score"],
              0,
              "#475569",
              35,
              "#0284C7",
              55,
              "#06B6D4",
              75,
              "#E07A5F",
            ],
            "circle-opacity": 0.88,
            "circle-stroke-width": [
              "case",
              ["==", ["get", "rank"], 1],
              3,
              1.5,
            ],
            "circle-stroke-color": [
              "case",
              ["==", ["get", "rank"], 1],
              "#F8FAFC",
              "#060913",
            ],
          },
        });
        map.addLayer({
          id: "region-grid-labels",
          type: "symbol",
          source: "region-grid",
          layout: {
            "text-field": [
              "case",
              ["==", ["get", "rank"], 1],
              ["concat", "#1 · ", ["to-string", ["round", ["get", "best_asi_score"]]], "%"],
              ["concat", ["to-string", ["round", ["get", "best_asi_score"]]], "%"],
            ],
            "text-size": 11,
            "text-offset": [0, 1.4],
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          },
          paint: {
            "text-color": "#F8FAFC",
            "text-halo-color": "#060913",
            "text-halo-width": 1.5,
          },
        });
      }
    };

    const handleGridPointClick = (
      e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }
    ) => {
      const featureId = e.features?.[0]?.properties?.id;
      if (typeof featureId === "string") {
        onSelectSite(featureId);
      }
    };

    syncRegionOverlay();
    map.on("style.load", syncRegionOverlay);
    map.on("click", "region-grid-points", handleGridPointClick);

    return () => {
      map.off("style.load", syncRegionOverlay);
      map.off("click", "region-grid-points", handleGridPointClick);
    };
  }, [regionResult, onSelectSite]);

  return (
    <div className="relative h-full w-full bg-[#060913]">
      <div
        ref={containerRef}
        className="h-full w-full"
        role="region"
        aria-label="Interactive planetary analog world map"
      />

      {/* Basemap Layer Switcher & Probe Modes */}
      <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
        <div
          className="flex items-center gap-1 rounded-md border border-slate-800/80 bg-[#060913]/85 p-1 backdrop-blur-md"
          role="group"
          aria-label="Map basemap layer"
        >
          {(
            [
              { id: "satellite", label: "Satellite" },
              { id: "nasa-gibs", label: "NASA GIBS" },
              { id: "dark", label: "Dark Vector" },
            ] as const
          ).map(({ id, label }) => {
            const active = basemap === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setBasemap(id)}
                aria-pressed={active}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border border-cyan-500/60 bg-cyan-500/20 text-cyan-300"
                    : "border border-transparent text-slate-300 hover:text-slate-100"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {onToggleProbeMode && (
          <button
            type="button"
            onClick={onToggleProbeMode}
            aria-pressed={probeMode}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-colors ${
              probeMode
                ? "border-amber-400/70 bg-amber-500/20 text-amber-200"
                : "border-slate-800/80 bg-[#060913]/85 text-slate-200 hover:border-cyan-500/50"
            }`}
          >
            {isProbing
              ? "Probing NASA POWER..."
              : probeMode
              ? "Point Probe: Click Map"
              : "Probe Point"}
          </button>
        )}

        {onToggleRegionProbeMode && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleRegionProbeMode}
              aria-pressed={regionProbeMode}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-colors ${
                regionProbeMode
                  ? "border-cyan-400/70 bg-cyan-500/20 text-cyan-200"
                  : "border-slate-800/80 bg-[#060913]/85 text-slate-200 hover:border-cyan-500/50"
              }`}
            >
              {isProbingRegion
                ? `Scanning ${regionGridSize}×${regionGridSize}...`
                : regionProbeMode
                ? "Region: Drag Box / Click"
                : "Probe Region"}
            </button>

            {regionProbeMode && onChangeRegionGridSize && (
              <div
                className="flex items-center rounded-md border border-slate-800/80 bg-[#060913]/90 p-0.5 backdrop-blur-md"
                role="group"
                aria-label="Region grid density"
              >
                {([3, 4] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => onChangeRegionGridSize(size)}
                    aria-pressed={regionGridSize === size}
                    className={`rounded px-2 py-1 font-mono text-[11px] font-medium transition-colors ${
                      regionGridSize === size
                        ? "bg-cyan-500/25 text-cyan-200"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {size}×{size}
                  </button>
                ))}
              </div>
            )}

            {regionProbeMode && onProbeRegion && (
              <button
                type="button"
                disabled={isProbingRegion}
                onClick={() => {
                  const map = mapRef.current;
                  if (!map) return;
                  const b = map.getBounds();
                  const latSpan = b.getNorth() - b.getSouth();
                  const lonSpan = b.getEast() - b.getWest();
                  const padLat = latSpan * 0.1;
                  const padLon = lonSpan * 0.1;
                  const minLat = Math.max(-89.5, Number((b.getSouth() + padLat).toFixed(4)));
                  const maxLat = Math.min(89.5, Number((b.getNorth() - padLat).toFixed(4)));
                  const minLon = Math.max(-179.5, Number((b.getWest() + padLon).toFixed(4)));
                  const maxLon = Math.min(179.5, Number((b.getEast() - padLon).toFixed(4)));
                  if (minLat < maxLat && minLon < maxLon) {
                    onProbeRegion({ minLat, maxLat, minLon, maxLon });
                  }
                }}
                className="rounded-md border border-cyan-500/50 bg-[#060913]/90 px-2.5 py-1.5 text-xs font-medium text-cyan-300 backdrop-blur-md transition-colors hover:bg-cyan-500/20 disabled:opacity-50"
              >
                Scan View
              </button>
            )}
          </div>
        )}
      </div>

      {regionProbeMode && dragBox && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-10 border-2 border-dashed border-cyan-400 bg-cyan-400/15"
          style={{
            left: Math.min(dragBox.startX, dragBox.curX),
            top: Math.min(dragBox.startY, dragBox.curY),
            width: Math.abs(dragBox.curX - dragBox.startX),
            height: Math.abs(dragBox.curY - dragBox.startY),
          }}
        />
      )}

      {/* HUD Coordinate & Legend Overlay */}
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap items-center gap-3 rounded-md border border-slate-800/80 bg-[#060913]/85 px-3 py-1.5 text-xs text-slate-300 backdrop-blur-md">
        <span className="font-mono tabular-nums text-cyan-400">
          LAT {cursorCoords.lat.toFixed(3)}°
        </span>
        <span className="font-mono tabular-nums text-cyan-400">
          LON {cursorCoords.lon.toFixed(3)}°
        </span>
        <span className="font-mono tabular-nums text-slate-400">
          Z {cursorCoords.zoom.toFixed(1)}
        </span>
        <span className="h-3 w-px bg-slate-800" aria-hidden="true" />
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full bg-[#06B6D4]"
            aria-hidden="true"
          />
          Lunar Analog
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full bg-[#E07A5F]"
            aria-hidden="true"
          />
          Mars Analog
        </span>
        {regionResult && (
          <>
            <span className="h-3 w-px bg-slate-800" aria-hidden="true" />
            <span className="font-mono tabular-nums text-slate-300">
              ASI Grid: Low{" "}
              <span className="inline-block h-2 w-8 rounded-sm bg-gradient-to-r from-[#475569] via-[#06B6D4] to-[#E07A5F] align-middle" />{" "}
              High
            </span>
          </>
        )}
      </div>
    </div>
  );
}
