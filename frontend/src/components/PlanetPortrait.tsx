import Image from "next/image";
import type { PlanetaryBody } from "@/types/analog";
import { PLANET_VISUALS } from "@/lib/planetaryVisuals";

export function PlanetPortrait({
  body,
  className = "h-5 w-5",
  spinning = false,
}: {
  body: PlanetaryBody;
  className?: string;
  spinning?: boolean;
}) {
  const planet = PLANET_VISUALS[body];
  const rimGlow =
    body === "Mars"
      ? "shadow-[0_0_24px_rgba(224,122,95,0.35),inset_0_0_12px_rgba(224,122,95,0.22)]"
      : "shadow-[0_0_24px_rgba(103,217,237,0.3),inset_0_0_12px_rgba(103,217,237,0.2)]";

  return (
    <span
      aria-hidden="true"
      className={`relative inline-block shrink-0 overflow-hidden rounded-full bg-black ${spinning ? rimGlow : ""} ${className}`}
    >
      <Image
        src={planet.image}
        alt=""
        fill
        sizes={spinning ? "192px" : "48px"}
        quality={90}
        className={`object-cover ${
          spinning ? "animate-[spin_28s_linear_infinite] will-change-transform" : ""
        } ${body === "Moon" ? "scale-[1.12]" : "scale-[1.04]"}`}
      />
      {spinning && (
        <span
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 28% 28%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 42%, rgba(2,6,14,0.55) 78%, rgba(2,6,14,0.88) 100%)",
          }}
        />
      )}
    </span>
  );
}
