"""Exploratory ASI, not a validated similarity probability or site safety rating.

Catalog terrain/geology/ice/operations numbers are illustrative scenario priors.
Custom probes use DEM terrain and POWER climate proxies, with zero memberships
for unmeasured geology and operations. Neither is a validated site assessment.
See README.md for equations, units, provenance, and known comparison limitations.
"""
from __future__ import annotations

import calendar
import math
import random
import time
from dataclasses import asdict, dataclass, field, replace
from typing import Any, Mapping

import httpx

POWER_URL = "https://power.larc.nasa.gov/api/temporal/climatology/point"
PARAMETERS = ("T2M_MAX", "T2M_MIN", "PRECTOTCORR", "WS10M", "RH2M", "ALLSKY_SFC_SW_DWN", "PS")
MONTHS = tuple(calendar.month_abbr[i].upper() for i in range(1, 13))
DAYS = (31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)
DIMENSIONS = ("topography", "geology", "thermal", "hydrology_ice", "subsurface_ops")
GEOLOGY = ("basalt", "regolith", "sedimentary", "evaporite", "impact")
UNITS = dict(zip(PARAMETERS, ("degC", "degC", "mm/day", "m/s", "%", "kWh/m2/day", "kPa")))
PRIOR_NOTE = "Illustrative scenario priors; not measured or calibrated site properties."


