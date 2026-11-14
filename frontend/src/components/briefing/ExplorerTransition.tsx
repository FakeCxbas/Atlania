"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Compass, Download, ExternalLink } from "lucide-react";
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
    title: "1. Mapas interactivos",
    badge: "MapLibre GL 6 + Relieve 3D",
    summary:
      "Conmutador de mapas base entre Satélite (Esri World Imagery), NASA GIBS (VIIRS True Color) y Vector Oscuro (OpenFreeMap), con terreno 3D AWS Terrarium e inclinación de cámara.",
    realImplementation:
      "Implementado en AnalogMap.tsx con caché local de teselas mediante Service Worker (tile-cache-sw.js).",
    coordsPercent: { left: "54%", top: "46%" },
  },
  {
    id: "region-selection",
    title: "2. Selección de regiones",
    badge: "30 Sitios · 17 Países",
    summary:
      "Navegación por pestañas (Tierra, Luna, Marte), filtro rápido por país con foco en Ecuador y Sudamérica, búsqueda textual y directorio completo.",
    realImplementation:
      "Implementado en MissionControlApp.tsx y SiteDirectory.tsx con encuadre automático de cámara.",
    coordsPercent: { left: "34%", top: "14%" },
  },
  {
    id: "geo-probing",
    title: "3. Sondeo geográfico",
    badge: "API /api/evaluate",
    summary:
      "Permite hacer clic en cualquier coordenada de la Tierra para consultar en tiempo real su elevación, pendiente y climatología satelital.",
    realImplementation:
      "Implementado en src/app/api/evaluate/route.ts y src/lib/evaluateCoordinate.ts.",
    coordsPercent: { left: "68%", top: "30%" },
  },
  {
    id: "env-telemetry",
    title: "4. Datos ambientales",
    badge: "NASA POWER + Copernicus DEM",
    summary:
      "Muestra 7 parámetros climáticos de NASA POWER (T2M_MAX, T2M_MIN, precipitación, viento, humedad, irradiancia solar, presión) y muestreo DEM de 5 puntos.",
    realImplementation:
      "Precalculado en analogs.json (30/30 sitios con fuente nasa_power y open_meteo) y consultado en vivo.",
    coordsPercent: { left: "18%", top: "58%" },
  },
  {
    id: "side-by-side",
    title: "5. Comparación Tierra vs. Luna/Marte",
    badge: "Mesa en 3 Columnas",
    summary:
      "Expande el panel lateral en una mesa comparativa de 3 columnas: Sitio Terrestre, Motor ASI de 5 ejes y Sitio de Referencia Planetario con archivo PDS.",
    realImplementation:
      "Implementado en TelemetryDrawer.tsx y SideBySideComparison.tsx.",
    coordsPercent: { left: "22%", top: "34%" },
  },
  {
    id: "asi-results",
    title: "6. Resultados de similitud",
    badge: "ASI v0.2.0 + Límites Físicos",
    summary:
      "Presenta la puntuación ASI ponderada, el gráfico radar pentagonal, las fortalezas (≥ 70/100) y las diferencias físicas irreproducibles (gravedad, vacío, radiación).",
    realImplementation:
      "Generado por engine/asi_engine.py y representado en AsiRadarChart.tsx.",
    coordsPercent: { left: "16%", top: "78%" },
  },
  {
    id: "regional-prospecting",
    title: "7. Prospección regional",
    badge: "Grilla 3×3 y 4×4 en Vivo",
    summary:
      "Traza un rectángulo sobre el mapa para evaluar simultáneamente 9 o 16 sectores orbitales, generando un mapa de calor y ranking respecto al catálogo.",
    realImplementation:
      "Implementado en src/app/api/evaluate-region/route.ts y src/lib/evaluateRegion.ts.",
    coordsPercent: { left: "82%", top: "70%" },
  },
  {
    id: "data-export",
    title: "8. Exportación de datos",
    badge: "Markdown / JSON / QGIS GeoJSON",
    summary:
      "Descarga el Dossier científico de cada comparación en Markdown o JSON con trazabilidad de fuentes, o exporta la colección GeoJSON EPSG:4326 para QGIS.",
    realImplementation:
      "Implementado en src/lib/dossier.ts y verificado por tests/dossier.test.mjs.",
    coordsPercent: { left: "84%", top: "14%" },
  },
];

interface ExplorerTransitionProps {
  sites: AnalogSite[];
}

