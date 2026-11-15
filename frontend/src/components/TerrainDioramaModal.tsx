"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Compass,
  Layers,
  Loader2,
  Maximize2,
  Mountain,
  RotateCcw,
  Sun,
  X,
} from "lucide-react";
import {
  buildHypsometricTextureData,
  buildSlopeColorTextureData,
  buildTerrainDataset,
  type TerrainDataset,
} from "@/lib/terrainMesh";

export type DioramaRenderMode = "satellite" | "slope" | "hypsometric";

export interface TerrainDioramaTarget {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
  asiScore?: number;
}

interface TerrainDioramaModalProps {
  target: TerrainDioramaTarget | null;
  onClose: () => void;
}

const SCENE_WIDTH = 120;

const SOLAR_PRESETS = [
  { id: "lunar-south", label: "Polo Sur Lunar (1.5°)", elevation: 1.5, azimuth: 135 },
  { id: "mars-low", label: "Marte Sol Bajo (18°)", elevation: 18, azimuth: 220 },
  { id: "noon", label: "Iluminación Alta (52°)", elevation: 52, azimuth: 160 },
] as const;

export function TerrainDioramaModal({ target, onClose }: TerrainDioramaModalProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [radiusMeters, setRadiusMeters] = useState<number>(2800);
  const [retryNonce, setRetryNonce] = useState<number>(0);
  const [loadedState, setLoadedState] = useState<{
    key: string;
    dataset: TerrainDataset | null;
    error: string | null;
  }>({ key: "", dataset: null, error: null });

  const [renderMode, setRenderMode] = useState<DioramaRenderMode>("satellite");
  const [exaggeration, setExaggeration] = useState<number>(1.5);
  const [solarElevation, setSolarElevation] = useState<number>(28);
  const [solarAzimuth, setSolarAzimuth] = useState<number>(145);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [wireframe, setWireframe] = useState<boolean>(false);

  const requestKey = target
    ? `${target.latitude}:${target.longitude}:${radiusMeters}:${retryNonce}`
    : "";
  const loading = Boolean(target) && loadedState.key !== requestKey;
  const dataset = loadedState.key === requestKey ? loadedState.dataset : null;
  const error = loadedState.key === requestKey ? loadedState.error : null;

  const sceneRefs = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
    sunLight: THREE.DirectionalLight;
    dataset: TerrainDataset;
    meterToScene: number;
    textures: Record<DioramaRenderMode, THREE.Texture>;
  } | null>(null);

  // Close on Escape
  useEffect(() => {
    if (!target) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [target, onClose]);

  // Load DEM + HD satellite dataset when target or radius changes
  useEffect(() => {
    if (!target) return;

    let cancelled = false;
    const activeKey = requestKey;

    buildTerrainDataset({
      lat: target.latitude,
      lon: target.longitude,
      radiusMeters,
      gridSize: 192,
      demZoom: 13,
      satZoom: 16,
    })
      .then((result) => {
        if (!cancelled) {
          setLoadedState({ key: activeKey, dataset: result, error: null });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "No se pudo reconstruir el modelo topográfico 3D.";
          setLoadedState({ key: activeKey, dataset: null, error: message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [target, radiusMeters, requestKey]);

  // Build Three.js scene whenever dataset is ready
  useEffect(() => {
    const container = mountRef.current;
    if (!container || !dataset) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#060913");
    scene.fog = new THREE.FogExp2("#060913", 0.0022);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 900);
    camera.position.set(82, 58, 92);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.minDistance = 28;
    controls.maxDistance = 260;
    controls.target.set(0, 6, 0);

    const gridSize = Math.round(Math.sqrt(dataset.elevations.length));
    const meterToScene = SCENE_WIDTH / dataset.widthMeters;
    const sceneDepth = dataset.heightMeters * meterToScene;

    const geometry = new THREE.PlaneGeometry(
      SCENE_WIDTH,
      sceneDepth,
      gridSize - 1,
      gridSize - 1
    );
    geometry.rotateX(-Math.PI / 2);

    // Prepare 3 textures
    const satTex = new THREE.CanvasTexture(dataset.satelliteCanvas);
    satTex.colorSpace = THREE.SRGBColorSpace;
    satTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    satTex.needsUpdate = true;

    const slopeRgba = buildSlopeColorTextureData(dataset.slopesDeg, gridSize);
    const slopeTex = new THREE.DataTexture(
      slopeRgba,
      gridSize,
      gridSize,
      THREE.RGBAFormat
    );
    slopeTex.colorSpace = THREE.SRGBColorSpace;
    slopeTex.magFilter = THREE.LinearFilter;
    slopeTex.minFilter = THREE.LinearMipmapLinearFilter;
    slopeTex.generateMipmaps = true;
    slopeTex.flipY = true;
    slopeTex.needsUpdate = true;

    const hypsoRgba = buildHypsometricTextureData(
      dataset.elevations,
      dataset.metrics.minElevationM,
      dataset.metrics.maxElevationM,
      gridSize
    );
    const hypsoTex = new THREE.DataTexture(
      hypsoRgba,
      gridSize,
      gridSize,
      THREE.RGBAFormat
    );
    hypsoTex.colorSpace = THREE.SRGBColorSpace;
    hypsoTex.magFilter = THREE.LinearFilter;
    hypsoTex.minFilter = THREE.LinearMipmapLinearFilter;
    hypsoTex.generateMipmaps = true;
    hypsoTex.flipY = true;
    hypsoTex.needsUpdate = true;

    const textures: Record<DioramaRenderMode, THREE.Texture> = {
      satellite: satTex,
      slope: slopeTex,
      hypsometric: hypsoTex,
    };

    const material = new THREE.MeshStandardMaterial({
      map: textures[renderMode],
      roughness: 0.88,
      metalness: 0.04,
      wireframe,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Subtle spatial reference grid beneath the diorama
    const gridHelper = new THREE.GridHelper(160, 16, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    // Center analog beacon pin
    const centerIdx =
      Math.floor(gridSize / 2) * gridSize + Math.floor(gridSize / 2);
    const centerHeight =
      (dataset.elevations[centerIdx] - dataset.metrics.minElevationM) *
      meterToScene *
      exaggeration;
    const beaconGroup = new THREE.Group();
    const poleGeo = new THREE.CylinderGeometry(0.18, 0.18, 12, 8);
    const poleMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 6;
    const tipGeo = new THREE.OctahedronGeometry(0.9, 0);
    const tipMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.y = 12.8;
    beaconGroup.add(pole, tip);
    beaconGroup.position.set(0, centerHeight, 0);
    beaconGroup.name = "analog-beacon";
    scene.add(beaconGroup);

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0x94a3b8, 0x090d16, 0.35);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e4, 2.35);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 350;
    const d = 82;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.03;
    scene.add(sunLight);

    sceneRefs.current = {
      renderer,
      scene,
      camera,
      controls,
      mesh,
      sunLight,
      dataset,
      meterToScene,
      textures,
    };

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = entry.contentRect.width;
      const h = entry.contentRect.height;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    let rafId = 0;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      controls.autoRotate = autoRotate && !prefersReducedMotion;
      controls.autoRotateSpeed = 0.85;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      controls.dispose();
      geometry.dispose();
      material.dispose();
      satTex.dispose();
      slopeTex.dispose();
      hypsoTex.dispose();
      poleGeo.dispose();
      poleMat.dispose();
      tipGeo.dispose();
      tipMat.dispose();
      renderer.dispose();
      sceneRefs.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset]);

  // Apply vertex elevations when dataset or exaggeration changes
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs) return;
    const { mesh, dataset: ds, meterToScene, scene } = refs;
    const pos = mesh.geometry.attributes.position as THREE.BufferAttribute;
    const minE = ds.metrics.minElevationM;
    const count = Math.min(pos.count, ds.elevations.length);

    for (let i = 0; i < count; i++) {
      pos.setY(i, (ds.elevations[i] - minE) * meterToScene * exaggeration);
    }
    pos.needsUpdate = true;
    mesh.geometry.computeVertexNormals();

    const beacon = scene.getObjectByName("analog-beacon");
    if (beacon) {
      const gridSize = Math.round(Math.sqrt(ds.elevations.length));
      const centerIdx =
        Math.floor(gridSize / 2) * gridSize + Math.floor(gridSize / 2);
      beacon.position.y = (ds.elevations[centerIdx] - minE) * meterToScene * exaggeration;
    }
  }, [dataset, exaggeration]);

  // Update texture & wireframe mode
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs) return;
    refs.mesh.material.map = refs.textures[renderMode];
    refs.mesh.material.wireframe = wireframe;
    refs.mesh.material.needsUpdate = true;
  }, [renderMode, wireframe, dataset]);

  // Update solar direction & intensity
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs) return;
    const elevRad = THREE.MathUtils.degToRad(solarElevation);
    const azimRad = THREE.MathUtils.degToRad(solarAzimuth);
    const dist = 160;
    refs.sunLight.position.set(
      dist * Math.cos(elevRad) * Math.sin(azimRad),
      Math.max(4, dist * Math.sin(elevRad)),
      dist * Math.cos(elevRad) * Math.cos(azimRad)
    );
    refs.sunLight.intensity = solarElevation < 8 ? 2.8 : 2.3;
  }, [solarElevation, solarAzimuth, dataset]);

  // Sync autoRotate without rebuilding scene
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    refs.controls.autoRotate = autoRotate && !prefersReducedMotion;
  }, [autoRotate]);

  const groundResolutionM = useMemo(() => {
    if (!dataset) return null;
    const grid = Math.round(Math.sqrt(dataset.elevations.length));
    return dataset.widthMeters / Math.max(1, grid - 1);
  }, [dataset]);

  if (!target) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Gemelo Topográfico 3D HD de ${target.name}`}
    >
      <div className="relative flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-800/90 bg-[#060913] shadow-2xl">
        {/* Header HUD */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-[#0D1424]/95 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-300">
              <Mountain className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-100 md:text-base">
                  Gemelo Topográfico 3D HD — {target.name}
                </h2>
                {typeof target.asiScore === "number" && (
                  <span className="rounded border border-cyan-500/40 bg-cyan-500/15 px-2 py-0.5 font-mono text-xs tabular-nums text-cyan-200">
                    ASI {target.asiScore.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="font-mono text-xs tabular-nums text-slate-400">
                LAT {target.latitude.toFixed(4)}° · LON {target.longitude.toFixed(4)}°
                {dataset && (
                  <>
                    {" · "}SAT Z{dataset.effectiveSatZoom} · DEM Z{dataset.demZoom}
                    {groundResolutionM !== null &&
                      ` · MALLA ${groundResolutionM.toFixed(1)}m/nodo`}
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-500/50 hover:text-white"
          >
            <X className="h-4 w-4" />
            Cerrar visor
          </button>
        </header>

        {/* Body */}
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_320px]">
          {/* WebGL Viewport */}
          <div className="relative min-h-[340px] flex-1 bg-[#060913]">
            <div ref={mountRef} className="h-full w-full" />

            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#060913]/85 backdrop-blur-sm">
                <Loader2 className="h-7 w-7 animate-spin text-cyan-400" />
                <p className="font-mono text-xs text-slate-300">
                  Reconstruyendo malla DEM y textura satelital HD...
                </p>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#060913]/95 p-6 text-center">
                <p className="max-w-md text-sm text-rose-300">{error}</p>
                <button
                  type="button"
                  onClick={() => setRetryNonce((n) => n + 1)}
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-500/50"
                >
                  Reintentar carga
                </button>
              </div>
            )}

            {/* Floating viewport controls */}
            {dataset && !loading && (
              <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap items-end justify-between gap-2">
                <div className="pointer-events-auto rounded-lg border border-slate-800/80 bg-[#0D1424]/90 px-3 py-1.5 font-mono text-[11px] tabular-nums text-slate-300 backdrop-blur-md">
                  Arrastrar: Orbitar · Scroll: Zoom · Clic derecho: Desplazar
                </div>
                <div className="pointer-events-auto flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAutoRotate((v) => !v)}
                    aria-pressed={autoRotate}
                    className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium backdrop-blur-md transition-colors ${
                      autoRotate
                        ? "border-cyan-500/60 bg-cyan-500/20 text-cyan-200"
                        : "border-slate-800/80 bg-[#0D1424]/90 text-slate-300 hover:text-white"
                    }`}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Auto-órbita
                  </button>
                  <button
                    type="button"
                    onClick={() => setWireframe((v) => !v)}
                    aria-pressed={wireframe}
                    className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium backdrop-blur-md transition-colors ${
                      wireframe
                        ? "border-amber-500/60 bg-amber-500/20 text-amber-200"
                        : "border-slate-800/80 bg-[#0D1424]/90 text-slate-300 hover:text-white"
                    }`}
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    Malla
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Telemetry & Simulation Controls */}
          <aside className="flex flex-col gap-4 overflow-y-auto border-t border-slate-800/80 bg-[#0D1424]/95 p-4 lg:border-l lg:border-t-0">
            {/* Render Mode */}
            <section>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <Layers className="h-3.5 w-3.5 text-cyan-400" />
                Capa de Análisis 3D
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: "satellite", label: "Satélite HD" },
                    { id: "slope", label: "Pendiente" },
                    { id: "hypsometric", label: "Curvas DEM" },
                  ] as const
                ).map((m) => {
                  const active = renderMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setRenderMode(m.id)}
                      aria-pressed={active}
                      className={`min-h-[38px] rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? "border-cyan-500/60 bg-cyan-500/20 text-cyan-200"
                          : "border-slate-800 bg-[#060913]/70 text-slate-300 hover:border-slate-700 hover:text-white"
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {renderMode === "slope" && (
                <div className="mt-2.5 grid grid-cols-2 gap-1.5 rounded-md border border-slate-800/80 bg-[#060913]/70 p-2 font-mono text-[11px] tabular-nums">
                  <div className="flex items-center gap-1.5 text-cyan-300">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#06B6D4]" />
                    {"<=10° Óptimo"}
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-300">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#10B981]" />
                    10-15° Rover OK
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-300">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#F59E0B]" />
                    15-25° Límite
                  </div>
                  <div className="flex items-center gap-1.5 text-[#E07A5F]">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#E07A5F]" />
                    {">25° Peligro"}
                  </div>
                </div>
              )}
            </section>

            {/* Solar Simulation */}
            <section className="rounded-lg border border-slate-800/80 bg-[#060913]/70 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                  <Sun className="h-3.5 w-3.5 text-amber-300" />
                  Simulador Solar
                </span>
                <span className="font-mono text-xs tabular-nums text-amber-200">
                  {solarElevation.toFixed(1)}° / {solarAzimuth}°
                </span>
              </div>

              <div className="mb-3 flex flex-wrap gap-1">
                {SOLAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSolarElevation(preset.elevation);
                      setSolarAzimuth(preset.azimuth);
                    }}
                    className="rounded border border-slate-800 bg-[#0D1424] px-2 py-1 text-[11px] text-slate-300 hover:border-amber-400/50 hover:text-amber-200"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <label className="block text-[11px] text-slate-400">
                Elevación solar ({solarElevation.toFixed(1)}°)
                <input
                  type="range"
                  min={1.5}
                  max={75}
                  step={0.5}
                  value={solarElevation}
                  onChange={(e) => setSolarElevation(Number(e.target.value))}
                  className="mt-1 w-full accent-amber-400"
                />
              </label>

              <label className="mt-2 block text-[11px] text-slate-400">
                Azimut solar ({solarAzimuth}°)
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={5}
                  value={solarAzimuth}
                  onChange={(e) => setSolarAzimuth(Number(e.target.value))}
                  className="mt-1 w-full accent-cyan-400"
                />
              </label>
            </section>

            {/* Scale & Vertical Exaggeration */}
            <section className="rounded-lg border border-slate-800/80 bg-[#060913]/70 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <Compass className="h-3.5 w-3.5 text-cyan-400" />
                Geometría y Escala
              </div>

              <div className="mb-2.5">
                <span className="mb-1 block text-[11px] text-slate-400">
                  Exageración vertical
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {[1.0, 1.5, 2.0, 3.0].map((factor) => (
                    <button
                      key={factor}
                      type="button"
                      onClick={() => setExaggeration(factor)}
                      aria-pressed={exaggeration === factor}
                      className={`rounded border py-1 font-mono text-xs tabular-nums transition-colors ${
                        exaggeration === factor
                          ? "border-cyan-500/60 bg-cyan-500/20 text-cyan-200"
                          : "border-slate-800 bg-[#0D1424] text-slate-300 hover:text-white"
                      }`}
                    >
                      {factor.toFixed(1)}x
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-1 block text-[11px] text-slate-400">
                  Radio de captura
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { value: 1600, label: "1.6 km" },
                    { value: 2800, label: "2.8 km" },
                    { value: 4500, label: "4.5 km" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRadiusMeters(opt.value)}
                      aria-pressed={radiusMeters === opt.value}
                      className={`rounded border py-1 font-mono text-xs tabular-nums transition-colors ${
                        radiusMeters === opt.value
                          ? "border-cyan-500/60 bg-cyan-500/20 text-cyan-200"
                          : "border-slate-800 bg-[#0D1424] text-slate-300 hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Terrain Metrics */}
            {dataset && (
              <section className="rounded-lg border border-slate-800/80 bg-[#060913]/70 p-3">
                <h3 className="mb-2 text-xs font-semibold text-slate-200">
                  Métricas Topográficas del Sector
                </h3>
                <dl className="grid grid-cols-2 gap-2 font-mono text-xs tabular-nums">
                  <div className="rounded border border-slate-800/70 bg-[#0D1424]/70 p-2">
                    <dt className="text-[10px] text-slate-400">Elevación Mín</dt>
                    <dd className="text-slate-100">
                      {dataset.metrics.minElevationM.toFixed(0)} m
                    </dd>
                  </div>
                  <div className="rounded border border-slate-800/70 bg-[#0D1424]/70 p-2">
                    <dt className="text-[10px] text-slate-400">Elevación Máx</dt>
                    <dd className="text-slate-100">
                      {dataset.metrics.maxElevationM.toFixed(0)} m
                    </dd>
                  </div>
                  <div className="rounded border border-slate-800/70 bg-[#0D1424]/70 p-2">
                    <dt className="text-[10px] text-slate-400">Relieve Total</dt>
                    <dd className="text-cyan-300">
                      {dataset.metrics.reliefM.toFixed(0)} m
                    </dd>
                  </div>
                  <div className="rounded border border-slate-800/70 bg-[#0D1424]/70 p-2">
                    <dt className="text-[10px] text-slate-400">Pendiente Media</dt>
                    <dd className="text-slate-100">
                      {dataset.metrics.meanSlopeDeg.toFixed(1)}°
                    </dd>
                  </div>
                  <div className="col-span-2 rounded border border-slate-800/70 bg-[#0D1424]/70 p-2">
                    <dt className="text-[10px] text-slate-400">
                      Transitabilidad Rover (&le; 15°)
                    </dt>
                    <dd className="text-sm font-semibold text-emerald-300">
                      {dataset.metrics.roverTraversablePct.toFixed(1)}% del área
                    </dd>
                  </div>
                </dl>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
