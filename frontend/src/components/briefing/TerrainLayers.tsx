"use client";

import React from "react";
import { ScientificIcon, type ScientificConcept } from "./ScientificIcon";
import { BrandLogo, type BrandId } from "./BrandLogo";

export interface TerrainLayersProps {
  /** Scroll-driven separation factor [0..1] */
  layerSeparation: number;
  /** Currently focused layer (-1 = all simultaneously, 0 = scroll-synced, 1..4 = manual stratum) */
  focusedLayer: -1 | 0 | 1 | 2 | 3 | 4;
  onSelectLayer: (layer: -1 | 0 | 1 | 2 | 3 | 4) => void;
  activePipelineStep: number;
  onSelectPipelineStep: (idx: number) => void;
  pipelineSteps: {
    step: string;
    code: string;
    title: string;
    description: string;
    sources: string[];
    brands: BrandId[];
  }[];
}

interface StratumSpec {
  id: 1 | 2 | 3 | 4;
  number: string;
  title: string;
  concept: ScientificConcept;
  natureBadge: string;
  accentColor: string;
  summary: string;
  detail: string;
}

const STRATA: StratumSpec[] = [
  {
    id: 1,
    number: "01",
    title: "Superficie y Atmósfera (Clima a 2 m)",
    concept: "thermal",
    natureBadge: "Telemetría Satelital Medida · NASA POWER",
    accentColor: "#38BDF8",
    summary:
      "7 parámetros climáticos satelitales: T2M_MAX, T2M_MIN, precipitación, viento, humedad, irradiancia solar y presión superficial.",
    detail:
      "El plano superior representa la frontera atmosférica; la grilla 3D es esquemática, mientras que los valores térmicos y de aridez provienen de NASA POWER API.",
  },
  {
    id: 2,
    number: "02",
    title: "Relieve y Topografía (DEM 90 m)",
    concept: "topography",
    natureBadge: "Muestreo DEM Medido + Malla 3D Esquemática",
    accentColor: "#00D9F5",
    summary:
      "Pendiente media (dem_slope_deg) y rugosidad (dem_roughness_m) calculadas mediante 5 puntos cardinales (±0.01° N, S, E, O) en Copernicus DEM GLO-90.",
    detail:
      "La malla tridimensional con sombras muestra ilustrativamente cómo se evalúan gradientes y depresiones cratéricas para movilidad de rovers.",
  },
  {
    id: 3,
    number: "03",
    title: "Geología y Litología",
    concept: "geology",
    natureBadge: "Prior Documental de Escenario · Jaccard Difuso",
    accentColor: "#F5B82E",
    summary:
      "Membresía en [0, 1] para basalto, regolito/tefra, sedimentario, evaporitas/sales e impacto comparada mediante Σ min / Σ max.",
    detail:
      "Representación esquemática de la corteza rocosa frente a firmas orbitales de MRO CRISM y LRO.",
  },
  {
    id: 4,
    number: "04",
    title: "Subsuelo, Criósfera y Tubos de Lava",
    concept: "subsurface",
    natureBadge: "Prior Operativo Ilustrativo · Sin Tomografía en Vivo",
    accentColor: "#E07A5F",
    summary:
      "Potencial de refugio subterráneo (tubos de lava basálticos) y presencia de permafrost/hielo para ensayos de perforación e ISRU.",
    detail:
      "El conducto cilíndrico en la base 3D es estrictamente esquemático; el motor no ejecuta radar de penetración terrestre (GPR) en tiempo real.",
  },
];

/**
 * Chapter 3 component: Pairs a pinned/sticky full-viewport 3D terrain descent
 * (where the right side of the screen leaves the Three.js 4-layer volumetric terrain block
 * completely unobstructed as it separates with scroll) with Awwwards-grade editorial
 * typography on the left, followed by the 4-stage pipeline.
 */
