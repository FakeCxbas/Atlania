"use client";

import { useState } from "react";
import type { AnalogSite, TargetProfile, DimensionScores } from "@/types/analog";
import { AsiRadarChart } from "@/components/AsiRadarChart";
import { TerrainComparison3DModal } from "@/components/TerrainComparison3DModal";
import {
  ExternalLink,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Globe2,
  Moon,
  Mountain,
  Orbit,
  Maximize2,
  Minimize2,
  Database,
  Info,
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
  expanded?: boolean;
  onToggleExpand?: () => void;
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
    desc: "Superposición difusa de Jaccard en basalto, regolito, sedimentos, evaporitas e impacto",
  },
  {
    key: "thermal",
    label: "Régimen Térmico",
    desc: "60% temperatura media y 40% amplitud térmica anual/diurna",
  },
  {
    key: "hydrology_ice",
    label: "Sequedad y Potencial de Hielo",
    desc: "40% índice de aridez, 40% relevancia de hielo/permafrost y 20% historia acuosa",
  },
  {
    key: "subsurface_ops",
    label: "Operaciones Subterráneas y Refugio",
    desc: "70% relevancia de tubos de lava y 30% refugio contra radiación",
  },
];

const GEOLOGY_LABELS = [
  "Basalto",
  "Regolito / Tefra",
  "Sedimentario",
  "Evaporitas (Sales)",
  "Impacto",
];

