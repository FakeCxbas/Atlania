"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { AnalogSite, TargetProfile } from "@/types/analog";

interface AnalogMapProps {
  sites: AnalogSite[];
  references: Record<string, TargetProfile>;
  selectedSiteId: string | null;
  onSelectSite: (siteId: string) => void;
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
}: AnalogMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [basemap, setBasemap] = useState<BasemapMode>("satellite");
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

  return (
    <div className="relative h-full w-full bg-[#060913]">
      <div
        ref={containerRef}
        className="h-full w-full"
        role="region"
        aria-label="Interactive planetary analog world map"
      />

      {/* Basemap Layer Switcher */}
      <div
        className="absolute left-3 top-3 flex items-center gap-1 rounded-md border border-slate-800/80 bg-[#060913]/85 p-1 backdrop-blur-md"
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
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/60"
                  : "text-slate-300 hover:text-slate-100 border border-transparent"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

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
      </div>
    </div>
  );
}
