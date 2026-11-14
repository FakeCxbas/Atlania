"use client";

import type { AnalogSite, TargetProfile, DimensionScores } from "@/types/analog";
import {
  ExternalLink,
  Layers,
  Thermometer,
  Droplets,
  Mountain,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Globe2,
  Moon,
  Orbit,
} from "lucide-react";

interface SideBySideComparisonProps {
  site: AnalogSite;
  target: TargetProfile;
  activeScore: {
    dimensions: DimensionScores;
    overall_asi: number;
    weights: DimensionScores;
    analogy_strengths: string[];
    analogy_breakdowns: Record<string, string>;
  };
  references: Record<string, TargetProfile>;
  onSelectTarget: (targetId: string) => void;
}

const ASI_DIMENSION_CONFIG: {
  key: keyof DimensionScores;
  label: string;
  desc: string;
}[] = [
  {
    key: "topography",
    label: "Topografía y Pendientes",
    desc: "Similitud en inclinación de laderas y rugosidad superficial",
  },
  {
    key: "geology",
    label: "Geología y Mineralogía",
    desc: "Composición de basaltos, regolito, sedimentos y evaporitas",
  },
  {
    key: "thermal",
    label: "Régimen Térmico",
    desc: "Afinidad en temperatura media y rango térmico anual/diurno",
  },
  {
    key: "hydrology_ice",
    label: "Sequedad y Potencial de Hielo",
    desc: "Hiperaridez, permafrost o historia acuosa pasada",
  },
  {
    key: "subsurface_ops",
    label: "Operaciones Subterráneas y Refugio",
    desc: "Aptitud de tubos de lava y protección contra radiación",
  },
];

