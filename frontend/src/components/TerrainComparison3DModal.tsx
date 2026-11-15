"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Globe2,
  Layers,
  Link2,
  Link2Off,
  Loader2,
  Moon,
  Mountain,
  Orbit,
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
import {
  buildExtraterrestrialTerrainData,
  type ExtraterrestrialTerrainData,
} from "@/lib/extraterrestrialTerrain";
import type { AnalogSite, TargetProfile } from "@/types/analog";

export type ComparisonRenderMode = "realistic" | "slope" | "hypsometric";

interface TerrainComparison3DModalProps {
  open: boolean;
  onClose: () => void;
  site: AnalogSite;
  target: TargetProfile;
  references: Record<string, TargetProfile>;
  overallAsi: number;
  onSelectTarget: (targetId: string) => void;
}

const SCENE_WIDTH = 120;
const RADIUS_METERS = 2800;

const SOLAR_PRESETS = [
  { id: "lunar-south", label: "Polo Sur Lunar (1.5°)", elevation: 1.5, azimuth: 135 },
  { id: "mars-low", label: "Marte Sol Bajo (18°)", elevation: 18, azimuth: 220 },
  { id: "noon", label: "Cenit (52°)", elevation: 52, azimuth: 160 },
] as const;

interface SceneRig {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  sunLight: THREE.DirectionalLight;
  elevations: Float32Array;
  minElevationM: number;
  meterToScene: number;
  textures: Record<ComparisonRenderMode, THREE.Texture>;
  dispose: () => void;
}

function makeDataTexture(rgba: Uint8ClampedArray, size: number): THREE.DataTexture {
  const tex = new THREE.DataTexture(rgba, size, size, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.flipY = false;
  tex.needsUpdate = true;
  return tex;
}

function updateSunPosition(
  light: THREE.DirectionalLight,
  elevationDeg: number,
  azimuthDeg: number
) {
  const el = THREE.MathUtils.degToRad(elevationDeg);
  const az = THREE.MathUtils.degToRad(azimuthDeg);
  const dist = 240;
  light.position.set(
    Math.cos(el) * Math.sin(az) * dist,
    Math.sin(el) * dist,
    Math.cos(el) * Math.cos(az) * dist
  );
}

function applyMeshExaggeration(rig: SceneRig, exaggeration: number) {
  const posAttr = rig.mesh.geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < posAttr.count; i++) {
    const elev = rig.elevations[i] - rig.minElevationM;
    posAttr.setY(i, elev * rig.meterToScene * exaggeration);
  }
  posAttr.needsUpdate = true;
  rig.mesh.geometry.computeVertexNormals();
}