def finite(value: Any, name: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError(f"{name} must be a finite number")
    return float(value)


@dataclass(frozen=True)
class Terrain:
    slope_deg: float
    roughness: float  # 0..1 scenario scale; custom probes use min(1, DEM stddev / 120 m)
    geology: tuple[float, float, float, float, float]  # memberships, not fractions
    ice: float  # qualitative ice/permafrost relevance, not ice abundance
    aqueous_history: float
    lava_tubes: float  # operational relevance, not detection probability
    shelter: float

    def __post_init__(self) -> None:
        if not 0 <= finite(self.slope_deg, "slope_deg") <= 90:
            raise ValueError("slope_deg must be in [0, 90]")
        if len(self.geology) != len(GEOLOGY):
            raise ValueError("geology must contain five memberships")
        for value in (self.roughness, *self.geology, self.ice, self.aqueous_history,
                      self.lava_tubes, self.shelter):
            if not 0 <= finite(value, "membership") <= 1:
                raise ValueError("memberships must be in [0, 1]")


@dataclass(frozen=True)
class Climate:
    tmax_c: float
    tmin_c: float
    precipitation_mm_day: float
    wind_m_s: float
    relative_humidity_pct: float
    source: str = "fallback"
    fallback_reason: str | None = None
    source_url: str | None = None
    period: str | None = None
    aggregation: str = "illustrative annual scenario"

    solar_irradiance_kwh_m2_day: float = 4.0
    surface_pressure_kpa: float = 101.325

    def __post_init__(self) -> None:
        for name in ("solar_irradiance_kwh_m2_day", "surface_pressure_kpa", "tmax_c", "tmin_c", "precipitation_mm_day", "wind_m_s", "relative_humidity_pct"):
            finite(getattr(self, name), name)
        if not -100 <= self.tmin_c <= self.tmax_c <= 70:
            raise ValueError("Earth air temperature outside supported range or min > max")
        if self.precipitation_mm_day < 0 or self.wind_m_s < 0:
            raise ValueError("Precipitation and wind must be nonnegative")
        if self.solar_irradiance_kwh_m2_day < 0 or not 0 < self.surface_pressure_kpa <= 120:
            raise ValueError("Invalid solar irradiance or surface pressure")
        if not 0 <= self.relative_humidity_pct <= 100:
            raise ValueError("Humidity must be in [0, 100]")


@dataclass(frozen=True)
class Site:
    id: str
    name: str
    country: str
    latitude: float
    longitude: float
    elevation_m: float
    terrain: Terrain
    fallback: Climate
    rationale: str
    caveat: str
    discovery_tier: str = "Benchmark"
    mission_testbeds: tuple[str, ...] = ("Rover traverse planning", "Surface sampling procedures")
    satellite_observatory: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not -90 <= finite(self.latitude, "latitude") <= 90:
            raise ValueError("Invalid latitude")
        if not -180 <= finite(self.longitude, "longitude") <= 180:
            raise ValueError("Invalid longitude")
        finite(self.elevation_m, "elevation_m")


@dataclass(frozen=True)
class Reference:
    id: str
    name: str
    body: str
    terrain: Terrain
    temperature_mean_c: float
    temperature_range_c: float
    dryness: float
    weights: tuple[float, float, float, float, float]
    context: str
    source_url: str
    instrument: str = ""
    pds_dataset: str = ""
    gravity_ms2: float = 0.0
    pressure_kpa: float = 0.0
    temp_min_c: float = 0.0
    temp_max_c: float = 0.0
    mineralogy_summary: str = ""
    metadata_note: str = (
        "Archive citations provide mission context, not locally extracted telemetry. "
        "Temperature bounds are illustrative scenario mean +/- half range; gravity "
        "and pressure are nominal body constants (Mars pressure varies with altitude/season). "
        "Mineralogy is regional context, not a quantitative local assay."
    )

    def __post_init__(self) -> None:
        finite(self.temperature_mean_c, "temperature_mean_c")
        if finite(self.temperature_range_c, "temperature_range_c") < 0:
            raise ValueError("Temperature range must be nonnegative")
        if not 0 <= finite(self.dryness, "dryness") <= 1:
            raise ValueError("Dryness must be in [0, 1]")
        if len(self.weights) != 5 or any(finite(w, "weight") < 0 for w in self.weights):
            raise ValueError("Five nonnegative dimension weights required")
        if not math.isclose(sum(self.weights), 1.0):
            raise ValueError("Weights must sum to one")


REFERENCE_PROFILES = {
    r.id: r for r in (
        Reference("shackleton-crater", "Shackleton Crater / Lunar South Pole (Artemis)", "Moon",
                  Terrain(20, .85, (.05, 1, .05, 0, 1), .95, 0, 0, .25),
                  -183, 10, 1, (.25, .20, .20, .30, .05),
                  "Cold-trap interior scenario; does not represent the illuminated rim. Ice relevance is a hypothesis, not a local abundance measurement.",
                  "https://science.nasa.gov/resource/shackleton-craters-illuminated-rim-shadowed-interior/",
                  instrument="LRO Diviner + LOLA",
                  pds_dataset="LRO-L-DLRE-5-GCP-V1.0; https://pds-geosciences.wustl.edu/missions/lro/lola.htm",
                  gravity_ms2=1.62, pressure_kpa=0.0, temp_min_c=-188, temp_max_c=-178,
                  mineralogy_summary="Highlands impact regolith; anorthositic context and possible cold-trapped volatiles, not verified local ice abundance."),
        Reference("mare-tranquillitatis", "Mare Tranquillitatis / Lunar Lava Tubes", "Moon",
                  Terrain(5, .55, (1, .8, 0, 0, .1), 0, 0, 1, 1),
                  17, 2, 1, (.15, .30, .15, .10, .30),
                  "Shaded pit / hypothetical connected cave scenario; 17 C is modeled pit shade, not lunar surface climate or a proven habitable cave.",
                  "https://www.nasa.gov/solar-system/nasas-lro-finds-lunar-pits-harbor-comfortable-temperatures/",
                  instrument="LRO LROC + Diviner",
                  pds_dataset="LRO-L-LROC-3-CDR-V1.0; LRO-L-DLRE-5-GCP-V1.0",
                  gravity_ms2=1.62, pressure_kpa=0.0, temp_min_c=16, temp_max_c=18,
                  mineralogy_summary="Basaltic mare terrain and regolith; pit morphology suggests possible lava-tube access, not confirmed cave extent."),
        Reference("jezero-crater", "Jezero Crater / Mars Delta and Basalt", "Mars",
                  Terrain(6, .6, (.8, .8, 1, .3, .5), .1, 1, 0, .1),
                  -60, 70, 1, (.20, .35, .15, .25, .05),
                  "Present dry surface thermal scenario combined with ancient aqueous geology; not a reconstruction of ancient climate.",
                  "https://www.jpl.nasa.gov/news/nasas-perseverance-rover-deciphers-ancient-history-of-martian-lake/",
                  instrument="Perseverance MEDA + MRO CRISM",
                  pds_dataset="MEDA doi:10.17189/1522849; https://pds-geosciences.wustl.edu/missions/mro/crism.htm",
                  gravity_ms2=3.71, pressure_kpa=0.65, temp_min_c=-95, temp_max_c=-25,
                  mineralogy_summary="Basaltic crater-floor rocks and ancient delta sediments; regional carbonate and hydrated mineral signatures."),
        Reference("olympus-mons-flank", "Olympus Mons Flank / Mars Volcanic Lava Tubes", "Mars",
                  Terrain(8, .8, (1, .7, .05, 0, .1), .1, .05, 1, .9),
                  -65, 80, 1, (.25, .30, .15, .10, .20),
                  "Exposed volcanic flank thermal scenario with tube exploration relevance; no measured subsurface temperature assumed.",
                  "https://science.nasa.gov/photojournal/the-flows-of-olympus/",
                  instrument="MGS MOLA + MRO HiRISE",
                  pds_dataset="https://pds-geosciences.wustl.edu/missions/mgs/mola.html; https://hirise.lpl.arizona.edu/PDS/",
                  gravity_ms2=3.71, pressure_kpa=0.65, temp_min_c=-105, temp_max_c=-25,
                  mineralogy_summary="Volcanic lava-flow terrain interpreted as basaltic; MOLA/HiRISE constrain morphology, not mineral abundances."),
        Reference('mouton-mons', 'Mons Mouton / Lunar South Pole Plateau (Artemis III)', 'Moon',
                  Terrain(8, .65, (.05, .95, .05, 0, .85), .75, 0, 0, .35), -110, 45, 1,
                  (.30, .25, .20, .20, .05), 'Broad flat-topped south polar massif near Shackleton; candidate Artemis III landing zone with low slope and prolonged solar illumination.',
                  'https://www.nasa.gov/reference/artemis-iii-candidate-landing-regions/', instrument='LRO LOLA + Diviner',
                  pds_dataset='LRO-L-LOLA-4-GDR-V1.0; LRO-L-DLRE-5-GCP-V1.0', gravity_ms2=1.62, pressure_kpa=0.0,
                  temp_min_c=-132.5, temp_max_c=-87.5,
                  mineralogy_summary='Highlands anorthositic regolith on gently sloping polar massif plateau.'),
        Reference('valles-marineris', 'Valles Marineris / Coprates Chasma Canyon & Sulfates', 'Mars',
                  Terrain(24, .9, (.75, .7, .9, .85, .2), .15, .85, .2, .4), -55, 65, 1,
                  (.25, .30, .15, .20, .10), 'Deep tectonic canyon system with steep layered walls, recurring slope lineae candidates, and polyhydrated sulfate deposits.',
                  'https://science.nasa.gov/resource/valles-marineris-the-grand-canyon-of-mars/', instrument='MRO HiRISE + CRISM',
                  pds_dataset='https://pds-geosciences.wustl.edu/missions/mro/crism.htm; https://hirise.lpl.arizona.edu/PDS/',
                  gravity_ms2=3.71, pressure_kpa=0.85, temp_min_c=-87.5, temp_max_c=-22.5,
                  mineralogy_summary='Layered basaltic wall rock and interior layered deposits rich in kieserite and polyhydrated sulfates.'),
    )
}

# Coordinates/elevations are representative map points, not surveyed sampling sites.
# Legacy Galapagos entry stays anchored on Santa Cruz; Sierra Negra samples Isabela.
EARTH_SITES = (
    Site("galapagos-lava-tubes", "Galapagos Lava Tubes - Santa Cruz / Isabela", "Ecuador",
         -.67, -90.38, 400, Terrain(5, .65, (1, .4, .05, 0, 0), 0, .1, 1, 1),
         Climate(27, 20, 2.2, 4, 85), "Basaltic lava tubes support cave robotics and habitat geometry trials.",
         "Santa Cruz climate point cannot resolve Isabela or cave microclimates; humid biological weathering and protected-area access constraints."),
    Site("chimborazo", "Chimborazo High-Altitude Volcanic Permafrost", "Ecuador",
         -1.47, -78.82, 5000, Terrain(22, .9, (.55, .7, .05, 0, 0), .8, .1, .05, .15),
         Climate(3, -8, 1.2, 7, 65), "High-altitude cold terrain supports frost and rover mobility experiments.",
         "Permafrost relevance is a scenario prior, not mapped extent; volcanic material is not uniformly basalt and POWER smooths summit relief."),
    Site("cotopaxi", "Cotopaxi Pyroclastic Plains", "Ecuador",
         -.68, -78.44, 3900, Terrain(7, .65, (.45, .9, .15, 0, 0), .25, .15, .1, .15),
         Climate(10, -1, 2, 5, 75), "Loose volcanic deposits provide traction, abrasion and dust handling analogs.",
         "Andesitic pyroclastics differ from lunar regolith; active volcanic hazards and wet weather require field assessment."),
    Site("salar-de-uyuni", "Salar de Uyuni", "Bolivia",
         -20.13, -67.49, 3656, Terrain(.5, .15, (.05, .25, .8, 1, 0), .1, 1, 0, 0),
         Climate(16, -5, .35, 4, 35), "Evaporites and basin sediments support ancient aqueous-environment studies.",
         "Seasonal flooding and salt crust chemistry differ from present Martian conditions."),
    Site("qaidam-basin", "Qaidam Basin", "China",
         38.5, 93, 2800, Terrain(4, .55, (.1, .7, 1, .9, 0), .15, .9, .05, .1),
         Climate(12, -9, .08, 4, 25), "Arid sedimentary and saline terrain supports Mars weathering and rover studies.",
         "Basin-wide heterogeneity is not captured by a single point; salts are not proof of identical Martian mineralogy."),
    Site("dallol", "Dallol Salt / Hydrothermal", "Ethiopia",
         14.24, 40.3, -125, Terrain(3, .7, (.15, .3, .65, 1, 0), 0, 1, 0, .05),
         Climate(41, 29, .25, 3, 35), "Hydrothermal salts offer geochemical process analogs for aqueous alteration.",
         "Extreme heat and acidic active fluids are a poor match to modern cold Mars; hazardous field conditions."),
    Site("craters-of-the-moon", "Craters of the Moon", "United States",
         43.42, -113.52, 1800, Terrain(6, .85, (1, .65, .05, 0, 0), .1, .05, 1, .85),
         Climate(14, -2, .8, 4, 45), "Basaltic flows and lava tubes support lunar and Martian cave operations.",
         "Terrestrial air, seasonal snow and biological alteration remain substantial differences."),
    Site("haughton-crater", "Haughton Crater", "Canada",
         75.38, -89.67, 250, Terrain(12, .75, (.05, .8, .7, .05, 1), 1, .6, .05, .2),
         Climate(-10, -20, .3, 5, 75), "Impact terrain and polar permafrost support cold-region mobility trials.",
         "Carbonate-rich target rocks differ from lunar highlands; polar air is far warmer than lunar cold traps."),
    Site("atacama-yungay", "Atacama Yungay", "Chile",
         -24.09, -69.99, 1000, Terrain(3, .5, (.1, .75, .8, .8, 0), 0, .65, 0, .05),
         Climate(25, 9, .003, 3, 25), "Hyperaridity and salt-bearing soils support Mars surface sampling studies.",
         "Fog, microbes and oxygen-driven weathering persist; aridity alone does not reproduce Mars."),
    Site("askja", "Askja Volcanic Field", "Iceland",
         65.03, -16.75, 1100, Terrain(10, .9, (1, .8, .1, 0, .1), .4, .2, .7, .65),
         Climate(4, -5, 1.5, 7, 80), "Young basalt, rough lava and volcanic deposits support rover traverse trials.",
         "Snow, precipitation and active volcanism differ from dry extraterrestrial surfaces; tube relevance needs local survey."),
)


# Added sites are candidate testbeds, not confirmed infrastructure or field access.
EARTH_SITES += (
    Site("sierra-negra", "Sierra Negra Caldera", "Ecuador", -.83, -91.17, 1124,
         Terrain(5, .8, (1, .6, .05, 0, 0), 0, .1, .6, .5), Climate(23, 16, 2, 5, 80),
         "Basaltic caldera terrain offers volcanic traverse and mapping scenarios.",
         "Active volcanism, biological weathering and protected-area restrictions; tubes require survey.",
         "Regional Highlight", ("Basalt rover wheel abrasion", "Caldera photogrammetry")),
    Site("antisana", "Antisana Glacier-Basalt", "Ecuador", -.48, -78.14, 4800,
         Terrain(20, .85, (.6, .6, .1, 0, 0), .9, .3, .05, .1), Climate(4, -7, 2, 7, 75),
         "Glacier and volcanic contacts offer cold terrain and ice sampling scenarios.",
         "Mixed volcanic lithology and terrestrial glacier ice do not reproduce lunar ice deposits.",
         "Regional Highlight", ("ISRU ice drilling procedures", "Glacier ground-penetrating radar")),
    Site("puna-laguna-verde", "Puna de Atacama / Laguna Verde", "Chile / Argentina", -26.88, -68.48, 4350,
         Terrain(6, .6, (.5, .6, .8, .8, 0), .2, .9, 0, .1), Climate(12, -8, .15, 6, 30),
         "High arid volcanic and saline basins offer Mars sampling scenarios.",
         "Representative Chilean point does not characterize the entire transboundary Puna; Earth air remains much denser than Mars.",
         "Regional Highlight", ("Thin-air rotorcraft control trials", "Raman salt mineral screening")),
    Site("lut-rig-e-yalan", "Lut Desert / Rig-e Yalan", "Iran", 30.5, 59.0, 450,
         Terrain(12, .7, (.05, .9, .8, .3, 0), 0, .1, 0, 0), Climate(35, 17, .08, 4, 20),
         "Dune terrain offers traction and aeolian sampling scenarios.",
         "Hot terrestrial sand and oxygen-rich air differ from cold Martian dunes.",
         "Under-Recognized", ("Dune rover slip estimation", "Dust abrasion testing")),
    Site("tibesti", "Tibesti Volcanic Field", "Chad", 19.8, 18.53, 3000,
         Terrain(15, .85, (.8, .8, .2, 0, .1), 0, .1, .3, .2), Climate(22, 6, .1, 5, 25),
         "Arid volcanic relief offers remote navigation and rock sampling scenarios.",
         "Mixed lithologies, sparse observations and access constraints require local assessment.",
         "Under-Recognized", ("Autonomous volcanic traverse navigation", "Portable LIBS rock screening")),
    Site("timanfaya", "Timanfaya Lava Tubes", "Spain", 29.02, -13.75, 350,
         Terrain(8, .9, (1, .7, .05, 0, 0), 0, .05, .8, .7), Climate(24, 17, .3, 6, 65),
         "Lanzarote lava terrain offers basalt mobility and candidate tube mapping scenarios.",
         "Representative Timanfaya point does not confirm an accessible tube; marine humidity and protected access differ from lunar conditions.",
         "Under-Recognized", ("Subsurface lava tube LiDAR", "Cave robot communications relay")),
    Site('el-reventador', 'El Reventador Volcanic Complex', 'Ecuador', -0.077, -77.656, 3562, Terrain(24, .9, (.85, .75, .1, 0, 0), .05, .15, .2, .2), Climate(14, 6, 4.5, 5, 85), 'Steep active stratovolcano with fresh basaltic-andesite lava flows and pyroclastic scarps for high-slope hazard navigation.', 'High rainfall and dense montane cloud-forest margins contrast with dry planetary canyons.', 'Regional Highlight', ('Steep-slope hazard autonomous navigation', 'Fresh lava flow LiDAR mapping')),
    Site('sangay-volcano', 'Sangay Pyroclastic & Ash Cone', 'Ecuador', -2.005, -78.341, 5230, Terrain(26, .88, (.75, .85, .1, 0, 0), .6, .1, .1, .15), Climate(2, -7, 2.5, 8, 78), 'Isolated high-altitude cone with continuous ashfall and steep tephra slopes for extreme-incline mobility trials.', 'Active eruptive hazards and humid Amazonian air masses differ from extraterrestrial environments.', 'Regional Highlight', ('High-incline tephra traction trials', 'Airborne volcanic ash seal testing')),
    Site('quilotoa-caldera', 'Quilotoa Volcanic Crater', 'Ecuador', -0.856, -78.904, 3914, Terrain(18, .75, (.4, .75, .6, .5, .3), .1, .95, .05, .15), Climate(13, 3, 1.4, 6, 70), 'Collapse caldera with mineralized alkaline-saline crater lake and steep tuff walls modeling ancient crater lakes.', 'Dacitic-rhyolitic ash composition and active water body differ from dry basaltic Martian craters.', 'Regional Highlight', ('Crater-rim autonomous descent planning', 'Hydrothermal sulfate-carbonate spectroscopy')),
    Site('valle-de-la-luna', 'Valle de la Luna - Cordillera de la Sal', 'Chile', -22.926, -68.259, 2550, Terrain(11, .72, (.1, .75, .95, 1, 0), 0, .9, .2, .25), Climate(24, 4, .01, 5, 22), 'Folded halite-gypsum ridges and salt caves in Atacama modeling Martian evaporite canyons and crust deformation.', 'Halite karst dissolution features form via episodic desert moisture rather than Martian atmospheric processes.', 'Regional Highlight', ('Evaporite canyon autonomous traverse', 'Subsurface salt-cave micro-rover deployment')),
    Site('campo-piedra-pomez', 'Campo de Piedra Pomez Yardangs', 'Argentina', -26.55, -67.45, 3150, Terrain(7, .78, (.2, .85, .7, .2, 0), .1, .2, .05, .15), Climate(16, -4, .18, 8, 28), 'High-Puna wind-carved ignimbrite yardangs and dark basaltic gravel ripples modeling Martian aeolian erosion.', 'Silicic pumice density is much lower than Martian basaltic bedrock despite similar yardang morphology.', 'Regional Highlight', ('Aeolian yardang obstacle avoidance', 'High-wind particulate sensor calibration')),
    Site('pampas-de-la-joya', 'Pampas de La Joya Hyperarid Soils', 'Peru', -16.72, -72.05, 1250, Terrain(3, .45, (.15, .8, .75, .75, 0), 0, .5, 0, .05), Climate(24, 9, .005, 4, 30), 'Hyperarid coastal-desert plains with sulfate-rich soils and ultralow organic carbon used for Mars astrobiology benchmarks.', 'Coastal fog incursions and oxidized nitrates reflect terrestrial atmospheric chemistry.', 'Regional Highlight', ('Ultralow-biomass life-detection assays', 'Autonomous soil trenching and caching')),
    Site('laguna-colorada', 'Laguna Colorada & Sol de Manana', 'Bolivia', -22.20, -67.78, 4300, Terrain(5, .55, (.45, .65, .85, .9, 0), .35, 1, 0, .05), Climate(11, -9, .22, 7, 32), 'High-Andean borax/sulfate playalake and fumarolic mudpots modeling early Mars hydrothermal-lacustrine systems.', 'Active ice-crusting and pigmented algae have no modern Martian surface counterpart.', 'Regional Highlight', ('Fumarolic gas-plume sniffer drone trials', 'High-UV ferric sediment spectroscopy')),
    Site('mcmurdo-dry-valleys', 'McMurdo Dry Valleys - Wright Valley', 'Antarctica', -77.52, 161.75, 350, Terrain(14, .75, (.65, .9, .5, .4, .1), 1, .6, 0, .15), Climate(-14, -28, .05, 7, 55), 'Coldest hyperarid ice-free valleys on Earth with ice-cemented permafrost and dolerite sills analogous to Mars and Lunar poles.', 'Strict Antarctic Treaty logistics and seasonal solar darkness constrain field testing windows.', 'Benchmark', ('Cryogenic permafrost core drilling', 'Cold-trap volatile analyzer validation')),
    Site('rio-tinto', 'Rio Tinto Acidic Iron-Sulfate Basin', 'Spain', 37.72, -6.56, 320, Terrain(9, .6, (.2, .5, .85, .95, 0), 0, 1, 0, .1), Climate(24, 11, 1.4, 4, 60), 'Extreme acidic river precipitating jarosite and goethite; premier mineralogical benchmark for Meridiani Planum on Mars.', 'Temperate Mediterranean climate and abundant liquid water contrast sharply with modern Mars.', 'Benchmark', ('Jarosite Mossbauer & Raman calibration', 'Acid-resistant fluid sampling actuators')),
    Site('mauna-loa-hiseas', 'Mauna Loa Basalt & HI-SEAS Skylights', 'United States', 19.60, -155.48, 2500, Terrain(7, .82, (1, .75, .05, 0, 0), .05, .05, 1, .95), Climate(15, 5, 1.1, 5, 55), 'Unweathered pahoehoe/aa basalt flows and lava tubes hosting NASA long-duration crewed habitat isolation missions.', 'Tropical high-island atmosphere and vegetation transitions below 2000 m differ from planetary vacuums.', 'Benchmark', ('Crewed habitat EVA workflow simulation', 'Skylight tether and cave-entry robotics')),
    Site('barringer-crater', 'Barringer Meteor Crater', 'United States', 35.027, -111.022, 1740, Terrain(19, .8, (.1, .85, .8, .1, 1), .05, .2, 0, .25), Climate(21, 4, .45, 5, 38), 'Best-preserved simple impact crater on Earth with overturned ejecta flap and shocked target rocks used for Apollo training.', 'Sedimentary target stratigraphy (sandstone/dolomite) differs from lunar anorthositic crust.', 'Benchmark', ('Impact ejecta stratigraphic traversing', 'Crater-wall steep-grade rover ascent')),
    Site('svalbard-bockfjord', 'Svalbard Bockfjord Volcanic-Permafrost', 'Norway', 79.45, 13.38, 500, Terrain(16, .8, (.85, .8, .4, .3, 0), .95, .75, .2, .2), Climate(-3, -11, .6, 6, 76), 'Quaternary basaltic cones erupted through Arctic permafrost with carbonate rosettes matching Martian meteorite ALH84001.', 'Marine Arctic humidity and seasonal meltwater streams exceed Martian water activity.', 'Benchmark', ('Cryo-volcanic astrobiology sterile sampling', 'Arctic permafrost GPR profiling')),
    Site('namib-sossusvlei', 'Namib Desert - Sossusvlei Megadunes', 'Namibia', -24.73, 15.36, 600, Terrain(15, .68, (.1, .9, .85, .3, 0), 0, .2, 0, .05), Climate(30, 13, .06, 5, 28), 'Iron-oxide coated linear megadunes and interdune clay pans analogous to Bagnold Dunes in Gale Crater on Mars.', 'Higher terrestrial air density drives different saltation thresholds than the 0.6 kPa Martian atmosphere.', 'Under-Recognized', ('Megadune slip-face autonomous traction', 'Aeolian dust-devil triboelectric sensing')),
    Site('kamchatka-tolbachik', 'Tolbachik Basaltic Fissure & Scoria', 'Russia', 55.83, 160.33, 1600, Terrain(11, .88, (1, .95, .05, 0, 0), .7, .1, .75, .7), Climate(1, -10, 1.6, 6, 72), 'Extensive loose basaltic scoria plains and collapsing lava tubes historically used to test Lunokhod and Marsokhod chassis.', 'Heavy winter snowpack and subarctic precipitation contrast with dry lunar maria.', 'Under-Recognized', ('Unconsolidated basalt scoria wheel-sinkage', 'Cold-climate lava tube roof stability sonar')),
)
# Issue #48: representative regional points; terrain memberships and climate
# fallbacks are illustrative priors, not site measurements or mineral fractions.
EARTH_SITES += (
    Site("lonar-crater", "Lonar Meteorite Crater", "India", 19.975, 76.505, 563,
         Terrain(18, .78, (1, .75, .3, .2, 1), 0, .85, 0, .2),
         Climate(32, 20, 2.1, 3, 55),
         "Impact crater excavated in Deccan flood basalts, supporting comparisons of shocked basalt, ejecta and alteration with lunar maria and Martian craters.",
         "Monsoon weathering, vegetation and an alkaline lake differ from dry lunar surfaces; aqueous alteration is more relevant to ancient Mars.",
         "Under-Recognized", ("Shocked-basalt Raman and LIBS screening", "Impact-ejecta rover traverse and sample caching")),
    Site("pilbara-craton", "Pilbara Archean Terrane", "Australia", -21.15, 119.33, 260,
         Terrain(8, .65, (.8, .5, .95, .15, 0), 0, 1, 0, .1),
         Climate(33, 19, .8, 4, 35),
         "Archean basaltic and iron-rich sedimentary terrains preserve roughly 3.5 Ga biosignature contexts; regional stromatolite studies inform Perseverance sampling at Jezero.",
         "Regional point does not locate a specific fossil outcrop; terrestrial biology, metamorphism and weathering complicate comparison with Martian biosignature preservation.",
         "Under-Recognized", ("Stromatolite-context imaging and biosignature discrimination", "Iron-rich sediment coring and contamination-controlled caching")),
    # NASA describes Arita as a sandstone hill; cone shape is not proof of volcanism.
    # https://science.nasa.gov/blogs/earth-matters/2014/07/03/june-puzzler-answer-salar-de-arizaro/
    Site("cono-de-arita", "Cono de Arita & Salar de Arizaro", "Argentina", -25.02, -67.72, 3750,
         Terrain(12, .65, (.15, .65, .9, 1, 0), .1, .85, 0, .1),
         Climate(16, -3, .08, 7, 25),
         "Conical erosional relief beside a high-altitude hyperarid salt flat provides morphological slope analogs and evaporite sampling contexts for Mars.",
         "Arita is described as a sandstone hill, not a confirmed volcanic cone; morphological similarity alone does not establish a stratovolcanic origin. Elevation represents the salar setting.",
         "Regional Highlight", ("Cone-to-salar autonomous slope transitions", "Evaporite Raman screening and salt-crust bearing tests")),
    Site("danakil-erta-ale", "Erta Ale & Danakil Basin", "Ethiopia", 13.60, 40.67, 613,
         Terrain(7, .9, (1, .75, .2, .3, 0), 0, .4, .35, .15),
         Climate(38, 26, .2, 4, 30),
         "Basaltic shield volcanism and long-lived lava-lake activity at Erta Ale complement regional Danakil hydrothermal and evaporite analogs for early Mars.",
         "Point and elevation represent Erta Ale, not the below-sea-level basin or Dallol hyperacidic springs. Lava-lake exposure varies; active lava and corrosive gases constrain field access.",
         "Under-Recognized", ("Remote lava-flow thermal mapping", "Basalt alteration spectroscopy and volcanic gas sensor trials")),
    Site("mojave-pisgah", "Pisgah Crater & Lava Tubes", "United States", 34.75, -116.38, 640,
         Terrain(10, .85, (1, .9, .1, 0, 0), 0, .1, .95, .8),
         Climate(28, 12, .25, 5, 28),
         "Quaternary basalt flows, cinder-cone relief and lava tubes offer lunar shelter and Mars mobility analogs in a Mojave field-testing landscape used by NASA JPL.",
         "Terrestrial gravity, atmospheric density and weathered lava differ from lunar and Martian conditions; tube geometry and accessibility require ground surveys.",
         "Under-Recognized", ("Basalt rover traction and autonomous hazard avoidance", "Lava-tube LiDAR and communications relay trials")),
)

# Observation targets, not confirmed satellite detections or acquired scenes.
_SATELLITE_TARGETS = {
    "galapagos-lava-tubes": "Santa Cruz basalt flows, vegetation gaps and candidate lava-tube surface expressions",
    "chimborazo": "high-altitude volcanic debris, snow margins and exposed cold soils",
    "cotopaxi": "pyroclastic plains, ash deposits and glacier margins",
    "salar-de-uyuni": "salt crust, seasonal inundation and basin sediments",
    "qaidam-basin": "saline sediments, dry channels and desert ridges",
    "dallol": "hydrothermal salt deposits and exposed geothermal surfaces",
    "craters-of-the-moon": "basalt flow textures and candidate lava-tube collapse features",
    "haughton-crater": "impact ejecta, carbonate terrain and seasonal snow",
    "atacama-yungay": "hyperarid soils, salt-bearing surfaces and dry drainage textures",
    "askja": "rough basalt flows, volcanic deposits and seasonal snow",
    "sierra-negra": "caldera structures and basaltic lava flow boundaries",
    "antisana": "glacier margins and exposed volcanic contacts",
    "puna-laguna-verde": "high-altitude saline basins and volcanic sediment contacts",
    "lut-rig-e-yalan": "dune morphology and exposed sand thermal contrasts",
    "tibesti": "arid volcanic relief and rock outcrop boundaries",
    "timanfaya": "lava textures and candidate tube-related surface collapses",
    "el-reventador": "fresh lava flows, scarps and cloud-forest margins",
    "sangay-volcano": "ash-covered slopes, tephra deposits and snow cover",
    "quilotoa-caldera": "crater-lake margins and exposed tuff walls",
    "valle-de-la-luna": "folded evaporite ridges and salt-cave surface expressions",
    "campo-piedra-pomez": "ignimbrite yardangs and dark gravel contrasts",
    "pampas-de-la-joya": "hyperarid soil surfaces and coastal moisture contrasts",
    "laguna-colorada": "playalake margins, salt crusts and geothermal surface contrasts",
    "mcmurdo-dry-valleys": "ice-free valley floors, glacier margins and exposed dolerite",
    "rio-tinto": "iron-stained sediments and river-margin alteration patterns",
    "mauna-loa-hiseas": "basalt flow textures and candidate skylight surface expressions",
    "barringer-crater": "crater walls, ejecta textures and sedimentary outcrops",
    "svalbard-bockfjord": "volcanic outcrops, seasonal snow and Arctic drainage patterns",
    "namib-sossusvlei": "megadune morphology and interdune clay pans",
    "kamchatka-tolbachik": "basaltic scoria, fissures and lava-tube collapse expressions",
    "lonar-crater": "basaltic crater walls, ejecta exposures and alkaline lake margins",
    "pilbara-craton": "Archean basalt contacts, iron-rich sedimentary ridges and exposed stratigraphic patterns",
    "cono-de-arita": "sandstone cone slopes, salt-crust boundaries and dry salar sediments",
    "danakil-erta-ale": "Erta Ale basalt flows, summit pit margins and exposed geothermal surfaces",
    "mojave-pisgah": "basalt flow textures, cinder-cone slopes and candidate lava-tube skylight expressions",
}


def satellite_observatory(site: Site) -> dict[str, Any]:
    """Describe candidate archive uses; no satellite data enter the ASI score."""
    target = _SATELLITE_TARGETS[site.id]
    return {
        "optical": {
            "mission": "Landsat 8 / Landsat 9",
            "instrument": "OLI / OLI-2",
            "spectrum": "Visible, near-infrared (VNIR), shortwave infrared (SWIR); panchromatic",
            "collects": "Spectral radiance and derived surface reflectance for geomorphological texture and surface-cover contrasts; broadband albedo requires modeling.",
            "site_application": f"Map exposed surface contrasts in {target}.",
            "limitations": "Clouds, vegetation, illumination and pixel size limit interpretation; multispectral contrasts are not mineral assays.",
            "source_url": "https://science.nasa.gov/mission/landsat/oli/",
        },
        "radar_sar": {
            "mission": "Sentinel-1",
            "instrument": "C-SAR",
            "band": "C-band (5.405 GHz; approximately 5.6 cm)",
            "collects": "Radar backscatter sensitive to surface roughness, dielectric properties and moisture; repeat-pass phase can support deformation mapping where coherence permits.",
            "site_application": f"Investigate roughness contrasts and structural surface lineaments in {target}.",
            "limitations": "Penetration depends on wavelength and material; C-band does not image lava tubes through solid rock. Faults and tube-related collapses require independent validation. Relief causes layover and shadow.",
            "source_url": "https://sentiwiki.copernicus.eu/web/s1-mission",
        },
        "thermal_tir": {
            "mission": "Landsat 8 / Landsat 9",
            "instrument": "TIRS / TIRS-2",
            "spectrum": "Thermal infrared (TIR), bands 10 and 11",
            "collects": "Thermal radiance supporting surface-temperature retrieval with atmospheric and emissivity corrections.",
            "site_application": f"Compare surface thermal contrasts across {target}.",
            "limitations": "Cloud-free repeated scenes constrain sampled temperature variability, not a full diurnal cycle. Thermal inertia needs temporal sampling and a physical model; radiative balance also needs emissivity and incoming fluxes. No cave interior temperature is measured.",
            "source_url": "https://science.nasa.gov/mission/landsat/tirs/",
        },
        "summary": f"{site.name}: combine optical surface reflectance, C-band roughness/structure and thermal surface contrasts to characterize {target}. Candidate observation profile only; local scene availability and resolution require verification. No imagery has been ingested and these metadata do not affect ASI.",
    }


_SITE_TESTBEDS = (
    ("Subsurface lava tube LiDAR", "Habitat geometry surveys"),
    ("Frost rover mobility", "Cold-soil drill procedures"),
    ("Regolith wheel traction", "Dust seal abrasion"),
    ("Evaporite Raman spectroscopy", "Salt crust rover bearing tests"),
    ("Saline soil sample caching", "Rover autonomous navigation"),
    ("Hydrothermal mineral spectroscopy", "Corrosion sensor deployment"),
    ("Lava tube robot navigation", "Basalt wheel abrasion"),
    ("ISRU ice drilling procedures", "Polar rover communications"),
    ("Low-biomass sample contamination control", "Dry-soil drill testing"),
    ("Basalt rover traverse", "Volcanic terrain photogrammetry"),
)
EARTH_SITES = tuple(replace(site,
    satellite_observatory=satellite_observatory(site),
    discovery_tier="Regional Highlight" if i < 3 else site.discovery_tier,
    mission_testbeds=_SITE_TESTBEDS[i] if i < 10 else site.mission_testbeds,
    fallback=replace(site.fallback, surface_pressure_kpa=round(101.325 * math.exp(-site.elevation_m / 8434.5), 3)))
    for i, site in enumerate(EARTH_SITES))


def parse_power(payload: Mapping[str, Any], source_url: str) -> Climate:
    """Prefer ANN; otherwise day-weight 12 monthly means (365-day convention).

    A missing/invalid parameter rejects the entire response to avoid silently mixing
    measured and fallback climatology. PRECTOTCORR is a rate, never a monthly sum.
    """
    params = payload["properties"]["parameter"]
    fill = payload.get("header", {}).get("fill_value", -999)
    values = []
    modes = []
    for parameter in PARAMETERS:
        series = params[parameter]
        if "ANN" in series:
            value = finite(series["ANN"], parameter)
            if value == fill or value == -999:
                raise ValueError(f"Missing POWER value: {parameter}")
            modes.append("ANN")
        else:
            monthly = [finite(series[m], parameter) for m in MONTHS]
            if any(v == fill or v == -999 for v in monthly):
                raise ValueError(f"Missing POWER monthly value: {parameter}")
            # Validate monthly ranges too; averaging must not hide invalid months.
            for v in monthly:
                if parameter in ("PRECTOTCORR", "WS10M", "ALLSKY_SFC_SW_DWN") and v < 0:
                    raise ValueError(f"Negative POWER value: {parameter}")
                if parameter == "PS" and not 0 < v <= 120:
                    raise ValueError("Invalid monthly pressure")
                if parameter == "RH2M" and not 0 <= v <= 100:
                    raise ValueError("Invalid monthly humidity")
                if parameter.startswith("T2M") and not -100 <= v <= 70:
                    raise ValueError("Invalid monthly temperature")
            value = sum(v * days for v, days in zip(monthly, DAYS)) / 365
            modes.append("monthly day-weighted (365 days)")
        values.append(value)
    header = payload.get("header", {})
    period = f"{header['start']}..{header['end']}" if "start" in header and "end" in header else None
    return Climate(*values[:5], solar_irradiance_kwh_m2_day=values[5],
                   surface_pressure_kpa=values[6], source="nasa_power", source_url=source_url, period=period,
                   aggregation="; ".join(f"{p}: {m}" for p, m in zip(PARAMETERS, modes)))


def fetch_climatology(site: Site, *, client: httpx.Client | None = None,
                      timeout: float = 10.0, offline: bool = False) -> Climate:
    """Fetch POWER with bounded request timeouts; deterministic, labeled fallback."""
    if finite(timeout, "timeout") <= 0:
        raise ValueError("timeout must be positive")
    params = {"parameters": ",".join(PARAMETERS), "community": "RE",
              "longitude": site.longitude, "latitude": site.latitude, "format": "JSON"}
    url = str(httpx.URL(POWER_URL, params=params))
    if offline:
        reason = "offline mode requested"
    else:
        try:
            response = _get_with_retry(POWER_URL, params, timeout, client)
            return parse_power(response.json(), str(response.url))
        except (httpx.HTTPError, ValueError, KeyError, TypeError, AttributeError) as exc:
            # Stable diagnostic without leaking proxy URLs, credentials, or raw payloads.
            reason = f"NASA POWER unavailable or invalid ({type(exc).__name__})"
    data = asdict(site.fallback)
    data.update(source="fallback", fallback_reason=reason, source_url=url)
    return Climate(**data)


def _get_with_retry(url: str, params: dict, timeout: float,
                    client: httpx.Client | None = None) -> httpx.Response:
    """Three attempts for transport errors, 429 and 5xx; 1s/2s backoff."""
    if client is None:
        with httpx.Client(follow_redirects=True) as owned:
            return _get_with_retry(url, params, timeout, owned)
    for attempt in range(3):
        try:
            response = client.get(url, params=params, timeout=timeout)
            response.raise_for_status()
            return response
        except httpx.HTTPError as exc:
            retryable = isinstance(exc, httpx.TransportError) or (
                isinstance(exc, httpx.HTTPStatusError) and
                (exc.response.status_code == 429 or exc.response.status_code >= 500))
            if not retryable or attempt == 2:
                raise
            time.sleep(2 ** attempt)
    raise AssertionError("unreachable")


ELEVATION_URL = "https://api.open-meteo.com/v1/elevation"
DEM_STEP_DEG = .01


def fetch_dem(site: Site, *, client: httpx.Client | None = None,
              timeout: float = 10.0, offline: bool = False) -> dict[str, Any]:
    """Center/N/S/E/W; central gradient and population elevation deviation."""
    if finite(timeout, "timeout") <= 0:
        raise ValueError("timeout must be positive")
    lat, lon = site.latitude, site.longitude
    wrap = lambda x: (x + 180) % 360 - 180
    points = [(lat, lon), (min(90, lat + .01), lon), (max(-90, lat - .01), lon),
              (lat, wrap(lon + .01)), (lat, wrap(lon - .01))]
    params = {"latitude": ",".join(str(p[0]) for p in points),
              "longitude": ",".join(str(p[1]) for p in points)}
    result = {"elevation_m": site.elevation_m, "dem_slope_deg": site.terrain.slope_deg,
              "dem_roughness_m": 0.0, "source": "fallback",
              "fallback_reason": "offline mode requested", "source_url": str(httpx.URL(ELEVATION_URL, params=params)),
              "sample_order": ["center", "north", "south", "east", "west"],
              "sample_spacing_deg": DEM_STEP_DEG, "sample_elevations_m": None,
              "attribution": "Open-Meteo / Copernicus DEM GLO-90 (2021)"}
    if offline:
        return result
    try:
        if abs(lat) > 89.99:
            raise ValueError("Symmetric stencil undefined near poles")
        response = _get_with_retry(ELEVATION_URL, params, timeout, client)
        elevations = response.json()["elevation"]
        if not isinstance(elevations, list) or len(elevations) != 5:
            raise ValueError("Five elevations required")
        z = [finite(v, "DEM elevation") for v in elevations]
        if any(not -12000 <= v <= 9000 for v in z):
            raise ValueError("DEM elevation out of range")
        dy = 6371008.8 * math.radians(DEM_STEP_DEG)
        dx = dy * math.cos(math.radians(lat))
        slope = math.degrees(math.atan(math.hypot((z[3]-z[4])/(2*dx), (z[1]-z[2])/(2*dy))))
        mean = sum(z)/5
        roughness = math.sqrt(sum((v-mean)**2 for v in z)/5)
        result.update(elevation_m=z[0], dem_slope_deg=slope, dem_roughness_m=roughness,
                      source="open_meteo", fallback_reason=None, sample_elevations_m=z)
    except (httpx.HTTPError, ValueError, KeyError, TypeError, AttributeError) as exc:
        result["fallback_reason"] = f"DEM unavailable or invalid ({type(exc).__name__})"
    return result


def score_custom_coordinates(lat: float, lon: float, offline: bool = False) -> dict[str, Any]:
    """Screen coordinates with measured terrain and conservative unmeasured priors."""
    site = Site(f"custom-{lat}-{lon}", "Custom Earth coordinate", "Unknown", lat, lon, 0,
                Terrain(0, 0, (0, 0, 0, 0, 0), 0, 0, 0, 0),
                Climate(20, 10, 1, 3, 50),
                "Coordinate screening with DEM terrain and a climate-based ice proxy; unmeasured geology and caves receive zero memberships.",
                "No local geology, ice, caves, field access or operational suitability is established.",
                "Under-Recognized", ("Reconnaissance terrain mapping",))
    with httpx.Client(follow_redirects=True) as client:
        climate = fetch_climatology(site, offline=offline, client=client)
        dem = fetch_dem(site, offline=offline, client=client)
    if dem["source"] == "open_meteo":
        site = replace(site, elevation_m=dem["elevation_m"], terrain=replace(
            site.terrain, slope_deg=dem["dem_slope_deg"],
            roughness=min(1.0, dem["dem_roughness_m"] / 120.0)))
    ice_proxy = (0.7 if climate.tmin_c <= -5 or (
        climate.tmin_c <= 0 and (site.elevation_m >= 3500 or abs(lat) >= 60))
        else 0.25 if climate.tmin_c <= 5 else 0.0)
    site = replace(site, terrain=replace(site.terrain, ice=ice_proxy))
    result = score_site(site, climate, dem, humidity_adjusted=True)
    result["prior_status"] = (
        "Custom probe: DEM terrain when available; climate-based ice proxy, not detected ice. "
        "Unmeasured geology, aqueous history, caves and shelter have zero memberships "
        "(unknown, not verified absence). Fallback telemetry is illustrative."
    )
    return result


def grid_search_region(min_lat: float, max_lat: float, min_lon: float, max_lon: float,
                       grid_size: int = 3, offline: bool = False) -> dict:
    """Rank an inclusive, uniformly spaced latitude/longitude grid of probes."""
    min_lat, max_lat = finite(min_lat, "min_lat"), finite(max_lat, "max_lat")
    min_lon, max_lon = finite(min_lon, "min_lon"), finite(max_lon, "max_lon")
    if not -90 <= min_lat < max_lat <= 90:
        raise ValueError("bounds must satisfy -90 <= min_lat < max_lat <= 90")
    if not -180 <= min_lon < max_lon <= 180:
        raise ValueError("bounds must satisfy -180 <= min_lon < max_lon <= 180")
    if isinstance(grid_size, bool) or not isinstance(grid_size, int) or not 2 <= grid_size <= 10:
        raise ValueError("grid_size must be an integer in [2, 10]")

    def axis(low: float, high: float) -> list[float]:
        return [low + (high - low) * i / (grid_size - 1)
                for i in range(grid_size - 1)] + [high]

    points = []
    for lat in axis(min_lat, max_lat):
        for lon in axis(min_lon, max_lon):
            result = score_custom_coordinates(lat, lon, offline=offline)
            target = REFERENCE_PROFILES[result["best_target"]]
            points.append({
                "lat": lat, "lon": lon, "best_target": result["best_target"],
                "best_target_name": target.name, "best_asi_score": result["overall_asi"],
                "body": target.body, "scores": result["scores"],
                "analogy_strengths": result["analogy_strengths"],
                "analogy_gaps": result["analogy_breakdowns"],
                "dem_metrics": result["dem_telemetry"],
                "nasa_power_climatology": result["climatology"],
                "rationale": result["rationale"],
            })
    points.sort(key=lambda point: point["best_asi_score"], reverse=True)
    features = [{
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [point["lon"], point["lat"]]},
        "properties": {key: point[key] for key in (
            "lat", "lon", "best_asi_score", "best_target", "best_target_name", "body", "rationale")},
    } for point in points]
    return {
        "bounds": {"min_lat": min_lat, "max_lat": max_lat, "min_lon": min_lon, "max_lon": max_lon},
        "grid_size": grid_size, "points": points,
        "geojson": {"type": "FeatureCollection", "features": features},
    }


