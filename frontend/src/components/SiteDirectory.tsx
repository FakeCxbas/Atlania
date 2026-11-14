"use client";

import type { AnalogSite, TargetProfile } from "@/types/analog";
import { MapPin, Search } from "lucide-react";
import { translateSite, translateTarget } from "@/lib/spanishTranslations";

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
      aria-label="Directorio de sitios análogos terrestres"
      className="flex h-full flex-col bg-[#0D1424]/95 text-slate-100 backdrop-blur-md"
    >
      <div className="border-b border-slate-800/80 p-3">
        <label htmlFor="site-search" className="sr-only">
          Filtrar sitios análogos por nombre, país u objetivo espacial
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
            placeholder="Buscar por nombre, país u objetivo..."
            className="min-h-[40px] w-full rounded-lg border border-slate-700/80 bg-[#060913] pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#D4AF37]/70 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {sites.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">
            No hay sitios análogos que coincidan con la búsqueda o filtro activo.
          </div>
        ) : (
          <ul className="space-y-1.5">
            {sites.map((rawSite) => {
              const site = translateSite(rawSite);
              const isSelected = site.id === selectedSiteId;
              const rawTarget = references[site.best_target];
              const target = rawTarget ? translateTarget(rawTarget) : undefined;
              const isMars = target?.body === "Mars";
              const badgeColor = isMars
                ? "border-[#E07A5F]/40 bg-[#E07A5F]/15 text-[#E07A5F]"
                : "border-cyan-500/40 bg-cyan-500/15 text-cyan-300";

              return (
                <li key={site.id}>
                  <button
                    type="button"
                    onClick={() => onSelectSite(site.id)}
                    aria-pressed={isSelected}
                    className={`w-full min-h-[44px] rounded-lg border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-[#D4AF37] bg-[#D4AF37]/15 shadow-[0_0_12px_rgba(212,175,55,0.2)]"
                        : "border-slate-800/80 bg-[#060913]/60 hover:border-slate-700 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium leading-snug text-slate-100">
                        {site.name}
                      </span>
                      <span className="font-mono text-sm font-semibold tabular-nums text-[#D4AF37]">
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
                        {isMars ? "Marte" : "Luna"}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate">
                        {target?.name ?? site.best_target}
                      </span>
                      <span className="font-mono tabular-nums text-slate-500">
                        {site.elevation_m.toLocaleString()} m
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
