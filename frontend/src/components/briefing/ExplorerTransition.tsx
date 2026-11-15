"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AtlaniaIsotipo } from "@/components/AtlaniaBrand";
import { ArrowUpRight, Download, ExternalLink } from "lucide-react";
import type { AnalogSite } from "@/types/analog";
import { BrandLogo } from "./BrandLogo";

export interface ExplorerHotspot {
  id: string;
  title: string;
  badge: string;
  summary: string;
  realImplementation: string;
  coordsPercent: { left: string; top: string };
}

export const EXPLORER_HOTSPOTS: ExplorerHotspot[] = [
  {
    id: "interactive-maps",
    title: "01 · Mapas interactivos",
    badge: "MapLibre + 3D",
    summary: "Capas Satélite, NASA GIBS, Mapa Base y relieve 3D.",
    realImplementation: "",
    coordsPercent: { left: "50%", top: "48%" },
  },
  {
    id: "region-selection",
    title: "02 · Selección de regiones",
    badge: "35 Sitios · 20 Países",
    summary: "Filtro por planeta, país y buscador directo.",
    realImplementation: "",
    coordsPercent: { left: "24%", top: "24%" },
  },
  {
    id: "geo-probing",
    title: "03 · Sondeo geográfico",
    badge: "En vivo",
    summary: "Evalúa cualquier coordenada terrestre con un clic.",
    realImplementation: "",
    coordsPercent: { left: "66%", top: "30%" },
  },
  {
    id: "env-telemetry",
    title: "04 · Datos ambientales",
    badge: "NASA POWER + DEM",
    summary: "Clima orbital y topografía DEM a 90 m.",
    realImplementation: "",
    coordsPercent: { left: "34%", top: "64%" },
  },
  {
    id: "side-by-side",
    title: "05 · Comparación directa",
    badge: "Tierra vs. Luna/Marte",
    summary: "Contraste lado a lado frente a escenarios PDS.",
    realImplementation: "",
    coordsPercent: { left: "18%", top: "46%" },
  },
  {
    id: "asi-results",
    title: "06 · Índice ASI y radar",
    badge: "5 Ejes",
    summary: "Afinidad ponderada por misión y límites físicos.",
    realImplementation: "",
    coordsPercent: { left: "52%", top: "74%" },
  },
  {
    id: "regional-prospecting",
    title: "07 · Prospección regional",
    badge: "Grilla 3×3 / 4×4",
    summary: "Escaneo simultáneo de sectores con mapa de calor.",
    realImplementation: "",
    coordsPercent: { left: "78%", top: "68%" },
  },
  {
    id: "data-export",
    title: "08 · Exportación GIS",
    badge: "GeoJSON / Dossier",
    summary: "Descarga directa para QGIS, JSON y Markdown.",
    realImplementation: "",
    coordsPercent: { left: "84%", top: "20%" },
  },
];

type PreviewBody = "earth" | "moon" | "mars";

const BODY_PREVIEW_META: Record<
  PreviewBody,
  {
    label: string;
    image: string;
    alt: string;
    targetName: string;
    gravityText: string;
  }
> = {
  earth: {
    label: "Tierra",
    image: "/nasa/earth-equirectangular.jpg",
    alt: "Mapa global equirectangular de la Tierra con sitios análogos georreferenciados",
    targetName: "Mare Tranquillitatis",
    gravityText: "Gravedad 9.81 vs. 1.62 m/s² · Atmósfera vs. vacío.",
  },
  moon: {
    label: "Luna",
    image: "/nasa/moon-equirectangular.jpg",
    alt: "Mapa global equirectangular de la Luna basado en datos LRO",
    targetName: "Cráter Shackleton · Polo Sur",
    gravityText: "Gravedad 1.62 m/s² · Vacío extremo y regolito abrasivo.",
  },
  mars: {
    label: "Marte",
    image: "/nasa/mars-equirectangular.jpg",
    alt: "Mapa global equirectangular de Marte basado en datos MRO/MOLA",
    targetName: "Cráter Jezero · Delta antiguo",
    gravityText: "Gravedad 3.72 m/s² · Atmósfera CO₂ (0.6 kPa) y radiación.",
  },
};

interface ExplorerTransitionProps {
  sites: AnalogSite[];
}

