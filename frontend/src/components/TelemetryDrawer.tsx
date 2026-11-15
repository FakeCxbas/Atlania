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
import { TerrainComparison3DModal } from "@/components/TerrainComparison3DModal";
import {
  TerrainDioramaModal,
  type TerrainDioramaTarget,
} from "@/components/TerrainDioramaModal";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  Mountain,
  Radio,
  Satellite,
  Thermometer,
  X,
} from "lucide-react";
import { translateSite, translateTarget } from "@/lib/spanishTranslations";

interface TelemetryDrawerProps {
  dataset: AnalogDataset;
  site: AnalogSite | null;
  references: Record<string, TargetProfile>;
  activeTargetId: string;
  onSelectTarget: (targetId: string) => void;
  onClose?: () => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onFeedback?: (message: string) => void;
}

const DIMENSION_LABELS: { key: keyof DimensionScores; label: string }[] = [
  { key: "topography", label: "Topografía y pendiente" },
  { key: "geology", label: "Geología y mineralogía" },
  { key: "thermal", label: "Régimen térmico" },
  { key: "hydrology_ice", label: "Aridez y potencial de hielo" },
  { key: "subsurface_ops", label: "Subsuelo y refugio" },
];

export function TelemetryDrawer({
  dataset,
  site: rawSite,
  references,
  activeTargetId,
  onSelectTarget,
  onClose,
  expanded = false,
  onToggleExpand,
  onFeedback,
}: TelemetryDrawerProps) {
  const [showComparison, setShowComparison] = useState(false);
  const [show3DComparison, setShow3DComparison] = useState(false);
  const [dioramaTarget, setDioramaTarget] = useState<TerrainDioramaTarget | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (expanded && onToggleExpand) {
          onToggleExpand();
          setShowComparison(false);
        } else if (showComparison) {
          setShowComparison(false);
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expanded, onToggleExpand, showComparison, onClose]);

  if (!rawSite) {
    return (
      <aside
        aria-label="Panel de ubicación"
        className="flex h-full flex-col items-center justify-center bg-[#121626] p-6 text-center"
      >
        <h2 className="font-serif text-lg font-semibold text-[#E4DFD5]">
          Selecciona un territorio análogo
        </h2>
        <p className="mt-2 max-w-xs text-xs leading-relaxed text-[#A3A1BD]">
          Haz clic en cualquier marcador del mapa o activa el sondeo de punto
          para inspeccionar sus métricas ambientales, satélites y analogía planetaria.
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
  const accentText = isMars ? "text-[#D47A61]" : "text-[#7CA5B8]";
  const accentBar = isMars ? "bg-[#D47A61]" : "bg-[#7CA5B8]";
  const diurnalSwing = site.climatology.tmax_c - site.climatology.tmin_c;
  const meanTemp = (site.climatology.tmax_c + site.climatology.tmin_c) / 2;
  const isLivePower = site.climatology.source === "nasa_power";
  const isLiveDem = site.dem_telemetry.source === "open_meteo";

  if (showComparison || expanded) {
    return (
      <aside
        aria-label={`Comparación planetaria para ${site.name}`}
        className="flex h-full flex-col overflow-hidden bg-[#101321] text-[#E4DFD5]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#55527D]/25 bg-[#121626] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                setShowComparison(false);
                if (expanded && onToggleExpand) {
                  onToggleExpand();
                }
              }}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#55527D]/35 bg-[#181B2C] px-3 py-1.5 text-xs font-medium text-[#E4DFD5] transition-colors hover:border-[#C5A36D]/50 hover:text-[#C5A36D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Volver al mapa</span>
            </button>
            <div className="min-w-0">
              <h2 className="truncate font-serif text-base font-semibold text-[#E4DFD5]">
                {site.name} vs. {activeTarget.name.split("/")[0].trim()}
              </h2>
              <p className="font-mono text-[11px] tabular-nums text-[#A3A1BD]">
                ASI {activeScore.overall_asi.toFixed(1)}% ·{" "}
                {isMars ? "Marte" : "Luna"}
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={() => {
                setShowComparison(false);
                onClose();
              }}
              aria-label="Cerrar comparación y volver al mapa"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#55527D]/30 text-[#A3A1BD] transition-colors hover:border-[#C5A36D]/50 hover:text-[#E4DFD5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <SideBySideComparison
            site={site}
            target={activeTarget}
            activeScore={activeScore}
            references={references}
            onSelectTarget={onSelectTarget}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
          />
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label={`Información de ${site.name}`}
      className="flex h-full flex-col overflow-hidden bg-[#121626] text-[#E4DFD5]"
    >
      {/* Bloque 1: Identificación y localización */}
      <div className="border-b border-[#55527D]/25 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium tracking-wider text-[#C5A36D] uppercase">
              Sitio seleccionado
            </p>
            <h2 className="mt-1 font-serif text-xl font-semibold leading-snug text-[#E4DFD5]">
              {site.name}
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#A3A1BD]">
              <span>{site.country}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-[#E4DFD5]/90">
                {site.latitude.toFixed(2)}°, {site.longitude.toFixed(2)}°
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {site.elevation_m.toLocaleString()} m
              </span>
            </p>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel de ubicación"
              title="Cerrar (Esc)"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#A3A1BD] transition-colors hover:bg-[#1F243B] hover:text-[#E4DFD5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium ${
              bestTarget?.body === "Mars"
                ? "bg-[#D47A61]/15 text-[#D47A61]"
                : "bg-[#7CA5B8]/15 text-[#7CA5B8]"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                bestTarget?.body === "Mars" ? "bg-[#D47A61]" : "bg-[#7CA5B8]"
              }`}
              aria-hidden="true"
            />
            Afinidad principal: {bestTarget?.body === "Mars" ? "Marte" : "Luna"}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] ${
              isLivePower
                ? "bg-[#6B9E8A]/15 text-[#8BC4AE]"
                : "bg-[#C5A36D]/15 text-[#C5A36D]"
            }`}
          >
            {isLivePower ? "NASA POWER en vivo" : "Datos de respaldo"}
          </span>
        </div>
      </div>

      {/* Contenido desplazable organizado en bloques editoriales */}
      <div className="flex-1 divide-y divide-[#55527D]/20 overflow-y-auto px-5">
        {/* Bloque 2: Características geográficas y ambientales */}
        <section aria-labelledby="block-characteristics" className="py-4">
          <div className="flex items-center justify-between">
            <h3
              id="block-characteristics"
              className="text-[11px] font-medium tracking-wider text-[#C5A36D] uppercase"
            >
              Características geográficas y ambientales
            </h3>
            <span className="font-mono text-[10px] text-[#A3A1BD]">
              {isLiveDem ? "Copernicus GLO-90" : "DEM previo"}
            </span>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
            <div>
              <dt className="text-[11px] text-[#A3A1BD]">Temperatura media</dt>
              <dd className="mt-0.5 font-mono font-medium tabular-nums text-[#E4DFD5]">
                {meanTemp.toFixed(1)} °C
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#A3A1BD]">Amplitud térmica</dt>
              <dd className="mt-0.5 font-mono font-medium tabular-nums text-[#E4DFD5]">
                Δ {diurnalSwing.toFixed(1)} °C
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#A3A1BD]">Precipitación</dt>
              <dd className="mt-0.5 font-mono font-medium tabular-nums text-[#E4DFD5]">
                {site.climatology.precipitation_mm_day.toFixed(2)} mm/d
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#A3A1BD]">Viento y humedad</dt>
              <dd className="mt-0.5 font-mono font-medium tabular-nums text-[#E4DFD5]">
                {site.climatology.wind_m_s.toFixed(1)} m/s ·{" "}
                {site.climatology.relative_humidity_pct.toFixed(0)}%
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#A3A1BD]">Irradiancia solar</dt>
              <dd className="mt-0.5 font-mono font-medium tabular-nums text-[#E4DFD5]">
                {site.climatology.solar_irradiance_kwh_m2_day.toFixed(2)} kWh/m²/d
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#A3A1BD]">Presión superficial</dt>
              <dd className="mt-0.5 font-mono font-medium tabular-nums text-[#E4DFD5]">
                {site.climatology.surface_pressure_kpa.toFixed(1)} kPa
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#A3A1BD]">Pendiente DEM</dt>
              <dd className="mt-0.5 font-mono font-medium tabular-nums text-[#E4DFD5]">
                {site.dem_telemetry.dem_slope_deg.toFixed(1)}°
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#A3A1BD]">Relieve (σ)</dt>
              <dd className="mt-0.5 font-mono font-medium tabular-nums text-[#E4DFD5]">
                {site.dem_telemetry.dem_roughness_m.toFixed(1)} m
              </dd>
            </div>
          </dl>

          <p className="mt-3 text-xs leading-relaxed text-[#E4DFD5]/85">
            {site.rationale}
          </p>

          {site.mission_testbeds.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {site.mission_testbeds.map((testbed) => (
                <span
                  key={testbed}
                  className="rounded-md bg-[#181B2C] px-2 py-0.5 text-[11px] text-[#A3A1BD] ring-1 ring-[#55527D]/25"
                >
                  {testbed}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Bloque 3: Índice de analogía y métricas */}
        <section aria-labelledby="block-asi" className="py-4">
          <div className="flex items-baseline justify-between">
            <h3
              id="block-asi"
              className="text-[11px] font-medium tracking-wider text-[#C5A36D] uppercase"
            >
              Índice de analogía (ASI)
            </h3>
            <span className={`font-mono text-lg font-semibold tabular-nums ${accentText}`}>
              {activeScore.overall_asi.toFixed(1)}%
            </span>
          </div>

          <div className="my-2">
            <AsiRadarChart
              dimensions={activeScore.dimensions}
              weights={activeScore.weights}
              isMars={isMars}
            />
          </div>

          <div className="space-y-2">
            {DIMENSION_LABELS.map(({ key, label }) => {
              const val = activeScore.dimensions[key];
              return (
                <div key={key}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-[#A3A1BD]">{label}</span>
                    <span className="font-mono tabular-nums text-[#E4DFD5]">
                      {val.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-[#1F243B]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${accentBar}`}
                      style={{ width: `${Math.min(100, Math.max(0, val))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <details className="group mt-3 rounded-lg bg-[#181B2C]/70 px-3 py-2">
            <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium text-[#A3A1BD] hover:text-[#E4DFD5]">
              <span>Límites científicos y diferencias ambientales</span>
              <ChevronDown
                className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <ul className="mt-2 space-y-1.5 border-t border-[#55527D]/20 pt-2 text-xs text-[#A3A1BD]">
              {Object.entries(activeScore.analogy_breakdowns).map(
                ([key, msg]) => (
                  <li key={key} className="leading-relaxed">
                    <strong className="font-medium text-[#E4DFD5] capitalize">
                      {key}:
                    </strong>{" "}
                    {msg}
                  </li>
                )
              )}
            </ul>
          </details>
        </section>

        {/* Bloque 4: Comparación con destinos lunares o marcianos */}
        <section aria-labelledby="block-compare" className="py-4">
          <h3
            id="block-compare"
            className="text-[11px] font-medium tracking-wider text-[#C5A36D] uppercase"
          >
            Comparar con destino planetario
          </h3>

          <div className="mt-2.5 space-y-2.5">
            <label htmlFor="target-selector" className="sr-only">
              Seleccionar destino lunar o marciano para comparar
            </label>
            <select
              id="target-selector"
              value={resolvedTargetId}
              onChange={(e) => {
                onSelectTarget(e.target.value);
                const nextRef = references[e.target.value];
                if (nextRef && onFeedback) {
                  onFeedback(
                    `Objetivo actualizado: ${nextRef.name.split("/")[0].trim()}`
                  );
                }
              }}
              className="min-h-10 w-full rounded-lg border border-[#55527D]/35 bg-[#181B2C] px-3 py-2 text-xs font-medium text-[#E4DFD5] transition-colors focus:border-[#C5A36D] focus:outline-none"
            >
              {Object.entries(references).map(([tId, ref]) => {
                const s = site.scores[tId]?.overall_asi ?? 0;
                return (
                  <option key={tId} value={tId} className="bg-[#121626] text-[#E4DFD5]">
                    {ref.body === "Mars" ? "Marte" : "Luna"} ·{" "}
                    {ref.name.split("/")[0].trim()} — {s.toFixed(1)}% ASI
                  </option>
                );
              })}
            </select>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setShow3DComparison(true)}
                className="group flex min-h-11 w-full items-center justify-between rounded-lg border border-[#7CA5B8]/50 bg-[#7CA5B8]/12 px-3.5 py-2.5 text-left text-xs font-medium text-[#E4DFD5] transition-colors hover:bg-[#7CA5B8]/22 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
              >
                <span className="flex items-center gap-2">
                  <Mountain className="h-4 w-4 text-[#7CA5B8]" aria-hidden="true" />
                  <span>Comparar superficies en 3D ({isMars ? "Marte" : "Luna"})</span>
                </span>
                <ArrowRight
                  className="h-4 w-4 text-[#7CA5B8] transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowComparison(true);
                  if (onToggleExpand && !expanded) {
                    onToggleExpand();
                  }
                }}
                className="group flex min-h-11 w-full items-center justify-between rounded-lg border border-[#C5A36D]/45 bg-[#C5A36D]/10 px-3.5 py-2.5 text-left text-xs font-medium text-[#E4DFD5] transition-colors hover:bg-[#C5A36D]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
              >
                <span>Comparar datos lado a lado</span>
                <ArrowRight
                  className="h-4 w-4 text-[#C5A36D] transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  setDioramaTarget({
                    name: site.name,
                    country: site.country,
                    latitude: site.latitude,
                    longitude: site.longitude,
                    asiScore: activeScore.overall_asi,
                  })
                }
                className="flex min-h-10 w-full items-center justify-between rounded-lg border border-[#55527D]/35 bg-[#181B2C] px-3.5 py-2 text-left text-xs font-medium text-[#A3A1BD] transition-colors hover:border-[#C5A36D]/45 hover:text-[#E4DFD5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
              >
                <span>Explorar relieve terrestre en 3D HD</span>
                <Mountain className="h-3.5 w-3.5 text-[#C5A36D]" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        {/* Bloque 5: Datos satelitales y fuentes */}
        <section aria-labelledby="block-satellites" className="py-4">
          <div className="flex items-center justify-between">
            <h3
              id="block-satellites"
              className="text-[11px] font-medium tracking-wider text-[#C5A36D] uppercase"
            >
              Datos satelitales y fuentes
            </h3>
            <Satellite className="h-3.5 w-3.5 text-[#A3A1BD]" aria-hidden="true" />
          </div>

          {site.satellite_observatory?.summary && (
            <p className="mt-2 text-xs leading-relaxed text-[#A3A1BD]">
              {site.satellite_observatory.summary}
            </p>
          )}

          <div className="mt-3 space-y-2">
            {[
              {
                id: "optical",
                title: "Óptico / Multiespectral",
                icon: <Satellite className="h-3.5 w-3.5 text-[#7CA5B8]" aria-hidden="true" />,
                sensor: site.satellite_observatory?.optical,
                extraLabel: "Espectro",
                extraValue: site.satellite_observatory?.optical.spectrum,
              },
              {
                id: "sar",
                title: "Radar de Apertura Sintética (SAR)",
                icon: <Radio className="h-3.5 w-3.5 text-[#C5A36D]" aria-hidden="true" />,
                sensor: site.satellite_observatory?.radar_sar,
                extraLabel: "Banda",
                extraValue: site.satellite_observatory?.radar_sar.band,
              },
              {
                id: "tir",
                title: "Infrarrojo Térmico (TIR)",
                icon: <Thermometer className="h-3.5 w-3.5 text-[#D47A61]" aria-hidden="true" />,
                sensor: site.satellite_observatory?.thermal_tir,
                extraLabel: "Espectro",
                extraValue: site.satellite_observatory?.thermal_tir.spectrum,
              },
            ].map(({ id, title, icon, sensor, extraLabel, extraValue }) => {
              if (!sensor) return null;
              return (
                <details
                  key={id}
                  className="group rounded-lg bg-[#181B2C]/70 px-3 py-2 text-xs"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-medium text-[#E4DFD5]">
                      {icon}
                      <span>{title}</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#A3A1BD]">
                      <span>{sensor.instrument}</span>
                      <ChevronDown
                        className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </span>
                  </summary>
                  <div className="mt-2 space-y-1.5 border-t border-[#55527D]/20 pt-2 text-[11px] text-[#A3A1BD]">
                    <p className="font-mono text-[#E4DFD5]">
                      {sensor.mission} · {sensor.instrument}
                    </p>
                    {extraValue && (
                      <p>
                        <span className="text-[#E4DFD5]/80">{extraLabel}:</span>{" "}
                        {extraValue}
                      </p>
                    )}
                    <p>{sensor.collects}</p>
                    <p className="text-[#E4DFD5]/90">
                      <span className="text-[#C5A36D]">Aplicación:</span>{" "}
                      {sensor.site_application}
                    </p>
                    {sensor.limitations && (
                      <p className="italic opacity-80">
                        Límites: {sensor.limitations}
                      </p>
                    )}
                    {sensor.source_url && (
                      <a
                        href={sensor.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[10px] text-[#7CA5B8] underline decoration-[#7CA5B8]/40 underline-offset-2 hover:text-[#C5A36D]"
                      >
                        <span>Documentación de la misión</span>
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        {/* Bloque 6: Acceso al informe de caracterización */}
        <section aria-labelledby="block-report" className="py-4">
          <h3
            id="block-report"
            className="text-[11px] font-medium tracking-wider text-[#C5A36D] uppercase"
          >
            Informe de caracterización
          </h3>
          <p className="mt-1 text-xs text-[#A3A1BD]">
            Descarga la ficha técnica completa con coordenadas, métricas ASI y fuentes.
          </p>

          <div
            className="mt-3 grid grid-cols-2 gap-2"
            role="group"
            aria-label="Exportar informe de caracterización"
          >
            <button
              type="button"
              onClick={() => {
                downloadDossier(dataset, rawSite, resolvedTargetId, "md");
                onFeedback?.(`Informe Markdown descargado: ${site.name}`);
              }}
              className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#55527D]/35 bg-[#181B2C] px-3 py-2 text-xs font-medium text-[#E4DFD5] transition-colors hover:border-[#C5A36D]/50 hover:text-[#C5A36D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Informe (.md)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                downloadDossier(dataset, rawSite, resolvedTargetId, "json");
                onFeedback?.(`Datos JSON descargados: ${site.name}`);
              }}
              className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#55527D]/35 bg-[#181B2C] px-3 py-2 text-xs font-medium text-[#E4DFD5] transition-colors hover:border-[#C5A36D]/50 hover:text-[#C5A36D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Datos (.json)</span>
            </button>
          </div>
        </section>
      </div>

      <TerrainComparison3DModal
        open={show3DComparison}
        onClose={() => setShow3DComparison(false)}
        site={site}
        target={activeTarget}
        references={references}
        overallAsi={activeScore.overall_asi}
        onSelectTarget={onSelectTarget}
      />

      <TerrainDioramaModal
        target={dioramaTarget}
        onClose={() => setDioramaTarget(null)}
      />
    </aside>
  );
}
