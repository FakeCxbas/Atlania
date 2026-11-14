from dataclasses import replace
import json
import math

import httpx
import pytest

from asi_engine import (Climate, DIMENSIONS, EARTH_SITES, MONTHS, PARAMETERS,
                        REFERENCE_PROFILES, fetch_climatology, parse_power,
                        score_site, score_target, similarity, fetch_dem, score_custom_coordinates,
                        grid_search_region, analyze_analog_clusters_and_knn)
from build_dataset import build_dataset, to_geojson, write_dataset


@pytest.fixture(autouse=True)
def no_backoff_wait(monkeypatch):
    monkeypatch.setattr("asi_engine.time.sleep", lambda _: None)


def payload():
    return {"header": {"fill_value": -999, "start": "20010101", "end": "20201231"},
            "properties": {"parameter": {p: {"ANN": v} for p, v in
                           zip(PARAMETERS, (20, 5, .5, 3, 60, 5.5, 85))}}}


def test_catalog():
    assert len(EARTH_SITES) == len({s.id for s in EARTH_SITES}) == 30
    assert set(REFERENCE_PROFILES) == {"shackleton-crater", "mare-tranquillitatis", "jezero-crater", "olympus-mons-flank", "mouton-mons", "valles-marineris"}
    assert sum(s.country == "Ecuador" for s in EARTH_SITES) == 8
    for target in REFERENCE_PROFILES.values():
        assert sum(target.weights) == pytest.approx(1)
        assert target.source_url.startswith("https://")


def ml_site(site_id, value):
    return {"id": site_id, "best_target": "target", "scores": {
        "target": {"dimensions": {d: value for d in DIMENSIONS}}},
        "elevation_m": 1000 + value * 100, "dem_telemetry": {"dem_slope_deg": 5}}


def test_ml_population_z_scores_and_constant_feature():
    sites = [ml_site(str(i), v) for i, v in enumerate((10, 20, 30))]
    result = analyze_analog_clusters_and_knn(sites, k_clusters=3)
    assert result["feature_names"] == [*DIMENSIONS, "elevation_m", "dem_slope_deg"]
    for i, expected in enumerate((-math.sqrt(1.5), 0, math.sqrt(1.5))):
        centroid = result["centroids"][result["clusters"][str(i)]]
        assert centroid == pytest.approx([expected] * 6 + [0])
    for j in range(6):
        column = [centroid[j] for centroid in result["centroids"]]
        assert sum(column) / 3 == pytest.approx(0, abs=1e-14)
        assert sum(v * v for v in column) / 3 == pytest.approx(1)
    assert result["knn"]["0"][0] == {"id": "1", "distance": pytest.approx(3)}


def test_ml_deterministic_clusters_and_centroid_means():
    import random
    sites = [ml_site(str(i), v) for i, v in enumerate((0, 1, 99, 100))]
    state = random.getstate()
    result = analyze_analog_clusters_and_knn(sites, k_clusters=2, seed=7)
    assert random.getstate() == state
    assert result == analyze_analog_clusters_and_knn(list(reversed(sites)), k_clusters=2, seed=7)
    labels = result["clusters"]
    assert labels["0"] == labels["1"] != labels["2"] == labels["3"]
    std = math.sqrt(sum((v - 50) ** 2 for v in (0, 1, 99, 100)) / 4)
    assert result["centroids"][labels["0"]] == pytest.approx([-49.5 / std] * 6 + [0])


def test_ml_knn_distances_symmetric_sorted_and_self_excluded():
    sites = [ml_site(str(i), v) for i, v in enumerate((0, 1, 10, 100))]
    full = analyze_analog_clusters_and_knn(sites, k_neighbors=20)["knn"]
    limited = analyze_analog_clusters_and_knn(sites, k_neighbors=1)["knn"]
    for site_id, neighbors in full.items():
        assert len(neighbors) == 3
        assert site_id not in [neighbor["id"] for neighbor in neighbors]
        assert neighbors == sorted(neighbors, key=lambda neighbor: (neighbor["distance"], neighbor["id"]))
        assert limited[site_id] == neighbors[:1]
        for neighbor in neighbors:
            reverse = next(item for item in full[neighbor["id"]] if item["id"] == site_id)
            assert reverse["distance"] == neighbor["distance"]