function AsiCircularGauge({
  score,
  isMars,
}: {
  score: number;
  isMars: boolean;
}) {
  const size = 128;
  const strokeWidth = 9;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = c - (clamped / 100) * c;
  const color = isMars ? "#E07A5F" : "#00D9F5";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Índice de Similitud Análoga global: ${clamped.toFixed(1)} de 100`}
        className="-rotate-90 transform"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(100, 180, 210, 0.14)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="Select-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-2xl font-bold tabular-nums text-[#F1F5F9]">
          {clamped.toFixed(1)}%
        </span>
        <span className="text-[10px] font-semibold tracking-wider text-[#F5B82E] uppercase">
          ASI Global
        </span>
      </div>
    </div>
  );
}

export function SideBySideComparison({
  site,
  target,
  activeScore,
  references,
  onSelectTarget,
  expanded = false,
  onToggleExpand,
}: SideBySideComparisonProps) {
  const [show3DComparison, setShow3DComparison] = useState(false);
  const isMars = target.body === "Mars";
  const targetAccent = isMars ? "text-[#E07A5F]" : "text-[#00D9F5]";
  const targetBorder = isMars ? "border-[#E07A5F]/40" : "border-[#00D9F5]/40";
  const targetBar = isMars ? "bg-[#E07A5F]" : "bg-[#00D9F5]";
  const bodyLabel = isMars ? "Marte" : "Luna";

  // Real computed metrics from site & target data
  const earthMeanTemp = (site.climatology.tmax_c + site.climatology.tmin_c) / 2;
  const earthTempSwing = site.climatology.tmax_c - site.climatology.tmin_c;
  const targetMeanTemp = target.temperature_mean_c;
  const targetTempSwing = target.temperature_range_c;

  const earthDryness = 1 / (1 + site.climatology.precipitation_mm_day);
  const targetDryness = target.dryness;

  const earthSlope = site.terrain.slope_deg;
  const targetSlope = target.terrain?.slope_deg ?? null;

  const earthRoughness = site.terrain.roughness;
  const targetRoughness = target.terrain?.roughness ?? null;

  const earthIce = site.terrain.ice;
  const targetIce = target.terrain?.ice ?? null;
  const earthAqueous = site.terrain.aqueous_history ?? 0;

  const geologyKeyMap: Record<string, string> = {
    basalt: "Basalto",
    regolith: "Regolito / Tefra",
    sedimentary: "Sedimentario",
    evaporite: "Evaporitas (Sales)",
    impact: "Impacto",
  };
  const geologyEntries: Array<{ label: string; val: number }> = Array.isArray(
    site.terrain.geology
  )
    ? site.terrain.geology.map((val, idx) => ({
        label: GEOLOGY_LABELS[idx] ?? `Litología ${idx + 1}`,
        val,
      }))
    : site.terrain.geology
      ? Object.entries(site.terrain.geology).map(([key, val]) => ({
          label: geologyKeyMap[key] ?? key,
          val,
        }))
      : [];

  const earthGravity = 9.81;
  const targetGravity =
    target.gravity_ms2 && target.gravity_ms2 > 0
      ? target.gravity_ms2
      : target.body === "Moon"
      ? 1.62
      : 3.71;
  const targetGravityRatio = Math.round((targetGravity / earthGravity) * 100);

  // Ranked dimensions from actual engine output for objective interpretation
  const sortedDims = [...ASI_DIMENSION_CONFIG].sort(
    (a, b) => activeScore.dimensions[b.key] - activeScore.dimensions[a.key]
  );
  const topDim = sortedDims[0];
  const weakestDim = sortedDims[sortedDims.length - 1];

  const isLivePower = site.climatology.source === "nasa_power";
  const isLiveDem = site.dem_telemetry.source === "open_meteo";

  return (
    <div className="space-y-5 text-[#F1F5F9]">
      {/* 1. COMPARISON HEADER & TARGET SELECTOR */}
      <div className="rounded-xl border border-[rgba(100,180,210,0.22)] bg-[#071018]/90 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(100,180,210,0.18)] pb-3">
          <div>
            {/* Breadcrumb contextual de la comparación */}
            <nav aria-label="Ruta de comparación" className="mb-2 flex flex-wrap items-center gap-1 font-mono text-xs text-slate-400">
              <span className="text-slate-300">Tierra</span>
              <ChevronRight className="h-3 w-3 shrink-0 text-slate-600" aria-hidden="true" />
              <span className="text-slate-300">{site.country}</span>
              <ChevronRight className="h-3 w-3 shrink-0 text-slate-600" aria-hidden="true" />
              <span className="font-semibold text-[#00D9F5]">{site.name}</span>
              <span className="mx-1 font-bold text-slate-500">vs</span>
              <span className={isMars ? "font-semibold text-[#E07A5F]" : "font-semibold text-[#F5B82E]"}>
                {bodyLabel} · {target.name.split("/")[0]}
              </span>
            </nav>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-[#00D9F5]/40 bg-[#00D9F5]/10 px-2 py-0.5 text-xs font-semibold tracking-wider text-[#00D9F5] uppercase">
                Tierra vs. {bodyLabel}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-xs font-semibold ${
                  isLivePower
                    ? "border-[#34D399]/40 bg-[#34D399]/10 text-[#34D399]"
                    : "border-[#F5B82E]/40 bg-[#F5B82E]/10 text-[#F5B82E]"
                }`}
              >
                {isLivePower ? "CLIMA: NASA POWER EN VIVO" : "CLIMA: RESPALDO"}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-xs font-semibold ${
                  isLiveDem
                    ? "border-[#34D399]/40 bg-[#34D399]/10 text-[#34D399]"
                    : "border-[#F5B82E]/40 bg-[#F5B82E]/10 text-[#F5B82E]"
                }`}
              >
                {isLiveDem ? "DEM: COPERNICUS GLO-90" : "DEM: RESPALDO"}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-200">
              Comparando{" "}
              <strong className="text-slate-100 font-bold">{site.name}</strong> ({site.country})
              frente a{" "}
              <strong className={targetAccent}>{target.name}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShow3DComparison(true)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#7CA5B8]/55 bg-[#7CA5B8]/15 px-3 py-1.5 text-xs font-semibold text-[#E4DFD5] transition-colors hover:bg-[#7CA5B8]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
            >
              <Mountain className="h-3.5 w-3.5 text-[#7CA5B8]" aria-hidden="true" />
              <span>Comparar superficies en 3D</span>
            </button>

            {onToggleExpand && (
              <button
                type="button"
                onClick={onToggleExpand}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#C5A36D]/50 bg-[#C5A36D]/15 px-3 py-1.5 text-xs font-semibold text-[#C5A36D] transition-colors hover:bg-[#C5A36D]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
              >
                {expanded ? (
                  <>
                    <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Vista Compacta</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Expandir 3 Columnas</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Target Selector Grid (All 6 Planetary Targets) */}
        <div className="mt-3">
          <span className="mb-1.5 block text-[11px] font-semibold tracking-wider text-[#F5B82E] uppercase">
            Seleccionar Destino Extraterrestre ({Object.keys(references).length} referencias PDS)
          </span>
          <div
            className={`grid gap-1.5 ${
              expanded ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" : "grid-cols-2 sm:grid-cols-3"
            }`}
          >
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
                  className={`flex flex-col items-start rounded-lg border p-2 text-left transition-colors ${
                    isSelected
                      ? "border-[#F5B82E] bg-[#F5B82E]/15"
                      : "border-[rgba(100,180,210,0.18)] bg-[#0D1925]/80 hover:border-[rgba(100,180,210,0.4)]"
                  }`}
                >
                  <div className="flex w-full items-center justify-between text-[10px]">
                    <span
                      className={`font-semibold uppercase ${
                        refIsMars ? "text-[#E07A5F]" : "text-[#00D9F5]"
                      }`}
                    >
                      {refIsMars ? "Marte" : "Luna"}
                    </span>
                    <span className="font-mono font-bold tabular-nums text-[#F1F5F9]">
                      {score.toFixed(1)}%
                    </span>
                  </div>
                  <span className="mt-0.5 line-clamp-1 text-[11px] font-medium text-slate-200">
                    {ref.name.split("/")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. THREE-COLUMN SCIENTIFIC COMPARISON WORKBENCH */}
      <div
        className={`grid gap-4 ${
          expanded ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"
        }`}
      >
        {/* COLUMN 1 — TIERRA (Sitio Análogo) */}
        <section
          aria-label="Columna Tierra: propiedades del sitio terrestre"
          className="flex flex-col justify-between rounded-xl border border-[rgba(100,180,210,0.22)] bg-[#0D1925]/90 p-4"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(100,180,210,0.18)] pb-2.5">
              <div className="flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-[#00D9F5]" aria-hidden="true" />
                <h3 className="text-xs font-bold tracking-wider text-[#00D9F5] uppercase">
                  Columna I · Tierra (Sitio)
                </h3>
              </div>
              <span className="rounded bg-[#132434] px-2 py-0.5 text-[10px] font-semibold text-slate-200">
                {site.discovery_tier}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#F1F5F9]">{site.name}</h4>
              <p className="mt-0.5 font-mono text-xs tabular-nums text-[#94A3B8]">
                {site.country} · LAT {site.latitude.toFixed(3)}°, LON{" "}
                {site.longitude.toFixed(3)}° · Elev. {site.elevation_m.toLocaleString()} m
              </p>
            </div>

            {/* Measured / Sampled Earth Telemetry */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-semibold tracking-wider text-[#94A3B8] uppercase">
                Climatología ({site.climatology.source === "nasa_power" ? "NASA POWER 2m" : "Respaldo"})
              </span>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs tabular-nums">
                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/60 p-2">
                  <span className="block font-sans text-[10px] text-[#94A3B8]">
                    Temp. Media Anual
                  </span>
                  <span className="font-bold text-[#F1F5F9]">
                    {earthMeanTemp.toFixed(1)}°C
                  </span>
                </div>
                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/60 p-2">
                  <span className="block font-sans text-[10px] text-[#94A3B8]">
                    Rango (Mín / Máx)
                  </span>
                  <span className="font-bold text-[#F1F5F9]">
                    {site.climatology.tmin_c.toFixed(1)}° / {site.climatology.tmax_c.toFixed(1)}°C
                  </span>
                </div>
                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/60 p-2">
                  <span className="block font-sans text-[10px] text-[#94A3B8]">
                    Amplitud Térmica ΔT
                  </span>
                  <span className="font-bold text-[#00D9F5]">
                    {earthTempSwing.toFixed(1)}°C
                  </span>
                </div>
                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/60 p-2">
                  <span className="block font-sans text-[10px] text-[#94A3B8]">
                    Precipitación
                  </span>
                  <span className="font-bold text-[#F1F5F9]">
                    {site.climatology.precipitation_mm_day.toFixed(2)} mm/d
                  </span>
                </div>
                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/60 p-2">
                  <span className="block font-sans text-[10px] text-[#94A3B8]">
                    Presión Superficial
                  </span>
                  <span className="font-bold text-[#F1F5F9]">
                    {site.climatology.surface_pressure_kpa.toFixed(1)} kPa
                  </span>
                </div>
                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/60 p-2">
                  <span className="block font-sans text-[10px] text-[#94A3B8]">
                    Irradiancia / Viento
                  </span>
                  <span className="font-bold text-[#F1F5F9]">
                    {site.climatology.solar_irradiance_kwh_m2_day.toFixed(1)} kWh ·{" "}
                    {site.climatology.wind_m_s.toFixed(1)} m/s
                  </span>
                </div>
              </div>
            </div>

            {/* DEM & Scenario Priors */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-semibold tracking-wider text-[#94A3B8] uppercase">
                Topografía DEM y Priors de Escenario
              </span>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs tabular-nums">
                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/60 p-2">
                  <span className="block font-sans text-[10px] text-[#94A3B8]">
                    Pendiente (DEM / Prior)
                  </span>
                  <span className="font-bold text-[#F1F5F9]">
                    {site.dem_telemetry.dem_slope_deg.toFixed(1)}° / {earthSlope.toFixed(1)}°
                  </span>
                </div>
                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/60 p-2">
                  <span className="block font-sans text-[10px] text-[#94A3B8]">
                    Relieve DEM / Rugosidad
                  </span>
                  <span className="font-bold text-[#F1F5F9]">
                    {site.dem_telemetry.dem_roughness_m.toFixed(1)} m / {earthRoughness.toFixed(2)}
                  </span>
                </div>
                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/60 p-2">
                  <span className="block font-sans text-[10px] text-[#94A3B8]">
                    Tubos Lávicos / Refugio
                  </span>
                  <span className="font-bold text-[#F1F5F9]">
                    {(site.terrain.lava_tubes * 100).toFixed(0)}% /{" "}
                    {(site.terrain.shelter * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/60 p-2">
                  <span className="block font-sans text-[10px] text-[#94A3B8]">
                    Hielo / Hist. Acuosa
                  </span>
                  <span className="font-bold text-[#F1F5F9]">
                    {(earthIce * 100).toFixed(0)}% /{" "}
                    {(earthAqueous * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Lithological memberships */}
            <div>
              <span className="block text-[10px] font-semibold tracking-wider text-[#94A3B8] uppercase">
                Membresías Geológicas del Sitio (0–100%)
              </span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {geologyEntries.length > 0 ? (
                  geologyEntries.map(({ label, val }) => (
                    <span
                      key={label}
                      className="rounded border border-[rgba(100,180,210,0.2)] bg-[#071018] px-2 py-0.5 font-mono text-[10px] text-slate-300"
                    >
                      {label}: {(val * 100).toFixed(0)}%
                    </span>
                  ))
                ) : (
                  <span className="font-mono text-[10px] text-[#94A3B8]">
                    Estimado por prior de escenario en punto libre
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-[rgba(100,180,210,0.16)] pt-2.5 text-[11px] text-[#94A3B8]">
            <span>
              Período climático: {site.climatology.period ?? " Escenario anual"} · Gravedad:{" "}
              <strong className="font-mono text-slate-200">9.81 m/s²</strong>
            </span>
          </div>
        </section>

        {/* COLUMN 2 — ANÁLISIS CUANTITATIVO ASI */}
        <section
          aria-label="Columna central: análisis cuantitativo del índice ASI"
          className="flex flex-col justify-between rounded-xl border border-[#F5B82E]/35 bg-[#0D1925]/95 p-4"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(100,180,210,0.18)] pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#F5B82E]" aria-hidden="true" />
                <h3 className="text-xs font-bold tracking-wider text-[#F5B82E] uppercase">
                  Columna II · Análisis ASI (5 Ejes)
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-[#F5B82E]">
                {activeScore.overall_asi.toFixed(1)} / 100
              </span>
            </div>

            {/* Circular Gauge + 5-Axis Radar side by side */}
            <div className="grid grid-cols-1 items-center gap-2 rounded-xl border border-[rgba(100,180,210,0.16)] bg-[#071018]/80 p-3 sm:grid-cols-2">
              <div className="flex flex-col items-center justify-center">
                <AsiCircularGauge score={activeScore.overall_asi} isMars={isMars} />
                <span className="mt-1.5 text-center text-[10px] text-[#94A3B8]">
                  Similitud ponderada de escenario (no probabilidad)
                </span>
              </div>
              <AsiRadarChart
                dimensions={activeScore.dimensions}
                weights={activeScore.weights}
                isMars={isMars}
              />
            </div>

            {/* 5 Weighted Dimension Bars */}
            <div className="space-y-2.5">
              {ASI_DIMENSION_CONFIG.map(({ key, label, desc }) => {
                const score = activeScore.dimensions[key];
                const weight = activeScore.weights[key] * 100;

                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium text-[#F1F5F9]">{label}</span>
                        <span className="ml-1.5 font-mono text-[10px] text-[#94A3B8]">
                          (peso: {weight.toFixed(0)}%)
                        </span>
                      </div>
                      <span className="font-mono font-bold tabular-nums text-[#F5B82E]">
                        {score.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#132434]">
                      <div
                        className={`h-full rounded-full ${targetBar}`}
                        style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                      />
                    </div>
                    <p className="text-[10px] leading-tight text-[#94A3B8]">{desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Key Environmental Gaps Summary */}
            <div className="rounded-lg border border-[rgba(100,180,210,0.18)] bg-[#132434]/50 p-3 text-xs">
              <span className="block text-[10px] font-bold tracking-wider text-[#00D9F5] uppercase">
                Brechas Ambientales Directas
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11px] tabular-nums">
                <div>
                  <span className="block font-sans text-[10px] text-[#94A3B8]">
                    Δ Temp. Media:
                  </span>
                  <span className="font-bold text-[#F5B82E]">
                    {Math.abs(earthMeanTemp - targetMeanTemp).toFixed(1)}°C
                  </span>
                </div>
                <div>
                  <span className="block font-sans text-[10px] text-[#94A3B8]">
                    Δ Amplitud Térmica:
                  </span>
                  <span className="font-bold text-[#F1F5F9]">
                    {Math.abs(earthTempSwing - targetTempSwing).toFixed(1)}°C
                  </span>
                </div>
                <div>
                  <span className="block font-sans text-[10px] text-[#94A3B8]">
                    Δ Pendiente:
                  </span>
                  <span className="font-bold text-[#34D399]">
                    {targetSlope !== null
                      ? `${Math.abs(earthSlope - targetSlope).toFixed(1)}°`
                      : "No medida"}
                  </span>
                </div>
                <div>
                  <span className="block font-sans text-[10px] text-[#94A3B8]">
                    Relación Gravedad:
                  </span>
                  <span className="font-bold text-purple-300">
                    {targetGravity.toFixed(2)} vs 9.81 m/s² ({targetGravityRatio}%)
                  </span>
                </div>
                <div className="col-span-2 border-t border-[rgba(100,180,210,0.14)] pt-1.5">
                  <span className="font-sans text-[10px] text-[#94A3B8]">
                    Índice Aridez (Tierra vs {bodyLabel}):{" "}
                  </span>
                  <span className="font-bold text-[#00D9F5]">
                    {(earthDryness * 100).toFixed(1)}% vs {(targetDryness * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Objective Motor Conclusion (Fase 3 / Fase 6 compliance) */}
          <div className="mt-4 rounded-lg border border-[#F5B82E]/30 bg-[#071018]/90 p-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-[#F5B82E]">
              <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Interpretación Cuantitativa del Motor ASI</span>
            </div>
            <p className="mt-1 leading-relaxed text-slate-300">
              Para el objetivo <strong>{target.name.split("/")[0]}</strong>, el motor
              calcula un ASI ponderado de{" "}
              <strong className="font-mono text-[#F5B82E]">
                {activeScore.overall_asi.toFixed(1)}%
              </strong>
              , impulsado principalmente por{" "}
              <strong>{topDim.label.toLowerCase()}</strong> (
              <span className="font-mono">
                {activeScore.dimensions[topDim.key].toFixed(1)}%
              </span>
              , peso {(activeScore.weights[topDim.key] * 100).toFixed(0)}%) y limitado en{" "}
              <strong>{weakestDim.label.toLowerCase()}</strong> (
              <span className="font-mono">
                {activeScore.dimensions[weakestDim.key].toFixed(1)}%
              </span>
              ). Este valor representa similitud exploratoria de escenario y no
              certifica aptitud operativa ni seguridad de misión.
            </p>
          </div>
        </section>

        {/* COLUMN 3 — LUNA O MARTE (Objetivo Extraterrestre) */}
        <section
          aria-label={`Columna derecha: propiedades documentadas de ${target.name}`}
          className={`flex flex-col justify-between rounded-xl border ${targetBorder} bg-[#0D1925]/90 p-4`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(100,180,210,0.18)] pb-2.5">
              <div className="flex items-center gap-2">
                {isMars ? (
                  <Orbit className="h-4 w-4 text-[#E07A5F]" aria-hidden="true" />
                ) : (
                  <Moon className="h-4 w-4 text-[#00D9F5]" aria-hidden="true" />
                )}
                <h3 className={`text-xs font-bold tracking-wider uppercase ${targetAccent}`}>
                  Columna III · {bodyLabel} (Referencia)
                </h3>
              </div>
              <span className="rounded bg-[#132434] px-2 py-0.5 font-mono text-[10px] text-slate-200">
                NASA PDS
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#F1F5F9]">{target.name}</h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                {target.context}
              </p>
            </div>

            {/* Documented Planetary Parameters */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-semibold tracking-wider text-[#94A3B8] uppercase">
                Parámetros de Escenario y Constantes Nominales
              </span>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs tabular-nums">
                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/60 p-2">
                  <span className="block font-sans text-[10px] text-[#94A3B8]">
                    Temp. Media Escenario
                  </span>
                  <span className="font-bold text-[#F1F5F9]">
                    {targetMeanTemp.toFixed(1)}°C
                  </span>
                </div>
                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/60 p-2">
                  <span className="block font-sans text-[10px] text-[#94A3B8]">
                    Rango Escenario
                  </span>
                  <span className="font-bold text-[#F1F5F9]">
                    {target.temp_min_c !== undefined && target.temp_max_c !== undefined
                      ? `${target.temp_min_c}° a ${target.temp_max_c}°C`
                      : `±${(targetTempSwing / 2).toFixed(0)}°C`}
                  </span>
                </div>
                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/60 p-2">
                  <span className="block font-sans text-[10px] text-[#94A3B8]">
                    Amplitud Térmica ΔT
                  </span>
                  <span className={`font-bold ${targetAccent}`}>
                    {targetTempSwing.toFixed(1)}°C
                  </span>
                </div>
                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/60 p-2">
                  <span className="block font-sans text-[10px] text-[#94A3B8]">
                    Sequedad Superficial
                  </span>
                  <span className="font-bold text-[#F1F5F9]">
                    {(targetDryness * 100).toFixed(0)}% (Sin lluvia líquida)
                  </span>
                </div>
                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/60 p-2">
                  <span className="block font-sans text-[10px] text-[#94A3B8]">
                    Gravedad Nominal
                  </span>
                  <span className="font-bold text-[#F1F5F9]">
                    {targetGravity.toFixed(2)} m/s² ({targetGravityRatio}% g)
                  </span>
                </div>
                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/60 p-2">
                  <span className="block font-sans text-[10px] text-[#94A3B8]">
                    Presión Nominal
                  </span>
                  <span className="font-bold text-[#F1F5F9]">
                    {target.pressure_kpa !== undefined
                      ? `${target.pressure_kpa} kPa`
                      : isMars
                      ? "0.65 kPa"
                      : "0.0 kPa (Vacío)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Target Terrain Priors & Unmeasured Indicators */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-semibold tracking-wider text-[#94A3B8] uppercase">
                Priors Morfológicos y Mineralogía Regional
              </span>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs tabular-nums">
                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/60 p-2">
                  <span className="block font-sans text-[10px] text-[#94A3B8]">
                    Pendiente Escenario
                  </span>
                  <span className="font-bold text-[#F1F5F9]">
                    {targetSlope !== null ? `${targetSlope.toFixed(1)}°` : "No disponible"}
                  </span>
                </div>
                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/60 p-2">
                  <span className="block font-sans text-[10px] text-[#94A3B8]">
                    Rugosidad / Hielo
                  </span>
                  <span className="font-bold text-[#F1F5F9]">
                    {targetRoughness !== null ? targetRoughness.toFixed(2) : "—"} /{" "}
                    {targetIce !== null ? `${(targetIce * 100).toFixed(0)}%` : "—"}
                  </span>
                </div>
              </div>
              {target.mineralogy_summary && (
                <p className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#071018]/70 p-2.5 text-xs leading-relaxed text-slate-300">
                  <strong className="text-slate-100">Contexto Mineralógico:</strong>{" "}
                  {target.mineralogy_summary}
                </p>
              )}
            </div>

            {/* Explicitly Unmeasured / Unavailable Data */}
            <div className="rounded-lg border border-[rgba(100,180,210,0.18)] bg-[#071018]/80 p-2.5 text-[11px] text-[#94A3B8]">
              <span className="flex items-center gap-1 font-semibold text-slate-200">
                <Database className="h-3.5 w-3.5 text-[#00D9F5]" aria-hidden="true" />
                Instrumentación y Datos No Medidos Localmente
              </span>
              <p className="mt-1">
                <strong>Instrumentos:</strong> {target.instrument || "Archivo NASA"}.{" "}
                <strong>PDS:</strong>{" "}
                <span className="font-mono text-[10px]">
                  {target.pds_dataset || "Cita documental"}
                </span>
                .
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                * Dosis de radiación ionizante local, ensayo geoquímico in situ de
                tubos subterráneos y humedad relativa atmosférica no aplican o no
                están medidos en este perfil.
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-[rgba(100,180,210,0.16)] pt-3">
            <a
              href={target.source_url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#F5B82E] bg-[#F5B82E]/15 px-3 py-2 text-xs font-semibold text-[#F5B82E] transition-colors hover:bg-[#F5B82E]/25"
            >
              <span>Consultar Fuente Oficial en NASA.gov</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </section>
      </div>

      {/* 3. SCIENTIFIC STRENGTHS & DOCUMENTED LIMITATIONS (FASE 3 / FASE 6) */}
      <section aria-labelledby="strengths-limits-heading" className="grid gap-3 sm:grid-cols-2">
        {/* Strengths */}
        <div className="rounded-xl border border-[#34D399]/35 bg-[#0D1925]/90 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wider text-[#34D399] uppercase">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Dimensiones con Alta Afinidad (Score ≥ 70/100)
          </div>
          {activeScore.analogy_strengths.length === 0 ? (
            <p className="text-xs text-[#94A3B8]">
              Ninguna dimensión individual superó el umbral de 70/100 frente a este
              objetivo; la similitud es parcial o específica de sub-variables.
            </p>
          ) : (
            <ul className="space-y-1.5 text-xs text-slate-200">
              {activeScore.analogy_strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-bold text-[#34D399]">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Documented Breakdowns / Limitations */}
        <div className="rounded-xl border border-[#F5B82E]/35 bg-[#0D1925]/90 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wider text-[#F5B82E] uppercase">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Limitaciones Científicas y Brechas Físicas Documentadas
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {Object.entries(activeScore.analogy_breakdowns).map(([key, msg]) => (
              <li key={key} className="leading-relaxed">
                <span className="font-semibold text-[#F1F5F9] uppercase">{key}:</span>{" "}
                <span>{msg}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <TerrainComparison3DModal
        open={show3DComparison}
        onClose={() => setShow3DComparison(false)}
        site={site}
        target={target}
        references={references}
        overallAsi={activeScore.overall_asi}
        onSelectTarget={onSelectTarget}
      />
    </div>
  );
}