def similarity(a: float, b: float, scale: float = 1.0) -> float:
    """Bounded linear similarity; scale is distance giving zero similarity."""
    if finite(scale, "scale") <= 0:
        raise ValueError("scale must be positive")
    return max(0.0, 1.0 - abs(finite(a, "a") - finite(b, "b")) / scale)


def score_target(site: Site, climate: Climate, target: Reference, *, humidity_adjusted: bool = False) -> dict[str, Any]:
    earth, other = site.terrain, target.terrain
    geo_union = sum(max(a, b) for a, b in zip(earth.geology, other.geology))
    geology = sum(min(a, b) for a, b in zip(earth.geology, other.geology)) / geo_union if geo_union else 1.0
    mean_c = (climate.tmax_c + climate.tmin_c) / 2
    range_c = climate.tmax_c - climate.tmin_c
    dryness = 1 / (1 + climate.precipitation_mm_day)
    if humidity_adjusted:
        dryness *= 1 - 0.5 * (climate.relative_humidity_pct / 100.0)
    raw = {
        "topography": .5 * similarity(earth.slope_deg, other.slope_deg, 30)
                      + .5 * similarity(earth.roughness, other.roughness),
        "geology": geology,
        "thermal": .6 * similarity(mean_c, target.temperature_mean_c, 100)
                   + .4 * similarity(range_c, target.temperature_range_c, 100),
        "hydrology_ice": .4 * similarity(dryness, target.dryness)
                         + .4 * similarity(earth.ice, other.ice)
                         + .2 * similarity(earth.aqueous_history, other.aqueous_history),
        "subsurface_ops": .7 * similarity(earth.lava_tubes, other.lava_tubes)
                          + .3 * similarity(earth.shelter, other.shelter),
    }
    dimensions = {k: round(100 * v, 2) for k, v in raw.items()}
    overall = round(100 * sum(raw[k] * w for k, w in zip(DIMENSIONS, target.weights)), 2)
    strengths = [f"{name}: {dimensions[name]:.2f}/100 scenario similarity"
                 for name in DIMENSIONS if dimensions[name] >= 70]
    breakdowns = {
        "gravity": f"Earth gravity (9.81 m/s2) cannot reproduce {target.body} gravity "
                   f"({1.62 if target.body == 'Moon' else 3.71} m/s2); traction and structural loading differ.",
        "atmosphere_vacuum": "Earth air does not reproduce lunar vacuum." if target.body == "Moon"
                             else "Earth air does not reproduce the thin, CO2-dominated Martian atmosphere.",
        "radiation": "Earth atmosphere and magnetic shielding do not reproduce extraterrestrial ionizing radiation; POWER parameters here do not measure UV or radiation dose.",
        "weathering": "Liquid water, oxygen and biology alter terrestrial materials differently from space weathering and Martian surface chemistry.",
        "thermal_comparability": "POWER 2 m air climatology is only a proxy against scenario surface/pit temperatures; it cannot validate cave stability, cryogenic exposure or lunar day/night cycles.",
        "site_specific": site.caveat,
    }
    return {"dimensions": dimensions, "overall_asi": overall,
            "weights": dict(zip(DIMENSIONS, target.weights)),
            "analogy_strengths": strengths, "analogy_breakdowns": breakdowns}