def test_ml_empty_singleton_duplicates_and_average_fallback():
    assert analyze_analog_clusters_and_knn([])["centroids"] == []
    site = ml_site("a", 20)
    singleton = analyze_analog_clusters_and_knn([site])
    assert singleton["clusters"] == {"a": 0}
    assert singleton["centroids"] == [[0.0] * 7]
    assert singleton["knn"] == {"a": []}
    sites = [ml_site("a", 20), ml_site("b", 20)]
    result = analyze_analog_clusters_and_knn(sites)
    assert result["knn"]["a"] == [{"id": "b", "distance": 0.0}]
    assert analyze_analog_clusters_and_knn(sites, k_neighbors=0)["knn"] == {"a": [], "b": []}
    sites = [ml_site("a", 20), ml_site("b", 40)]
    expected = analyze_analog_clusters_and_knn(sites)
    del sites[0]["best_target"]
    sites[0]["scores"] = {"x": ml_site("x", 10)["scores"]["target"],
                          "y": ml_site("y", 30)["scores"]["target"]}
    sites[0]["dem_slope_deg"] = 5
    assert analyze_analog_clusters_and_knn(sites) == expected


@pytest.mark.parametrize("kwargs", [{"k_clusters": 0}, {"k_clusters": 1.5},
                                   {"k_neighbors": -1}, {"k_neighbors": True}])
def test_ml_rejects_invalid_counts(kwargs):
    with pytest.raises(ValueError):
        analyze_analog_clusters_and_knn([], **kwargs)


def test_ml_rejects_duplicate_ids_and_nonfinite_features():
    with pytest.raises(ValueError, match="unique strings"):
        analyze_analog_clusters_and_knn([ml_site("a", 1), ml_site("a", 2)])
    with pytest.raises(ValueError, match="finite"):
        analyze_analog_clusters_and_knn([ml_site("a", float("nan"))])


def test_ml_accepts_engine_catalog_results():
    result = analyze_analog_clusters_and_knn([score_site(site, site.fallback) for site in EARTH_SITES])
    assert set(result["clusters"]) == {site.id for site in EARTH_SITES}
    assert len(result["centroids"]) == 3
    assert all(len(neighbors) == 3 for neighbors in result["knn"].values())


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
    assert data["methodology"]["source_counts"] == {"nasa_power": 0, "fallback": 30}
    paths = write_dataset(data, tmp_path)
    serialized_data = json.loads(json.dumps(data))
    assert json.loads(paths[0].read_text()) == serialized_data
    geo = json.loads(paths[1].read_text())
    assert geo["type"] == "FeatureCollection"
    assert len(geo["features"]) == 30
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
        if request.url.host == "api.open-meteo.com":
            return httpx.Response(200, json={"elevation": [100] * 5})
        return httpx.Response(200, json=payload()) if float(request.url.params["latitude"]) < 0 else httpx.Response(503)
    with httpx.Client(transport=httpx.MockTransport(handler)) as client:
        data = build_dataset(client=client)
    assert data["methodology"]["source_counts"] == {"nasa_power": 17, "fallback": 13}


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


def test_retry_then_success(monkeypatch):
    calls, delays = [], []
    monkeypatch.setattr("asi_engine.time.sleep", delays.append)
    def handler(request):
        calls.append(request)
        assert request.extensions["timeout"]["read"] == 10
        if len(calls) < 3:
            raise httpx.ReadTimeout("transient", request=request)
        return httpx.Response(200, json=payload())
    with httpx.Client(transport=httpx.MockTransport(handler)) as client:
        result = fetch_climatology(EARTH_SITES[2], client=client)
    assert result.source == "nasa_power"
    assert len(calls) == 3 and delays == [1, 2]
    assert result.solar_irradiance_kwh_m2_day == 5.5
    assert result.surface_pressure_kpa == 85
    assert {"ALLSKY_SFC_SW_DWN", "PS"} <= set(PARAMETERS)


@pytest.mark.parametrize("status,attempts", [(503, 3), (429, 3), (400, 1)])
def test_retry_limit(status, attempts):
    calls = []
    def handler(request):
        calls.append(request)
        return httpx.Response(status)
    with httpx.Client(transport=httpx.MockTransport(handler)) as client:
        assert fetch_climatology(EARTH_SITES[0], client=client).source == "fallback"
    assert len(calls) == attempts