function mountTerrainRig(params: {
  container: HTMLDivElement;
  elevations: Float32Array;
  slopesDeg: Float32Array;
  minElevationM: number;
  maxElevationM: number;
  widthMeters: number;
  heightMeters: number;
  realisticTexture: THREE.Texture;
  backgroundColor: number;
  solarElevation: number;
  solarAzimuth: number;
  exaggeration: number;
  renderMode: ComparisonRenderMode;
  wireframe: boolean;
}): SceneRig {
  const {
    container,
    elevations,
    slopesDeg,
    minElevationM,
    maxElevationM,
    widthMeters,
    heightMeters,
    realisticTexture,
    backgroundColor,
    solarElevation,
    solarAzimuth,
    exaggeration,
    renderMode,
    wireframe,
  } = params;

  const gridSize = Math.round(Math.sqrt(elevations.length));
  const meterToScene = SCENE_WIDTH / widthMeters;
  const sceneHeight = heightMeters * meterToScene;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(backgroundColor);

  const width = Math.max(container.clientWidth, 320);
  const height = Math.max(container.clientHeight, 260);
  const camera = new THREE.PerspectiveCamera(44, width / height, 0.5, 1600);
  camera.position.set(SCENE_WIDTH * 0.85, SCENE_WIDTH * 0.68, SCENE_WIDTH * 0.9);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.minDistance = 28;
  controls.maxDistance = 320;

  const ambientLight = new THREE.AmbientLight(0x94a3b8, 0.28);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.22);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.5);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 520;
  const d = SCENE_WIDTH * 0.85;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.0005;
  updateSunPosition(sunLight, solarElevation, solarAzimuth);
  scene.add(sunLight);

  const geometry = new THREE.PlaneGeometry(SCENE_WIDTH, sceneHeight, gridSize - 1, gridSize - 1);
  geometry.rotateX(-Math.PI / 2);

  const slopeTex = makeDataTexture(buildSlopeColorTextureData(slopesDeg, gridSize), gridSize);
  const hypsoTex = makeDataTexture(
    buildHypsometricTextureData(elevations, minElevationM, maxElevationM, gridSize),
    gridSize
  );

  const textures: Record<ComparisonRenderMode, THREE.Texture> = {
    realistic: realisticTexture,
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

  const gridHelper = new THREE.GridHelper(SCENE_WIDTH * 1.15, 12, 0x1e293b, 0x0f172a);
  gridHelper.position.y = -0.5;
  scene.add(gridHelper);

  const rig: SceneRig = {
    renderer,
    scene,
    camera,
    controls,
    mesh,
    sunLight,
    elevations,
    minElevationM,
    meterToScene,
    textures,
    dispose: () => {
      controls.dispose();
      geometry.dispose();
      material.dispose();
      Object.values(textures).forEach((t) => t.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };

  applyMeshExaggeration(rig, exaggeration);
  const relief = Math.max(1, maxElevationM - minElevationM) * meterToScene * exaggeration;
  controls.target.set(0, relief * 0.25, 0);
  controls.update();

  return rig;
}

export function TerrainComparison3DModal({
  open,
  onClose,
  site,
  target,
  references,
  overallAsi,
  onSelectTarget,
}: TerrainComparison3DModalProps) {
  const earthMountRef = useRef<HTMLDivElement | null>(null);
  const targetMountRef = useRef<HTMLDivElement | null>(null);

  const earthRigRef = useRef<SceneRig | null>(null);
  const targetRigRef = useRef<SceneRig | null>(null);

  const [renderMode, setRenderMode] = useState<ComparisonRenderMode>("realistic");
  const [exaggeration, setExaggeration] = useState<number>(1.5);
  const [solarElevation, setSolarElevation] = useState<number>(
    target.body === "Moon" ? 14 : 22
  );
  const [solarAzimuth, setSolarAzimuth] = useState<number>(145);
  const [syncCameras, setSyncCameras] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [wireframe, setWireframe] = useState<boolean>(false);

  const syncRef = useRef(syncCameras);
  useEffect(() => {
    syncRef.current = syncCameras;
  }, [syncCameras]);
  const isSyncingRef = useRef(false);

  const [earthLoaded, setEarthLoaded] = useState<{
    key: string;
    dataset: TerrainDataset | null;
    error: string | null;
  }>({ key: "", dataset: null, error: null });

  const earthRequestKey = open ? `${site.id}:${site.latitude}:${site.longitude}` : "";
  const earthLoading = open && earthLoaded.key !== earthRequestKey;
  const earthDataset = earthLoaded.key === earthRequestKey ? earthLoaded.dataset : null;
  const earthError = earthLoaded.key === earthRequestKey ? earthLoaded.error : null;

  const extraDataset: ExtraterrestrialTerrainData | null = useMemo(() => {
    if (!open) return null;
    return buildExtraterrestrialTerrainData(target, {
      radiusMeters: RADIUS_METERS,
      gridSize: 192,
    });
  }, [open, target]);

  const orderedRefs = useMemo(() => {
    const all = Object.values(references);
    const moon = all.filter((r) => r.body === "Moon");
    const mars = all.filter((r) => r.body === "Mars");
    return { moon, mars };
  }, [references]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Load Earth DEM + HD satellite dataset
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const activeKey = earthRequestKey;

    buildTerrainDataset({
      lat: site.latitude,
      lon: site.longitude,
      radiusMeters: RADIUS_METERS,
      gridSize: 192,
      demZoom: 13,
      satZoom: 16,
    })
      .then((result) => {
        if (!cancelled) {
          setEarthLoaded({ key: activeKey, dataset: result, error: null });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setEarthLoaded({
            key: activeKey,
            dataset: null,
            error:
              err instanceof Error
                ? err.message
                : "No se pudo cargar el modelo DEM terrestre.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, earthRequestKey, site.latitude, site.longitude]);

  // Mount Earth 3D scene
  useEffect(() => {
    if (!open || !earthDataset || !earthMountRef.current) return;

    const satTex = new THREE.CanvasTexture(earthDataset.satelliteCanvas);
    satTex.colorSpace = THREE.SRGBColorSpace;
    satTex.anisotropy = 4;

    const rig = mountTerrainRig({
      container: earthMountRef.current,
      elevations: earthDataset.elevations,
      slopesDeg: earthDataset.slopesDeg,
      minElevationM: earthDataset.metrics.minElevationM,
      maxElevationM: earthDataset.metrics.maxElevationM,
      widthMeters: earthDataset.widthMeters,
      heightMeters: earthDataset.heightMeters,
      realisticTexture: satTex,
      backgroundColor: 0x060913,
      solarElevation,
      solarAzimuth,
      exaggeration,
      renderMode,
      wireframe,
    });
    rig.controls.autoRotate = autoRotate;
    rig.controls.autoRotateSpeed = 0.8;
    earthRigRef.current = rig;

    const handleEarthControlChange = () => {
      if (!syncRef.current || isSyncingRef.current || !targetRigRef.current) return;
      isSyncingRef.current = true;
      const other = targetRigRef.current;
      other.camera.position.copy(rig.camera.position);
      other.controls.target.copy(rig.controls.target);
      other.controls.update();
      isSyncingRef.current = false;
    };
    rig.controls.addEventListener("change", handleEarthControlChange);

    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      rig.controls.update();
      rig.renderer.render(rig.scene, rig.camera);
    };
    animate();

    const ro = new ResizeObserver(() => {
      if (!earthMountRef.current) return;
      const w = earthMountRef.current.clientWidth;
      const h = earthMountRef.current.clientHeight;
      if (w > 0 && h > 0) {
        rig.camera.aspect = w / h;
        rig.camera.updateProjectionMatrix();
        rig.renderer.setSize(w, h);
      }
    });
    ro.observe(earthMountRef.current);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      rig.controls.removeEventListener("change", handleEarthControlChange);
      rig.dispose();
      earthRigRef.current = null;
    };
    // Intentionally rebuild scene only when dataset changes; live controls update via dedicated effects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, earthDataset]);

  // Mount Moon/Mars 3D scene
  useEffect(() => {
    if (!open || !extraDataset || !targetMountRef.current) return;

    const surfTex = makeDataTexture(extraDataset.surfaceRgba, extraDataset.gridSize);

    const rig = mountTerrainRig({
      container: targetMountRef.current,
      elevations: extraDataset.elevations,
      slopesDeg: extraDataset.slopesDeg,
      minElevationM: extraDataset.metrics.minElevationM,
      maxElevationM: extraDataset.metrics.maxElevationM,
      widthMeters: extraDataset.widthMeters,
      heightMeters: extraDataset.heightMeters,
      realisticTexture: surfTex,
      backgroundColor: 0x060913,
      solarElevation,
      solarAzimuth,
      exaggeration,
      renderMode,
      wireframe,
    });
    rig.controls.autoRotate = autoRotate;
    rig.controls.autoRotateSpeed = 0.8;

    // Match Earth camera if already mounted and sync is active
    if (syncRef.current && earthRigRef.current) {
      rig.camera.position.copy(earthRigRef.current.camera.position);
      rig.controls.target.copy(earthRigRef.current.controls.target);
      rig.controls.update();
    }

    targetRigRef.current = rig;

    const handleTargetControlChange = () => {
      if (!syncRef.current || isSyncingRef.current || !earthRigRef.current) return;
      isSyncingRef.current = true;
      const other = earthRigRef.current;
      other.camera.position.copy(rig.camera.position);
      other.controls.target.copy(rig.controls.target);
      other.controls.update();
      isSyncingRef.current = false;
    };
    rig.controls.addEventListener("change", handleTargetControlChange);

    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      rig.controls.update();
      rig.renderer.render(rig.scene, rig.camera);
    };
    animate();

    const ro = new ResizeObserver(() => {
      if (!targetMountRef.current) return;
      const w = targetMountRef.current.clientWidth;
      const h = targetMountRef.current.clientHeight;
      if (w > 0 && h > 0) {
        rig.camera.aspect = w / h;
        rig.camera.updateProjectionMatrix();
        rig.renderer.setSize(w, h);
      }
    });
    ro.observe(targetMountRef.current);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      rig.controls.removeEventListener("change", handleTargetControlChange);
      rig.dispose();
      targetRigRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, extraDataset]);

  // Live updates to both rigs (render mode, exaggeration, sun, wireframe, autorotate)
  useEffect(() => {
    [earthRigRef.current, targetRigRef.current].forEach((rig) => {
      if (!rig) return;
      rig.mesh.material.map = rig.textures[renderMode];
      rig.mesh.material.wireframe = wireframe;
      rig.mesh.material.needsUpdate = true;
      rig.controls.autoRotate = autoRotate;
      updateSunPosition(rig.sunLight, solarElevation, solarAzimuth);
      applyMeshExaggeration(rig, exaggeration);
    });
  }, [renderMode, wireframe, autoRotate, solarElevation, solarAzimuth, exaggeration]);

  const handleResetCameras = () => {
    [earthRigRef.current, targetRigRef.current].forEach((rig) => {
      if (!rig) return;
      rig.camera.position.set(SCENE_WIDTH * 0.85, SCENE_WIDTH * 0.68, SCENE_WIDTH * 0.9);
      rig.controls.target.set(0, 6, 0);
      rig.controls.update();
    });
  };

  if (!open || typeof document === "undefined") return null;

  const isMars = target.body === "Mars";
  const bodyLabel = isMars ? "Marte" : "Luna";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Comparación visual 3D: ${site.name} frente a ${target.name}`}
      className="fixed inset-0 z-50 flex flex-col bg-[#060913]/95 backdrop-blur-md"
    >
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-[#0D1424]/95 px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-[#06B6D4]/40 bg-[#06B6D4]/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#06B6D4]">
              <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
              {site.name}
            </span>
            <span className="font-mono text-xs text-slate-500">vs</span>
            <span
              className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[11px] font-semibold ${
                isMars
                  ? "border-[#E07A5F]/40 bg-[#E07A5F]/10 text-[#E07A5F]"
                  : "border-slate-400/40 bg-slate-400/10 text-slate-200"
              }`}
            >
              {isMars ? (
                <Orbit className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Moon className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {bodyLabel}: {target.name.split("/")[0].trim()}
            </span>
            <span className="rounded border border-slate-700 bg-slate-900/90 px-2 py-0.5 font-mono text-xs font-bold tabular-nums text-slate-100">
              ASI {overallAsi.toFixed(1)}
            </span>
          </div>

          {/* Quick target switcher */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5" role="group" aria-label="Cambiar objetivo lunar o marciano">
            {orderedRefs.moon.map((ref) => {
              const active = ref.id === target.id;
              return (
                <button
                  key={ref.id}
                  type="button"
                  onClick={() => onSelectTarget(ref.id)}
                  className={`rounded border px-2 py-1 font-mono text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#06B6D4] ${
                    active
                      ? "border-slate-300 bg-slate-200/15 font-semibold text-slate-100"
                      : "border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                  }`}
                >
                  Luna: {ref.name.split("/")[0].trim()}
                </button>
              );
            })}
            {orderedRefs.mars.map((ref) => {
              const active = ref.id === target.id;
              return (
                <button
                  key={ref.id}
                  type="button"
                  onClick={() => onSelectTarget(ref.id)}
                  className={`rounded border px-2 py-1 font-mono text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E07A5F] ${
                    active
                      ? "border-[#E07A5F] bg-[#E07A5F]/20 font-semibold text-[#F6AD99]"
                      : "border-slate-800 bg-slate-900/70 text-slate-400 hover:border-[#E07A5F]/50 hover:text-slate-200"
                  }`}
                >
                  Marte: {ref.name.split("/")[0].trim()}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar comparación 3D"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/90 text-slate-300 transition-colors hover:border-slate-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#06B6D4]"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      {/* Dual 3D Viewports */}
      <main className="grid min-h-0 flex-1 grid-cols-1 gap-px bg-slate-800/80 lg:grid-cols-2">
        {/* Left: Earth DEM */}
        <section className="relative min-h-[260px] bg-[#060913]" aria-label="Visor 3D terrestre">
          <div ref={earthMountRef} className="h-full w-full" />

          <div className="pointer-events-none absolute top-3 left-3 right-3 flex flex-wrap items-start justify-between gap-2">
            <div className="rounded-lg border border-[#06B6D4]/30 bg-[#0D1424]/85 px-3 py-2 backdrop-blur-md">
              <div className="font-mono text-[10px] font-semibold tracking-wider text-[#06B6D4] uppercase">
                Tierra · DEM Real (Terrarium / Satélite HD)
              </div>
              <div className="mt-0.5 text-sm font-semibold text-slate-100">
                {site.name} ({site.country})
              </div>
              {earthDataset && (
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] tabular-nums text-slate-300">
                  <span>Pendiente media: {earthDataset.metrics.meanSlopeDeg.toFixed(1)}°</span>
                  <span>Relieve: {Math.round(earthDataset.metrics.reliefM)} m</span>
                  <span>Transitable ≤15°: {earthDataset.metrics.roverTraversablePct.toFixed(0)}%</span>
                </div>
              )}
            </div>
          </div>

          {earthLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#060913]/85">
              <Loader2 className="h-7 w-7 animate-spin text-[#06B6D4]" aria-hidden="true" />
              <span className="font-mono text-xs text-slate-300">
                Descargando elevación DEM y textura satelital...
              </span>
            </div>
          )}

          {earthError && (
            <div className="absolute inset-0 flex items-center justify-center p-6 bg-[#060913]/90">
              <div className="max-w-sm rounded-lg border border-rose-500/40 bg-[#0D1424] p-4 text-center">
                <p className="text-sm font-semibold text-rose-300">Error al cargar terreno terrestre</p>
                <p className="mt-1 font-mono text-xs text-slate-400">{earthError}</p>
              </div>
            </div>
          )}
        </section>

        {/* Right: Moon or Mars Parametric Surface */}
        <section
          className="relative min-h-[260px] bg-[#060913]"
          aria-label={`Visor 3D de ${bodyLabel}`}
        >
          <div ref={targetMountRef} className="h-full w-full" />

          <div className="pointer-events-none absolute top-3 left-3 right-3 flex flex-wrap items-start justify-between gap-2">
            <div
              className={`rounded-lg border bg-[#0D1424]/85 px-3 py-2 backdrop-blur-md ${
                isMars ? "border-[#E07A5F]/35" : "border-slate-500/35"
              }`}
            >
              <div
                className={`font-mono text-[10px] font-semibold tracking-wider uppercase ${
                  isMars ? "text-[#E07A5F]" : "text-slate-300"
                }`}
              >
                {bodyLabel} · Síntesis Geomorfológica ({extraDataset?.sourceBadge})
              </div>
              <div className="mt-0.5 text-sm font-semibold text-slate-100">
                {target.name}
              </div>
              {extraDataset && (
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] tabular-nums text-slate-300">
                  <span>Pendiente ref.: {target.terrain?.slope_deg ?? 0}°</span>
                  <span>Media malla: {extraDataset.metrics.meanSlopeDeg.toFixed(1)}°</span>
                  <span>Gravedad: {target.gravity_ms2 ?? (isMars ? 3.71 : 1.62)} m/s²</span>
                  <span>Transitable ≤15°: {extraDataset.metrics.roverTraversablePct.toFixed(0)}%</span>
                </div>
              )}
              {extraDataset && (
                <div className="mt-1 text-[11px] text-slate-400">
                  {extraDataset.morphologyLabel} (modelo paramétrico calibrado al perfil de referencia)
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Shared Controls Footer */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 bg-[#0D1424]/95 px-4 py-2.5">
        {/* Render mode */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Modo de visualización de superficie">
          <span className="mr-1 inline-flex items-center gap-1 font-mono text-[11px] text-slate-400">
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            Capa:
          </span>
          {(
            [
              { id: "realistic", label: "Realista / Satélite" },
              { id: "slope", label: "Pendientes" },
              { id: "hypsometric", label: "Hipsometría" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setRenderMode(m.id)}
              className={`rounded border px-2.5 py-1.5 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#06B6D4] ${
                renderMode === m.id
                  ? "border-[#06B6D4] bg-[#06B6D4]/20 font-semibold text-[#06B6D4]"
                  : "border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-600"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Sliders: exaggeration + solar elevation */}
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 font-mono text-xs text-slate-300">
            <Mountain className="h-3.5 w-3.5 text-[#06B6D4]" aria-hidden="true" />
            <span>Relieve</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={exaggeration}
              onChange={(e) => setExaggeration(Number(e.target.value))}
              className="w-20 accent-[#06B6D4]"
            />
            <span className="w-8 tabular-nums text-slate-200">{exaggeration.toFixed(1)}x</span>
          </label>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 font-mono text-xs text-slate-300">
              <Sun className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
              <span>Sol</span>
              <input
                type="range"
                min={1}
                max={80}
                step={1}
                value={solarElevation}
                onChange={(e) => setSolarElevation(Number(e.target.value))}
                className="w-20 accent-amber-400"
              />
              <span className="w-8 tabular-nums text-slate-200">{solarElevation}°</span>
            </label>
            <div className="hidden items-center gap-1 xl:flex">
              {SOLAR_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSolarElevation(p.elevation);
                    setSolarAzimuth(p.azimuth);
                  }}
                  className="rounded border border-slate-800 bg-slate-900/70 px-2 py-1 font-mono text-[10px] text-slate-400 hover:border-slate-600 hover:text-slate-200"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Camera sync & utilities */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSyncCameras((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#06B6D4] ${
              syncCameras
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                : "border-slate-800 bg-slate-900/70 text-slate-400"
            }`}
          >
            {syncCameras ? (
              <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Link2Off className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{syncCameras ? "Cámaras sincronizadas" : "Cámaras libres"}</span>
          </button>

          <button
            type="button"
            onClick={() => setWireframe((v) => !v)}
            className={`rounded border px-2.5 py-1.5 font-mono text-xs transition-colors ${
              wireframe
                ? "border-[#06B6D4] bg-[#06B6D4]/20 text-[#06B6D4]"
                : "border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-600"
            }`}
          >
            Malla
          </button>

          <button
            type="button"
            onClick={() => setAutoRotate((v) => !v)}
            className={`rounded border px-2.5 py-1.5 font-mono text-xs transition-colors ${
              autoRotate
                ? "border-[#06B6D4] bg-[#06B6D4]/20 text-[#06B6D4]"
                : "border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-600"
            }`}
          >
            Auto-rotar
          </button>

          <button
            type="button"
            onClick={handleResetCameras}
            title="Restablecer cámara"
            aria-label="Restablecer cámaras"
            className="inline-flex items-center gap-1 rounded border border-slate-800 bg-slate-900/70 px-2.5 py-1.5 font-mono text-xs text-slate-300 hover:border-slate-600"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Centrar</span>
          </button>
        </div>
      </footer>
    </div>,
    document.body
  );
}
