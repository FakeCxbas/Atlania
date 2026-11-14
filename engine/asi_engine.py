"""Exploratory ASI, not a validated similarity probability or site safety rating.

All terrain/geology/ice/operations numbers are explicit expert-style scenario
priors, NOT NASA measurements. POWER supplies only gridded Earth air climatology.
See README.md for equations, units, provenance, and known comparison limitations.
"""
from __future__ import annotations

import calendar
import math
from dataclasses import asdict, dataclass
from typing import Any, Mapping

import httpx

POWER_URL = "https://power.larc.nasa.gov/api/temporal/climatology/point"
PARAMETERS = ("T2M_MAX", "T2M_MIN", "PRECTOTCORR", "WS10M", "RH2M")
MONTHS = tuple(calendar.month_abbr[i].upper() for i in range(1, 13))
DAYS = (31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)
DIMENSIONS = ("topography", "geology", "thermal", "hydrology_ice", "subsurface_ops")
GEOLOGY = ("basalt", "regolith", "sedimentary", "evaporite", "impact")
UNITS = dict(zip(PARAMETERS, ("degC", "degC", "mm/day", "m/s", "%")))
PRIOR_NOTE = "Illustrative scenario priors; not measured or calibrated site properties."


def finite(value: Any, name: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError(f"{name} must be a finite number")
    return float(value)


@dataclass(frozen=True)
class Terrain:
    slope_deg: float
    roughness: float  # dimensionless scenario scale 0..1, not DEM-derived
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

    def __post_init__(self) -> None:
        for name in ("tmax_c", "tmin_c", "precipitation_mm_day", "wind_m_s", "relative_humidity_pct"):
            finite(getattr(self, name), name)
        if not -100 <= self.tmin_c <= self.tmax_c <= 70:
            raise ValueError("Earth air temperature outside supported range or min > max")
        if self.precipitation_mm_day < 0 or self.wind_m_s < 0:
            raise ValueError("Precipitation and wind must be nonnegative")
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
                  "https://science.nasa.gov/resource/shackleton-craters-illuminated-rim-shadowed-interior/"),
        Reference("mare-tranquillitatis", "Mare Tranquillitatis / Lunar Lava Tubes", "Moon",
                  Terrain(5, .55, (1, .8, 0, 0, .1), 0, 0, 1, 1),
                  17, 2, 1, (.15, .30, .15, .10, .30),
                  "Shaded pit / hypothetical connected cave scenario; 17 C is modeled pit shade, not lunar surface climate or a proven habitable cave.",
                  "https://www.nasa.gov/solar-system/nasas-lro-finds-lunar-pits-harbor-comfortable-temperatures/"),
        Reference("jezero-crater", "Jezero Crater / Mars Delta and Basalt", "Mars",
                  Terrain(6, .6, (.8, .8, 1, .3, .5), .1, 1, 0, .1),
                  -60, 70, 1, (.20, .35, .15, .25, .05),
                  "Present dry surface thermal scenario combined with ancient aqueous geology; not a reconstruction of ancient climate.",
                  "https://www.jpl.nasa.gov/news/nasas-perseverance-rover-deciphers-ancient-history-of-martian-lake/"),
        Reference("olympus-mons-flank", "Olympus Mons Flank / Mars Volcanic Lava Tubes", "Mars",
                  Terrain(8, .8, (1, .7, .05, 0, .1), .1, .05, 1, .9),
                  -65, 80, 1, (.25, .30, .15, .10, .20),
                  "Exposed volcanic flank thermal scenario with tube exploration relevance; no measured subsurface temperature assumed.",
                  "https://science.nasa.gov/photojournal/the-flows-of-olympus/"),
    )
}

# Coordinates/elevations are representative map points, not surveyed sampling sites.
# Galapagos is one regional entry, anchored on Santa Cruz; Isabela is not separately sampled.
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
                if parameter in ("PRECTOTCORR", "WS10M") and v < 0:
                    raise ValueError(f"Negative POWER value: {parameter}")
                if parameter == "RH2M" and not 0 <= v <= 100:
                    raise ValueError("Invalid monthly humidity")
                if parameter.startswith("T2M") and not -100 <= v <= 70:
                    raise ValueError("Invalid monthly temperature")
            value = sum(v * days for v, days in zip(monthly, DAYS)) / 365
            modes.append("monthly day-weighted (365 days)")
        values.append(value)
    header = payload.get("header", {})
    period = f"{header['start']}..{header['end']}" if "start" in header and "end" in header else None
    return Climate(*values, source="nasa_power", source_url=source_url, period=period,
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
            if client is None:
                with httpx.Client(timeout=timeout, follow_redirects=True) as owned:
                    response = owned.get(POWER_URL, params=params, timeout=timeout)
            else:
                response = client.get(POWER_URL, params=params, timeout=timeout)
            response.raise_for_status()
            return parse_power(response.json(), str(response.url))
        except (httpx.HTTPError, ValueError, KeyError, TypeError, AttributeError) as exc:
            # Stable diagnostic without leaking proxy URLs, credentials, or raw payloads.
            reason = f"NASA POWER unavailable or invalid ({type(exc).__name__})"
    data = asdict(site.fallback)
    data.update(source="fallback", fallback_reason=reason, source_url=url)
    return Climate(**data)


def similarity(a: float, b: float, scale: float = 1.0) -> float:
    """Bounded linear similarity; scale is distance giving zero similarity."""
    if finite(scale, "scale") <= 0:
        raise ValueError("scale must be positive")
    return max(0.0, 1.0 - abs(finite(a, "a") - finite(b, "b")) / scale)


def score_target(site: Site, climate: Climate, target: Reference) -> dict[str, Any]:
    earth, other = site.terrain, target.terrain
    geo_union = sum(max(a, b) for a, b in zip(earth.geology, other.geology))
    geology = sum(min(a, b) for a, b in zip(earth.geology, other.geology)) / geo_union if geo_union else 1.0
    mean_c = (climate.tmax_c + climate.tmin_c) / 2
    range_c = climate.tmax_c - climate.tmin_c
    dryness = 1 / (1 + climate.precipitation_mm_day)
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


def score_site(site: Site, climate: Climate) -> dict[str, Any]:
    scores = {key: score_target(site, climate, target) for key, target in REFERENCE_PROFILES.items()}
    best = max(scores, key=lambda key: scores[key]["overall_asi"])
    return {"id": site.id, "name": site.name, "country": site.country,
            "latitude": site.latitude, "longitude": site.longitude, "elevation_m": site.elevation_m,
            "terrain": asdict(site.terrain), "climatology": asdict(climate),
            "rationale": site.rationale, "prior_status": PRIOR_NOTE,
            "scores": scores, "best_target": best, "overall_asi": scores[best]["overall_asi"],
            "analogy_strengths": scores[best]["analogy_strengths"],
            "analogy_breakdowns": scores[best]["analogy_breakdowns"]}
