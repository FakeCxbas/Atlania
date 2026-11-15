"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  applyStratumPbrShader,
  createTerrainStrataTextures,
  getOrCreateStrataGeometries,
  type CachedLayerGeometry,
  type StratumShaderMode,
  type StratumTextureSet,
  type TerrainStrataTextureBundle,
} from "./terrainStrataTextures";

export interface PlanetSceneProps {
  /** Normalized scroll progress across the entire page [0..1] */
  scrollProgress: number;
  /** Normalized progress within the Ch1 -> Ch2 continuous sticky stage [0..1] */
  introProgress: number;
  /** Normalized progress within the Ch3 3D terrain sticky stage [0..1] */
  terrainProgress: number;
  /** Active chapter index (1..5) */
  activeChapter: number;
  /** Normalized separation factor [0..1] for Chapter 3 3D terrain layers */
  layerSeparation: number;
  /** Active planetary comparison body in Chapter 4 ("Moon" | "Mars") */
  comparisonBody: "Moon" | "Mars";
  /** Highlighted terrain stratum index (0: all, 1: surface/climate, 2: relief/DEM, 3: geology, 4: subsurface) */
  focusedLayer?: 0 | 1 | 2 | 3 | 4;
}

/**
 * Full-bleed continuous 3D WebGL stage powered by Three.js.
 * - Dominant 3D Earth with custom Fresnel atmospheric scattering shader & cloud layer.
 * - Moon and Mars in distinct 3D depth planes.
 * - Continuous camera advance from Chapter 1 into Chapter 2.
 * - Volumetric 4-layer 3D terrain block in Chapter 3 with real elevation displacement,
 *   slab thickness, directional shadows, and scroll-synchronized vertical separation.
 */