@pytest.mark.parametrize("latitude", [0, 60])
def test_dem_stencil_planar_slope(latitude):
    site = replace(EARTH_SITES[0], latitude=latitude, longitude=180)
    dy = 6371008.8 * math.radians(.01)
    dx = dy * math.cos(math.radians(latitude))
    elevations = [1000, 1000 + .1*dy, 1000 - .1*dy, 1000 + .2*dx, 1000 - .2*dx]
    def handler(request):
        assert request.url.host == "api.open-meteo.com"
        assert list(map(float, request.url.params["latitude"].split(","))) == [latitude, latitude+.01, latitude-.01, latitude, latitude]
        assert float(request.url.params["longitude"].split(",")[3]) == pytest.approx(-179.99)
        return httpx.Response(200, json={"elevation": elevations})
    with httpx.Client(transport=httpx.MockTransport(handler)) as client:
        dem = fetch_dem(site, client=client)
    assert dem["source"] == "open_meteo"
    assert dem["dem_slope_deg"] == pytest.approx(math.degrees(math.atan(math.hypot(.1, .2))))
    assert dem["dem_roughness_m"] == pytest.approx(math.sqrt(sum((z-1000)**2 for z in elevations)/5))
    result = score_site(site, site.fallback, dem)
    assert result["elevation_m"] == 1000
    assert result["scores"] == score_site(site, site.fallback)["scores"]


@pytest.mark.parametrize("elevations", [[1]*5, [], [1, None, 2, 3, 4], [-99999]*5])
def test_dem_flat_or_invalid(elevations):
    with httpx.Client(transport=httpx.MockTransport(lambda r: httpx.Response(200, json={"elevation": elevations}))) as client:
        dem = fetch_dem(EARTH_SITES[0], client=client)
    assert dem["source"] == ("open_meteo" if elevations == [1]*5 else "fallback")
    assert dem["dem_roughness_m"] == 0
    if dem["source"] == "open_meteo":
        assert dem["dem_slope_deg"] == 0


def test_custom_offline_and_catalog_metadata(monkeypatch):
    def forbidden(*args, **kwargs):
        pytest.fail("offline request")
    monkeypatch.setattr(httpx.Client, "get", forbidden)
    result = score_custom_coordinates(-.5, -78, offline=True)
    assert result == score_custom_coordinates(-.5, -78, offline=True)
    assert result["latitude"] == -.5 and result["longitude"] == -78
    assert result["dem_telemetry"]["source"] == result["climatology"]["source"] == "fallback"
    assert set(result["scores"]) == set(REFERENCE_PROFILES)
    for site in EARTH_SITES:
        assert site.discovery_tier in {"Benchmark", "Regional Highlight", "Under-Recognized"}
        assert len(site.mission_testbeds) >= 2
    assert score_custom_coordinates(90, 180, offline=True)["latitude"] == 90


@pytest.mark.parametrize("lat,lon", [(91, 0), (0, 181), (float("nan"), 0), (True, 0)])
def test_custom_invalid_coordinates(lat, lon):
    with pytest.raises(ValueError):
        score_custom_coordinates(lat, lon, offline=True)


@pytest.mark.parametrize("field,value", [
    ("min_lat", -91), ("max_lat", 91), ("min_lat", 1), ("min_lat", 2),
    ("min_lon", -181), ("max_lon", 181), ("min_lon", 1), ("min_lon", 2),
    *[(field, value) for field in ("min_lat", "max_lat", "min_lon", "max_lon")
      for value in (float("nan"), float("inf"), -float("inf"), True, None, "0")],
    *[("grid_size", value) for value in (1, 11, 0, -1, 3.0, 2.5, True, False, None, "3")],
])
def test_grid_search_validation_before_scoring(monkeypatch, field, value):
    def forbidden(*args, **kwargs):
        pytest.fail("Invalid grid must not score any coordinates")
    monkeypatch.setattr("asi_engine.score_custom_coordinates", forbidden)
    kwargs = dict(min_lat=-1, max_lat=1, min_lon=-1, max_lon=1, grid_size=3)
    kwargs[field] = value
    with pytest.raises(ValueError):
        grid_search_region(**kwargs)


