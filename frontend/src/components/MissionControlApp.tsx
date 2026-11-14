"use client";

import { useMemo, useRef, useState } from "react";
import type { AnalogDataset } from "@/types/analog";
import { AnalogMap } from "@/components/AnalogMap";
import { SiteDirectory } from "@/components/SiteDirectory";
import { TelemetryDrawer } from "@/components/TelemetryDrawer";
import { MethodologyDialog } from "@/components/MethodologyDialog";
import { Globe2, Moon, Orbit } from "lucide-react";

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

  const selectedSite = useMemo(() => {
    return (
      filteredSites.find((s) => s.id === selectedSiteId) ??
      dataset.sites.find((s) => s.id === selectedSiteId) ??
      filteredSites[0] ??
      null
    );
  }, [filteredSites, dataset.sites, selectedSiteId]);

  const handleSelectSite = (siteId: string) => {
    setSelectedSiteId(siteId);
    const site = dataset.sites.find((s) => s.id === siteId);
    if (site) {
      setActiveTargetId(site.best_target);
      setMobilePanel("telemetry");
      if (window.matchMedia("(max-width: 1023px)").matches)
        telemetryToggle.current?.focus();
    }
  };

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
        <MethodologyDialog dataset={dataset} />
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

        <div className="min-h-0 min-w-0 overflow-hidden lg:order-2">
          <AnalogMap
            sites={filteredSites}
            references={dataset.references}
            selectedSiteId={selectedSite?.id ?? null}
            onSelectSite={handleSelectSite}
          />
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