def analyze_analog_clusters_and_knn(sites: list[dict], k_clusters: int = 3,
                                   k_neighbors: int = 3, seed: int = 42) -> dict:
    """Cluster and compare sites using population z-scores and Euclidean distance.

    Use best-target dimensions, or average all targets when best_target is absent.
    Slope comes from dem_slope_deg or dem_telemetry.dem_slope_deg. Required
    features must be finite; IDs must be unique strings. Constant columns become
    zero. Centroids use feature_names order and standardized units.

    Counts are capped at available sites (neighbors exclude self). Lloyd's
    K-Means runs at most 300 iterations; empty clusters retain their centroid,
    so identical vectors may leave some labels unused. ID sorting and a local
    seeded RNG make results independent of input order and global RNG state.
    Neighbor distances are symmetric; truncated neighbor lists need not be.
    """
    for name, value, minimum in (("k_clusters", k_clusters, 1), ("k_neighbors", k_neighbors, 0)):
        if isinstance(value, bool) or not isinstance(value, int) or value < minimum:
            raise ValueError(f"{name} must be an integer >= {minimum}")
    feature_names = [*DIMENSIONS, "elevation_m", "dem_slope_deg"]
    result = {"feature_names": feature_names, "clusters": {}, "centroids": [], "knn": {}}
    ids = [site["id"] for site in sites]
    if any(not isinstance(site_id, str) for site_id in ids) or len(set(ids)) != len(ids):
        raise ValueError("Site IDs must be unique strings")
    if not sites:
        return result
    rows = []
    ordered = sorted(sites, key=lambda site: site["id"])
    ids = [site["id"] for site in ordered]
    for site in ordered:
        scores = site["scores"]
        targets = [scores[site["best_target"]]] if site.get("best_target") else list(scores.values())
        if not targets:
            raise ValueError("At least one target score is required")
        row = [math.fsum(finite(target["dimensions"][d], d) / len(targets)
                         for target in targets) for d in DIMENSIONS]
        slope = site["dem_slope_deg"] if "dem_slope_deg" in site else site["dem_telemetry"]["dem_slope_deg"]
        rows.append(row + [finite(site["elevation_m"], "elevation_m"), finite(slope, "dem_slope_deg")])
    n, width = len(rows), len(feature_names)
    vectors = [[0.0] * width for _ in rows]
    for j in range(width):
        # Scale first to avoid overflow for large finite features.
        scale = max(abs(row[j]) for row in rows) or 1.0
        column = [row[j] / scale for row in rows]
        mean = math.fsum(column) / n
        std = math.sqrt(math.fsum((value - mean) ** 2 for value in column) / n)
        for i, value in enumerate(column):
            vectors[i][j] = (value - mean) / std if std else 0.0

    count = min(k_clusters, n)
    centroids = [vectors[i][:] for i in random.Random(seed).sample(range(n), count)]
    labels = None
    for _ in range(300):
        assigned = [min(range(count), key=lambda c: math.dist(vector, centroids[c]))
                    for vector in vectors]
        if assigned == labels:
            break
        labels = assigned
        for c in range(count):
            members = [vectors[i] for i in range(n) if labels[i] == c]
            if members:
                centroids[c] = [math.fsum(row[j] for row in members) / len(members)
                                for j in range(width)]
    result["clusters"] = dict(zip(ids, labels))
    result["centroids"] = centroids
    for i, site_id in enumerate(ids):
        neighbors = sorted((math.dist(vectors[i], vectors[j]), ids[j])
                           for j in range(n) if j != i)
        result["knn"][site_id] = [{"id": other_id, "distance": distance}
                                  for distance, other_id in neighbors[:k_neighbors]]
    return result


