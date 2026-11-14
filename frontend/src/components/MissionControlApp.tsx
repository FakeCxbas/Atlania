"use client";

import { useMemo, useState, useEffect } from "react";
import type { AnalogDataset } from "@/types/analog";
import { AnalogMap, type CameraTarget } from "@/components/AnalogMap";
import { SiteDirectory } from "@/components/SiteDirectory";
import { TelemetryDrawer } from "@/components/TelemetryDrawer";
import { translateSite, translateTarget } from "@/lib/spanishTranslations";
import {
  Globe2,
  Moon,
  Orbit,
  Search,
  ListFilter,
  X,
  Compass,
  MapPin,
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
    dataset.sites[0]?.id ?? null
  );
  const [activeTargetId, setActiveTargetId] = useState<string>(
    dataset.sites[0]?.best_target ?? Object.keys(dataset.references)[0] ?? ""
  );
  const [showDirectory, setShowDirectory] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<CameraTarget | null>(null);

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

  const selectedSite = useMemo(() => {
    if (!selectedSiteId) return null;
    return translatedSites.find((s) => s.id === selectedSiteId) ?? null;
  }, [translatedSites, selectedSiteId]);

  // Handle selecting a site from map marker or directory
  const handleSelectSite = (siteId: string) => {
    // When selecting a site, ensure directory is closed so panels don't overlap
    setShowDirectory(false);
    setSelectedSiteId(siteId);
    setCameraTarget({ type: "site", siteId });

    const site = dataset.sites.find((s) => s.id === siteId);
    if (site) {
      setActiveTargetId(site.best_target);
    }
  };

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
          sites={filteredSites}
          references={translatedReferences}
          selectedSiteId={selectedSiteId}
          onSelectSite={handleSelectSite}
          cameraTarget={cameraTarget}
        />
      </div>

      {/* 2. Top Navigation Bar (Fixed z-40, Never Covered by Side Panels) */}
      <header
        aria-label="Navegación principal de exploración análoga"
        className="absolute left-0 right-0 top-0 z-40 border-b border-[#D4AF37]/30 bg-[#060913]/95 px-3 py-2.5 shadow-2xl backdrop-blur-md sm:px-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D4AF37]/50 bg-[#D4AF37]/15 text-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.25)]">
              <Compass className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <span className="block text-xs font-bold tracking-wider text-slate-100 uppercase sm:text-sm">
                TERR-ANALOG
              </span>
              <span className="text-[10px] text-slate-400">
                NASA Space Apps · Análogos Lunares y Marcianos
              </span>
            </div>
          </div>

          {/* 3 Main Clean Navigation Tabs */}
          <nav
            aria-label="Pestañas principales de exploración"
            className="flex items-center rounded-xl border border-slate-800 bg-[#0D1424]/90 p-1 shadow-inner"
          >
            <button
              type="button"
              onClick={() => handleTabChange("tierra")}
              aria-selected={mainTab === "tierra"}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                mainTab === "tierra"
                  ? "border border-[#D4AF37] bg-[#D4AF37]/25 text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.25)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Globe2 className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
              <span>Tierra</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("luna")}
              aria-selected={mainTab === "luna"}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                mainTab === "luna"
                  ? "border border-[#D4AF37] bg-[#D4AF37]/25 text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.25)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Moon className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
              <span>Luna</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("marte")}
              aria-selected={mainTab === "marte"}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                mainTab === "marte"
                  ? "border border-[#D4AF37] bg-[#D4AF37]/25 text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.25)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Orbit className="h-3.5 w-3.5 text-[#E07A5F]" aria-hidden="true" />
              <span>Marte</span>
            </button>
          </nav>

          {/* Right Tools: Directory Toggle & Search */}
          <div className="flex items-center gap-2">
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
              <span className="hidden sm:inline">Directorio de Sitios</span>
              <span className="font-mono tabular-nums text-[11px] text-[#D4AF37]">
                ({filteredSites.length})
              </span>
            </button>

            <div className="relative hidden md:block">
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
                className="h-8 w-44 rounded-lg border border-slate-800 bg-[#0D1424] pl-8 pr-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:w-56 focus:border-[#D4AF37]/60 focus:outline-none transition-all"
              />
            </div>
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
                onClick={() => setSelectedTargetFilter("shackleton-crater")}
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
                onClick={() => setSelectedTargetFilter("mare-tranquillitatis")}
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
                onClick={() => setSelectedTargetFilter("jezero-crater")}
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
                onClick={() => setSelectedTargetFilter("olympus-mons-flank")}
                aria-pressed={selectedTargetFilter === "olympus-mons-flank"}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  selectedTargetFilter === "olympus-mons-flank"
                    ? "border-[#E07A5F] bg-[#E07A5F]/20 text-[#E07A5F] shadow-[0_0_10px_rgba(224,122,95,0.2)]"
                    : "border-slate-800/90 bg-[#0D1424]/90 text-slate-300 hover:border-slate-700 hover:text-slate-100"
                }`}
              >
                Flanco del Monte Olimpo (Tubos Volcánicos)
              </button>
            </>
          )}
        </div>
      </header>

      {/* 3. Floating Slide-over Sheet (Strictly positioned below top header at top-[110px], preventing overlap) */}
      {selectedSite && !showDirectory && (
        <section
          aria-label={`Detalle del sitio ${selectedSite.name}`}
          className="fixed bottom-3 left-3 right-3 top-[108px] z-30 flex flex-col overflow-hidden rounded-2xl border-2 border-[#D4AF37]/60 bg-[#0D1424]/95 shadow-[0_0_35px_rgba(212,175,55,0.2)] backdrop-blur-md sm:bottom-4 sm:left-4 sm:top-[112px] sm:w-[470px] sm:max-w-[calc(100vw-32px)] animate-in slide-in-from-left duration-300"
        >
          <TelemetryDrawer
            site={selectedSite}
            references={translatedReferences}
            activeTargetId={activeTargetId}
            onSelectTarget={setActiveTargetId}
            onClose={() => setSelectedSiteId(null)}
          />
        </section>
      )}

      {/* 4. Collapsible Site Directory Drawer (Mutually exclusive with site detail, strictly below top header) */}
      {showDirectory && (
        <section
          id="directory-drawer"
          aria-label="Directorio completo de sitios análogos"
          className="fixed bottom-3 left-3 right-3 top-[108px] z-30 flex flex-col overflow-hidden rounded-2xl border-2 border-[#D4AF37]/50 bg-[#0D1424]/95 shadow-2xl backdrop-blur-md sm:bottom-4 sm:left-4 sm:top-[112px] sm:w-[380px] animate-in slide-in-from-left duration-300"
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#060913]/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <ListFilter className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-slate-100">
                Directorio ({filteredSites.length} sitios)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowDirectory(false)}
              aria-label="Cerrar directorio de sitios (Escape)"
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
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
    </div>
  );
}
