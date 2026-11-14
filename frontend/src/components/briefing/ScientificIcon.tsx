"use client";

import React from "react";

export type ScientificConcept =
  | "topography"
  | "geology"
  | "thermal"
  | "hydrology"
  | "subsurface"
  | "gravity"
  | "atmosphere"
  | "radiation"
  | "weathering"
  | "stratigraphy";

interface ScientificIconProps {
  concept: ScientificConcept;
  className?: string;
}

/**
 * Semantic SVG iconography dedicated exclusively to planetary science concepts
 * (distinct from UI action icons in Lucide and institution marks in BrandLogo).
 * Geometric line weight is consistent (1.6px) with subtle isometric/technical precision.
 */
export function ScientificIcon({
  concept,
  className = "h-5 w-5",
}: ScientificIconProps) {
  switch (concept) {
    case "topography":
      // Topographic contour isolines & slope gradient vector
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <path
            d="M3 18.5L8.5 9L13 15L16.5 10.5L21 18.5H3Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5.5 21H18.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeDasharray="2 2"
            strokeLinecap="round"
          />
          <circle cx="8.5" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );

    case "geology":
      // Crystalline basaltic column / lithological lattice
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <polygon
            points="12,2.5 20,7 20,17 12,21.5 4,17 4,7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M12 2.5V12M12 12L20 17M12 12L4 17"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      );

    case "thermal":
      // Diurnal thermal oscillation wave + equilibrium axis
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <path
            d="M2.5 12H21.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />
          <path
            d="M3 12C5.5 5 8.5 5 12 12C15.5 19 18.5 19 21 12"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <circle cx="7.5" cy="6.8" r="1.5" fill="currentColor" />
          <circle cx="16.5" cy="17.2" r="1.5" fill="currentColor" />
        </svg>
      );

    case "hydrology":
      // Cryosphere hexagonal ice lattice + aridity boundary
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <path
            d="M12 3V21M4.2 7.5L19.8 16.5M19.8 7.5L4.2 16.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <polygon
            points="12,7.5 15.9,9.8 15.9,14.2 12,16.5 8.1,14.2 8.1,9.8"
            stroke="currentColor"
            strokeWidth="1.4"
          />
        </svg>
      );

    case "subsurface":
      // Subterranean lava tube arch beneath surface regolith
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <path
            d="M2.5 6.5H21.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M5 6.5L7.5 9.5M19 6.5L16.5 9.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            d="M5.5 19.5C5.5 14.5 8.2 11.5 12 11.5C15.8 11.5 18.5 14.5 18.5 19.5H5.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "gravity":
      // Gravitational field well & downward acceleration vector g
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M12 10.5V19.5M12 19.5L9 16.5M12 19.5L15 16.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 18C7 20.5 17 20.5 20 18"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeDasharray="2 2"
          />
        </svg>
      );

    case "atmosphere":
      // Planetary limb with atmospheric scale height shells
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <path
            d="M4 19C6.2 14.5 10.5 12 15.5 12C17.5 12 19.4 12.4 21 13.1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M3 15C5.8 9.8 10.6 7 16.2 7C18 7 19.6 7.3 21 7.8"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeDasharray="3 2"
            strokeLinecap="round"
          />
        </svg>
      );

    case "radiation":
      // Galactic Cosmic Ray (GCR) / Solar Particle flux vectors vs magnetic shield
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <path
            d="M4 5L10 11M4 11L8 15M14 4L18 8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M8 20C9.5 14 14 10.5 20 9.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <circle cx="17" cy="17" r="3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );

    case "weathering":
      // Regolith grain abrasion vs aqueous/biotic alteration
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <polygon
            points="7,14 11,11 14,15 10,19 6,18"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <polygon
            points="14,7 18,6 19,10 15,11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M3 21H21"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      );

    case "stratigraphy":
      // 3 separated isometric geological strata planes
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <polygon
            points="12,3 21,7.5 12,12 3,7.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <polyline
            points="3,12 12,16.5 21,12"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="3,16.5 12,21 21,16.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}
