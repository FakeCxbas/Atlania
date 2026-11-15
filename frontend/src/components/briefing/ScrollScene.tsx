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
  focusedLayer: -1 | 0 | 1 | 2 | 3 | 4;
  children: (state: ScrollState) => React.ReactNode;
}

const CHAPTER_MARKERS = [
  { index: 1, href: "#capitulo-1", label: "01 · El comienzo" },
  { index: 2, href: "#el-desafio", label: "02 · Aproximación a la Tierra" },
  { index: 3, href: "#capas-del-terreno", label: "03 · Capas del terreno" },
  { index: 4, href: "#que-es-un-analogo", label: "04 · Comparación planetaria" },
  { index: 5, href: "#acceso-al-explorador", label: "05 · Acceso al explorador" },
];

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
          start: "top top",
          end: "bottom bottom",
          scrub: 0.4,
          onEnter: () =>
            setScrollState((prev) => ({ ...prev, activeChapter: 3 })),
          onEnterBack: () =>
            setScrollState((prev) => ({ ...prev, activeChapter: 3 })),
          onLeave: () =>
            setScrollState((prev) => ({ ...prev, activeChapter: 4 })),
          onLeaveBack: () =>
            setScrollState((prev) => ({ ...prev, activeChapter: 2 })),
          onToggle: (self) => {
            if (self.isActive) {
              setScrollState((prev) => ({ ...prev, activeChapter: 3 }));
            }
          },
          onUpdate: (self) => {
            setScrollState((prev) => ({
              ...prev,
              activeChapter: 3,
              terrainProgress: self.progress,
              layerSeparation: Math.min(1, Math.max(0.15, 0.15 + self.progress * 0.85)),
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

  const scrollActiveStratum: 1 | 2 | 3 | 4 =
    scrollState.layerSeparation < 0.28
      ? 1
      : scrollState.layerSeparation < 0.56
      ? 2
      : scrollState.layerSeparation < 0.84
      ? 3
      : 4;

  const effectiveFocusedLayer: 0 | 1 | 2 | 3 | 4 =
    focusedLayer === -1
      ? 0
      : focusedLayer === 0
      ? scrollActiveStratum
      : focusedLayer;

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
        focusedLayer={effectiveFocusedLayer}
      />

      {/* Minimalist Editorial 5-Chapter Progress Rail (Desktop) */}
      <aside
        aria-label="Progreso de capítulos del viaje espacial"
        className="fixed top-1/2 right-6 z-30 hidden -translate-y-1/2 flex-col gap-3 xl:flex"
      >
        {CHAPTER_MARKERS.map((ch) => {
          const isCurrent = scrollState.activeChapter === ch.index;
          return (
            <a
              key={ch.index}
              href={ch.href}
              className="group flex items-center justify-end gap-3 py-1 font-mono text-[11px] transition-colors"
            >
              <span
                className={`transition-opacity duration-300 ${
                  isCurrent
                    ? "opacity-100 font-semibold text-[#F1F5F9]"
                    : "opacity-0 text-[#94A3B8] group-hover:opacity-100"
                }`}
              >
                {ch.label}
              </span>
              <span
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? "w-6 bg-[#00D9F5]"
                    : "w-1.5 bg-white/30 group-hover:bg-white/70"
                }`}
              />
            </a>
          );
        })}
      </aside>

      {/* Narrative Chapters Content */}
      <div className="relative z-10">{children(scrollState)}</div>
    </div>
  );
}
