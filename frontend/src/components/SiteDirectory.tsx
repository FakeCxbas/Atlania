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
      className="flex h-full flex-col bg-[#121626] text-[#E4DFD5]"
    >
      <div className="border-b border-[#55527D]/25 p-3">
        <label htmlFor="site-search" className="sr-only">
          Filtrar sitios análogos por nombre, país u objetivo espacial
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A3A1BD]"
            aria-hidden="true"
          />
          <input
            id="site-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre, país u objetivo..."
            className="min-h-[40px] w-full rounded-lg border border-[#55527D]/30 bg-[#181B2C] pl-9 pr-3 text-sm text-[#E4DFD5] placeholder:text-[#A3A1BD]/70 focus:border-[#C5A36D]/60 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5">
        {sites.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#A3A1BD]">
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
                ? "bg-[#D47A61]/15 text-[#D47A61]"
                : "bg-[#7CA5B8]/15 text-[#7CA5B8]";

              return (
                <li key={site.id}>
                  <button
                    type="button"
                    onClick={() => onSelectSite(site.id)}
                    aria-pressed={isSelected}
                    className={`w-full min-h-[44px] rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D] ${
                      isSelected
                        ? "border-[#C5A36D]/70 bg-[#C5A36D]/15"
                        : "border-[#55527D]/20 bg-[#181B2C]/65 hover:border-[#C5A36D]/40 hover:bg-[#1F243B]/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium leading-snug text-[#E4DFD5]">
                        {site.name}
                      </span>
                      <span className="font-mono text-sm font-semibold tabular-nums text-[#C5A36D]">
                        {site.overall_asi.toFixed(1)}%
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-[#A3A1BD]">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {site.country}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeColor}`}
                      >
                        {isMars ? "Marte" : "Luna"}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-[#A3A1BD]">
                      <span className="truncate">
                        {target?.name ?? site.best_target}
                      </span>
                      <span className="font-mono tabular-nums opacity-80">
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
