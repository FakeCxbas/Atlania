import React from "react";

interface AtlaniaIsotipoProps {
  className?: string;
  variant?: "color" | "mono";
  label?: string;
}

/**
 * Vector isotipo de ATLANIA: anillo orbital, estrella polar de 4 puntas,
 * Luna y Marte en órbita, arco atmosférico terrestre y estratos geológicos.
 */
export function AtlaniaIsotipo({
  className = "h-8 w-8",
  variant = "color",
  label,
}: AtlaniaIsotipoProps) {
  const isMono = variant === "mono";
  const ring = isMono ? "currentColor" : "#F7EED7";
  const moon = isMono ? "currentColor" : "#D5D8DC";
  const mars = isMono ? "currentColor" : "#E0783C";
  const earth = isMono ? "currentColor" : "#4989C8";
  const moss = isMono ? "currentColor" : "#485E33";
  const terra = isMono ? "currentColor" : "#7A3E1E";

  return (
    <svg
      viewBox="0 0 256 256"
      fill="none"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {!isMono && <circle cx="128" cy="128" r="124" fill="#091124" />}
      <path
        d="M117 44 A86 86 0 1 0 139 44"
        stroke={ring}
        strokeWidth="7.5"
        strokeLinecap="round"
      />
      <path
        d="M128 24 L133.5 55 L154 61 L133.5 66.5 L128 84 L122.5 66.5 L102 61 L122.5 55 Z"
        fill={ring}
      />
      <circle cx="81" cy="94" r="11.5" fill={moon} opacity={isMono ? 0.85 : 1} />
      <circle cx="174" cy="94" r="12" fill={mars} opacity={isMono ? 0.85 : 1} />
      <path
        d="M52 152 Q128 112 204 152"
        stroke={earth}
        strokeWidth="7.5"
        strokeLinecap="round"
        opacity={isMono ? 0.75 : 1}
      />
      <path
        d="M56 184 Q128 144 196 177 Q152 183 108 188 Q80 190 56 184 Z"
        fill={moss}
        opacity={isMono ? 0.45 : 1}
      />
      <path
        d="M108 188 Q154 170 195 178 Q162 212 108 188 Z"
        fill={terra}
        opacity={isMono ? 0.35 : 1}
      />
      <path
        d="M62 183 Q106 182 128 194 Q156 208 188 182"
        stroke={ring}
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <path
        d="M128 88 L88 164 Q76 179 54 188 Q82 178 102 162 L128 112 L154 162 Q174 178 198 180 Q176 170 166 156 Z"
        fill={ring}
      />
      <path
        d="M94 164 Q128 150 162 164 L154 154 Q128 143 102 154 Z"
        fill={ring}
      />
    </svg>
  );
}

interface AtlaniaLockupProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}

/**
 * Logotipo horizontal de ATLANIA (isotipo + wordmark + tagline opcional).
 */
export function AtlaniaLockup({
  size = "md",
  showTagline = false,
  className = "",
}: AtlaniaLockupProps) {
  const iconSize =
    size === "sm" ? "h-7 w-7" : size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const textSize =
    size === "sm"
      ? "text-base tracking-[0.22em]"
      : size === "lg"
      ? "text-2xl tracking-[0.26em]"
      : "text-lg tracking-[0.24em]";

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <AtlaniaIsotipo className={`${iconSize} shrink-0 drop-shadow-[0_0_12px_rgba(247,238,215,0.22)]`} />
      <span className="flex flex-col">
        <span
          className={`font-serif font-semibold text-[#F7EED7] uppercase leading-none ${textSize}`}
        >
          ATLANIA
        </span>
        {showTagline && (
          <span className="mt-1 font-mono text-[9px] tracking-[0.22em] text-[#A3A1BD] uppercase">
            Exploración · Análogos · Conexión Planetaria
          </span>
        )}
      </span>
    </span>
  );
}