export function PlanetScene({
  scrollProgress,
  introProgress,
  terrainProgress,
  activeChapter,
  layerSeparation,
  comparisonBody,
  focusedLayer = 0,
}: PlanetSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  const isLowPowerDevice = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      navigator.hardwareConcurrency !== undefined &&
      navigator.hardwareConcurrency <= 4,
    []
  );

  const stateRef = useRef({
    scrollProgress,
    introProgress,
    terrainProgress,
    activeChapter,
    layerSeparation,
    comparisonBody,
    focusedLayer,
  });

  useEffect(() => {
    stateRef.current = {
      scrollProgress,
      introProgress,
      terrainProgress,
      activeChapter,
      layerSeparation,
      comparisonBody,
      focusedLayer,
    };
  }, [
    scrollProgress,
    introProgress,
    terrainProgress,
    activeChapter,
    layerSeparation,
    comparisonBody,
    focusedLayer,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isLowPowerDevice,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      queueMicrotask(() => setWebglSupported(false));
      return;
    }

    const maxDpr = isLowPowerDevice ? 1.25 : 1.75;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isLowPowerDevice;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      250
    );
    camera.position.set(0, 0.35, 9.2);

    // Balanced planetary & terrain illumination: atmospheric ambient/hemisphere + frontal fill + solar key
    const ambientLight = new THREE.AmbientLight(0x4a7ab5, 0.55);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x1e3a5f, 0.45);
    scene.add(hemiLight);

    const frontalFillLight = new THREE.DirectionalLight(0xe0f2fe, 0.45);
    frontalFillLight.position.set(0, 1.5, 8);
    scene.add(frontalFillLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.8);
    sunLight.position.set(8, 6, 7);
    if (!isLowPowerDevice) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 1;
      sunLight.shadow.camera.far = 25;
      const d = 4.5;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.015;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
    }
    scene.add(sunLight);

    const earthshineLight = new THREE.DirectionalLight(0x38bdf8, 0.85);
    earthshineLight.position.set(-7, -3, 4);
    scene.add(earthshineLight);

    // 1. Multi-depth Parallax Starfield
    const starCount = isLowPowerDevice ? 800 : 1800;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      starPositions[i3] = (Math.random() - 0.5) * 90;
      starPositions[i3 + 1] = (Math.random() - 0.5) * 65;
      starPositions[i3 + 2] = -Math.random() * 70 - 5;

      const c = 0.75 + Math.random() * 0.25;
      starColors[i3] = c * 0.92;
      starColors[i3 + 1] = c * 0.96;
      starColors[i3 + 2] = c;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(starPositions, 3)
    );
    starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.075,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 2. Load NASA Textures
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load("/nasa/earth-blue-marble.jpg");
    earthTexture.colorSpace = THREE.SRGBColorSpace;

    const moonTexture = textureLoader.load("/nasa/moon-orb.jpg");
    moonTexture.colorSpace = THREE.SRGBColorSpace;

    const marsTexture = textureLoader.load("/nasa/mars-orb.jpg");
    marsTexture.colorSpace = THREE.SRGBColorSpace;

    // 3. Dominant 3D Earth Group (clean MeshStandardMaterial, no custom ShaderMaterial overlay)
    const earthGroup = new THREE.Group();
    earthGroup.position.set(0.45, -3.15, 0.2);
    scene.add(earthGroup);

    const sphereSegments = isLowPowerDevice ? 48 : 72;
    const earthRadius = 3.15;
    const earthGeo = new THREE.SphereGeometry(
      earthRadius,
      sphereSegments,
      sphereSegments
    );
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.75,
      metalness: 0.0,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.rotation.z = 0.18;
    earthGroup.add(earthMesh);

    // 4. Moon & Mars in Distinct Depth Planes (No competing with Hero text)
    // Moon: Mid-ground upper-left orbital plane
    const moonGeo = new THREE.SphereGeometry(0.46, 40, 40);
    const moonMat = new THREE.MeshStandardMaterial({
      map: moonTexture,
      roughness: 0.9,
      metalness: 0.02,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(-4.35, 1.85, -2.4);
    scene.add(moonMesh);

    // Mars: Deep-background upper-right orbital plane
    const marsGeo = new THREE.SphereGeometry(0.32, 36, 36);
    const marsMat = new THREE.MeshStandardMaterial({
      map: marsTexture,
      roughness: 0.8,
      metalness: 0.04,
    });
    const marsMesh = new THREE.Mesh(marsGeo, marsMat);
    marsMesh.position.set(4.5, 2.25, -4.8);
    scene.add(marsMesh);

    // 5. Chapter 3 High-Density Photorealistic 4-Layer 3D Terrain Block (deferred for instant Earth first paint)
    const terrainGroup = new THREE.Group();
    terrainGroup.position.set(1.52, -4.8, 1.45);
    terrainGroup.scale.setScalar(0.84);
    terrainGroup.rotation.x = -1.16;
    terrainGroup.rotation.z = 0.58;
    terrainGroup.visible = false;
    scene.add(terrainGroup);

    const gridSegs = isLowPowerDevice ? 96 : 128;
    const slabSize = 2.0;
    const terrainDisposables: Array<{ dispose: () => void }> = [];
    let deferredTextures: TerrainStrataTextureBundle | null = null;
    let disposed = false;

    interface BuiltStratum {
      group: THREE.Group;
      surfaceMat: THREE.MeshStandardMaterial;
      atmoVeilUniforms: { uOpacity: { value: number } } | null;
      sideMat: THREE.MeshStandardMaterial;
    }

    interface TerrainBlockRefs {
      layer1Surface: BuiltStratum;
      layer2Relief: BuiltStratum;
      layer3Geology: BuiltStratum;
      layer4Subsurface: BuiltStratum;
      lavaGlowLight: THREE.PointLight;
    }

    let terrainRefs: TerrainBlockRefs | null = null;

    const ensureTerrainBuilt = () => {
      if (terrainRefs || disposed) return;

      const textures = createTerrainStrataTextures(isLowPowerDevice ? 384 : 512);
      deferredTextures = textures;
      const geos = getOrCreateStrataGeometries(gridSegs, slabSize);

      const createRealisticStratum = (options: {
        geoPair: CachedLayerGeometry;
        fallbackColor: number;
        roughness: number;
        normalScale: number;
        shaderMode: StratumShaderMode;
        topTextures: StratumTextureSet;
        sideTextures: StratumTextureSet;
        atmosphereVeil?: boolean;
      }): BuiltStratum => {
        const group = new THREE.Group();

        const surfaceMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          map: options.topTextures.map,
          normalMap: options.topTextures.normalMap,
          normalScale: new THREE.Vector2(options.normalScale, options.normalScale),
          roughnessMap: options.topTextures.roughnessMap,
          roughness: options.roughness,
          metalness: 0.04,
          transparent: false,
          opacity: 1.0,
          side: THREE.DoubleSide,
        });
        applyStratumPbrShader(surfaceMat, options.shaderMode);
        terrainDisposables.push(surfaceMat);

        const surfaceMesh = new THREE.Mesh(options.geoPair.topGeo, surfaceMat);
        surfaceMesh.castShadow = !isLowPowerDevice;
        surfaceMesh.receiveShadow = !isLowPowerDevice;
        group.add(surfaceMesh);

        let atmoVeilUniforms: { uOpacity: { value: number } } | null = null;
        if (options.atmosphereVeil) {
          const veilGeo = new THREE.PlaneGeometry(slabSize * 1.04, slabSize * 1.04, 1, 1);
          atmoVeilUniforms = { uOpacity: { value: 0.22 } };
          const veilMat = new THREE.ShaderMaterial({
            uniforms: atmoVeilUniforms,
            vertexShader: /* glsl */ `
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: /* glsl */ `
              uniform float uOpacity;
              varying vec2 vUv;
              void main() {
                vec2 d = abs(vUv - 0.5) * 2.0;
                float edge = max(d.x, d.y);
                float rim = smoothstep(0.55, 0.96, edge) * (1.0 - smoothstep(0.95, 1.0, edge));
                float haze = 0.28 + rim * 0.72;
                vec3 col = mix(vec3(0.22, 0.74, 0.97), vec3(0.68, 0.90, 1.0), rim);
                gl_FragColor = vec4(col, haze * uOpacity);
              }
            `,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
          });
          terrainDisposables.push(veilGeo, veilMat);
          const veilMesh = new THREE.Mesh(veilGeo, veilMat);
          veilMesh.position.z = 0.22;
          group.add(veilMesh);
        }

        const sideMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          map: options.sideTextures.map,
          normalMap: options.sideTextures.normalMap,
          normalScale: new THREE.Vector2(
            options.normalScale * 0.85,
            options.normalScale * 0.85
          ),
          roughnessMap: options.sideTextures.roughnessMap,
          roughness: 0.86,
          metalness: 0.04,
          transparent: false,
          opacity: 1.0,
          side: THREE.DoubleSide,
        });
        applyStratumPbrShader(
          sideMat,
          options.shaderMode === "subsurface" ? "subsurface" : "geology"
        );
        terrainDisposables.push(sideMat);

        const skirtMesh = new THREE.Mesh(options.geoPair.skirtGeo, sideMat);
        skirtMesh.castShadow = !isLowPowerDevice;
        skirtMesh.receiveShadow = !isLowPowerDevice;
        group.add(skirtMesh);

        return { group, surfaceMat, atmoVeilUniforms, sideMat };
      };

      const layer1Surface = createRealisticStratum({
        geoPair: geos.layer1,
        fallbackColor: 0x8b6b4a,
        roughness: 0.86,
        normalScale: 1.15,
        shaderMode: "surface",
        topTextures: textures.layer1,
        sideTextures: textures.layer3,
        atmosphereVeil: true,
      });

      const layer2Relief = createRealisticStratum({
        geoPair: geos.layer2,
        fallbackColor: 0x9a6b42,
        roughness: 0.88,
        normalScale: 1.65,
        shaderMode: "relief",
        topTextures: textures.layer2,
        sideTextures: textures.layer3,
      });

      const layer3Geology = createRealisticStratum({
        geoPair: geos.layer3,
        fallbackColor: 0xb4692e,
        roughness: 0.84,
        normalScale: 1.45,
        shaderMode: "geology",
        topTextures: textures.layer3,
        sideTextures: textures.layer3,
      });

      const layer4Subsurface = createRealisticStratum({
        geoPair: geos.layer4,
        fallbackColor: 0x121316,
        roughness: 0.92,
        normalScale: 1.75,
        shaderMode: "subsurface",
        topTextures: textures.layer4,
        sideTextures: textures.layer4,
      });

      const lavaGlowLight = new THREE.PointLight(0xf97316, 0.95, 1.8, 2);
      lavaGlowLight.position.set(-0.22, -0.82, -0.18);
      layer4Subsurface.group.add(lavaGlowLight);

      terrainGroup.add(layer1Surface.group);
      terrainGroup.add(layer2Relief.group);
      terrainGroup.add(layer3Geology.group);
      terrainGroup.add(layer4Subsurface.group);

      terrainRefs = {
        layer1Surface,
        layer2Relief,
        layer3Geology,
        layer4Subsurface,
        lavaGlowLight,
      };

      // Pre-compile Chapter 3 shaders in GPU during idle time to avoid scroll stutter
      renderer.compile(scene, camera);
    };

    // Pre-compile initial Earth + Starfield + Moon + Mars shaders and render frame 1 immediately
    const initialLookAt = new THREE.Vector3(0, -0.5, 0);
    camera.lookAt(initialLookAt);
    renderer.compile(scene, camera);

    let idleHandle: number | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleHandle = window.requestIdleCallback(() => ensureTerrainBuilt(), {
        timeout: 450,
      });
    } else {
      timeoutHandle = globalThis.setTimeout(() => ensureTerrainBuilt(), 80);
    }

    // Smooth camera interpolation vectors
    const currentCamPos = new THREE.Vector3(0, 0.35, 9.2);
    const targetCamPos = new THREE.Vector3(0, 0.35, 9.2);
    const currentLookAt = new THREE.Vector3(0, -0.5, 0);
    const targetLookAt = new THREE.Vector3(0, -0.5, 0);

    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const renderLoop = () => {
      animationFrameId = window.requestAnimationFrame(renderLoop);
      if (document.hidden) return;

      const elapsed = clock.getElapsedTime();
      const {
        scrollProgress: p,
        introProgress: introP,
        terrainProgress: terrP,
        activeChapter: ch,
        comparisonBody: body,
      } = stateRef.current;

      // =======================================================================
      // CONTINUOUS CAMERA & PLANET CHOREOGRAPHY ACROSS CHAPTERS 1 -> 5
      // =======================================================================
      if (ch <= 2) {
        // Chapters 1 & 2 shared continuous orbital approach:
        // As introP goes 0 -> 1:
        // - Camera advances directly toward Earth (z: 9.2 -> 4.95)
        // - Earth rises and grows in the frame, atmosphere intensifies
        // - Moon and Mars drift outward in parallax depth
        const t = Math.max(0, Math.min(1, introP));
        targetCamPos.set(0.18 * t, 0.35 - t * 0.55, 9.2 - t * 4.25);
        targetLookAt.set(0.25 * t, -0.55 - t * 0.35, 0);

        earthGroup.position.set(
          THREE.MathUtils.lerp(0.35, 0.75, t),
          THREE.MathUtils.lerp(-3.15, -2.05, t),
          THREE.MathUtils.lerp(0.2, 0.75, t)
        );

        moonMesh.position.set(
          -4.35 - t * 1.4,
          1.85 + t * 0.65,
          -2.4 - t * 1.2
        );
        marsMesh.position.set(
          4.5 + t * 1.6,
          2.25 + t * 0.8,
          -4.8 - t * 1.5
        );
      } else if (ch === 3) {
        // Chapter 3: Camera descends to the 3D Stratified Terrain Block on the right
        const t = Math.max(0, Math.min(1, terrP));
        targetCamPos.set(-0.28, 0.05, 6.85 - t * 0.2);
        targetLookAt.set(-0.24, 0.0, 1.4);

        // Push Earth limb lower/back so the 3D terrain block sits in clear dark space on the right
        earthGroup.position.lerp(new THREE.Vector3(-1.35, -3.95, -1.2), 0.12);
      } else if (ch === 4) {
        // Chapter 4: Planetary Comparison (Earth on left, Moon or Mars on right)
        targetCamPos.set(0, 0.1, 6.8);
        targetLookAt.set(0, -0.15, 0);

        earthGroup.position.lerp(new THREE.Vector3(-2.35, -1.85, -0.4), 0.08);

        if (body === "Moon") {
          moonMesh.position.lerp(new THREE.Vector3(2.25, 0.45, 2.3), 0.08);
          marsMesh.position.lerp(new THREE.Vector3(5.8, 2.6, -5.5), 0.08);
        } else {
          marsMesh.position.lerp(new THREE.Vector3(2.25, 0.45, 2.5), 0.08);
          moonMesh.position.lerp(new THREE.Vector3(-5.8, 2.6, -5.5), 0.08);
        }
      } else {
        // Chapter 5: High orbital pullback for Explorer transition
        targetCamPos.set(0, 0.6, 9.6);
        targetLookAt.set(0, -0.6, 0);
        earthGroup.position.lerp(new THREE.Vector3(0, -3.35, 0), 0.08);
        moonMesh.position.lerp(new THREE.Vector3(-4.2, 1.8, -2.5), 0.08);
        marsMesh.position.lerp(new THREE.Vector3(4.4, 2.1, -4.5), 0.08);
      }

      const lerpFactor = prefersReducedMotion ? 0.25 : 0.09;
      currentCamPos.lerp(targetCamPos, lerpFactor);
      currentLookAt.lerp(targetLookAt, lerpFactor);
      camera.position.copy(currentCamPos);
      camera.lookAt(currentLookAt);

      // Starfield parallax
      starField.position.y = p * 3.1;
      starField.position.z = p * 2.5;
      if (!prefersReducedMotion) {
        starField.rotation.y = elapsed * 0.006;
      }

      // Earth axial & scroll rotation
      earthMesh.rotation.y =
        (prefersReducedMotion ? 0 : elapsed * 0.028) + p * 2.1;

      if (!prefersReducedMotion) {
        moonMesh.rotation.y = elapsed * 0.05 + p * 1.4;
        marsMesh.rotation.y = elapsed * 0.045 + p * 1.6;
      }

      // Chapter 3 Volumetric 3D Terrain Layers: 100% deterministic reversible f(t) scroll cycle
      const tTerr = ch === 3 ? Math.max(0, Math.min(1, terrP)) : ch < 3 ? 0 : 1;
      const showTerrain = ch === 3 && tTerr > 0.002 && tTerr < 0.998;
      if (showTerrain && !terrainRefs) {
        ensureTerrainBuilt();
      }
      terrainGroup.visible = showTerrain && terrainRefs !== null;

      const smooth01 = (v: number) => {
        const c = Math.max(0, Math.min(1, v));
        return c * c * (3 - 2 * c);
      };

      // Pure deterministic f(t):
      // t <= 0.0: off-screen below (-4.8), gap = 0
      // 0.0 -> 0.25: organic entry to center-right (-0.06), gap = 0 (compact single block)
      // 0.25 -> 0.75: vertical deployment (gap 0 -> 0.62)
      // 0.75 -> 1.0: smooth upward exit off-screen (+5.2)
      const maxGap = 0.62;
      let targetY = -4.8;
      let targetGap = 0;
      if (tTerr <= 0.25) {
        const u = smooth01(tTerr / 0.25);
        targetY = THREE.MathUtils.lerp(-4.8, -0.06, u);
        targetGap = 0;
      } else if (tTerr <= 0.75) {
        const u = smooth01((tTerr - 0.25) / 0.5);
        targetY = -0.06;
        targetGap = u * maxGap;
      } else {
        const u = smooth01((tTerr - 0.75) / 0.25);
        targetY = THREE.MathUtils.lerp(-0.06, 5.2, u);
        targetGap = maxGap;
      }

      terrainGroup.position.x = 1.52;
      terrainGroup.position.z = 1.45;
      terrainGroup.position.y = THREE.MathUtils.lerp(
        terrainGroup.position.y,
        targetY,
        0.25
      );
      terrainGroup.scale.setScalar(0.84);

      if (showTerrain && terrainRefs) {
        const {
          layer1Surface,
          layer2Relief,
          layer3Geology,
          layer4Subsurface,
          lavaGlowLight,
        } = terrainRefs;
        const deployRatio = targetGap / maxGap;
        const reliefScaleZ = 0.14 + deployRatio * 0.86;
        layer2Relief.group.scale.z = THREE.MathUtils.lerp(
          layer2Relief.group.scale.z,
          reliefScaleZ,
          0.25
        );
        layer3Geology.group.scale.z = THREE.MathUtils.lerp(
          layer3Geology.group.scale.z,
          reliefScaleZ,
          0.25
        );
        layer4Subsurface.group.scale.z = THREE.MathUtils.lerp(
          layer4Subsurface.group.scale.z,
          reliefScaleZ,
          0.25
        );

        const compactStep = 0.05 + targetGap;
        layer1Surface.group.position.z = THREE.MathUtils.lerp(
          layer1Surface.group.position.z,
          0.08 + targetGap * 1.45,
          0.25
        );
        layer2Relief.group.position.z = THREE.MathUtils.lerp(
          layer2Relief.group.position.z,
          0.01 + compactStep * 0.45,
          0.25
        );
        layer3Geology.group.position.z = THREE.MathUtils.lerp(
          layer3Geology.group.position.z,
          -0.06 - compactStep * 0.52,
          0.25
        );
        layer4Subsurface.group.position.z = THREE.MathUtils.lerp(
          layer4Subsurface.group.position.z,
          -0.13 - targetGap * 1.48,
          0.25
        );

        // Rotate terrain block deterministically with tTerr (+ subtle ambient breathing)
        terrainGroup.rotation.z =
          0.52 +
          deployRatio * 0.42 +
          (prefersReducedMotion ? 0 : Math.sin(elapsed * 0.35) * 0.04);

        const ensureSolidStratum = (stratum: {
          surfaceMat: THREE.MeshStandardMaterial;
          atmoVeilUniforms: { uOpacity: { value: number } } | null;
          sideMat: THREE.MeshStandardMaterial;
        }) => {
          stratum.surfaceMat.transparent = false;
          stratum.surfaceMat.opacity = 1.0;
          stratum.sideMat.transparent = false;
          stratum.sideMat.opacity = 1.0;
          if (stratum.atmoVeilUniforms) {
            stratum.atmoVeilUniforms.uOpacity.value = 0.22;
          }
        };

        ensureSolidStratum(layer1Surface);
        ensureSolidStratum(layer2Relief);
        ensureSolidStratum(layer3Geology);
        ensureSolidStratum(layer4Subsurface);

        lavaGlowLight.intensity = 0.95;
      }

      renderer.render(scene, camera);
    };

    renderLoop();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      disposed = true;
      if (idleHandle !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== null) {
        globalThis.clearTimeout(timeoutHandle);
      }
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(animationFrameId);
      starGeo.dispose();
      starMat.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      moonGeo.dispose();
      moonMat.dispose();
      marsGeo.dispose();
      marsMat.dispose();
      for (const item of terrainDisposables) {
        item.dispose();
      }
      deferredTextures?.dispose();
      earthTexture.dispose();
      moonTexture.dispose();
      marsTexture.dispose();
      renderer.dispose();
    };
  }, [isLowPowerDevice]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#050B13]"
      aria-hidden="true"
    >
      {webglSupported ? (
        <div ref={containerRef} className="h-full w-full" />
      ) : (
        <div className="flex h-full w-full items-end justify-center opacity-40">
          <div className="h-[480px] w-[480px] rounded-full border-t border-[#00D9F5]/40 bg-gradient-to-b from-[#00D9F5]/15 to-transparent blur-xl" />
        </div>
      )}

      {/* Subtle left-side editorial gradient so typography is crisp without darkening the globe */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(5,11,19,0.52) 0%, rgba(5,11,19,0.16) 40%, transparent 72%)",
        }}
      />
    </div>
  );
}
