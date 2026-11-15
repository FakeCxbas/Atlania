"use client";

import React, { useEffect, useRef, useState } from "react";
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
    const isLowPowerDevice =
      typeof navigator !== "undefined" &&
      navigator.hardwareConcurrency !== undefined &&
      navigator.hardwareConcurrency <= 4;

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

    // Physically convincing space illumination: single warm solar key light + subtle deep-space fill
    const sunDirection = new THREE.Vector3(9.5, 6.8, 2.2).normalize();

    const ambientLight = new THREE.AmbientLight(0x0b1120, 0.52);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff4dc, 3.6);
    sunLight.position.copy(sunDirection).multiplyScalar(14);
    if (!isLowPowerDevice) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 1;
      sunLight.shadow.camera.far = 25;
      const d = 4.5;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.bias = -0.001;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
    }
    scene.add(sunLight);

    const spaceFillLight = new THREE.DirectionalLight(0x475569, 0.34);
    spaceFillLight.position.set(-7, -3, 4);
    scene.add(spaceFillLight);

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

    // 2. Load NASA Textures with instant frame-0 procedural fallback so planets appear at 0ms
    const makeInstantFallbackTex = (c1: string, c2: string) => {
      const c = document.createElement("canvas");
      c.width = 64;
      c.height = 32;
      const ctx = c.getContext("2d");
      if (ctx) {
        const g = ctx.createLinearGradient(0, 0, 64, 32);
        g.addColorStop(0, c1);
        g.addColorStop(0.55, c2);
        g.addColorStop(1, c1);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 32);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const textureLoader = new THREE.TextureLoader();
    const earthFallback = makeInstantFallbackTex("#0c2d48", "#1f5f5b");
    const moonFallback = makeInstantFallbackTex("#64748b", "#94a3b8");
    const marsFallback = makeInstantFallbackTex("#7c2d12", "#c2410c");
    const earthTexture = earthFallback;
    const moonTexture = moonFallback;
    const marsTexture = marsFallback;

    textureLoader.load("/nasa/earth-equirectangular.jpg", (tex) => {
      if (disposed) {
        tex.dispose();
        return;
      }
      tex.colorSpace = THREE.SRGBColorSpace;
      earthMat.map = tex;
      earthMat.needsUpdate = true;
    });
    textureLoader.load("/nasa/moon-equirectangular.jpg", (tex) => {
      if (disposed) {
        tex.dispose();
        return;
      }
      tex.colorSpace = THREE.SRGBColorSpace;
      moonMat.map = tex;
      moonMat.needsUpdate = true;
    });
    textureLoader.load("/nasa/mars-equirectangular.jpg", (tex) => {
      if (disposed) {
        tex.dispose();
        return;
      }
      tex.colorSpace = THREE.SRGBColorSpace;
      marsMat.map = tex;
      marsMat.needsUpdate = true;
    });

    // 3. Dominant 3D Earth Group with Fresnel Atmosphere Shader
    const earthGroup = new THREE.Group();
    earthGroup.position.set(0, -1.65, 0.2);
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
      roughness: 0.62,
      metalness: 0.08,
      transparent: true,
      opacity: 1,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.rotation.z = 0.18;
    earthMesh.rotation.y = -1.35;
    earthGroup.add(earthMesh);

    // Sun-aligned Volumetric Atmospheric & Rim Scattering Helper
    const createVolumetricScatterMat = (opts: {
      horizonColor: number;
      atmosphereColor: number;
      terminatorColor: number;
      intensity: number;
      fresnelPower: number;
      nightFloor: number;
    }) => {
      const uniforms = {
        uSunDir: { value: sunDirection },
        uHorizonColor: { value: new THREE.Color(opts.horizonColor) },
        uAtmosphereColor: { value: new THREE.Color(opts.atmosphereColor) },
        uTerminatorColor: { value: new THREE.Color(opts.terminatorColor) },
        uIntensity: { value: opts.intensity },
        uPower: { value: opts.fresnelPower },
        uNightFloor: { value: opts.nightFloor },
      };
      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
          varying vec3 vViewNormal;
          varying vec3 vWorldNormal;
          varying vec3 vViewPosition;
          void main() {
            vViewNormal = normalize(normalMatrix * normal);
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uSunDir;
          uniform vec3 uHorizonColor;
          uniform vec3 uAtmosphereColor;
          uniform vec3 uTerminatorColor;
          uniform float uIntensity;
          uniform float uPower;
          uniform float uNightFloor;
          varying vec3 vViewNormal;
          varying vec3 vWorldNormal;
          varying vec3 vViewPosition;
          void main() {
            vec3 viewDir = normalize(vViewPosition);
            float ndotv = max(dot(normalize(vViewNormal), viewDir), 0.0);
            float fresnel = pow(1.0 - ndotv, uPower);

            float sunAlign = dot(normalize(vWorldNormal), normalize(uSunDir));
            float dayMask = smoothstep(-0.32, 0.58, sunAlign);
            float terminator = smoothstep(-0.26, 0.06, sunAlign) * (1.0 - smoothstep(0.06, 0.52, sunAlign));

            vec3 baseCol = mix(uHorizonColor, uAtmosphereColor, fresnel);
            vec3 col = mix(baseCol, uTerminatorColor, terminator * 0.65);
            float edgeFade = smoothstep(0.02, 0.42, ndotv);
            float alpha = fresnel * edgeFade * mix(uNightFloor, 1.0, dayMask) * uIntensity;
            gl_FragColor = vec4(col, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide,
        depthWrite: false,
      });
      return { material, uniforms };
    };

    const { material: atmoMat, uniforms: atmoUniforms } =
      createVolumetricScatterMat({
        horizonColor: 0x38bdf8,
        atmosphereColor: 0x00d9f5,
        terminatorColor: 0xfde68a,
        intensity: 1.05,
        fresnelPower: 3.1,
        nightFloor: 0.08,
      });
    const atmoGeo = new THREE.SphereGeometry(
      earthRadius * 1.028,
      sphereSegments,
      sphereSegments
    );
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    earthGroup.add(atmoMesh);

    // 4. Moon & Mars in Distinct Depth Planes (Sun-aligned volumetric rim & dust haze)
    const moonGeo = new THREE.SphereGeometry(0.46, 40, 40);
    const moonMat = new THREE.MeshStandardMaterial({
      map: moonTexture,
      roughness: 0.9,
      metalness: 0.02,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(-4.35, 1.85, -2.4);
    const { material: moonRimMat } = createVolumetricScatterMat({
      horizonColor: 0xe2e8f0,
      atmosphereColor: 0xf8fafc,
      terminatorColor: 0xfef3c7,
      intensity: 0.42,
      fresnelPower: 4.0,
      nightFloor: 0.02,
    });
    moonMesh.add(
      new THREE.Mesh(new THREE.SphereGeometry(0.46 * 1.032, 40, 40), moonRimMat)
    );
    scene.add(moonMesh);

    // Mars: Deep-background upper-right orbital plane + dusty golden-amber atmosphere
    const marsGeo = new THREE.SphereGeometry(0.46, 40, 40);
    const marsMat = new THREE.MeshStandardMaterial({
      map: marsTexture,
      roughness: 0.78,
      metalness: 0.04,
    });
    const marsMesh = new THREE.Mesh(marsGeo, marsMat);
    marsMesh.position.set(4.5, 2.25, -4.8);
    const { material: marsAtmoMat } = createVolumetricScatterMat({
      horizonColor: 0xe07a5f,
      atmosphereColor: 0xf5b971,
      terminatorColor: 0xfef08a,
      intensity: 0.88,
      fresnelPower: 2.8,
      nightFloor: 0.05,
    });
    marsMesh.add(
      new THREE.Mesh(new THREE.SphereGeometry(0.46 * 1.048, 40, 40), marsAtmoMat)
    );
    scene.add(marsMesh);

    // 5. Chapter 3 High-Density Photorealistic 4-Layer 3D Terrain Block (deferred for instant Earth first paint)
    const terrainGroup = new THREE.Group();
    terrainGroup.position.set(1.52, -0.06, 1.45);
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

      const textures = createTerrainStrataTextures(isLowPowerDevice ? 192 : 256);
      deferredTextures = textures;
      const geos = getOrCreateStrataGeometries(gridSegs, slabSize);

      const createRealisticStratum = (options: {
        geoPair: CachedLayerGeometry;
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
        surfaceMesh.castShadow = false;
        surfaceMesh.receiveShadow = false;
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
        skirtMesh.castShadow = false;
        skirtMesh.receiveShadow = false;
        group.add(skirtMesh);

        return { group, surfaceMat, atmoVeilUniforms, sideMat };
      };

      const layer1Surface = createRealisticStratum({
        geoPair: geos.layer1,
        roughness: 0.86,
        normalScale: 1.15,
        shaderMode: "surface",
        topTextures: textures.layer1,
        sideTextures: textures.layer3,
        atmosphereVeil: true,
      });

      const layer2Relief = createRealisticStratum({
        geoPair: geos.layer2,
        roughness: 0.88,
        normalScale: 1.65,
        shaderMode: "relief",
        topTextures: textures.layer2,
        sideTextures: textures.layer3,
      });

      const layer3Geology = createRealisticStratum({
        geoPair: geos.layer3,
        roughness: 0.84,
        normalScale: 1.45,
        shaderMode: "geology",
        topTextures: textures.layer3,
        sideTextures: textures.layer3,
      });

      const layer4Subsurface = createRealisticStratum({
        geoPair: geos.layer4,
        roughness: 0.92,
        normalScale: 1.75,
        shaderMode: "subsurface",
        topTextures: textures.layer4,
        sideTextures: textures.layer4,
      });

      const lavaGlowLight = new THREE.PointLight(0xf97316, 1.05, 2.0, 2);
      lavaGlowLight.position.set(-0.22, -0.82, -0.18);
      layer4Subsurface.group.add(lavaGlowLight);

      // Local lighting scoped exclusively to the 3D terrain block (does not alter Earth/Moon/Mars)
      const terrainKeyLight = new THREE.PointLight(0xfffbeb, 4.2, 8.5, 1.1);
      terrainKeyLight.position.set(1.8, -1.6, 2.6);
      const terrainSideFillLight = new THREE.PointLight(0xdbeafe, 2.8, 8.5, 1.1);
      terrainSideFillLight.position.set(-2.2, -1.8, 1.4);
      terrainGroup.add(terrainKeyLight);
      terrainGroup.add(terrainSideFillLight);
      terrainDisposables.push(terrainKeyLight, terrainSideFillLight, lavaGlowLight);

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
    };

    // Pre-build & compile Chapter 3 terrain shaders after initial Hero & Earth paint to keep first load instant
    const warmupTimer = window.setTimeout(() => {
      if (disposed || terrainRefs) return;
      ensureTerrainBuilt();
      const prevVis = terrainGroup.visible;
      terrainGroup.visible = true;
      renderer.compile(scene, camera);
      terrainGroup.visible = prevVis;
    }, 850);

    // Luminous geodesic extraction outline anchored to the emerging crust plate.
    const fractureGroup = new THREE.Group();
    fractureGroup.position.set(1.05, -0.42, 2.65);
    fractureGroup.rotation.set(-1.16, 0, 0.74);
    fractureGroup.visible = false;
    scene.add(fractureGroup);

    const fractureGlowLight = new THREE.PointLight(0x00d9f5, 0, 3.5, 1.5);
    fractureGroup.add(fractureGlowLight);

    const fractureGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.625, -0.625, 0),
      new THREE.Vector3(0.625, -0.625, 0),
      new THREE.Vector3(0.625, 0.625, 0),
      new THREE.Vector3(-0.625, 0.625, 0),
    ]);
    const fractureMat = new THREE.LineBasicMaterial({
      color: 0x00d9f5,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    fractureGroup.add(new THREE.LineLoop(fractureGeo, fractureMat));

    // Smooth camera & object interpolation vectors
    const currentCamPos = new THREE.Vector3(0, 0.35, 9.2);
    const targetCamPos = new THREE.Vector3(0, 0.35, 9.2);
    const currentLookAt = new THREE.Vector3(0, -0.5, 0);
    const targetLookAt = new THREE.Vector3(0, -0.5, 0);

    const targetEarthPos = new THREE.Vector3(0.35, -3.15, 0.2);
    const targetMoonPos = new THREE.Vector3(-4.35, 1.85, -2.4);
    const targetMarsPos = new THREE.Vector3(4.5, 2.25, -4.8);
    let targetEarthScale = 1;
    let targetMoonScale = 1;
    let targetMarsScale = 1;
    let targetAtmoIntensity = 1.05;

    let terrainPresence = 0;
    let currentSep = 0.1;

    const dampFactor = (dt: number, speed: number) =>
      prefersReducedMotion ? 1 : 1 - Math.exp(-speed * Math.min(dt, 0.05));

    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const renderLoop = () => {
      animationFrameId = window.requestAnimationFrame(renderLoop);
      if (document.hidden) return;

      const dt = clock.getDelta();
      const elapsed = clock.elapsedTime;
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
      let targetEarthOpacity = 1;
      targetEarthScale = 1;
      if (ch <= 2) {
        // Chapters 1 & 2 shared continuous orbital approach:
        const t = Math.max(0, Math.min(1, introP));
        targetCamPos.set(0.18 * t, 0.35 - t * 0.55, 9.2 - t * 4.25);
        targetLookAt.set(0.25 * t, -0.35 - t * 0.55, 0);

        targetEarthPos.set(
          THREE.MathUtils.lerp(0, 0.75, t),
          THREE.MathUtils.lerp(-1.65, -2.05, t),
          THREE.MathUtils.lerp(0.2, 0.75, t)
        );
        targetAtmoIntensity = 1.05 + t * 0.65;

        targetMoonPos.set(
          -4.35 - t * 1.4,
          1.85 + t * 0.65,
          -2.4 - t * 1.2
        );
        targetMarsPos.set(
          4.5 + t * 1.6,
          2.25 + t * 0.8,
          -4.8 - t * 1.5
        );
        targetMoonScale = 1 - t * 0.18;
        targetMarsScale = 1 - t * 0.18;
      } else if (ch === 3) {
        // Chapter 3: Camera dives into Earth's crust as it fractures open & extracts the 3D block
        const t = Math.max(0, Math.min(1, terrP));
        targetCamPos.set(0.1, 0.05, 5.35 - t * 0.25);
        targetLookAt.set(0.15, 0.0, 1.5);

        // Earth recedes smoothly while the extracted crust plate comes forward.
        targetEarthPos.set(-0.65, -4.8, -2.4);
        targetEarthScale = 0.92;
        targetEarthOpacity = 0;
        targetAtmoIntensity = 0;

        targetMoonPos.set(-6.4, 2.8, -5.2);
        targetMarsPos.set(6.4, 3.0, -6.5);
        targetMoonScale = 0.65;
        targetMarsScale = 0.65;
      } else if (ch === 4) {
        // Chapter 4: Planetary Comparison (Earth on left, Moon or Mars on right)
        targetCamPos.set(0, 0.1, 6.8);
        targetLookAt.set(0, -0.15, 0);

        targetEarthPos.set(-2.35, -1.85, -0.4);
        targetAtmoIntensity = 1.2;

        if (body === "Moon") {
          targetMoonPos.set(2.25, 0.45, 2.3);
          targetMarsPos.set(6.2, 2.8, -6.0);
          targetMoonScale = 1.12;
          targetMarsScale = 0.62;
        } else {
          targetMarsPos.set(2.25, 0.45, 2.5);
          targetMoonPos.set(-6.2, 2.8, -6.0);
          targetMarsScale = 1.18;
          targetMoonScale = 0.62;
        }
      } else {
        // Chapter 5: High orbital pullback for Explorer transition
        targetCamPos.set(0, 0.6, 9.6);
        targetLookAt.set(0, -0.6, 0);
        targetEarthPos.set(0, -3.35, 0);
        targetAtmoIntensity = 1.1;
        targetMoonPos.set(-4.2, 1.8, -2.5);
        targetMarsPos.set(4.4, 2.1, -4.5);
        targetMoonScale = 0.95;
        targetMarsScale = 0.85;
      }

      const camDamp = dampFactor(dt, 4.8);
      const bodyDamp = dampFactor(dt, 4.2);

      currentCamPos.lerp(targetCamPos, camDamp);
      currentLookAt.lerp(targetLookAt, camDamp);
      camera.position.copy(currentCamPos);
      camera.lookAt(currentLookAt);

      earthGroup.position.lerp(targetEarthPos, bodyDamp);
      const nextEarthScale = THREE.MathUtils.lerp(
        earthGroup.scale.x,
        targetEarthScale,
        bodyDamp
      );
      earthGroup.scale.setScalar(nextEarthScale);
      earthMat.opacity = THREE.MathUtils.lerp(
        earthMat.opacity,
        targetEarthOpacity,
        bodyDamp
      );
      earthGroup.visible = earthMat.opacity > 0.01;
      atmoUniforms.uIntensity.value = THREE.MathUtils.lerp(
        atmoUniforms.uIntensity.value,
        targetAtmoIntensity,
        bodyDamp
      );

      moonMesh.position.lerp(targetMoonPos, bodyDamp);
      marsMesh.position.lerp(targetMarsPos, bodyDamp);
      const nextMoonScale = THREE.MathUtils.lerp(
        moonMesh.scale.x,
        targetMoonScale,
        bodyDamp
      );
      const nextMarsScale = THREE.MathUtils.lerp(
        marsMesh.scale.x,
        targetMarsScale,
        bodyDamp
      );
      moonMesh.scale.setScalar(nextMoonScale);
      marsMesh.scale.setScalar(nextMarsScale);

      // Starfield parallax
      starField.position.y = THREE.MathUtils.lerp(
        starField.position.y,
        p * 3.1,
        camDamp
      );
      starField.position.z = THREE.MathUtils.lerp(
        starField.position.z,
        p * 2.5,
        camDamp
      );
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

      // Chapter 3 High-Density Photorealistic 3D Terrain Strata
      const targetPresence = ch === 3 ? 1 : 0;
      const terrainDamp = dampFactor(dt, ch === 3 ? 4.2 : 5.5);
      terrainPresence = THREE.MathUtils.lerp(
        terrainPresence,
        targetPresence,
        terrainDamp
      );

      // Extraction outline brightens and fades as the crust plate emerges.
      const fractureProgress = Math.min(
        1,
        Math.max(0, (terrainPresence - 0.02) / 0.78)
      );
      const fractureBurst = Math.sin(fractureProgress * Math.PI);
      fractureGroup.visible = fractureBurst > 0.01 && !prefersReducedMotion;
      fractureGlowLight.intensity = fractureGroup.visible ? fractureBurst * 3.2 : 0;
      fractureMat.opacity = fractureBurst * 0.95;

      const isTerrainVisible = terrainPresence > 0.008;
      if (isTerrainVisible && !terrainRefs) {
        ensureTerrainBuilt();
      }
      terrainGroup.visible = isTerrainVisible && terrainRefs !== null;

      if (isTerrainVisible && terrainRefs) {
        const {
          layer1Surface,
          layer2Relief,
          layer3Geology,
          layer4Subsurface,
          lavaGlowLight,
        } = terrainRefs;

        const easedPresence = easeOutCubic(
          Math.max(0, Math.min(1, terrainPresence))
        );
        currentSep = THREE.MathUtils.lerp(
          currentSep,
          Math.max(0, Math.min(1, sep)),
          dampFactor(dt, 5.2)
        );

        const maxGap = 0.35;
        const targetGap = currentSep * maxGap * Math.max(0, (easedPresence - 0.3) / 0.7);
        const deployRatio = targetGap / maxGap;
        const stratumDamp = dampFactor(dt, 6.0);

        // Emerge directly out of the fractured crust on Earth's front surface
        terrainGroup.scale.setScalar(
          THREE.MathUtils.lerp(0.20, 0.64 - deployRatio * 0.08, easedPresence)
        );
        terrainGroup.position.set(
          THREE.MathUtils.lerp(1.05, 1.36, easedPresence),
          THREE.MathUtils.lerp(
            -0.42,
            0.12 + deployRatio * 0.12 + (fLayer > 0 ? (fLayer - 2.5) * 0.06 : 0),
            easedPresence
          ),
          THREE.MathUtils.lerp(2.65, 1.45, easedPresence)
        );

        const reliefScaleZ = 0.14 + deployRatio * 0.86;
        layer2Relief.group.scale.z = THREE.MathUtils.lerp(
          layer2Relief.group.scale.z,
          reliefScaleZ,
          stratumDamp
        );
        layer3Geology.group.scale.z = THREE.MathUtils.lerp(
          layer3Geology.group.scale.z,
          reliefScaleZ,
          stratumDamp
        );
        layer4Subsurface.group.scale.z = THREE.MathUtils.lerp(
          layer4Subsurface.group.scale.z,
          reliefScaleZ,
          stratumDamp
        );

        const compactStep = 0.05 + targetGap;
        layer1Surface.group.position.z = THREE.MathUtils.lerp(
          layer1Surface.group.position.z,
          0.08 + targetGap * 1.45,
          stratumDamp
        );
        layer2Relief.group.position.z = THREE.MathUtils.lerp(
          layer2Relief.group.position.z,
          0.01 + compactStep * 0.45,
          stratumDamp
        );
        layer3Geology.group.position.z = THREE.MathUtils.lerp(
          layer3Geology.group.position.z,
          -0.06 - compactStep * 0.52,
          stratumDamp
        );
        layer4Subsurface.group.position.z = THREE.MathUtils.lerp(
          layer4Subsurface.group.position.z,
          -0.13 - targetGap * 1.48,
          stratumDamp
        );

        terrainGroup.rotation.z =
          0.52 +
          deployRatio * 0.42 +
          (1 - easedPresence) * 0.22 +
          (prefersReducedMotion ? 0 : Math.sin(elapsed * 0.35) * 0.04);

        const applyLayerFocus = (
          stratum: BuiltStratum,
          idx: 1 | 2 | 3 | 4
        ) => {
          const isAllMode = fLayer <= 0;
          const isActive = isAllMode || fLayer === idx;
          const targetOpacity = isActive ? 1.0 : 0.18;
          const nextOpacity = THREE.MathUtils.lerp(
            stratum.surfaceMat.opacity,
            targetOpacity,
            stratumDamp
          );
          const needsTransparency = nextOpacity < 0.99;

          stratum.surfaceMat.transparent = needsTransparency;
          stratum.surfaceMat.opacity = nextOpacity;
          stratum.surfaceMat.depthWrite = !needsTransparency;
          stratum.sideMat.transparent = needsTransparency;
          stratum.sideMat.opacity = nextOpacity;
          stratum.sideMat.depthWrite = !needsTransparency;

          if (stratum.atmoVeilUniforms) {
            const atmoFactor = fLayer > 0 ? (fLayer === 1 ? 1.55 : 0.2) : 1.0;
            stratum.atmoVeilUniforms.uOpacity.value =
              0.22 * easedPresence * atmoFactor;
          }

          const targetStratumScale = fLayer > 0 ? (isActive ? 1.08 : 0.92) : 1.0;
          const nextScale = THREE.MathUtils.lerp(
            stratum.group.scale.x,
            targetStratumScale,
            stratumDamp
          );
          stratum.group.scale.x = nextScale;
          stratum.group.scale.y = nextScale;
        };

        applyLayerFocus(layer1Surface, 1);
        applyLayerFocus(layer2Relief, 2);
        applyLayerFocus(layer3Geology, 3);
        applyLayerFocus(layer4Subsurface, 4);
        const lavaFocusFactor = fLayer > 0 ? (fLayer === 4 ? 1.45 : 0.22) : 1.0;
        lavaGlowLight.intensity = 0.95 * easedPresence * lavaFocusFactor;
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
      window.clearTimeout(warmupTimer);
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
      fractureGlowLight.dispose();
      fractureGeo.dispose();
      fractureMat.dispose();
      fractureGroup.clear();
      for (const item of terrainDisposables) {
        item.dispose();
      }
      deferredTextures?.dispose();
      earthTexture.dispose();
      moonTexture.dispose();
      marsTexture.dispose();
      renderer.dispose();
    };
  }, []);

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
