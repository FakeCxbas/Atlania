# NASA Space Apps Challenge 2026 — Official Project Submission Kit

This document provides the complete, copy-paste-ready responses in English for every required field on the **2026 NASA Space Apps Challenge Project Submission Page** (in accordance with the official *Project Submission Guide*, November 2026).

---

## 1. Project Name

```text
ATLANIA — Planetary Observatory & Earth-Space Analog Atlas
```

---

## 2. High-Level Project Summary

*Prompt: Provide a high-level summary of your project. What did you develop? How does it address the challenge? Why is it important?*

```text
ATLANIA is an open-source planetary observatory and quantitative geospatial atlas designed to identify, evaluate, and compare terrestrial locations that serve as scientific and operational analogs for permanent Lunar base candidates (Artemis) and Martian exploration zones.

To address the challenge ("Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars"), we developed the Analog Similarity Index (ASI v0.2.0)—an auditable 5-axis mathematical engine that cross-references live satellite climatology from NASA POWER and 90-meter digital elevation gradients from ESA Copernicus DEM against 6 reference environments documented in the NASA Planetary Data System (PDS): Shackleton Crater, Mare Tranquillitatis Pits, and Mons Mouton on the Moon; and Jezero Crater, Olympus Mons Flank, and Valles Marineris on Mars.

Why it matters: Before deploying pressurized habitats, cryogenic ISRU drills, or autonomous rovers to the Moon or Mars, space agencies and researchers must validate hardware and human operations on Earth. ATLANIA replaces fragmented literature reviews with an interactive 3D web platform featuring 35 curated global analog sites across 20 countries (including 8 high-altitude volcanic and basaltic lava tube sites in Ecuador and the Andes), real-time coordinate and regional grid probing anywhere on Earth, 3D topographic twin comparison in Three.js, and instant dossier export to Markdown, JSON, and QGIS-ready GeoJSON.
```

---

## 3. Links to Project Demo & Final Project

*Prompt: Provide publicly accessible links with no logins, permissions, or registrations required.*

- **Link to Final Project (GitHub Repository / Live Web App):**
  - Repository: `https://github.com/FakeCxbas/Atlania`
  - *(If deployed to a public URL such as Vercel, paste the live production URL here and request a FortiGuard Web Filter Classification under category "Education" or "Web-based Application" with Company Name "N/A" as recommended on Page 4 of the Submission Guide).*
- **Link to Project Demo (30-Second Video OR 7-Slide Presentation):**
  - *(Insert public YouTube / Google Drive / GitHub link to the 30-second video or 7-slide deck once uploaded; verify in an incognito browser window that no login is required).*

---

## 4. Detailed Project Description

*Prompt: Provide additional details about your project: What exactly does it do? How does it work? What benefits does it have? What do you hope to achieve? What tools, coding languages, hardware, or software did you use to develop your project?*

