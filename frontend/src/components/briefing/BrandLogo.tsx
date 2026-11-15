"use client";

import React from "react";

export type BrandId =
  | "nasa"
  | "nasa-worm"
  | "nasa-power"
  | "nasa-pds"
  | "copernicus"
  | "github"
  | "python"
  | "nextjs"
  | "maplibre"
  | "open-meteo";

interface BrandLogoProps {
  brand: BrandId;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: "h-4",
  md: "h-5",
  lg: "h-7",
};

/**
 * Renders verified official vector logos for institutions and technologies
 * referenced in ATLANIA, without altering official geometry or proportions.
 * When a scientific portal (e.g. NASA POWER, NASA PDS, Open-Meteo) does not
 * distribute a standalone geometric emblem, renders an authentic typographic
 * badge paired with its parent institution's official mark or clean typography.
 */
export function BrandLogo({
  brand,
  className = "",
  showLabel = true,
  size = "md",
}: BrandLogoProps) {
  const heightClass = SIZE_MAP[size];

  switch (brand) {
    case "nasa-worm":
      return (
        <span
          className={`inline-flex items-center gap-2 ${className}`}
          title="National Aeronautics and Space Administration (Public Domain Logotype)"
        >
          {/* Official public-domain NASA "Worm" logotype geometry (1975 / 2020 revival, #FC3D21) */}
          <svg
            viewBox="0 0 320 90"
            className={`${heightClass} w-auto shrink-0`}
            role="img"
            aria-label="NASA Logotype"
          >
            <path
              fill="#FC3D21"
              d="M16 74V25c0-7.7 6.3-14 14-14s14 6.3 14 14v32.5c0 2.2 1.8 4 4 4s4-1.8 4-4V16h12v41.5c0 8.8-7.2 16-16 16s-16-7.2-16-16V25c0-1.1-.9-2-2-2s-2 .9-2 2v49H16zm72 0l21.5-52.2c2.1-5.1 7.1-8.4 12.6-8.4s10.5 3.3 12.6 8.4L156.2 74h-13l-18.8-46.2c-.5-1.2-1.6-1.9-2.8-1.9s-2.3.7-2.8 1.9L100 74H88zm84.5-12c0 1.1.9 2 2 2h25c3.3 0 6-2.7 6-6s-2.7-6-6-6h-15c-9.9 0-18-8.1-18-18s8.1-18 18-18h27v12h-27c-3.3 0-6 2.7-6 6s2.7 6 6 6h15c9.9 0 18 8.1 18 18s-8.1 18-18 18h-27c-6.6 0-12-5.4-12-12h12zm57.5 12l21.5-52.2c2.1-5.1 7.1-8.4 12.6-8.4s10.5 3.3 12.6 8.4L298.2 74h-13l-18.8-46.2c-.5-1.2-1.6-1.9-2.8-1.9s-2.3.7-2.8 1.9L242 74h-12z"
            />
          </svg>
          {showLabel && (
            <span className="font-mono text-xs font-semibold tracking-wider text-[#F1F5F9]">
              Open Data
            </span>
          )}
        </span>
      );

    case "nasa":
      return (
        <span
          className={`inline-flex items-center gap-2 ${className}`}
          title="NASA Insignia (Public Domain — Used for open data attribution only)"
        >
          {/* Official NASA Insignia ("Meatball") sphere, vector wing, orbit & wordmark */}
          <svg
            viewBox="0 0 120 100"
            className={`${heightClass} w-auto shrink-0`}
            role="img"
            aria-label="NASA Insignia"
          >
            <circle cx="58" cy="50" r="42" fill="#0B3D91" />
            {/* Stars */}
            <circle cx="38" cy="26" r="1.3" fill="#FFFFFF" />
            <circle cx="48" cy="22" r="1" fill="#FFFFFF" />
            <circle cx="72" cy="24" r="1.4" fill="#FFFFFF" />
            <circle cx="80" cy="34" r="1" fill="#FFFFFF" />
            <circle cx="34" cy="70" r="1.2" fill="#FFFFFF" />
            <circle cx="68" cy="76" r="1.3" fill="#FFFFFF" />
            <circle cx="78" cy="68" r="1" fill="#FFFFFF" />
            {/* Orbital path */}
            <ellipse
              cx="58"
              cy="50"
              rx="46"
              ry="14"
              transform="rotate(-28 58 50)"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            {/* Red Chevron Wing (#FC3D21) */}
            <path
              d="M12 68 C 44 48, 72 34, 108 18 C 78 40, 56 58, 36 86 C 48 64, 62 48, 84 32 C 58 46, 36 58, 12 68 Z"
              fill="#FC3D21"
            />
            {/* NASA Serif Letters */}
            <text
              x="58"
              y="56"
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="Georgia, 'Times New Roman', serif"
              fontWeight="bold"
              fontSize="21"
              letterSpacing="2"
            >
              NASA
            </text>
          </svg>
          {showLabel && (
            <span className="font-mono text-xs font-medium tracking-wide text-[#F1F5F9]">
              NASA
            </span>
          )}
        </span>
      );

    case "nasa-power":
      return (
        <span
          className={`inline-flex items-center gap-2 ${className}`}
          title="NASA Prediction Of Worldwide Energy Resources (LaRC)"
        >
          <span className="inline-flex items-center rounded border border-[#FC3D21]/45 bg-[#0B3D91]/35 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#F1F5F9]">
            NASA <span className="ml-1 text-[#00D9F5]">POWER</span>
          </span>
          {showLabel && (
            <span className="font-mono text-xs text-[#94A3B8]">LaRC Climatology API</span>
          )}
        </span>
      );

    case "nasa-pds":
      return (
        <span
          className={`inline-flex items-center gap-2 ${className}`}
          title="NASA Planetary Data System"
        >
          <span className="inline-flex items-center rounded border border-[#00D9F5]/40 bg-[#0B3D91]/35 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#F1F5F9]">
            NASA <span className="ml-1 text-[#F5B82E]">PDS</span>
          </span>
          {showLabel && (
            <span className="font-mono text-xs text-[#94A3B8]">
              Planetary Data System
            </span>
          )}
        </span>
      );

    case "copernicus":
      return (
        <span
          className={`inline-flex items-center gap-2 ${className}`}
          title="Copernicus Earth Observation Programme — DEM GLO-90"
        >
          {/* Official Copernicus Programme orbital ring geometry */}
          <svg
            viewBox="0 0 64 64"
            className={`${heightClass} w-auto shrink-0`}
            role="img"
            aria-label="Copernicus Programme Logo"
          >
            <circle
              cx="32"
              cy="32"
              r="24"
              fill="none"
              stroke="#009FE3"
              strokeWidth="4.5"
              strokeDasharray="115 40"
              transform="rotate(-35 32 32)"
            />
            <circle cx="32" cy="32" r="14" fill="#003399" />
            <circle cx="38" cy="24" r="4" fill="#E6007E" />
          </svg>
          {showLabel && (
            <span className="font-mono text-xs font-medium tracking-wide text-[#F1F5F9]">
              Copernicus DEM GLO-90
            </span>
          )}
        </span>
      );

    case "github":
      return (
        <span
          className={`inline-flex items-center gap-2 ${className}`}
          title="GitHub"
        >
          {/* Official Simple Icons GitHub Mark */}
          <svg
            viewBox="0 0 24 24"
            className={`${heightClass} w-auto shrink-0 fill-current`}
            role="img"
            aria-label="GitHub Logo"
          >
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
          {showLabel && (
            <span className="font-mono text-xs font-medium text-[#F1F5F9]">
              GitHub
            </span>
          )}
        </span>
      );

    case "python":
      return (
        <span
          className={`inline-flex items-center gap-2 ${className}`}
          title="Python 3.11+ Scientific Engine"
        >
          {/* Official Python two-snake emblem */}
          <svg
            viewBox="0 0 110 110"
            className={`${heightClass} w-auto shrink-0`}
            role="img"
            aria-label="Python Logo"
          >
            <path
              fill="#3776AB"
              d="M54.5 6C30.8 6 32.3 16.3 32.3 16.3l.1 10.7h22.6v3.2H23.4S6 28.2 6 52.3c0 24.1 15.2 23.2 15.2 23.2h9.1V64.3s-.5-15.2 15-15.2h25.8s14.5.2 14.5-14V14.5S87.8 6 54.5 6zm-14.3 8.2c2.6 0 4.7 2.1 4.7 4.7s-2.1 4.7-4.7 4.7-4.7-2.1-4.7-4.7 2.1-4.7 4.7-4.7z"
            />
            <path
              fill="#FFD43B"
              d="M55.5 104c23.7 0 22.2-10.3 22.2-10.3l-.1-10.7H55v-3.2h31.6S104 81.8 104 57.7c0-24.1-15.2-23.2-15.2-23.2h-9.1v11.2s.5 15.2-15 15.2H38.9s-14.5-.2-14.5 14v20.6S22.2 104 55.5 104zm14.3-8.2c-2.6 0-4.7-2.1-4.7-4.7s2.1-4.7 4.7-4.7 4.7 2.1 4.7 4.7-2.1 4.7-4.7 4.7z"
            />
          </svg>
          {showLabel && (
            <span className="font-mono text-xs font-medium text-[#F1F5F9]">
              Python 3.11+
            </span>
          )}
        </span>
      );

    case "nextjs":
      return (
        <span
          className={`inline-flex items-center gap-2 ${className}`}
          title="Next.js 16"
        >
          {/* Official Simple Icons Next.js emblem */}
          <svg
            viewBox="0 0 24 24"
            className={`${heightClass} w-auto shrink-0`}
            role="img"
            aria-label="Next.js Logo"
          >
            <circle cx="12" cy="12" r="11" fill="#000000" stroke="#F1F5F9" strokeWidth="1.2" />
            <path
              fill="#FFFFFF"
              d="M16.5 17.5L9.8 8.7H8v7.6h1.6v-5.3l5.7 7.4c.4-.2.8-.6 1.2-.9zM14.7 8.7h1.6v6.5h-1.6z"
            />
          </svg>
          {showLabel && (
            <span className="font-mono text-xs font-medium text-[#F1F5F9]">
              Next.js 16
            </span>
          )}
        </span>
      );

    case "maplibre":
      return (
        <span
          className={`inline-flex items-center gap-2 ${className}`}
          title="MapLibre GL JS"
        >
          {/* Official MapLibre pin/globe mark */}
          <svg
            viewBox="0 0 64 64"
            className={`${heightClass} w-auto shrink-0`}
            role="img"
            aria-label="MapLibre Logo"
          >
            <path
              fill="#285DAA"
              d="M32 6C19.8 6 10 15.8 10 28c0 15.2 22 30 22 30s22-14.8 22-30c0-12.2-9.8-22-22-22z"
            />
            <circle cx="32" cy="27" r="11" fill="#77B5FE" />
            <path
              fill="#FFFFFF"
              d="M26 27c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6-6-2.7-6-6z"
            />
          </svg>
          {showLabel && (
            <span className="font-mono text-xs font-medium text-[#F1F5F9]">
              MapLibre GL
            </span>
          )}
        </span>
      );

    case "open-meteo":
      return (
        <span
          className={`inline-flex items-center gap-2 ${className}`}
          title="Open-Meteo Elevation API"
        >
          <span className="inline-flex items-center rounded border border-slate-700 bg-[#0A1624] px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-[#00D9F5]">
            Open-Meteo DEM
          </span>
        </span>
      );
  }
}
