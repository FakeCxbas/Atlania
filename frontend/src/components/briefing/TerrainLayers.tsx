"use client";

import React from "react";
import { ScientificIcon, type ScientificConcept } from "./ScientificIcon";
import { BrandLogo, type BrandId } from "./BrandLogo";

export interface TerrainLayersProps {
  /** Scroll-driven separation factor [0..1] */
  layerSeparation: number;
  /** Currently focused layer (0 = all, 1 = topography, 2 = geology, 3 = subsurface) */
  focusedLayer: 0 | 1 | 2 | 3;
  onSelectLayer: (layer: 0 | 1 | 2 | 3) => void;
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
  id: 1 | 2 | 3;
  code: string;
  title: string;
  concept: ScientificConcept;
  accentColor: string;
  borderClass: string;
  measuredVsPrior: string;
  description: string;
  realParameters: string[];
}

const STRATA: StratumSpec[] = [
  {
    id: 1,
    code: "ESTRATO ESQUEMÁTICO 01 // SUPERFICIE",
    title: "Topografía, Pendiente y Rugosidad DEM",
    concept: "topography",
    accentColor: "#00D9F5",
    borderClass: "border-[#00D9F5]/45",
    measuredVsPrior:
      "Telemetría satelital medida (Copernicus DEM GLO-90) + clima a 2 m (NASA POWER)",
    description:
      "En la capa superficial, TERR-ANALOG muestrea 5 puntos cardinales (centro ± 0.01° N, S, E, O) para estimar la pendiente media y la desviación estándar de elevación (rugosidad), junto con los 7 parámetros atmosféricos de NASA POWER.",
    realParameters: [
      "Gradiente central de 5 puntos: dem_slope_deg y dem_roughness_m",
      "Climatología NASA POWER: T2M_MAX, T2M_MIN, PRECTOTCORR, WS10M, RH2M, ALLSKY_SFC_SW_DWN, PS",
      "Índice continuo de aridez superficial: Dryness = 1 / (1 + PRECTOTCORR)",
    ],
  },
  {
    id: 2,
    code: "ESTRATO ESQUEMÁTICO 02 // CORTEZA",
    title: "Geología y Membresía Litológica",
    concept: "geology",
    accentColor: "#F5B82E",
    borderClass: "border-[#F5B82E]/45",
    measuredVsPrior:
      "Supuestos de escenario documentados (priors litológicos en [0, 1])",
    description:
      "Representa la composición mineralógica y litológica del terreno mediante un vector de 5 clases evaluado con la superposición difusa de Jaccard (Σ min / Σ max) frente a las observaciones orbitales de MRO CRISM y LRO.",
    realParameters: [
      "5 clases litológicas: basalto, regolito/tefra, sedimentario, evaporitas/sales e impacto",
      "Similitud geológica difusa: Σ min(earth_g, target_g) / Σ max(earth_g, target_g)",
      "Contraste con mineralogía PDS (filosilicatos, carbonatos, sulfatos, anortosita)",
    ],
  },
  {
    id: 3,
    code: "ESTRATO ESQUEMÁTICO 03 // SUBSUELO",
    title: "Subsuelo, Criósfera y Tubos de Lava",
    concept: "subsurface",
    accentColor: "#E07A5F",
    borderClass: "border-[#E07A5F]/45",
    measuredVsPrior:
      "Prior operativo de escenario (relevancia de cavidades y permafrost)",
    description:
      "Modela el potencial de abrigo subterráneo frente a radiación y micrometeoritos (tubos de lava basálticos y fosas de colapso) así como la presencia de hielo/permafrost para pruebas de perforación e ISRU.",
    realParameters: [
      "Dimensión subterránea: 70% relevancia de tubos de lava + 30% potencial de refugio",
      "Dimensión hidrológica/criosférica: 40% aridez + 40% hielo/permafrost + 20% historia acuosa",
      "Advertencia explícita: el modelo no realiza tomografía sísmica ni radar de penetración (GPR) en vivo",
    ],
  },
];

