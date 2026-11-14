from dataclasses import replace
import json
import math

import httpx
import pytest

from asi_engine import (Climate, DIMENSIONS, EARTH_SITES, MONTHS, PARAMETERS,
                        REFERENCE_PROFILES, fetch_climatology, parse_power,
                        score_site, score_target, similarity)
from build_dataset import build_dataset, to_geojson, write_dataset


def payload():
    return {"header": {"fill_value": -999, "start": "20010101", "end": "20201231"},
            "properties": {"parameter": {p: {"ANN": v} for p, v in
                           zip(PARAMETERS, (20, 5, .5, 3, 60))}}}


def test_catalog():
    assert len(EARTH_SITES) == len({s.id for s in EARTH_SITES}) == 10
    assert set(REFERENCE_PROFILES) == {"shackleton-crater", "mare-tranquillitatis", "jezero-crater", "olympus-mons-flank"}
    assert sum(s.country == "Ecuador" for s in EARTH_SITES) == 3
    for target in REFERENCE_PROFILES.values():
        assert sum(target.weights) == pytest.approx(1)
        assert target.source_url.startswith("https://")


@pytest.mark.parametrize("site", EARTH_SITES, ids=lambda s: s.id)
def test_scores_are_complete_bounded_and_best_target_correct(site):
    result = score_site(site, site.fallback)
    assert set(result["scores"]) == set(REFERENCE_PROFILES)
    for score in result["scores"].values():
        assert set(score["dimensions"]) == set(DIMENSIONS)
        assert all(math.isfinite(v) and 0 <= v <= 100 for v in score["dimensions"].values())
        assert 0 <= score["overall_asi"] <= 100
        expected = sum(score["dimensions"][d] * score["weights"][d] for d in DIMENSIONS)
        assert score["overall_asi"] == pytest.approx(expected, abs=.011)
        assert {"gravity", "atmosphere_vacuum", "radiation", "weathering"} <= score["analogy_breakdowns"].keys()
    assert result["overall_asi"] == max(s["overall_asi"] for s in result["scores"].values())
    assert result["overall_asi"] == result["scores"][result["best_target"]]["overall_asi"]
    assert result == score_site(site, site.fallback)


def test_identity_scores_one_hundred():
    site = EARTH_SITES[0]
    c = site.fallback
    ref = replace(REFERENCE_PROFILES["mare-tranquillitatis"], terrain=site.terrain,
                  temperature_mean_c=(c.tmax_c + c.tmin_c) / 2,
                  temperature_range_c=c.tmax_c - c.tmin_c,
                  dryness=1 / (1 + c.precipitation_mm_day))
    assert set(score_target(site, c, ref)["dimensions"].values()) == {100}
    assert score_target(site, c, ref)["overall_asi"] == 100


def test_known_formula_and_geology_no_shared_absence_reward():
    site = replace(EARTH_SITES[0], terrain=replace(EARTH_SITES[0].terrain, geology=(1, 0, 0, 0, 0)))
    target = replace(REFERENCE_PROFILES["jezero-crater"], terrain=replace(site.terrain, geology=(0, 1, 0, 0, 0)))
    score = score_target(site, site.fallback, target)
    assert score["dimensions"]["geology"] == 0
    assert score["dimensions"]["topography"] == 100
    assert score["dimensions"]["subsurface_ops"] == 100


def test_climate_changes_only_climate_dimensions():
    site = EARTH_SITES[0]
    target = REFERENCE_PROFILES["jezero-crater"]
    base = score_target(site, site.fallback, target)["dimensions"]
    changed = score_target(site, replace(site.fallback, tmax_c=5, tmin_c=-30, precipitation_mm_day=0), target)["dimensions"]
    for d in ("topography", "geology", "subsurface_ops"):
        assert base[d] == changed[d]
    assert base["thermal"] < changed["thermal"]
    assert base["hydrology_ice"] < changed["hydrology_ice"]


def test_power_request_and_annual_parse():
    def handler(request):
        assert request.url.host == "power.larc.nasa.gov"
        assert request.url.params["parameters"] == ",".join(PARAMETERS)
        assert request.url.params["community"] == "RE"
        assert float(request.url.params["longitude"]) == EARTH_SITES[0].longitude
        assert float(request.url.params["latitude"]) == EARTH_SITES[0].latitude
        assert request.url.params["format"] == "JSON"
        return httpx.Response(200, json=payload())
    with httpx.Client(transport=httpx.MockTransport(handler)) as client:
        c = fetch_climatology(EARTH_SITES[0], client=client)
        assert not client.is_closed
    assert (c.tmax_c, c.tmin_c, c.precipitation_mm_day, c.wind_m_s, c.relative_humidity_pct) == (20, 5, .5, 3, 60)
    assert c.source == "nasa_power" and c.fallback_reason is None
    assert c.period == "20010101..20201231"


def test_monthly_weighting_and_precipitation_rate():
    data = payload()
    for series in data["properties"]["parameter"].values():
        v = series.pop("ANN")
        series.update(dict.fromkeys(MONTHS, v))
    data["properties"]["parameter"]["T2M_MAX"]["FEB"] = 30
    c = parse_power(data, "https://example.test")
    assert c.tmax_c == pytest.approx(20 + 10 * 28 / 365)
    assert c.precipitation_mm_day == .5
    assert "monthly day-weighted" in c.aggregation


@pytest.mark.parametrize("bad", [-999, float("nan"), float("inf"), None, "20", True])
def test_invalid_annual_values_fallback(bad):
    data = payload()
    data["properties"]["parameter"]["T2M_MAX"]["ANN"] = bad
    # NaN is deliberately injected at parser level (JSON cannot encode it strictly).
    with pytest.raises(ValueError):
        parse_power(data, "test")


