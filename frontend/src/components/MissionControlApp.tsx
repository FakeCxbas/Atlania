"use client";

import { useMemo, useState } from "react";
import type { AnalogDataset } from "@/types/analog";
import { AnalogMap } from "@/components/AnalogMap";
import { SiteDirectory } from "@/components/SiteDirectory";
import { TelemetryDrawer } from "@/components/TelemetryDrawer";
import { Globe2, Moon, Orbit } from "lucide-react";

interface MissionControlAppProps {
  dataset: AnalogDataset;
}

type BodyFilter = "ALL" | "Moon" | "Mars" | "ECUADOR";

export function MissionControlApp({ dataset }: MissionControlAppProps) {
  const [bodyFilter, setBodyFilter] = useState<BodyFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(
    dataset.sites[0]?.id ?? null
  );
  const [activeTargetId, setActiveTargetId] = useState<string>(
    dataset.sites[0]?.best_target ??
      Object.keys(dataset.references)[0] ??
      ""
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
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#060913] text-slate-100">
      <a
        href="#main-workspace"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-cyan-500 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950"
      >
        Skip to workspace
      </a>

      {/* Top Mission Control Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-[#0D1424]/95 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-400">
            <Orbit className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-100">
              TERR-ANALOG // Planetary Analog Explorer
            </h1>
            <p className="text-xs text-slate-400">
              NASA Space Apps 2026 · {dataset.methodology.source_counts.nasa_power}{" "}
              NASA POWER Live + {dataset.methodology.source_counts.fallback}{" "}
              Fallback
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
      </header>

      {/* Main 3-Pane Workspace */}
      <main
        id="main-workspace"
        tabIndex={-1}
        className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[310px_1fr_390px]"
      >
        <div className="order-2 min-h-[260px] overflow-hidden lg:order-1 lg:min-h-0">
          <SiteDirectory
            sites={filteredSites}
            references={dataset.references}
            selectedSiteId={selectedSite?.id ?? null}
            onSelectSite={handleSelectSite}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        <div className="order-1 min-h-[320px] overflow-hidden lg:order-2 lg:min-h-0">
          <AnalogMap
            sites={filteredSites}
            references={dataset.references}
            selectedSiteId={selectedSite?.id ?? null}
            onSelectSite={handleSelectSite}
          />
        </div>

        <div className="order-3 min-h-[320px] overflow-hidden lg:min-h-0">
          <TelemetryDrawer
            site={selectedSite}
            references={dataset.references}
            activeTargetId={activeTargetId}
            onSelectTarget={setActiveTargetId}
          />
        </div>
      </main>
    </div>
  );
}