export function TerrainLayers({
  layerSeparation,
  focusedLayer,
  onSelectLayer,
  activePipelineStep,
  onSelectPipelineStep,
  pipelineSteps,
}: TerrainLayersProps) {
  // Determine which stratum is naturally highlighted by scroll if user hasn't locked one
  const scrollActiveStratum: 1 | 2 | 3 | 4 =
    layerSeparation < 0.28
      ? 1
      : layerSeparation < 0.56
      ? 2
      : layerSeparation < 0.84
      ? 3
      : 4;

  const activeStratumId =
    focusedLayer === 0
      ? scrollActiveStratum
      : focusedLayer === -1
      ? 0
      : focusedLayer;

  // CSS 3D isometric offset for the floating callout markers on the right
  const sepPct = Math.round(Math.max(0, Math.min(1, layerSeparation)) * 100);

  return (
    <div>
      {/* Pinned / Sticky 3D Stratification Track (400vh: 4 mandatory 100vh stops) */}
      <div id="terrain-3d-track" className="relative h-[400vh]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[100vh] left-0 h-screen w-full snap-start snap-always"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[200vh] left-0 h-screen w-full snap-start snap-always"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[300vh] left-0 h-screen w-full snap-start snap-always"
        />
        <div className="sticky top-0 flex h-screen w-full items-center overflow-hidden px-6 pt-16 sm:px-12 lg:px-16">
          <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-12">
            {/* Left 6 Cols: Editorial Typography + Hairline Layer List */}
            <div className="lg:col-span-6">
              <div className="flex items-center gap-3 font-mono text-xs tracking-[0.2em] text-[#00D9F5] uppercase">
                <span>03 // Capas del Terreno</span>
                <span className="h-px w-8 bg-[#00D9F5]/50" />
                <span className="text-[#94A3B8] tabular-nums">
                  Separación 3D: {sepPct}%
                </span>
              </div>

              <h2
                id="capas-del-terreno-heading"
                className="mt-4 text-3xl font-bold tracking-tight text-[#F1F5F9] sm:text-5xl sm:leading-[1.08]"
              >
                Anatomía tridimensional de un análogo.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#94A3B8] sm:text-base">
                Al descender hacia la superficie terrestre, el bloque 3D se separa
                en cuatro estratos sincronizados con el scroll.{" "}
                <strong className="font-normal text-[#F5B82E]">
                  Las geometrías 3D de relieve, roca y conductos son
                  representaciones esquemáticas e ilustrativas
                </strong>
                , combinadas con telemetría satelital real.
              </p>

              {/* Editorial Hairline List of the 4 Strata (No boxy cards) */}
              <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
                {STRATA.map((s) => {
                  const isCurrent = activeStratumId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        onSelectLayer(focusedLayer === s.id ? 0 : s.id)
                      }
                      className="group w-full py-3.5 text-left transition-opacity"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="inline-flex items-center gap-2 font-mono text-xs font-bold tabular-nums"
                            style={{
                              color: isCurrent ? s.accentColor : "#64748B",
                            }}
                          >
                            <span>{s.number}</span>
                            <ScientificIcon
                              concept={s.concept}
                              className="h-4 w-4"
                            />
                          </span>
                          <span
                            className={`text-sm font-semibold tracking-tight transition-colors sm:text-base ${
                              isCurrent
                                ? "text-[#F1F5F9]"
                                : "text-[#94A3B8] group-hover:text-[#F1F5F9]"
                            }`}
                          >
                            {s.title}
                          </span>
                        </div>

                        <span className="font-mono text-xs font-semibold tracking-wider text-slate-300 uppercase">
                          {s.natureBadge}
                        </span>
                      </div>

                      <div
                        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none ${
                          isCurrent
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="mt-2.5 pl-7 text-sm leading-relaxed text-slate-200">
                            <p className="font-medium text-slate-100">{s.summary}</p>
                            <p className="mt-1 font-mono text-xs text-slate-300">
                              {s.detail}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right 6 Cols: Unobstructed Viewport Window for the Three.js 3D Volumetric Terrain Block */}
            <div className="relative hidden h-[480px] flex-col justify-end pointer-events-none lg:col-span-6 lg:flex">
              <div className="flex items-center justify-between border-t border-white/10 pt-3 font-mono text-[11px] text-[#94A3B8]">
                <span className="text-[#00D9F5]">
                  MODELO 3D ESQUEMÁTICO · RELIEVE Y SOMBRAS EN VIVO
                </span>
                {focusedLayer !== -1 ? (
                  <button
                    type="button"
                    onClick={() => onSelectLayer(-1)}
                    className="pointer-events-auto text-[#F1F5F9] underline decoration-[#00D9F5] underline-offset-4 hover:text-[#00D9F5]"
                  >
                    Ver las 4 capas simultáneamente
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectLayer(0)}
                    className="pointer-events-auto text-[#00D9F5] underline decoration-[#00D9F5] underline-offset-4 hover:text-[#F1F5F9]"
                  >
                    Sincronizar foco con scroll
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editorial 4-Stage Pipeline Section (Nuestra Solución) */}
      <div
        id="nuestra-solucion"
        className="mx-auto max-w-7xl snap-start snap-always px-6 py-24 sm:px-12 lg:px-16"
      >
        <div className="grid gap-12 border-t border-white/10 pt-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="font-mono text-xs tracking-[0.2em] text-[#00D9F5] uppercase">
              Arquitectura de Solución // 4 Etapas
            </span>
            <h3 className="mt-3 text-3xl font-bold tracking-tight text-[#F1F5F9] sm:text-4xl">
              De los datos terrestres a la exploración planetaria.
            </h3>
            <p className="mt-4 text-base leading-relaxed text-slate-200">
              Cada estrato físico del terreno alimenta el modelo analógico ASI y la estación interactiva del explorador planetario.
            </p>

            {/* Official Source & Tech Logos */}
            <div className="mt-8 flex flex-wrap items-center gap-5 border-t border-white/10 pt-6">
              <BrandLogo brand="nasa-power" size="sm" />
              <BrandLogo brand="copernicus" size="sm" />
              <BrandLogo brand="nasa-pds" size="sm" />
              <BrandLogo brand="python" size="sm" />
            </div>
          </div>

          <div className="lg:col-span-7">
            {/* Clean 4-Step Tabs */}
            <div className="flex flex-wrap gap-6 border-b border-white/10 pb-4">
              {pipelineSteps.map((item, idx) => {
                const active = activePipelineStep === idx;
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => onSelectPipelineStep(idx)}
                    aria-pressed={active}
                    className={`pb-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                      active
                        ? "border-b-2 border-[#00D9F5] font-bold text-[#F1F5F9]"
                        : "text-[#94A3B8] hover:text-[#F1F5F9]"
                    }`}
                  >
                    {item.step}
                  </button>
                );
              })}
            </div>

            <div className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="font-mono text-xs uppercase tracking-widest text-[#F5B82E]">
                  {pipelineSteps[activePipelineStep].code}
                </span>
                <div className="flex items-center gap-4">
                  {pipelineSteps[activePipelineStep].brands.map((b) => (
                    <BrandLogo key={b} brand={b} size="sm" />
                  ))}
                </div>
              </div>

              <h4 className="mt-3 text-2xl font-bold text-[#F1F5F9]">
                {pipelineSteps[activePipelineStep].title}
              </h4>

              <p className="mt-3 text-base leading-relaxed text-[#94A3B8]">
                {pipelineSteps[activePipelineStep].description}
              </p>

              <ul className="mt-6 grid gap-2.5 border-t border-white/10 pt-5 font-mono text-xs text-[#F1F5F9]/85 sm:grid-cols-2">
                {pipelineSteps[activePipelineStep].sources.map((src) => (
                  <li key={src} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00D9F5]" />
                    <span>{src}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