```text
### What ATLANIA Does
ATLANIA ("Celestial Earth") bridges terrestrial remote sensing and planetary exploration through two integrated workspaces:

1. Planetary Observatory & Interactive Briefing (/):
   - A 5-chapter interactive 3D spatial narrative built with Three.js and GSAP ScrollTrigger that guides researchers and students from orbital planetology down into a 4-stratum 3D geological cross-section of Earth's crust (Subsurface & Lava Tubes, Basaltic & Evaporitic Lithology, Extreme Thermal & Cryospheric Regimes, and Topographic Relief).
   - Live interactive inspection of the Analog Similarity Index (ASI) across 35 terrestrial sites and 6 Lunar/Martian mission targets.

2. Terra Explorer & 3D Satellite Observatory (/explorer):
   - Interactive 3D globe and terrain workbench powered by MapLibre GL JS, AWS Terrarium DEM tiles, NASA GIBS daily satellite layers, and Esri World Imagery.
   - Multi-planet navigation filtering by Earth (20 countries, with dedicated regional coverage of South America and Ecuador), Moon (Shackleton Crater, Mare Tranquillitatis Pits, Mons Mouton), and Mars (Jezero Crater, Olympus Mons Flank, Valles Marineris).
   - 6-Block Telemetry & Comparison Panel: displays mission-weighted ASI scores, a 5-axis pentagonal radar chart, side-by-side Earth vs. Moon/Mars telemetry, explicit physical breakdown warnings (differential gravity, vacuum/atmosphere, ionizing radiation, and weathering), proposed mission testbeds, and a 3-sensor Satellite Observatory profile (Landsat 8/9 OLI optical, ESA Sentinel-1 C-SAR radar, and Landsat TIRS thermal infrared).
   - 3D Topographic Twin & Surface Comparison Modal: decodes raw Terrarium DEM PNG bytes via DecompressionStream to render a real-time Three.js 3D terrain mesh with interactive solar azimuth/elevation shadow simulation, slope heatmap, hypsometric contours, and side-by-side comparison against parametric Lunar/Martian target relief.
   - Live Coordinate Probe (/api/evaluate) & Orbital Region Grid Scanner (/api/evaluate-region): allows users to click any point or draw a 3x3 / 4x4 bounding box anywhere on Earth to fetch live NASA POWER climatology and Copernicus DEM 5-point slope gradients on demand, calibrated with biosphere and atmospheric moisture penalties to filter out vegetated orographic noise.
   - Interoperable GIS Export: one-click export of scientific dossiers in Markdown, full provenance JSON, and EPSG:4326 GeoJSON for direct inspection in QGIS or ArcGIS.

### How It Works: The 5-Axis Analog Similarity Index (ASI v0.2.0)
For each terrestrial site E and planetary reference target T, ATLANIA computes five normalized dimension scores in [0, 100] using bounded linear similarity L(a, b; s) = max(0, 1 - |a - b| / s) and fuzzy set theory:
1. Topography & Relief: 0.5 * L(slope_E, slope_T; 30 deg) + 0.5 * L(roughness_E, roughness_T; 1), backed by 5-point central finite-difference gradients (center, N, S, E, W at +/-0.01 deg) on Copernicus DEM GLO-90.
2. Geology & Mineralogy: Fuzzy Jaccard similarity sum(min(E_i, T_i)) / sum(max(E_i, T_i)) across 5 lithological vectors: basalt, regolith, sedimentary/clays, evaporites/sulfates, and impact cratering relevance.
3. Thermal Regime: 0.6 * L(mean_E, mean_T; 100 C) + 0.4 * L(range_E, range_T; 100 C), derived from NASA POWER 2-meter air temperature climatology (T2M_MAX, T2M_MIN).
4. Hydrology, Aridity & Cryosphere: 0.4 * L(dryness_E, dryness_T; 1) + 0.4 * L(ice_E, ice_T; 1) + 0.2 * L(aqueous_history_E, aqueous_history_T; 1), where terrestrial dryness is derived from NASA POWER corrected precipitation (PRECTOTCORR).
5. Subsurface & Habitat Operations: 0.7 * L(lava_tubes_E, lava_tubes_T; 1) + 0.3 * L(shelter_E, shelter_T; 1), evaluating basaltic lava tube skylights and natural radiation shielding for Artemis and Mars habitats.

The overall ASI is the mission-weighted sum across the five dimensions, where weights reflect specific mission priorities (e.g., Shackleton prioritizes cryospheric cold-trap hydrology/ice at 30% and thermal regime at 20%; Mare Tranquillitatis prioritizes subsurface lava tube operations at 30% and basaltic geology at 30%; Jezero prioritizes fluvio-lacustrine geology at 35% and hydrology at 25%).

### Scientific Integrity & Benefits
- Auditable & Honest: ATLANIA explicitly distinguishes live satellite measurements from curated geological scenario priors and reports every physical limitation (gravity, atmospheric pressure, radiation, and biological weathering) so users never confuse geological process similarity with full environmental equivalence.
- Democratizing Under-Recognized Analogs: Alongside established benchmarks (Devon Island, Atacama, McMurdo Dry Valleys, Craters of the Moon, Rio Tinto), ATLANIA highlights high-value equatorial and Southern Hemisphere sites such as the Galapagos Lava Tubes, Chimborazo, Cotopaxi, Sangay, and Quilotoa in Ecuador; Salar de Uyuni and Laguna Colorada in Bolivia; Cono de Arita and Campo de Piedra Pomez in Argentina; Lonar Crater in India; and the Pilbara Craton in Australia.

### Technology Stack
- Scientific Engine: Python 3.11+, httpx (with exponential backoff retry and deterministic offline fallback), pytest (219 unit and property tests), managed with uv.
- Frontend & 3D Visualization: Next.js 16 (App Router, TypeScript 5, React 19), Tailwind CSS 4, Three.js (WebGL planetary shaders, stratified crust meshes, and DEM terrain twins), MapLibre GL JS 6, GSAP ScrollTrigger, and Node.js native test runner (50 unit/regression tests).
```