/**
 * Chapter 5 component: As the 3D camera pulls back into high orbit,
 * transitions smoothly into the authentic TERR-ANALOG HUD preview
 * and the primary CTA buttons to launch `/explorer`.
 */
export function ExplorerTransition({ sites }: ExplorerTransitionProps) {
  const [activeHotspotId, setActiveHotspotId] = useState<string>(
    EXPLORER_HOTSPOTS[0].id
  );

  const activeHotspot =
    EXPLORER_HOTSPOTS.find((h) => h.id === activeHotspotId) ??
    EXPLORER_HOTSPOTS[0];

  const primarySite = sites[0];

  return (
    <div id="herramienta-investigacion" className="space-y-20">
      {/* Interactive Workbench Preview + 8 Feature Annotations */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left 5 Cols: 8 Selectable Real Features */}
        <div
          role="listbox"
          aria-label="Funciones implementadas en el explorador TERR-ANALOG"
          className="grid gap-2.5 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1"
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
                className={`flex min-h-12 flex-col justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                  isSelected
                    ? "border-[#00D9F5] bg-[#101F30]/95"
                    : "border-slate-800/90 bg-[#0A1624]/80 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#F1F5F9]">
                    {spot.title}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 font-mono text-[10px] ${
                      isSelected
                        ? "bg-[#00D9F5]/20 text-[#00D9F5]"
                        : "bg-slate-800 text-[#94A3B8]"
                    }`}
                  >
                    {spot.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right 7 Cols: Authentic Representation of the Live HUD with Interactive Hotspots */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-[#050B13]/95 p-4 backdrop-blur-xl sm:p-6 lg:col-span-7">
          <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#071018]">
            {/* Top HUD Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-[#050B13]/95 px-3.5 py-2.5 text-[11px]">
              <div className="flex items-center gap-2">
                <Compass className="h-3.5 w-3.5 text-[#F5B82E]" aria-hidden="true" />
                <span className="font-bold tracking-wider text-[#F1F5F9]">
                  TERR-ANALOG // HUD
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <span className="rounded border border-[#F5B82E]/50 bg-[#F5B82E]/15 px-2 py-0.5 text-[#F5B82E]">
                  Tierra ({sites.length})
                </span>
                <span className="rounded border border-slate-800 bg-[#0A1624] px-2 py-0.5 text-[#94A3B8]">
                  Luna (3)
                </span>
                <span className="rounded border border-slate-800 bg-[#0A1624] px-2 py-0.5 text-[#94A3B8]">
                  Marte (3)
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#00D9F5]">
                <Download className="h-3 w-3" aria-hidden="true" />
                <span>GeoJSON / Dossier</span>
              </div>
            </div>

            {/* Main Preview Canvas */}
            <div className="relative h-[340px] w-full overflow-hidden sm:h-[380px]">
              <Image
                src="/nasa/earth-horizon-iss.jpg"
                alt="Vista orbital de la Tierra desde la Estación Espacial Internacional como fondo del visor geoespacial"
                width={900}
                height={500}
                loading="lazy"
                className="h-full w-full object-cover opacity-35"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#050B13] via-[#050B13]/55 to-transparent"
                aria-hidden="true"
              />

              {/* Real Data Telemetry Mini-Drawer Overlay */}
              <div className="absolute top-3 bottom-3 left-3 w-[215px] rounded-xl border border-slate-800 bg-[#0A1624]/95 p-3 backdrop-blur-md sm:w-[250px]">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-[#F5B82E]/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#F5B82E]">
                    ECUADOR · {primarySite?.elevation_m ?? 409} m
                  </span>
                  <span className="font-mono text-xs font-bold text-[#00D9F5] tabular-nums">
                    {(primarySite?.overall_asi ?? 88.2).toFixed(1)}% ASI
                  </span>
                </div>
                <p className="mt-1.5 truncate text-xs font-bold text-[#F1F5F9]">
                  {primarySite?.name}
                </p>
                <p className="mt-0.5 truncate font-mono text-[10px] text-[#94A3B8]">
                  Objetivo: Mare Tranquillitatis
                </p>

                <div className="mt-3 space-y-1.5 border-t border-slate-800 pt-2.5 font-mono text-[10px] tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">NASA POWER Tmax/Tmin:</span>
                    <span className="text-[#F1F5F9]">
                      {primarySite?.climatology.tmax_c}°C /{" "}
                      {primarySite?.climatology.tmin_c}°C
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">DEM Pendiente:</span>
                    <span className="text-[#00D9F5]">
                      {primarySite?.dem_telemetry.dem_slope_deg}°
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Subterráneo / Tubos:</span>
                    <span className="text-emerald-300">100.0 / 100</span>
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-slate-800 bg-[#050B13]/80 p-2 font-mono text-[9px] text-[#94A3B8]">
                  <span className="block font-bold text-[#F5B82E]">
                    LÍMITE FÍSICO REPORTADO:
                  </span>
                  Gravedad 9.81 m/s² vs. 1.62 m/s² lunar; atmósfera húmeda vs. vacío.
                </div>
              </div>

              {/* Interactive Hotspot Markers */}
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
                    className={`absolute -translate-x-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border font-mono text-xs font-bold transition-transform ${
                      active
                        ? "z-20 scale-110 border-[#00D9F5] bg-[#00D9F5] text-[#050B13]"
                        : "z-10 border-[#F5B82E]/80 bg-[#050B13]/90 text-[#F5B82E] hover:scale-105"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Hotspot Annotation Card */}
          <div
            aria-live="polite"
            className="mt-4 rounded-xl border border-slate-800 bg-[#101F30]/95 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold uppercase text-[#00D9F5]">
                ANOTACIÓN ACTIVA // {activeHotspot.badge}
              </span>
              <Link
                href="/explorer"
                className="font-mono text-xs font-semibold text-[#F5B82E] hover:underline"
              >
                Iniciar exploración en vivo →
              </Link>
            </div>
            <h3 className="mt-1.5 text-lg font-bold text-[#F1F5F9]">
              {activeHotspot.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#F1F5F9]/90">
              {activeHotspot.summary}
            </p>
            <p className="mt-2 font-mono text-xs text-[#94A3B8]">
              {activeHotspot.realImplementation}
            </p>
          </div>
        </div>
      </div>

      {/* Final Cinematic Mission CTA */}
      <div
        id="comienza-tu-mision"
        className="relative overflow-hidden rounded-3xl border border-slate-800/90 bg-gradient-to-br from-[#0A1624]/95 via-[#101F30]/95 to-[#050B13]/95 px-6 py-16 text-center backdrop-blur-xl sm:px-14 sm:py-24"
      >
        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <BrandLogo brand="nasa" size="sm" showLabel={false} />
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#F5B82E]">
              CAPÍTULO 05 // ACCESO AL EXPLORADOR GEOESPACIAL
            </span>
          </div>

          <h3 className="mt-5 text-3xl font-bold tracking-tight text-[#F1F5F9] sm:text-5xl">
            La próxima misión comienza en la Tierra.
          </h3>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#94A3B8] sm:text-lg">
            Descubre lugares, compara condiciones y explora cómo los datos terrestres
            pueden apoyar la investigación de futuros entornos lunares y marcianos.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/explorer"
              className="inline-flex min-h-13 items-center gap-3 rounded-full border border-[#00D9F5] bg-[#00D9F5] px-8 py-3.5 text-sm font-bold tracking-[0.12em] text-[#050B13] transition-transform hover:scale-[1.02]"
            >
              <span>INICIAR EXPLORACIÓN</span>
              <ArrowUpRight className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
            </Link>

            <Link
              href="/explorer"
              className="inline-flex min-h-13 items-center gap-2.5 rounded-full border border-[#00D9F5]/45 bg-[#0A1624]/90 px-7 py-3.5 text-sm font-bold tracking-[0.1em] text-[#F1F5F9] transition-colors hover:border-[#00D9F5] hover:text-[#00D9F5]"
            >
              <span>ENTRAR A TERR-ANALOG</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <a
              href="https://github.com/FakeCxbas/nasa-space-apps-2026"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex min-h-13 items-center gap-2.5 rounded-full border border-slate-700 bg-[#050B13]/85 px-7 py-3.5 text-sm font-bold tracking-[0.1em] text-[#F1F5F9] transition-colors hover:border-[#00D9F5]/60 hover:text-[#00D9F5]"
            >
              <BrandLogo brand="github" size="sm" showLabel={false} />
              <span>VER CÓDIGO EN GITHUB</span>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          {/* Verified Technology & Institution Stack Strip */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 border-t border-slate-800/80 pt-8">
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
              className="inline-flex items-center gap-1.5 font-mono text-xs text-[#F5B82E] hover:underline"
            >
              <span>
                Desafío oficial: Identify Earth Locations that Analog the Permanent Moon
                Base Locations and Mars
              </span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