@pytest.mark.parametrize("grid_size", [2, 3, 10])
def test_grid_search_offline_shape_and_metadata(monkeypatch, grid_size):
    def forbidden(*args, **kwargs):
        pytest.fail("Offline grid made a network request")
    monkeypatch.setattr(httpx.Client, "get", forbidden)
    result = grid_search_region(-90, 90, -180, 180, grid_size, offline=True)
    assert result["bounds"] == dict(min_lat=-90, max_lat=90, min_lon=-180, max_lon=180)
    assert result["grid_size"] == grid_size
    assert len(result["points"]) == grid_size ** 2
    lats = [-90 + 180 * i / (grid_size - 1) for i in range(grid_size)]
    lons = [-180 + 360 * i / (grid_size - 1) for i in range(grid_size)]
    assert {(p["lat"], p["lon"]) for p in result["points"]} == {
        (lat, lon) for lat in lats for lon in lons}
    for point in result["points"]:
        expected = score_custom_coordinates(point["lat"], point["lon"], offline=True)
        target = REFERENCE_PROFILES[expected["best_target"]]
        assert point["best_target"] == target.id
        assert point["best_target_name"] == target.name
        assert point["body"] == target.body
        assert point["best_asi_score"] == expected["overall_asi"]
        for actual, original in (("scores", "scores"), ("analogy_strengths", "analogy_strengths"),
                                 ("analogy_gaps", "analogy_breakdowns"),
                                 ("dem_metrics", "dem_telemetry"),
                                 ("nasa_power_climatology", "climatology")):
            assert point[actual] == expected[original]
        assert point["dem_metrics"]["source"] == point["nasa_power_climatology"]["source"] == "fallback"


@pytest.mark.parametrize("offline", [False, True])
def test_grid_search_ranking_and_geojson(monkeypatch, offline):
    template = score_custom_coordinates(0, 0, offline=True)
    calls = []
    def score(lat, lon, offline=False):
        calls.append((lat, lon, offline))
        return {**template, "overall_asi": 50 + lat * 10 - lon,
                "rationale": f"Probe at {lat}, {lon}"}
    monkeypatch.setattr("asi_engine.score_custom_coordinates", score)
    result = grid_search_region(-1, 1, -2, 2, offline=offline)
    assert result["grid_size"] == 3
    assert calls == [(lat, lon, offline) for lat in (-1, 0, 1) for lon in (-2, 0, 2)]
    assert [p["best_asi_score"] for p in result["points"]] == [62, 60, 58, 52, 50, 48, 42, 40, 38]
    geojson = result["geojson"]
    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) == 9
    for feature, point in zip(geojson["features"], result["points"]):
        assert feature["type"] == "Feature"
        assert feature["geometry"] == {"type": "Point", "coordinates": [point["lon"], point["lat"]]}
        assert feature["properties"] == {key: point[key] for key in (
            "lat", "lon", "best_asi_score", "best_target", "best_target_name", "body", "rationale")}
        assert feature["properties"]["rationale"] == f"Probe at {point['lat']}, {point['lon']}"
    assert json.loads(json.dumps(result, allow_nan=False)) == result


def test_custom_live(monkeypatch):
    def get(self, url, **kwargs):
        data = {"elevation": [123]*5} if "open-meteo" in url else payload()
        return httpx.Response(200, json=data, request=httpx.Request("GET", url))
    monkeypatch.setattr(httpx.Client, "get", get)
    result = score_custom_coordinates(1, 2)
    assert result["elevation_m"] == 123
    assert result["climatology"]["source"] == "nasa_power"


@pytest.mark.parametrize("parameter,value", [("PS", 0), ("PS", 121), ("ALLSKY_SFC_SW_DWN", -1)])
@pytest.mark.parametrize("monthly", [False, True])
def test_new_power_validation(parameter, value, monthly):
    data = payload()
    data["properties"]["parameter"][parameter] = dict.fromkeys(MONTHS, value) if monthly else {"ANN": value}
    with pytest.raises(ValueError):
        parse_power(data, "test")


@pytest.mark.parametrize("key", REFERENCE_PROFILES)
def test_reference_metadata_export(key):
    reference = REFERENCE_PROFILES[key]
    exported = build_dataset(offline=True)["references"][key]
    for field in ("instrument", "pds_dataset", "mineralogy_summary", "metadata_note"):
        assert exported[field] == getattr(reference, field)
        assert exported[field]
    assert "LRO" in reference.instrument if reference.body == "Moon" else "MRO" in reference.instrument
    assert reference.gravity_ms2 == (1.62 if reference.body == "Moon" else 3.71)
    assert reference.pressure_kpa == (0.0 if reference.body == "Moon" else
                                      0.85 if key == "valles-marineris" else 0.65)
    assert exported["temp_min_c"] == reference.temperature_mean_c - reference.temperature_range_c / 2
    assert exported["temp_max_c"] == reference.temperature_mean_c + reference.temperature_range_c / 2
    assert {"id", "name", "body", "temperature_mean_c", "temperature_range_c",
            "dryness", "context", "source_url"} <= exported.keys()


