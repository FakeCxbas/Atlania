"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  applyStratumPbrShader,
  createTerrainStrataTextures,
  evalTerrainHeight,
  type StratumShaderMode,
  type StratumTextureSet,
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

  // Generate high-resolution procedural geological & topographic PBR textures once per mount
  const strataTextures = useMemo(() => {
    if (typeof document === "undefined") return null;
    return createTerrainStrataTextures(isLowPowerDevice ? 512 : 1024);
  }, [isLowPowerDevice]);

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

    // Cinematic lighting: warm/neutral lateral key light + cool sky/ground HemisphereLight + rim fill
    const ambientLight = new THREE.AmbientLight(0x0f172a, 0.45);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x0b1120, 0.78);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff6e5, 3.4);
    sunLight.position.set(7.5, 5.5, 6.5);
    if (!isLowPowerDevice) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 1;
      sunLight.shadow.camera.far = 25;
      const d = 4.5;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.bias = -0.0004;
      sunLight.shadow.normalBias = 0.015;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
    }
    scene.add(sunLight);

    const earthshineLight = new THREE.DirectionalLight(0x38bdf8, 1.05);
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

    // 3. Dominant 3D Earth Group with Fresnel Atmosphere Shader
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
      roughness: 0.58,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.rotation.z = 0.18;
    earthGroup.add(earthMesh);

    // Custom Fresnel Atmospheric Scattering Shader
    const atmoUniforms = {
      uAtmosphereColor: { value: new THREE.Color(0x00d9f5) },
      uHorizonColor: { value: new THREE.Color(0x38bdf8) },
      uIntensity: { value: 1.05 },
    };
    const atmoGeo = new THREE.SphereGeometry(
      earthRadius * 1.038,
      sphereSegments,
      sphereSegments
    );
    const atmoMat = new THREE.ShaderMaterial({
      uniforms: atmoUniforms,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uAtmosphereColor;
        uniform vec3 uHorizonColor;
        uniform float uIntensity;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec3 viewDir = normalize(vViewPosition);
          float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.6);
          vec3 col = mix(uHorizonColor, uAtmosphereColor, fresnel);
          gl_FragColor = vec4(col, fresnel * 0.68 * uIntensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    earthGroup.add(atmoMesh);

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

    // 5. Chapter 3 High-Density Photorealistic 4-Layer 3D Terrain Block
    const terrainGroup = new THREE.Group();
    terrainGroup.position.set(1.18, 0.02, 2.25);
    terrainGroup.rotation.x = -1.16;
    terrainGroup.rotation.z = 0.58;
    terrainGroup.visible = false;
    scene.add(terrainGroup);

    const gridSegs = isLowPowerDevice ? 128 : 180;
    const slabSize = 2.0;
    const terrainDisposables: Array<{ dispose: () => void }> = [];

    // Builds 4 watertight vertical cross-section walls matching the 180x180 top terrain edge contour
    const buildSkirtGeometry = (
      size: number,
      segs: number,
      heightScale: number,
      phase: number,
      bottomZ: number
    ) => {
      const halfSize = size * 0.5;
      const positions: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];
      let vertOffset = 0;

      const addWall = (
        getCoord: (t: number) => [number, number],
        uOffset: number
      ) => {
        for (let i = 0; i <= segs; i++) {
          const t = i / segs;
          const [wx, wy] = getCoord(t);
          const topZ = evalTerrainHeight(wx, wy, heightScale, phase);
          const u = uOffset + t;
          positions.push(wx, wy, topZ, wx, wy, bottomZ);
          uvs.push(u, 1, u, 0);
        }
        for (let i = 0; i < segs; i++) {
          const a = vertOffset + i * 2;
          const b = a + 1;
          const c = a + 2;
          const d = a + 3;
          indices.push(a, b, c, c, b, d);
        }
        vertOffset += (segs + 1) * 2;
      };

      // Front (-Y), Right (+X), Back (+Y), Left (-X)
      addWall((t) => [-halfSize + t * size, -halfSize], 0);
      addWall((t) => [halfSize, -halfSize + t * size], 1);
      addWall((t) => [halfSize - t * size, halfSize], 2);
      addWall((t) => [-halfSize, halfSize - t * size], 3);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
      );
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return geo;
    };

    const createRealisticStratum = (options: {
      fallbackColor: number;
      heightScale: number;
      slabThickness: number;
      phase: number;
      roughness: number;
      normalScale: number;
      shaderMode: StratumShaderMode;
      topTextures?: StratumTextureSet;
      sideTextures?: StratumTextureSet;
      atmosphereVeil?: boolean;
    }) => {
      const group = new THREE.Group();

      const topGeo = new THREE.PlaneGeometry(
        slabSize,
        slabSize,
        gridSegs,
        gridSegs
      );
      const pos = topGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        pos.setZ(i, evalTerrainHeight(x, y, options.heightScale, options.phase));
      }
      topGeo.computeVertexNormals();
      terrainDisposables.push(topGeo);

      const surfaceMat = new THREE.MeshStandardMaterial({
        color: options.topTextures ? 0xffffff : options.fallbackColor,
        map: options.topTextures?.map ?? null,
        normalMap: options.topTextures?.normalMap ?? null,
        normalScale: new THREE.Vector2(options.normalScale, options.normalScale),
        roughnessMap: options.topTextures?.roughnessMap ?? null,
        roughness: options.roughness,
        metalness: 0.04,
        transparent: true,
        opacity: 0.98,
        side: THREE.DoubleSide,
      });
      applyStratumPbrShader(surfaceMat, options.shaderMode);
      terrainDisposables.push(surfaceMat);

      const surfaceMesh = new THREE.Mesh(topGeo, surfaceMat);
      surfaceMesh.castShadow = !isLowPowerDevice;
      surfaceMesh.receiveShadow = !isLowPowerDevice;
      group.add(surfaceMesh);

      // Subtle translucent atmospheric veil floating above Layer 1 (no wireframe borders)
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

      // Watertight geological cross-section skirt walls (180-segment perimeter)
      const bottomZ = -options.slabThickness;
      const skirtGeo = buildSkirtGeometry(
        slabSize,
        gridSegs,
        options.heightScale,
        options.phase,
        bottomZ
      );
      terrainDisposables.push(skirtGeo);

      const sideMat = new THREE.MeshStandardMaterial({
        color: options.sideTextures ? 0xffffff : options.fallbackColor,
        map: options.sideTextures?.map ?? null,
        normalMap: options.sideTextures?.normalMap ?? null,
        normalScale: new THREE.Vector2(options.normalScale * 0.85, options.normalScale * 0.85),
        roughnessMap: options.sideTextures?.roughnessMap ?? null,
        roughness: 0.86,
        metalness: 0.04,
        transparent: true,
        opacity: 0.98,
        side: THREE.DoubleSide,
      });
      applyStratumPbrShader(
        sideMat,
        options.shaderMode === "subsurface" ? "subsurface" : "geology"
      );
      terrainDisposables.push(sideMat);

      const skirtMesh = new THREE.Mesh(skirtGeo, sideMat);
      skirtMesh.castShadow = !isLowPowerDevice;
      skirtMesh.receiveShadow = !isLowPowerDevice;
      group.add(skirtMesh);

      return {
        group,
        surfaceMat,
        atmoVeilUniforms,
        sideMat,
      };
    };

    // Layer 1 (Top): Superficie y Atmósfera / Clima NASA POWER
    const layer1Surface = createRealisticStratum({
      fallbackColor: 0x8b6b4a,
      heightScale: 0.45,
      slabThickness: 0.09,
      phase: 0.0,
      roughness: 0.86,
      normalScale: 1.15,
      shaderMode: "surface",
      topTextures: strataTextures?.layer1,
      sideTextures: strataTextures?.layer3,
      atmosphereVeil: true,
    });

    // Layer 2: Relieve y Topografía DEM Copernicus GLO-90 (sculpted 6-octave ridged mountains & canyons)
    const layer2Relief = createRealisticStratum({
      fallbackColor: 0x9a6b42,
      heightScale: 1.32,
      slabThickness: 0.16,
      phase: 0.35,
      roughness: 0.88,
      normalScale: 1.65,
      shaderMode: "relief",
      topTextures: strataTextures?.layer2,
      sideTextures: strataTextures?.layer3,
    });

    // Layer 3: Geología y Litología (triplanar sedimentary & volcanic strata in surface & cross-section)
    const layer3Geology = createRealisticStratum({
      fallbackColor: 0xb4692e,
      heightScale: 0.68,
      slabThickness: 0.28,
      phase: 1.15,
      roughness: 0.84,
      normalScale: 1.45,
      shaderMode: "geology",
      topTextures: strataTextures?.layer3,
      sideTextures: strataTextures?.layer3,
    });

    // Layer 4 (Bottom): Subsuelo, Criósfera y Tubos de Lava
    const layer4Subsurface = createRealisticStratum({
      fallbackColor: 0x1e222b,
      heightScale: 0.34,
      slabThickness: 0.32,
      phase: 2.05,
      roughness: 0.88,
      normalScale: 1.5,
      shaderMode: "subsurface",
      topTextures: strataTextures?.layer4,
      sideTextures: strataTextures?.layer4,
    });

    // Realistic organic subterranean lava tube conduits visible in Layer 4 cross-section
    const mainTubeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.98, -0.32, -0.16),
      new THREE.Vector3(-0.34, -0.06, -0.14),
      new THREE.Vector3(0.32, 0.2, -0.17),
      new THREE.Vector3(0.98, 0.4, -0.15),
    ]);
    const tubeGeo = new THREE.TubeGeometry(mainTubeCurve, 40, 0.095, 18, false);

    const branchTubeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.15, -0.02, -0.15),
      new THREE.Vector3(0.18, -0.45, -0.17),
      new THREE.Vector3(0.62, -0.96, -0.16),
    ]);
    const branchTubeGeo = new THREE.TubeGeometry(
      branchTubeCurve,
      28,
      0.065,
      14,
      false
    );

    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x2b211f,
      map: strataTextures?.lavaTube.map ?? null,
      normalMap: strataTextures?.lavaTube.normalMap ?? null,
      normalScale: new THREE.Vector2(1.2, 1.2),
      emissive: 0xf97316,
      emissiveMap: strataTextures?.lavaTube.emissiveMap ?? null,
      emissiveIntensity: 0.95,
      roughness: 0.82,
      metalness: 0.06,
      transparent: true,
      opacity: 0.98,
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    const branchTubeMesh = new THREE.Mesh(branchTubeGeo, tubeMat);

    // Subtle warm thermal light inside the lava tube cavity
    const lavaGlowLight = new THREE.PointLight(0xf97316, 0.85, 1.9, 2);
    lavaGlowLight.position.set(0.1, 0.05, -0.14);
    layer4Subsurface.group.add(tubeMesh, branchTubeMesh, lavaGlowLight);
    terrainDisposables.push(branchTubeGeo);

    terrainGroup.add(layer1Surface.group);
    terrainGroup.add(layer2Relief.group);
    terrainGroup.add(layer3Geology.group);
    terrainGroup.add(layer4Subsurface.group);

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
        layerSeparation: sep,
        comparisonBody: body,
        focusedLayer: fLayer,
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
        atmoUniforms.uIntensity.value = 1.05 + t * 0.65;

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
        targetCamPos.set(0.1, 0.05, 5.35 - t * 0.25);
        targetLookAt.set(0.15, 0.0, 1.5);

        // Push Earth limb lower/back so the 3D terrain block sits in clear dark space on the right
        earthGroup.position.lerp(new THREE.Vector3(-1.35, -3.95, -1.2), 0.12);
        atmoUniforms.uIntensity.value = 1.35;
      } else if (ch === 4) {
        // Chapter 4: Planetary Comparison (Earth on left, Moon or Mars on right)
        targetCamPos.set(0, 0.1, 6.8);
        targetLookAt.set(0, -0.15, 0);

        earthGroup.position.lerp(new THREE.Vector3(-2.35, -1.85, -0.4), 0.08);
        atmoUniforms.uIntensity.value = 1.2;

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

      // Chapter 3 Volumetric 3D Terrain Layers separation & rotation
      const showTerrain = ch === 3;
      terrainGroup.visible = showTerrain;
      if (showTerrain) {
        terrainGroup.position.set(1.18, 0.02, 2.25);
        // Vertical spacing between adjacent strata in 3D space: from 0.22 (compact) to 0.78 (expanded)
        const stepZ = 0.22 + Math.max(0, Math.min(1, sep)) * 0.56;

        layer1Surface.group.position.z = THREE.MathUtils.lerp(
          layer1Surface.group.position.z,
          stepZ * 1.5,
          0.12
        );
        layer2Relief.group.position.z = THREE.MathUtils.lerp(
          layer2Relief.group.position.z,
          stepZ * 0.5,
          0.12
        );
        layer3Geology.group.position.z = THREE.MathUtils.lerp(
          layer3Geology.group.position.z,
          -stepZ * 0.5,
          0.12
        );
        layer4Subsurface.group.position.z = THREE.MathUtils.lerp(
          layer4Subsurface.group.position.z,
          -stepZ * 1.5,
          0.12
        );

        // Rotate terrain block gently with scroll + time to reveal 3D relief & thickness
        terrainGroup.rotation.z =
          0.52 +
          sep * 0.38 +
          (prefersReducedMotion ? 0 : Math.sin(elapsed * 0.35) * 0.06);

        const applyFocusOpacity = (
          stratum: {
            surfaceMat: THREE.MeshStandardMaterial;
            atmoVeilUniforms: { uOpacity: { value: number } } | null;
            sideMat: THREE.MeshStandardMaterial;
          },
          idx: 1 | 2 | 3 | 4
        ) => {
          const active = fLayer === 0 || fLayer === idx;
          stratum.surfaceMat.opacity = active ? 0.98 : 0.14;
          stratum.sideMat.opacity = active ? 0.98 : 0.12;
          if (stratum.atmoVeilUniforms) {
            stratum.atmoVeilUniforms.uOpacity.value = active ? 0.22 : 0.03;
          }
        };

        applyFocusOpacity(layer1Surface, 1);
        applyFocusOpacity(layer2Relief, 2);
        applyFocusOpacity(layer3Geology, 3);
        applyFocusOpacity(layer4Subsurface, 4);

        const layer4Active = fLayer === 0 || fLayer === 4;
        tubeMat.opacity = layer4Active ? 0.98 : 0.18;
        lavaGlowLight.intensity = layer4Active ? 0.85 : 0.1;
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
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(animationFrameId);
      starGeo.dispose();
      starMat.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      atmoGeo.dispose();
      atmoMat.dispose();
      moonGeo.dispose();
      moonMat.dispose();
      marsGeo.dispose();
      marsMat.dispose();
      for (const item of terrainDisposables) {
        item.dispose();
      }
      strataTextures?.dispose();
      tubeGeo.dispose();
      tubeMat.dispose();
      earthTexture.dispose();
      moonTexture.dispose();
      marsTexture.dispose();
      renderer.dispose();
    };
  }, [isLowPowerDevice, strataTextures]);

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

      {/* Subtle left-side editorial gradient so large typography is crisp without boxes */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(5,11,19,0.78) 0%, rgba(5,11,19,0.38) 48%, rgba(5,11,19,0.12) 100%)",
        }}
      />
    </div>
  );
}
