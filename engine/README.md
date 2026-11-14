# Exploratory Analog Similarity Index

Python 3.11+. From the repository root:

```bash
uv sync --project engine
uv run --project engine pytest engine/tests
uv run --project engine python engine/build_dataset.py
# Deterministic demonstration without network:
uv run --project engine python engine/build_dataset.py --offline
```

`--timeout 10` (default) sets the httpx timeout per network phase; requests are sequential.
Transport failures (including ReadTimeout), HTTP 429 and 5xx are retried up to
three total attempts, with exponential waits of 1 and 2 seconds. Other HTTP
errors and invalid payloads fall back immediately; a site can take longer than
10 seconds across phases and attempts. DEM requests use the same retry policy.
`--output-dir PATH` overrides the default `frontend/public/data`, resolved relative
to the script, not the caller's working directory. Import with `engine.asi_engine`
or run the builder with `python -m engine.build_dataset`.

Outputs contain 16 representative Earth sites, scores against all four targets,
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
All scoring terrain, geological membership, ice, aqueous-history, cave, shelter and
reference temperature values are illustrative scenario priors. They require
site-specific DEM, mineralogy, field measurements and sensitivity calibration
before scientific inference. No claim is made that they were extracted from NASA
rasters. Coordinates are representative locations. Elevations use live DEM when available, with approximate fallback priors.

The legacy Galapagos entry retains its ID and Santa Cruz POWER point.
Sierra Negra now separately samples Isabela. It cannot represent both islands or underground
conditions. Chimborazo ice relevance does not establish a mapped permafrost area.
Cotopaxi and Chimborazo are not treated as pure basalt. Memberships describe
relevance rather than mineral mass fractions and need not sum to one.