---

## 5. Use of Super Intelligence (SI)

*Prompt: Did you utilize any Super Intelligence (SI) tools and software in preparing your solution? If yes, how did you use them? Clearly indicate where and how SI tools were utilized in your project (Images/videos, Audio, Code and data).*

```text
Yes. In full compliance with the 2026 NASA Space Apps Challenge rules on Super Intelligence (SI), our team used SI tools strictly as engineering accelerators while keeping the scientific conception, mathematical modeling of the 5-axis Analog Similarity Index (ASI), selection of the 35 analog sites and 6 planetary reference targets, and architectural decisions entirely human-led.

No NASA branding, logos, flags, or mission insignia were generated, modified, or included in any SI-assisted asset.

Detailed SI Utilization & Attribution by Category:

1. Code and Data (Acknowledged in README.md, engine/README.md, and in-app Methodology Dialog):
   - Tools used: Google Gemini (Antigravity IDE assistant) and OpenAI Codex CLI.
   - How they were used: Assisted in scaffolding TypeScript/React components, writing unit tests (219 Python pytest tests and 50 Node.js tests), implementing the direct PNG DecompressionStream decoder for Terrarium DEM elevation tiles, and formatting structured bilingual documentation.
   - Data integrity: All climatological and topographic telemetry in `analogs.json` and `analogs.geojson` is fetched deterministically from official NASA POWER and Open-Meteo/Copernicus APIs via `engine/asi_engine.py`, not hallucinated by language models.

2. Images and Visual Assets (Watermarked / Acknowledged in docs/ and frontend/public/nasa/SOURCES.md):
   - All planetary and Earth satellite photography in `/frontend/public/nasa/` consists of authentic public-domain NASA/JPL/USGS/ESA imagery (cited with PIA/archive IDs in `SOURCES.md`).
   - Only the custom ATLANIA project emblem/isotipo (`frontend/public/brand/` and `docs/assets/branding/`) was conceptually assisted by generative design tools and refined by the team; it contains zero NASA logos or mission identifiers. Any SI-assisted visual frames in the demo video carry a visible attribution watermark.

3. Audio (Acknowledged in descriptive text and metadata):
   - Tool used: Neural text-to-speech synthesis (`edge-tts` / `docs/audio/generate_voiceover.py`) was used to generate the voiceover narration tracks (`docs/audio/*.mp3`) from our human-written script for the project demonstration video.
```

---

## 6. NASA Data

*Prompt: Provide specific details about what NASA data and resources you used. To be eligible for a Global Award, you must use at least one NASA data or resource.*

```text
ATLANIA integrates live NASA Earth observation APIs, NASA GIBS orbital imagery layers, and NASA Planetary Data System (PDS) reference archives across its backend engine and 3D frontend:

1. NASA POWER (Prediction Of Worldwide Energy Resources) Climatology API:
   - Endpoint: `https://power.larc.nasa.gov/api/temporal/climatology/point`
   - Parameters ingested (`RE` community): `T2M_MAX` (2m Maximum Air Temperature), `T2M_MIN` (2m Minimum Air Temperature), `PRECTOTCORR` (Corrected Precipitation, mm/day), `WS10M` (10m Wind Speed), `RH2M` (2m Relative Humidity), `ALLSKY_SFC_SW_DWN` (All-Sky Surface Shortwave Downward Irradiance, kWh/m2/day), and `PS` (Surface Pressure, kPa).
   - Usage: Drives the live Thermal Regime and Hydrology/Aridity scoring across all 35 catalog sites and powers real-time on-demand coordinate (`/api/evaluate`) and regional grid (`/api/evaluate-region`) probing.

2. NASA GIBS (Global Imagery Browse Services) / Earthdata WMTS:
   - Layer: `MODIS_Terra_CorrectedReflectance_TrueColor` (`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/...`)
   - Usage: Integrated directly into the MapLibre GL 3D globe in `/explorer` with dynamic date and opacity controls for real-time orbital cloud, cryosphere, and surface albedo inspection.

3. NASA Planetary Data System (PDS) Reference Archives (Moon & Mars Target Calibration):
   - Lunar Reconnaissance Orbiter (LRO) Diviner Lunar Radiometer Experiment: Global Cumulative Products (`LRO-L-DLRE-5-GCP-V1.0`, `https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=LRO-L-DLRE-5-GCP-V1.0`) — thermal baselines for Shackleton Crater (-183 C cold-trap scenario), Mare Tranquillitatis pit shade (~17 C), and Mons Mouton (-55 C plateau).
   - LRO Lunar Orbiter Laser Altimeter (LOLA): (`https://pds-geosciences.wustl.edu/missions/lro/lola.htm`) — topographic slope and roughness reference profiles for Lunar South Pole (Artemis III) and Mare Tranquillitatis.
   - LRO Camera (LROC) Calibrated Data Record: (`LRO-L-LROC-3-CDR-V1.0`, `https://pds.lroc.asu.edu/`) — morphological reference for lunar skylights and collapsed lava tubes.
   - Mars 2020 Perseverance Mars Environmental Dynamics Analyzer (MEDA): (`DOI: 10.17189/1522849`, `https://pdsatmospheres.nmsu.edu/data_and_services/atmospheres_data/PERSEVERANCE/meda.html`) — diurnal thermal and pressure reference for Jezero Crater.
   - Mars Reconnaissance Orbiter (MRO) CRISM (Compact Reconnaissance Imaging Spectrometer for Mars): (`https://pds-geosciences.wustl.edu/missions/mro/crism.htm`) — phyllosilicate clay, carbonate, and polyhydrated sulfate mineralogy references for Jezero Crater and Valles Marineris.
   - Mars Global Surveyor (MGS) MOLA & MRO HiRISE: (`https://pds-geosciences.wustl.edu/missions/mgs/mola.html`, `https://hirise.lpl.arizona.edu/PDS/`) — topographic slope and volcanic/canyon geomorphology baselines for Olympus Mons and Valles Marineris.

4. NASA / USGS Landsat 8 & 9 (OLI/OLI-2 and TIRS/TIRS-2) Spectral Profiles:
   - Documented in each site's `satellite_observatory` record (`optical` Bands 2-7 iron-oxide/hydroxyl ratios and `thermal_tir` Bands 10-11 thermal inertia), alongside NASA Visible Earth and JPL Photojournal imagery (`PIA18564`, `PIA23420`, `PIA26501`, `ARC-2007-ACD07-0170-005`).
```

---

## 7. Space Agency Partner Data and Other References

*Prompt: List all of the data, resources, and tools used in your project, including Space Agency Partners and open-source software.*

```text
### 2026 NASA Space Apps Space Agency Partner Data & Context
1. ESA (European Space Agency):
   - Copernicus DEM GLO-90 (Global Digital Elevation Model, 90m resolution, `DOI: 10.5270/ESA-c5d3d65`), accessed via the Open-Meteo Elevation API (`https://api.open-meteo.com/v1/elevation`) to compute 5-point central-difference topographic slope (`dem_slope_deg`) and local relief roughness (`dem_roughness_m`) across all 35 analog sites and live user probes.
   - Copernicus Sentinel-1 C-Band Synthetic Aperture Radar (C-SAR, 5.405 GHz, VV/VH dual-polarization): documented in each site's `satellite_observatory.radar_sar` profile to evaluate centimetre-scale regolith surface roughness and subsurface penetrability.
   - ESA / NASA AMASE (Arctic Mars Analog Svalbard Expedition): scientific reference context for the Bockfjord volcanic-permafrost complex (`svalbard-bockfjord`).

2. CSA (Canadian Space Agency):
   - Haughton Impact Crater, Devon Island, Nunavut (`haughton-crater`): polar impact structure and permafrost analog context used for lunar and Martian rover/habitat field validation.

3. Spanish Space Agency (Agencia Espacial Española - AEE) / Regional Context:
   - Rio Tinto Acidic Basin (`rio-tinto`, Huelva) and Timanfaya Basaltic Volcanism (`timanfaya`, Lanzarote): astrobiological iron-sulfate (jarosite) and basaltic lava field analogs used in ESA/NASA instrument testing (Pangaea training program).

4. ISRO (Indian Space Research Organisation) / Regional Context:
   - Lonar Impact Crater (`lonar-crater`, Maharashtra, India): hypervelocity impact crater in pure Deccan Traps basalt, providing a key terrestrial analog for lunar mare and Martian basaltic impact craters.

5. JAXA (Japan Aerospace Exploration Agency) / NASA Joint Reference Context:
   - ASTER (Advanced Spaceborne Thermal Emission and Reflection Radiometer) imagery and SELENE/Kaguya lunar lava tube skylight discovery literature referenced in our volcanic analog evaluations.

### Open-Source Software, Basemaps & Libraries
- MapLibre GL JS v6.18 (`https://maplibre.org/`) — WebGL interactive 3D globe and cartographic engine.
- Three.js r187 (`https://threejs.org/`) — 3D planetary scene, stratified crust extraction shader, and HD DEM terrain twin viewer.
- AWS Open Data Terrain Tiles (Mapzen Terrarium DEM format, `https://registry.opendata.aws/terrain-tiles/`) — decoded client-side via native `DecompressionStream('deflate')` for 3D terrain mesh generation.
- Esri World Imagery & CARTO Dark Matter Basemaps — high-resolution optical context and cartographic labels.
- Next.js 16, React 19, Tailwind CSS 4, GSAP 3.15, Lucide Icons.
- Python 3.11, `httpx`, `pytest`, `uv` (Astral).
```

---

## 8. Final Pre-Submission Verification Checklist (Deadline: Sunday, Nov 15 at 11:59 PM Local Time)

- [ ] **All Team Members Confirmed:** Every team member is a confirmed participant in the same Local Event (or Universal Event).
- [ ] **English Language Compliance:** All text pasted into the Project Submission form is in English (use the sections above). If the demo video has Spanish narration, verify that **English subtitles are burned in or enabled**.
- [ ] **Strict Demo Limits (Global Judging Eligibility):**
  - If submitting a video demo: verify duration is **30 seconds or less** (`<= 0:30`).
  - If submitting a slide deck demo: verify length is **7 slides or fewer** (including title and intro slides) and written in English.
- [ ] **Public Link Verification:** Open both the *Link to Project Demo* and *Link to Final Project* in a private/incognito browser window to confirm zero passwords, logins, or permission prompts appear.
- [ ] **No Under-18 Likeness:** Confirm no images, video, or audio of persons under 18 years old appear in the demo or project.
- [ ] **Submit for Judging:** Check both boxes (*"Terms and Conditions"* and *"Confirm All Work is Original"*) and click **"Submit for Judging"** before 11:59 p.m. local time.
