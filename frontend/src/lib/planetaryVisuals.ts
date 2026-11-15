import type { PlanetaryBody } from "../types/analog";

export const PLANET_VISUALS = {
  Moon: { label: "Luna", image: "/nasa/moon-navigation.jpg", accent: "#67D9ED" },
  Mars: { label: "Marte", image: "/nasa/mars-orb.jpg", accent: "#E79A78" },
} satisfies Record<PlanetaryBody, { label: string; image: string; accent: string }>;

interface SitePhoto {
  image: string;
  caption: string;
  credit: string;
}

// Context images already identified in the mission briefing. Do not imply that
// a regional satellite image is a photograph of the exact sampled coordinate.
export const SITE_PHOTOS: Record<string, SitePhoto> = {
  "galapagos-lava-tubes": {
    image: "/nasa/galapagos-isabela.jpg",
    caption: "Isla Isabela, Galápagos · contexto regional",
    credit: "NASA / JPL / USGS · PIA18564",
  },
  "haughton-crater": {
    image: "/nasa/devon-haughton.jpg",
    caption: "Exploración en el cráter Haughton, isla Devon",
    credit: "NASA Ames · ARC-2007-ACD07-0170-005",
  },
  "atacama-yungay": {
    image: "/nasa/atacama-salar.jpg",
    caption: "Desierto de Atacama · contexto regional",
    credit: "NASA / JPL-Caltech / ASTER · PIA23420",
  },
  "craters-of-the-moon": {
    image: "/nasa/craters-of-the-moon.jpg",
    caption: "Coladas volcánicas de Craters of the Moon, Idaho",
    credit: "NASA / JPL-Caltech / ASTER · PIA26501",
  },
};
