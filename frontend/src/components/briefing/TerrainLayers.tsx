"use client";

import React from "react";
import { ScientificIcon, type ScientificConcept } from "./ScientificIcon";
import { type BrandId } from "./BrandLogo";
import { DetailModal } from "./DetailModal";

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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[115vh] left-0 h-screen w-full snap-start snap-always"
        />
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
            </div>

            {/* Right 6 Cols: Clean Unobstructed Viewport Window for the Three.js 3D Terrain Strata */}
            <div className="hidden lg:col-span-6 lg:block" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Editorial 4-Stage Pipeline Section (Nuestra Solución) */}
      <div
        id="nuestra-solucion"
        className="mx-auto max-w-7xl snap-start snap-always px-6 py-24 sm:px-12 lg:px-16"
      >
        <div className="grid items-start gap-12 border-t border-white/10 pt-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="font-mono text-xs tracking-[0.22em] text-[#00D9F5] uppercase">
              Arquitectura de Solución
            </span>
            <h3 className="mt-4 text-3xl font-bold tracking-tight text-[#F8FAFC] sm:text-4xl sm:leading-[1.12]">
              De los datos terrestres a la exploración planetaria.
            </h3>
            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-300">
              Cada estrato físico del terreno alimenta el modelo analógico ASI
              y la estación interactiva del explorador planetario.
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {pipelineSteps.map((item, idx) => {
                const isActive = activePipelineStep === idx;
                const stageConcepts: ScientificConcept[] = [
                  "thermal",
                  "topography",
                  "geology",
                  "subsurface",
                ];
                const stageLabels = [
                  "01 · Recopilar",
                  "02 · Analizar",
                  "03 · Comparar",
                  "04 · Explorar",
                ];
                const label = stageLabels[idx] ?? item.step;
                const concept = stageConcepts[idx] ?? "thermal";

                return (
                  <button
                    key={item.step}
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={isActive}
                    onClick={() => onSelectPipelineStep(idx)}
                    className={`group flex w-full cursor-pointer flex-col justify-between rounded-xl border bg-[#060d18]/85 p-5 text-left backdrop-blur-md transition-all duration-300 ${
                      isActive
                        ? "border-[#00D9F5]/45 shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
                        : "border-white/10 hover:border-white/25"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-medium tracking-wider text-[#00D9F5] uppercase">
                          {label}
                        </span>
                        <ScientificIcon
                          concept={concept}
                          className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-slate-200"
                        />
                      </div>

                      <h4 className="mt-3 text-base font-semibold leading-snug text-[#F8FAFC] sm:text-lg">
                        {item.title}
                      </h4>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 font-mono text-xs text-[#00D9F5]">
                      <span>Ver detalles</span>
                      <span
                        aria-hidden="true"
                        className="text-sm leading-none transition-transform duration-300 group-hover:translate-x-0.5"
                      >
                        +
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <DetailModal
              isOpen={
                activePipelineStep >= 0 &&
                Boolean(pipelineSteps[activePipelineStep])
              }
              onClose={() => onSelectPipelineStep(-1)}
              eyebrow={
                activePipelineStep >= 0 && pipelineSteps[activePipelineStep]
                  ? (
                      [
                        "01 · Recopilar",
                        "02 · Analizar",
                        "03 · Comparar",
                        "04 · Explorar",
                      ][activePipelineStep] ??
                      pipelineSteps[activePipelineStep].step
                    )
                  : ""
              }
              title={
                activePipelineStep >= 0 && pipelineSteps[activePipelineStep]
                  ? pipelineSteps[activePipelineStep].title
                  : ""
              }
              icon={
                activePipelineStep >= 0 && pipelineSteps[activePipelineStep] ? (
                  <ScientificIcon
                    concept={
                      (
                        [
                          "thermal",
                          "topography",
                          "geology",
                          "subsurface",
                        ] as ScientificConcept[]
                      )[activePipelineStep] ?? "thermal"
                    }
                    className="h-4 w-4 shrink-0 text-[#00D9F5]"
                  />
                ) : null
              }
            >
              {activePipelineStep >= 0 && pipelineSteps[activePipelineStep] && (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-slate-200 sm:text-base">
                    {pipelineSteps[activePipelineStep].description}
                  </p>
                  <ul className="space-y-2 border-t border-white/10 pt-4 font-mono text-xs leading-relaxed text-slate-200/90">
                    {pipelineSteps[activePipelineStep].sources.map((src) => (
                      <li key={src} className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00D9F5]" />
                        <span>{src}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </DetailModal>
          </div>
        </div>
      </div>
    </div>
  );
}
