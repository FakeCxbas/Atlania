"use client";

import type { AnalogSite, TargetProfile } from "@/types/analog";
import { MapPin, Search } from "lucide-react";

interface SiteDirectoryProps {
  sites: AnalogSite[];
  references: Record<string, TargetProfile>;
  selectedSiteId: string | null;
  onSelectSite: (siteId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function SiteDirectory({
  sites,
  references,
  selectedSiteId,
  onSelectSite,
  searchQuery,
  onSearchChange,
}: SiteDirectoryProps) {
  return (
    <nav
      aria-label="Terrestrial analog site directory"
      className="flex h-full flex-col border-r border-slate-800/80 bg-[#0D1424]/95 backdrop-blur-md"
    >
      <div className="border-b border-slate-800/80 p-3">
        <label htmlFor="site-search" className="sr-only">
          Filter analog sites by name, country, or target
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="site-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter sites, country, target..."
            className="min-h-[40px] w-full rounded border border-slate-700/80 bg-[#060913] pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {sites.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">
            No analog sites match the current filter. Clear the search or switch
            target filters.
          </div>
        ) : (
          <ul className="space-y-1.5">
            {sites.map((site) => {
              const isSelected = site.id === selectedSiteId;
              const target = references[site.best_target];
              const body = target?.body ?? "Moon";
              const isMars = body === "Mars";
              const badgeColor = isMars
                ? "border-[#E07A5F]/40 bg-[#E07A5F]/15 text-[#E07A5F]"
                : "border-cyan-500/40 bg-cyan-500/15 text-cyan-300";

              return (
                <li key={site.id}>
                  <button
                    type="button"
                    onClick={() => onSelectSite(site.id)}
                    aria-pressed={isSelected}
                    className={`w-full min-h-[44px] rounded-md border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-cyan-500/70 bg-cyan-950/30"
                        : "border-slate-800/80 bg-[#060913]/50 hover:border-slate-700 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium leading-snug text-slate-100">
                        {site.name}
                      </span>
                      <span className="font-mono text-sm font-semibold tabular-nums text-cyan-300">
                        {site.overall_asi.toFixed(1)}%
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {site.country}
                      </span>
                      <span
                        className={`shrink-0 rounded border px-1.5 py-0.5 text-[11px] font-medium ${badgeColor}`}
                      >
                        {body}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate">
                        {target?.name ?? site.best_target}
                      </span>
                      <span className="font-mono tabular-nums text-slate-500">
                        {site.elevation_m} m
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </nav>
  );
}
