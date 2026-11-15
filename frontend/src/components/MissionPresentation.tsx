"use client";

import type { AnalogDataset, AnalogSite, TargetProfile } from "@/types/analog";
import {
  ArrowRight,
  Compass,
  Cpu,
  Database,
  Globe2,
  Layers,
  MapPin,
  Moon,
  Orbit,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

interface MissionPresentationProps {
  dataset: AnalogDataset;
  sites: AnalogSite[];
  references: Record<string, TargetProfile>;
  onSelectSiteAndExplore: (siteId: string) => void;
  onClose: () => void;
}

export function MissionPresentation({
  dataset,
  sites,
  references,
  onSelectSiteAndExplore,
  onClose,
}: MissionPresentationProps) {
  const ecuadorSites = sites
    .filter((s) => s.country === "Ecuador")
    .sort((a, b) => b.overall_asi - a.overall_asi);

  const southAmericaSites = sites
    .filter(
      (s) =>
        s.country === "Chile" ||
        s.country === "Bolivia" ||
        s.country === "Argentina" ||
        s.country === "Perú" ||
        s.country === "Chile / Argentina"
    )
    .sort((a, b) => b.overall_asi - a.overall_asi);

  const topGlobalSites = [...sites]
    .sort((a, b) => b.overall_asi - a.overall_asi)
    .slice(0, 9);

  const moonTargets = Object.values(references).filter((r) => r.body === "Moon");
  const marsTargets = Object.values(references).filter((r) => r.body === "Mars");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="presentation-hero-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#060913] text-slate-100 selection:bg-cyan-500/30"
    >
      {/* Top Sticky Telemetry Header */}
      <header className="sticky top-0 z-30 border-b border-[#D4AF37]/30 bg-[#060913]/90 px-4 py-3 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D4AF37]/60 bg-[#D4AF37]/15 text-[#D4AF37]">
              <Compass className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="block text-xs font-bold tracking-widest text-[#D4AF37] uppercase">
                NASA SPACE APPS CHALLENGE · GUAYAQUIL
              </span>
              <span className="text-sm font-semibold text-slate-100">
                ATLANIA // Observatorio Planetario &amp; Dossier Científico
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF37] bg-[#D4AF37]/20 px-4 py-2 text-xs font-bold text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.25)] transition-all hover:bg-[#D4AF37]/30 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            >
              <Globe2 className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              <span>Abrir Observatorio Planetario</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar presentación y volver al mapa"
              className="rounded-lg border border-slate-800 bg-[#0D1424] p-2 text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-100"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-16 px-4 py-10 sm:px-8 sm:py-14">
        {/* 1. HERO SECTION */}
        <section className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#0D1424] via-[#060913] to-[#0D1424] p-6 shadow-2xl sm:p-12">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-1 text-xs font-medium text-cyan-300">
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
              <span>Reto: Identify Earth Locations that Analog the Moon &amp; Mars</span>
            </div>

            <h1
              id="presentation-hero-title"
              className="text-3xl font-bold tracking-tight text-slate-100 sm:text-5xl sm:leading-[1.12]"
            >
              Cartografía Cuantitativa de{" "}
              <span className="text-[#D4AF37]">Análogos Terrestres</span> para
              Bases Lunares y Exploración en Marte
            </h1>

            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              Antes de enviar hábitats presurizados, perforadoras criogénicas ISRU o
              rovers autónomos al Polo Sur Lunar (Artemis) y al Cráter Jezero en Marte,
              las agencias espaciales necesitan validarlos en la Tierra.{" "}
              <strong className="text-slate-100">ATLANIA</strong> cruza
              climatología satelital de <strong className="text-cyan-300">NASA POWER</strong>,
              modelos digitales de elevación (<strong className="text-cyan-300">Copernicus GLO-90</strong>)
              y archivos del <strong className="text-cyan-300">Planetary Data System (PDS)</strong>{" "}
              mediante el Índice de Similitud Análoga (<strong className="text-[#D4AF37]">ASI</strong>)
              en 5 ejes.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl border border-[#D4AF37] bg-[#D4AF37] px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-transform hover:scale-[1.01]"
              >
                <span>Explorar {sites.length} Análogos en el Mapa 3D</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              {ecuadorSites[0] && (
                <button
                  type="button"
                  onClick={() => onSelectSiteAndExplore(ecuadorSites[0].id)}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/50 bg-[#0D1424] px-5 py-3 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/15"
                >
                  <MapPin className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
                  <span>Inspeccionar Análogos de Ecuador ({ecuadorSites.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* KPI Telemetry Strip */}
          <div className="mt-10 grid grid-cols-2 gap-3 border-t border-slate-800/90 pt-8 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-800/90 bg-[#060913]/80 p-4">
              <span className="block text-xs text-slate-400">Sitios Terrestres Evaluados</span>
              <span className="mt-1 block font-mono text-2xl font-bold tabular-nums text-[#D4AF37] sm:text-3xl">
                {sites.length}
              </span>
              <span className="mt-1 block text-[11px] text-slate-400">
                En {new Set(sites.map((s) => s.country)).size} países y regiones
              </span>
            </div>
            <div className="rounded-xl border border-slate-800/90 bg-[#060913]/80 p-4">
              <span className="block text-xs text-slate-400">Objetivos Planetarios (PDS)</span>
              <span className="mt-1 block font-mono text-2xl font-bold tabular-nums text-cyan-400 sm:text-3xl">
                {Object.keys(references).length}
              </span>
              <span className="mt-1 block text-[11px] text-slate-400">
                {moonTargets.length} Lunares (Artemis) · {marsTargets.length} Marcianos
              </span>
            </div>
            <div className="rounded-xl border border-slate-800/90 bg-[#060913]/80 p-4">
              <span className="block text-xs text-slate-400">Telemetría Satelital Activa</span>
              <span className="mt-1 block font-mono text-2xl font-bold tabular-nums text-emerald-400 sm:text-3xl">
                {dataset.methodology.source_counts.nasa_power}/{sites.length}
              </span>
              <span className="mt-1 block text-[11px] text-slate-400">
                7 parámetros NASA POWER + DEM GLO-90
              </span>
            </div>
            <div className="rounded-xl border border-slate-800/90 bg-[#060913]/80 p-4">
              <span className="block text-xs text-slate-400">Sondeo Orbital en Tiempo Real</span>
              <span className="mt-1 block font-mono text-2xl font-bold tabular-nums text-[#E07A5F] sm:text-3xl">
                Cualquier Lat/Lon
              </span>
              <span className="mt-1 block text-[11px] text-slate-400">
                Sondeo puntual y barrido matricial 3×3 / 4×4
              </span>
            </div>
          </div>
        </section>

        {/* 2. ECUADOR & SOUTH AMERICA REGIONAL SPOTLIGHT */}
        <section aria-labelledby="ecuador-spotlight-heading" className="space-y-6">
          <div className="flex flex-col justify-between gap-2 border-b border-slate-800 pb-4 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-bold tracking-wider text-[#D4AF37] uppercase">
                Diferenciador Regional Clave · Laboratorio Natural Andino e Insular
              </span>
              <h2
                id="ecuador-spotlight-heading"
                className="mt-1 text-2xl font-bold text-slate-100 sm:text-3xl"
              >
                Ecuador y Sudamérica: Laboratorios Naturales de Clase Mundial
              </h2>
            </div>
            <p className="max-w-md text-xs text-slate-400">
              Desde los tubos de lava basáltica de Galápagos hasta el permafrost
              volcánico del Chimborazo (5,000+ m) y el núcleo hiperárido de Atacama.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ecuadorSites.map((site) => {
              const target = references[site.best_target];
              const isMars = target?.body === "Mars";
              return (
                <article
                  key={site.id}
                  className="flex flex-col justify-between rounded-xl border border-[#D4AF37]/40 bg-[#0D1424]/90 p-4 shadow-lg transition-all hover:border-[#D4AF37]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] font-bold text-[#D4AF37] uppercase">
                        Ecuador · {site.elevation_m.toLocaleString()} m
                      </span>
                      <span className="font-mono text-sm font-bold tabular-nums text-[#D4AF37]">
                        {site.overall_asi.toFixed(1)}% ASI
                      </span>
                    </div>
                    <h3 className="mt-2.5 text-sm font-bold text-slate-100">
                      {site.name}
                    </h3>
                    <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-300">
                      {site.rationale}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-slate-800/80 pt-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        className={
                          isMars ? "font-medium text-[#E07A5F]" : "font-medium text-cyan-300"
                        }
                      >
                        Análogo: {target?.name.split("/")[0] ?? site.best_target}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectSiteAndExplore(site.id)}
                        className="inline-flex items-center gap-1 font-semibold text-[#D4AF37] hover:underline"
                      >
                        <span>Ver en 3D</span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* South America Complement */}
          <div className="grid gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-3">
            {southAmericaSites.map((site) => {
              const target = references[site.best_target];
              return (
                <div
                  key={site.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#0D1424]/60 p-3.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-cyan-400">
                        {site.country}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {site.elevation_m.toLocaleString()} m
                      </span>
                    </div>
                    <h4 className="truncate text-xs font-bold text-slate-100">
                      {site.name}
                    </h4>
                    <span className="block truncate text-[11px] text-slate-400">
                      Objetivo: {target?.name.split("/")[0]}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-mono text-sm font-bold tabular-nums text-[#D4AF37]">
                      {site.overall_asi.toFixed(1)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectSiteAndExplore(site.id)}
                      className="rounded border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-200 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                    >
                      Volar al sitio
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. MATHEMATICAL FRAMEWORK (5-AXIS ASI) */}
        <section aria-labelledby="asi-framework-heading" className="space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-bold tracking-wider text-cyan-400 uppercase">
              Rigor Científico y Formulación Matemática
            </span>
            <h2
              id="asi-framework-heading"
              className="mt-1 text-2xl font-bold text-slate-100 sm:text-3xl"
            >
              Índice de Similitud Análoga (ASI) en 5 Dimensiones
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-[#0D1424]/90 p-6 lg:col-span-1">
              <div className="flex items-center gap-2 text-cyan-400">
                <Cpu className="h-5 w-5" aria-hidden="true" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Ecuación de Puntuación
                </h3>
              </div>
              <div className="my-4 rounded-xl border border-[#D4AF37]/40 bg-[#060913] p-4 font-mono text-xs text-[#D4AF37]">
                ASI(s, t) = Σ w_d(t) · S_d(s, t)
                <br />
                <span className="mt-1 block text-[11px] text-slate-400">
                  donde Σ w_d(t) = 1.0 y S_d ∈ [0, 100]
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                Cada objetivo extraterrestre define un vector de pesos específicos
                de misión. Para variables continuas se emplea la función de
                similitud acotada{" "}
                <code className="rounded bg-slate-800 px-1 py-0.5 font-mono text-cyan-300">
                  L(a,b;s) = max(0, 1 - |a-b|/s)
                </code>
                , y para litología geológica la superposición difusa de Jaccard{" "}
                <code className="rounded bg-slate-800 px-1 py-0.5 font-mono text-cyan-300">
                  Σ min(x_i, y_i) / Σ max(x_i, y_i)
                </code>{" "}
                (que evita premiar ausencias compartidas).
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
              {[
                {
                  title: "1. Topografía y Rugosidad",
                  desc: "Combina pendiente superficial (tolerancia 30°) y rugosidad del terreno mediante muestreo de 5 puntos cardinales en el DEM Copernicus GLO-90.",
                  badge: "Pendiente + Rugosidad DEM",
                },
                {
                  title: "2. Geología y Mineralogía",
                  desc: "Índice difuso de Jaccard sobre 5 miembros litológicos: basalto, regolito/tefra, sedimentario, evaporitas (sulfatos/halita) y brechas de impacto.",
                  badge: "Jaccard Difuso 5 Litologías",
                },
                {
                  title: "3. Régimen Térmico (NASA POWER)",
                  desc: "60% similitud de temperatura media anual ((Tmax + Tmin)/2) y 40% similitud de amplitud térmica diurna (ΔT = Tmax - Tmin) con escala 100°C.",
                  badge: "T2M_MAX + T2M_MIN",
                },
                {
                  title: "4. Sequedad, Hielo e Historia Acuosa",
                  desc: "40% índice de aridez hiperbólico 1/(1 + precip_mm_día), 40% relevancia de permafrost/hielo criogénico y 20% historia fluvio-lacustre.",
                  badge: "PRECTOTCORR + Criósfera",
                },
                {
                  title: "5. Operaciones Subterráneas y Refugio",
                  desc: "70% presencia de conductos/tubos de lava volcánicos y 30% potencial de blindaje natural contra radiación ionizante y micrometeoritos.",
                  badge: "Tubos Lávicos + Hábitat",
                },
                {
                  title: "6. Límites Físicos Explícitos",
                  desc: "Documenta de forma transparente las diferencias irreproducibles en la Tierra: gravedad (1.62 / 3.71 m/s²), vacío/presión CO₂ y radiación GCR.",
                  badge: "Rigor Científico NASA",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-slate-800 bg-[#0D1424]/70 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-100">{item.title}</h4>
                    <span className="rounded bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                      {item.badge}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. PLANETARY REFERENCE TARGETS (MOON & MARS) */}
        <section aria-labelledby="planetary-targets-heading" className="space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-bold tracking-wider text-[#E07A5F] uppercase">
              Destinos de Misión Extraterrestre · NASA Artemis &amp; Mars Exploration Program
            </span>
            <h2
              id="planetary-targets-heading"
              className="mt-1 text-2xl font-bold text-slate-100 sm:text-3xl"
            >
              6 Sitios de Referencia en la Luna y Marte
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.values(references).map((ref) => {
              const isMars = ref.body === "Mars";
              return (
                <div
                  key={ref.id}
                  className={`rounded-xl border p-4 ${
                    isMars
                      ? "border-[#E07A5F]/40 bg-[#0D1424]/85"
                      : "border-cyan-500/40 bg-[#0D1424]/85"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold uppercase ${
                        isMars
                          ? "bg-[#E07A5F]/20 text-[#E07A5F]"
                          : "bg-cyan-500/20 text-cyan-300"
                      }`}
                    >
                      {isMars ? (
                        <Orbit className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <Moon className="h-3 w-3" aria-hidden="true" />
                      )}
                      {isMars ? "Marte" : "Luna"}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      Media {ref.temperature_mean_c}°C · Δ{ref.temperature_range_c}°C
                    </span>
                  </div>

                  <h3 className="mt-2.5 text-sm font-bold text-slate-100">
                    {ref.name}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                    {ref.context}
                  </p>
                  {ref.instrument && (
                    <p className="mt-2.5 border-t border-slate-800 pt-2 font-mono text-[10px] text-slate-400">
                      Instrumentos PDS: {ref.instrument}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. GLOBAL LEADERBOARD TABLE */}
        <section aria-labelledby="leaderboard-heading" className="space-y-5">
          <div className="flex flex-col justify-between gap-2 border-b border-slate-800 pb-4 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-bold tracking-wider text-[#D4AF37] uppercase">
                Ranking Cuantitativo Global
              </span>
              <h2
                id="leaderboard-heading"
                className="mt-1 text-2xl font-bold text-slate-100 sm:text-3xl"
              >
                Top Análogos Terrestres por Índice ASI
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-cyan-400 hover:underline"
            >
              Ver los {sites.length} sitios en el Directorio Interactivo →
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topGlobalSites.map((site, idx) => {
              const target = references[site.best_target];
              const isMars = target?.body === "Mars";
              return (
                <div
                  key={site.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0D1424]/80 p-4 hover:border-slate-700"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        #{idx + 1} · {site.country}
                      </span>
                      <span className="font-mono text-base font-bold tabular-nums text-[#D4AF37]">
                        {site.overall_asi.toFixed(1)}%
                      </span>
                    </div>
                    <h3 className="mt-1 text-sm font-bold text-slate-100">
                      {site.name}
                    </h3>
                    <span
                      className={`mt-1 inline-block text-[11px] font-medium ${
                        isMars ? "text-[#E07A5F]" : "text-cyan-300"
                      }`}
                    >
                      Mejor coincidencia: {target?.name.split("/")[0]}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-[11px]">
                    <span className="font-mono text-slate-400">
                      {site.latitude.toFixed(2)}°, {site.longitude.toFixed(2)}° ·{" "}
                      {site.elevation_m} m
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectSiteAndExplore(site.id)}
                      className="font-semibold text-[#D4AF37] hover:underline"
                    >
                      Inspeccionar →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. ARCHITECTURE & OPEN DATA SOURCES FOOTER */}
        <footer className="rounded-2xl border border-slate-800 bg-[#0D1424]/70 p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                <Database className="h-4 w-4" aria-hidden="true" />
                <span>APIs y Datos Abiertos de la NASA</span>
              </div>
              <ul className="mt-2.5 space-y-1.5 text-xs text-slate-300">
                <li>• NASA POWER Agroclimatology / Renewable Energy API</li>
                <li>• NASA GIBS / Worldview VIIRS True Color WMTS</li>
                <li>• NASA Planetary Data System (LRO LOLA/Diviner, MRO CRISM/HiRISE, Perseverance MEDA)</li>
                <li>• Copernicus DEM GLO-90 / Open-Meteo Elevation API</li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                <Layers className="h-4 w-4" aria-hidden="true" />
                <span>Capacidades de la Plataforma</span>
              </div>
              <ul className="mt-2.5 space-y-1.5 text-xs text-slate-300">
                <li>• Sondeo satelital en vivo de cualquier coordenada o región (3×3 y 4×4)</li>
                <li>• Relieve 3D WebGL con caché persistente en Service Worker</li>
                <li>• Exportación de Dossiers Markdown/JSON y capas GeoJSON para QGIS</li>
                <li>• Clustering K-Means y búsqueda K-NN de análogos en Python</li>
              </ul>
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span>Transparencia Científica</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  {dataset.methodology.interpretation}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-[#D4AF37] bg-[#D4AF37]/20 px-4 py-2.5 text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/30"
              >
                <span>Volver al Mapa Interactivo 3D</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
