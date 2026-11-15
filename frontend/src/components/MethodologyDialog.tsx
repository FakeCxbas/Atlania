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
        className="h-8 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-1.5 text-xs font-medium text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/20"
      >
        Metodología
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="methodology-title"
        onClose={() => triggerRef.current?.focus()}
        className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-lg border border-slate-700 bg-[#0D1424] p-5 text-slate-200 shadow-2xl backdrop:bg-black/75"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="methodology-title" className="text-lg font-semibold">
            Metodología y Fuentes de Datos
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="min-h-11 rounded border border-slate-600 px-3 text-sm hover:border-slate-500 hover:bg-slate-800/60"
          >
            Cerrar
          </button>
        </div>
        <div className="mt-4 space-y-5 text-sm leading-relaxed">
          <section>
            <h3 className="font-semibold text-cyan-300">
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
                <caption className="mb-2 text-left text-slate-300">
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
                      <tr key={id} className="border-t border-slate-700">
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
            <div className="mt-3 rounded border border-slate-700/80 bg-[#060913]/60 p-3">
              <h4 className="font-semibold text-slate-200">
                ¿Por qué estos pesos? (Justificación de misión)
              </h4>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs text-slate-300">
                <li>
                  <span className="font-medium text-cyan-300">
                    Cráter Shackleton
                  </span>{" "}
                  prioriza Régimen Térmico (30%) e Hidrología / Hielo (30%)
                  porque las operaciones Artemis en el Polo Sur Lunar dependen
                  de trampas frías criogénicas para ISRU de hielo de agua junto
                  con pendientes escarpadas en el borde del cráter (20%).
                </li>
                <li>
                  <span className="font-medium text-cyan-300">
                    Mare Tranquillitatis
                  </span>{" "}
                  prioriza Subsuelo y Operaciones (35%) y Geología (25%) porque
                  los tragaluces basálticos colapsados y tubos de lava intactos
                  son el principal refugio frente a radiación y micrometeoritos.
                </li>
                <li>
                  <span className="font-medium text-amber-300">
                    Cráter Jezero
                  </span>{" "}
                  prioriza Geología (30%) e Hidrología / Hielo (25%) porque la
                  astrobiología y el muestreo con rovers se enfocan en deltas
                  fluvio-lacustres de arcillas/carbonatos y preservación
                  evaporítica árida.
                </li>
                <li>
                  <span className="font-medium text-amber-300">
                    Monte Olimpo / Tharsis
                  </span>{" "}
                  prioriza Geología (30%) y Topografía (25%) para destacar
                  coladas basálticas de volcán en escudo, transitabilidad en
                  pendientes y refugio en tubos de lava (20%) por encima del
                  hielo polar.
                </li>
              </ul>
            </div>
          </section>
          <section>
            <h3 className="font-semibold text-cyan-300">
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
              className="text-cyan-300 underline"
            >
              Portal de datos NASA POWER
            </a>
          </section>
          <section>
            <h3 className="font-semibold text-cyan-300">
              Telemetría del Terreno
            </h3>
            <p>
              Open-Meteo / Copernicus GLO-90 proporciona la elevación central y
              muestras vecinas para calcular la telemetría de pendiente y
              rugosidad. Estas mediciones no reemplazan las referencias
              ilustrativas de terreno del ASI. Cada dossier conserva la fuente
              DEM, atribución y respaldo para distinguir estimaciones de
              elevaciones muestreadas.
            </p>
            <a
              href="https://open-meteo.com/en/docs/elevation-api"
              target="_blank"
              rel="noreferrer noopener"
              className="text-cyan-300 underline"
            >
              Datos de elevación Open-Meteo
            </a>
          </section>
          <section>
            <h3 className="font-semibold text-cyan-300">
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
            <h3 className="font-semibold text-cyan-300">
              Escenarios Planetarios de Referencia
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
                      className="text-cyan-300 underline"
                    >
                      {translatedTarget.name}
                    </a>
                    <p>{translatedTarget.context}</p>
                  </li>
                );
              })}
            </ul>
          </section>
          <p className="text-xs text-slate-400">
            {dataset.methodology.name} · v{dataset.methodology.version} ·
            Esquema del conjunto de datos {dataset.schema_version}
          </p>
        </div>
      </dialog>
    </>
  );
}
