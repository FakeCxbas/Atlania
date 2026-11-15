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
    title: "Superficie y Atmósfera",
    concept: "thermal",
    natureBadge: "NASA POWER · Clima",
    accentColor: "#7CA5B8",
    summary:
      "Temperatura, lluvia, viento, humedad e irradiancia solar satelital.",
    detail: "Frontera atmosférica 3D + datos climáticos reales.",
  },
  {
    id: 2,
    number: "02",
    title: "Relieve y Topografía",
    concept: "topography",
    natureBadge: "Copernicus DEM 90 m",
    accentColor: "#7CA5B8",
    summary: "Pendiente media y rugosidad superficial medidas en 5 puntos.",
    detail: "Malla 3D ilustrativa para movilidad de rovers.",
  },
  {
    id: 3,
    number: "03",
    title: "Geología y Litología",
    concept: "geology",
    natureBadge: "Litología · MRO CRISM",
    accentColor: "#C5A36D",
    summary: "Afinidad de basalto, regolito, sedimentos, sales e impacto.",
    detail: "Corteza rocosa frente a firmas orbitales lunares y marcianas.",
  },
  {
    id: 4,
    number: "04",
    title: "Subsuelo y Tubos de Lava",
    concept: "subsurface",
    natureBadge: "Subsuelo · Prior 3D",
    accentColor: "#E07A5F",
    summary: "Potencial de refugio volcánico e hielo para perforación e ISRU.",
    detail: "Representación esquemática (sin radar GPR en vivo).",
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
              <div className="flex items-center gap-3 font-mono text-xs tracking-[0.2em] text-[#7CA5B8] uppercase">
                <span>03 // Capas del Terreno</span>
                <span className="h-px w-8 bg-[#7CA5B8]/50" />
                <span className="text-[#A3A1BD] tabular-nums">
                  Separación 3D: {sepPct}%
                </span>
              </div>

              <h2
                id="capas-del-terreno-heading"
                className="mt-4 text-3xl font-bold tracking-tight text-[#E4DFD5] sm:text-5xl sm:leading-[1.08]"
              >
                Anatomía tridimensional de un análogo.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#A3A1BD] sm:text-base">
                Desplaza para separar los{" "}
                <strong className="font-normal text-[#C5A36D]">
                  4 estratos
                </strong>{" "}
                que conectan la telemetría satelital con el terreno real.
              </p>

              {/* Editorial Hairline List of the 4 Strata (No boxy cards) */}
              <div className="mt-8 divide-y divide-[#55527D]/30 border-y border-[#55527D]/30">
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
                              color: isCurrent ? s.accentColor : "#A3A1BD",
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
                                ? "text-[#E4DFD5]"
                                : "text-[#A3A1BD] group-hover:text-[#E4DFD5]"
                            }`}
                          >
                            {s.title}
                          </span>
                        </div>

                        <span className="font-mono text-xs font-semibold tracking-wider text-[#A3A1BD] uppercase">
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
                          <div className="mt-2 pl-7 text-sm leading-relaxed text-[#E4DFD5]">
                            <p className="font-medium text-[#E4DFD5]">{s.summary}</p>
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
              <div className="flex items-center justify-between border-t border-[#55527D]/30 pt-3 font-mono text-[11px] text-[#A3A1BD]">
                <span className="text-[#7CA5B8]">
                  MODELO 3D ESQUEMÁTICO · RELIEVE Y SOMBRAS EN VIVO
                </span>
                {focusedLayer !== -1 ? (
                  <button
                    type="button"
                    onClick={() => onSelectLayer(-1)}
                    className="pointer-events-auto text-[#E4DFD5] underline decoration-[#7CA5B8] underline-offset-4 hover:text-[#7CA5B8]"
                  >
                    Ver las 4 capas simultáneamente
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectLayer(0)}
                    className="pointer-events-auto text-[#7CA5B8] underline decoration-[#7CA5B8] underline-offset-4 hover:text-[#E4DFD5]"
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
        <div className="grid gap-12 border-t border-[#55527D]/30 pt-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="font-mono text-xs tracking-[0.2em] text-[#7CA5B8] uppercase">
              Arquitectura de Solución // 4 Etapas
            </span>
            <h3 className="mt-3 text-3xl font-bold tracking-tight text-[#E4DFD5] sm:text-4xl">
              De la Tierra a la Luna y Marte.
            </h3>
            <p className="mt-4 text-base leading-relaxed text-[#E4DFD5]">
              Cada estrato alimenta el índice ASI y el explorador 3D.
            </p>

            {/* Official Source & Tech Logos */}
            <div className="mt-8 flex flex-wrap items-center gap-5 border-t border-[#55527D]/30 pt-6">
              <BrandLogo brand="nasa-power" size="sm" />
              <BrandLogo brand="copernicus" size="sm" />
              <BrandLogo brand="nasa-pds" size="sm" />
              <BrandLogo brand="python" size="sm" />
            </div>
          </div>

          <div className="lg:col-span-7">
            {/* Clean 4-Step Tabs */}
            <div className="flex flex-wrap gap-6 border-b border-[#55527D]/30 pb-4">
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
                        ? "border-b-2 border-[#C5A36D] bg-[#27233E] font-bold text-[#C5A36D]"
                        : "text-[#A3A1BD] hover:text-[#E4DFD5]"
                    }`}
                  >
                    {item.step}
                  </button>
                );
              })}
            </div>

            <div className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="font-mono text-xs uppercase tracking-widest text-[#C5A36D]">
                  {pipelineSteps[activePipelineStep].code}
                </span>
                <div className="flex items-center gap-4">
                  {pipelineSteps[activePipelineStep].brands.map((b) => (
                    <BrandLogo key={b} brand={b} size="sm" />
                  ))}
                </div>
              </div>

              <h4 className="mt-3 text-2xl font-bold text-[#E4DFD5]">
                {pipelineSteps[activePipelineStep].title}
              </h4>

              <p className="mt-3 text-base leading-relaxed text-[#A3A1BD]">
                {pipelineSteps[activePipelineStep].description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-[#55527D]/30 pt-4 font-mono text-xs text-[#E4DFD5]/90">
                {pipelineSteps[activePipelineStep].sources.map((src) => (
                  <span
                    key={src}
                    className="rounded-full border border-[#55527D]/35 bg-[#181B2C]/85 px-3 py-1"
                  >
                    {src}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