Live Earth climate comes from the [NASA POWER climatology point API](https://power.larc.nasa.gov/docs/services/api/temporal/climatology/).
It requests `T2M_MAX,T2M_MIN,PRECTOTCORR,WS10M,RH2M,ALLSKY_SFC_SW_DWN,PS`, community `RE`, JSON.
Annual `ANN` values are preferred; otherwise all twelve monthly values are
required and averaged using a 365-day calendar. Precipitation remains **mm/day**,
not annual millimeters. Units are Celsius, mm/day, m/s, percent, kWh/m2/day and kPa.
Solar irradiance and pressure are stored as `solar_irradiance_kwh_m2_day` and
`surface_pressure_kpa`.
The available header start/end are preserved, without inventing a source period.
Missing keys, fill values, nonfinite/out-of-range values, malformed JSON, HTTP
errors and timeouts trigger a whole-record deterministic fallback. Fallback
climates are explicit illustrative estimates, not historical observations.
Every result carries a source, request URL and fallback reason when applicable.

POWER air-temperature aggregates do not measure surface temperature or cave
microclimates. `tmax - tmin` here is an aggregate thermal-range proxy, not a
measured lunar diurnal cycle or time-series variance. Wind and humidity are
reported for context but are **not scored**. Broadband solar irradiance is reported, but UV and ionizing radiation are not fetched or
scored; they are explicit limitations. Dataset reproducibility requires fixing
NASA responses or using offline mode; live upstream data can change.

## Equations (version 0.2.0; scoring unchanged)

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


## v0.2.0 telemetry and discovery

The JSON schema remains `1.0.0`; all legacy fields, IDs, target profiles, scoring
formulas and frontend types are preserved. New fields are additive. Six candidates
extend the catalog: Sierra Negra, Antisana, Puna/Laguna Verde, Lut/Rig-e Yalan,
Tibesti and Timanfaya. `discovery_tier` is a curated editorial category
(`Benchmark`, `Regional Highlight`, `Under-Recognized`), not a literature census.
`mission_testbeds` lists proposed concrete experiments, not verified facilities or
permission to operate. Thin-air rotorcraft trials on Earth do not reproduce Mars
atmospheric density or certify Ingenuity-class flight performance.

### DEM telemetry

[Open-Meteo Elevation API](https://open-meteo.com/en/docs/elevation-api) provides
Copernicus DEM GLO-90 (2021), nominal 90 m resolution; attribution: Open-Meteo /
Copernicus, [dataset DOI](https://doi.org/10.5270/ESA-c5d3d65).
One batch requests five points in center, north, south, east, west order at
±0.01 degrees. With `R=6371008.8 m`, `dy=R*radians(0.01)` and
`dx=dy*cos(latitude)`, the central gradients are `(zN-zS)/(2*dy)` and
`(zE-zW)/(2*dx)`. Slope is `degrees(atan(hypot(gx,gy)))`. Roughness is the
population standard deviation of all five elevations, in meters (includes broad
slope; not detrended microtopography). This measures kilometer-scale relief,
not rover wheel-scale hazards or the full resolution of the underlying DEM.

`dem_telemetry` stores elevation, `dem_slope_deg`, `dem_roughness_m`, samples,
spacing, attribution, source URL, source (`open_meteo` or `fallback`) and reason.
Successful DEM sampling updates the site's `elevation_m`. For catalog sites, dimensionless
`terrain.roughness` and scoring slope remain curated priors; DEM telemetry does
not silently change their meaning or the ASI. Longitude wraps at the date line.
Within 0.01 degrees of a pole, the symmetric stencil is undefined and falls back.
Offline or invalid DEM responses retain site elevation and prior slope, with
roughness `0.0` as an **unknown placeholder**, not measured flat terrain, and null
sample elevations. These fallbacks are deterministic and explicitly labeled.
`methodology.dem_source_counts` summarizes acquisition outcomes separately from climate.

Fallback solar energy is an illustrative 4 kWh/m2/day. Catalog fallback pressure
uses `101.325*exp(-prior_elevation_m/8434.5)` kPa, a simplified scale-height model,
not an observation. Neither new climate variable is used in ASI scoring.

### On-demand coordinates

```python
from engine.asi_engine import score_custom_coordinates
site = score_custom_coordinates(-0.68, -78.44, offline=False)
```

This validates finite WGS84 coordinates and returns the same site/score structure,
with live POWER and DEM where available. No reverse geocoding or geological
inference is performed. Country is `Unknown`. Unmeasured geology (all five
memberships), aqueous history, lava tubes and shelter are zero: unknown evidence,
not verified absence. Successful DEM supplies scoring slope and roughness
`min(1, dem_roughness_m / 120)`; fallback slope, roughness and elevation are zero.
Ice relevance is a climate proxy, not detected ice: 0.7 when `tmin_c <= -5`, or
when `tmin_c <= 0` and either elevation is at least 3500 m or absolute latitude
is at least 60 degrees; otherwise 0.25 when `tmin_c <= 5`, else zero.
Custom-probe dryness is `(1 / (1 + precipitation_mm_day)) *
(1 - 0.5 * relative_humidity_pct / 100)`. Catalog scoring retains its existing
priors and precipitation-only dryness. Fallback climate also feeds these proxies
and is explicitly labeled illustrative; `offline=True` makes no network requests.
Scores remain provisional screening results, not discovered analogs.

### Reference archive metadata

All four profiles export additive `instrument`, `pds_dataset`, `gravity_ms2`,
`pressure_kpa`, `temp_min_c`, `temp_max_c`, `mineralogy_summary` and `metadata_note`
fields. Existing frontend fields and the schema version remain unchanged.
Dataset IDs/DOIs and archive URLs identify relevant data, not products extracted
at the reference coordinates. Temperature bounds preserve the existing scenario
mean +/- half range (including the shaded-pit scenario, not exposed lunar soil).
Gravity and pressure are nominal body constants; 0.65 kPa is not an Olympus
altitude-specific measurement. Mineralogy summaries describe regional context;
MOLA and HiRISE measure topography/imaging, not composition. These metadata do
not change target scoring weights or thermal priors.

Archive citations:
- Shackleton: [Diviner GCP/PCP, LRO-L-DLRE-5-GCP-V1.0](https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=LRO-L-DLRE-5-GCP-V1.0)
  and [LOLA](https://pds-geosciences.wustl.edu/missions/lro/lola.htm).
- Tranquillitatis: [LROC CDR archive, LRO-L-LROC-3-CDR-V1.0](https://pds.lroc.asu.edu/)
  and the Diviner archive above; the existing NASA context URL explains modeled pit temperatures.
- Jezero: [MEDA, DOI 10.17189/1522849](https://pdsatmospheres.nmsu.edu/data_and_services/atmospheres_data/PERSEVERANCE/meda.html)
  and [MRO CRISM](https://pds-geosciences.wustl.edu/missions/mro/crism.htm).
- Olympus: [MGS MOLA](https://pds-geosciences.wustl.edu/missions/mgs/mola.html)
  and [MRO HiRISE](https://hirise.lpl.arizona.edu/PDS/).
