"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export interface PlanetSceneProps {
  /** Normalized scroll progress across the 5 chapters [0..1] */
  scrollProgress: number;
  /** Active chapter index (1..5) */
  activeChapter: number;
  /** Normalized separation factor [0..1] for Chapter 3 3D terrain layers */
  layerSeparation: number;
  /** Active planetary comparison body in Chapter 4 ("Moon" | "Mars") */
  comparisonBody: "Moon" | "Mars";
  /** Highlighted terrain stratum index (0: all, 1: topo, 2: geo, 3: subsurface) */
  focusedLayer?: 0 | 1 | 2 | 3;
}

/**
 * Continuous 3D WebGL space & terrain stage powered by Three.js.
 * Synchronizes camera trajectory, planetary positions (Earth, Moon, Mars),
 * atmospheric parallax, and 3D schematic terrain stratification with scroll progress.
 */
export function PlanetScene({
  scrollProgress,
  activeChapter,
  layerSeparation,
  comparisonBody,
  focusedLayer = 0,
}: PlanetSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  // Store latest reactive props in a ref so the rAF loop reads them without re-initializing WebGL
  const stateRef = useRef({
    scrollProgress,
    activeChapter,
    layerSeparation,
    comparisonBody,
    focusedLayer,
  });

  useEffect(() => {
    stateRef.current = {
      scrollProgress,
      activeChapter,
      layerSeparation,
      comparisonBody,
      focusedLayer,
    };
  }, [scrollProgress, activeChapter, layerSeparation, comparisonBody, focusedLayer]);

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
    renderer.toneMappingExposure = 1.12;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      200
    );
    camera.position.set(0, 0.4, 8.8);

    // Physically inspired space lighting: high-contrast solar key light + cool earthshine fill
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.15);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xf8fafc, 2.8);
    sunLight.position.set(7, 4.5, 6);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x00d9f5, 1.35);
    rimLight.position.set(-6, 3, -4);
    scene.add(rimLight);

    const marsWarmLight = new THREE.PointLight(0xe07a5f, 1.1, 30);
    marsWarmLight.position.set(5, -2, 4);
    scene.add(marsWarmLight);

    // 1. Multi-layer Parallax Starfield
    const starCount = isLowPowerDevice ? 700 : 1400;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      starPositions[i3] = (Math.random() - 0.5) * 75;
      starPositions[i3 + 1] = (Math.random() - 0.5) * 55;
      starPositions[i3 + 2] = -Math.random() * 55 - 4;

      const tint = Math.random();
      if (tint > 0.85) {
        starColors[i3] = 0.0;
        starColors[i3 + 1] = 0.85;
        starColors[i3 + 2] = 0.96;
      } else if (tint > 0.7) {
        starColors[i3] = 0.96;
        starColors[i3 + 1] = 0.72;
        starColors[i3 + 2] = 0.18;
      } else {
        starColors[i3] = 0.92;
        starColors[i3 + 1] = 0.95;
        starColors[i3 + 2] = 0.99;
      }
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 2. Texture Loader using real NASA public-domain imagery in /nasa/
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load("/nasa/earth-blue-marble.jpg");
    earthTexture.colorSpace = THREE.SRGBColorSpace;

    const moonTexture = textureLoader.load("/nasa/moon-orb.jpg");
    moonTexture.colorSpace = THREE.SRGBColorSpace;

    const marsTexture = textureLoader.load("/nasa/mars-orb.jpg");
    marsTexture.colorSpace = THREE.SRGBColorSpace;

    // 3. Earth Group (Surface + Cloud/Atmosphere Parallax Shell + Rim Halo)
    const earthGroup = new THREE.Group();
    earthGroup.position.set(0, -2.55, 0);
    scene.add(earthGroup);

    const sphereSegments = isLowPowerDevice ? 36 : 64;
    const earthGeo = new THREE.SphereGeometry(2.45, sphereSegments, sphereSegments);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.62,
      metalness: 0.08,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.rotation.z = 0.22;
    earthGroup.add(earthMesh);

    // Atmospheric scattering shell (parallax layer)
    const atmoGeo = new THREE.SphereGeometry(2.53, sphereSegments, sphereSegments);
    const atmoMat = new THREE.MeshPhongMaterial({
      color: 0x00d9f5,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    earthGroup.add(atmoMesh);

    // Subtle orbital ring around Earth
    const orbitRingGeo = new THREE.RingGeometry(3.05, 3.07, 96);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: 0x00d9f5,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.24,
    });
    const orbitRingMesh = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRingMesh.rotation.x = Math.PI / 2.25;
    orbitRingMesh.rotation.y = -0.18;
    earthGroup.add(orbitRingMesh);

    // 4. Moon & Mars 3D Bodies
    const moonGeo = new THREE.SphereGeometry(0.58, 36, 36);
    const moonMat = new THREE.MeshStandardMaterial({
      map: moonTexture,
      roughness: 0.88,
      metalness: 0.02,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(-3.4, 1.35, -1.8);
    scene.add(moonMesh);

    const marsGeo = new THREE.SphereGeometry(0.68, 36, 36);
    const marsMat = new THREE.MeshStandardMaterial({
      map: marsTexture,
      roughness: 0.78,
      metalness: 0.04,
    });
    const marsMesh = new THREE.Mesh(marsGeo, marsMat);
    marsMesh.position.set(3.5, 1.15, -2.2);
    scene.add(marsMesh);

    // 5. Chapter 3 Schematic 3D Terrain Layers Group (Topography, Geology, Subsurface)
    const terrainGroup = new THREE.Group();
    terrainGroup.position.set(1.35, -0.15, 2.2);
    terrainGroup.rotation.x = -0.92;
    terrainGroup.rotation.z = 0.52;
    terrainGroup.visible = false;
    scene.add(terrainGroup);

    const gridSegments = isLowPowerDevice ? 22 : 34;
    const createStratumMesh = (
      colorHex: number,
      heightScale: number,
      frequency: number,
      phase: number
    ) => {
      const geo = new THREE.PlaneGeometry(3.4, 3.4, gridSegments, gridSegments);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const r = Math.sqrt(x * x + y * y);
        // Schematic volcanic / crater ridge relief function
        const z =
          Math.sin(x * frequency + phase) *
            Math.cos(y * frequency + phase) *
            heightScale +
          Math.exp(-r * 1.1) * heightScale * 0.85;
        pos.setZ(i, z);
      }
      geo.computeVertexNormals();

      const group = new THREE.Group();

      const surfaceMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.22,
        roughness: 0.5,
        side: THREE.DoubleSide,
      });
      const surface = new THREE.Mesh(geo, surfaceMat);

      const wireMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        wireframe: true,
        transparent: true,
        opacity: 0.68,
      });
      const wire = new THREE.Mesh(geo, wireMat);

      group.add(surface);
      group.add(wire);
      return { group, surfaceMat, wireMat };
    };

    // Top layer: Topography & DEM Slope (#00D9F5)
    const topStratum = createStratumMesh(0x00d9f5, 0.28, 1.9, 0.0);
    // Middle layer: Lithology & Basalt/Sediment Geology (#F5B82E)
    const midStratum = createStratumMesh(0xf5b82e, 0.18, 1.4, 1.1);
    // Bottom layer: Subsurface Lava Tubes & Cryosphere (#E07A5F)
    const botStratum = createStratumMesh(0xe07a5f, 0.14, 1.0, 2.3);

    terrainGroup.add(topStratum.group);
    terrainGroup.add(midStratum.group);
    terrainGroup.add(botStratum.group);

    // Smooth interpolation state
    const currentCamPos = new THREE.Vector3(0, 0.4, 8.8);
    const targetCamPos = new THREE.Vector3(0, 0.4, 8.8);
    const currentLookAt = new THREE.Vector3(0, -0.4, 0);
    const targetLookAt = new THREE.Vector3(0, -0.4, 0);

    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const renderLoop = () => {
      animationFrameId = window.requestAnimationFrame(renderLoop);
      if (document.hidden) return;

      const elapsed = clock.getElapsedTime();
      const {
        scrollProgress: p,
        layerSeparation: sep,
        comparisonBody: body,
        focusedLayer: fLayer,
      } = stateRef.current;

      // Determine camera trajectory across the 5 narrative chapters:
      // Ch 1 [0.00 - 0.20]: Wide orbital view with Earth horizon, Moon & Mars
      // Ch 2 [0.20 - 0.42]: Camera dives toward Earth's atmosphere & clouds
      // Ch 3 [0.42 - 0.65]: Camera angles along Earth's limb, 3D stratified terrain layers separate
      // Ch 4 [0.65 - 0.85]: Planetary comparison framing (Earth vs Moon/Mars twin view)
      // Ch 5 [0.85 - 1.00]: Camera pulls back to high orbital overview for Explorer transition
      if (p < 0.2) {
        const t = p / 0.2;
        targetCamPos.set(0, 0.4 - t * 0.25, 8.8 - t * 1.9);
        targetLookAt.set(0, -0.55 - t * 0.2, 0);
      } else if (p < 0.42) {
        const t = (p - 0.2) / 0.22;
        targetCamPos.set(-0.4 * t, 0.15 - t * 0.45, 6.9 - t * 2.1);
        targetLookAt.set(0, -0.75 - t * 0.35, 0);
      } else if (p < 0.65) {
        const t = (p - 0.42) / 0.23;
        targetCamPos.set(0.35, -0.25 + t * 0.1, 4.8 + t * 0.4);
        targetLookAt.set(0.55, -0.25, 1.2);
      } else if (p < 0.85) {
        const t = (p - 0.65) / 0.2;
        targetCamPos.set(0, 0.15, 5.8 + t * 1.4);
        targetLookAt.set(0, -0.2, 0);
      } else {
        const t = (p - 0.85) / 0.15;
        targetCamPos.set(0, 0.45 + t * 0.3, 7.2 + t * 2.4);
        targetLookAt.set(0, -0.5, 0);
      }

      const lerpFactor = prefersReducedMotion ? 0.25 : 0.065;
      currentCamPos.lerp(targetCamPos, lerpFactor);
      currentLookAt.lerp(targetLookAt, lerpFactor);
      camera.position.copy(currentCamPos);
      camera.lookAt(currentLookAt);

      // Parallax starfield shift
      starField.position.y = p * 2.4;
      if (!prefersReducedMotion) {
        starField.rotation.y = elapsed * 0.008;
      }

      // Earth axial & scroll rotation
      earthMesh.rotation.y =
        (prefersReducedMotion ? 0 : elapsed * 0.035) + p * 1.85;
      atmoMesh.rotation.y = -elapsed * 0.02;

      // Moon & Mars positioning based on chapter
      const inComparisonChapter = p >= 0.6 && p <= 0.88;
      if (inComparisonChapter) {
        // Bring selected comparison body closer on the right to contrast with Earth on the left
        earthGroup.position.x = THREE.MathUtils.lerp(
          earthGroup.position.x,
          -1.85,
          0.06
        );
        earthGroup.position.y = THREE.MathUtils.lerp(
          earthGroup.position.y,
          -1.65,
          0.06
        );

        if (body === "Moon") {
          moonMesh.position.lerp(new THREE.Vector3(1.95, 0.15, 1.8), 0.07);
          marsMesh.position.lerp(new THREE.Vector3(4.8, 2.2, -4.5), 0.07);
        } else {
          marsMesh.position.lerp(new THREE.Vector3(1.95, 0.15, 1.8), 0.07);
          moonMesh.position.lerp(new THREE.Vector3(-4.8, 2.2, -4.5), 0.07);
        }
      } else {
        earthGroup.position.x = THREE.MathUtils.lerp(
          earthGroup.position.x,
          0,
          0.06
        );
        earthGroup.position.y = THREE.MathUtils.lerp(
          earthGroup.position.y,
          -2.55,
          0.06
        );
        moonMesh.position.lerp(
          new THREE.Vector3(-3.3, 1.35 - p * 0.6, -1.8),
          0.06
        );
        marsMesh.position.lerp(
          new THREE.Vector3(3.4, 1.15 - p * 0.5, -2.2),
          0.06
        );
      }

      if (!prefersReducedMotion) {
        moonMesh.rotation.y = elapsed * 0.06 + p * 1.2;
        marsMesh.rotation.y = elapsed * 0.05 + p * 1.4;
      }

      // Chapter 3 3D Schematic Terrain Layers visibility & separation
      const terrainVisibilityWindow = p >= 0.34 && p <= 0.68;
      terrainGroup.visible = terrainVisibilityWindow;
      if (terrainVisibilityWindow) {
        const effectiveSep = Math.max(0.12, sep) * 0.68;
        topStratum.group.position.z = THREE.MathUtils.lerp(
          topStratum.group.position.z,
          effectiveSep,
          0.1
        );
        midStratum.group.position.z = THREE.MathUtils.lerp(
          midStratum.group.position.z,
          0,
          0.1
        );
        botStratum.group.position.z = THREE.MathUtils.lerp(
          botStratum.group.position.z,
          -effectiveSep,
          0.1
        );

        if (!prefersReducedMotion) {
          terrainGroup.rotation.z = 0.52 + Math.sin(elapsed * 0.35) * 0.08;
        }

        // Adjust opacity if user highlights a specific stratum
        const setStratumOpacity = (
          stratum: {
            surfaceMat: THREE.MeshStandardMaterial;
            wireMat: THREE.MeshBasicMaterial;
          },
          idx: 1 | 2 | 3
        ) => {
          const isFocused = fLayer === 0 || fLayer === idx;
          stratum.surfaceMat.opacity = isFocused ? 0.26 : 0.06;
          stratum.wireMat.opacity = isFocused ? 0.78 : 0.18;
        };

        setStratumOpacity(topStratum, 1);
        setStratumOpacity(midStratum, 2);
        setStratumOpacity(botStratum, 3);
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
      orbitRingGeo.dispose();
      orbitRingMat.dispose();
      moonGeo.dispose();
      moonMat.dispose();
      marsGeo.dispose();
      marsMat.dispose();
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
      {/* Subtle radial atmospheric depth backdrop */}
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 50% 78%, rgba(0, 217, 245, 0.11) 0%, rgba(10, 22, 36, 0.55) 42%, rgba(5, 11, 19, 0.98) 80%)",
        }}
      />

      {webglSupported ? (
        <div ref={containerRef} className="h-full w-full" />
      ) : (
        /* Simplified fallback for devices without WebGL */
        <div className="flex h-full w-full items-end justify-center opacity-40">
          <div className="h-[460px] w-[460px] rounded-full border-t border-[#00D9F5]/40 bg-gradient-to-b from-[#00D9F5]/15 to-transparent blur-xl" />
        </div>
      )}

      {/* Editorial vignette so typography remains 100% legible over 3D scene */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050B13]/60 via-transparent to-[#050B13]/85" />
    </div>
  );
}
