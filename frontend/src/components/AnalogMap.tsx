"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PLANET_VISUALS } from "@/lib/planetaryVisuals";
import * as maplibregl from "maplibre-gl";
import {
  Box,
  ChevronDown,
  ChevronUp,
  Mountain,
  RotateCcw,
  RotateCw,
  Square,
} from "lucide-react";
import type { AnalogSite, TargetProfile } from "@/types/analog";
import type { RegionBounds, RegionEvaluationResult } from "@/lib/evaluateRegion";
import {
  TerrainDioramaModal,
  type TerrainDioramaTarget,
} from "@/components/TerrainDioramaModal";

if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
}

export type CameraTarget =
  | { type: "site"; siteId: string; zoom?: number }
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

const TERRAIN_MIN_ZOOM = 5.2;

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
        "esri-labels": {
          type: "raster",
          tiles: [
            "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
            "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          maxzoom: 13,
          attribution: "Esri Reference",
        },
      },
      layers: [
        {
          id: "ocean-background",
          type: "background",
          paint: {
            "background-color": "#071426",
          },
        },
        {
          id: "nasa-gibs-layer",
          type: "raster",
          source: "nasa-gibs",
          minzoom: 0,
          maxzoom: 18,
          paint: {
            "raster-fade-duration": 250,
          },
        },
        {
          id: "esri-labels-layer",
          type: "raster",
          source: "esri-labels",
          minzoom: 6,
          maxzoom: 18,
          paint: {
            "raster-fade-duration": 100,
            "raster-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              6,
              0.35,
              9,
              0.85,
              14,
              0.95,
            ],
          },
        },
      ],
    };
  }

  return {
    version: 8,
    name: "Esri World Imagery",
    sources: {
      "esri-satellite-lowres": {
        type: "raster",
        tiles: [
          "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        maxzoom: 6,
        attribution: "Esri, Maxar, Earthstar Geographics",
      },
      "esri-satellite": {
        type: "raster",
        tiles: [
          "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        maxzoom: 14,
        attribution: "Esri, Maxar, Earthstar Geographics | NASA POWER &amp; PDS",
      },
      "esri-labels": {
        type: "raster",
        tiles: [
          "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        maxzoom: 13,
        attribution: "Esri Reference",
      },
    },
    layers: [
      {
        id: "ocean-background",
        type: "background",
        paint: {
          "background-color": "#071426",
        },
      },
      {
        id: "esri-satellite-lowres-layer",
        type: "raster",
        source: "esri-satellite-lowres",
        minzoom: 0,
        maxzoom: 18,
        paint: {
          "raster-fade-duration": 0,
        },
      },
      {
        id: "esri-satellite-layer",
        type: "raster",
        source: "esri-satellite",
        minzoom: 0,
        maxzoom: 18,
        paint: {
          "raster-fade-duration": 300,
          "raster-contrast": 0.12,
          "raster-saturation": 0.08,
        },
      },
      {
        id: "esri-labels-layer",
        type: "raster",
        source: "esri-labels",
        minzoom: 6,
        maxzoom: 18,
        paint: {
          "raster-fade-duration": 100,
          "raster-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6,
            0.35,
            9,
            0.85,
            14,
            0.95,
          ],
        },
      },
    ],
  };
}

interface MarkerVisualRefs {
  marker: maplibregl.Marker;
  btn: HTMLButtonElement;
  outer: HTMLSpanElement;
  core: HTMLImageElement;
  label: HTMLSpanElement;
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
  const markersRef = useRef<Map<string, MarkerVisualRefs>>(new Map());
  const regionMarkersRef = useRef<maplibregl.Marker[]>([]);
  const prevBasemapRef = useRef<BasemapMode>("satellite");
  const initialSelectedSiteIdRef = useRef<string | null>(selectedSiteId);
  const hasSkippedInitialFlyRef = useRef(false);
  const onSelectSiteRef = useRef(onSelectSite);
  useEffect(() => {
    onSelectSiteRef.current = onSelectSite;
  }, [onSelectSite]);

  const [dioramaTarget, setDioramaTarget] =
    useState<TerrainDioramaTarget | null>(null);

  const handleOpenDiorama = useCallback(() => {
    const activeSite = selectedSiteId
      ? sites.find((s) => s.id === selectedSiteId)
      : null;
    if (activeSite) {
      setDioramaTarget({
        name: activeSite.name,
        country: activeSite.country,
        latitude: activeSite.latitude,
        longitude: activeSite.longitude,
        asiScore: activeSite.overall_asi,
      });
      return;
    }
    const center = mapRef.current?.getCenter();
    const lat = center?.lat ?? -0.67;
    const lon = center?.lng ?? -78.6;
    setDioramaTarget({
      name: `Terreno en ${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
      latitude: lat,
      longitude: lon,
    });
  }, [selectedSiteId, sites]);

  const latSpanRef = useRef<HTMLSpanElement | null>(null);
  const lonSpanRef = useRef<HTMLSpanElement | null>(null);
  const zoomSpanRef = useRef<HTMLSpanElement | null>(null);

  const [basemap, setBasemap] = useState<BasemapMode>("satellite");
  const [terrain3d, setTerrain3d] = useState(true);
  const [cameraView, setCameraView] = useState<{ pitch: number; bearing: number }>({
    pitch: selectedSiteId ? 45 : 0,
    bearing: 0,
  });
  const [dragBox, setDragBox] = useState<{
    startX: number;
    startY: number;
    curX: number;
    curY: number;
  } | null>(null);

  const getFlyDuration = useCallback((ms: number) => {
    if (typeof window === "undefined") return ms;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms;
  }, []);

  const handleSet2D = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({
      pitch: 0,
      bearing: 0,
      duration: getFlyDuration(450),
    });
  }, [getFlyDuration]);

  const handleSet3D = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    setTerrain3d(true);
    map.easeTo({
      pitch: 60,
      duration: getFlyDuration(500),
    });
  }, [getFlyDuration]);

  const handleAdjustBearing = useCallback(
    (delta: number) => {
      const map = mapRef.current;
      if (!map) return;
      map.easeTo({
        bearing: map.getBearing() + delta,
        duration: getFlyDuration(280),
      });
    },
    [getFlyDuration]
  );

  const handleResetBearing = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({
      bearing: 0,
      duration: getFlyDuration(320),
    });
  }, [getFlyDuration]);

  const handleAdjustPitch = useCallback(
    (delta: number) => {
      const map = mapRef.current;
      if (!map) return;
      const nextPitch = Math.max(0, Math.min(60, Math.round(map.getPitch() + delta)));
      if (nextPitch > 0) {
        setTerrain3d(true);
      }
      map.easeTo({
        pitch: nextPitch,
        duration: getFlyDuration(260),
      });
    },
    [getFlyDuration]
  );

  const ensureTerrainSynced = useCallback(
    (forceEnable = false) => {
      const map = mapRef.current;
      if (!map || !map.getStyle()) return;

      const shouldEnableDem = terrain3d && (forceEnable || map.getZoom() >= TERRAIN_MIN_ZOOM);

      if (!shouldEnableDem) {
        if (map.getTerrain()) {
          map.setTerrain(null);
        }
        if (map.getLayer("terrain-hillshade")) {
          map.removeLayer("terrain-hillshade");
        }
        return;
      }

      if (!map.getSource("terrain-dem")) {
        map.addSource("terrain-dem", {
          type: "raster-dem",
          tiles: [
            "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
          ],
          tileSize: 256,
          minzoom: 0,
          maxzoom: 14,
          encoding: "terrarium",
        });
      }

      if (!map.getLayer("terrain-hillshade")) {
        map.addLayer(
          {
            id: "terrain-hillshade",
            type: "hillshade",
            source: "terrain-dem",
            minzoom: TERRAIN_MIN_ZOOM,
            paint: {
              "hillshade-illumination-direction": 315,
              "hillshade-illumination-anchor": "map",
              "hillshade-exaggeration": 0.45,
              "hillshade-shadow-color": "#060c18",
              "hillshade-highlight-color": "#fff7e6",
            },
          },
          map.getLayer("esri-labels-layer") ? "esri-labels-layer" : undefined
        );
      }

      if (!map.getTerrain()) {
        map.setTerrain({ source: "terrain-dem", exaggeration: 1.6 });
      }
    },
    [terrain3d]
  );

  const flyToSiteCinematographically = useCallback(
    (site: AnalogSite, requestedZoom?: number) => {
      const map = mapRef.current;
      if (!map) return;

      const isPolar = Math.abs(site.latitude) > 60;
      const targetZoom = isPolar ? 7.5 : (requestedZoom ?? 12.2);
      const targetPitch = terrain3d ? 60 : map.getPitch();

      ensureTerrainSynced(targetZoom >= TERRAIN_MIN_ZOOM);

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        map.jumpTo({
          center: [site.longitude, site.latitude],
          zoom: targetZoom,
          pitch: targetPitch,
          bearing: 0,
        });
        ensureTerrainSynced(targetZoom >= TERRAIN_MIN_ZOOM);
        return;
      }

      map.flyTo({
        center: [site.longitude, site.latitude],
        zoom: targetZoom,
        pitch: targetPitch,
        bearing: 0,
        speed: 0.75,
        curve: 1.0,
        essential: true,
      });
    },
    [ensureTerrainSynced, terrain3d]
  );

  // Register tile cache Service Worker once on client
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/tile-cache-sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialSite = initialSelectedSiteIdRef.current
      ? sites.find((s) => s.id === initialSelectedSiteIdRef.current) ?? null
      : null;
    const startLon = initialSite ? initialSite.longitude : 0;
    const startLat = initialSite ? initialSite.latitude : 15;
    const startZoom = initialSite ? 9.8 : 1.8;
    const startPitch = initialSite ? 45 : 0;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getBasemapStyle("satellite"),
      center: [startLon, startLat],
      zoom: startZoom,
      minZoom: 1.3,
      maxZoom: 15.5,
      maxPitch: 60,
      pitch: startPitch,
      bearing: 0,
      fadeDuration: 100,
      maxTileCacheSize: 800,
      refreshExpiredTiles: false,
      cancelPendingTileRequestsWhileZooming: true,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      "top-right"
    );

    let rafId = 0;
    const updateHudCoords = (lat: number, lon: number, zoom: number) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (latSpanRef.current) {
          latSpanRef.current.textContent = `LAT ${lat.toFixed(3)}°`;
        }
        if (lonSpanRef.current) {
          lonSpanRef.current.textContent = `LON ${lon.toFixed(3)}°`;
        }
        if (zoomSpanRef.current) {
          zoomSpanRef.current.textContent = `ZOOM ${zoom.toFixed(1)}`;
        }
      });
    };

    updateHudCoords(startLat, startLon, startZoom);

    map.on("mousemove", (e) => {
      updateHudCoords(e.lngLat.lat, e.lngLat.lng, map.getZoom());
    });

    map.on("zoom", () => {
      const c = map.getCenter();
      updateHudCoords(c.lat, c.lng, map.getZoom());
    });

    const syncCameraView = () => {
      const nextPitch = Math.round(map.getPitch());
      const rawBearing = Math.round(map.getBearing());
      const nextBearing = ((rawBearing % 360) + 360) % 360;
      setCameraView((prev) =>
        prev.pitch === nextPitch && prev.bearing === nextBearing
          ? prev
          : { pitch: nextPitch, bearing: nextBearing }
      );
    };

    map.on("move", syncCameraView);
    syncCameraView();

    mapRef.current = map;

    const resizeObserver =
      typeof ResizeObserver !== "undefined" && containerRef.current
        ? new ResizeObserver(() => {
            map.resize();
          })
        : null;
    if (resizeObserver && containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const markers = markersRef.current;

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      markers.forEach((m) => m.marker.remove());
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (prevBasemapRef.current === basemap) return;
    prevBasemapRef.current = basemap;
    map.setStyle(getBasemapStyle(basemap));
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleSync = () => {
      ensureTerrainSynced();
    };

    if (map.isStyleLoaded()) {
      handleSync();
    }
    map.on("style.load", handleSync);
    map.on("styledata", handleSync);
    map.on("load", handleSync);
    map.on("zoomend", handleSync);

    return () => {
      map.off("style.load", handleSync);
      map.off("styledata", handleSync);
      map.off("load", handleSync);
      map.off("zoomend", handleSync);
    };
  }, [ensureTerrainSynced]);

  // Synchronize site markers without destroying/recreating unchanged DOM elements
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set(sites.map((s) => s.id));

    for (const [id, entry] of markersRef.current.entries()) {
      if (!currentIds.has(id)) {
        entry.marker.remove();
        markersRef.current.delete(id);
      }
    }

    for (const site of sites) {
      const isSelected = site.id === selectedSiteId;
      const target = references[site.best_target];
      const isMars = target?.body === "Mars";
      const planet = PLANET_VISUALS[isMars ? "Mars" : "Moon"];
      const ringColor = planet.accent;
      const markerLabel = `${site.name}, ${site.country}. Análogo de ${planet.label}. ASI ${site.overall_asi.toFixed(1)}% para ${target?.name ?? site.best_target}`;

      const shortName = site.name.split(" - ")[0].split(" (")[0];
      const badgeText = `${shortName} · ${site.overall_asi.toFixed(0)}%`;

      const hexClip = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";
      const sizePx = isSelected ? "40px" : "32px";
      const glowFilter = isSelected
        ? `drop-shadow(0 0 10px ${ringColor})`
        : `drop-shadow(0 0 5px ${ringColor}88)`;

      const existing = markersRef.current.get(site.id);
      if (existing) {
        existing.marker.setLngLat([site.longitude, site.latitude]);
        existing.btn.style.width = sizePx;
        existing.btn.style.height = sizePx;
        existing.btn.style.zIndex = isSelected ? "30" : "10";
        existing.btn.style.filter = glowFilter;
        existing.outer.style.backgroundColor = isSelected ? "#D4AF37" : ringColor;
        existing.core.src = planet.image;
        existing.btn.setAttribute("aria-label", markerLabel);
        existing.btn.setAttribute("aria-pressed", String(isSelected));
        existing.label.textContent = badgeText;
        existing.label.style.opacity = isSelected ? "1" : "";
        existing.label.style.borderColor = isSelected ? "#D4AF37" : `${ringColor}88`;
        continue;
      }

      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", markerLabel);
      btn.setAttribute("aria-pressed", String(isSelected));
      btn.className = "group relative flex items-center justify-center cursor-pointer";
      btn.style.width = sizePx;
      btn.style.height = sizePx;
      btn.style.zIndex = isSelected ? "30" : "10";
      btn.style.filter = glowFilter;

      const outer = document.createElement("span");
      outer.setAttribute("aria-hidden", "true");
      outer.style.cssText = `position:absolute;inset:0;clip-path:${hexClip};background-color:${isSelected ? "#D4AF37" : ringColor}`;

      const core = document.createElement("img");
      core.src = planet.image;
      core.alt = "";
      core.setAttribute("aria-hidden", "true");
      core.draggable = false;
      core.className = "transition-transform duration-150 group-hover:scale-110";
      core.style.cssText = `position:relative;width:calc(100% - 5px);height:calc(100% - 5px);object-fit:cover;clip-path:${hexClip};pointer-events:none;background:#060913`;

      const label = document.createElement("span");
      label.textContent = badgeText;
      label.className =
        "pointer-events-none absolute left-full ml-1.5 whitespace-nowrap rounded border bg-[#060913]/90 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-100 opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100";
      label.style.borderColor = isSelected ? "#D4AF37" : `${ringColor}88`;
      if (isSelected) {
        label.style.opacity = "1";
      }

      btn.appendChild(outer);
      btn.appendChild(core);
      btn.appendChild(label);

      const siteId = site.id;
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        onSelectSiteRef.current(siteId);
      });

      const marker = new maplibregl.Marker({ element: btn })
        .setLngLat([site.longitude, site.latitude])
        .addTo(map);

      markersRef.current.set(site.id, {
        marker,
        btn,
        outer,
        core,
        label,
      });
    }
  }, [sites, references, selectedSiteId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedSiteId) return;

    // Skip the very first render flyTo because the map already boots directly at initialSelectedSiteId
    if (!hasSkippedInitialFlyRef.current) {
      hasSkippedInitialFlyRef.current = true;
      if (selectedSiteId === initialSelectedSiteIdRef.current) {
        return;
      }
    }

    // Do not interrupt an explicit cameraTarget transition
    if (cameraTarget) {
      return;
    }

    const site = sites.find((s) => s.id === selectedSiteId);
    if (!site) return;

    flyToSiteCinematographically(site);
  }, [selectedSiteId, sites, cameraTarget, flyToSiteCinematographically]);

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
        const isQualified = best_asi_score >= 45;
        const isTop = rank === 1 && isQualified;
        const isSelected = id === selectedSiteId;
        const accent = !isQualified
          ? "#899095"
          : isTop
          ? "#C5A36D"
          : body === "Mars"
          ? "#E07A5F"
          : "#38BDF8";

        const wrapper = document.createElement("button");
        wrapper.type = "button";
        wrapper.setAttribute(
          "aria-label",
          `Sector #${rank}, ${best_asi_score.toFixed(1)}% ASI, ${
            isQualified ? "Candidato" : "Sin correlación análoga"
          }`
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

        if ((isTop || isSelected) && isQualified) {
          const reticleSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          reticleSvg.setAttribute("width", "26");
          reticleSvg.setAttribute("height", "26");
          reticleSvg.setAttribute("viewBox", "0 0 26 26");
          reticleSvg.setAttribute("aria-hidden", "true");
          const stroke = isSelected ? "#E4DFD5" : "#C5A36D";
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
          "font-family: var(--font-ibm-plex-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
          "font-variant-numeric: tabular-nums",
          `font-size: ${isTop || isSelected ? "11px" : "10px"}`,
          `font-weight: ${isTop || isSelected ? "700" : "600"}`,
          "line-height: 1",
          `padding: ${isTop || isSelected ? "4px 8px" : "3px 6px"}`,
          "border-radius: 4px",
          `color: ${!isQualified ? "#899095" : isTop || isSelected ? "#E4DFD5" : "#C5A36D"}`,
          `background: ${isTop || isSelected ? "rgba(16, 19, 33, 0.94)" : "rgba(16, 19, 33, 0.82)"}`,
          `border: 1px solid ${isSelected ? "#E4DFD5" : isTop ? "#C5A36D" : "rgba(85, 82, 125, 0.35)"}`,
          `border-left: 2.5px solid ${accent}`,
          "box-shadow: 0 2px 8px rgba(0, 0, 0, 0.55)",
          "backdrop-filter: blur(4px)",
          "white-space: nowrap",
        ].join(";");
        badge.textContent = isTop
          ? `#1 · ${best_asi_score.toFixed(1)}%`
          : isQualified
          ? `S${rank} · ${Math.round(best_asi_score)}%`
          : `S${rank} · ${Math.round(best_asi_score)}% (No análogo)`;

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
    const dur = prefersReducedMotion ? 0 : 750;

    if (cameraTarget.type === "world") {
      map.flyTo({
        center: [0, 15],
        zoom: 1.8,
        pitch: 0,
        bearing: 0,
        duration: dur,
        essential: true,
      });
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
      flyToSiteCinematographically(site, cameraTarget.zoom);
    }
  }, [cameraTarget, sites, flyToSiteCinematographically]);

  return (
    <div className="relative h-full w-full bg-[#071426]">
      <div
        ref={containerRef}
        className="h-full w-full"
        role="region"
        aria-label="Mapa interactivo de sitios análogos planetarios"
      />

      {/* Selector de capa de mapa base y modos de prospección */}
      <div className="absolute right-14 top-3 z-10 flex flex-col items-end gap-2">
        <div
          className="flex items-center gap-1 rounded-lg border border-[#55527D]/35 bg-[#101321]/90 p-1 shadow-lg backdrop-blur-md"
          role="group"
          aria-label="Capa de mapa base"
        >
          {(
            [
              { id: "satellite", label: "Satélite" },
              { id: "nasa-gibs", label: "NASA GIBS" },
              { id: "dark", label: "Mapa Base" },
            ] as const
          ).map(({ id, label }) => {
            const active = basemap === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setBasemap(id)}
                aria-pressed={active}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D] ${
                  active
                    ? "bg-[#C5A36D]/20 text-[#E4DFD5] ring-1 ring-[#C5A36D]/50"
                    : "text-[#A3A1BD] hover:text-[#E4DFD5]"
                }`}
              >
                {label}
              </button>
            );
          })}
          <span className="mx-0.5 h-4 w-px bg-[#55527D]/35" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setTerrain3d((prev) => !prev)}
            aria-pressed={terrain3d}
            title="Activar o desactivar relieve topográfico 3D"
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D] ${
              terrain3d
                ? "bg-[#7CA5B8]/20 text-[#E4DFD5] ring-1 ring-[#7CA5B8]/50"
                : "text-[#A3A1BD] hover:text-[#E4DFD5]"
            }`}
          >
            Relieve 3D
          </button>
          <button
            type="button"
            onClick={handleOpenDiorama}
            title="Abrir Gemelo Topográfico 3D HD (Three.js + Simulador Solar)"
            className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-[#C5A36D] transition-colors hover:bg-[#C5A36D]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
          >
            <Mountain className="h-3.5 w-3.5" aria-hidden="true" />
            <span>3D HD</span>
          </button>
        </div>

        {(onToggleProbeMode || onToggleRegionProbeMode) && (
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {onToggleProbeMode && (
              <button
                type="button"
                onClick={onToggleProbeMode}
                aria-pressed={probeMode}
                title="Haz clic en cualquier coordenada de la Tierra para evaluar NASA POWER y relieve DEM"
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D] ${
                  probeMode
                    ? "border-[#C5A36D] bg-[#C5A36D]/20 text-[#E4DFD5]"
                    : "border-[#55527D]/35 bg-[#101321]/90 text-[#E4DFD5] hover:border-[#C5A36D]/50"
                }`}
              >
                {isProbing
                  ? "Consultando NASA POWER..."
                  : probeMode
                  ? "Sondeo activo: Clic en mapa"
                  : "Sondear punto"}
              </button>
            )}

            {onToggleRegionProbeMode && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onToggleRegionProbeMode}
                  aria-pressed={regionProbeMode}
                  title="Evalúa una grilla de coordenadas en el área visible o arrastrando un rectángulo"
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D] ${
                    regionProbeMode
                      ? "border-[#7CA5B8] bg-[#7CA5B8]/20 text-[#E4DFD5]"
                      : "border-[#55527D]/35 bg-[#101321]/90 text-[#E4DFD5] hover:border-[#7CA5B8]/60"
                  }`}
                >
                  {isProbingRegion
                    ? `Escaneando ${regionGridSize}×${regionGridSize}...`
                    : regionProbeMode
                    ? "Región activa: Arrastra o clic"
                    : "Sondear región"}
                </button>

                {regionProbeMode && onChangeRegionGridSize && (
                  <div
                    className="flex items-center rounded-lg border border-[#55527D]/35 bg-[#101321]/90 p-0.5 backdrop-blur-md"
                    role="group"
                    aria-label="Densidad de grilla regional"
                  >
                    {([3, 4] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => onChangeRegionGridSize(size)}
                        aria-pressed={regionGridSize === size}
                        className={`rounded px-2 py-1 font-mono text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D] ${
                          regionGridSize === size
                            ? "bg-[#7CA5B8]/25 text-[#E4DFD5]"
                            : "text-[#A3A1BD] hover:text-[#E4DFD5]"
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
                    className="rounded-lg border border-[#7CA5B8]/60 bg-[#101321]/90 px-2.5 py-1.5 text-xs font-medium text-[#E4DFD5] backdrop-blur-md transition-colors hover:bg-[#7CA5B8]/20 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
                  >
                    Escanear vista
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
          className="pointer-events-none absolute z-10 border-2 border-dashed border-[#C5A36D] bg-[#C5A36D]/10"
          style={{
            left: Math.min(dragBox.startX, dragBox.curX),
            top: Math.min(dragBox.startY, dragBox.curY),
            width: Math.abs(dragBox.curX - dragBox.startX),
            height: Math.abs(dragBox.curY - dragBox.startY),
          }}
        />
      )}

      {/* Overlay HUD de Coordenadas y Leyenda */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-3 rounded-lg border border-[#55527D]/30 bg-[#101321]/88 px-3 py-1.5 text-xs text-[#A3A1BD] shadow-lg backdrop-blur-md">
        <span ref={latSpanRef} className="font-mono tabular-nums text-[#E4DFD5]">
          LAT -0.670°
        </span>
        <span ref={lonSpanRef} className="font-mono tabular-nums text-[#E4DFD5]">
          LON -78.600°
        </span>
        <span ref={zoomSpanRef} className="font-mono tabular-nums text-[#A3A1BD]">
          ZOOM 6.2
        </span>
        <span className="h-3 w-px bg-[#55527D]/40" aria-hidden="true" />
        <span className="flex items-center gap-1.5 text-[#E4DFD5]">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full bg-[#7CA5B8]"
            aria-hidden="true"
          />
          Lunar
        </span>
        <span className="flex items-center gap-1.5 text-[#E4DFD5]">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full bg-[#D47A61]"
            aria-hidden="true"
          />
          Marciano
        </span>
        {regionResult && (
          <>
            <span className="h-3 w-px bg-[#55527D]/40" aria-hidden="true" />
            <span className="font-mono tabular-nums text-[#E4DFD5]">
              ASI: Bajo{" "}
              <span className="inline-block h-2 w-10 rounded-sm bg-gradient-to-r from-[#27233E] via-[#7CA5B8] via-60% to-[#C5A36D] align-middle" />{" "}
              Alto
            </span>
          </>
        )}
      </div>

      {/* Control compacto de perspectiva 2D / 3D y ángulos */}
      <div
        className="absolute bottom-3 right-3 z-10 flex flex-col gap-1 rounded-lg border border-[#55527D]/35 bg-[#101321]/90 p-1.5 shadow-lg backdrop-blur-md"
        role="group"
        aria-label="Control de perspectiva 2D y 3D"
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleSet2D}
            aria-pressed={cameraView.pitch < 10}
            title="Vista Plana 2D (inclinación 0°, norte 0°)"
            className={`flex flex-1 items-center justify-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D] ${
              cameraView.pitch < 10
                ? "bg-[#C5A36D]/20 text-[#E4DFD5] ring-1 ring-[#C5A36D]/50"
                : "text-[#A3A1BD] hover:bg-[#1F243B] hover:text-[#E4DFD5]"
            }`}
          >
            <Square className="h-3 w-3" aria-hidden="true" />
            <span>2D</span>
          </button>
          <button
            type="button"
            onClick={handleSet3D}
            aria-pressed={cameraView.pitch >= 10}
            title="Vista Terreno 3D inclinada (60°)"
            className={`flex flex-1 items-center justify-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D] ${
              cameraView.pitch >= 10
                ? "bg-[#7CA5B8]/20 text-[#E4DFD5] ring-1 ring-[#7CA5B8]/50"
                : "text-[#A3A1BD] hover:bg-[#1F243B] hover:text-[#E4DFD5]"
            }`}
          >
            <Box className="h-3 w-3" aria-hidden="true" />
            <span>3D</span>
          </button>
          <button
            type="button"
            onClick={handleOpenDiorama}
            title="Abrir Gemelo Topográfico 3D HD (Three.js + Simulador Solar)"
            className="flex flex-1 items-center justify-center gap-1 rounded px-2 py-1 text-[11px] font-semibold text-[#C5A36D] transition-colors hover:bg-[#C5A36D]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
          >
            <Mountain className="h-3 w-3" aria-hidden="true" />
            <span>HD</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-1.5 border-t border-[#55527D]/30 pt-1">
          <div className="flex items-center gap-0.5" title="Rotación de ángulo (Bearing)">
            <button
              type="button"
              onClick={() => handleAdjustBearing(-45)}
              aria-label="Rotar vista -45 grados"
              title="Rotar -45°"
              className="rounded p-1 text-[#A3A1BD] transition-colors hover:bg-[#1F243B] hover:text-[#E4DFD5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleResetBearing}
              aria-label="Restablecer orientación al norte"
              title="Restablecer norte (0°)"
              className="min-w-[30px] rounded px-1 py-0.5 text-center font-mono text-[10px] tabular-nums text-[#E4DFD5] transition-colors hover:bg-[#1F243B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
            >
              {String(cameraView.bearing).padStart(3, "0")}°
            </button>
            <button
              type="button"
              onClick={() => handleAdjustBearing(45)}
              aria-label="Rotar vista +45 grados"
              title="Rotar +45°"
              className="rounded p-1 text-[#A3A1BD] transition-colors hover:bg-[#1F243B] hover:text-[#E4DFD5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
            >
              <RotateCw className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>

          <span className="h-3 w-px bg-[#55527D]/35" aria-hidden="true" />

          <div className="flex items-center gap-0.5" title="Inclinación lateral (Pitch)">
            <button
              type="button"
              onClick={() => handleAdjustPitch(-15)}
              disabled={cameraView.pitch <= 0}
              aria-label="Reducir inclinación 15 grados"
              title="Reducir inclinación (-15°)"
              className="rounded p-1 text-[#A3A1BD] transition-colors hover:bg-[#1F243B] hover:text-[#E4DFD5] disabled:opacity-35 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
            >
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </button>
            <span
              className="min-w-[26px] text-center font-mono text-[10px] tabular-nums text-[#C5A36D]"
              aria-label={`Inclinación actual ${cameraView.pitch} grados`}
            >
              {cameraView.pitch}°
            </span>
            <button
              type="button"
              onClick={() => handleAdjustPitch(15)}
              disabled={cameraView.pitch >= 60}
              aria-label="Aumentar inclinación 15 grados"
              title="Aumentar inclinación (+15°)"
              className="rounded p-1 text-[#A3A1BD] transition-colors hover:bg-[#1F243B] hover:text-[#E4DFD5] disabled:opacity-35 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
            >
              <ChevronUp className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <TerrainDioramaModal
        target={dioramaTarget}
        onClose={() => setDioramaTarget(null)}
      />
    </div>
  );
}