export function ExplorerTransition({ sites }: ExplorerTransitionProps) {
  const [activeHotspotId, setActiveHotspotId] = useState<string>(
    EXPLORER_HOTSPOTS[0].id
  );
  const [previewBody, setPreviewBody] = useState<PreviewBody>("earth");
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(
    sites[0]?.id ?? null
  );

  const activeHotspot =
    EXPLORER_HOTSPOTS.find((h) => h.id === activeHotspotId) ??
    EXPLORER_HOTSPOTS[0];

  const activeSite =
    sites.find((s) => s.id === selectedSiteId) ?? sites[0];

  const bodyMeta = BODY_PREVIEW_META[previewBody];

  return (
    <div id="herramienta-investigacion" className="space-y-20">
      {/* Interactive Workbench Preview + Hairline Feature Index */}
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
        {/* Left 5 Cols: Clean Hairline Feature Index (No boxy cards) */}
        <div
          role="listbox"
          aria-label="Funciones implementadas en el observatorio ATLANIA"
          className="divide-y divide-[#55527D]/30 border-y border-[#55527D]/30 lg:col-span-5"
        >
          {EXPLORER_HOTSPOTS.map((spot) => {
            const isSelected = activeHotspot.id === spot.id;
            return (
              <button
                key={spot.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => setActiveHotspotId(spot.id)}
                className="group w-full py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A36D]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`text-sm font-semibold tracking-tight transition-colors ${
                      isSelected
                        ? "text-[#C5A36D]"
                        : "text-[#A3A1BD] group-hover:text-[#E4DFD5]"
                    }`}
                  >
                    {spot.title}
                  </span>
                  <span className="font-mono text-[10px] tracking-wider text-[#A3A1BD] uppercase">
                    {spot.badge}
                  </span>
                </div>

                {isSelected && (
                  <p className="mt-1 text-xs text-[#E4DFD5]/90">
                    {spot.summary}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Right 7 Cols: Authentic Viewport Representation with Interactive Markers */}
        <div className="lg:col-span-7">
          <div className="relative overflow-hidden rounded-2xl border border-[#55527D]/35 bg-[#121626]/95 backdrop-blur-md">
            {/* Top HUD Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#55527D]/30 bg-[#101321]/95 px-4 py-3 text-[11px]">
              <div className="flex items-center gap-2">
                <AtlaniaIsotipo className="h-5 w-5 shrink-0" />
                <span className="font-bold tracking-wider text-[#E4DFD5]">
                  ATLANIA // PLANETARY OBSERVATORY
                </span>
              </div>
              <div
                className="flex items-center gap-1 font-mono text-[10px] text-[#A3A1BD]"
                role="group"
                aria-label="Cambiar cuerpo planetario en vista previa"
              >
                <button
                  type="button"
                  onClick={() => setPreviewBody("earth")}
                  aria-pressed={previewBody === "earth"}
                  className={`rounded px-1.5 py-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-[#C5A36D] ${
                    previewBody === "earth"
                      ? "bg-[#C5A36D]/15 font-semibold text-[#C5A36D]"
                      : "hover:text-[#E4DFD5]"
                  }`}
                >
                  Tierra ({sites.length})
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => setPreviewBody("moon")}
                  aria-pressed={previewBody === "moon"}
                  className={`rounded px-1.5 py-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-[#C5A36D] ${
                    previewBody === "moon"
                      ? "bg-[#C5A36D]/15 font-semibold text-[#C5A36D]"
                      : "hover:text-[#E4DFD5]"
                  }`}
                >
                  Luna (3)
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => setPreviewBody("mars")}
                  aria-pressed={previewBody === "mars"}
                  className={`rounded px-1.5 py-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-[#C5A36D] ${
                    previewBody === "mars"
                      ? "bg-[#C5A36D]/15 font-semibold text-[#C5A36D]"
                      : "hover:text-[#E4DFD5]"
                  }`}
                >
                  Marte (3)
                </button>
              </div>
              <Link
                href="/explorer"
                className="flex items-center gap-1.5 font-mono text-[10px] text-[#7CA5B8] transition-colors hover:text-[#E4DFD5] focus-visible:outline-2 focus-visible:outline-[#7CA5B8]"
              >
                <Download className="h-3 w-3" aria-hidden="true" />
                <span>GeoJSON / Dossier</span>
              </Link>
            </div>

            {/* Split Workbench: Dedicated Telemetry Column + Clean Map Canvas */}
            <div className="flex flex-col sm:flex-row">
              {/* Left Telemetry Panel (Never overlapped by map markers) */}
              <div className="shrink-0 border-b border-[#55527D]/30 bg-[#181B2C]/90 p-4 sm:w-[235px] sm:border-r sm:border-b-0">
                <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                  <span className="truncate text-[#C5A36D] uppercase">
                    {activeSite?.country ?? "ECUADOR"} ·{" "}
                    {Math.round(activeSite?.elevation_m ?? 409)} m
                  </span>
                  <span className="shrink-0 font-bold text-[#7CA5B8] tabular-nums">
                    {(activeSite?.overall_asi ?? 88.2).toFixed(1)}% ASI
                  </span>
                </div>
                <p className="mt-2 truncate text-xs font-bold text-[#E4DFD5]">
                  {activeSite?.name ?? "Tubos de Lava de Galápagos"}
                </p>
                <p className="mt-0.5 truncate font-mono text-[10px] text-[#A3A1BD]">
                  Objetivo: {bodyMeta.targetName}
                </p>

                <div className="mt-4 space-y-2 border-t border-[#55527D]/30 pt-3 font-mono text-[10px] tabular-nums">
                  <div className="flex justify-between gap-2">
                    <span className="text-[#A3A1BD]">NASA POWER:</span>
                    <span className="text-[#E4DFD5]">
                      {Number(activeSite?.climatology.tmax_c ?? 24.4).toFixed(1)}°C /{" "}
                      {Number(activeSite?.climatology.tmin_c ?? 21.8).toFixed(1)}°C
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#A3A1BD]">DEM Pendiente:</span>
                    <span className="text-[#7CA5B8]">
                      {Number(activeSite?.dem_telemetry.dem_slope_deg ?? 4.9).toFixed(1)}°
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#A3A1BD]">Coordenadas:</span>
                    <span className="text-[#8AB8A8]">
                      {(activeSite?.latitude ?? -0.82).toFixed(2)}°,{" "}
                      {(activeSite?.longitude ?? -91.14).toFixed(2)}°
                    </span>
                  </div>
                </div>

                <div className="mt-4 border-t border-[#55527D]/30 pt-2.5 font-mono text-[9px] leading-relaxed text-[#A3A1BD]">
                  <span className="block font-bold text-[#C5A36D]">
                    LÍMITE FÍSICO:
                  </span>
                  {bodyMeta.gravityText}
                </div>

                {/* Active Hotspot Callout inside Telemetry Panel */}
                <div className="mt-4 rounded-lg border border-[#C5A36D]/30 bg-[#121626]/80 px-2.5 py-2">
                  <div className="flex items-center justify-between font-mono text-[9px] text-[#C5A36D] uppercase">
                    <span>{activeHotspot.title}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] leading-snug text-[#E4DFD5]/85">
                    {activeHotspot.summary}
                  </p>
                </div>
              </div>

              {/* Right Map Canvas: Equirectangular Projection + Real Site Pins + Numbered Hotspots */}
              <div className="relative h-[300px] flex-1 overflow-hidden bg-[#0D101B] sm:h-[380px]">
                <Image
                  src={bodyMeta.image}
                  alt={bodyMeta.alt}
                  width={1024}
                  height={512}
                  loading="lazy"
                  className="h-full w-full object-cover opacity-75 transition-opacity duration-300"
                />
                {/* Subtle geospatial vignette & graticule grid */}
                <div
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(13,16,27,0.75)_100%)]"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgba(124,165,184,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(124,165,184,0.35) 1px, transparent 1px)",
                    backgroundSize: "16.666% 25%",
                  }}
                  aria-hidden="true"
                />

                {/* Plotted Real Analog Sites on Earth Map */}
                {previewBody === "earth" &&
                  sites.map((site) => {
                    const leftPct = ((site.longitude + 180) / 360) * 100;
                    const topPct = ((90 - site.latitude) / 180) * 100;
                    const isSiteSelected = activeSite?.id === site.id;
                    return (
                      <button
                        key={site.id}
                        type="button"
                        onClick={() => setSelectedSiteId(site.id)}
                        style={{
                          left: `${leftPct}%`,
                          top: `${topPct}%`,
                        }}
                        title={`${site.name} (${site.country})`}
                        aria-label={`Seleccionar sitio análogo ${site.name}`}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-[#C5A36D] ${
                          isSiteSelected
                            ? "z-20 h-3 w-3 border-2 border-[#E4DFD5] bg-[#C5A36D] shadow-[0_0_10px_rgba(197,163,109,0.9)]"
                            : "z-10 h-2 w-2 bg-[#7CA5B8]/80 hover:scale-150 hover:bg-[#C5A36D]"
                        }`}
                      />
                    );
                  })}

                {/* Interactive Feature Hotspot Markers (Positioned cleanly over Map Canvas) */}
                {EXPLORER_HOTSPOTS.map((spot, idx) => {
                  const active = activeHotspot.id === spot.id;
                  return (
                    <button
                      key={spot.id}
                      type="button"
                      onClick={() => setActiveHotspotId(spot.id)}
                      style={{
                        left: spot.coordsPercent.left,
                        top: spot.coordsPercent.top,
                      }}
                      aria-label={`Ver anotación ${spot.title}`}
                      aria-pressed={active}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[11px] font-bold transition-transform focus-visible:outline-2 focus-visible:outline-[#C5A36D] ${
                        active
                          ? "z-30 scale-115 border-[#C5A36D] bg-[#27233E]/95 text-[#C5A36D] shadow-[0_0_14px_rgba(197,163,109,0.45)]"
                          : "z-20 border-[#55527D]/60 bg-[#121626]/85 text-[#E4DFD5] hover:border-[#7CA5B8]"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}

                {/* Bottom-Right Active Hotspot Pill */}
                <div className="pointer-events-none absolute right-3 bottom-3 z-20 rounded-md border border-[#55527D]/40 bg-[#101321]/85 px-2.5 py-1 font-mono text-[10px] text-[#A3A1BD] backdrop-blur-sm">
                  <span className="text-[#C5A36D]">{bodyMeta.label.toUpperCase()}</span>
                  {" · "}
                  <span>{activeHotspot.badge}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final Open-Space Editorial Mission CTA (No heavy container box) */}
      <div
        id="comienza-tu-mision"
        className="border-t border-[#55527D]/30 pt-16 pb-6 text-center"
      >
        <div className="mx-auto max-w-3xl">
          <span className="font-mono text-xs tracking-[0.22em] text-[#C5A36D] uppercase">
            05 // Comienza tu Misión
          </span>

          <h3 className="mt-4 text-4xl font-bold tracking-tight text-[#E4DFD5] sm:text-5xl">
            La próxima misión comienza en la Tierra.
          </h3>

          <p className="mx-auto mt-3 max-w-xl text-base text-[#A3A1BD]">
            Compara sitios terrestres con la Luna y Marte en tiempo real.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/explorer"
              className="inline-flex min-h-13 items-center gap-3 rounded-full bg-[#C5A36D] hover:bg-[#d4b47e] px-8 py-3.5 text-sm font-bold tracking-[0.12em] text-[#101321] transition-transform hover:scale-[1.02]"
            >
              <span>INICIAR EXPLORACIÓN</span>
              <ArrowUpRight
                className="h-5 w-5 stroke-[2.5]"
                aria-hidden="true"
              />
            </Link>

            <Link
              href="/explorer"
              className="inline-flex min-h-13 items-center gap-2.5 rounded-full border border-[#C5A36D]/40 bg-[#181B2C]/85 px-7 py-3.5 text-sm font-bold tracking-[0.1em] text-[#E4DFD5] backdrop-blur-md transition-colors hover:border-[#C5A36D] hover:text-[#C5A36D]"
            >
              <span>ENTRAR A ATLANIA</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <a
              href="https://github.com/FakeCxbas/nasa-space-apps-2026"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex min-h-13 items-center gap-2.5 rounded-full border border-[#55527D]/35 bg-transparent px-7 py-3.5 text-sm font-bold tracking-[0.1em] text-[#E4DFD5] transition-colors hover:border-[#55527D]/35"
            >
              <BrandLogo brand="github" size="sm" showLabel={false} />
              <span>VER CÓDIGO EN GITHUB</span>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          {/* Technology & Open Data Attribution Strip in Footer Context */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-7 border-t border-[#55527D]/30 pt-10">
            <BrandLogo brand="nasa-worm" size="sm" />
            <BrandLogo brand="nasa-power" size="sm" />
            <BrandLogo brand="nasa-pds" size="sm" />
            <BrandLogo brand="copernicus" size="sm" />
            <BrandLogo brand="python" size="sm" />
            <BrandLogo brand="nextjs" size="sm" />
            <BrandLogo brand="maplibre" size="sm" />
          </div>

          <div className="mt-6">
            <a
              href="https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-[#C5A36D] hover:underline"
            >
              <span>
                Desafío oficial: Identify Earth Locations that Analog the
                Permanent Moon Base Locations and Mars
              </span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
