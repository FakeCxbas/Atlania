"use client";

import React from "react";
import { ScientificIcon, type ScientificConcept } from "./ScientificIcon";
import { BrandLogo, type BrandId } from "./BrandLogo";

export interface TerrainLayersProps {
  /** Scroll-driven separation factor [0..1] */
  layerSeparation: number;
  /** Currently focused layer (0 = all, 1 = surface, 2 = relief, 3 = geology, 4 = subsurface) */
  focusedLayer: 0 | 1 | 2 | 3 | 4;
  onSelectLayer: (layer: 0 | 1 | 2 | 3 | 4) => void;
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
    natureBadge: "NASA POWER",
    accentColor: "#38BDF8",
    summary:
      "Mide temperatura a 2 m, precipitación, viento, humedad, irradiancia solar y presión superficial para caracterizar el microclima.",
    detail: "",
  },
  {
    id: 2,
    number: "02",
    title: "Relieve y Topografía",
    concept: "topography",
    natureBadge: "Copernicus DEM",
    accentColor: "#00D9F5",
    summary:
      "Evalúa pendiente media y rugosidad del terreno a 90 m de resolución para estimar la navegabilidad de rovers y sitios de aterrizaje.",
    detail: "",
  },
  {
    id: 3,
    number: "03",
    title: "Geología y Litología",
    concept: "geology",
    natureBadge: "Litología",
    accentColor: "#F5B82E",
    summary:
      "Compara basalto, regolito, sedimentos, evaporitas e impacto frente a firmas orbitales de la Luna y Marte.",
    detail: "",
  },
  {
    id: 4,
    number: "04",
    title: "Subsuelo y Tubos de Lava",
    concept: "subsurface",
    natureBadge: "Subsuelo",
    accentColor: "#E07A5F",
    summary:
      "Analiza el potencial de refugio en conductos basálticos subterráneos, criósfera e hielo para perforación e ISRU.",
    detail: "",
  },
];

/**
 * Chapter 3 component: Pairs a pinned/sticky full-viewport 3D terrain descent
 * (where the right side of the screen leaves the Three.js 4-layer volumetric terrain block
 * completely unobstructed as it separates with scroll) with minimalist accordion
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
      : layerSeparation < 0.52
      ? 2
      : layerSeparation < 0.76
      ? 3
      : 4;

  const activeStratumId =
    focusedLayer === 0 ? scrollActiveStratum : focusedLayer;

  return (
    <div>
      {/* Pinned / Sticky 3D Stratification Track (240vh) */}
      <div id="terrain-3d-track" className="relative h-[240vh]">
        <div className="sticky top-0 flex h-screen w-full items-center overflow-hidden px-6 sm:px-12 lg:px-16">
          <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-12">
            {/* Left 6 Cols: Minimalist Title + Clean Accordion */}
            <div className="lg:col-span-6">
              <p className="font-mono text-xs tracking-[0.22em] text-[#00D9F5] uppercase">
                03 · Capas del terreno
              </p>

              <h2
                id="capas-del-terreno-heading"
                className="mt-5 text-3xl font-bold tracking-tight text-[#F8FAFC] sm:text-5xl sm:leading-[1.08]"
              >
                Anatomía tridimensional de un análogo.
              </h2>

              {/* Minimalist Accordion List of the 4 Strata */}
              <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
                {STRATA.map((s) => {
                  const isCurrent = activeStratumId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-expanded={isCurrent}
                      onClick={() =>
                        onSelectLayer(focusedLayer === s.id ? 0 : s.id)
                      }
                      className="group w-full py-4 text-left transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <span
                            className="inline-flex items-center gap-2 font-mono text-xs font-semibold tabular-nums transition-colors"
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
                            className={`text-base font-medium tracking-tight transition-colors sm:text-lg ${
                              isCurrent
                                ? "text-[#F8FAFC]"
                                : "text-[#94A3B8] group-hover:text-[#F8FAFC]"
                            }`}
                          >
                            {s.title}
                          </span>
                        </div>

                        <span
                          aria-hidden="true"
                          className="font-mono text-sm text-[#64748B] transition-colors group-hover:text-[#F8FAFC]"
                        >
                          {isCurrent ? "−" : "+"}
                        </span>
                      </div>

                      {isCurrent && (
                        <p className="mt-2.5 pl-10 text-sm leading-relaxed text-slate-300">
                          {s.summary}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>

              {focusedLayer !== 0 && (
                <button
                  type="button"
                  onClick={() => onSelectLayer(0)}
                  className="mt-5 font-mono text-xs text-[#00D9F5] underline-offset-4 hover:underline"
                >
                  Restablecer vista automática
                </button>
              )}
            </div>

            {/* Right 6 Cols: Clean Unobstructed Viewport Window for the Three.js 3D Terrain Strata */}
            <div className="hidden lg:col-span-6 lg:block" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Editorial 4-Stage Pipeline Section (Nuestra Solución) */}
      <div
        id="nuestra-solucion"
        className="mx-auto max-w-7xl px-6 py-24 sm:px-12 lg:px-16"
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
