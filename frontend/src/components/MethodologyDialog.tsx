"use client";

import { useRef } from "react";
import type { AnalogDataset } from "@/types/analog";
import { DIMENSIONS } from "@/lib/dossier";
import { translateTarget } from "@/lib/spanishTranslations";

const DIMENSION_LABELS_ES: Record<string, string> = {
  topography: "Topografía y Pendiente",
  geology: "Geología y Mineralogía",
  thermal: "Régimen Térmico",
  hydrology_ice: "Potencial de Aridez / Hielo",
  subsurface_ops: "Subsuelo y Operaciones",
};

export function MethodologyDialog({ dataset }: { dataset: AnalogDataset }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
        className="min-h-9 rounded-lg bg-[#181B2C] px-3 py-1.5 text-xs font-medium text-[#C5A36D] ring-1 ring-[#C5A36D]/35 transition-colors hover:bg-[#C5A36D]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
      >
        Metodología
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="methodology-title"
        onClose={() => triggerRef.current?.focus()}
        className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl border border-[#55527D]/35 bg-[#121626] p-5 text-[#E4DFD5] shadow-2xl backdrop:bg-[#101321]/75"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="methodology-title" className="text-lg font-semibold">
            Metodología y Fuentes de Datos
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="min-h-11 rounded border border-[#55527D]/35 px-3 text-sm hover:border-[#55527D]/35 hover:bg-[#181B2C]/60"
          >
            Cerrar
          </button>
        </div>
        <div className="mt-4 space-y-5 text-sm leading-relaxed">
          <section className="rounded-lg border border-[#55527D]/35 bg-[#181B2C] p-4">
            <h3 className="font-semibold text-[#C5A36D]">
              Metodología de Desarrollo y Diseño
            </h3>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              <div className="rounded border border-[#55527D]/35 bg-[#181B2C]/80 p-2.5">
                <span className="block font-mono text-xs font-semibold text-[#7CA5B8]">
                  01 · Design Thinking
                </span>
                <p className="mt-1 text-xs text-[#A3A1BD]">
                  Ideación centrada en investigadores espaciales para identificar análogos terrestres en minutos sin procesar hojas de cálculo manuales.
                </p>
              </div>
              <div className="rounded border border-[#55527D]/35 bg-[#181B2C]/80 p-2.5">
                <span className="block font-mono text-xs font-semibold text-[#C5A36D]">
                  02 · Scrum / Entregas Ágiles
                </span>
                <p className="mt-1 text-xs text-[#A3A1BD]">
                  Desarrollo iterativo por sprints cortos: calibración del motor ASI, catálogo global, visor 3D interactivo y exportación GIS.
                </p>
              </div>
              <div className="rounded border border-[#55527D]/35 bg-[#181B2C]/80 p-2.5">
                <span className="block font-mono text-xs font-semibold text-[#8AB8A8]">
                  03 · Metodología Científica ASI
                </span>
                <p className="mt-1 text-xs text-[#A3A1BD]">
                  Cruce cuantitativo de telemetría satelital NASA POWER y modelos digitales de elevación frente a archivos PDS de Luna y Marte.
                </p>
              </div>
              <div className="rounded border border-[#55527D]/35 bg-[#181B2C]/80 p-2.5">
                <span className="block font-mono text-xs font-semibold text-[#E4DFD5]">
                  04 · Usabilidad UX / HCI
                </span>
                <p className="mt-1 text-xs text-[#A3A1BD]">
                  Navegación con breadcrumbs, alto contraste WCAG AA, métricas clave y retroalimentación continua de ubicación al usuario.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-[#7CA5B8]">
              ASI Exploratorio de 5 Ejes
            </h3>
            <p>
              El Índice de Similitud Análoga (ASI) compara cada ubicación
              terrestre frente a escenarios planetarios de referencia combinando
              datos climatológicos de NASA POWER, telemetría de elevación y
              prioridades geológicas u operativas de misión.
            </p>
            <p className="my-2 font-mono tabular-nums">
              ASI = Σ (peso objetivo × puntuación de dimensión)
            </p>
            <p>
              Cada dimensión varía entre 0 y 100. Los pesos objetivo suman 1 y
              expresan las prioridades de la misión. Las puntuaciones emplean
              referencias ilustrativas de terreno y geología, no propiedades de
              sitio medidas o calibradas en campo.
            </p>
            <p className="mt-2">
              Para comparaciones numéricas, L(a, b; s) = max(0, 1 − |a − b| / s).
              La tolerancia es 1 para parámetros normalizados en intervalo
              unitario, 30° para pendiente y 100°C para comparaciones térmicas.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Topografía:</strong> similitud en partes iguales entre
                pendiente y rugosidad del terreno.
              </li>
              <li>
                <strong>Geología:</strong> solapamiento difuso de Jaccard, Σ min
                / Σ max, entre basalto, regolito, sedimentario, evaporitas y
                relevancia de impacto.
              </li>
              <li>
                <strong>Térmico:</strong> 60% de similitud en temperatura media y
                40% en amplitud térmica.
              </li>
              <li>
                <strong>Hidrología / Hielo:</strong> 40% de aridez, 40% de
                relevancia de hielo y 20% de historial acuoso. Aridez terrestre =
                1 / (1 + precipitación en mm/día).
              </li>
              <li>
                <strong>Subsuelo / Operaciones:</strong> 70% de similitud en
                tubos de lava y 30% en refugio natural. La ausencia compartida de
                cavernas representa coincidencia de escenario, no utilidad de
                cueva.
              </li>
            </ul>
            <div
              className="mt-3 overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label="Pesos objetivo en el conjunto de datos"
            >
              <table className="w-full text-left text-xs">
                <caption className="mb-2 text-left text-[#A3A1BD]">
                  Pesos objetivo (%) en el conjunto de datos actual
                </caption>
                <thead>
                  <tr>
                    <th className="p-2">Objetivo</th>
                    {DIMENSIONS.map((d) => (
                      <th key={d.key} className="p-2">
                        {DIMENSION_LABELS_ES[d.key] ?? d.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(dataset.references).map(([id, target]) => {
                    const translatedTarget = translateTarget(target);
                    const score = dataset.sites.find((site) => site.scores[id])
                      ?.scores[id];
                    return (
                      <tr key={id} className="border-t border-[#55527D]/35">
                        <th className="p-2 font-normal">
                          {translatedTarget.name}
                        </th>
                        {DIMENSIONS.map((d) => (
                          <td
                            key={d.key}
                            className="p-2 font-mono tabular-nums"
                          >
                            {score
                              ? (score.weights[d.key] * 100).toFixed(0)
                              : "—"}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 rounded border border-[#55527D]/35 bg-[#181B2C] p-3">
              <h4 className="font-semibold text-[#E4DFD5]">
                ¿Por qué estos pesos? (Justificación de misión)
              </h4>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs text-[#A3A1BD]">
                <li>
                  <span className="font-medium text-[#7CA5B8]">
                    Cráter Shackleton
                  </span>{" "}
                  prioriza Régimen Térmico (30%) e Hidrología / Hielo (30%)
                  porque las operaciones Artemis en el Polo Sur Lunar dependen
                  de trampas frías criogénicas para ISRU de hielo de agua junto
                  con pendientes escarpadas en el borde del cráter (20%).
                </li>
                <li>
                  <span className="font-medium text-[#7CA5B8]">
                    Mare Tranquillitatis
                  </span>{" "}
                  prioriza Subsuelo y Operaciones (35%) y Geología (25%) porque
                  los tragaluces basálticos colapsados y tubos de lava intactos
                  son el principal refugio frente a radiación y micrometeoritos.
                </li>
                <li>
                  <span className="font-medium text-[#7CA5B8]">
                    Mons Mouton (Polo Sur Lunar · Artemis III)
                  </span>{" "}
                  prioriza Topografía (30%) y Geología (25%) al tratarse de una
                  meseta polar de cima plana candidata para aterrizajes tripulados
                  y travesías de rovers con iluminación solar prolongada.
                </li>
                <li>
                  <span className="font-medium text-[#C5A36D]">
                    Cráter Jezero
                  </span>{" "}
                  prioriza Geología (35%) e Hidrología / Hielo (25%) porque la
                  astrobiología y el muestreo con rovers se enfocan en deltas
                  fluvio-lacustres de arcillas/carbonatos y preservación
                  evaporítica árida.
                </li>
                <li>
                  <span className="font-medium text-[#C5A36D]">
                    Monte Olimpo / Tharsis
                  </span>{" "}
                  prioriza Geología (30%) y Topografía (25%) para destacar
                  coladas basálticas de volcán en escudo, transitabilidad en
                  pendientes y refugio en tubos de lava (20%) por encima del
                  hielo polar.
                </li>
                <li>
                  <span className="font-medium text-[#C5A36D]">
                    Valles Marineris (Coprates Chasma)
                  </span>{" "}
                  prioriza Topografía (35%) y Geología (30%) para modelar taludes
                  tectónicos escarpados, estratigrafía basáltica expuesta y
                  depósitos de sulfatos polihidratados (20%).
                </li>
              </ul>
            </div>
          </section>
          <section>
            <h3 className="font-semibold text-[#7CA5B8]">
              Climatología NASA POWER
            </h3>
            <p>
              La climatología terrestre en grilla provee T2M_MAX, T2M_MIN,
              PRECTOTCORR, WS10M, RH2M, ALLSKY_SFC_SW_DWN y PS. El motor utiliza
              valores anuales cuando están disponibles o promedios mensuales
              ponderados por días. El viento, la humedad, la irradiancia solar y
              la presión superficial aportan contexto operativo pero no puntúan;
              la dosis UV y de radiación no se miden ni puntúan aquí.
            </p>
            <p className="mt-2">
              Los datos climatológicos reflejan condiciones atmosféricas
              terrestres en superficie y no reproducen el vacío lunar ni la
              atmósfera tenue de Marte. El dossier exportado conserva la URL de
              origen, el método de agregación y el motivo de respaldo de cada
              sitio.
            </p>
            <a
              href="https://power.larc.nasa.gov/"
              target="_blank"
              rel="noreferrer noopener"
              className="text-[#7CA5B8] underline"
            >
              Portal de datos NASA POWER
            </a>
          </section>
          <section>
            <h3 className="font-semibold text-[#7CA5B8]">
              Telemetría del Terreno (ESA Copernicus DEM)
            </h3>
            <p>
              Open-Meteo / ESA Copernicus DEM GLO-90 (DOI: 10.5270/ESA-c5d3d65)
              proporciona la elevación central y muestras vecinas para calcular
              la telemetría de pendiente y rugosidad a 90 m. Además, cada sitio
              documenta perfiles orbitales de Landsat 8/9 (OLI/TIRS) y radar
              ESA Sentinel-1 C-SAR.
            </p>
            <a
              href="https://open-meteo.com/en/docs/elevation-api"
              target="_blank"
              rel="noreferrer noopener"
              className="text-[#7CA5B8] underline"
            >
              Datos de elevación Open-Meteo / Copernicus DEM
            </a>
          </section>
          <section>
            <h3 className="font-semibold text-[#7CA5B8]">
              Fortalezas y Desglose de Analogía
            </h3>
            <p>
              Toda dimensión con puntuación mínima de 70/100 se lista como
              fortaleza. Una puntuación global alta puede ocultar una dimensión
              débil. La gravedad, atmósfera o vacío, radiación, meteorización,
              comparabilidad térmica y salvedades específicas de cada sitio se
              reportan por separado; no son penalizaciones adicionales. Ningún
              sitio terrestre reproduce todas las condiciones de la Luna o Marte.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-[#7CA5B8]">
              Escenarios Planetarios de Referencia (NASA PDS)
            </h3>
            <ul className="space-y-2">
              {Object.entries(dataset.references).map(([id, target]) => {
                const translatedTarget = translateTarget(target);
                return (
                  <li key={id}>
                    <a
                      href={target.source_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-[#7CA5B8] underline"
                    >
                      {translatedTarget.name}
                    </a>
                    <p>{translatedTarget.context}</p>
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="rounded-lg border border-[#55527D]/35 bg-[#181B2C] p-3.5 text-xs text-[#A3A1BD]">
            <h3 className="font-semibold text-[#C5A36D]">
              Transparencia SI (Super Intelligence) y Atribución Espacial
            </h3>
            <p className="mt-1">
              En cumplimiento con la guía oficial de NASA Space Apps Challenge 2026:
              la formulación matemática del índice ASI, la curaduría científica de
              los 35 sitios y la ingesta determinista de datos (NASA POWER, NASA PDS,
              NASA GIBS y ESA Copernicus DEM) fueron diseñadas por el equipo. Se
              emplearon asistentes de IA (Gemini / Codex) como apoyo de ingeniería
              de software y pruebas automatizadas, diseño conceptual del isotipo
              propio (sin usar ni alterar logotipos de la NASA) y síntesis de voz
              (edge-tts) para la narración del video demostrativo.
            </p>
          </section>
          <p className="text-xs text-[#A3A1BD]">
            {dataset.methodology.name} · v{dataset.methodology.version} ·
            Esquema del conjunto de datos {dataset.schema_version}
          </p>
        </div>
      </dialog>
    </>
  );
}
