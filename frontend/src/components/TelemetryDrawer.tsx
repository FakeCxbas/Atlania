"use client";

import { useEffect, useState } from "react";
import type { AnalogSite, DimensionScores, TargetProfile } from "@/types/analog";
import { SideBySideComparison } from "@/components/SideBySideComparison";
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
} from "lucide-react";

import { translateSite, translateTarget } from "@/lib/spanishTranslations";

interface TelemetryDrawerProps {
  site: AnalogSite | null;
  references: Record<string, TargetProfile>;
  activeTargetId: string;
  onSelectTarget: (targetId: string) => void;
  onClose?: () => void;
  initialTab?: "overview" | "comparison";
}

const DIMENSION_LABELS: { key: keyof DimensionScores; label: string }[] = [
  { key: "topography", label: "Topografía y Pendiente" },
  { key: "geology", label: "Geología y Mineralogía" },
  { key: "thermal", label: "Régimen Térmico" },
  { key: "hydrology_ice", label: "Sequedad / Hielo" },
  { key: "subsurface_ops", label: "Subterráneo / Refugio" },
];

export function TelemetryDrawer({
  site: rawSite,
  references,
  activeTargetId,
  onSelectTarget,
  onClose,
  initialTab = "overview",
}: TelemetryDrawerProps) {
  const [tab, setTab] = useState<"overview" | "comparison">(initialTab);

  // Keyboard navigation: Escape key closes the drawer
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
        <Compass className="mb-3 h-8 w-8 text-[#D4AF37]" aria-hidden="true" />
        <h2 className="text-base font-semibold text-slate-100">
          Selecciona un Sitio Análogo
        </h2>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-400">
          Haz clic en cualquier punto del mapa o búscalo en el filtro superior
          para explorar su telemetría NASA POWER y la comparación lado a lado con la Luna o Marte.
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
  const accentText = isMars ? "text-[#E07A5F]" : "text-cyan-400";
  const accentBar = isMars ? "bg-[#E07A5F]" : "bg-cyan-400";
  const diurnalSwing = site.climatology.tmax_c - site.climatology.tmin_c;
  const meanTemp = (site.climatology.tmax_c + site.climatology.tmin_c) / 2;

  return (
    <aside
      aria-label={`Ficha técnica para ${site.name}`}
      className="flex h-full flex-col overflow-hidden bg-[#0D1424]/95 text-slate-100 backdrop-blur-md"
    >
      {/* Header with Gold Accents */}
      <div className="relative border-b border-[#D4AF37]/30 bg-[#060913]/70 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-[#D4AF37] uppercase">
                {site.country}
              </span>
              <span
                className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium ${
                  bestTarget?.body === "Mars"
                    ? "border-[#E07A5F]/40 bg-[#E07A5F]/15 text-[#E07A5F]"
                    : "border-cyan-500/40 bg-cyan-500/15 text-cyan-300"
                }`}
              >
                Mejor coincidencia: {bestTarget?.body === "Mars" ? "Marte" : "Luna"}
              </span>
            </div>
            <h2 className="mt-1.5 text-base font-bold leading-snug tracking-tight text-slate-100 sm:text-lg">
              {site.name}
            </h2>
          </div>

          {/* Close button (Esc) */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ficha de sitio (Escape)"
              title="Cerrar (Esc)"
              className="rounded-lg border border-slate-700/80 bg-slate-800/60 p-1.5 text-slate-300 transition-colors hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/15 hover:text-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Quick HUD coordinates bar */}
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border border-slate-800 bg-[#0D1424]/80 p-2 text-[11px]">
          <div>
            <span className="block text-slate-400">Coordenadas</span>
            <span className="font-mono tabular-nums text-slate-200">
              {site.latitude.toFixed(2)}°, {site.longitude.toFixed(2)}°
            </span>
          </div>
          <div>
            <span className="block text-slate-400">Elevación</span>
            <span className="font-mono tabular-nums text-slate-200">
              {site.elevation_m.toLocaleString()} m
            </span>
          </div>
          <div className="text-right">
            <span className="block text-slate-400">Índice ASI</span>
            <span className="font-mono font-bold tabular-nums text-[#D4AF37]">
              {activeScore.overall_asi.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Tabs: Resumen General vs Comparación Lado a Lado */}
        <div className="mt-3 flex gap-1 rounded-lg border border-slate-800 bg-[#060913] p-1">
          <button
            type="button"
            onClick={() => setTab("overview")}
            aria-selected={tab === "overview"}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
              tab === "overview"
                ? "border border-[#D4AF37]/60 bg-[#D4AF37]/20 text-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Resumen General
          </button>
          <button
            type="button"
            onClick={() => setTab("comparison")}
            aria-selected={tab === "comparison"}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all ${
              tab === "comparison"
                ? "border border-[#D4AF37]/60 bg-[#D4AF37]/20 text-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
            Comparación Lado a Lado
          </button>
        </div>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "overview" ? (
          <div className="space-y-4">
            {/* User Friendly Overview Card */}
            <div className="rounded-xl border border-slate-800/90 bg-[#060913]/60 p-3.5">
              <span className="text-[11px] font-semibold tracking-wider text-[#D4AF37] uppercase">
                ¿Por qué es un análogo espacial?
              </span>
              <p className="mt-1 text-xs leading-relaxed text-slate-200">
                {site.rationale}
              </p>
            </div>

            {/* CTA: Go to Side-by-Side Comparison */}
            <button
              type="button"
              onClick={() => setTab("comparison")}
              className="group flex w-full items-center justify-between rounded-xl border border-[#D4AF37] bg-gradient-to-r from-[#D4AF37]/25 to-amber-500/10 p-3.5 text-left text-xs font-semibold text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all hover:bg-[#D4AF37]/30 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            >
              <div>
                <span className="block text-sm font-bold text-slate-100">
                  Ver Comparación Lado a Lado
                </span>
                <span className="text-[11px] font-normal text-slate-300">
                  Explorar brechas de temperatura, sequedad, pendiente y gravedad con {activeTarget.body}
                </span>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </button>

            {/* Telemetry NASA POWER Overview */}
            <div className="rounded-xl border border-slate-800/90 bg-[#060913]/60 p-3.5">
              <div className="mb-2.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <Thermometer className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                  Telemetría NASA POWER
                </span>
                <span className="font-mono text-[11px] text-cyan-400">
                  {site.climatology.source === "nasa_power" ? "LIVE DATA" : "FALLBACK"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-slate-800/80 bg-[#0D1424]/70 p-2">
                  <span className="block text-[11px] text-slate-400">Temp. Media</span>
                  <span className="font-mono text-sm font-bold tabular-nums text-slate-100">
                    {meanTemp.toFixed(1)}°C
                  </span>
                </div>
                <div className="rounded-lg border border-slate-800/80 bg-[#0D1424]/70 p-2">
                  <span className="block text-[11px] text-slate-400">Amplitud Térmica</span>
                  <span className="font-mono text-sm font-bold tabular-nums text-slate-100">
                    Δ {diurnalSwing.toFixed(1)}°C
                  </span>
                </div>
                <div className="rounded-lg border border-slate-800/80 bg-[#0D1424]/70 p-2">
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Droplets className="h-3 w-3" aria-hidden="true" /> Lluvia
                  </span>
                  <span className="font-mono text-xs font-semibold tabular-nums text-slate-100">
                    {site.climatology.precipitation_mm_day.toFixed(2)} mm/d
                  </span>
                </div>
                <div className="rounded-lg border border-slate-800/80 bg-[#0D1424]/70 p-2">
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Wind className="h-3 w-3" aria-hidden="true" /> Viento / Humedad
                  </span>
                  <span className="font-mono text-xs font-semibold tabular-nums text-slate-100">
                    {site.climatology.wind_m_s.toFixed(1)} m/s · {site.climatology.relative_humidity_pct.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Topography Overview */}
            <div className="rounded-xl border border-slate-800/90 bg-[#060913]/60 p-3.5 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Mountain className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                Características del Terreno
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2 font-mono tabular-nums">
                <div className="rounded-lg border border-slate-800/80 bg-[#0D1424]/70 p-2">
                  <span className="block text-[11px] text-slate-400 font-sans">Pendiente</span>
                  <span className="text-sm font-bold text-slate-100">
                    {site.terrain.slope_deg.toFixed(1)}°
                  </span>
                </div>
                <div className="rounded-lg border border-slate-800/80 bg-[#0D1424]/70 p-2">
                  <span className="block text-[11px] text-slate-400 font-sans">Rugosidad (0-1)</span>
                  <span className="text-sm font-bold text-slate-100">
                    {site.terrain.roughness.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick 5-Axis summary bars */}
            <div className="rounded-xl border border-slate-800/90 bg-[#060913]/60 p-3.5">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <Layers className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                  Afinidad ASI frente a {activeTarget.name.split("/")[0]}
                </span>
                <span className={`font-mono font-bold tabular-nums ${accentText}`}>
                  {activeScore.overall_asi.toFixed(1)}%
                </span>
              </div>
              <div className="space-y-2">
                {DIMENSION_LABELS.map(({ key, label }) => {
                  const val = activeScore.dimensions[key];
                  return (
                    <div key={key}>
                      <div className="mb-1 flex justify-between text-[11px]">
                        <span className="text-slate-300">{label}</span>
                        <span className="font-mono tabular-nums text-slate-300">
                          {val.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full ${accentBar}`}
                          style={{ width: `${Math.min(100, Math.max(0, val))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Tab 2: Full Side-by-Side Comparison */
          <SideBySideComparison
            site={site}
            target={activeTarget}
            activeScore={activeScore}
            references={references}
            onSelectTarget={onSelectTarget}
          />
        )}
      </div>
    </aside>
  );
}
