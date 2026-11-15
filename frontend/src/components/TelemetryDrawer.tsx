"use client";

import { useEffect, useState } from "react";
import type {
  AnalogDataset,
  AnalogSite,
  DimensionScores,
  TargetProfile,
} from "@/types/analog";
import { downloadDossier } from "@/lib/dossier";
import { SideBySideComparison } from "@/components/SideBySideComparison";
import { AsiRadarChart } from "@/components/AsiRadarChart";
import {
  Compass,
  X,
  Thermometer,
  Wind,
  Droplets,
  Mountain,
  ArrowRight,
  Layers,
  Sparkles,
  ChevronDown,
  Maximize2,
  Minimize2,
  Satellite,
  Radio,
  Eye,
  ExternalLink,
} from "lucide-react";

import { translateSite, translateTarget } from "@/lib/spanishTranslations";

interface TelemetryDrawerProps {
  dataset: AnalogDataset;
  site: AnalogSite | null;
  references: Record<string, TargetProfile>;
  activeTargetId: string;
  onSelectTarget: (targetId: string) => void;
  onClose?: () => void;
  initialTab?: "overview" | "satellites" | "comparison";
  expanded?: boolean;
  onToggleExpand?: () => void;
}

const DIMENSION_LABELS: { key: keyof DimensionScores; label: string }[] = [
  { key: "topography", label: "Topografía y Pendiente" },
  { key: "geology", label: "Geología y Mineralogía" },
  { key: "thermal", label: "Régimen Térmico" },
  { key: "hydrology_ice", label: "Sequedad / Hielo" },
  { key: "subsurface_ops", label: "Subterráneo / Refugio" },
];

