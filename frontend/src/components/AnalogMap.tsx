"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { AnalogSite, TargetProfile } from "@/types/analog";
import type { RegionBounds, RegionEvaluationResult } from "@/lib/evaluateRegion";

if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
}

export type CameraTarget =
  | { type: "site"; siteId: string }
  | {
      type: "fitBounds";
      sites: AnalogSite[];
      padding?: { left: number; top: number; right: number; bottom: number };
    }
  | { type: "world" };

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
  cameraTarget?: CameraTarget | null;
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
  cameraTarget,
}: AnalogMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const regionMarkersRef = useRef<maplibregl.Marker[]>([]);
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
      if (!map.getStyle()) return;

      const emptyFc: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: [],
      };

      const sectorFeatures: GeoJSON.Feature<GeoJSON.Polygon>[] = [];
      let boundsData: GeoJSON.FeatureCollection = emptyFc;
      let heatData: GeoJSON.FeatureCollection = emptyFc;

      if (regionResult) {
        const { minLat, maxLat, minLon, maxLon } = regionResult.bounds;
        const gridSize = Math.max(2, regionResult.grid_size);
        const dLat = (maxLat - minLat) / Math.max(1, gridSize - 1);
        const dLon = (maxLon - minLon) / Math.max(1, gridSize - 1);
        const halfLat = dLat / 2;
        const halfLon = dLon / 2;
        const gapLat = dLat * 0.035;
        const gapLon = dLon * 0.035;

        const frameMinLon = Math.max(-179.9, minLon - halfLon);
        const frameMaxLon = Math.min(179.9, maxLon + halfLon);
        const frameMinLat = Math.max(-89.9, minLat - halfLat);
        const frameMaxLat = Math.min(89.9, maxLat + halfLat);

        for (const feature of regionResult.geojson.features) {
          const [lon, lat] = feature.geometry.coordinates;
          const { id, rank, best_asi_score, body } = feature.properties;
          const cMinLon = Math.max(-179.9, lon - halfLon + gapLon);
          const cMaxLon = Math.min(179.9, lon + halfLon - gapLon);
          const cMinLat = Math.max(-89.9, lat - halfLat + gapLat);
          const cMaxLat = Math.min(89.9, lat + halfLat - gapLat);

          sectorFeatures.push({
            type: "Feature",
            properties: {
              id,
              rank,
              best_asi_score,
              body,
              is_top: rank === 1 ? 1 : 0,
              is_selected: id === selectedSiteId ? 1 : 0,
            },
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [cMinLon, cMinLat],
                  [cMaxLon, cMinLat],
                  [cMaxLon, cMaxLat],
                  [cMinLon, cMaxLat],
                  [cMinLon, cMinLat],
                ],
              ],
            },
          });
        }

        boundsData = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { kind: "bounds" },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [frameMinLon, frameMinLat],
                    [frameMaxLon, frameMinLat],
                    [frameMaxLon, frameMaxLat],
                    [frameMinLon, frameMaxLat],
                    [frameMinLon, frameMinLat],
                  ],
                ],
              },
            },
            ...sectorFeatures,
          ],
        };

        heatData = regionResult.geojson;
      }

      const existingHeat = map.getSource("region-heat") as
        | maplibregl.GeoJSONSource
        | undefined;
      if (existingHeat) {
        existingHeat.setData(heatData);
      } else {
        map.addSource("region-heat", { type: "geojson", data: heatData });
        map.addLayer({
          id: "region-sector-heat",
          type: "heatmap",
          source: "region-heat",
          paint: {
            "heatmap-weight": [
              "interpolate",
              ["linear"],
              ["get", "best_asi_score"],
              0,
              0.15,
              50,
              0.55,
              100,
              1,
            ],
            "heatmap-intensity": 0.9,
            "heatmap-radius": 52,
            "heatmap-opacity": 0.38,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(6, 9, 19, 0)",
              0.25,
              "rgba(6, 182, 212, 0.35)",
              0.6,
              "rgba(212, 175, 55, 0.55)",
              1,
              "rgba(224, 122, 95, 0.75)",
            ],
          },
        });
      }

      const existingBounds = map.getSource("region-bounds") as
        | maplibregl.GeoJSONSource
        | undefined;
      if (existingBounds) {
        existingBounds.setData(boundsData);
      } else {
        map.addSource("region-bounds", { type: "geojson", data: boundsData });
        map.addLayer({
          id: "region-sector-fill",
          type: "fill",
          source: "region-bounds",
          filter: ["has", "best_asi_score"],
          paint: {
            "fill-color": [
              "interpolate",
              ["linear"],
              ["get", "best_asi_score"],
              20,
              "#1E293B",
              45,
              "#06B6D4",
              68,
              "#D4AF37",
              85,
              "#E07A5F",
            ],
            "fill-opacity": [
              "case",
              ["==", ["get", "is_selected"], 1],
              0.44,
              ["==", ["get", "is_top"], 1],
              0.38,
              0.24,
            ],
          },
        });
        map.addLayer({
          id: "region-sector-outline",
          type: "line",
          source: "region-bounds",
          filter: ["has", "best_asi_score"],
          paint: {
            "line-color": [
              "case",
              ["==", ["get", "is_selected"], 1],
              "#F8FAFC",
              ["==", ["get", "is_top"], 1],
              "#D4AF37",
              "rgba(6, 182, 212, 0.55)",
            ],
            "line-width": [
              "case",
              ["==", ["get", "is_selected"], 1],
              2.5,
              ["==", ["get", "is_top"], 1],
              2,
              1,
            ],
            "line-opacity": 0.9,
          },
        });
        map.addLayer({
          id: "region-bounds-line",
          type: "line",
          source: "region-bounds",
          filter: ["==", ["get", "kind"], "bounds"],
          paint: {
            "line-color": "#D4AF37",
            "line-width": 1.5,
            "line-dasharray": [5, 3],
            "line-opacity": 0.75,
          },
        });
      }
    };

    const syncRegionMarkers = () => {
      for (const m of regionMarkersRef.current) {
        m.remove();
      }
      regionMarkersRef.current = [];

      if (!regionResult) return;

      for (const feature of regionResult.geojson.features) {
        const { id, rank, best_asi_score, body } = feature.properties;
        const [lon, lat] = feature.geometry.coordinates;
        const isTop = rank === 1;
        const isSelected = id === selectedSiteId;
        const accent = isTop
          ? "#D4AF37"
          : body === "Mars"
          ? "#E07A5F"
          : "#06B6D4";

        const wrapper = document.createElement("button");
        wrapper.type = "button";
        wrapper.setAttribute(
          "aria-label",
          `Sector #${rank}, ${best_asi_score.toFixed(1)}% ASI`
        );
        wrapper.style.cssText = [
          "display: flex",
          "flex-direction: column",
          "align-items: center",
          "justify-content: center",
          "gap: 3px",
          "background: transparent",
          "border: none",
          "padding: 0",
          "cursor: pointer",
        ].join(";");

        if (isTop || isSelected) {
          const reticleSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          reticleSvg.setAttribute("width", "26");
          reticleSvg.setAttribute("height", "26");
          reticleSvg.setAttribute("viewBox", "0 0 26 26");
          reticleSvg.setAttribute("aria-hidden", "true");
          const stroke = isSelected ? "#F8FAFC" : "#D4AF37";
          reticleSvg.innerHTML = [
            `<path d="M2 8V2H8 M18 2H24V8 M24 18V24H18 M8 24H2V18" fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="square"/>`,
            `<path d="M13 9V17 M9 13H17" fill="none" stroke="${stroke}" stroke-width="1.2" opacity="0.85"/>`,
          ].join("");
          wrapper.appendChild(reticleSvg);
        }

        const badge = document.createElement("span");
        badge.style.cssText = [
          "display: inline-flex",
          "align-items: center",
          "gap: 5px",
          "font-family: ui-monospace, SFMono-Regular, Menlo, monospace",
          "font-variant-numeric: tabular-nums",
          `font-size: ${isTop || isSelected ? "11px" : "10px"}`,
          `font-weight: ${isTop || isSelected ? "700" : "600"}`,
          "line-height: 1",
          `padding: ${isTop || isSelected ? "4px 8px" : "3px 6px"}`,
          "border-radius: 4px",
          `color: ${isTop || isSelected ? "#F8FAFC" : "#E2E8F0"}`,
          `background: ${isTop || isSelected ? "rgba(6, 9, 19, 0.92)" : "rgba(6, 9, 19, 0.78)"}`,
          `border: 1px solid ${isSelected ? "#F8FAFC" : isTop ? "#D4AF37" : "rgba(148, 163, 184, 0.25)"}`,
          `border-left: 2.5px solid ${accent}`,
          "box-shadow: 0 2px 8px rgba(0, 0, 0, 0.55)",
          "backdrop-filter: blur(4px)",
          "white-space: nowrap",
        ].join(";");
        badge.textContent = isTop
          ? `#1 · ${best_asi_score.toFixed(1)}%`
          : `S${rank} · ${Math.round(best_asi_score)}%`;

        wrapper.appendChild(badge);

        wrapper.addEventListener("click", (ev) => {
          ev.stopPropagation();
          onSelectSite(id);
        });

        const marker = new maplibregl.Marker({ element: wrapper, anchor: "center" })
          .setLngLat([lon, lat])
          .addTo(map);
        regionMarkersRef.current.push(marker);
      }
    };

    const handleSectorClick = (e: maplibregl.MapLayerMouseEvent) => {
      if (regionProbeMode) return;
      const feat = e.features?.[0];
      const sectorId = feat?.properties?.id;
      if (typeof sectorId === "string") {
        onSelectSite(sectorId);
      }
    };

    const handleSectorEnter = () => {
      if (!regionProbeMode) {
        map.getCanvas().style.cursor = "pointer";
      }
    };

    const handleSectorLeave = () => {
      map.getCanvas().style.cursor = probeMode || regionProbeMode ? "crosshair" : "";
    };

    syncRegionOverlay();
    syncRegionMarkers();
    map.on("style.load", syncRegionOverlay);
    map.on("click", "region-sector-fill", handleSectorClick);
    map.on("mouseenter", "region-sector-fill", handleSectorEnter);
    map.on("mouseleave", "region-sector-fill", handleSectorLeave);

    return () => {
      map.off("style.load", syncRegionOverlay);
      map.off("click", "region-sector-fill", handleSectorClick);
      map.off("mouseenter", "region-sector-fill", handleSectorEnter);
      map.off("mouseleave", "region-sector-fill", handleSectorLeave);
      for (const m of regionMarkersRef.current) {
        m.remove();
      }
      regionMarkersRef.current = [];
    };
  }, [regionResult, selectedSiteId, onSelectSite, regionProbeMode, probeMode]);

  // External camera navigation (country filter, tab switch, directory selection)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !cameraTarget) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = prefersReducedMotion ? 0 : 1200;

    if (cameraTarget.type === "world") {
      map.fitBounds(
        [
          [-170, -55],
          [170, 70],
        ],
        { padding: 40, duration: dur }
      );
      return;
    }

    if (cameraTarget.type === "fitBounds") {
      const { sites: targetSites, padding } = cameraTarget;
      if (!targetSites.length) return;

      const bounds = new maplibregl.LngLatBounds();
      for (const s of targetSites) {
        bounds.extend([s.longitude, s.latitude]);
      }

      map.fitBounds(bounds, {
        padding: padding ?? { left: 490, top: 130, right: 60, bottom: 60 },
        maxZoom: 7,
        duration: dur,
      });
      return;
    }

    if (cameraTarget.type === "site") {
      const site = sites.find((s) => s.id === cameraTarget.siteId);
      if (!site) return;
      map.flyTo({
        center: [site.longitude, site.latitude],
        zoom: Math.max(map.getZoom(), 5.2),
        duration: prefersReducedMotion ? 0 : 900,
        essential: true,
      });
    }
  }, [cameraTarget, sites]);

  return (
    <div className="relative h-full w-full bg-[#060913]">
      <div
        ref={containerRef}
        className="h-full w-full"
        role="region"
        aria-label="Mapa interactivo de sitios análogos planetarios"
      />

      {/* Selector de capa de mapa base y modos de prospección */}
      <div className="absolute right-14 top-[112px] z-10 flex flex-col items-end gap-2">
        <div
          className="flex items-center gap-1 rounded-lg border border-slate-800/80 bg-[#060913]/90 p-1 shadow-xl backdrop-blur-md"
          role="group"
          aria-label="Capa de mapa base"
        >
          {(
            [
              { id: "satellite", label: "Satélite" },
              { id: "nasa-gibs", label: "NASA GIBS" },
              { id: "dark", label: "Vector Oscuro" },
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
                    ? "border border-[#D4AF37]/60 bg-[#D4AF37]/20 text-[#D4AF37]"
                    : "border border-transparent text-slate-300 hover:text-slate-100"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {(onToggleProbeMode || onToggleRegionProbeMode) && (
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {onToggleProbeMode && (
              <button
                type="button"
                onClick={onToggleProbeMode}
                aria-pressed={probeMode}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-md transition-colors ${
                  probeMode
                    ? "border-amber-400/70 bg-amber-500/20 text-amber-200"
                    : "border-slate-800/80 bg-[#060913]/90 text-slate-200 hover:border-cyan-500/50"
                }`}
              >
                {isProbing
                  ? "Sondeando NASA POWER..."
                  : probeMode
                  ? "Sondeo: Clic en Mapa"
                  : "Sondear Punto"}
              </button>
            )}

            {onToggleRegionProbeMode && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onToggleRegionProbeMode}
                  aria-pressed={regionProbeMode}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-md transition-colors ${
                    regionProbeMode
                      ? "border-cyan-400/70 bg-cyan-500/20 text-cyan-200"
                      : "border-slate-800/80 bg-[#060913]/90 text-slate-200 hover:border-cyan-500/50"
                  }`}
                >
                  {isProbingRegion
                    ? `Escaneando ${regionGridSize}×${regionGridSize}...`
                    : regionProbeMode
                    ? "Región: Arrastra o Clic"
                    : "Sondear Región"}
                </button>

                {regionProbeMode && onChangeRegionGridSize && (
                  <div
                    className="flex items-center rounded-md border border-slate-800/80 bg-[#060913]/90 p-0.5 backdrop-blur-md"
                    role="group"
                    aria-label="Densidad de grilla regional"
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
                    Escanear Vista
                  </button>
                )}
              </div>
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

      {/* Overlay HUD de Coordenadas y Leyenda */}
      <div
        className={`pointer-events-none absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-3 rounded-lg border border-slate-800/80 bg-[#060913]/90 px-3 py-1.5 text-xs text-slate-300 shadow-xl backdrop-blur-md transition-all duration-300 ${
          selectedSiteId ? "sm:left-[492px]" : "sm:left-3"
        }`}
      >
        <span className="font-mono tabular-nums text-cyan-400">
          LAT {cursorCoords.lat.toFixed(3)}°
        </span>
        <span className="font-mono tabular-nums text-cyan-400">
          LON {cursorCoords.lon.toFixed(3)}°
        </span>
        <span className="font-mono tabular-nums text-slate-400">
          ZOOM {cursorCoords.zoom.toFixed(1)}
        </span>
        <span className="h-3 w-px bg-slate-800" aria-hidden="true" />
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full bg-[#06B6D4]"
            aria-hidden="true"
          />
          Análogo Lunar
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full bg-[#E07A5F]"
            aria-hidden="true"
          />
          Análogo Marciano
        </span>
        {regionResult && (
          <>
            <span className="h-3 w-px bg-slate-800" aria-hidden="true" />
            <span className="font-mono tabular-nums text-slate-300">
              Sectores ASI: Bajo{" "}
              <span className="inline-block h-2 w-10 rounded-sm bg-gradient-to-r from-[#1E293B] via-[#06B6D4] via-60% to-[#D4AF37] align-middle" />{" "}
              Alto
            </span>
          </>
        )}
      </div>
    </div>
  );
}