/**
 * Renders the Chapter 3 scroll-synchronized 3D schematic terrain stratification
 * alongside the 4-stage TERR-ANALOG data pipeline.
 */
export function TerrainLayers({
  layerSeparation,
  focusedLayer,
  onSelectLayer,
  activePipelineStep,
  onSelectPipelineStep,
  pipelineSteps,
}: TerrainLayersProps) {
  // Compute pixel separation offset from scroll progress [0..1] -> [14px .. 68px]
  const separationPx = Math.round(16 + Math.max(0, Math.min(1, layerSeparation)) * 52);

  return (
    <div className="space-y-16">
      {/* Explicit Scientific Disclaimer Banner for Schematic 3D Layers */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800/90 bg-[#0A1624]/85 px-5 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#00D9F5]/40 bg-[#050B13] text-[#00D9F5]">
            <ScientificIcon concept="stratigraphy" className="h-4 w-4" />
          </span>
          <p className="text-xs leading-relaxed text-[#F1F5F9]">
            <strong className="font-mono uppercase tracking-wider text-[#00D9F5]">
              Nota de rigor científico:
            </strong>{" "}
            Las mallas tridimensionales separadas por el scroll son{" "}
            <strong className="text-[#F5B82E]">
              representaciones esquemáticas e ilustrativas
            </strong>{" "}
            de cómo el modelo descompone un sitio en capas de evaluación; no representan
            tomografía del subsuelo ni mediciones geofísicas in situ no contenidas en el
            catálogo.
          </p>
        </div>
        <span className="font-mono text-[11px] text-[#94A3B8] tabular-nums">
          SEPARACIÓN SCROLL: {Math.round(layerSeparation * 100)}%
        </span>
      </div>

      {/* Main Split: Left Isometric 3D Synchronized Stack + Right Interactive Stratum Inspector */}
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
        {/* Left 5 Cols: Scroll-Synchronized Isometric 3-Layer Stack */}
        <div className="relative flex flex-col items-center justify-center rounded-3xl border border-slate-800/80 bg-[#0A1624]/70 p-6 backdrop-blur-md sm:p-10 lg:col-span-5">
          <div className="mb-4 flex w-full items-center justify-between font-mono text-[11px] text-[#94A3B8]">
            <span>DESCOMPOSICIÓN ESQUEMÁTICA 3D</span>
            <button
              type="button"
              onClick={() => onSelectLayer(0)}
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
                focusedLayer === 0
                  ? "border-[#00D9F5] bg-[#00D9F5]/15 text-[#00D9F5]"
                  : "border-slate-700 text-[#94A3B8] hover:text-[#F1F5F9]"
              }`}
            >
              Ver las 3 capas
            </button>
          </div>

          {/* 3D Isometric Stacked SVG Planes driven by separationPx */}
          <div
            className="relative flex h-[340px] w-full items-center justify-center"
            aria-label="Diagrama tridimensional esquemático de las tres capas del terreno"
          >
            {/* Vertical alignment axis line */}
            <div
              className="pointer-events-none absolute h-[260px] w-px border-l border-dashed border-[#00D9F5]/35"
              aria-hidden="true"
            />

            {/* Layer 1: Topography (Moves UP with scroll separation) */}
            <button
              type="button"
              onClick={() => onSelectLayer(focusedLayer === 1 ? 0 : 1)}
              style={{
                transform: `translate3d(0, -${separationPx}px, 0)`,
              }}
              aria-pressed={focusedLayer === 1}
              className={`group absolute w-[270px] transition-all duration-300 sm:w-[300px] ${
                focusedLayer === 0 || focusedLayer === 1 ? "opacity-100" : "opacity-35"
              }`}
            >
              <svg viewBox="0 0 320 130" className="w-full drop-shadow-[0_14px_24px_rgba(0,217,245,0.18)]">
                <polygon
                  points="160,12 304,64 160,116 16,64"
                  fill="rgba(0, 217, 245, 0.14)"
                  stroke="#00D9F5"
                  strokeWidth="2"
                />
                {/* Schematic contour lines */}
                <polyline
                  points="64,64 160,30 256,64 160,98 64,64"
                  fill="none"
                  stroke="#00D9F5"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                />
                <polyline
                  points="106,64 160,44 214,64 160,84 106,64"
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="1.1"
                />
                <text
                  x="160"
                  y="68"
                  textAnchor="middle"
                  fill="#F1F5F9"
                  className="font-mono text-[11px] font-bold"
                >
                  01 · TOPOGRAFÍA Y CLIMA (DEM / POWER)
                </text>
              </svg>
            </button>

            {/* Layer 2: Geology (Center reference plane) */}
            <button
              type="button"
              onClick={() => onSelectLayer(focusedLayer === 2 ? 0 : 2)}
              style={{
                transform: "translate3d(0, 0px, 0)",
              }}
              aria-pressed={focusedLayer === 2}
              className={`group absolute w-[270px] transition-all duration-300 sm:w-[300px] ${
                focusedLayer === 0 || focusedLayer === 2 ? "opacity-100" : "opacity-35"
              }`}
            >
              <svg viewBox="0 0 320 130" className="w-full drop-shadow-[0_14px_24px_rgba(245,184,46,0.15)]">
                <polygon
                  points="160,12 304,64 160,116 16,64"
                  fill="rgba(245, 184, 46, 0.14)"
                  stroke="#F5B82E"
                  strokeWidth="2"
                />
                <line
                  x1="88"
                  y1="38"
                  x2="232"
                  y2="90"
                  stroke="#F5B82E"
                  strokeWidth="1.1"
                  strokeDasharray="3 3"
                />
                <line
                  x1="232"
                  y1="38"
                  x2="88"
                  y2="90"
                  stroke="#F5B82E"
                  strokeWidth="1.1"
                  strokeDasharray="3 3"
                />
                <text
                  x="160"
                  y="68"
                  textAnchor="middle"
                  fill="#F1F5F9"
                  className="font-mono text-[11px] font-bold"
                >
                  02 · GEOLOGÍA Y LITOLOGÍA (PRIORS)
                </text>
              </svg>
            </button>

            {/* Layer 3: Subsurface (Moves DOWN with scroll separation) */}
            <button
              type="button"
              onClick={() => onSelectLayer(focusedLayer === 3 ? 0 : 3)}
              style={{
                transform: `translate3d(0, ${separationPx}px, 0)`,
              }}
              aria-pressed={focusedLayer === 3}
              className={`group absolute w-[270px] transition-all duration-300 sm:w-[300px] ${
                focusedLayer === 0 || focusedLayer === 3 ? "opacity-100" : "opacity-35"
              }`}
            >
              <svg viewBox="0 0 320 130" className="w-full drop-shadow-[0_14px_24px_rgba(224,122,95,0.18)]">
                <polygon
                  points="160,12 304,64 160,116 16,64"
                  fill="rgba(224, 122, 95, 0.15)"
                  stroke="#E07A5F"
                  strokeWidth="2"
                />
                <ellipse
                  cx="160"
                  cy="64"
                  rx="62"
                  ry="20"
                  fill="none"
                  stroke="#E07A5F"
                  strokeWidth="1.3"
                  strokeDasharray="5 3"
                />
                <text
                  x="160"
                  y="68"
                  textAnchor="middle"
                  fill="#F1F5F9"
                  className="font-mono text-[11px] font-bold"
                >
                  03 · SUBSUELO, HIELO Y TUBOS DE LAVA
                </text>
              </svg>
            </button>
          </div>

          <p className="mt-2 text-center font-mono text-[11px] text-[#94A3B8]">
            Haz clic en cualquier estrato para aislar su modelo en la escena 3D o continúa
            desplazándote para separarlos.
          </p>
        </div>

        {/* Right 7 Cols: Detailed Scientific Stratum Cards */}
        <div className="space-y-4 lg:col-span-7">
          {STRATA.map((stratum) => {
            const isHighlighted =
              focusedLayer === 0 || focusedLayer === stratum.id;
            return (
              <article
                key={stratum.id}
                onClick={() =>
                  onSelectLayer(focusedLayer === stratum.id ? 0 : stratum.id)
                }
                className={`cursor-pointer rounded-2xl border p-6 transition-all ${
                  focusedLayer === stratum.id
                    ? `${stratum.borderClass} bg-[#101F30]/95 shadow-lg`
                    : isHighlighted
                    ? "border-slate-800/90 bg-[#0A1624]/85 hover:border-slate-700"
                    : "border-slate-800/50 bg-[#0A1624]/45 opacity-60 hover:opacity-90"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-[#050B13]"
                      style={{ color: stratum.accentColor }}
                    >
                      <ScientificIcon concept={stratum.concept} className="h-5 w-5" />
                    </span>
                    <div>
                      <span
                        className="block font-mono text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: stratum.accentColor }}
                      >
                        {stratum.code}
                      </span>
                      <h3 className="text-lg font-bold text-[#F1F5F9]">
                        {stratum.title}
                      </h3>
                    </div>
                  </div>

                  <span className="rounded-full border border-slate-800 bg-[#050B13]/90 px-3 py-1 font-mono text-[10px] text-[#94A3B8]">
                    {stratum.measuredVsPrior}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-[#F1F5F9]/90">
                  {stratum.description}
                </p>

                <ul className="mt-3 grid gap-1.5 border-t border-slate-800/80 pt-3 font-mono text-xs text-[#94A3B8]">
                  {stratum.realParameters.map((param) => (
                    <li key={param} className="flex items-start gap-2">
                      <span
                        className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: stratum.accentColor }}
                      />
                      <span>{param}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>

      {/* 4-Stage Real Data Pipeline Diagram (Section 6 — De los datos terrestres a la exploración planetaria) */}
      <div id="nuestra-solucion" className="pt-8">
        <div className="max-w-3xl">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#00D9F5]">
             FLUJO REAL DEL MOTOR // DE LOS DATOS TERRESTRES A LA EXPLORACIÓN PLANETARIA
          </span>
          <h3 className="mt-2 text-2xl font-bold text-[#F1F5F9] sm:text-3xl">
            De los datos terrestres a la exploración planetaria.
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
            Cada estrato alimenta nuestra tubería científica reproducible de cuatro etapas
            con fuentes e implementaciones verificadas en el repositorio.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pipelineSteps.map((item, idx) => {
            const active = activePipelineStep === idx;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => onSelectPipelineStep(idx)}
                aria-pressed={active}
                className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition-all ${
                  active
                    ? "border-[#00D9F5] bg-[#101F30]/95"
                    : "border-slate-800/90 bg-[#0A1624]/85 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-[#00D9F5]">{item.code}</span>
                    <span className="text-[#F5B82E]">0{idx + 1}</span>
                  </div>
                  <h4 className="mt-3 text-base font-bold text-[#F1F5F9]">
                    {item.step}
                  </h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#94A3B8]">
                    {item.title}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-3">
                  {item.brands.map((b) => (
                    <BrandLogo key={b} brand={b} size="sm" showLabel={false} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Stage Detail */}
        <div className="mt-5 rounded-2xl border border-slate-800/90 bg-[#101F30]/90 p-6 backdrop-blur-md">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs font-bold uppercase text-[#F5B82E]">
                  {pipelineSteps[activePipelineStep].step}
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  {pipelineSteps[activePipelineStep].brands.map((b) => (
                    <BrandLogo key={b} brand={b} size="sm" />
                  ))}
                </div>
              </div>
              <h4 className="mt-2 text-xl font-bold text-[#F1F5F9]">
                {pipelineSteps[activePipelineStep].title}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-[#F1F5F9]/90">
                {pipelineSteps[activePipelineStep].description}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#050B13]/85 p-4 lg:col-span-5">
              <span className="font-mono text-xs font-bold uppercase text-[#00D9F5]">
                Implementación real verificada:
              </span>
              <ul className="mt-2.5 space-y-1.5 font-mono text-xs text-[#94A3B8]">
                {pipelineSteps[activePipelineStep].sources.map((src) => (
                  <li key={src} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#00D9F5]" />
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