export function TelemetryDrawer({
  dataset,
  site: rawSite,
  references,
  activeTargetId,
  onSelectTarget,
  onClose,
  initialTab = "overview",
  expanded = false,
  onToggleExpand,
}: TelemetryDrawerProps) {
  const [tab, setTab] = useState<"overview" | "satellites" | "comparison">(
    initialTab
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!rawSite) {
    return (
      <aside
        aria-label="Ficha de telemetría de sitio"
        className="flex h-full flex-col items-center justify-center p-6 text-center"
      >
        <Compass className="mb-3 h-8 w-8 text-[#F5B82E]" aria-hidden="true" />
        <h2 className="text-base font-semibold text-[#F1F5F9]">
          Selecciona un Sitio Análogo
        </h2>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-[#94A3B8]">
          Haz clic en cualquier marcador del mapa o activa el sondeo de punto para
          inspeccionar su telemetría NASA POWER y la comparación científica.
        </p>
      </aside>
    );
  }

  const site = translateSite(rawSite);
  const resolvedTargetId = site.scores[activeTargetId]
    ? activeTargetId
    : site.best_target;
  const activeScore = site.scores[resolvedTargetId];
  const rawActiveTarget = references[resolvedTargetId] ?? {
    id: resolvedTargetId,
    name: resolvedTargetId,
    body: "Moon" as const,
    temperature_mean_c: -60,
    temperature_range_c: 50,
    dryness: 1,
    context: "",
    source_url: "",
  };
  const activeTarget = translateTarget(rawActiveTarget);
  const rawBestTarget = references[site.best_target];
  const bestTarget = rawBestTarget ? translateTarget(rawBestTarget) : undefined;

  const isMars = activeTarget.body === "Mars";
  const accentText = isMars ? "text-[#E07A5F]" : "text-[#00D9F5]";
  const accentBar = isMars ? "bg-[#E07A5F]" : "bg-[#00D9F5]";
  const diurnalSwing = site.climatology.tmax_c - site.climatology.tmin_c;
  const meanTemp = (site.climatology.tmax_c + site.climatology.tmin_c) / 2;

  const isLivePower = site.climatology.source === "nasa_power";
  const isLiveDem = site.dem_telemetry.source === "open_meteo";

  const handleSwitchTab = (nextTab: "overview" | "satellites" | "comparison") => {
    setTab(nextTab);
    if ((nextTab === "overview" || nextTab === "satellites") && expanded && onToggleExpand) {
      onToggleExpand();
    }
  };

  return (
    <aside
      aria-label={`Ficha técnica para ${site.name}`}
      className="flex h-full flex-col overflow-hidden bg-[#0D1925]/95 text-[#F1F5F9] backdrop-blur-md"
    >
      {/* A. IDENTIFICACIÓN DEL SITIO Y OBJETIVO ACTIVO */}
      <div className="relative border-b border-[rgba(100,180,210,0.22)] bg-[#071018]/80 p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded border border-[#F5B82E]/40 bg-[#F5B82E]/15 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[#F5B82E] uppercase">
                {site.country}
              </span>
              <span
                className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-medium ${
                  bestTarget?.body === "Mars"
                    ? "border-[#E07A5F]/40 bg-[#E07A5F]/15 text-[#E07A5F]"
                    : "border-[#00D9F5]/40 bg-[#00D9F5]/15 text-[#00D9F5]"
                }`}
              >
                Mejor: {bestTarget?.body === "Mars" ? "Marte" : "Luna"}
              </span>
              <span
                className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                  isLivePower
                    ? "border-[#34D399]/40 bg-[#34D399]/10 text-[#34D399]"
                    : "border-[#F5B82E]/40 bg-[#F5B82E]/10 text-[#F5B82E]"
                }`}
              >
                {isLivePower ? "NASA POWER LIVE" : "FALLBACK"}
              </span>
            </div>
            <h2 className="mt-1.5 text-base font-bold leading-snug tracking-tight text-[#F1F5F9]">
              {site.name}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            {tab === "comparison" && onToggleExpand && (
              <button
                type="button"
                onClick={onToggleExpand}
                title={
                  expanded
                    ? "Contraer a panel lateral"
                    : "Expandir comparación a 3 columnas"
                }
                aria-label={
                  expanded
                    ? "Contraer comparación a panel lateral"
                    : "Expandir comparación científica a 3 columnas"
                }
                className="rounded-lg border border-[rgba(100,180,210,0.28)] bg-[#132434]/80 p-1.5 text-[#00D9F5] transition-colors hover:border-[#00D9F5] hover:bg-[#00D9F5]/15"
              >
                {expanded ? (
                  <Minimize2 className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Maximize2 className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar ficha de sitio (Escape)"
                title="Cerrar (Esc)"
                className="rounded-lg border border-[rgba(100,180,210,0.25)] bg-[#132434]/70 p-1.5 text-[#94A3B8] transition-colors hover:border-[#F5B82E]/60 hover:text-[#F5B82E]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Coordenadas, Elevación, ASI y Selector de Objetivo */}
        <div className="mt-2.5 grid grid-cols-3 gap-2 rounded-lg border border-[rgba(100,180,210,0.2)] bg-[#132434]/60 p-2 text-[11px]">
          <div>
            <span className="block text-[10px] text-[#94A3B8]">Coordenadas</span>
            <span className="font-mono tabular-nums text-[#F1F5F9]">
              {site.latitude.toFixed(2)}°, {site.longitude.toFixed(2)}°
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-[#94A3B8]">Elevación</span>
            <span className="font-mono tabular-nums text-[#F1F5F9]">
              {site.elevation_m.toLocaleString()} m
            </span>
          </div>
          <div className="text-right">
            <span className="block text-[10px] text-[#94A3B8]">Índice ASI</span>
            <span className="font-mono font-bold tabular-nums text-[#F5B82E]">
              {activeScore.overall_asi.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Active Target Selector Bar inside Header */}
        <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-[rgba(100,180,210,0.18)] bg-[#071018]/90 px-2.5 py-1.5 text-xs">
          <span className="shrink-0 text-[10px] font-semibold tracking-wider text-[#94A3B8] uppercase">
            Objetivo:
          </span>
          <select
            aria-label="Objetivo extraterrestre seleccionado"
            value={resolvedTargetId}
            onChange={(e) => onSelectTarget(e.target.value)}
            className="min-w-0 flex-1 truncate bg-transparent font-medium text-[#00D9F5] focus:outline-none"
          >
            {Object.entries(references).map(([tId, ref]) => {
              const s = site.scores[tId]?.overall_asi ?? 0;
              return (
                <option
                  key={tId}
                  value={tId}
                  className="bg-[#0D1925] text-[#F1F5F9]"
                >
                  {ref.body === "Mars" ? "[Marte]" : "[Luna]"}{" "}
                  {ref.name.split("/")[0].trim()} — {s.toFixed(1)}% ASI
                </option>
              );
            })}
          </select>
        </div>

        {/* B. NAVEGACIÓN (Telemetría vs Observatorio Satelital vs Comparación Científica) */}
        <div
          role="tablist"
          aria-label="Vistas de análisis del sitio"
          className="mt-2.5 grid grid-cols-3 gap-1 rounded-lg border border-[#55527D]/35 bg-[#101321]/90 p-1"
        >
          <button
            type="button"
            role="tab"
            onClick={() => handleSwitchTab("overview")}
            aria-selected={tab === "overview"}
            className={`rounded-md py-1.5 text-center text-xs font-semibold transition-colors ${
              tab === "overview"
                ? "border border-[#C5A36D]/60 bg-[#C5A36D]/15 text-[#C5A36D]"
                : "text-[#A3A1BD] hover:text-[#E4DFD5]"
            }`}
          >
            Telemetría
          </button>
          <button
            type="button"
            role="tab"
            onClick={() => handleSwitchTab("satellites")}
            aria-selected={tab === "satellites"}
            className={`flex items-center justify-center gap-1 rounded-md py-1.5 text-center text-xs font-semibold transition-colors ${
              tab === "satellites"
                ? "border border-[#38BDF8]/60 bg-[#38BDF8]/15 text-[#38BDF8]"
                : "text-[#A3A1BD] hover:text-[#E4DFD5]"
            }`}
          >
            <Satellite className="h-3 w-3" aria-hidden="true" />
            <span>Satélites</span>
          </button>
          <button
            type="button"
            role="tab"
            onClick={() => handleSwitchTab("comparison")}
            aria-selected={tab === "comparison"}
            className={`flex items-center justify-center gap-1 rounded-md py-1.5 text-center text-xs font-semibold transition-colors ${
              tab === "comparison"
                ? "border border-[#C5A36D]/60 bg-[#C5A36D]/15 text-[#C5A36D]"
                : "text-[#A3A1BD] hover:text-[#E4DFD5]"
            }`}
          >
            <Sparkles className="h-3 w-3 text-[#C5A36D]" aria-hidden="true" />
            <span>Lado a Lado</span>
          </button>
        </div>
      </div>

      {/* CONTENIDO DESPLAZABLE */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4">
        {tab === "overview" ? (
          <div className="space-y-3.5">
            {/* C. TELEMETRÍA COMPACTA (8 Tarjetas Reales) */}
            <div className="rounded-xl border border-[rgba(100,180,210,0.22)] bg-[#071018]/75 p-3">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-[#F1F5F9]">
                  <Thermometer
                    className="h-4 w-4 text-[#00D9F5]"
                    aria-hidden="true"
                  />
                  Telemetría Ambiental y Topográfica
                </span>
                <span
                  className={`font-mono text-[10px] font-semibold ${
                    isLivePower ? "text-[#34D399]" : "text-[#F5B82E]"
                  }`}
                >
                  {isLivePower ? "NASA POWER + GLO-90" : "MODO RESPALDO"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/65 p-2">
                  <span className="block text-[10px] text-[#94A3B8]">
                    1. Temperatura Media
                  </span>
                  <span className="font-mono text-sm font-bold tabular-nums text-[#F1F5F9]">
                    {meanTemp.toFixed(1)}°C
                  </span>
                </div>

                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/65 p-2">
                  <span className="block text-[10px] text-[#94A3B8]">
                    2. Amplitud Térmica
                  </span>
                  <span className="font-mono text-sm font-bold tabular-nums text-[#00D9F5]">
                    Δ {diurnalSwing.toFixed(1)}°C
                  </span>
                </div>

                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/65 p-2">
                  <span className="flex items-center gap-1 text-[10px] text-[#94A3B8]">
                    <Droplets className="h-3 w-3" aria-hidden="true" /> 3.
                    Precipitación
                  </span>
                  <span className="font-mono text-xs font-semibold tabular-nums text-[#F1F5F9]">
                    {site.climatology.precipitation_mm_day.toFixed(2)} mm/d
                  </span>
                </div>

                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/65 p-2">
                  <span className="flex items-center gap-1 text-[10px] text-[#94A3B8]">
                    <Wind className="h-3 w-3" aria-hidden="true" /> 4. Viento y
                    Humedad
                  </span>
                  <span className="font-mono text-xs font-semibold tabular-nums text-[#F1F5F9]">
                    {site.climatology.wind_m_s.toFixed(1)} m/s ·{" "}
                    {site.climatology.relative_humidity_pct.toFixed(0)}%
                  </span>
                </div>

                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/65 p-2">
                  <span className="block text-[10px] text-[#94A3B8]">
                    5. Irradiancia Solar
                  </span>
                  <span className="font-mono text-xs font-semibold tabular-nums text-[#F1F5F9]">
                    {site.climatology.solar_irradiance_kwh_m2_day.toFixed(2)}{" "}
                    kWh/m²/d
                  </span>
                </div>

                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/65 p-2">
                  <span className="block text-[10px] text-[#94A3B8]">
                    6. Presión Superficial
                  </span>
                  <span className="font-mono text-xs font-semibold tabular-nums text-[#F1F5F9]">
                    {site.climatology.surface_pressure_kpa.toFixed(1)} kPa
                  </span>
                </div>

                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/65 p-2">
                  <span className="flex items-center gap-1 text-[10px] text-[#94A3B8]">
                    <Mountain
                      className="h-3 w-3 text-[#34D399]"
                      aria-hidden="true"
                    />{" "}
                    7. Pendiente DEM
                  </span>
                  <span className="font-mono text-xs font-bold tabular-nums text-[#F1F5F9]">
                    {site.dem_telemetry.dem_slope_deg.toFixed(1)}°{" "}
                    <span className="text-[10px] font-normal text-[#94A3B8]">
                      ({isLiveDem ? "GLO-90" : "prior"})
                    </span>
                  </span>
                </div>

                <div className="rounded-lg border border-[rgba(100,180,210,0.16)] bg-[#132434]/65 p-2">
                  <span className="block text-[10px] text-[#94A3B8]">
                    8. Relieve DEM (σ)
                  </span>
                  <span className="font-mono text-xs font-bold tabular-nums text-[#F1F5F9]">
                    {site.dem_telemetry.dem_roughness_m.toFixed(1)} m
                  </span>
                </div>
              </div>
            </div>

            {/* Quick 5-Axis Radar + Bars */}
            <div className="rounded-xl border border-[rgba(100,180,210,0.22)] bg-[#071018]/75 p-3">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-[#F1F5F9]">
                  <Layers className="h-4 w-4 text-[#00D9F5]" aria-hidden="true" />
                  Afinidad ASI vs. {activeTarget.name.split("/")[0]}
                </span>
                <span className={`font-mono font-bold tabular-nums ${accentText}`}>
                  {activeScore.overall_asi.toFixed(1)}%
                </span>
              </div>

              <div className="my-1.5 rounded-lg border border-[rgba(100,180,210,0.15)] bg-[#0D1925]/60 py-1.5">
                <AsiRadarChart
                  dimensions={activeScore.dimensions}
                  weights={activeScore.weights}
                  isMars={isMars}
                />
              </div>

              <div className="mt-2.5 space-y-2">
                {DIMENSION_LABELS.map(({ key, label }) => {
                  const val = activeScore.dimensions[key];
                  return (
                    <div key={key}>
                      <div className="mb-1 flex justify-between text-[11px]">
                        <span className="text-slate-300">{label}</span>
                        <span className="font-mono tabular-nums text-slate-200">
                          {val.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#132434]">
                        <div
                          className={`h-full rounded-full ${accentBar}`}
                          style={{
                            width: `${Math.min(100, Math.max(0, val))}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* D. INFORMACIÓN CIENTÍFICA DESPLEGABLE (Accordion Sections) */}
            <div className="space-y-2">
              <details
                open
                className="group rounded-xl border border-[rgba(100,180,210,0.22)] bg-[#071018]/75 p-3"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold text-[#00D9F5]">
                  <span>¿Por qué es un análogo espacial?</span>
                  <ChevronDown
                    className="h-4 w-4 text-[#94A3B8] transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-2 text-xs leading-relaxed text-slate-200">
                  {site.rationale}
                </p>
                {site.mission_testbeds.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-[rgba(100,180,210,0.16)] pt-2">
                    {site.mission_testbeds.map((testbed) => (
                      <span
                        key={testbed}
                        className="rounded border border-[#F5B82E]/35 bg-[#F5B82E]/10 px-2 py-0.5 text-[10px] text-slate-200"
                      >
                        {testbed}
                      </span>
                    ))}
                  </div>
                )}
              </details>

              <details className="group rounded-xl border border-[rgba(100,180,210,0.22)] bg-[#071018]/75 p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold text-[#F5B82E]">
                  <span>Límites científicos y diferencias ambientales</span>
                  <ChevronDown
                    className="h-4 w-4 text-[#94A3B8] transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                  {Object.entries(activeScore.analogy_breakdowns).map(
                    ([key, msg]) => (
                      <li key={key} className="leading-relaxed">
                        <strong className="text-[#F1F5F9] uppercase">
                          {key}:
                        </strong>{" "}
                        {msg}
                      </li>
                    )
                  )}
                </ul>
              </details>
            </div>

            {/* CTA: Abrir Comparación Científica */}
            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setTab("comparison");
                  if (onToggleExpand && !expanded) {
                    onToggleExpand();
                  }
                }}
                className="group flex flex-1 items-center justify-between rounded-xl border border-[#F5B82E] bg-[#F5B82E]/15 p-3 text-left text-xs font-semibold text-[#F5B82E] transition-colors hover:bg-[#F5B82E]/25"
              >
                <div>
                  <span className="block text-xs font-bold text-[#F1F5F9]">
                    Abrir Comparación Científica (3 Columnas)
                  </span>
                  <span className="text-[11px] font-normal text-slate-300">
                    Tierra vs. {activeTarget.name.split("/")[0]}
                  </span>
                </div>
                <ArrowRight
                  className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* Export Dossier */}
            <div
              className="grid grid-cols-2 gap-2"
              role="group"
              aria-label="Exportar dossier del sitio seleccionado"
            >
              <button
                type="button"
                onClick={() =>
                  downloadDossier(dataset, rawSite, resolvedTargetId, "json")
                }
                className="min-h-10 rounded-lg border border-[rgba(100,180,210,0.3)] bg-[#132434]/50 px-2.5 py-1.5 text-xs font-medium text-[#00D9F5] hover:bg-[#132434]"
              >
                Exportar JSON
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadDossier(dataset, rawSite, resolvedTargetId, "md")
                }
                className="min-h-10 rounded-lg border border-[rgba(100,180,210,0.3)] bg-[#132434]/50 px-2.5 py-1.5 text-xs font-medium text-[#00D9F5] hover:bg-[#132434]"
              >
                Exportar Markdown
              </button>
            </div>
          </div>
        ) : tab === "satellites" ? (
          <div className="space-y-3.5">
            {/* Satellite Observatory Banner */}
            <div className="rounded-xl border border-[#55527D]/40 bg-[#27233E]/60 p-3.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#C5A36D]/50 bg-[#C5A36D]/15 text-[#C5A36D]">
                  <Satellite className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-semibold text-[#E4DFD5]">
                    Satellite Observatory
                  </h3>
                  <p className="font-mono text-[10px] text-[#A3A1BD]">
                    Misiones orbitales · Perfil óptico, radar SAR y térmico
                  </p>
                </div>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-[#E4DFD5]/90">
                {site.satellite_observatory?.summary ??
                  "Perfil satelital multiespectral para caracterización del sitio análogo sin alterar el cálculo ASI."}
              </p>
            </div>

            {/* 1. Sensor Óptico / Multiespectral */}
            <div className="rounded-xl border border-[#55527D]/35 bg-[#181B2C]/90 p-3.5">
              <div className="flex items-center justify-between border-b border-[#55527D]/30 pb-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
                  <span className="font-serif text-xs font-semibold text-[#E4DFD5]">
                    1. Óptico / Multiespectral
                  </span>
                </div>
                <span className="rounded border border-[#38BDF8]/40 bg-[#38BDF8]/15 px-1.5 py-0.5 font-mono text-[10px] text-[#38BDF8]">
                  VNIR / SWIR
                </span>
              </div>
              <div className="mt-2.5 space-y-2 text-xs">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-[#A3A1BD]">Misión / Sensor:</span>
                  <span className="font-semibold text-[#E4DFD5]">
                    {site.satellite_observatory?.optical.mission} · {site.satellite_observatory?.optical.instrument}
                  </span>
                </div>
                {site.satellite_observatory?.optical.spectrum && (
                  <div>
                    <span className="block font-mono text-[10px] text-[#A3A1BD]">Espectro y Bandas:</span>
                    <span className="text-[11px] text-[#E4DFD5]">
                      {site.satellite_observatory.optical.spectrum}
                    </span>
                  </div>
                )}
                <div>
                  <span className="block font-mono text-[10px] text-[#A3A1BD]">Información Recolectada:</span>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[#A3A1BD]">
                    {site.satellite_observatory?.optical.collects}
                  </p>
                </div>
                <div className="rounded-lg border border-[#55527D]/25 bg-[#101321]/60 p-2">
                  <span className="block font-mono text-[10px] text-[#C5A36D]">Aplicación al Análogo:</span>
                  <p className="mt-0.5 text-[11px] text-[#E4DFD5]">
                    {site.satellite_observatory?.optical.site_application}
                  </p>
                </div>
                {site.satellite_observatory?.optical.limitations && (
                  <p className="text-[10px] italic text-[#A3A1BD]/80">
                    Límites: {site.satellite_observatory.optical.limitations}
                  </p>
                )}
                {site.satellite_observatory?.optical.source_url && (
                  <a
                    href={site.satellite_observatory.optical.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[10px] text-[#38BDF8] underline decoration-[#38BDF8]/40 underline-offset-2 hover:text-[#C5A36D]"
                  >
                    <span>Documentación oficial de la misión</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>

            {/* 2. Sensor Radar SAR */}
            <div className="rounded-xl border border-[#55527D]/35 bg-[#181B2C]/90 p-3.5">
              <div className="flex items-center justify-between border-b border-[#55527D]/30 pb-2">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-[#C5A36D]" aria-hidden="true" />
                  <span className="font-serif text-xs font-semibold text-[#E4DFD5]">
                    2. Radar de Apertura Sintética (SAR)
                  </span>
                </div>
                <span className="rounded border border-[#C5A36D]/40 bg-[#C5A36D]/15 px-1.5 py-0.5 font-mono text-[10px] text-[#C5A36D]">
                  Microondas
                </span>
              </div>
              <div className="mt-2.5 space-y-2 text-xs">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-[#A3A1BD]">Misión / Sensor:</span>
                  <span className="font-semibold text-[#E4DFD5]">
                    {site.satellite_observatory?.radar_sar.mission} · {site.satellite_observatory?.radar_sar.instrument}
                  </span>
                </div>
                {site.satellite_observatory?.radar_sar.band && (
                  <div>
                    <span className="block font-mono text-[10px] text-[#A3A1BD]">Banda de Frecuencia:</span>
                    <span className="text-[11px] text-[#E4DFD5]">
                      {site.satellite_observatory.radar_sar.band}
                    </span>
                  </div>
                )}
                <div>
                  <span className="block font-mono text-[10px] text-[#A3A1BD]">Información Recolectada:</span>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[#A3A1BD]">
                    {site.satellite_observatory?.radar_sar.collects}
                  </p>
                </div>
                <div className="rounded-lg border border-[#55527D]/25 bg-[#101321]/60 p-2">
                  <span className="block font-mono text-[10px] text-[#C5A36D]">Aplicación al Análogo:</span>
                  <p className="mt-0.5 text-[11px] text-[#E4DFD5]">
                    {site.satellite_observatory?.radar_sar.site_application}
                  </p>
                </div>
                {site.satellite_observatory?.radar_sar.limitations && (
                  <p className="text-[10px] italic text-[#A3A1BD]/80">
                    Límites: {site.satellite_observatory.radar_sar.limitations}
                  </p>
                )}
                {site.satellite_observatory?.radar_sar.source_url && (
                  <a
                    href={site.satellite_observatory.radar_sar.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[10px] text-[#C5A36D] underline decoration-[#C5A36D]/40 underline-offset-2 hover:text-[#38BDF8]"
                  >
                    <span>Documentación oficial de la misión</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>

            {/* 3. Sensor Infrarrojo Térmico TIR */}
            <div className="rounded-xl border border-[#55527D]/35 bg-[#181B2C]/90 p-3.5">
              <div className="flex items-center justify-between border-b border-[#55527D]/30 pb-2">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-[#E07A5F]" aria-hidden="true" />
                  <span className="font-serif text-xs font-semibold text-[#E4DFD5]">
                    3. Infrarrojo Térmico (TIR)
                  </span>
                </div>
                <span className="rounded border border-[#E07A5F]/40 bg-[#E07A5F]/15 px-1.5 py-0.5 font-mono text-[10px] text-[#E07A5F]">
                  Radiometría TIR
                </span>
              </div>
              <div className="mt-2.5 space-y-2 text-xs">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-[#A3A1BD]">Misión / Sensor:</span>
                  <span className="font-semibold text-[#E4DFD5]">
                    {site.satellite_observatory?.thermal_tir.mission} · {site.satellite_observatory?.thermal_tir.instrument}
                  </span>
                </div>
                {site.satellite_observatory?.thermal_tir.spectrum && (
                  <div>
                    <span className="block font-mono text-[10px] text-[#A3A1BD]">Espectro y Bandas:</span>
                    <span className="text-[11px] text-[#E4DFD5]">
                      {site.satellite_observatory.thermal_tir.spectrum}
                    </span>
                  </div>
                )}
                <div>
                  <span className="block font-mono text-[10px] text-[#A3A1BD]">Información Recolectada:</span>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[#A3A1BD]">
                    {site.satellite_observatory?.thermal_tir.collects}
                  </p>
                </div>
                <div className="rounded-lg border border-[#55527D]/25 bg-[#101321]/60 p-2">
                  <span className="block font-mono text-[10px] text-[#C5A36D]">Aplicación al Análogo:</span>
                  <p className="mt-0.5 text-[11px] text-[#E4DFD5]">
                    {site.satellite_observatory?.thermal_tir.site_application}
                  </p>
                </div>
                {site.satellite_observatory?.thermal_tir.limitations && (
                  <p className="text-[10px] italic text-[#A3A1BD]/80">
                    Límites: {site.satellite_observatory.thermal_tir.limitations}
                  </p>
                )}
                {site.satellite_observatory?.thermal_tir.source_url && (
                  <a
                    href={site.satellite_observatory.thermal_tir.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[10px] text-[#E07A5F] underline decoration-[#E07A5F]/40 underline-offset-2 hover:text-[#C5A36D]"
                  >
                    <span>Documentación oficial de la misión</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <SideBySideComparison
            site={site}
            target={activeTarget}
            activeScore={activeScore}
            references={references}
            onSelectTarget={onSelectTarget}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
          />
        )}
      </div>
    </aside>
  );
}
