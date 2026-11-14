"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AnalogDataset, AnalogSite } from "@/types/analog";
import {
  buildSiteRationale,
  getPointTargetScore,
  rankRegionResult,
  summarizeRegionScan,
  type RegionBounds,
  type RegionEvaluationResult,
} from "@/lib/evaluateRegion";
import { AnalogMap, type CameraTarget } from "@/components/AnalogMap";
import { SiteDirectory } from "@/components/SiteDirectory";
import { TelemetryDrawer } from "@/components/TelemetryDrawer";
import { MethodologyDialog } from "@/components/MethodologyDialog";
import { MissionPresentation } from "@/components/MissionPresentation";
import { downloadQgisGeoJson } from "@/lib/dossier";
import { translateSite, translateTarget } from "@/lib/spanishTranslations";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Compass,
  Download,
  Globe2,
  ListFilter,
  MapPin,
  Moon,
  Orbit,
  Presentation,
  Search,
  X,
} from "lucide-react";

interface MissionControlAppProps {
  dataset: AnalogDataset;
}

type MainTab = "tierra" | "luna" | "marte";

export function MissionControlApp({ dataset }: MissionControlAppProps) {
  const [mainTab, setMainTab] = useState<MainTab>("tierra");
  const [selectedCountry, setSelectedCountry] = useState<string>("TODOS");
  const [selectedTargetFilter, setSelectedTargetFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(
    dataset.sites[0]?.id ?? null,
  );
  const [activeTargetId, setActiveTargetId] = useState<string>(
    dataset.sites[0]?.best_target ?? Object.keys(dataset.references)[0] ?? "",
  );
  const [showDirectory, setShowDirectory] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  const [comparisonExpanded, setComparisonExpanded] = useState(false);
  const [regionCollapsed, setRegionCollapsed] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<CameraTarget | null>(null);

  const [probeMode, setProbeMode] = useState(false);
  const [isProbing, setIsProbing] = useState(false);
  const [probeSite, setProbeSite] = useState<AnalogSite | null>(null);

  const [regionProbeMode, setRegionProbeMode] = useState(false);
  const [isProbingRegion, setIsProbingRegion] = useState(false);
  const [regionGridSize, setRegionGridSize] = useState<3 | 4>(3);
  const [regionRankByActiveTarget, setRegionRankByActiveTarget] = useState(true);
  const [regionResult, setRegionResult] = useState<RegionEvaluationResult | null>(null);
  const [regionError, setRegionError] = useState<string | null>(null);

  // Pre-translate all sites and references into natural Spanish
  const translatedSites = useMemo(() => {
    return dataset.sites.map((site) => translateSite(site));
  }, [dataset.sites]);

  const translatedReferences = useMemo(() => {
    const res: Record<string, ReturnType<typeof translateTarget>> = {};
    for (const [k, v] of Object.entries(dataset.references)) {
      res[k] = translateTarget(v);
    }
    return res;
  }, [dataset.references]);

  // Distinct countries available for the "Tierra" tab
  const countryList = useMemo(() => {
    const map = new Map<string, number>();
    for (const site of translatedSites) {
      map.set(site.country, (map.get(site.country) ?? 0) + 1);
    }
    // Put Ecuador first as key regional analog, then rest alphabetically
    const entries = Array.from(map.entries()).sort((a, b) => {
      if (a[0] === "Ecuador") return -1;
      if (b[0] === "Ecuador") return 1;
      return a[0].localeCompare(b[0]);
    });
    return entries;
  }, [translatedSites]);

  // Filter sites strictly based on the active main tab
  const filteredSites = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return translatedSites.filter((site) => {
      // 1. Filter by Main Tab
      if (mainTab === "tierra") {
        if (selectedCountry !== "TODOS" && site.country !== selectedCountry) {
          return false;
        }
      } else if (mainTab === "luna") {
        const target = dataset.references[site.best_target];
        if (target?.body !== "Moon") return false;
        if (selectedTargetFilter !== "ALL" && site.best_target !== selectedTargetFilter) {
          return false;
        }
      } else if (mainTab === "marte") {
        const target = dataset.references[site.best_target];
        if (target?.body !== "Mars") return false;
        if (selectedTargetFilter !== "ALL" && site.best_target !== selectedTargetFilter) {
          return false;
        }
      }

      // 2. Filter by search query
      if (!q) return true;
      const ref = translatedReferences[site.best_target];
      return (
        site.name.toLowerCase().includes(q) ||
        site.country.toLowerCase().includes(q) ||
        site.rationale.toLowerCase().includes(q) ||
        (ref?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [
    translatedSites,
    dataset.references,
    translatedReferences,
    mainTab,
    selectedCountry,
    selectedTargetFilter,
    searchQuery,
  ]);

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
    if (!selectedSiteId) return null;
    if (probeSite && selectedSiteId === probeSite.id) return probeSite;
    const regionSite = rankedRegionResult?.points.find((p) => p.id === selectedSiteId);
    if (regionSite) return regionSite;
    return translatedSites.find((s) => s.id === selectedSiteId) ?? null;
  }, [translatedSites, selectedSiteId, probeSite, rankedRegionResult]);

  // Handle selecting a site from map marker, directory, or region grid
  const handleSelectSite = useCallback(
    (siteId: string) => {
      setShowDirectory(false);
      setSelectedSiteId(siteId);
      setCameraTarget(null);

      const regionSite = rankedRegionResult?.points.find((p) => p.id === siteId);
      const site =
        (probeSite && probeSite.id === siteId ? probeSite : null) ??
        regionSite ??
        dataset.sites.find((s) => s.id === siteId);
      if (site && (!regionSite || !regionRankByActiveTarget)) {
        setActiveTargetId(site.best_target);
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
        setShowDirectory(false);
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

  // Switch Main Tabs
  const handleTabChange = (tab: MainTab) => {
    setMainTab(tab);
    setSelectedCountry("TODOS");
    setSelectedTargetFilter("ALL");

    if (tab === "luna") {
      setActiveTargetId("shackleton-crater");
      const moonSites = translatedSites.filter(
        (s) => dataset.references[s.best_target]?.body === "Moon"
      );
      const best = moonSites.sort((a, b) => b.overall_asi - a.overall_asi)[0];
      if (best) {
        setSelectedSiteId(best.id);
        setCameraTarget({ type: "fitBounds", sites: moonSites });
      }
    } else if (tab === "marte") {
      setActiveTargetId("jezero-crater");
      const marsSites = translatedSites.filter(
        (s) => dataset.references[s.best_target]?.body === "Mars"
      );
      const best = marsSites.sort((a, b) => b.overall_asi - a.overall_asi)[0];
      if (best) {
        setSelectedSiteId(best.id);
        setCameraTarget({ type: "fitBounds", sites: marsSites });
      }
    } else {
      // Tierra: show all sites
      setCameraTarget({ type: "world" });
    }
  };

  // Country filter selection with auto-camera
  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
    if (country === "TODOS") {
      setCameraTarget({ type: "world" });
    } else {
      const countrySites = translatedSites.filter((s) => s.country === country);
      const best = countrySites.sort((a, b) => b.overall_asi - a.overall_asi)[0];
      if (best) {
        setSelectedSiteId(best.id);
        setActiveTargetId(best.best_target);
        setShowDirectory(false);
        setCameraTarget({ type: "fitBounds", sites: countrySites, padding: { left: 490, top: 130, right: 60, bottom: 60 } });
      }
    }
  };

  // Toggle directory: ensure site detail panel is closed to prevent overlap
  const handleToggleDirectory = () => {
    setShowDirectory((prev) => {
      const next = !prev;
      if (next) {
        setSelectedSiteId(null);
      }
      return next;
    });
  };

  // Deep-linking from Mission Briefing (/explorer?target=... or /explorer?site=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const targetParam = params.get("target");
    const siteParam = params.get("site");
    if (!targetParam && !siteParam) return;

    queueMicrotask(() => {
      if (siteParam) {
        const foundSite = translatedSites.find((s) => s.id === siteParam);
        if (foundSite) {
          setMainTab("tierra");
          setSelectedCountry("TODOS");
          setSelectedSiteId(foundSite.id);
          setActiveTargetId(
            targetParam && dataset.references[targetParam]
              ? targetParam
              : foundSite.best_target
          );
          return;
        }
      }

      if (targetParam && dataset.references[targetParam]) {
        const ref = dataset.references[targetParam];
        setMainTab(ref.body === "Moon" ? "luna" : "marte");
        setSelectedTargetFilter(targetParam);
        setActiveTargetId(targetParam);
        const matchingSites = translatedSites.filter(
          (s) => s.best_target === targetParam
        );
        const bestForTarget =
          [...(matchingSites.length > 0 ? matchingSites : translatedSites)].sort(
            (a, b) =>
              (b.scores[targetParam]?.overall_asi ?? b.overall_asi) -
              (a.scores[targetParam]?.overall_asi ?? a.overall_asi)
          )[0] ?? null;
        if (bestForTarget) {
          setSelectedSiteId(bestForTarget.id);
        }
        if (matchingSites.length > 0) {
          setCameraTarget({ type: "fitBounds", sites: matchingSites });
        }
      }
    });
  }, [dataset.references, translatedSites]);

  // Keyboard accessibility: Escape key closes active panel or directory
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showDirectory) {
          setShowDirectory(false);
        } else if (selectedSiteId) {
          setSelectedSiteId(null);
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [showDirectory, selectedSiteId]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#060913] text-slate-100 font-sans">
      <a
        href="#map-region"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-[#D4AF37] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950"
      >
        Saltar al mapa interactivo
      </a>

      {/* 1. Full-screen Protagonist Map */}
      <div id="map-region" className="absolute inset-0 z-0">
        <AnalogMap
          sites={mapSites}
          references={translatedReferences}
          selectedSiteId={selectedSite?.id ?? null}
          onSelectSite={handleSelectSite}
          cameraTarget={cameraTarget}
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
      </div>

      {/* 2. Top Navigation Bar (Fixed z-40, Never Covered by Side Panels) */}
      <header
        aria-label="Navegación principal de exploración análoga"
        className="absolute left-0 right-0 top-0 z-40 border-b border-[#D4AF37]/30 bg-[#060913]/95 px-3 py-2.5 shadow-2xl backdrop-blur-md sm:px-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Platform Name + Return to Mission Briefing */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              title="Volver a TERR-ANALOG — Mission Briefing"
              className="group flex items-center gap-2.5 rounded-lg pr-1 transition-opacity hover:opacity-90"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D4AF37]/50 bg-[#D4AF37]/15 text-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.25)]">
                <Compass className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <span className="block text-xs font-bold tracking-wider text-slate-100 uppercase sm:text-sm">
                  TERR-ANALOG
                </span>
                <span className="text-[10px] text-slate-400">
                  NASA Space Apps · {dataset.methodology.source_counts.nasa_power} NASA POWER +{" "}
                  {dataset.methodology.source_counts.fallback} Fallback
                </span>
              </div>
            </Link>
          </div>

          {/* 3 Main Clean Navigation Tabs */}
          <nav
            aria-label="Pestañas principales de exploración"
            className="flex items-center rounded-xl border border-slate-800 bg-[#0D1424]/90 p-1 shadow-inner"
          >
            <button
              type="button"
              onClick={() => handleTabChange("tierra")}
              aria-pressed={mainTab === "tierra"}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                mainTab === "tierra"
                  ? "border border-[#F5B82E] bg-[#F5B82E]/20 text-[#F5B82E]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Globe2 className="h-3.5 w-3.5 text-[#00D9F5]" aria-hidden="true" />
              <span>Tierra</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("luna")}
              aria-pressed={mainTab === "luna"}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                mainTab === "luna"
                  ? "border border-[#F5B82E] bg-[#F5B82E]/20 text-[#F5B82E]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Moon className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
              <span>Luna</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("marte")}
              aria-pressed={mainTab === "marte"}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                mainTab === "marte"
                  ? "border border-[#F5B82E] bg-[#F5B82E]/20 text-[#F5B82E]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Orbit className="h-3.5 w-3.5 text-[#E07A5F]" aria-hidden="true" />
              <span>Marte</span>
            </button>
          </nav>

          {/* Right Tools: Return to Briefing, Directory Toggle, Search, Export GeoJSON & Methodology */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg border border-[#00D9F5]/50 bg-[#00D9F5]/12 px-3 py-1.5 text-xs font-semibold text-[#00D9F5] shadow-md transition-all hover:bg-[#00D9F5]/22"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Mission Briefing</span>
            </Link>

            <button
              type="button"
              onClick={handleToggleDirectory}
              aria-expanded={showDirectory}
              aria-controls="directory-drawer"
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-md transition-all ${
                showDirectory
                  ? "border-[#D4AF37] bg-[#D4AF37]/25 text-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.25)]"
                  : "border-slate-800 bg-[#0D1424] text-slate-300 hover:border-slate-700 hover:text-slate-100"
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Directorio</span>
              <span className="font-mono tabular-nums text-[11px] text-[#D4AF37]">
                ({filteredSites.length})
              </span>
            </button>

            <div className="relative hidden lg:block">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar sitio o país..."
                aria-label="Buscar sitio o país análogo"
                className="h-8 w-40 rounded-lg border border-slate-800 bg-[#0D1424] pl-8 pr-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:w-52 focus:border-[#D4AF37]/60 focus:outline-none transition-all"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const exportSites = rankedRegionResult
                  ? [...mapSites, ...rankedRegionResult.points]
                  : mapSites;
                downloadQgisGeoJson(
                  exportSites,
                  dataset.references,
                  rankedRegionResult
                    ? `terr-analog-region-${rankedRegionResult.grid_size}x${rankedRegionResult.grid_size}.geojson`
                    : "terr-analog-sites.geojson"
                );
              }}
              title="Exportar GeoJSON compatible con QGIS"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0D1424] px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden xl:inline">GeoJSON</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPresentation(true)}
              title="Resumen ejecutivo rápido"
              className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0D1424] px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-slate-700 hover:text-slate-100"
            >
              <Presentation className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
              <span className="hidden xl:inline">Dossier</span>
            </button>

            <MethodologyDialog dataset={dataset} />
          </div>
        </div>

        {/* Row 2: Contextual Sub-Filter Bar (Country for Tierra, Targets for Luna/Marte) */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar border-t border-slate-800/60">
          {mainTab === "tierra" && (
            <>
              <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold tracking-wider text-[#D4AF37] uppercase mr-1">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                Filtrar por País:
              </span>
              <button
                type="button"
                onClick={() => handleCountrySelect("TODOS")}
                aria-pressed={selectedCountry === "TODOS"}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  selectedCountry === "TODOS"
                    ? "border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                    : "border-slate-800/90 bg-[#0D1424]/90 text-slate-400 hover:text-slate-200"
                }`}
              >
                Todos los Países ({translatedSites.length})
              </button>

              {countryList.map(([country, count]) => {
                const active = selectedCountry === country;
                return (
                  <button
                    key={country}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    aria-pressed={active}
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                      active
                        ? "border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                        : "border-slate-800/90 bg-[#0D1424]/90 text-slate-300 hover:border-slate-700 hover:text-slate-100"
                    }`}
                  >
                    <span>{country}</span>
                    <span className="ml-1.5 font-mono text-[10px] text-slate-400">
                      ({count})
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {mainTab === "luna" && (
            <>
              <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold tracking-wider text-cyan-400 uppercase mr-1">
                <Moon className="h-3 w-3" aria-hidden="true" />
                Objetivos Lunares (Artemis):
              </span>
              <button
                type="button"
                onClick={() => setSelectedTargetFilter("ALL")}
                aria-pressed={selectedTargetFilter === "ALL"}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  selectedTargetFilter === "ALL"
                    ? "border-cyan-400 bg-cyan-400/20 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                    : "border-slate-800/90 bg-[#0D1424]/90 text-slate-400 hover:text-slate-200"
                }`}
              >
                Todos los Análogos Lunares
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedTargetFilter("shackleton-crater");
                  setActiveTargetId("shackleton-crater");
                }}
                aria-pressed={selectedTargetFilter === "shackleton-crater"}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  selectedTargetFilter === "shackleton-crater"
                    ? "border-cyan-400 bg-cyan-400/20 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                    : "border-slate-800/90 bg-[#0D1424]/90 text-slate-300 hover:border-slate-700 hover:text-slate-100"
                }`}
              >
                Cráter Shackleton (Polo Sur Lunar)
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedTargetFilter("mouton-mons");
                  setActiveTargetId("mouton-mons");
                }}
                aria-pressed={selectedTargetFilter === "mouton-mons"}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  selectedTargetFilter === "mouton-mons"
                    ? "border-cyan-400 bg-cyan-400/20 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                    : "border-slate-800/90 bg-[#0D1424]/90 text-slate-300 hover:border-slate-700 hover:text-slate-100"
                }`}
              >
                Mons Mouton (Meseta Artemis III)
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedTargetFilter("mare-tranquillitatis");
                  setActiveTargetId("mare-tranquillitatis");
                }}
                aria-pressed={selectedTargetFilter === "mare-tranquillitatis"}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  selectedTargetFilter === "mare-tranquillitatis"
                    ? "border-cyan-400 bg-cyan-400/20 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                    : "border-slate-800/90 bg-[#0D1424]/90 text-slate-300 hover:border-slate-700 hover:text-slate-100"
                }`}
              >
                Mare Tranquillitatis (Tubos de Lava)
              </button>
            </>
          )}

          {mainTab === "marte" && (
            <>
              <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold tracking-wider text-[#E07A5F] uppercase mr-1">
                <Orbit className="h-3 w-3" aria-hidden="true" />
                Objetivos Marcianos:
              </span>
              <button
                type="button"
                onClick={() => setSelectedTargetFilter("ALL")}
                aria-pressed={selectedTargetFilter === "ALL"}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  selectedTargetFilter === "ALL"
                    ? "border-[#E07A5F] bg-[#E07A5F]/20 text-[#E07A5F] shadow-[0_0_10px_rgba(224,122,95,0.2)]"
                    : "border-slate-800/90 bg-[#0D1424]/90 text-slate-400 hover:text-slate-200"
                }`}
              >
                Todos los Análogos Marcianos
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedTargetFilter("jezero-crater");
                  setActiveTargetId("jezero-crater");
                }}
                aria-pressed={selectedTargetFilter === "jezero-crater"}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  selectedTargetFilter === "jezero-crater"
                    ? "border-[#E07A5F] bg-[#E07A5F]/20 text-[#E07A5F] shadow-[0_0_10px_rgba(224,122,95,0.2)]"
                    : "border-slate-800/90 bg-[#0D1424]/90 text-slate-300 hover:border-slate-700 hover:text-slate-100"
                }`}
              >
                Cráter Jezero (Delta y Basaltos)
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedTargetFilter("olympus-mons-flank");
                  setActiveTargetId("olympus-mons-flank");
                }}
                aria-pressed={selectedTargetFilter === "olympus-mons-flank"}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  selectedTargetFilter === "olympus-mons-flank"
                    ? "border-[#E07A5F] bg-[#E07A5F]/20 text-[#E07A5F] shadow-[0_0_10px_rgba(224,122,95,0.2)]"
                    : "border-slate-800/90 bg-[#0D1424]/90 text-slate-300 hover:border-slate-700 hover:text-slate-100"
                }`}
              >
                Flanco del Monte Olimpo (Tubos Volcánicos)
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedTargetFilter("valles-marineris");
                  setActiveTargetId("valles-marineris");
                }}
                aria-pressed={selectedTargetFilter === "valles-marineris"}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  selectedTargetFilter === "valles-marineris"
                    ? "border-[#E07A5F] bg-[#E07A5F]/20 text-[#E07A5F] shadow-[0_0_10px_rgba(224,122,95,0.2)]"
                    : "border-slate-800/90 bg-[#0D1424]/90 text-slate-300 hover:border-slate-700 hover:text-slate-100"
                }`}
              >
                Valles Marineris (Cañón y Sulfatos)
              </button>
            </>
          )}
        </div>
      </header>

      {/* 3. Left Analysis Panel / Expandable 3-Column Comparison Workbench */}
      {selectedSite && !showDirectory && (
        <section
          aria-label={`Detalle del sitio ${selectedSite.name}`}
          className={`fixed z-30 flex flex-col overflow-hidden rounded-2xl border border-[rgba(100,180,210,0.28)] bg-[#0D1925]/95 shadow-2xl backdrop-blur-md transition-all duration-200 ${
            comparisonExpanded
              ? "bottom-3 left-3 right-3 top-[108px] sm:bottom-4 sm:left-4 sm:right-4 sm:top-[112px]"
              : "bottom-3 left-3 right-3 max-h-[62dvh] sm:bottom-4 sm:left-4 sm:right-auto sm:top-[112px] sm:max-h-none sm:w-[400px] lg:w-[420px]"
          }`}
        >
          <TelemetryDrawer
            dataset={dataset}
            site={selectedSite}
            references={translatedReferences}
            activeTargetId={activeTargetId}
            onSelectTarget={setActiveTargetId}
            onClose={() => {
              setSelectedSiteId(null);
              setComparisonExpanded(false);
            }}
            expanded={comparisonExpanded}
            onToggleExpand={() => setComparisonExpanded((prev) => !prev)}
          />
        </section>
      )}

      {/* 4. Collapsible Site Directory Drawer (Mutually exclusive with site detail, strictly below top header) */}
      {showDirectory && (
        <section
          id="directory-drawer"
          aria-label="Directorio completo de sitios análogos"
          className="fixed bottom-3 left-3 right-3 top-[108px] z-30 flex flex-col overflow-hidden rounded-2xl border border-[rgba(100,180,210,0.28)] bg-[#0D1925]/95 shadow-2xl backdrop-blur-md sm:bottom-4 sm:left-4 sm:top-[112px] sm:w-[380px]"
        >
          <div className="flex items-center justify-between border-b border-[rgba(100,180,210,0.2)] bg-[#071018]/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <ListFilter className="h-4 w-4 text-[#F5B82E]" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-[#F1F5F9]">
                Directorio ({filteredSites.length} sitios)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowDirectory(false)}
              aria-label="Cerrar directorio de sitios (Escape)"
              className="rounded-lg p-1 text-[#94A3B8] hover:bg-[#132434] hover:text-[#F1F5F9]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <SiteDirectory
              sites={filteredSites}
              references={translatedReferences}
              selectedSiteId={selectedSiteId}
              onSelectSite={handleSelectSite}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
        </section>
      )}

      {/* 5. Módulo flotante compacto de Prospección Regional 3x3 / 4x4 (Fase 2) */}
      {(rankedRegionResult || regionError || isProbingRegion) && !comparisonExpanded && (
        <section
          aria-label="Módulo de prospección regional"
          className="fixed bottom-14 right-3 z-20 w-[345px] max-w-[calc(100%-1.5rem)] rounded-2xl border border-[rgba(100,180,210,0.28)] bg-[#0D1925]/95 p-3 text-xs text-[#F1F5F9] shadow-2xl backdrop-blur-md"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[rgba(100,180,210,0.18)] pb-2">
            <div>
              <h2 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#F5B82E]">
                {isProbingRegion
                  ? `Escaneando Grilla ${regionGridSize}×${regionGridSize}...`
                  : regionError
                  ? "Error en Sondeo Regional"
                  : `Prospección ${rankedRegionResult?.grid_size ?? 3}×${rankedRegionResult?.grid_size ?? 3} · ${rankedRegionResult?.evaluated_count ?? 0} pts`}
              </h2>
              {!regionError && rankedRegionResult && (
                <p className="mt-0.5 font-mono text-[10px] text-[#94A3B8] tabular-nums">
                  Rango: {rankedRegionResult.bounds.minLat.toFixed(2)}°..
                  {rankedRegionResult.bounds.maxLat.toFixed(2)}°N,{" "}
                  {rankedRegionResult.bounds.minLon.toFixed(2)}°..
                  {rankedRegionResult.bounds.maxLon.toFixed(2)}°E
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!regionError && rankedRegionResult && (
                <>
                  <button
                    type="button"
                    onClick={() => setRegionCollapsed((prev) => !prev)}
                    aria-expanded={!regionCollapsed}
                    title={regionCollapsed ? "Expandir resultados" : "Contraer resultados"}
                    aria-label={regionCollapsed ? "Expandir prospección regional" : "Contraer prospección regional"}
                    className="rounded p-1 text-[#94A3B8] hover:bg-[#132434] hover:text-[#00D9F5]"
                  >
                    {regionCollapsed ? (
                      <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </button>
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
                      link.download = `region-prospeccion-${rankedRegionResult.grid_size}x${rankedRegionResult.grid_size}.geojson`;
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                    title="Exportar GeoJSON de prospección regional"
                    aria-label="Exportar GeoJSON de prospección regional"
                    className="rounded p-1 text-[#94A3B8] hover:bg-[#132434] hover:text-[#F5B82E]"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  setRegionResult(null);
                  setRegionError(null);
                }}
                aria-label="Cerrar prospección regional"
                className="rounded p-1 text-[#94A3B8] hover:bg-[#132434] hover:text-[#F1F5F9]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {isProbingRegion ? (
            <p className="mt-2.5 font-mono text-[11px] text-[#00D9F5]">
              Consultando NASA POWER y Copernicus DEM para {regionGridSize * regionGridSize} sectores...
            </p>
          ) : regionError ? (
            <p className="mt-2 text-rose-300">{regionError}</p>
          ) : (
            !regionCollapsed &&
            rankedRegionResult && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] text-[#94A3B8]">Ordenación:</span>
                  <div
                    className="flex items-center rounded border border-[rgba(100,180,210,0.2)] bg-[#071018] p-0.5"
                    role="group"
                    aria-label="Modo de clasificación regional"
                  >
                    <button
                      type="button"
                      onClick={() => setRegionRankByActiveTarget(true)}
                      aria-pressed={regionRankByActiveTarget}
                      className={`whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        regionRankByActiveTarget
                          ? "bg-[#F5B82E]/20 text-[#F5B82E]"
                          : "text-[#94A3B8] hover:text-[#F1F5F9]"
                      }`}
                    >
                      {(translatedReferences[activeTargetId]?.name ?? "Objetivo Activo").split(" / ")[0]}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegionRankByActiveTarget(false)}
                      aria-pressed={!regionRankByActiveTarget}
                      className={`whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        !regionRankByActiveTarget
                          ? "bg-[#F5B82E]/20 text-[#F5B82E]"
                          : "text-[#94A3B8] hover:text-[#F1F5F9]"
                      }`}
                    >
                      Mejor global
                    </button>
                  </div>
                </div>

                {regionSummary && (
                  <div className="rounded-lg border border-[rgba(100,180,210,0.18)] bg-[#071018]/90 p-2 font-mono text-[10px] tabular-nums">
                    <div className="flex items-center justify-between text-slate-200">
                      <span>
                        Mejor:{" "}
                        <strong className="text-[#F5B82E]">
                          {regionSummary.maxAsi.toFixed(1)}%
                        </strong>{" "}
                        · Prom:{" "}
                        <strong className="text-[#00D9F5]">
                          {regionSummary.meanAsi.toFixed(1)}%
                        </strong>
                      </span>
                      <span>
                        Elev {Math.round(regionSummary.elevMinM)}–
                        {Math.round(regionSummary.elevMaxM)} m
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[#94A3B8]">
                      <span>
                        Supera {regionSummary.beatenCatalogCount}/
                        {regionSummary.totalCatalogCount} sitios
                      </span>
                      <span>Pend. máx {regionSummary.maxSlopeDeg.toFixed(1)}°</span>
                    </div>
                  </div>
                )}

                <ul className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
                  {rankedRegionResult.points.map((pt, idx) => {
                    const isSelected = selectedSite?.id === pt.id;
                    const activeTarget = regionRankByActiveTarget
                      ? activeTargetId
                      : null;
                    const scored = getPointTargetScore(pt, activeTarget);
                    const why = buildSiteRationale(pt, activeTarget);
                    return (
                      <li key={pt.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectSite(pt.id)}
                          className={`w-full rounded-lg border px-2.5 py-1.5 text-left transition-colors ${
                            isSelected
                              ? "border-[#F5B82E] bg-[#F5B82E]/15"
                              : "border-[rgba(100,180,210,0.16)] bg-[#071018]/75 hover:border-[rgba(100,180,210,0.4)]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] font-semibold text-[#F1F5F9] tabular-nums">
                              #{idx + 1} · {pt.latitude.toFixed(2)}°,{" "}
                              {pt.longitude.toFixed(2)}°
                            </span>
                            <span
                              className={`font-mono text-xs font-bold tabular-nums ${
                                scored.body === "Mars"
                                  ? "text-[#E07A5F]"
                                  : "text-[#00D9F5]"
                              }`}
                            >
                              {scored.asi.toFixed(1)}%
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center justify-between font-mono text-[10px] text-[#94A3B8] tabular-nums">
                            <span>
                              Elev {Math.round(pt.elevation_m)} m · Pend{" "}
                              {pt.dem_telemetry.dem_slope_deg.toFixed(1)}°
                            </span>
                            <span>{scored.targetName}</span>
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">
                            {why}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )
          )}
        </section>
      )}

      {showPresentation && (
        <MissionPresentation
          dataset={dataset}
          sites={translatedSites}
          references={translatedReferences}
          onSelectSiteAndExplore={(siteId) => {
            setShowPresentation(false);
            handleSelectSite(siteId);
          }}
          onClose={() => setShowPresentation(false)}
        />
      )}
    </div>
  );
}
