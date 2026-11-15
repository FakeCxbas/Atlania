"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Compass,
  Download,
  ListFilter,
  Presentation,
  Search,
  X,
} from "lucide-react";

const COUNTRY_FLAGS: Record<string, string> = {
  Ecuador: "🇪🇨",
  Bolivia: "🇧🇴",
  China: "🇨🇳",
  Etiopía: "🇪🇹",
  "Estados Unidos": "🇺🇸",
  Canadá: "🇨🇦",
  Chile: "🇨🇱",
  Islandia: "🇮🇸",
  "Chile / Argentina": "🇨🇱🇦🇷",
  Irán: "🇮🇷",
  Chad: "🇹🇩",
  España: "🇪🇸",
  Argentina: "🇦🇷",
  Perú: "🇵🇪",
  Antártida: "🇦🇶",
  Noruega: "🇳🇴",
  Namibia: "🇳🇦",
  Rusia: "🇷🇺",
  India: "🇮🇳",
  Australia: "🇦🇺",
};

interface MissionControlAppProps {
  dataset: AnalogDataset;
}

type MainTab = "tierra" | "luna" | "marte";

export function MissionControlApp({ dataset }: MissionControlAppProps) {
  const [mainTab, setMainTab] = useState<MainTab>("tierra");
  const [selectedCountry, setSelectedCountry] = useState<string>("TODOS");
  const [countryDropdown, setCountryDropdown] = useState<{
    country: string;
    top: number;
    left: number;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const countryScrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [selectedTargetFilter, setSelectedTargetFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [activeTargetId, setActiveTargetId] = useState<string>(
    dataset.sites[0]?.best_target ?? Object.keys(dataset.references)[0] ?? ""
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

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notifyUser = useCallback((message: string) => {
    setFeedbackMessage(message);
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = setTimeout(() => {
      setFeedbackMessage(null);
    }, 3600);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

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
    const SOUTH_AMERICA_COUNTRIES = new Set([
      "Argentina",
      "Bolivia",
      "Brasil",
      "Chile",
      "Chile / Argentina",
      "Colombia",
      "Ecuador",
      "Guyana",
      "Paraguay",
      "Perú",
      "Surinam",
      "Uruguay",
      "Venezuela",
    ]);

    const getCountryPriority = (country: string): number => {
      if (country === "Ecuador") return 0;
      if (SOUTH_AMERICA_COUNTRIES.has(country)) return 1;
      if (country === "Antártida") return 3;
      return 2;
    };

    const map = new Map<string, number>();
    for (const site of translatedSites) {
      map.set(site.country, (map.get(site.country) ?? 0) + 1);
    }

    return Array.from(map.entries()).sort((a, b) => {
      const pa = getCountryPriority(a[0]);
      const pb = getCountryPriority(b[0]);
      if (pa !== pb) return pa - pb;
      return a[0].localeCompare(b[0], "es");
    });
  }, [translatedSites]);

  // Sites belonging to the currently open floating country dropdown
  const dropdownSites = useMemo(() => {
    if (mainTab !== "tierra" || !countryDropdown) return [];
    return translatedSites
      .filter((s) => s.country === countryDropdown.country)
      .sort((a, b) => b.overall_asi - a.overall_asi);
  }, [mainTab, countryDropdown, translatedSites]);

  // Close floating country dropdown on outside click or Escape key
  useEffect(() => {
    if (!countryDropdown) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (dropdownRef.current?.contains(target)) return;
      if (target.closest("[data-country-trigger]")) return;
      setCountryDropdown(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCountryDropdown(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [countryDropdown]);

  // Track horizontal scroll bounds for country filter bar arrows
  const updateCountryScrollBounds = useCallback(() => {
    const el = countryScrollRef.current;
    if (!el) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    if (mainTab !== "tierra") return;
    const rafId = requestAnimationFrame(updateCountryScrollBounds);
    window.addEventListener("resize", updateCountryScrollBounds);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateCountryScrollBounds);
    };
  }, [mainTab, countryList.length, updateCountryScrollBounds]);

  const scrollCountryBar = useCallback((direction: "left" | "right") => {
    const el = countryScrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -260 : 260,
      behavior: "smooth",
    });
  }, []);

  // Filter sites strictly based on the active main tab
  const filteredSites = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return translatedSites.filter((site) => {
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

  const handleProbeCoordinate = useCallback(
    async (lat: number, lon: number) => {
      setIsProbing(true);
      try {
        const res = await fetch(
          `/api/evaluate?lat=${encodeURIComponent(lat.toFixed(4))}&lon=${encodeURIComponent(lon.toFixed(4))}`
        );
        if (!res.ok) {
          notifyUser("No se pudo evaluar la coordenada seleccionada.");
          return;
        }
        const payload = (await res.json()) as { site?: AnalogSite };
        if (payload.site) {
          setProbeSite(payload.site);
          setSelectedSiteId(payload.site.id);
          setActiveTargetId(payload.site.best_target);
          setProbeMode(false);
          setShowDirectory(false);
          notifyUser(
            `Sondeo completado (${lat.toFixed(2)}°, ${lon.toFixed(2)}°): ${payload.site.overall_asi.toFixed(1)}% ASI`
          );
        }
      } finally {
        setIsProbing(false);
      }
    },
    [notifyUser]
  );

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
          setRegionError(payload.error ?? "Error al evaluar la región.");
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
        notifyUser(
          `Prospección ${payload.grid_size}×${payload.grid_size} completada (${payload.evaluated_count} sectores)`
        );
      } catch {
        setRegionError("No se pudo conectar con el servicio de evaluación regional.");
      } finally {
        setIsProbingRegion(false);
      }
    },
    [regionGridSize, regionRankByActiveTarget, activeTargetId, notifyUser]
  );

  // Switch Main Tabs
  const handleTabChange = (tab: MainTab) => {
    setMainTab(tab);
    setSelectedCountry("TODOS");
    setCountryDropdown(null);
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
      notifyUser(`Mostrando ${moonSites.length} análogos lunares`);
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
      notifyUser(`Mostrando ${marsSites.length} análogos marcianos`);
    } else {
      setSelectedSiteId(null);
      setComparisonExpanded(false);
      setCameraTarget({ type: "world" });
      notifyUser(`Vista global: ${translatedSites.length} ubicaciones terrestres`);
    }
  };

  // Country filter selection
  const handleCountrySelect = (country: string, triggerEl?: HTMLButtonElement | null) => {
    if (country === "TODOS") {
      setSelectedCountry("TODOS");
      setCountryDropdown(null);
      setSelectedSiteId(null);
      setComparisonExpanded(false);
      setCameraTarget({ type: "world" });
      return;
    }

    setSelectedCountry(country);
    setCountryDropdown((prev) => {
      if (prev?.country === country) return null;
      if (!triggerEl || typeof window === "undefined") {
        return { country, top: 96, left: 16 };
      }
      const rect = triggerEl.getBoundingClientRect();
      const menuWidth = Math.min(340, window.innerWidth - 24);
      const clampedLeft = Math.max(12, Math.min(rect.left, window.innerWidth - menuWidth - 12));
      return {
        country,
        top: Math.round(rect.bottom + 6),
        left: Math.round(clampedLeft),
      };
    });
  };

  const handleSelectSubmenuSite = useCallback((site: AnalogSite) => {
    setCountryDropdown(null);
    setShowDirectory(false);
    setSelectedSiteId(site.id);
    setActiveTargetId(site.best_target);
    setCameraTarget({ type: "site", siteId: site.id, zoom: 9.8 });
  }, []);

  const handleToggleDirectory = () => {
    setShowDirectory((prev) => {
      const next = !prev;
      if (next) {
        setSelectedSiteId(null);
        setComparisonExpanded(false);
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

  // Keyboard accessibility: Escape closes directory or deselects site
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (probeMode) {
          setProbeMode(false);
        } else if (regionProbeMode) {
          setRegionProbeMode(false);
        } else if (showDirectory) {
          setShowDirectory(false);
        } else if (selectedSiteId && !comparisonExpanded) {
          setSelectedSiteId(null);
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [showDirectory, selectedSiteId, comparisonExpanded, probeMode, regionProbeMode]);

  const hasActiveFilter =
    selectedCountry !== "TODOS" ||
    selectedTargetFilter !== "ALL" ||
    searchQuery.trim().length > 0;

  const showSidePanel = (Boolean(selectedSite) || showDirectory) && !comparisonExpanded;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#101321] font-sans text-[#E4DFD5]">
      <a
        href="#map-region"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-[#C5A36D] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#101321]"
      >
        Saltar al mapa interactivo
      </a>

      {/* 1. Barra superior sencilla y limpia */}
      <header
        aria-label="Navegación principal de ATLANIA"
        className="z-40 flex shrink-0 items-center justify-between gap-3 border-b border-[#55527D]/25 bg-[#101321] px-4 py-2 sm:px-6"
      >
        <Link
          href="/"
          title="Volver a la portada de ATLANIA"
          className="flex items-center gap-2.5 rounded-lg pr-1 transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#C5A36D]/45 bg-[#181B2C] text-[#C5A36D]">
            <Compass className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <span className="block font-serif text-base font-semibold tracking-[0.18em] text-[#E4DFD5] uppercase">
              ATLANIA
            </span>
            <span className="hidden text-[11px] text-[#A3A1BD] sm:block">
              Observatorio Planetario
            </span>
          </div>
        </Link>

        {/* Selector de enfoque planetario */}
        <nav
          aria-label="Enfoque planetario"
          className="flex items-center gap-1 rounded-lg bg-[#181B2C] p-1 ring-1 ring-[#55527D]/25"
        >
          <button
            type="button"
            onClick={() => handleTabChange("tierra")}
            aria-pressed={mainTab === "tierra"}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D] ${
              mainTab === "tierra"
                ? "bg-[#27233E] text-[#E4DFD5] ring-1 ring-[#C5A36D]/45"
                : "text-[#A3A1BD] hover:text-[#E4DFD5]"
            }`}
          >
            <span aria-hidden="true" className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-black shadow-[0_0_7px_rgba(255,255,255,0.12)]">
              <Image src="/nasa/earth-blue-marble.jpg" alt="" fill sizes="24px" className="object-cover scale-[1.18]" />
            </span>
            <span>Tierra</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("luna")}
            aria-pressed={mainTab === "luna"}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D] ${
              mainTab === "luna"
                ? "bg-[#27233E] text-[#E4DFD5] ring-1 ring-[#C5A36D]/45"
                : "text-[#A3A1BD] hover:text-[#E4DFD5]"
            }`}
          >
            <span aria-hidden="true" className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-black shadow-[0_0_7px_rgba(255,255,255,0.12)]">
              <Image src="/nasa/moon-navigation.jpg" alt="" fill sizes="24px" className="object-cover scale-[1.1]" />
            </span>
            <span>Luna</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("marte")}
            aria-pressed={mainTab === "marte"}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D] ${
              mainTab === "marte"
                ? "bg-[#27233E] text-[#E4DFD5] ring-1 ring-[#C5A36D]/45"
                : "text-[#A3A1BD] hover:text-[#E4DFD5]"
            }`}
          >
            <span aria-hidden="true" className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-black shadow-[0_0_7px_rgba(255,255,255,0.12)]">
              <Image src="/nasa/mars-orb.jpg" alt="" fill sizes="64px" quality={90} className="object-cover scale-[1.02]" />
            </span>
            <span>Marte</span>
          </button>
        </nav>

        {/* Herramientas esenciales */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleDirectory}
            aria-expanded={showDirectory}
            aria-controls="directory-drawer"
            className={`flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D] ${
              showDirectory
                ? "bg-[#C5A36D]/20 text-[#E4DFD5] ring-1 ring-[#C5A36D]/50"
                : "bg-[#181B2C] text-[#E4DFD5] ring-1 ring-[#55527D]/30 hover:ring-[#C5A36D]/40"
            }`}
          >
            <ListFilter className="h-3.5 w-3.5 text-[#C5A36D]" aria-hidden="true" />
            <span className="hidden sm:inline">Directorio</span>
            <span className="font-mono text-[11px] tabular-nums text-[#C5A36D]">
              ({filteredSites.length})
            </span>
          </button>

          <div className="relative hidden lg:block">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A3A1BD]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar sitio o país..."
              aria-label="Buscar sitio o país análogo"
              className="h-9 w-44 rounded-lg border border-[#55527D]/30 bg-[#181B2C] pl-8 pr-2.5 text-xs text-[#E4DFD5] placeholder:text-[#A3A1BD]/70 transition-all focus:w-56 focus:border-[#C5A36D]/60 focus:outline-none"
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
                  ? `atlania-region-${rankedRegionResult.grid_size}x${rankedRegionResult.grid_size}.geojson`
                  : "atlania-sites.geojson"
              );
              notifyUser(`GeoJSON exportado (${exportSites.length} sitios)`);
            }}
            title="Exportar capa GeoJSON compatible con QGIS"
            className="hidden min-h-9 items-center gap-1.5 rounded-lg bg-[#181B2C] px-2.5 py-1.5 text-xs font-medium text-[#A3A1BD] ring-1 ring-[#55527D]/30 transition-colors hover:text-[#E4DFD5] hover:ring-[#C5A36D]/40 sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden xl:inline">GeoJSON</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPresentation(true)}
            title="Abrir dossier ejecutivo del proyecto"
            className="hidden min-h-9 items-center gap-1.5 rounded-lg bg-[#181B2C] px-2.5 py-1.5 text-xs font-medium text-[#A3A1BD] ring-1 ring-[#55527D]/30 transition-colors hover:text-[#E4DFD5] hover:ring-[#C5A36D]/40 md:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
          >
            <Presentation className="h-3.5 w-3.5 text-[#C5A36D]" aria-hidden="true" />
            <span className="hidden xl:inline">Dossier</span>
          </button>

          <MethodologyDialog dataset={dataset} />
        </div>
      </header>

      {/* 2. Barra de filtros geográficos accesibles */}
      <div
        aria-label="Filtros geográficos y objetivos"
        className="z-30 flex shrink-0 items-center justify-between gap-3 border-b border-[#55527D]/25 bg-[#121626] px-4 py-2 sm:px-6"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="hidden shrink-0 text-xs font-medium text-[#A3A1BD] sm:inline">
            {mainTab === "tierra"
              ? "Explorar territorios:"
              : mainTab === "luna"
              ? "Objetivos lunares:"
              : "Objetivos marcianos:"}
          </span>

          {mainTab === "tierra" && (
            <>
              <button
                type="button"
                onClick={() => scrollCountryBar("left")}
                disabled={!canScrollLeft}
                aria-label="Desplazar países a la izquierda"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#181B2C] text-[#A3A1BD] ring-1 ring-[#55527D]/30 transition-colors hover:text-[#E4DFD5] disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              <div
                ref={countryScrollRef}
                onScroll={() => {
                  updateCountryScrollBounds();
                  if (countryDropdown) setCountryDropdown(null);
                }}
                className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto"
              >
                <button
                  type="button"
                  onClick={() => handleCountrySelect("TODOS")}
                  aria-pressed={selectedCountry === "TODOS"}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D] ${
                    selectedCountry === "TODOS"
                      ? "bg-[#C5A36D]/20 text-[#E4DFD5] ring-1 ring-[#C5A36D]/60"
                      : "bg-[#181B2C] text-[#A3A1BD] ring-1 ring-[#55527D]/25 hover:text-[#E4DFD5]"
                  }`}
                >
                  Todos ({translatedSites.length})
                </button>

                {countryList.map(([country, count]) => {
                  const active = selectedCountry === country;
                  const expanded = countryDropdown?.country === country;
                  const flag = COUNTRY_FLAGS[country];
                  return (
                    <button
                      key={country}
                      type="button"
                      data-country-trigger={country}
                      onClick={(e) => handleCountrySelect(country, e.currentTarget)}
                      aria-pressed={active}
                      aria-expanded={expanded}
                      aria-haspopup="menu"
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D] ${
                        active
                          ? "bg-[#C5A36D]/20 text-[#E4DFD5] ring-1 ring-[#C5A36D]/60"
                          : "bg-[#181B2C] text-[#A3A1BD] ring-1 ring-[#55527D]/25 hover:text-[#E4DFD5]"
                      }`}
                    >
                      {flag && (
                        <span aria-hidden="true" className="text-xs leading-none">
                          {flag}
                        </span>
                      )}
                      <span>{country}</span>
                      <span className="font-mono text-[10px] opacity-75">({count})</span>
                      {expanded ? (
                        <ChevronUp className="h-3 w-3 opacity-75" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-3 w-3 opacity-55" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => scrollCountryBar("right")}
                disabled={!canScrollRight}
                aria-label="Desplazar países a la derecha"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#181B2C] text-[#A3A1BD] ring-1 ring-[#55527D]/30 transition-colors hover:text-[#E4DFD5] disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
              >
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </>
          )}

          {mainTab === "luna" && (
            <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
              {[
                { id: "ALL", label: "Todos" },
                { id: "shackleton-crater", label: "Cráter Shackleton" },
                { id: "mouton-mons", label: "Mons Mouton (Artemis III)" },
                { id: "mare-tranquillitatis", label: "Mare Tranquillitatis" },
              ].map((item) => {
                const active = selectedTargetFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedTargetFilter(item.id);
                      if (item.id !== "ALL") setActiveTargetId(item.id);
                    }}
                    aria-pressed={active}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D] ${
                      active
                        ? "bg-[#7CA5B8]/20 text-[#E4DFD5] ring-1 ring-[#7CA5B8]/60"
                        : "bg-[#181B2C] text-[#A3A1BD] ring-1 ring-[#55527D]/25 hover:text-[#E4DFD5]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}

          {mainTab === "marte" && (
            <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
              {[
                { id: "ALL", label: "Todos" },
                { id: "jezero-crater", label: "Cráter Jezero" },
                { id: "olympus-mons-flank", label: "Monte Olimpo" },
                { id: "valles-marineris", label: "Valles Marineris" },
              ].map((item) => {
                const active = selectedTargetFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedTargetFilter(item.id);
                      if (item.id !== "ALL") setActiveTargetId(item.id);
                    }}
                    aria-pressed={active}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D] ${
                      active
                        ? "bg-[#D47A61]/20 text-[#E4DFD5] ring-1 ring-[#D47A61]/60"
                        : "bg-[#181B2C] text-[#A3A1BD] ring-1 ring-[#55527D]/25 hover:text-[#E4DFD5]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 text-xs text-[#A3A1BD]">
          <span className="font-mono tabular-nums">
            {filteredSites.length}{" "}
            {filteredSites.length === 1 ? "ubicación" : "ubicaciones"}
          </span>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                setSelectedCountry("TODOS");
                setSelectedTargetFilter("ALL");
                setSearchQuery("");
                setCountryDropdown(null);
                notifyUser("Filtros restablecidos");
              }}
              className="rounded px-2 py-0.5 text-[11px] font-medium text-[#C5A36D] transition-colors hover:bg-[#1F243B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Menú desplegable de sitios por país */}
      {mainTab === "tierra" && countryDropdown && (
        <div
          ref={dropdownRef}
          role="menu"
          aria-label={`Ubicaciones en ${countryDropdown.country}`}
          style={{ top: countryDropdown.top, left: countryDropdown.left }}
          className="fixed z-50 max-h-[60vh] w-[320px] max-w-[calc(100vw-24px)] overflow-y-auto rounded-xl border border-[#55527D]/35 bg-[#121626]/95 p-1.5 shadow-2xl backdrop-blur-md sm:w-[340px]"
        >
          <div className="mb-1 flex items-center justify-between border-b border-[#55527D]/25 px-2.5 py-1.5">
            <span className="text-[11px] font-semibold tracking-wider text-[#C5A36D] uppercase">
              {countryDropdown.country} ({dropdownSites.length})
            </span>
            <button
              type="button"
              onClick={() => setCountryDropdown(null)}
              aria-label={`Cerrar lista de ${countryDropdown.country}`}
              className="rounded p-0.5 text-[#A3A1BD] transition-colors hover:bg-[#1F243B] hover:text-[#E4DFD5]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-col gap-0.5">
            {dropdownSites.map((site) => {
              const isSelected = selectedSiteId === site.id;
              const isMars = dataset.references[site.best_target]?.body === "Mars";
              return (
                <button
                  key={site.id}
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelectSubmenuSite(site)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? "bg-[#C5A36D]/20 text-[#E4DFD5]"
                      : "text-[#E4DFD5]/90 hover:bg-[#1F243B]"
                  }`}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        isMars ? "bg-[#D47A61]" : "bg-[#7CA5B8]"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="font-medium leading-snug">{site.name}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[11px] font-semibold tabular-nums text-[#C5A36D]">
                    {site.overall_asi.toFixed(1)}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Área principal: Panel lateral acoplado + Mapa protagonista */}
      <main className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Panel lateral izquierdo (Ubicación o Directorio) */}
        {showSidePanel && (
          <div className="absolute inset-0 z-30 flex flex-col border-r border-[#55527D]/25 bg-[#121626] md:relative md:inset-auto md:w-[390px] md:shrink-0 lg:w-[410px]">
            {showDirectory ? (
              <section
                id="directory-drawer"
                aria-label="Directorio de sitios análogos"
                className="flex h-full flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-[#55527D]/25 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ListFilter className="h-4 w-4 text-[#C5A36D]" aria-hidden="true" />
                    <h2 className="font-serif text-base font-semibold text-[#E4DFD5]">
                      Directorio ({filteredSites.length})
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDirectory(false)}
                    aria-label="Cerrar directorio de sitios"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#A3A1BD] transition-colors hover:bg-[#1F243B] hover:text-[#E4DFD5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
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
            ) : (
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
                onFeedback={notifyUser}
              />
            )}
          </div>
        )}

        {/* Vista expandida de comparación planetaria (3 columnas) */}
        {selectedSite && comparisonExpanded && (
          <div className="absolute inset-0 z-40 flex flex-col bg-[#101321]">
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
              onFeedback={notifyUser}
            />
          </div>
        )}

        {/* Área central de visualización cartográfica */}
        <div id="map-region" className="relative isolate z-0 h-full min-w-0 flex-1">
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

          {/* Retroalimentación contextual de modo activo */}
          {(probeMode || regionProbeMode || (!showSidePanel && !feedbackMessage)) && (
            <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-md">
              {probeMode ? (
                <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-[#C5A36D]/50 bg-[#101321]/92 px-3 py-2 text-xs text-[#E4DFD5] shadow-lg backdrop-blur-md">
                  <span>
                    Haz clic en cualquier punto del mapa para evaluar su similitud con la Luna y Marte.
                  </span>
                  <button
                    type="button"
                    onClick={() => setProbeMode(false)}
                    className="shrink-0 font-medium text-[#C5A36D] hover:underline"
                  >
                    Cancelar
                  </button>
                </div>
              ) : regionProbeMode ? (
                <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-[#7CA5B8]/50 bg-[#101321]/92 px-3 py-2 text-xs text-[#E4DFD5] shadow-lg backdrop-blur-md">
                  <span>
                    Arrastra un rectángulo en el mapa o pulsa Escanear vista para analizar una grilla {regionGridSize}×{regionGridSize}.
                  </span>
                  <button
                    type="button"
                    onClick={() => setRegionProbeMode(false)}
                    className="shrink-0 font-medium text-[#7CA5B8] hover:underline"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border border-[#55527D]/30 bg-[#101321]/85 px-3 py-1.5 text-xs text-[#A3A1BD] backdrop-blur-md">
                  Selecciona un marcador en el mapa para ver su ficha científica o sondea cualquier coordenada.
                </div>
              )}
            </div>
          )}

          {/* Notificación de retroalimentación inmediata */}
          {feedbackMessage && (
            <div
              role="status"
              aria-live="polite"
              className="pointer-events-none absolute bottom-14 left-1/2 z-20 -translate-x-1/2 rounded-full border border-[#C5A36D]/45 bg-[#101321]/95 px-4 py-1.5 text-xs font-medium text-[#E4DFD5] shadow-xl backdrop-blur-md"
            >
              {feedbackMessage}
            </div>
          )}

          {/* Módulo flotante compacto de Prospección Regional */}
          {(rankedRegionResult || regionError || isProbingRegion) && !comparisonExpanded && (
            <section
              aria-label="Resultados de prospección regional"
              className="absolute bottom-24 right-3 z-20 w-[335px] max-w-[calc(100%-1.5rem)] rounded-xl border border-[#55527D]/35 bg-[#121626]/95 p-3 text-xs text-[#E4DFD5] shadow-2xl backdrop-blur-md"
            >
              <div className="flex items-center justify-between gap-2 border-b border-[#55527D]/25 pb-2">
                <div>
                  <h2 className="text-[11px] font-semibold tracking-wider text-[#C5A36D] uppercase">
                    {isProbingRegion
                      ? `Escaneando grilla ${regionGridSize}×${regionGridSize}...`
                      : regionError
                      ? "Error en sondeo regional"
                      : `Prospección ${rankedRegionResult?.grid_size ?? 3}×${rankedRegionResult?.grid_size ?? 3} · ${rankedRegionResult?.evaluated_count ?? 0} pts`}
                  </h2>
                  {!regionError && rankedRegionResult && (
                    <p className="mt-0.5 font-mono text-[10px] tabular-nums text-[#A3A1BD]">
                      {rankedRegionResult.bounds.minLat.toFixed(2)}°..
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
                        aria-label={
                          regionCollapsed
                            ? "Expandir prospección regional"
                            : "Contraer prospección regional"
                        }
                        className="rounded p-1 text-[#A3A1BD] hover:bg-[#1F243B] hover:text-[#E4DFD5]"
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
                          notifyUser("GeoJSON de prospección regional descargado");
                        }}
                        title="Exportar GeoJSON de prospección regional"
                        aria-label="Exportar GeoJSON de prospección regional"
                        className="rounded p-1 text-[#A3A1BD] hover:bg-[#1F243B] hover:text-[#C5A36D]"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
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
                    className="rounded p-1 text-[#A3A1BD] hover:bg-[#1F243B] hover:text-[#E4DFD5]"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {isProbingRegion ? (
                <p className="mt-2.5 font-mono text-[11px] text-[#7CA5B8]">
                  Consultando NASA POWER y Copernicus DEM para{" "}
                  {regionGridSize * regionGridSize} sectores...
                </p>
              ) : regionError ? (
                <p className="mt-2 text-rose-300">{regionError}</p>
              ) : (
                !regionCollapsed &&
                rankedRegionResult && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[11px] text-[#A3A1BD]">Orden:</span>
                      <div
                        className="flex items-center rounded bg-[#181B2C] p-0.5 ring-1 ring-[#55527D]/25"
                        role="group"
                        aria-label="Modo de clasificación regional"
                      >
                        <button
                          type="button"
                          onClick={() => setRegionRankByActiveTarget(true)}
                          aria-pressed={regionRankByActiveTarget}
                          className={`whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                            regionRankByActiveTarget
                              ? "bg-[#C5A36D]/20 text-[#E4DFD5]"
                              : "text-[#A3A1BD] hover:text-[#E4DFD5]"
                          }`}
                        >
                          {(
                            translatedReferences[activeTargetId]?.name ??
                            "Objetivo activo"
                          ).split(" / ")[0]}
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegionRankByActiveTarget(false)}
                          aria-pressed={!regionRankByActiveTarget}
                          className={`whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                            !regionRankByActiveTarget
                              ? "bg-[#C5A36D]/20 text-[#E4DFD5]"
                              : "text-[#A3A1BD] hover:text-[#E4DFD5]"
                          }`}
                        >
                          Mejor global
                        </button>
                      </div>
                    </div>

                    {regionSummary && (
                      <div className="rounded-lg bg-[#181B2C]/80 p-2 font-mono text-[10px] tabular-nums">
                        <div className="flex items-center justify-between text-[#E4DFD5]">
                          <span>
                            Mejor:{" "}
                            <strong className="text-[#C5A36D]">
                              {regionSummary.maxAsi.toFixed(1)}%
                            </strong>{" "}
                            · Prom:{" "}
                            <strong className="text-[#7CA5B8]">
                              {regionSummary.meanAsi.toFixed(1)}%
                            </strong>
                          </span>
                          <span>
                            {Math.round(regionSummary.elevMinM)}–
                            {Math.round(regionSummary.elevMaxM)} m
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[#A3A1BD]">
                          <span>
                            Supera {regionSummary.beatenCatalogCount}/
                            {regionSummary.totalCatalogCount} sitios
                          </span>
                          <span>Pend. máx {regionSummary.maxSlopeDeg.toFixed(1)}°</span>
                        </div>
                      </div>
                    )}

                    <ul className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
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
                                  ? "border-[#C5A36D] bg-[#C5A36D]/15"
                                  : "border-[#55527D]/25 bg-[#181B2C]/60 hover:border-[#C5A36D]/40"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-[11px] font-semibold tabular-nums text-[#E4DFD5]">
                                  #{idx + 1} · {pt.latitude.toFixed(2)}°,{" "}
                                  {pt.longitude.toFixed(2)}°
                                </span>
                                <span
                                  className={`font-mono text-xs font-bold tabular-nums ${
                                    scored.body === "Mars"
                                      ? "text-[#D47A61]"
                                      : "text-[#7CA5B8]"
                                  }`}
                                >
                                  {scored.asi.toFixed(1)}%
                                </span>
                              </div>
                              <div className="mt-0.5 flex items-center justify-between font-mono text-[10px] tabular-nums text-[#A3A1BD]">
                                <span>
                                  {Math.round(pt.elevation_m)} m ·{" "}
                                  {pt.dem_telemetry.dem_slope_deg.toFixed(1)}°
                                </span>
                                <span>{scored.targetName}</span>
                              </div>
                              <p className="mt-0.5 line-clamp-1 text-[10px] text-[#A3A1BD]">
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
        </div>
      </main>

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
