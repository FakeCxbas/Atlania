"use client";

import type { AnalogSite, DimensionScores, TargetProfile } from "@/types/analog";
import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  ExternalLink,
  Layers,
  Thermometer,
  Wind,
} from "lucide-react";

interface TelemetryDrawerProps {
  site: AnalogSite | null;
  references: Record<string, TargetProfile>;
  activeTargetId: string;
  onSelectTarget: (targetId: string) => void;
}

const DIMENSION_LABELS: { key: keyof DimensionScores; label: string }[] = [
  { key: "topography", label: "Topography & Slope" },
  { key: "geology", label: "Geology & Mineralogy" },
  { key: "thermal", label: "Thermal Regime" },
  { key: "hydrology_ice", label: "Aridity / Ice Potential" },
  { key: "subsurface_ops", label: "Subsurface & Ops" },
];

export function TelemetryDrawer({
  site,
  references,
  activeTargetId,
  onSelectTarget,
}: TelemetryDrawerProps) {
  if (!site) {
    return (
      <aside
        aria-label="Site telemetry details"
        className="flex h-full flex-col items-center justify-center border-l border-slate-800/80 bg-[#0D1424]/95 p-6 text-center backdrop-blur-md"
      >
        <Compass className="mb-3 h-8 w-8 text-cyan-400" aria-hidden="true" />
        <h2 className="text-base font-semibold text-slate-100">
          Select an Analog Site
        </h2>
        <p className="mt-1 max-w-xs text-sm text-slate-400">
          Choose a location from the directory or map to inspect its 5-axis
          Analog Similarity Index, NASA POWER climatology, and analogy limits.
        </p>
      </aside>
    );
  }

  const resolvedTargetId = site.scores[activeTargetId]
    ? activeTargetId
    : site.best_target;
  const activeScore = site.scores[resolvedTargetId];
  const activeTarget = references[resolvedTargetId];
  const bestTarget = references[site.best_target];

  const isMars = activeTarget?.body === "Mars";
  const accentText = isMars ? "text-[#E07A5F]" : "text-cyan-400";
  const accentBar = isMars ? "bg-[#E07A5F]" : "bg-cyan-400";
  const diurnalSwing = site.climatology.tmax_c - site.climatology.tmin_c;

  return (
    <aside
      aria-label={`Telemetry for ${site.name}`}
      className="flex h-full flex-col overflow-y-auto border-l border-slate-800/80 bg-[#0D1424]/95 p-5 backdrop-blur-md"
    >
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center rounded border border-slate-700/80 bg-slate-900/80 px-2 py-0.5 text-xs font-medium text-slate-300">
              {site.country}
            </span>
            <h2 className="mt-2 text-lg font-semibold leading-snug text-slate-100">
              {site.name}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              {site.rationale}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span className="block text-xs text-slate-400">ASI Score</span>
            <span
              className={`font-mono text-2xl font-bold tabular-nums ${accentText}`}
            >
              {activeScore.overall_asi.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 rounded border border-slate-800/80 bg-[#060913]/70 p-2.5 text-xs">
          <div>
            <span className="block text-slate-400">Lat / Lon</span>
            <span className="font-mono tabular-nums text-slate-200">
              {site.latitude.toFixed(2)}°, {site.longitude.toFixed(2)}°
            </span>
          </div>
          <div>
            <span className="block text-slate-400">Elevation</span>
            <span className="font-mono tabular-nums text-slate-200">
              {site.elevation_m.toLocaleString()} m
            </span>
          </div>
          <div>
            <span className="block text-slate-400">Best Match</span>
            <span className={`font-medium ${accentText}`}>
              {bestTarget?.body ?? "Moon"}
            </span>
          </div>
        </div>
      </div>

      {/* Target Selector for Cross-Comparison */}
      <div className="border-b border-slate-800/80 py-4">
        <label
          htmlFor="target-compare-select"
          className="mb-1.5 block text-xs font-medium text-slate-300"
        >
          Compare Against Extraterrestrial Target
        </label>
        <select
          id="target-compare-select"
          value={resolvedTargetId}
          onChange={(e) => onSelectTarget(e.target.value)}
          className="w-full rounded border border-slate-700 bg-[#060913] px-3 py-2 text-sm text-slate-100"
        >
          {Object.entries(site.scores).map(([targetId, score]) => {
            const ref = references[targetId];
            return (
              <option key={targetId} value={targetId}>
                {ref?.name ?? targetId} ({ref?.body ?? "?"}) —{" "}
                {score.overall_asi.toFixed(1)}% ASI
              </option>
            );
          })}
        </select>
        {activeTarget && (
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            {activeTarget.context} Mean{" "}
            <span className="font-mono tabular-nums text-slate-300">
              {activeTarget.temperature_mean_c}°C
            </span>
            .{" "}
            <a
              href={activeTarget.source_url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-cyan-400 hover:underline"
            >
              NASA Reference
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </p>
        )}
      </div>

      {/* 5-Axis ASI Breakdown */}
      <div className="border-b border-slate-800/80 py-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Layers className="h-4 w-4 text-cyan-400" aria-hidden="true" />
          <span>5-Axis Similarity Breakdown</span>
        </div>
        <div className="space-y-2.5">
          {DIMENSION_LABELS.map(({ key, label }) => {
            const val = activeScore.dimensions[key];
            return (
              <div key={key}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-slate-300">{label}</span>
                  <span className="font-mono tabular-nums text-slate-200">
                    {val.toFixed(1)} / 100
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

      {/* NASA POWER Climatology */}
      <div className="border-b border-slate-800/80 py-4">
        <div className="mb-2.5 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-semibold text-slate-200">
            <Thermometer className="h-4 w-4 text-cyan-400" aria-hidden="true" />
            NASA POWER Telemetry
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            {site.climatology.source === "nasa_power"
              ? "LIVE CLIMATOLOGY"
              : "FALLBACK CLIMATOLOGY"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded border border-slate-800/80 bg-[#060913]/60 p-2">
            <span className="block text-slate-400">Temp Range (Min/Max)</span>
            <span className="font-mono tabular-nums text-slate-100">
              {site.climatology.tmin_c.toFixed(1)}°C /{" "}
              {site.climatology.tmax_c.toFixed(1)}°C
            </span>
          </div>
          <div className="rounded border border-slate-800/80 bg-[#060913]/60 p-2">
            <span className="block text-slate-400">Annual Temp Span</span>
            <span className="font-mono tabular-nums text-slate-100">
              Δ {diurnalSwing.toFixed(1)}°C
            </span>
          </div>
          <div className="rounded border border-slate-800/80 bg-[#060913]/60 p-2">
            <span className="block text-slate-400">Precipitation</span>
            <span className="font-mono tabular-nums text-slate-100">
              {site.climatology.precipitation_mm_day.toFixed(2)} mm/day
            </span>
          </div>
          <div className="rounded border border-slate-800/80 bg-[#060913]/60 p-2">
            <span className="flex items-center gap-1 text-slate-400">
              <Wind className="h-3 w-3" aria-hidden="true" /> Wind / RH
            </span>
            <span className="font-mono tabular-nums text-slate-100">
              {site.climatology.wind_m_s.toFixed(1)} m/s ·{" "}
              {site.climatology.relative_humidity_pct.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Analogy Strengths vs Breakdowns */}
      <div className="space-y-4 py-4 text-xs">
        <div>
          <h3 className="mb-1.5 flex items-center gap-1.5 font-semibold text-emerald-400">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Where the Analogy Holds
          </h3>
          {activeScore.analogy_strengths.length === 0 ? (
            <p className="text-slate-400">
              No dimension reached the 70/100 strength threshold for this
              target; switch to {bestTarget?.name ?? site.best_target} to see
              primary strengths.
            </p>
          ) : (
            <ul className="space-y-1.5 text-slate-300">
              {activeScore.analogy_strengths.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  • {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="mb-1.5 flex items-center gap-1.5 font-semibold text-amber-400">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Where the Analogy Breaks Down
          </h3>
          <ul className="space-y-1.5 text-slate-300">
            {Object.entries(activeScore.analogy_breakdowns).map(
              ([key, msg]) => (
                <li key={key} className="leading-relaxed">
                  • <span className="font-medium text-slate-200">{key}:</span>{" "}
                  {msg}
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
}
