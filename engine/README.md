# Exploratory Analog Similarity Index

Python 3.11+. From the repository root:

```bash
uv sync --project engine
uv run --project engine pytest engine/tests
uv run --project engine python engine/build_dataset.py
# Deterministic demonstration without network:
uv run --project engine python engine/build_dataset.py --offline
```

`--timeout 10` sets the httpx timeout per network phase; requests are sequential.
`--output-dir PATH` overrides the default `frontend/public/data`, resolved relative
to the script, not the caller's working directory. Import with `engine.asi_engine`
or run the builder with `python -m engine.build_dataset`.

Outputs contain 10 representative Earth sites, scores against all four targets,
the winning target, strengths, explicit breakdowns and climate provenance.
GeoJSON uses WGS84 `[longitude, latitude]` coordinates and preserves the full site
record in each feature's properties. JSON root keys are `schema_version`,
`methodology`, `references`, `sites`. Each site's `scores[target_id]` contains
`dimensions`, `overall_asi`, `weights`, `analogy_strengths`, `analogy_breakdowns`.
Ties select the first reference in the declared order. Overall values are computed
before rounding, so displayed component scores may differ by a rounding unit.

## Scientific status and inputs

This is an auditable hackathon hypothesis-ranking model, **not a scientifically
validated similarity metric, probability, field safety assessment, or NASA endorsement**.
All terrain, geological membership, ice, aqueous-history, cave, shelter and
reference temperature values are illustrative scenario priors. They require
site-specific DEM, mineralogy, field measurements and sensitivity calibration
before scientific inference. No claim is made that they were extracted from NASA
rasters. Coordinates and elevations are approximate representative locations.

Galapagos combines Santa Cruz and Isabela in one entry to retain 10 sites; the
POWER point is on Santa Cruz. It cannot represent both islands or underground
conditions. Chimborazo ice relevance does not establish a mapped permafrost area.
Cotopaxi and Chimborazo are not treated as pure basalt. Memberships describe
relevance rather than mineral mass fractions and need not sum to one.

Live Earth climate comes from the [NASA POWER climatology point API](https://power.larc.nasa.gov/docs/services/api/temporal/climatology/).
It requests `T2M_MAX,T2M_MIN,PRECTOTCORR,WS10M,RH2M`, community `RE`, JSON.
Annual `ANN` values are preferred; otherwise all twelve monthly values are
required and averaged using a 365-day calendar. Precipitation remains **mm/day**,
not annual millimeters. Units are Celsius, mm/day, m/s, and percent.
The available header start/end are preserved, without inventing a source period.
Missing keys, fill values, nonfinite/out-of-range values, malformed JSON, HTTP
errors and timeouts trigger a whole-record deterministic fallback. Fallback
climates are explicit illustrative estimates, not historical observations.
Every result carries a source, request URL and fallback reason when applicable.

POWER air-temperature aggregates do not measure surface temperature or cave
microclimates. `tmax - tmin` here is an aggregate thermal-range proxy, not a
measured lunar diurnal cycle or time-series variance. Wind and humidity are
reported for context but are **not scored**. Radiation and UV are not fetched or
scored; they are explicit limitations. Dataset reproducibility requires fixing
NASA responses or using offline mode; live upstream data can change.

## Equations (version 0.1.0)

Define `L(a,b;s) = max(0, 1 - abs(a-b)/s)`. Unit-interval priors use `s=1`.
All dimension scores below are multiplied by 100:

- Topography: `0.5 L(slope_E,slope_T;30 degrees) + 0.5 L(roughness_E,roughness_T;1)`.
- Geology: fuzzy Jaccard `sum(min(E_i,T_i))/sum(max(E_i,T_i))` across basalt,
  regolith, sedimentary, evaporite and impact relevance. Shared absence does not
  inflate overlap; both empty vectors are defined to match.
- Thermal: `0.6 L(mean_E,mean_T;100 C) + 0.4 L(range_E,range_T;100 C)`;
  Earth mean is `(Tmax+Tmin)/2`, range is `Tmax-Tmin`. These scales are explicitly
  chosen heuristic tolerances, not fitted measurement uncertainties.
- Hydrology/ice: `0.4 L(dryness_E,dryness_T) + 0.4 L(ice_E,ice_T) +
  0.2 L(aqueous_history_E,aqueous_history_T)`, with Earth dryness
  `1/(1+precipitation_mm_day/(1 mm/day))`. This is a precipitation-only proxy,
  **not** a precipitation/potential-evapotranspiration aridity index. Ice relevance
  is independently curated; rainfall or cold air alone does not establish ice.
- Subsurface operations: `0.7 L(lava_tubes_E,lava_tubes_T) + 0.3 L(shelter_E,shelter_T)`.
  Shared lack of caves indicates matched scenario requirements, not cave utility.

Overall ASI is the weighted arithmetic mean of these five scores. In the order
above, weights are Shackleton `(0.25,0.20,0.20,0.30,0.05)`, Tranquillitatis
`(0.15,0.30,0.15,0.10,0.30)`, Jezero `(0.20,0.35,0.15,0.25,0.05)`, and Olympus
`(0.25,0.30,0.15,0.10,0.20)`. Weights sum to one and express mission priorities.
Strengths are dimensions scoring at least 70; they remain model assessments.
A high score can compensate for a weak dimension; inspect every dimension and
breakdown before selecting an analog. No uncertainty interval is claimed.

## Reference interpretation and primary context

- [Shackleton](https://science.nasa.gov/resource/shackleton-craters-illuminated-rim-shadowed-interior/):
  the modeled -183 C mean / 10 C range represents a cold-trap interior scenario,
  not its illuminated rim. Ice relevance is not confirmed local abundance.
- [Tranquillitatis pit shade](https://www.nasa.gov/solar-system/nasas-lro-finds-lunar-pits-harbor-comfortable-temperatures/):
  NASA describes modeled shaded temperatures near 17 C. The 2 C range is a model
  assumption; this does not prove all lunar caves share those conditions.
- [Jezero delta and igneous floor](https://www.jpl.nasa.gov/news/nasas-perseverance-rover-deciphers-ancient-history-of-martian-lake/):
  combines ancient aqueous-process relevance with a present dry-surface scenario.
  -60 C mean and 70 C range are illustrative, not local telemetry.
- [Olympus lava flows and collapsed tube](https://science.nasa.gov/photojournal/the-flows-of-olympus/):
  -65 C mean and 80 C range are exposed-flank assumptions, not cave measurements.

Gravity, atmosphere/vacuum, ionizing radiation and weathering differ at every
Earth analog and are returned for every target. Geologic process similarity is
not environmental equivalence or evidence of habitability. The next scientific
step is replacing the scenario priors with cited site-scale observations and
validating rankings against expert-selected tasks and held-out analogs.
