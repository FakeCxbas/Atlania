"use client";

import React from "react";

interface MissionChapterProps {
  id: string;
  chapterNumber: string;
  chapterTitle: string;
  eyebrow: string;
  headline: string;
  lead?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Editorial chapter layout wrapper designed for Awwwards-grade negative space,
 * typographic hierarchy, and restrained aerospace framing without excessive borders or glow.
 */
export function MissionChapter({
  id,
  chapterNumber,
  chapterTitle,
  eyebrow,
  headline,
  lead,
  rightSlot,
  children,
  className = "",
}: MissionChapterProps) {
  return (
    <section
      id={id}
      data-chapter-id={id}
      aria-labelledby={`${id}-heading`}
      className={`relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 ${className}`}
    >
      {/* Editorial Chapter Header */}
      <div className="flex flex-col justify-between gap-8 border-b border-slate-800/70 pb-10 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs tracking-[0.18em]">
            <span className="inline-flex items-center rounded-full border border-[#00D9F5]/35 bg-[#0A1624]/80 px-3 py-1 font-semibold text-[#00D9F5]">
              CAPÍTULO {chapterNumber} — {chapterTitle.toUpperCase()}
            </span>
            <span className="text-[#94A3B8] uppercase">{eyebrow}</span>
          </div>

          <h2
            id={`${id}-heading`}
            className="mt-5 text-3xl font-bold tracking-tight text-[#F1F5F9] sm:text-5xl sm:leading-[1.1]"
          >
            {headline}
          </h2>

          {lead && (
            <p className="mt-5 text-base leading-relaxed text-[#94A3B8] sm:text-lg">
              {lead}
            </p>
          )}
        </div>

        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>

      <div className="mt-12">{children}</div>
    </section>
  );
}