def score_site(site: Site, climate: Climate, dem_telemetry: dict[str, Any] | None = None, *,
               humidity_adjusted: bool = False) -> dict[str, Any]:
    dem = dem_telemetry if dem_telemetry is not None else fetch_dem(site, offline=True)
    scores = {key: score_target(site, climate, target, humidity_adjusted=humidity_adjusted) for key, target in REFERENCE_PROFILES.items()}
    best = max(scores, key=lambda key: scores[key]["overall_asi"])
    return {"id": site.id, "name": site.name, "country": site.country,
            "latitude": site.latitude, "longitude": site.longitude, "elevation_m": dem["elevation_m"] if dem["source"] == "open_meteo" else site.elevation_m,
            "dem_telemetry": dem, "discovery_tier": site.discovery_tier,
            "mission_testbeds": list(site.mission_testbeds),
            "satellite_observatory": asdict(site)["satellite_observatory"],
            "terrain": asdict(site.terrain), "climatology": asdict(climate),
            "rationale": site.rationale, "prior_status": PRIOR_NOTE,
            "scores": scores, "best_target": best, "overall_asi": scores[best]["overall_asi"],
            "analogy_strengths": scores[best]["analogy_strengths"],
            "analogy_breakdowns": scores[best]["analogy_breakdowns"]}
