"use client";

import { AtlaniaIsotipo } from "@/components/AtlaniaBrand";
import type { AnalogDataset, AnalogSite, TargetProfile } from "@/types/analog";
import {
  ArrowRight,
  ChevronRight,
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
      className="fixed inset-0 z-50 overflow-y-auto bg-[#101321] text-[#E4DFD5] selection:bg-[#7CA5B8]/30"
    >
      {/* Top Sticky Telemetry Header */}
      <header className="sticky top-0 z-30 border-b border-[#C5A36D]/50 bg-[#121626]/90 px-4 py-3 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AtlaniaIsotipo className="h-9 w-9 shrink-0 drop-shadow-[0_0_12px_rgba(228,223,213,0.22)]" />
            <div>
              <nav aria-label="Ruta de navegación" className="flex items-center gap-1 font-mono text-xs text-[#A3A1BD]">
                <button type="button" onClick={onClose} className="transition-colors hover:text-[#7CA5B8]">Inicio</button>
                <ChevronRight className="h-3 w-3 text-[#A3A1BD]" aria-hidden="true" />
                <button type="button" onClick={onClose} className="transition-colors hover:text-[#7CA5B8]">Explorador 3D</button>
                <ChevronRight className="h-3 w-3 text-[#A3A1BD]" aria-hidden="true" />
                <span className="font-semibold text-[#C5A36D]">Dossier Científico</span>
              </nav>
              <span className="text-sm font-semibold text-[#E4DFD5]">
                ATLANIA // Observatorio Planetario &amp; Dossier
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-lg border border-[#C5A36D] bg-[#C5A36D]/20 px-4 py-2 text-xs font-bold text-[#C5A36D] shadow-[0_0_20px_rgba(197,163,109,0.25)] transition-all hover:bg-[#C5A36D]/30 focus:outline-none focus:ring-2 focus:ring-[#C5A36D]"
            >
              <Globe2 className="h-4 w-4 text-[#7CA5B8]" aria-hidden="true" />
              <span>Abrir Observatorio Planetario</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar presentación y volver al mapa"
              className="rounded-lg border border-[#55527D]/35 bg-[#181B2C] p-2 text-[#A3A1BD] transition-colors hover:border-[#55527D]/35 hover:text-[#E4DFD5]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-16 px-4 py-10 sm:px-8 sm:py-14">
        {/* 1. HERO SECTION */}
        <section className="relative overflow-hidden rounded-2xl border border-[#C5A36D]/50 bg-gradient-to-br from-[#121626] via-[#101321] to-[#121626] p-6 shadow-2xl sm:p-12">
          <div className="max-w-3xl space-y-5">
            <div className="flex items-center gap-3.5 pb-1">
              <img
                src="/brand/atlania-isotipo-3d.png"
                alt="Emblema 3D ATLANIA"
                className="h-14 w-14 rounded-full object-contain drop-shadow-[0_0_20px_rgba(197,163,109,0.28)]"
              />
              <img
                src="/brand/atlania-wordmark.png"
                alt="ATLANIA"
                className="h-7 w-auto object-contain"
              />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#C5A36D]/50 bg-[#C5A36D]/15 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#C5A36D]">
              <Sparkles className="h-3.5 w-3.5 text-[#C5A36D]" aria-hidden="true" />
              <span>Reto: Identify Earth Locations that Analog the Moon &amp; Mars</span>
            </div>

            <h1
              id="presentation-hero-title"
              className="text-3xl font-bold tracking-tight text-[#E4DFD5] sm:text-5xl sm:leading-[1.12]"
            >
              Cartografía Cuantitativa de{" "}
              <span className="text-[#C5A36D]">Análogos Terrestres</span> para
              Bases Lunares y Exploración en Marte
            </h1>

            <p className="border-l-2 border-[#C5A36D]/50 pl-3.5 font-serif italic text-xs leading-relaxed text-[#C5A36D] sm:text-sm">
              &ldquo;Hace siglos, los cartógrafos dibujaban territorios inexplorados guiados por relatos y estrellas. 
              Hoy levantamos la mirada al cosmos con la misma inquietud: ¿Y si para comprender otros planetas 
              primero tuviéramos que volver a descubrir el nuestro? Quizá lo desconocido siempre estuvo aquí, 
              esperando a que volviéramos a mirar.&rdquo;
            </p>

            <p className="text-sm leading-relaxed text-[#A3A1BD] sm:text-base">
              Antes de enviar hábitats presurizados, perforadoras criogénicas ISRU o
              rovers autónomos al Polo Sur Lunar (Artemis) y al Cráter Jezero en Marte,
              las agencias espaciales necesitan validarlos en la Tierra.{" "}
              <strong className="text-[#E4DFD5]">ATLANIA</strong> cruza
              climatología satelital de <strong className="text-[#7CA5B8]">NASA POWER</strong>,
              modelos digitales de elevación (<strong className="text-[#7CA5B8]">Copernicus GLO-90</strong>)
              y archivos del <strong className="text-[#7CA5B8]">Planetary Data System (PDS)</strong>{" "}
              mediante el Índice de Similitud Análoga (<strong className="text-[#C5A36D]">ASI</strong>)
              en 5 ejes.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl border border-[#C5A36D] bg-[#C5A36D] px-5 py-3 text-sm font-bold text-[#101321] shadow-[0_0_25px_rgba(197,163,109,0.4)] transition-transform hover:scale-[1.01]"
              >
                <span>Explorar {sites.length} Análogos en el Mapa 3D</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              {ecuadorSites[0] && (
                <button
                  type="button"
                  onClick={() => onSelectSiteAndExplore(ecuadorSites[0].id)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#7CA5B8]/50 bg-[#181B2C] px-5 py-3 text-sm font-semibold text-[#7CA5B8] transition-colors hover:bg-[#7CA5B8]/15"
                >
                  <MapPin className="h-4 w-4 text-[#C5A36D]" aria-hidden="true" />
                  <span>Inspeccionar Análogos de Ecuador ({ecuadorSites.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* KPI Telemetry Strip */}
          <div className="mt-10 grid grid-cols-2 gap-3 border-t border-[#55527D]/35 pt-8 sm:grid-cols-4">
            <div className="rounded-xl border border-[#55527D]/35 bg-[#101321]/80 p-4">
              <span className="block text-xs text-[#A3A1BD]">Sitios Terrestres Evaluados</span>
              <span className="mt-1 block font-mono text-2xl font-bold tabular-nums text-[#C5A36D] sm:text-3xl">
                {sites.length}
              </span>
              <span className="mt-1 block text-[11px] text-[#A3A1BD]">
                En {new Set(sites.map((s) => s.country)).size} países y regiones
              </span>
            </div>
            <div className="rounded-xl border border-[#55527D]/35 bg-[#101321]/80 p-4">
              <span className="block text-xs text-[#A3A1BD]">Objetivos Planetarios (PDS)</span>
              <span className="mt-1 block font-mono text-2xl font-bold tabular-nums text-[#7CA5B8] sm:text-3xl">
                {Object.keys(references).length}
              </span>
              <span className="mt-1 block text-[11px] text-[#A3A1BD]">
                {moonTargets.length} Lunares (Artemis) · {marsTargets.length} Marcianos
              </span>
            </div>
            <div className="rounded-xl border border-[#55527D]/35 bg-[#101321]/80 p-4">
              <span className="block text-xs text-[#A3A1BD]">Telemetría Satelital Activa</span>
              <span className="mt-1 block font-mono text-2xl font-bold tabular-nums text-[#8AB8A8] sm:text-3xl">
                {dataset.methodology.source_counts.nasa_power}/{sites.length}
              </span>
              <span className="mt-1 block text-[11px] text-[#A3A1BD]">
                7 parámetros NASA POWER + DEM GLO-90
              </span>
            </div>
            <div className="rounded-xl border border-[#55527D]/35 bg-[#101321]/80 p-4">
              <span className="block text-xs text-[#A3A1BD]">Sondeo Orbital en Tiempo Real</span>
              <span className="mt-1 block font-mono text-2xl font-bold tabular-nums text-[#E07A5F] sm:text-3xl">
                Cualquier Lat/Lon
              </span>
              <span className="mt-1 block text-[11px] text-[#A3A1BD]">
                Sondeo puntual y barrido matricial 3×3 / 4×4
              </span>
            </div>
          </div>
        </section>

        {/* 2. ECUADOR & SOUTH AMERICA REGIONAL SPOTLIGHT */}
        <section aria-labelledby="ecuador-spotlight-heading" className="space-y-6">
          <div className="flex flex-col justify-between gap-2 border-b border-[#55527D]/35 pb-4 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-bold tracking-wider text-[#C5A36D] uppercase">
                Diferenciador Regional Clave · Laboratorio Natural Andino e Insular
              </span>
              <h2
                id="ecuador-spotlight-heading"
                className="mt-1 text-2xl font-bold text-[#E4DFD5] sm:text-3xl"
              >
                Ecuador y Sudamérica: Laboratorios Naturales de Clase Mundial
              </h2>
            </div>
            <p className="max-w-md text-xs text-[#A3A1BD]">
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
                  className="flex flex-col justify-between rounded-xl border border-[#C5A36D]/50 bg-[#181B2C]/90 p-4 shadow-lg transition-all hover:border-[#C5A36D]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded border border-[#C5A36D]/50 bg-[#C5A36D]/15 px-2 py-0.5 text-[10px] font-bold text-[#C5A36D] uppercase">
                        Ecuador · {site.elevation_m.toLocaleString()} m
                      </span>
                      <span className="font-mono text-sm font-bold tabular-nums text-[#C5A36D]">
                        {site.overall_asi.toFixed(1)}% ASI
                      </span>
                    </div>
                    <h3 className="mt-2.5 text-sm font-bold text-[#E4DFD5]">
                      {site.name}
                    </h3>
                    <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-[#A3A1BD]">
                      {site.rationale}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-[#55527D]/35 pt-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        className={
                          isMars ? "font-medium text-[#E07A5F]" : "font-medium text-[#7CA5B8]"
                        }
                      >
                        Análogo: {target?.name.split("/")[0] ?? site.best_target}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectSiteAndExplore(site.id)}
                        className="inline-flex items-center gap-1 font-semibold text-[#C5A36D] hover:underline"
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
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#55527D]/35 bg-[#181B2C]/60 p-3.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-[#7CA5B8]">
                        {site.country}
                      </span>
                      <span className="font-mono text-[11px] text-[#A3A1BD]">
                        {site.elevation_m.toLocaleString()} m
                      </span>
                    </div>
                    <h4 className="truncate text-xs font-bold text-[#E4DFD5]">
                      {site.name}
                    </h4>
                    <span className="block truncate text-[11px] text-[#A3A1BD]">
                      Objetivo: {target?.name.split("/")[0]}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-mono text-sm font-bold tabular-nums text-[#C5A36D]">
                      {site.overall_asi.toFixed(1)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectSiteAndExplore(site.id)}
                      className="rounded border border-[#55527D]/35 bg-[#181B2C]/80 px-2 py-0.5 text-[11px] text-[#E4DFD5] hover:border-[#C5A36D] hover:text-[#C5A36D]"
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
          <div className="border-b border-[#55527D]/35 pb-4">
            <span className="text-xs font-bold tracking-wider text-[#7CA5B8] uppercase">
              Rigor Científico y Formulación Matemática
            </span>
            <h2
              id="asi-framework-heading"
              className="mt-1 text-2xl font-bold text-[#E4DFD5] sm:text-3xl"
            >
              Índice de Similitud Análoga (ASI) en 5 Dimensiones
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#55527D]/35 bg-[#181B2C]/90 p-6 lg:col-span-1">
              <div className="flex items-center gap-2 text-[#7CA5B8]">
                <Cpu className="h-5 w-5" aria-hidden="true" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Ecuación de Puntuación
                </h3>
              </div>
              <div className="my-4 rounded-xl border border-[#C5A36D]/50 bg-[#101321] p-4 font-mono text-xs text-[#C5A36D]">
                ASI(s, t) = Σ w_d(t) · S_d(s, t)
                <br />
                <span className="mt-1 block text-[11px] text-[#A3A1BD]">
                  donde Σ w_d(t) = 1.0 y S_d ∈ [0, 100]
                </span>
              </div>
              <p className="text-xs leading-relaxed text-[#A3A1BD]">
                Cada objetivo extraterrestre define un vector de pesos específicos
                de misión. Para variables continuas se emplea la función de
                similitud acotada{" "}
                <code className="rounded bg-[#181B2C] px-1 py-0.5 font-mono text-[#7CA5B8]">
                  L(a,b;s) = max(0, 1 - |a-b|/s)
                </code>
                , y para litología geológica la superposición difusa de Jaccard{" "}
                <code className="rounded bg-[#181B2C] px-1 py-0.5 font-mono text-[#7CA5B8]">
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
                  className="rounded-xl border border-[#55527D]/35 bg-[#181B2C]/70 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-[#E4DFD5]">{item.title}</h4>
                    <span className="rounded bg-[#7CA5B8]/15 px-2 py-0.5 font-mono text-[10px] text-[#7CA5B8]">
                      {item.badge}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#A3A1BD]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. PLANETARY REFERENCE TARGETS (MOON & MARS) */}
        <section aria-labelledby="planetary-targets-heading" className="space-y-6">
          <div className="border-b border-[#55527D]/35 pb-4">
            <span className="text-xs font-bold tracking-wider text-[#E07A5F] uppercase">
              Destinos de Misión Extraterrestre · NASA Artemis &amp; Mars Exploration Program
            </span>
            <h2
              id="planetary-targets-heading"
              className="mt-1 text-2xl font-bold text-[#E4DFD5] sm:text-3xl"
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
                      ? "border-[#E07A5F]/40 bg-[#121626]/85"
                      : "border-[#7CA5B8]/50 bg-[#121626]/85"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold uppercase ${
                        isMars
                          ? "bg-[#E07A5F]/20 text-[#E07A5F]"
                          : "bg-[#27233E] text-[#7CA5B8]"
                      }`}
                    >
                      {isMars ? (
                        <Orbit className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <Moon className="h-3 w-3" aria-hidden="true" />
                      )}
                      {isMars ? "Marte" : "Luna"}
                    </span>
                    <span className="font-mono text-xs text-[#A3A1BD]">
                      Media {ref.temperature_mean_c}°C · Δ{ref.temperature_range_c}°C
                    </span>
                  </div>

                  <h3 className="mt-2.5 text-sm font-bold text-[#E4DFD5]">
                    {ref.name}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#A3A1BD]">
                    {ref.context}
                  </p>
                  {ref.instrument && (
                    <p className="mt-2.5 border-t border-[#55527D]/35 pt-2 font-mono text-[10px] text-[#A3A1BD]">
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
          <div className="flex flex-col justify-between gap-2 border-b border-[#55527D]/35 pb-4 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-bold tracking-wider text-[#C5A36D] uppercase">
                Ranking Cuantitativo Global
              </span>
              <h2
                id="leaderboard-heading"
                className="mt-1 text-2xl font-bold text-[#E4DFD5] sm:text-3xl"
              >
                Top Análogos Terrestres por Índice ASI
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-[#7CA5B8] hover:underline"
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
                  className="flex flex-col justify-between rounded-xl border border-[#55527D]/35 bg-[#181B2C]/80 p-4 hover:border-[#55527D]/35"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#A3A1BD]">
                        #{idx + 1} · {site.country}
                      </span>
                      <span className="font-mono text-base font-bold tabular-nums text-[#C5A36D]">
                        {site.overall_asi.toFixed(1)}%
                      </span>
                    </div>
                    <h3 className="mt-1 text-sm font-bold text-[#E4DFD5]">
                      {site.name}
                    </h3>
                    <span
                      className={`mt-1 inline-block text-[11px] font-medium ${
                        isMars ? "text-[#E07A5F]" : "text-[#7CA5B8]"
                      }`}
                    >
                      Mejor coincidencia: {target?.name.split("/")[0]}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-[#55527D]/35 pt-2.5 text-[11px]">
                    <span className="font-mono text-[#A3A1BD]">
                      {site.latitude.toFixed(2)}°, {site.longitude.toFixed(2)}° ·{" "}
                      {site.elevation_m} m
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectSiteAndExplore(site.id)}
                      className="font-semibold text-[#C5A36D] hover:underline"
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
        <footer className="rounded-2xl border border-[#55527D]/35 bg-[#181B2C]/70 p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7CA5B8]">
                <Database className="h-4 w-4" aria-hidden="true" />
                <span>APIs y Datos Abiertos de la NASA</span>
              </div>
              <ul className="mt-2.5 space-y-1.5 text-xs text-[#A3A1BD]">
                <li>• NASA POWER Agroclimatology / Renewable Energy API</li>
                <li>• NASA GIBS / Worldview VIIRS True Color WMTS</li>
                <li>• NASA Planetary Data System (LRO LOLA/Diviner, MRO CRISM/HiRISE, Perseverance MEDA)</li>
                <li>• Copernicus DEM GLO-90 / Open-Meteo Elevation API</li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C5A36D]">
                <Layers className="h-4 w-4" aria-hidden="true" />
                <span>Capacidades de la Plataforma</span>
              </div>
              <ul className="mt-2.5 space-y-1.5 text-xs text-[#A3A1BD]">
                <li>• Sondeo satelital en vivo de cualquier coordenada o región (3×3 y 4×4)</li>
                <li>• Relieve 3D WebGL con caché persistente en Service Worker</li>
                <li>• Exportación de Dossiers Markdown/JSON y capas GeoJSON para QGIS</li>
                <li>• Clustering K-Means y búsqueda K-NN de análogos en Python</li>
              </ul>
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8AB8A8]">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span>Transparencia Científica</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#A3A1BD]">
                  {dataset.methodology.interpretation}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-[#C5A36D] bg-[#C5A36D]/20 px-4 py-2.5 text-xs font-bold text-[#C5A36D] hover:bg-[#C5A36D]/30"
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
