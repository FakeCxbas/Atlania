"use client";

import { useRef } from "react";
import type { AnalogDataset } from "@/types/analog";
import { DIMENSIONS } from "@/lib/dossier";

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
        className="min-h-11 rounded border border-cyan-500/40 px-3 py-2 text-xs text-cyan-300 hover:bg-cyan-500/10"
      >
        Methodology &amp; Data Sources
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="methodology-title"
        onClose={() => triggerRef.current?.focus()}
        className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-lg border border-slate-700 bg-[#0D1424] p-5 text-slate-200 shadow-2xl backdrop:bg-black/75"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="methodology-title" className="text-lg font-semibold">
            Methodology &amp; Data Sources
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="min-h-11 rounded border border-slate-600 px-3 text-sm"
          >
            Close
          </button>
        </div>
        <div className="mt-4 space-y-5 text-sm leading-relaxed">
          <section>
            <h3 className="font-semibold text-cyan-300">
              Exploratory 5-axis ASI
            </h3>
            <p>{dataset.methodology.interpretation}</p>
            <p className="my-2 font-mono tabular-nums">
              ASI = Σ (target weight × dimension score)
            </p>
            <p>
              Each dimension ranges from 0 to 100. Target weights sum to 1 and
              express mission priorities. Scores use illustrative terrain and
              geology priors, not measured or calibrated site properties.
            </p>
            <p className="mt-2">
              For numeric comparisons, L(a, b; s) = max(0, 1 − |a − b| / s). The
              tolerance is 1 for unit-interval priors, 30° for slope and 100°C
              for thermal comparisons.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Topography: equal parts slope and roughness similarity.</li>
              <li>
                Geology: fuzzy Jaccard overlap, Σ min / Σ max, across basalt,
                regolith, sedimentary, evaporite and impact relevance.
              </li>
              <li>
                Thermal: 60% mean-temperature and 40% temperature-range
                similarity.
              </li>
              <li>
                Hydrology / ice: 40% dryness, 40% ice relevance and 20% aqueous
                history. Earth dryness = 1 / (1 + precipitation in mm/day).
              </li>
              <li>
                Subsurface / operations: 70% lava-tube and 30% shelter
                similarity. Shared absence of caves is a scenario match, not
                cave utility.
              </li>
            </ul>
            <div
              className="mt-3 overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label="Target weights"
            >
              <table className="w-full text-left text-xs">
                <caption className="mb-2 text-left">
                  Target weights (%) in the current dataset
                </caption>
                <thead>
                  <tr>
                    <th className="p-2">Target</th>
                    {DIMENSIONS.map((d) => (
                      <th key={d.key} className="p-2">
                        {d.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(dataset.references).map(([id, target]) => {
                    const score = dataset.sites.find((site) => site.scores[id])
                      ?.scores[id];
                    return (
                      <tr key={id} className="border-t border-slate-700">
                        <th className="p-2 font-normal">{target.name}</th>
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
                Why these weights? (Mission rationale)
              </h4>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs text-slate-300">
                <li>
                  <span className="font-medium text-cyan-300">Shackleton Crater</span>{" "}
                  weights Thermal (30%) and Hydrology / Ice (30%) highest because
                  Artemis South Pole operations depend on cryogenic cold-trap stability
                  for water-ice ISRU alongside steep crater-rim traverse slopes (20%).
                </li>
                <li>
                  <span className="font-medium text-cyan-300">Mare Tranquillitatis</span>{" "}
                  weights Subsurface / Ops (35%) and Geology (25%) highest because
                  collapsed basaltic skylight pits and intact lava tubes are the
                  primary radiation and micrometeoroid shelter mechanism.
                </li>
                <li>
                  <span className="font-medium text-amber-300">Jezero Crater</span>{" "}
                  weights Geology (30%) and Hydrology / Ice (25%) highest because
                  astrobiology and rover sampling focus on fluvio-lacustrine clay/carbonate
                  deltas and arid evaporitic preservation.
                </li>
                <li>
                  <span className="font-medium text-amber-300">Olympus Mons / Tharsis</span>{" "}
                  weights Geology (30%) and Topography (25%) highest to prioritize
                  shield-volcano basaltic flows, slope trafficability, and lava-tube
                  shelter (20%) over polar ice.
                </li>
              </ul>
            </div>
          </section>
          <section>
            <h3 className="font-semibold text-cyan-300">
              NASA POWER climatology
            </h3>
            <p>
              Gridded Earth air climatology supplies T2M_MAX, T2M_MIN,
              PRECTOTCORR, WS10M, RH2M, ALLSKY_SFC_SW_DWN and PS. The engine
              uses annual values when available, otherwise day-weighted monthly
              means. Wind, humidity, solar irradiance and surface pressure
              provide context but are not scored; UV and radiation dose are not
              measured or scored here.
            </p>
            <p className="mt-2">
              {dataset.methodology.climate_limitations} The exported dossier
              preserves each site’s source URL, aggregation and fallback reason.
            </p>
            <a
              href="https://power.larc.nasa.gov/"
              target="_blank"
              rel="noreferrer noopener"
              className="text-cyan-300 underline"
            >
              NASA POWER data portal
            </a>
          </section>
          <section>
            <h3 className="font-semibold text-cyan-300">Terrain telemetry</h3>
            <p>
              Open-Meteo / Copernicus GLO-90 provides center elevation and
              neighboring samples for slope and roughness telemetry. These
              measurements do not replace the illustrative ASI terrain priors.
              Each dossier preserves the DEM source, attribution and fallback
              reason so estimates can be distinguished from sampled elevations.
            </p>
            <a
              href="https://open-meteo.com/en/docs/elevation-api"
              target="_blank"
              rel="noreferrer noopener"
              className="text-cyan-300 underline"
            >
              Open-Meteo elevation data
            </a>
          </section>
          <section>
            <h3 className="font-semibold text-cyan-300">
              Strengths and analogy breakdowns
            </h3>
            <p>
              A dimension scoring at least 70/100 is listed as a strength. A
              high overall score can hide a weak dimension. Gravity, atmosphere
              or vacuum, radiation, weathering, thermal comparability and
              site-specific caveats are reported separately; they are not
              additional score penalties. Earth sites cannot reproduce all Moon
              or Mars conditions.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-cyan-300">
              Planetary reference scenarios
            </h3>
            <ul className="space-y-2">
              {Object.entries(dataset.references).map(([id, target]) => (
                <li key={id}>
                  <a
                    href={target.source_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-cyan-300 underline"
                  >
                    {target.name}
                  </a>
                  <p>{target.context}</p>
                </li>
              ))}
            </ul>
          </section>
          <p className="text-xs text-slate-400">
            {dataset.methodology.name} · v{dataset.methodology.version} ·
            Dataset schema {dataset.schema_version}
          </p>
        </div>
      </dialog>
    </>
  );
}