@pytest.mark.parametrize("failure", ["timeout", "connect", "500", "429", "json", "missing", "fill", "inverted", "humidity", "negative"])
def test_network_and_bad_payload_fallback(failure):
    def handler(request):
        if failure == "timeout":
            raise httpx.ReadTimeout("test", request=request)
        if failure == "connect":
            raise httpx.ConnectError("test", request=request)
        if failure in ("500", "429"):
            return httpx.Response(int(failure))
        if failure == "json":
            return httpx.Response(200, text="not JSON")
        data = payload()
        params = data["properties"]["parameter"]
        if failure == "missing":
            del params["RH2M"]
        elif failure == "fill":
            params["T2M_MAX"]["ANN"] = -999
        elif failure == "inverted":
            params["T2M_MIN"]["ANN"] = 30
        elif failure == "humidity":
            params["RH2M"]["ANN"] = 101
        elif failure == "negative":
            params["PRECTOTCORR"]["ANN"] = -1
        return httpx.Response(200, json=data)
    with httpx.Client(transport=httpx.MockTransport(handler)) as client:
        first = fetch_climatology(EARTH_SITES[0], client=client)
        assert first == fetch_climatology(EARTH_SITES[0], client=client)
    assert first.source == "fallback" and first.fallback_reason
    assert first.tmax_c == EARTH_SITES[0].fallback.tmax_c


def test_offline_never_requests():
    def forbidden(request):
        pytest.fail("Offline mode made a request")
    with httpx.Client(transport=httpx.MockTransport(forbidden)) as client:
        assert fetch_climatology(EARTH_SITES[0], client=client, offline=True).source == "fallback"


@pytest.mark.parametrize("field,value", [("tmax_c", float("nan")), ("tmin_c", 40),
                                        ("precipitation_mm_day", -1), ("wind_m_s", -1),
                                        ("relative_humidity_pct", 101)])
def test_climate_validation(field, value):
    with pytest.raises(ValueError):
        replace(EARTH_SITES[0].fallback, **{field: value})


@pytest.mark.parametrize("a,b,scale,expected", [(0, 0, 1, 1), (0, 1, 1, 0), (1, 0, 1, 0), (0, 20, 1, 0), (10, 15, 10, .5)])
def test_similarity(a, b, scale, expected):
    assert similarity(a, b, scale) == expected


@pytest.mark.parametrize("bad", [0, -1, float("nan"), float("inf")])
def test_invalid_scales_and_timeout(bad):
    with pytest.raises(ValueError):
        similarity(0, 0, bad)
    with pytest.raises(ValueError):
        fetch_climatology(EARTH_SITES[0], timeout=bad, offline=True)


def test_prior_validation():
    with pytest.raises(ValueError):
        replace(EARTH_SITES[0].terrain, ice=1.1)
    with pytest.raises(ValueError):
        replace(EARTH_SITES[0], latitude=91)
    with pytest.raises(ValueError):
        replace(REFERENCE_PROFILES["jezero-crater"], weights=(1, 1, 1, 1, 1))


def test_dataset_roundtrip_geojson_and_reproducibility(tmp_path):
    data = build_dataset(offline=True)
    assert data["methodology"]["source_counts"] == {"nasa_power": 0, "fallback": 10}
    paths = write_dataset(data, tmp_path)
    serialized_data = json.loads(json.dumps(data))
    assert json.loads(paths[0].read_text()) == serialized_data
    geo = json.loads(paths[1].read_text())
    assert geo["type"] == "FeatureCollection"
    assert len(geo["features"]) == 10
    for feature, site in zip(geo["features"], serialized_data["sites"]):
        assert feature["geometry"]["coordinates"] == [site["longitude"], site["latitude"]]
        assert feature["properties"] == site
        assert feature["id"] == site["id"]
    before = [p.read_bytes() for p in paths]
    write_dataset(build_dataset(offline=True), tmp_path)
    assert [p.read_bytes() for p in paths] == before
    assert to_geojson(data)["references"] == data["references"]


def test_pipeline_mixed_sources():
    def handler(request):
        return httpx.Response(200, json=payload()) if float(request.url.params["latitude"]) < 0 else httpx.Response(503)
    with httpx.Client(transport=httpx.MockTransport(handler)) as client:
        data = build_dataset(client=client)
    assert data["methodology"]["source_counts"] == {"nasa_power": 5, "fallback": 5}


@pytest.mark.parametrize("parameter,value", [("PRECTOTCORR", -1), ("WS10M", -1),
                                            ("RH2M", 101), ("T2M_MAX", 80),
                                            ("T2M_MIN", -999), ("T2M_MIN", float("nan"))])
def test_invalid_monthly_values_not_hidden_by_averaging(parameter, value):
    data = payload()
    series = data["properties"]["parameter"][parameter]
    annual = series.pop("ANN")
    series.update(dict.fromkeys(MONTHS, annual))
    series["JAN"] = value
    with pytest.raises(ValueError):
        parse_power(data, "test")


def test_missing_month_rejected():
    data = payload()
    data["properties"]["parameter"]["WS10M"] = {"JAN": 3}
    with pytest.raises(KeyError):
        parse_power(data, "test")


def test_custom_fill_value_rejected():
    data = payload()
    data["header"]["fill_value"] = -99
    data["properties"]["parameter"]["T2M_MIN"]["ANN"] = -99
    with pytest.raises(ValueError):
        parse_power(data, "test")


def test_strict_json_rejects_nonfinite_before_writing(tmp_path):
    data = build_dataset(offline=True)
    data["sites"][0]["overall_asi"] = float("nan")
    with pytest.raises(ValueError):
        write_dataset(data, tmp_path)
    assert not (tmp_path / "analogs.json").exists()
    assert not (tmp_path / "analogs.geojson").exists()
