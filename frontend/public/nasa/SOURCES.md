# NASA, Space Agency Partner & Visual Asset Attribution (`frontend/public/nasa/`)

All planetary and terrestrial satellite photographs in `frontend/public/nasa/` are public-domain or open-access scientific imagery from NASA, JPL-Caltech, USGS, ESA, and partner missions. Circular or layout crops are applied via CSS; original source files are retained unmodified.

## 1. Planetary Globes, Textures & Orbital Views

| File | Subject / Mission | Source & Archive Identifier |
| :--- | :--- | :--- |
| `earth-blue-marble.jpg` | Earth Blue Marble (MODIS) | NASA Visible Earth · Blue Marble Next Generation |
| `earth-equirectangular.jpg` | Earth Equirectangular Surface Albedo | NASA Visible Earth · MODIS Composite |
| `earth-horizon-iss.jpg` | Earth Atmospheric Limb from ISS | NASA Johnson Space Center · ISS Crew Earth Observations |
| `moon-navigation.jpg` | Full Moon Navigation Portrait | NASA Science · [Earth's Moon Resources](https://science.nasa.gov/solar-system/resources/resource-packages/earths-moon-resources/) |
| `moon-orb.jpg` | Lunar Global Mosaic | NASA / GSFC / Arizona State University · LROC |
| `moon-equirectangular.jpg` | Lunar Equirectangular Basemap | NASA / USGS / LRO LROC-LOLA Combined Basemap |
| `mars-orb.jpg` | Mars Global Portrait | NASA / JPL / USGS · Viking & MRO Global Mosaic |
| `mars-equirectangular.jpg` | Mars Equirectangular Surface Map | NASA / JPL-Caltech / MGS MOC & MOLA |

## 2. Lunar & Martian Reference Target Imagery

| File | Target ID | Mission & Archive Credit |
| :--- | :--- | :--- |
| `shackleton-south-pole.jpg` | `shackleton-crater` | NASA / GSFC / ASU / LRO LOLA & Diviner · Lunar South Pole Illumination & Shadowed Interior |
| `mare-tranquillitatis-pit.jpg` | `mare-tranquillitatis` | NASA / GSFC / Arizona State University · LROC Narrow Angle Camera (Mare Tranquillitatis Skylight Pit) |
| `mouton-mons-artemis.jpg` | `mouton-mons` | NASA / LRO · Mons Mouton Lunar South Pole Plateau (Artemis III Candidate Region) |
| `jezero-crater-delta.jpg` | `jezero-crater` | NASA / JPL-Caltech / MSSS / JHU-APL · MRO HiRISE & CTX Jezero Western Fan Delta |
| `olympus-mons.jpg` | `olympus-mons-flank` | NASA / JPL-Caltech / Viking & MRO · Flows of Olympus Mons (`PIA02982`) |
| `valles-marineris.jpg` | `valles-marineris` | NASA / JPL-Caltech / USGS · Valles Marineris Coprates Chasma Hemisphere Mosaic |

## 3. Terrestrial Analog Context Imagery

| File | Site ID | Mission & Archive Credit |
| :--- | :--- | :--- |
| `galapagos-isabela.jpg` | `galapagos-lava-tubes` / `sierra-negra` | NASA / JPL / USGS · Volcán Wolf & Isabela Island, Galápagos (`PIA18564`) |
| `devon-haughton.jpg` | `haughton-crater` | NASA Ames Research Center · Haughton-Mars Project, Devon Island (`ARC-2007-ACD07-0170-005`) |
| `atacama-salar.jpg` | `atacama-yungay` | NASA / JPL-Caltech / ASTER · Atacama Desert Hyperarid Core (`PIA23420`) |
| `craters-of-the-moon.jpg` | `craters-of-the-moon` | NASA / JPL-Caltech / ASTER · Craters of the Moon Lava Field, Idaho (`PIA26501`) |

## 4. Orbital Spacecraft & Instrument Reference Cutouts

| File | Spacecraft / Sensor | Agency Attribution |
| :--- | :--- | :--- |
| `lro-cutout.png` | Lunar Reconnaissance Orbiter (LRO) | NASA Goddard Space Flight Center |
| `mro-cutout.png` | Mars Reconnaissance Orbiter (MRO) | NASA / JPL-Caltech |
| `landsat9-cutout.png` | Landsat 9 (OLI-2 / TIRS-2) | NASA / USGS |
| `sentinel1-cutout.png` | Copernicus Sentinel-1 (C-Band SAR) | European Space Agency (ESA) |
| `suomi-npp-cutout.png` | Suomi NPP (VIIRS) | NASA / NOAA |
| `astronaut-eva.jpg` / `astronaut-cutout.png` | Extravehicular Activity Reference | NASA Image and Video Library |

## 5. Super Intelligence (SI) Transparency & Metadata Attribution

In accordance with the 2026 NASA Space Apps Challenge Project Submission Guide:
- **Zero NASA Branding Modification:** No NASA logos, insignia, flags, or mission identifiers were generated or modified using Super Intelligence (SI) tools.
- **Branding Assets (`frontend/public/brand/` and `docs/assets/branding/`):** The custom ATLANIA cartographic emblem/isotipo was conceptualized with generative design assistance and refined in SVG/PNG by the team.
- **Audio Narration (`docs/audio/`):** Demonstration voiceover audio files were synthesized from human-written scripts using neural text-to-speech (`edge-tts`).
- **Code & Scientific Engine (`engine/` and `frontend/`):** Software implementation and unit test suites were accelerated using AI coding assistants (Google Gemini / Antigravity and OpenAI Codex), while all ASI mathematical formulas, target weight calibrations, and live NASA POWER / Copernicus DEM data pipelines are deterministic and human-verified.
