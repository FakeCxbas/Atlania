"use client";

import React from "react";

interface MissionChapterProps {
  id: string;
  chapterNumber: string;
  chapterTitle: string;
  eyebrow: string;
  headline?: string;
  title?: string;
  lead?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Editorial chapter layout wrapper designed for Awwwards-grade negative space,
 * typographic hierarchy, and clean hairline dividers without boxy wrappers or glow.
 */
export function MissionChapter({
  id,
  chapterNumber,
  chapterTitle,
  eyebrow,
  headline,
  title,
  lead,
  subtitle,
  rightSlot,
  children,
  className = "",
}: MissionChapterProps) {
  const resolvedHeadline = headline ?? title ?? "";
  const resolvedLead = lead ?? subtitle;

  return (
    <section
      id={id}
      data-chapter-id={id}
      aria-labelledby={`${id}-heading`}
      className={`relative z-10 mx-auto max-w-7xl snap-start snap-always px-6 py-28 sm:px-12 sm:py-36 lg:px-16 ${className}`}
    >
      {/* Editorial Chapter Header */}
      <div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-12 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs tracking-[0.2em] uppercase">
            <span className="font-semibold text-[#00D9F5]">
              {chapterNumber} · {chapterTitle}
            </span>
            <span className="h-px w-6 bg-white/25" />
            <span className="text-[#94A3B8]">{eyebrow}</span>
          </div>

          <h2
            id={`${id}-heading`}
            className="mt-5 text-3xl font-bold tracking-tight text-[#F1F5F9] sm:text-5xl sm:leading-[1.06]"
          >
            {resolvedHeadline}
          </h2>

          {resolvedLead && (
            <p className="mt-5 text-base leading-relaxed text-[#94A3B8] sm:text-lg">
              {resolvedLead}
            </p>
          )}
        </div>

        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>

      <div className="mt-14">{children}</div>
    </section>
  );
}
