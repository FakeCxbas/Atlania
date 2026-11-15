"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PlanetScene } from "./PlanetScene";

export interface ScrollState {
  scrollProgress: number;
  introProgress: number;
  terrainProgress: number;
  activeChapter: number;
  layerSeparation: number;
}

interface ScrollSceneProps {
  comparisonBody: "Moon" | "Mars";
  focusedLayer: 0 | 1 | 2 | 3 | 4;
  children: (state: ScrollState) => React.ReactNode;
}

/**
 * Coordinates narrative scroll progress across the 5 chapters using GSAP ScrollTrigger
 * and feeds normalized progress into the Three.js `PlanetScene` and sticky chapter stages.
 */
export function ScrollScene({
  comparisonBody,
  focusedLayer,
  children,
}: ScrollSceneProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [scrollState, setScrollState] = useState<ScrollState>({
    scrollProgress: 0,
    introProgress: 0,
    terrainProgress: 0,
    activeChapter: 1,
    layerSeparation: 0.1,
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // 1. Master narrative progress trigger across the entire page
      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.55,
        onUpdate: (self) => {
          setScrollState((prev) => ({
            ...prev,
            scrollProgress: self.progress,
          }));
        },
      });

      // 2. Shared Chapter 1 -> Chapter 2 continuous orbital approach trigger
      const introTrackEl = document.getElementById("intro-scroll-track");
      if (introTrackEl) {
        ScrollTrigger.create({
          trigger: introTrackEl,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.55,
          onUpdate: (self) => {
            const p = self.progress;
            setScrollState((prev) => ({
              ...prev,
              introProgress: p,
              activeChapter: p < 0.38 ? 1 : 2,
            }));
          },
        });
      }

      // 3. Dedicated Chapter 3 ScrollTrigger for 3D terrain descent & 4-layer separation
      const terrainTrackEl =
        document.getElementById("terrain-3d-track") ??
        document.getElementById("capas-del-terreno");
      if (terrainTrackEl) {
        ScrollTrigger.create({
          trigger: terrainTrackEl,
          start: "top 65%",
          end: "bottom 10%",
          scrub: 0.2,
          onToggle: (self) => {
            if (self.isActive) {
              setScrollState((prev) => ({ ...prev, activeChapter: 3 }));
            }
          },
          onLeaveBack: () => {
            setScrollState((prev) => ({
              ...prev,
              terrainProgress: 0,
              layerSeparation: 0,
            }));
          },
          onLeave: () => {
            setScrollState((prev) => ({
              ...prev,
              terrainProgress: 1,
              layerSeparation: 1,
            }));
          },
          onUpdate: (self) => {
            setScrollState((prev) => ({
              ...prev,
              activeChapter: 3,
              terrainProgress: self.progress,
              layerSeparation: Math.min(1, Math.max(0, (self.progress - 0.25) / 0.5)),
            }));
          },
        });
      }

      // 4. Chapter 4 & Chapter 5 active chapter triggers
      const ch4El = document.getElementById("que-es-un-analogo");
      if (ch4El) {
        ScrollTrigger.create({
          trigger: ch4El,
          start: "top 55%",
          end: "bottom 45%",
          onEnter: () =>
            setScrollState((prev) => ({ ...prev, activeChapter: 4 })),
          onEnterBack: () =>
            setScrollState((prev) => ({ ...prev, activeChapter: 4 })),
        });
      }

      const ch5El = document.getElementById("acceso-al-explorador");
      if (ch5El) {
        ScrollTrigger.create({
          trigger: ch5El,
          start: "top 60%",
          end: "bottom bottom",
          onEnter: () =>
            setScrollState((prev) => ({ ...prev, activeChapter: 5 })),
          onEnterBack: () =>
            setScrollState((prev) => ({ ...prev, activeChapter: 5 })),
        });
      }
    }, root);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="relative min-h-screen">
      {/* Continuous 3D WebGL Planetary & Stratified Terrain Stage */}
      <PlanetScene
        scrollProgress={scrollState.scrollProgress}
        introProgress={scrollState.introProgress}
        terrainProgress={scrollState.terrainProgress}
        activeChapter={scrollState.activeChapter}
        layerSeparation={scrollState.layerSeparation}
        comparisonBody={comparisonBody}
        focusedLayer={focusedLayer}
      />

      {/* Narrative Chapters Content */}
      <div className="relative z-10">{children(scrollState)}</div>
    </div>
  );
}
