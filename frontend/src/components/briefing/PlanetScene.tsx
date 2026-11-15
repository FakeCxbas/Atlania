"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

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

    // Physically convincing space illumination: strong solar key light + deep space fill
    const ambientLight = new THREE.AmbientLight(0x0f172a, 0.95);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 3.2);
    sunLight.position.set(8, 6, 7);
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

    const earthshineLight = new THREE.DirectionalLight(0x00d9f5, 1.15);
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

    // 5. Chapter 3 Volumetric 4-Layer 3D Terrain Block (Surface/Climate, Relief/DEM, Geology, Subsurface)
    const terrainGroup = new THREE.Group();
    terrainGroup.position.set(1.18, 0.02, 2.25);
    terrainGroup.rotation.x = -1.16;
    terrainGroup.rotation.z = 0.58;
    terrainGroup.visible = false;
    scene.add(terrainGroup);

    const gridSegs = isLowPowerDevice ? 28 : 44;
    const slabSize = 2.0;

    // Shared procedural terrain elevation function (volcanic ridge + crater depression)
    const evalHeight = (x: number, y: number, scale: number, phase: number) => {
      const r = Math.sqrt(x * x + y * y);
      const craterRing = Math.exp(-Math.pow(r - 0.72, 2) * 4.5) * 0.32;
      const ridge =
        Math.sin(x * 1.85 + phase) * Math.cos(y * 1.75 + phase) * 0.18;
      return (craterRing + ridge) * scale;
    };

    const createVolumetricStratum = (
      colorHex: number,
      wireColorHex: number,
      heightScale: number,
      slabThickness: number,
      phase: number
    ) => {
      const group = new THREE.Group();

      // Top displaced surface
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
        pos.setZ(i, evalHeight(x, y, heightScale, phase));
      }
      topGeo.computeVertexNormals();

      const surfaceMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.52,
        metalness: 0.14,
        transparent: true,
        opacity: 0.86,
        side: THREE.DoubleSide,
      });
      const surfaceMesh = new THREE.Mesh(topGeo, surfaceMat);
      surfaceMesh.castShadow = !isLowPowerDevice;
      surfaceMesh.receiveShadow = !isLowPowerDevice;
      group.add(surfaceMesh);

      // Contour / wireframe overlay
      const wireMat = new THREE.MeshBasicMaterial({
        color: wireColorHex,
        wireframe: true,
        transparent: true,
        opacity: 0.38,
      });
      const wireMesh = new THREE.Mesh(topGeo, wireMat);
      wireMesh.position.z = 0.008;
      group.add(wireMesh);

      // 3D Volumetric Side Block (gives real slab thickness & depth)
      const boxGeo = new THREE.BoxGeometry(
        slabSize,
        slabSize,
        slabThickness,
        4,
        4,
        1
      );
      const sideMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.75,
        metalness: 0.08,
        transparent: true,
        opacity: 0.42,
      });
      const sideBox = new THREE.Mesh(boxGeo, sideMat);
      sideBox.position.z = -slabThickness * 0.55;
      sideBox.castShadow = !isLowPowerDevice;
      sideBox.receiveShadow = !isLowPowerDevice;
      group.add(sideBox);

      return { group, surfaceMat, wireMat, sideMat };
    };

    // Layer 1 (Top): Superficie y Atmósfera / Clima NASA POWER (#38BDF8)
    const layer1Surface = createVolumetricStratum(
      0x0ea5e9,
      0x38bdf8,
      0.35,
      0.04,
      0.0
    );
    // Layer 2: Relieve y Topografía DEM Copernicus GLO-90 (#00D9F5)
    const layer2Relief = createVolumetricStratum(
      0x00d9f5,
      0xe0f2fe,
      1.15,
      0.11,
      0.4
    );
    // Layer 3: Geología y Litología (#F5B82E)
    const layer3Geology = createVolumetricStratum(
      0xd97706,
      0xf5b82e,
      0.65,
      0.16,
      1.2
    );
    // Layer 4 (Bottom): Subsuelo, Criósfera y Tubos de Lava (#E07A5F)
    const layer4Subsurface = createVolumetricStratum(
      0x9a3412,
      0xe07a5f,
      0.35,
      0.22,
      2.1
    );

    // Add schematic subterranean lava tube cylinder inside Layer 4
    const tubeGeo = new THREE.CylinderGeometry(0.11, 0.11, slabSize * 0.92, 20);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x00d9f5,
      emissive: 0x00d9f5,
      emissiveIntensity: 0.35,
      wireframe: true,
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    tubeMesh.rotation.z = Math.PI / 4;
    tubeMesh.position.z = -0.08;
    layer4Subsurface.group.add(tubeMesh);

    // Vertical corner guide pillars connecting the 4 strata in 3D
    const pillarGeo = new THREE.BufferGeometry();
    const half = slabSize * 0.49;
    const pillarVerts = new Float32Array([
      -half, -half, -1.2, -half, -half, 1.2,
       half, -half, -1.2,  half, -half, 1.2,
       half,  half, -1.2,  half,  half, 1.2,
      -half,  half, -1.2, -half,  half, 1.2,
    ]);
    pillarGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(pillarVerts, 3)
    );
    const pillarMat = new THREE.LineBasicMaterial({
      color: 0x00d9f5,
      transparent: true,
      opacity: 0.28,
    });
    const pillarLines = new THREE.LineSegments(pillarGeo, pillarMat);
    terrainGroup.add(pillarLines);

    terrainGroup.add(layer1Surface.group);
    terrainGroup.add(layer2Relief.group);
    terrainGroup.add(layer3Geology.group);
    terrainGroup.add(layer4Subsurface.group);

    // Smooth camera & object interpolation vectors
    const currentCamPos = new THREE.Vector3(0, 0.35, 9.2);
    const targetCamPos = new THREE.Vector3(0, 0.35, 9.2);
    const currentLookAt = new THREE.Vector3(0, -0.5, 0);
    const targetLookAt = new THREE.Vector3(0, -0.5, 0);

    const targetEarthPos = new THREE.Vector3(0.35, -3.15, 0.2);
    const targetMoonPos = new THREE.Vector3(-4.35, 1.85, -2.4);
    const targetMarsPos = new THREE.Vector3(4.5, 2.25, -4.8);
    let targetMoonScale = 1;
    let targetMarsScale = 1;
    let targetAtmoIntensity = 1.05;

    let terrainPresence = 0;
    let currentSep = 0.1;
    const stratumFocusOpacity: Record<1 | 2 | 3 | 4, number> = {
      1: 1,
      2: 1,
      3: 1,
      4: 1,
    };

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
      if (ch <= 2) {
        // Chapters 1 & 2 shared continuous orbital approach:
        const t = Math.max(0, Math.min(1, introP));
        targetCamPos.set(0.18 * t, 0.35 - t * 0.55, 9.2 - t * 4.25);
        targetLookAt.set(0.25 * t, -0.55 - t * 0.35, 0);

        targetEarthPos.set(
          THREE.MathUtils.lerp(0.35, 0.75, t),
          THREE.MathUtils.lerp(-3.15, -2.05, t),
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
        // Chapter 3: Camera descends to the 3D Stratified Terrain Block on the right
        const t = Math.max(0, Math.min(1, terrP));
        targetCamPos.set(0.1, 0.05, 5.35 - t * 0.25);
        targetLookAt.set(0.15, 0.0, 1.5);

        targetEarthPos.set(-1.35, -3.95, -1.2);
        targetAtmoIntensity = 1.35;

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
          targetMarsScale = 1.12;
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
        targetMarsScale = 0.95;
      }

      const camDamp = dampFactor(dt, 4.8);
      const bodyDamp = dampFactor(dt, 4.2);

      currentCamPos.lerp(targetCamPos, camDamp);
      currentLookAt.lerp(targetLookAt, camDamp);
      camera.position.copy(currentCamPos);
      camera.lookAt(currentLookAt);

      earthGroup.position.lerp(targetEarthPos, bodyDamp);
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

      // Chapter 3 Volumetric 3D Terrain Layers smooth enter / exit & separation
      const targetPresence = ch === 3 ? 1 : 0;
      const terrainDamp = dampFactor(dt, ch === 3 ? 4.2 : 5.5);
      terrainPresence = THREE.MathUtils.lerp(
        terrainPresence,
        targetPresence,
        terrainDamp
      );

      const isTerrainVisible = terrainPresence > 0.008;
      terrainGroup.visible = isTerrainVisible;

      if (isTerrainVisible) {
        const easedPresence = easeOutCubic(
          Math.max(0, Math.min(1, terrainPresence))
        );
        currentSep = THREE.MathUtils.lerp(
          currentSep,
          Math.max(0, Math.min(1, sep)),
          dampFactor(dt, 5.2)
        );

        terrainGroup.scale.setScalar(0.62 + 0.38 * easedPresence);
        terrainGroup.position.set(
          1.18 + (1 - easedPresence) * 1.25,
          0.02 - (1 - easedPresence) * 0.35,
          2.25 - (1 - easedPresence) * 1.4
        );

        // Vertical spacing between adjacent strata in 3D space: from 0.22 (compact) to 0.78 (expanded)
        const stepZ = 0.22 + currentSep * 0.56;
        const stratumDamp = dampFactor(dt, 6.0);

        layer1Surface.group.position.z = THREE.MathUtils.lerp(
          layer1Surface.group.position.z,
          stepZ * 1.5,
          stratumDamp
        );
        layer2Relief.group.position.z = THREE.MathUtils.lerp(
          layer2Relief.group.position.z,
          stepZ * 0.5,
          stratumDamp
        );
        layer3Geology.group.position.z = THREE.MathUtils.lerp(
          layer3Geology.group.position.z,
          -stepZ * 0.5,
          stratumDamp
        );
        layer4Subsurface.group.position.z = THREE.MathUtils.lerp(
          layer4Subsurface.group.position.z,
          -stepZ * 1.5,
          stratumDamp
        );

        // Rotate terrain block gently with scroll + time to reveal 3D relief & thickness
        terrainGroup.rotation.z =
          0.52 +
          currentSep * 0.38 +
          (1 - easedPresence) * 0.22 +
          (prefersReducedMotion ? 0 : Math.sin(elapsed * 0.35) * 0.06);

        pillarMat.opacity = 0.28 * easedPresence;

        const applyFocusOpacity = (
          stratum: {
            group: THREE.Group;
            surfaceMat: THREE.MeshStandardMaterial;
            wireMat: THREE.MeshBasicMaterial;
            sideMat: THREE.MeshStandardMaterial;
          },
          idx: 1 | 2 | 3 | 4
        ) => {
          const active = fLayer === 0 || fLayer === idx;
          const targetFocus = active ? 1 : 0.16;
          stratumFocusOpacity[idx] = THREE.MathUtils.lerp(
            stratumFocusOpacity[idx],
            targetFocus,
            stratumDamp
          );
          const fAlpha = stratumFocusOpacity[idx] * easedPresence;
          stratum.surfaceMat.opacity = 0.88 * fAlpha;
          stratum.wireMat.opacity = 0.45 * fAlpha;
          stratum.sideMat.opacity = 0.46 * fAlpha;

          const targetStratumScale = active && fLayer !== 0 ? 1.04 : 1.0;
          const nextScale = THREE.MathUtils.lerp(
            stratum.group.scale.x,
            targetStratumScale,
            stratumDamp
          );
          stratum.group.scale.setScalar(nextScale);
        };

        applyFocusOpacity(layer1Surface, 1);
        applyFocusOpacity(layer2Relief, 2);
        applyFocusOpacity(layer3Geology, 3);
        applyFocusOpacity(layer4Subsurface, 4);
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
      tubeGeo.dispose();
      tubeMat.dispose();
      pillarGeo.dispose();
      pillarMat.dispose();
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
