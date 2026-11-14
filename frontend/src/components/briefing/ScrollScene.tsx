"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PlanetScene } from "./PlanetScene";

export interface ScrollState {
  scrollProgress: number;
  activeChapter: number;
  layerSeparation: number;
}

interface ScrollSceneProps {
  comparisonBody: "Moon" | "Mars";
  focusedLayer: 0 | 1 | 2 | 3;
  children: (state: ScrollState) => React.ReactNode;
}

const CHAPTER_MARKERS = [
  { index: 1, href: "#capitulo-1", label: "01 · El comienzo" },
  { index: 2, href: "#el-desafio", label: "02 · Aproximación a la Tierra" },
  { index: 3, href: "#capas-del-terreno", label: "03 · Capas del terreno" },
  { index: 4, href: "#que-es-un-analogo", label: "04 · Comparación planetaria" },
  { index: 5, href: "#acceso-explorador", label: "05 · Acceso al explorador" },
];

/**
 * Coordinates narrative scroll progress across the 5 chapters using GSAP ScrollTrigger
 * and feeds normalized progress into the Three.js `PlanetScene` and `TerrainLayers`.
 */
export function ScrollScene({
  comparisonBody,
  focusedLayer,
  children,
}: ScrollSceneProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [scrollState, setScrollState] = useState<ScrollState>({
    scrollProgress: 0,
    activeChapter: 1,
    layerSeparation: 0.25,
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Master narrative progress trigger across the entire page
      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.4,
        onUpdate: (self) => {
          const p = self.progress;
          const chapter =
            p < 0.18
              ? 1
              : p < 0.38
              ? 2
              : p < 0.62
              ? 3
              : p < 0.85
              ? 4
              : 5;

          setScrollState((prev) => ({
            ...prev,
            scrollProgress: p,
            activeChapter: chapter,
          }));
        },
      });

      // Dedicated Chapter 3 ScrollTrigger for 3D terrain layer separation
      const chapter3El = document.getElementById("capas-del-terreno");
      if (chapter3El) {
        ScrollTrigger.create({
          trigger: chapter3El,
          start: "top 80%",
          end: "bottom 25%",
          scrub: 0.5,
          onUpdate: (self) => {
            setScrollState((prev) => ({
              ...prev,
              layerSeparation: self.progress,
            }));
          },
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
        activeChapter={scrollState.activeChapter}
        layerSeparation={scrollState.layerSeparation}
        comparisonBody={comparisonBody}
        focusedLayer={focusedLayer}
      />

      {/* Discreet Editorial 5-Chapter Progress Rail (Desktop) */}
      <aside
        aria-label="Progreso de capítulos del viaje espacial"
        className="fixed top-1/2 right-5 z-30 hidden -translate-y-1/2 flex-col gap-2.5 xl:flex"
      >
        {CHAPTER_MARKERS.map((ch) => {
          const isCurrent = scrollState.activeChapter === ch.index;
          return (
            <a
              key={ch.index}
              href={ch.href}
              className={`group flex items-center justify-end gap-2.5 rounded-full px-3 py-1.5 font-mono text-[11px] transition-all ${
                isCurrent
                  ? "border border-[#00D9F5]/50 bg-[#0A1624]/90 text-[#00D9F5]"
                  : "text-[#94A3B8]/75 hover:text-[#F1F5F9]"
              }`}
            >
              <span
                className={`transition-opacity ${
                  isCurrent
                    ? "opacity-100 font-semibold"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {ch.label}
              </span>
              <span
                className={`h-2 w-2 rounded-full transition-transform ${
                  isCurrent
                    ? "scale-125 bg-[#00D9F5]"
                    : "bg-slate-600 group-hover:bg-[#F5B82E]"
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