def mock_probe(monkeypatch, *, tmin=24, tmax=31, rain=8, humidity=90, elevations=None):
    data = payload()
    for key, value in {"T2M_MIN": tmin, "T2M_MAX": tmax,
                       "PRECTOTCORR": rain, "RH2M": humidity}.items():
        data["properties"]["parameter"][key] = {"ANN": value}
    def get(self, url, **kwargs):
        body = {"elevation": elevations or [0]*5} if "open-meteo" in url else data
        return httpx.Response(200, json=body, request=httpx.Request("GET", url))
    monkeypatch.setattr(httpx.Client, "get", get)


def test_humid_tropical_sea_level_probe_is_conservative(monkeypatch):
    mock_probe(monkeypatch)
    result = score_custom_coordinates(-2.2, -80.9)
    assert result["overall_asi"] < 40
    assert all(score["overall_asi"] < 40 for score in result["scores"].values())
    for field in ("lava_tubes", "shelter", "aqueous_history", "ice", "roughness"):
        assert result["terrain"][field] == 0
    assert result["terrain"]["geology"] == (0, 0, 0, 0, 0)
    assert all(score["dimensions"]["geology"] == 0 for score in result["scores"].values())
    assert result["scores"]["mare-tranquillitatis"]["dimensions"]["subsurface_ops"] == 0


@pytest.mark.parametrize("roughness", [30, 180])
def test_custom_uses_live_dem_for_scoring(monkeypatch, roughness):
    mock_probe(monkeypatch)
    dem = fetch_dem(EARTH_SITES[0], offline=True)
    dem.update(source="open_meteo", elevation_m=4000, dem_slope_deg=18, dem_roughness_m=roughness)
    monkeypatch.setattr("asi_engine.fetch_dem", lambda *a, **kw: dem)
    result = score_custom_coordinates(0, 0)
    assert result["terrain"]["slope_deg"] == 18
    assert result["terrain"]["roughness"] == min(1, roughness / 120)
    target = REFERENCE_PROFILES["shackleton-crater"]
    expected = 50 * (similarity(18, target.terrain.slope_deg, 30)
                     + similarity(min(1, roughness / 120), target.terrain.roughness))
    assert result["scores"][target.id]["dimensions"]["topography"] == round(expected, 2)


@pytest.mark.parametrize("tmin,elevation,lat,expected", [
    (-5, 0, 0, .7), (-4.9, 0, 0, .25), (0, 3500, 0, .7),
    (0, 3499, 0, .25), (0, 0, 60, .7), (0, 0, -60, .7),
    (0, 0, 59.9, .25), (.1, 4000, 70, .25), (5, 0, 0, .25), (5.1, 0, 0, 0),
])
def test_custom_cryogenic_thresholds(monkeypatch, tmin, elevation, lat, expected):
    mock_probe(monkeypatch, tmin=tmin, elevations=[elevation]*5)
    assert score_custom_coordinates(lat, 0)["terrain"]["ice"] == expected


def test_custom_humidity_penalty_and_cold_arid_ranking(monkeypatch):
    mock_probe(monkeypatch, rain=0, humidity=0)
    dry = score_custom_coordinates(0, 0)
    mock_probe(monkeypatch, rain=0, humidity=100)
    humid = score_custom_coordinates(0, 0)
    for key in REFERENCE_PROFILES:
        # Half-unit dryness reduction contributes 20 points to hydrology only.
        assert dry["scores"][key]["dimensions"]["hydrology_ice"] - humid["scores"][key]["dimensions"]["hydrology_ice"] == pytest.approx(20)
    mock_probe(monkeypatch)
    tropical = score_custom_coordinates(0, 0)
    mock_probe(monkeypatch, tmin=-20, tmax=0, rain=.01, humidity=10,
               elevations=[4000, 4100, 3900, 4100, 3900])
    cold = score_custom_coordinates(65, 0)
    assert cold["overall_asi"] > tropical["overall_asi"]
    assert 45 <= cold["overall_asi"] <= 65


def test_custom_failed_dem_keeps_conservative_terrain(monkeypatch):
    mock_probe(monkeypatch, tmin=0)
    fallback = fetch_dem(EARTH_SITES[0], offline=True)
    monkeypatch.setattr("asi_engine.fetch_dem", lambda *a, **kw: fallback)
    result = score_custom_coordinates(0, 0)
    assert result["terrain"]["slope_deg"] == result["terrain"]["roughness"] == 0
    assert result["elevation_m"] == 0
    assert result["terrain"]["ice"] == .25
