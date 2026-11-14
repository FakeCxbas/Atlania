"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { AnalogDataset, AnalogSite } from "@/types/analog";
import {
  buildSiteRationale,
  getPointTargetScore,
  rankRegionResult,
  summarizeRegionScan,
  type RegionBounds,
  type RegionEvaluationResult,
} from "@/lib/evaluateRegion";
import { AnalogMap } from "@/components/AnalogMap";
import { SiteDirectory } from "@/components/SiteDirectory";
import { TelemetryDrawer } from "@/components/TelemetryDrawer";
import { MethodologyDialog } from "@/components/MethodologyDialog";
import { downloadQgisGeoJson } from "@/lib/dossier";
import { Download, Globe2, Moon, Orbit, X } from "lucide-react";

interface MissionControlAppProps {
  dataset: AnalogDataset;
}

type BodyFilter = "ALL" | "Moon" | "Mars" | "ECUADOR";

export function MissionControlApp({ dataset }: MissionControlAppProps) {
  const [mobilePanel, setMobilePanel] = useState<
    "directory" | "telemetry" | null
  >(null);
  const directoryToggle = useRef<HTMLButtonElement>(null);
  const telemetryToggle = useRef<HTMLButtonElement>(null);
  const closePanel = () => {
    (mobilePanel === "directory"
      ? directoryToggle
      : telemetryToggle
    ).current?.focus();
    setMobilePanel(null);
  };
  const [bodyFilter, setBodyFilter] = useState<BodyFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(
    dataset.sites[0]?.id ?? null,
  );
  const [activeTargetId, setActiveTargetId] = useState<string>(
    dataset.sites[0]?.best_target ?? Object.keys(dataset.references)[0] ?? "",
  );

  const [probeMode, setProbeMode] = useState(false);
  const [isProbing, setIsProbing] = useState(false);
  const [probeSite, setProbeSite] = useState<AnalogSite | null>(null);

  const [regionProbeMode, setRegionProbeMode] = useState(false);
  const [isProbingRegion, setIsProbingRegion] = useState(false);
  const [regionGridSize, setRegionGridSize] = useState<3 | 4>(3);
  const [regionRankByActiveTarget, setRegionRankByActiveTarget] = useState(true);
  const [regionResult, setRegionResult] = useState<RegionEvaluationResult | null>(null);
  const [regionError, setRegionError] = useState<string | null>(null);

  const filteredSites = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dataset.sites.filter((site) => {
      const target = dataset.references[site.best_target];
      const body = target?.body ?? "Moon";

      if (bodyFilter === "Moon" && body !== "Moon") return false;
      if (bodyFilter === "Mars" && body !== "Mars") return false;
      if (bodyFilter === "ECUADOR" && site.country !== "Ecuador") return false;

      if (!q) return true;
      return (
        site.name.toLowerCase().includes(q) ||
        site.country.toLowerCase().includes(q) ||
        site.rationale.toLowerCase().includes(q) ||
        (target?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [dataset.sites, dataset.references, bodyFilter, searchQuery]);

  const mapSites = useMemo(
    () => (probeSite ? [...filteredSites, probeSite] : filteredSites),
    [filteredSites, probeSite]
  );

  const rankedRegionResult = useMemo(() => {
    if (!regionResult) return null;
    const targetId = regionRankByActiveTarget ? activeTargetId : null;
    return rankRegionResult(regionResult, targetId);
  }, [regionResult, regionRankByActiveTarget, activeTargetId]);

  const regionSummary = useMemo(() => {
    if (!rankedRegionResult) return null;
    const targetId = regionRankByActiveTarget ? activeTargetId : null;
    return summarizeRegionScan(rankedRegionResult.points, dataset.sites, targetId);
  }, [rankedRegionResult, dataset.sites, regionRankByActiveTarget, activeTargetId]);

  const selectedSite = useMemo(() => {
    if (probeSite && selectedSiteId === probeSite.id) return probeSite;
    const regionSite = rankedRegionResult?.points.find((p) => p.id === selectedSiteId);
    if (regionSite) return regionSite;
    return (
      filteredSites.find((s) => s.id === selectedSiteId) ??
      dataset.sites.find((s) => s.id === selectedSiteId) ??
      filteredSites[0] ??
      null
    );
  }, [filteredSites, dataset.sites, selectedSiteId, probeSite, rankedRegionResult]);

  const handleSelectSite = useCallback(
    (siteId: string) => {
      setSelectedSiteId(siteId);
      const regionSite = rankedRegionResult?.points.find((p) => p.id === siteId);
      const site =
        (probeSite && probeSite.id === siteId ? probeSite : null) ??
        regionSite ??
        dataset.sites.find((s) => s.id === siteId);
      if (site) {
        if (!regionSite || !regionRankByActiveTarget) {
          setActiveTargetId(site.best_target);
        }
        setMobilePanel("telemetry");
        if (window.matchMedia("(max-width: 1023px)").matches)
          telemetryToggle.current?.focus();
      }
    },
    [probeSite, rankedRegionResult, regionRankByActiveTarget, dataset.sites]
  );

  const handleProbeCoordinate = useCallback(async (lat: number, lon: number) => {
    setIsProbing(true);
    try {
      const res = await fetch(
        `/api/evaluate?lat=${encodeURIComponent(lat.toFixed(4))}&lon=${encodeURIComponent(lon.toFixed(4))}`
      );
      if (!res.ok) return;
      const payload = (await res.json()) as { site?: AnalogSite };
      if (payload.site) {
        setProbeSite(payload.site);
        setSelectedSiteId(payload.site.id);
        setActiveTargetId(payload.site.best_target);
        setProbeMode(false);
        setMobilePanel("telemetry");
      }
    } finally {
      setIsProbing(false);
    }
  }, []);

  const handleProbeRegion = useCallback(
    async (bounds: RegionBounds) => {
      setIsProbingRegion(true);
      setRegionError(null);
      try {
        const params = new URLSearchParams({
          minLat: bounds.minLat.toString(),
          maxLat: bounds.maxLat.toString(),
          minLon: bounds.minLon.toString(),
          maxLon: bounds.maxLon.toString(),
          gridSize: regionGridSize.toString(),
        });
        if (regionRankByActiveTarget && activeTargetId) {
          params.set("targetId", activeTargetId);
        }
        const res = await fetch(`/api/evaluate-region?${params.toString()}`);
        const payload = (await res.json()) as RegionEvaluationResult & { error?: string };
        if (!res.ok) {
          setRegionError(payload.error ?? "Region scan failed.");
          return;
        }
        setRegionResult(payload);
        setRegionProbeMode(false);
        if (payload.points[0]) {
          setSelectedSiteId(payload.points[0].id);
          if (!regionRankByActiveTarget) {
            setActiveTargetId(payload.points[0].best_target);
          }
        }
      } catch {
        setRegionError("Unable to reach region evaluation service.");
      } finally {
        setIsProbingRegion(false);
      }
    },
    [regionGridSize, regionRankByActiveTarget, activeTargetId]
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#060913] text-slate-100">
      <a
        href="#main-workspace"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-cyan-500 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950"
      >
        Skip to workspace
      </a>

      {/* Top Mission Control Header */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-[#0D1424]/95 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-400">
            <Orbit className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-100">
              TERR-ANALOG // Planetary Analog Explorer
            </h1>
            <p className="text-xs text-slate-400">
              NASA Space Apps 2026 ·{" "}
              {dataset.methodology.source_counts.nasa_power} NASA POWER +{" "}
              {dataset.methodology.source_counts.fallback} Fallback
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Filter analog sites by planetary target or region"
        >
          {(
            [
              { id: "ALL", label: "All Sites", icon: Globe2 },
              { id: "Moon", label: "Moon Analogs", icon: Moon },
              { id: "Mars", label: "Mars Analogs", icon: Orbit },
              { id: "ECUADOR", label: "Ecuador", icon: Globe2 },
            ] as const
          ).map(({ id, label, icon: Icon }) => {
            const active = bodyFilter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setBodyFilter(id)}
                aria-pressed={active}
                className={`inline-flex min-h-[38px] items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-cyan-500/70 bg-cyan-500/15 text-cyan-300"
                    : "border-slate-800 bg-[#060913]/60 text-slate-300 hover:border-slate-700 hover:text-slate-100"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const exportSites = regionResult
                ? [...mapSites, ...regionResult.points]
                : mapSites;
              downloadQgisGeoJson(
                exportSites,
                dataset.references,
                regionResult
                  ? "planetary-analogs-region-qgis.geojson"
                  : "planetary-analogs-qgis.geojson",
              );
            }}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded border border-slate-700 bg-[#060913]/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-500/60 hover:text-cyan-300"
            title="Download EPSG:4326 GeoJSON layer for QGIS"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Export GeoJSON
          </button>
          <MethodologyDialog dataset={dataset} />
        </div>
      </header>

      <div
        className="flex shrink-0 gap-2 border-b border-slate-800 bg-[#0D1424] px-3 py-2 lg:hidden"
        aria-label="Mobile workspace panels"
      >
        <button
          ref={directoryToggle}
          type="button"
          aria-expanded={mobilePanel === "directory"}
          aria-controls="site-directory-panel"
          onClick={() =>
            setMobilePanel(mobilePanel === "directory" ? null : "directory")
          }
          className="min-h-11 flex-1 rounded border border-slate-600 px-3 text-sm"
        >
          Directory ({filteredSites.length})
        </button>
        <button
          ref={telemetryToggle}
          type="button"
          aria-expanded={mobilePanel === "telemetry"}
          aria-controls="site-telemetry-panel"
          onClick={() =>
            setMobilePanel(mobilePanel === "telemetry" ? null : "telemetry")
          }
          className="min-h-11 flex-1 rounded border border-slate-600 px-3 text-sm"
        >
          Telemetry
        </button>
      </div>

      {/* Main 3-Pane Workspace */}
      <main
        id="main-workspace"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (
            event.key === "Escape" &&
            mobilePanel &&
            window.matchMedia("(max-width: 1023px)").matches
          ) {
            event.preventDefault();
            closePanel();
          }
        }}
        className="relative grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[310px_1fr_390px]"
      >
        <div
          id="site-directory-panel"
          className={`absolute inset-x-0 bottom-0 z-20 h-[60%] min-h-0 flex-col overflow-hidden border-t border-slate-600 bg-[#0D1424] lg:static lg:order-1 lg:z-auto lg:flex lg:h-full lg:border-t-0 ${mobilePanel === "directory" ? "flex" : "hidden"}`}
        >
          <button
            type="button"
            onClick={closePanel}
            className="min-h-11 shrink-0 border-b border-slate-700 px-4 text-left text-sm text-cyan-300 lg:hidden"
          >
            Close directory · Back to map
          </button>
          <div className="min-h-0 flex-1">
            <SiteDirectory
              sites={filteredSites}
              references={dataset.references}
              selectedSiteId={selectedSite?.id ?? null}
              onSelectSite={handleSelectSite}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
        </div>

        <div className="relative min-h-0 min-w-0 overflow-hidden lg:order-2">
          <AnalogMap
            sites={mapSites}
            references={dataset.references}
            selectedSiteId={selectedSite?.id ?? null}
            onSelectSite={handleSelectSite}
            probeMode={probeMode}
            isProbing={isProbing}
            onToggleProbeMode={() => {
              setProbeMode((prev) => !prev);
              setRegionProbeMode(false);
            }}
            onProbeCoordinate={handleProbeCoordinate}
            regionProbeMode={regionProbeMode}
            isProbingRegion={isProbingRegion}
            regionGridSize={regionGridSize}
            onChangeRegionGridSize={setRegionGridSize}
            onToggleRegionProbeMode={() => {
              setRegionProbeMode((prev) => !prev);
              setProbeMode(false);
            }}
            onProbeRegion={handleProbeRegion}
            regionResult={rankedRegionResult}
          />

          {(rankedRegionResult || regionError) && (
            <section
              aria-label="Region scan analog results"
              className="absolute bottom-14 right-3 z-10 w-88 max-w-[calc(100%-1.5rem)] rounded-md border border-slate-700/80 bg-[#0D1424]/95 p-3 text-xs text-slate-200 shadow-lg backdrop-blur-md"
            >
              <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                <div>
                  <h2 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
                    {regionError
                      ? "Region Scan Error"
                      : `Prospecting · ${rankedRegionResult?.grid_size ?? 3}×${rankedRegionResult?.grid_size ?? 3} (${rankedRegionResult?.evaluated_count ?? 0} pts)`}
                  </h2>
                  {!regionError && rankedRegionResult && (
                    <p className="mt-0.5 font-mono text-[10px] text-slate-400 tabular-nums">
                      {rankedRegionResult.bounds.minLat.toFixed(2)}°..
                      {rankedRegionResult.bounds.maxLat.toFixed(2)}°N,{" "}
                      {rankedRegionResult.bounds.minLon.toFixed(2)}°..
                      {rankedRegionResult.bounds.maxLon.toFixed(2)}°E
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!regionError && rankedRegionResult && (
                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob(
                          [JSON.stringify(rankedRegionResult.geojson, null, 2)],
                          { type: "application/geo+json" }
                        );
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `region-prospecting-${rankedRegionResult.grid_size}x${rankedRegionResult.grid_size}.geojson`;
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                      title="Export region scan GeoJSON"
                      aria-label="Export region scan GeoJSON"
                      className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-cyan-300"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setRegionResult(null);
                      setRegionError(null);
                    }}
                    aria-label="Clear region scan"
                    className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {regionError ? (
                <p className="text-rose-300">{regionError}</p>
              ) : (
                <>
                  <div className="mb-2 flex items-center justify-between gap-1.5">
                    <span className="text-[11px] text-slate-400">Rank by:</span>
                    <div
                      className="flex items-center rounded border border-slate-800 bg-[#060913]/80 p-0.5"
                      role="group"
                      aria-label="Region ranking mode"
                    >
                      <button
                        type="button"
                        onClick={() => setRegionRankByActiveTarget(true)}
                        aria-pressed={regionRankByActiveTarget}
                        className={`whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                          regionRankByActiveTarget
                            ? "bg-cyan-500/20 text-cyan-200"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {(dataset.references[activeTargetId]?.name ?? "Active Target").split(" / ")[0]}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegionRankByActiveTarget(false)}
                        aria-pressed={!regionRankByActiveTarget}
                        className={`whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                          !regionRankByActiveTarget
                            ? "bg-cyan-500/20 text-cyan-200"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Best Match
                      </button>
                    </div>
                  </div>

                  {regionSummary && (
                    <div className="mb-2 rounded border border-slate-800/90 bg-[#060913]/80 p-2 font-mono text-[10px] tabular-nums">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>
                          Top:{" "}
                          <strong className="text-cyan-300">
                            {regionSummary.maxAsi.toFixed(1)}%
                          </strong>{" "}
                          (avg {regionSummary.meanAsi.toFixed(1)}%)
                        </span>
                        <span>
                          Elev {Math.round(regionSummary.elevMinM)}–
                          {Math.round(regionSummary.elevMaxM)}m
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-slate-400">
                        <span>
                          Beats {regionSummary.beatenCatalogCount}/
                          {regionSummary.totalCatalogCount} catalog sites
                        </span>
                        <span>Max slope {regionSummary.maxSlopeDeg.toFixed(1)}°</span>
                      </div>
                    </div>
                  )}

                  <ul className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                    {rankedRegionResult?.points.slice(0, 5).map((pt, idx) => {
                      const isSelected = selectedSite?.id === pt.id;
                      const activeTarget = regionRankByActiveTarget ? activeTargetId : null;
                      const scored = getPointTargetScore(pt, activeTarget);
                      const why = buildSiteRationale(pt, activeTarget);
                      return (
                        <li key={pt.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectSite(pt.id)}
                            className={`w-full rounded border px-2.5 py-1.5 text-left transition-colors ${
                              isSelected
                                ? "border-cyan-500/70 bg-cyan-500/15"
                                : "border-slate-800/90 bg-[#060913]/70 hover:border-slate-600"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[11px] font-medium text-slate-200 tabular-nums">
                                #{idx + 1} {pt.latitude.toFixed(2)}°, {pt.longitude.toFixed(2)}°
                              </span>
                              <span
                                className={`font-mono text-xs font-semibold tabular-nums ${
                                  scored.body === "Mars"
                                    ? "text-[#E07A5F]"
                                    : "text-[#06B6D4]"
                                }`}
                              >
                                {scored.asi.toFixed(1)}% · {scored.targetName}
                              </span>
                            </div>
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-400">
                              {why}
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </section>
          )}
        </div>

        <div
          id="site-telemetry-panel"
          className={`absolute inset-x-0 bottom-0 z-20 h-[60%] min-h-0 flex-col overflow-hidden border-t border-slate-600 bg-[#0D1424] lg:static lg:order-3 lg:z-auto lg:flex lg:h-full lg:border-t-0 ${mobilePanel === "telemetry" ? "flex" : "hidden"}`}
        >
          <button
            type="button"
            onClick={closePanel}
            className="min-h-11 shrink-0 border-b border-slate-700 px-4 text-left text-sm text-cyan-300 lg:hidden"
          >
            Close telemetry · Back to map
          </button>
          <div className="min-h-0 flex-1">
            <TelemetryDrawer
              dataset={dataset}
              site={selectedSite}
              references={dataset.references}
              activeTargetId={activeTargetId}
              onSelectTarget={setActiveTargetId}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