export function SideBySideComparison({
  site,
  target,
  activeScore,
  references,
  onSelectTarget,
}: SideBySideComparisonProps) {
  const isMars = target.body === "Mars";
  const targetAccent = isMars ? "text-[#E07A5F]" : "text-cyan-400";
  const targetBorder = isMars ? "border-[#E07A5F]/40" : "border-cyan-400/40";
  const targetBg = isMars ? "bg-[#E07A5F]/10" : "bg-cyan-400/10";
  const targetBar = isMars ? "bg-[#E07A5F]" : "bg-cyan-400";

  // Environmental metric computations
  const earthMeanTemp = (site.climatology.tmax_c + site.climatology.tmin_c) / 2;
  const earthTempSwing = site.climatology.tmax_c - site.climatology.tmin_c;
  const targetMeanTemp = target.temperature_mean_c;
  const targetTempSwing = target.temperature_range_c;

  const earthDryness = 1 / (1 + site.climatology.precipitation_mm_day);
  const targetDryness = target.dryness;

  const earthSlope = site.terrain.slope_deg;
  const targetSlope = target.terrain?.slope_deg ?? (isMars ? 8 : 20);

  const earthRoughness = site.terrain.roughness;
  const targetRoughness = target.terrain?.roughness ?? 0.85;

  const earthIce = site.terrain.ice;
  const targetIce = target.terrain?.ice ?? (target.body === "Moon" ? 0.95 : 0.1);

  // Gravity constants
  const earthGravity = 9.81; // m/s^2
  const targetGravity = target.body === "Moon" ? 1.62 : 3.71; // m/s^2
  const targetGravityRatio = Math.round((targetGravity / earthGravity) * 100);

  // Atmospheric pressure constants
  const earthPressure = "101.3 kPa (1.0 atm)";
  const earthAtmosphere = "78% N₂ / 21% O₂ (Respirable)";
  const targetPressure =
    target.body === "Moon" ? "≈ 0 kPa (Vacío duro)" : "≈ 0.64 kPa (0.6% atm)";
  const targetAtmosphere =
    target.body === "Moon"
      ? "Exosfera tenue / Radiación directa"
      : "95% CO₂ (Híper-tenue, no respirable)";

  return (
    <div className="space-y-6 text-slate-100">
      {/* Target Selector Bar */}
      <div className="rounded-xl border border-[#D4AF37]/30 bg-[#060913]/80 p-3.5 shadow-inner">
        <label
          htmlFor="side-by-side-target-select"
          className="mb-2 block text-xs font-semibold tracking-wider text-[#D4AF37] uppercase"
        >
          Objetivo Extraterrestre de Comparación
        </label>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {Object.entries(references).map(([tId, ref]) => {
            const isSelected = tId === target.id;
            const refIsMars = ref.body === "Mars";
            const score = site.scores[tId]?.overall_asi ?? 0;

            return (
              <button
                key={tId}
                type="button"
                onClick={() => onSelectTarget(tId)}
                aria-pressed={isSelected}
                className={`flex flex-col items-start rounded-lg border p-2 text-left transition-all ${
                  isSelected
                    ? "border-[#D4AF37] bg-[#D4AF37]/15 shadow-[0_0_12px_rgba(212,175,55,0.25)]"
                    : "border-slate-800 bg-[#0D1424]/70 hover:border-slate-700 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex w-full items-center justify-between text-[11px]">
                  <span
                    className={`font-semibold ${
                      refIsMars ? "text-[#E07A5F]" : "text-cyan-400"
                    }`}
                  >
                    {ref.body}
                  </span>
                  <span className="font-mono font-bold tabular-nums text-slate-200">
                    {score.toFixed(1)}%
                  </span>
                </div>
                <span className="mt-1 line-clamp-1 text-xs font-medium text-slate-200">
                  {ref.name.split("/")[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Target summary notice */}
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-slate-800/90 bg-[#0D1424]/80 p-2.5 text-xs text-slate-300">
          <div className="mt-0.5 shrink-0">
            {target.body === "Moon" ? (
              <Moon className="h-4 w-4 text-cyan-400" aria-hidden="true" />
            ) : (
              <Orbit className="h-4 w-4 text-[#E07A5F]" aria-hidden="true" />
            )}
          </div>
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold text-slate-100">{target.name}</span>:{" "}
            {target.context}
          </div>
          <a
            href={target.source_url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#D4AF37] hover:underline"
            title="Abrir referencia oficial NASA"
          >
            NASA Docs
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* 4 Environmental Gaps (Side by Side) */}
      <section aria-labelledby="gaps-heading" className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-2">
          <h3
            id="gaps-heading"
            className="flex items-center gap-2 text-sm font-bold tracking-wide text-slate-100 uppercase"
          >
            <Gauge className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
            Brechas Ambientales: Tierra vs. {target.body}
          </h3>
          <span className="text-xs font-medium text-slate-400">
            Similitud ASI:{" "}
            <span className="font-mono font-bold tabular-nums text-[#D4AF37]">
              {activeScore.overall_asi.toFixed(1)}%
            </span>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* 1. Thermal Regime Gap */}
          <div className="rounded-xl border border-slate-800/90 bg-[#060913]/60 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Thermometer className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                1. Régimen Térmico y Amplitud
              </span>
              <span className="font-mono font-semibold tabular-nums text-slate-300">
                ASI: {activeScore.dimensions.thermal.toFixed(1)} / 100
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              {/* Earth Side */}
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-2.5">
                <div className="flex items-center gap-1 font-medium text-cyan-300">
                  <Globe2 className="h-3.5 w-3.5" aria-hidden="true" /> Tierra (Sitio)
                </div>
                <div className="mt-1.5 space-y-1 font-mono tabular-nums text-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Media:</span>
                    <span className="font-semibold">{earthMeanTemp.toFixed(1)}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rango (Min/Max):</span>
                    <span>
                      {site.climatology.tmin_c.toFixed(1)}° a {site.climatology.tmax_c.toFixed(1)}°
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amplitud ΔT:</span>
                    <span className="text-cyan-300">{earthTempSwing.toFixed(1)}°C</span>
                  </div>
                </div>
              </div>

              {/* Target Side */}
              <div className={`rounded-lg border ${targetBorder} ${targetBg} p-2.5`}>
                <div className={`flex items-center gap-1 font-medium ${targetAccent}`}>
                  {target.body === "Moon" ? (
                    <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Orbit className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {target.body} ({target.name.split("/")[0]})
                </div>
                <div className="mt-1.5 space-y-1 font-mono tabular-nums text-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Media:</span>
                    <span className="font-semibold">{targetMeanTemp.toFixed(1)}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rango esperado:</span>
                    <span>±{(targetTempSwing / 2).toFixed(0)}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amplitud ΔT:</span>
                    <span className={targetAccent}>{targetTempSwing.toFixed(1)}°C</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual comparative bar */}
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                <span>Brecha Térmica (Diferencia de media)</span>
                <span className="font-mono tabular-nums text-amber-300">
                  Δ {Math.abs(earthMeanTemp - targetMeanTemp).toFixed(1)}°C
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-400"
                  style={{
                    width: `${Math.min(100, Math.max(0, activeScore.dimensions.thermal))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* 2. Dryness & Ice Potential */}
          <div className="rounded-xl border border-slate-800/90 bg-[#060913]/60 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Droplets className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
                2. Sequedad e Hielo / Agua
              </span>
              <span className="font-mono font-semibold tabular-nums text-slate-300">
                ASI: {activeScore.dimensions.hydrology_ice.toFixed(1)} / 100
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-2.5">
                <span className="font-medium text-cyan-300">Tierra (Sitio)</span>
                <div className="mt-1.5 space-y-1 font-mono tabular-nums text-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Precipitación:</span>
                    <span>{site.climatology.precipitation_mm_day.toFixed(2)} mm/d</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Índice Sequedad:</span>
                    <span className="font-semibold">{(earthDryness * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Relevancia Hielo:</span>
                    <span>{(earthIce * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div className={`rounded-lg border ${targetBorder} ${targetBg} p-2.5`}>
                <span className={`font-medium ${targetAccent}`}>
                  {target.body} ({target.name.split("/")[0]})
                </span>
                <div className="mt-1.5 space-y-1 font-mono tabular-nums text-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lluvia Líquida:</span>
                    <span>0.00 mm/d (Nula)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Índice Sequedad:</span>
                    <span className="font-semibold">{(targetDryness * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Relevancia Hielo:</span>
                    <span>{(targetIce * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                <span>Alineación Hidrológica / Criosfera</span>
                <span className="font-mono tabular-nums text-blue-300">
                  {activeScore.dimensions.hydrology_ice.toFixed(1)}% match
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, activeScore.dimensions.hydrology_ice))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* 3. Topography: Slope & Roughness */}
          <div className="rounded-xl border border-slate-800/90 bg-[#060913]/60 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Mountain className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                3. Pendiente y Rugosidad Topográfica
              </span>
              <span className="font-mono font-semibold tabular-nums text-slate-300">
                ASI: {activeScore.dimensions.topography.toFixed(1)} / 100
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-2.5">
                <span className="font-medium text-cyan-300">Tierra (Sitio)</span>
                <div className="mt-1.5 space-y-1 font-mono tabular-nums text-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pendiente:</span>
                    <span className="font-semibold">{earthSlope.toFixed(1)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rugosidad (0-1):</span>
                    <span>{earthRoughness.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className={`rounded-lg border ${targetBorder} ${targetBg} p-2.5`}>
                <span className={`font-medium ${targetAccent}`}>
                  {target.body} ({target.name.split("/")[0]})
                </span>
                <div className="mt-1.5 space-y-1 font-mono tabular-nums text-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pendiente Ref.:</span>
                    <span className="font-semibold">{targetSlope.toFixed(1)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rugosidad Ref.:</span>
                    <span>{targetRoughness.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                <span>Discrepancia de Pendiente</span>
                <span className="font-mono tabular-nums text-emerald-300">
                  Δ {Math.abs(earthSlope - targetSlope).toFixed(1)}°
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, activeScore.dimensions.topography))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* 4. Gravity & Pressure / Atmosphere */}
          <div className="rounded-xl border border-slate-800/90 bg-[#060913]/60 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Gauge className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />
                4. Gravedad y Presión Atmosférica
              </span>
              <span className="rounded border border-purple-500/40 bg-purple-950/30 px-2 py-0.5 text-[11px] font-semibold text-purple-300">
                Brecha Física Infranqueable
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-2.5">
                <span className="font-medium text-cyan-300">Tierra (1.00 g)</span>
                <div className="mt-1.5 space-y-1.5 text-slate-200">
                  <div>
                    <span className="block text-[11px] text-slate-400">Aceleración:</span>
                    <span className="font-mono font-semibold tabular-nums">
                      {earthGravity.toFixed(2)} m/s² (100%)
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Presión / Atmósfera:</span>
                    <span className="font-mono text-[11px]">{earthPressure}</span>
                    <span className="block text-[10px] text-slate-400">{earthAtmosphere}</span>
                  </div>
                </div>
              </div>

              <div className={`rounded-lg border ${targetBorder} ${targetBg} p-2.5`}>
                <span className={`font-medium ${targetAccent}`}>
                  {target.body} ({targetGravityRatio}% g)
                </span>
                <div className="mt-1.5 space-y-1.5 text-slate-200">
                  <div>
                    <span className="block text-[11px] text-slate-400">Aceleración:</span>
                    <span className="font-mono font-semibold tabular-nums">
                      {targetGravity.toFixed(2)} m/s² ({targetGravityRatio}%)
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Presión / Atmósfera:</span>
                    <span className="font-mono text-[11px]">{targetPressure}</span>
                    <span className="block text-[10px] text-slate-400">{targetAtmosphere}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gravity comparison visual bar */}
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                <span>Carga gravitatoria en {target.body}</span>
                <span className="font-mono tabular-nums text-purple-300">
                  {targetGravityRatio}% respecto a la Tierra
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-purple-500"
                  style={{ width: `${targetGravityRatio}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Axis ASI Visual Breakdown */}
      <section aria-labelledby="asi-breakdown-heading" className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-2">
          <h3
            id="asi-breakdown-heading"
            className="flex items-center gap-2 text-sm font-bold tracking-wide text-slate-100 uppercase"
          >
            <Layers className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
            Desglose de los 5 Ejes del ASI
          </h3>
          <span className="text-xs text-slate-400">Ponderaciones de misión</span>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-800/90 bg-[#060913]/60 p-3.5">
          {ASI_DIMENSION_CONFIG.map(({ key, label, desc }) => {
            const score = activeScore.dimensions[key];
            const weight = activeScore.weights[key] * 100;

            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-slate-200">{label}</span>
                    <span className="ml-1.5 font-mono text-[11px] text-slate-400">
                      (peso: {weight.toFixed(0)}%)
                    </span>
                  </div>
                  <span className="font-mono font-bold tabular-nums text-[#D4AF37]">
                    {score.toFixed(1)} / 100
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${targetBar}`}
                    style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                  />
                </div>
                <p className="text-[11px] leading-tight text-slate-400">{desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Strengths & Limitations */}
      <section aria-labelledby="strengths-limits-heading" className="space-y-3">
        <h3
          id="strengths-limits-heading"
          className="border-b border-[#D4AF37]/20 pb-2 text-sm font-bold tracking-wide text-slate-100 uppercase"
        >
          Validez y Límites de la Analogía
        </h3>

        {/* Strengths */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-3.5">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Dónde cumple la analogía (Score ≥ 70/100)
          </div>
          {activeScore.analogy_strengths.length === 0 ? (
            <p className="text-xs text-slate-400">
              Ningún eje superó el umbral de 70/100 para este objetivo. La afinidad global es moderada o selectiva.
            </p>
          ) : (
            <ul className="space-y-1 text-xs text-slate-300">
              {activeScore.analogy_strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-400">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Limitations */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/15 p-3.5">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Dónde se rompe la analogía (Factores Críticos)
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {Object.entries(activeScore.analogy_breakdowns).map(([key, msg]) => (
              <li key={key} className="leading-relaxed">
                <span className="font-semibold text-slate-200 uppercase">{key}:</span>{" "}
                <span className="text-slate-300">{msg}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Official NASA Reference Card */}
      <div className="rounded-xl border border-[#D4AF37]/50 bg-[#0D1424] p-4 shadow-[0_0_15px_rgba(212,175,55,0.12)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-block rounded border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[#D4AF37] uppercase">
              Referencia Oficial NASA
            </span>
            <h4 className="mt-1.5 text-sm font-semibold text-slate-100">
              {target.name}
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              {target.context}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80">
          <a
            href={target.source_url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#D4AF37] bg-[#D4AF37]/20 px-3 py-2 text-xs font-semibold text-[#D4AF37] transition-all hover:bg-[#D4AF37]/30 hover:shadow-[0_0_12px_rgba(212,175,55,0.3)] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            Consultar Publicación Científica Oficial en NASA.gov
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
