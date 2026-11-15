"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { AnalogDataset, DimensionScores } from "@/types/analog";
import { AsiRadarChart } from "@/components/AsiRadarChart";
import { MethodologyDialog } from "@/components/MethodologyDialog";
import { translateSite, translateTarget } from "@/lib/spanishTranslations";
import { BrandLogo, type BrandId } from "@/components/briefing/BrandLogo";
import {
  ScientificIcon,
  type ScientificConcept,
} from "@/components/briefing/ScientificIcon";
import { AtlaniaLockup } from "@/components/AtlaniaBrand";
import { ScrollScene } from "@/components/briefing/ScrollScene";
import { MissionChapter } from "@/components/briefing/MissionChapter";
import { TerrainLayers } from "@/components/briefing/TerrainLayers";
import { ExplorerTransition } from "@/components/briefing/ExplorerTransition";
import {
  ArrowDown,
  ArrowUpRight,
  ExternalLink,
  Orbit,
  Radio,
  Satellite,
  ShieldAlert,
  X,
} from "lucide-react";

interface MissionBriefingLandingProps {
  dataset: AnalogDataset;
}

interface TargetMediaMeta {
  image: string;
  nasaId: string;
  credit: string;
  archiveUrl: string;
  alt: string;
}

const TARGET_MEDIA: Record<string, TargetMediaMeta> = {
  "shackleton-crater": {
    image: "/nasa/shackleton-south-pole.jpg",
    nasaId: "PIA12892",
    credit: "NASA / JPL / GSFC / Arizona State University (LRO LROC)",
    archiveUrl:
      "https://science.nasa.gov/resource/shackleton-craters-illuminated-rim-shadowed-interior/",
    alt: "Paredes escalonadas y sombras profundas en un cráter lunar capturadas por Lunar Reconnaissance Orbiter",
  },
  "mare-tranquillitatis": {
    image: "/nasa/mare-tranquillitatis-pit.jpg",
    nasaId: "GSFC_20171208_Archive_e001029",
    credit: "NASA / GSFC / Arizona State University (LRO LROC)",
    archiveUrl:
      "https://www.nasa.gov/solar-system/nasas-lro-finds-lunar-pits-harbor-comfortable-temperatures/",
    alt: "Fosa de colapso en Mare Tranquillitatis observada verticalmente por la cámara LROC de la NASA",
  },
  "mouton-mons": {
    image: "/nasa/mouton-mons-artemis.jpg",
    nasaId: "art002e009283",
    credit: "NASA / JSC (Misión Artemis I — Región Polar Sur Lunar)",
    archiveUrl:
      "https://www.nasa.gov/reference/artemis-iii-candidate-landing-regions/",
    alt: "Región de cráteres y mesetas del polo sur lunar fotografiada durante la misión Artemis I de la NASA",
  },
  "jezero-crater": {
    image: "/nasa/jezero-crater-delta.jpg",
    nasaId: "PIA24814",
    credit:
      "NASA / JPL-Caltech / University of Arizona (MRO HiRISE & Perseverance)",
    archiveUrl:
      "https://www.jpl.nasa.gov/news/nasas-perseverance-rover-deciphers-ancient-history-of-martian-lake/",
    alt: "Escarpes deltaicos y butte Kodiak en el Cráter Jezero de Marte vistos desde órbita por MRO HiRISE",
  },
  "olympus-mons-flank": {
    image: "/nasa/olympus-mons.jpg",
    nasaId: "PIA02982",
    credit: "NASA / JPL / USGS (Mosaico Orbital Viking de Olympus Mons)",
    archiveUrl: "https://science.nasa.gov/photojournal/the-flows-of-olympus/",
    alt: "Mosaico orbital a color del escudo volcánico Olympus Mons y su escarpe basal en Marte",
  },
  "valles-marineris": {
    image: "/nasa/valles-marineris.jpg",
    nasaId: "PIA00422",
    credit: "NASA / JPL / USGS (Mosaico Orbital de Valles Marineris)",
    archiveUrl:
      "https://science.nasa.gov/resource/valles-marineris-the-grand-canyon-of-mars/",
    alt: "Sistema de cañones tectónicos Valles Marineris a lo largo del ecuador marciano",
  },
};

interface HeroSatelliteMeta {
  id: "landsat9" | "sentinel1" | "suomi-npp";
  name: string;
  agency: string;
  instrument: string;
  orbit: string;
  resolution: string;
  spectrum: string;
  roleInAtlania: string;
  analogSites: string;
  limitations: string;
  image: string;
  width: number;
  height: number;
  officialUrl: string;
}

const HERO_SATELLITES: Record<HeroSatelliteMeta["id"], HeroSatelliteMeta> = {
  landsat9: {
    id: "landsat9",
    name: "Landsat 9",
    agency: "NASA / USGS",
    instrument: "OLI-2 (Óptico) + TIRS-2 (Infrarrojo Térmico)",
    orbit: "705 km · Heliosíncrona (16 días de revisita)",
    resolution: "15 m pancromático · 30 m VNIR/SWIR · 100 m térmico",
    spectrum: "Visible, NIR, SWIR y bandas térmicas 10–11",
    roleInAtlania:
      "Perfil de observatorio candidato para mapear textura geomorfológica, contrastes litológicos y variabilidad térmica superficial en los 35 sitios análogos de ATLANIA.",
    analogSites:
      "Galápagos (tubos basálticos), Salar de Atacama, Cráter Barringer, Mauna Loa e Isla Devon.",
    limitations:
      "Cobertura nubosa y vegetación densa atenúan la señal superficial; no mide temperaturas internas de tubos de lava ni composición mineral directa.",
    image: "/nasa/landsat9-cutout.png",
    width: 900,
    height: 399,
    officialUrl: "https://science.nasa.gov/mission/landsat/oli/",
  },
  sentinel1: {
    id: "sentinel1",
    name: "Sentinel-1",
    agency: "ESA / Copernicus",
    instrument: "C-SAR (Radar de Apertura Sintética)",
    orbit: "693 km · Heliosíncrona polar (6–12 días)",
    resolution: "5 × 20 m (modo Interferometric Wide Swath)",
    spectrum: "Microondas Banda C (5.405 GHz · λ ≈ 5.6 cm)",
    roleInAtlania:
      "Perfil radar asignado para analizar rugosidad superficial, propiedades dieléctricas y lineamientos estructurales incluso a través de nubes densas.",
    analogSites:
      "Chimborazo, Cotopaxi, Lanzarote, Haughton Crater y campos volcánicos de altura.",
    limitations:
      "La banda C no penetra roca basáltica sólida para detectar cavernas profundas; el relieve abrupto introduce sombreado y escorzo radar.",
    image: "/nasa/sentinel1-cutout.png",
    width: 900,
    height: 731,
    officialUrl: "https://sentiwiki.copernicus.eu/web/s1-mission",
  },
  "suomi-npp": {
    id: "suomi-npp",
    name: "Suomi NPP",
    agency: "NASA / NOAA",
    instrument: "VIIRS (Visible Infrared Imaging Radiometer Suite)",
    orbit: "824 km · Polar heliosíncrona (cobertura global diaria)",
    resolution: "375 m – 750 m (bandas de imagen y radiometría)",
    spectrum: "22 canales espectrales (0.412 – 12.01 µm)",
    roleInAtlania:
      "Alimenta en vivo la capa cartográfica NASA GIBS / Worldview VIIRS True Color integrada directamente en el Explorador Geoespacial 3D.",
    analogSites:
      "Cobertura sinóptica continua sobre los 35 análogos terrestres en 5 continentes.",
    limitations:
      "Su resolución espacial regional (375–750 m) es ideal para contexto sinóptico, pero no resuelve micro-cráteres ni bocas de tubos lávicos.",
    image: "/nasa/suomi-npp-cutout.png",
    width: 900,
    height: 682,
    officialUrl: "https://science.nasa.gov/mission/suomi-npp/",
  },
};

interface ComparativeExample {
  id: string;
  body: "Moon" | "Mars";
  bodyLabel: "Luna" | "Marte";
  pairTitle: string;
  earthSiteId: string;
  targetId: string;
  earthImage: string;
  earthNasaId: string;
  earthCredit: string;
  earthAlt: string;
  characteristics: {
    label: string;
    concept: ScientificConcept;
    earthValue: string;
    planetaryValue: string;
    sourceTag: string;
  }[];
}

const COMPARATIVE_EXAMPLES: ComparativeExample[] = [
  {
    id: "moon-lava-tubes",
    body: "Moon",
    bodyLabel: "Luna",
    pairTitle: "Conductos Volcánicos y Refugio Subterráneo",
    earthSiteId: "galapagos-lava-tubes",
    targetId: "mare-tranquillitatis",
    earthImage: "/nasa/galapagos-isabela.jpg",
    earthNasaId: "PIA18564",
    earthCredit: "NASA / JPL / U.S. Geological Survey (Isla Isabela, Galápagos)",
    earthAlt:
      "Vista satelital de NASA de campos volcánicos basálticos en Galápagos, Ecuador",
    characteristics: [
      {
        label: "Topografía",
        concept: "topography",
        earthValue: "Pendiente 4.9° · Relieve suave",
        planetaryValue: "Pendiente 5.0° · Llanura de mare",
        sourceTag: "DEM 90 m",
      },
      {
        label: "Geología",
        concept: "geology",
        earthValue: "Basalto (1.0) y regolito/tefra (0.4)",
        planetaryValue: "Basalto lunar (1.0) y regolito (0.8)",
        sourceTag: "Litología",
      },
      {
        label: "Clima",
        concept: "thermal",
        earthValue: "Media 23.1°C (21.8°C a 24.4°C)",
        planetaryValue: "Fosa en sombra: ~17°C (Δ2°C)",
        sourceTag: "NASA POWER",
      },
      {
        label: "Ambiente",
        concept: "hydrology",
        earthValue: "2.33 mm/día · Humedad 82.6%",
        planetaryValue: "Vacío anhidro · Sin atmósfera",
        sourceTag: "Humedad",
      },
      {
        label: "Subsuelo",
        concept: "subsurface",
        earthValue: "Tubos de lava y techo natural (1.0)",
        planetaryValue: "Fosa colapsada con cavidad (1.0)",
        sourceTag: "Refugio",
      },
    ],
  },
  {
    id: "moon-polar-crater",
    body: "Moon",
    bodyLabel: "Luna",
    pairTitle: "Cráteres de Impacto y Criósfera Polar",
    earthSiteId: "haughton-crater",
    targetId: "shackleton-crater",
    earthImage: "/nasa/devon-haughton.jpg",
    earthNasaId: "ARC-2007-ACD07-0170-005",
    earthCredit:
      "NASA Ames Research Center (Haughton Crater, Isla Devon, Canadá)",
    earthAlt:
      "Rovers experimentales de la NASA operando sobre brechas y permafrost en el Cráter Haughton",
    characteristics: [
      {
        label: "Topografía",
        concept: "topography",
        earthValue: "Pendiente 2.9° (escarpe 12°)",
        planetaryValue: "Taludes interiores ~20°",
        sourceTag: "DEM 90 m",
      },
      {
        label: "Geología",
        concept: "geology",
        earthValue: "Brechas de impacto y regolito polar",
        planetaryValue: "Regolito polar e impacto (1.0)",
        sourceTag: "Litología",
      },
      {
        label: "Clima",
        concept: "thermal",
        earthValue: "-19.2°C a -13.9°C (Ártico)",
        planetaryValue: "Trampa fría: -183°C (Δ10°C)",
        sourceTag: "NASA POWER",
      },
      {
        label: "Ambiente",
        concept: "hydrology",
        earthValue: "Permafrost activo · 0.44 mm/día",
        planetaryValue: "Hielo atrapado en sombra (0.95)",
        sourceTag: "Criósfera",
      },
      {
        label: "Subsuelo",
        concept: "subsurface",
        earthValue: "Suelo helado para perforación ISRU",
        planetaryValue: "Regolito criogénico compacto",
        sourceTag: "ISRU",
      },
    ],
  },
  {
    id: "mars-paleolake",
    body: "Mars",
    bodyLabel: "Marte",
    pairTitle: "Cuencas Hiperáridas, Evaporitas y Paleolagos",
    earthSiteId: "atacama-yungay",
    targetId: "jezero-crater",
    earthImage: "/nasa/atacama-salar.jpg",
    earthNasaId: "PIA23420",
    earthCredit:
      "NASA / JPL-Caltech / ASTER Science Team (Desierto de Atacama, Chile)",
    earthAlt:
      "Imagen satelital ASTER de depósitos evaporíticos y cuencas hiperáridas en Atacama, Chile",
    characteristics: [
      {
        label: "Topografía",
        concept: "topography",
        earthValue: "Pendiente 3.8° · Planicie aluvial",
        planetaryValue: "Pendiente 6.0° · Piso y delta",
        sourceTag: "DEM 90 m",
      },
      {
        label: "Geología",
        concept: "geology",
        earthValue: "Sedimentos, evaporitas y regolito",
        planetaryValue: "Delta de arcillas, basalto y sales",
        sourceTag: "Litología",
      },
      {
        label: "Clima",
        concept: "thermal",
        earthValue: "10.6°C a 24.4°C (Δ13.8°C)",
        planetaryValue: "Media -60°C (-95°C a -25°C)",
        sourceTag: "NASA POWER",
      },
      {
        label: "Ambiente",
        concept: "hydrology",
        earthValue: "Hiperárido: 0.04 mm/día · 32% HR",
        planetaryValue: "Árido actual con paleolago (1.0)",
        sourceTag: "Aridez",
      },
      {
        label: "Subsuelo",
        concept: "subsurface",
        earthValue: "Sulfatos y percloratos someros",
        planetaryValue: "Estratos lacustres para muestreo",
        sourceTag: "Testigos",
      },
    ],
  },
  {
    id: "mars-volcanic-shield",
    body: "Mars",
    bodyLabel: "Marte",
    pairTitle: "Escudos Basálticos y Conductos Volcánicos",
    earthSiteId: "craters-of-the-moon",
    targetId: "olympus-mons-flank",
    earthImage: "/nasa/craters-of-the-moon.jpg",
    earthNasaId: "PIA26501",
    earthCredit:
      "NASA / JPL-Caltech / ASTER (Craters of the Moon, Idaho, EE. UU.)",
    earthAlt:
      "Imagen orbital ASTER de coladas de lava basáltica oscura en Craters of the Moon",
    characteristics: [
      {
        label: "Topografía",
        concept: "topography",
        earthValue: "Pendiente 0.9° (local 6°) · Lava",
        planetaryValue: "Flanco volcánico ~8.0° rugoso",
        sourceTag: "DEM 90 m",
      },
      {
        label: "Geología",
        concept: "geology",
        earthValue: "Basalto (1.0) y regolito (0.65)",
        planetaryValue: "Coladas basálticas y regolito",
        sourceTag: "Litología",
      },
      {
        label: "Clima",
        concept: "thermal",
        earthValue: "Media 8.2°C (1.9°C a 14.4°C)",
        planetaryValue: "Flanco expuesto: -65°C (Δ80°C)",
        sourceTag: "NASA POWER",
      },
      {
        label: "Ambiente",
        concept: "hydrology",
        earthValue: "0.91 mm/día · Presión 83.2 kPa",
        planetaryValue: "Atmósfera CO₂ (~0.65 kPa)",
        sourceTag: "Presión",
      },
      {
        label: "Subsuelo",
        concept: "subsurface",
        earthValue: "Tubos de lava y refugio (1.0)",
        planetaryValue: "Canales de lava colapsados (1.0)",
        sourceTag: "Refugio",
      },
    ],
  },
];

const DIMENSION_LABELS: {
  key: keyof DimensionScores;
  concept: ScientificConcept;
  label: string;
  formulaNote: string;
}[] = [
  {
    key: "topography",
    concept: "topography",
    label: "Topografía y pendiente",
    formulaNote: "",
  },
  {
    key: "geology",
    concept: "geology",
    label: "Geología y litología",
    formulaNote: "",
  },
  {
    key: "thermal",
    concept: "thermal",
    label: "Régimen térmico",
    formulaNote: "",
  },
  {
    key: "hydrology_ice",
    concept: "hydrology",
    label: "Aridez y hielo",
    formulaNote: "",
  },
  {
    key: "subsurface_ops",
    concept: "subsurface",
    label: "Subsuelo y refugio",
    formulaNote: "",
  },
];

const SHORT_TARGET_SUMMARIES: Record<string, string> = {
  "shackleton-crater": "Trampa fría polar (-183°C) con hielo para Artemis.",
  "mare-tranquillitatis": "Fosa volcánica lunar (~17°C) ideal para refugio.",
  "jezero-crater": "Antiguo paleolago con delta de arcillas y carbonatos.",
  "olympus-mons-flank": "Escudo volcánico gigante con canales de lava.",
  "mouton-mons": "Meseta polar plana candidata de aterrizaje Artemis III.",
  "valles-marineris": "Cañón tectónico con taludes de basalto y sulfatos.",
};

export function MissionBriefingLanding({
  dataset,
}: MissionBriefingLandingProps) {
  const [activeBodyTab, setActiveBodyTab] = useState<"Moon" | "Mars">("Moon");
  const [activeExampleId, setActiveExampleId] =
    useState<string>("moon-lava-tubes");
  const [activePipelineStep, setActivePipelineStep] = useState<number>(0);
  const [focusedLayer, setFocusedLayer] = useState<-1 | 0 | 1 | 2 | 3 | 4>(0);

  // Real ASI inspection state (strictly reading precalculated dataset values)
  const [selectedAsiSiteId, setSelectedAsiSiteId] = useState<string>(
    dataset.sites[0]?.id ?? "galapagos-lava-tubes"
  );
  const [selectedAsiTargetId, setSelectedAsiTargetId] = useState<string>(
    dataset.sites[0]?.best_target ?? "mare-tranquillitatis"
  );

  // Destinations filter ("ALL" | "Moon" | "Mars")
  const [destinationFilter, setDestinationFilter] = useState<
    "ALL" | "Moon" | "Mars"
  >("ALL");

  // Interactive orbital satellite modal state
  const [selectedSatelliteId, setSelectedSatelliteId] = useState<
    HeroSatelliteMeta["id"] | null
  >(null);

  useEffect(() => {
    if (!selectedSatelliteId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedSatelliteId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedSatelliteId]);

  const LANDING_PHASES = useMemo(
    () => [
      { id: "capitulo-1", label: "01 · Inicio", offsetVh: 0 },
      { id: "el-desafio", label: "02 · La Tierra", offsetVh: 0 },
      { id: "capas-del-terreno", label: "03 · Estrato 01", offsetVh: 0 },
      { id: "capas-del-terreno", label: "03 · Estrato 02", offsetVh: 1 },
      { id: "capas-del-terreno", label: "03 · Estrato 03", offsetVh: 2 },
      { id: "capas-del-terreno", label: "03 · Estrato 04", offsetVh: 3 },
      { id: "nuestra-solucion", label: "03 · Solución", offsetVh: 0 },
      { id: "que-es-un-analogo", label: "04 · Comparación", offsetVh: 0 },
      { id: "similitud-asi", label: "04 · Índice ASI", offsetVh: 0 },
      { id: "explora-los-destinos", label: "04 · Destinos", offsetVh: 0 },
      { id: "acceso-al-explorador", label: "05 · Explorador", offsetVh: 0 },
    ],
    []
  );

  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);

  const getPhaseY = useCallback(
    (idx: number) => {
      const phase = LANDING_PHASES[idx];
      if (!phase) return 0;
      if (phase.id === "capitulo-1") return 0;
      const el = document.getElementById(phase.id);
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      return Math.max(
        0,
        Math.round(rect.top + window.scrollY + phase.offsetVh * window.innerHeight)
      );
    },
    [LANDING_PHASES]
  );

  const navigatePhase = useCallback(
    (delta: -1 | 1) => {
      const nextIdx = Math.max(
        0,
        Math.min(LANDING_PHASES.length - 1, currentPhaseIdx + delta)
      );
      setCurrentPhaseIdx(nextIdx);
      const targetY = getPhaseY(nextIdx);
      window.scrollTo({ top: targetY, behavior: "smooth" });
    },
    [LANDING_PHASES.length, currentPhaseIdx, getPhaseY]
  );

  useEffect(() => {
    const syncPhaseOnScroll = () => {
      const y = window.scrollY + window.innerHeight * 0.28;
      let active = 0;
      for (let i = 0; i < LANDING_PHASES.length; i++) {
        if (getPhaseY(i) <= y) active = i;
      }
      setCurrentPhaseIdx(active);
    };
    syncPhaseOnScroll();
    window.addEventListener("scroll", syncPhaseOnScroll, { passive: true });
    return () => window.removeEventListener("scroll", syncPhaseOnScroll);
  }, [LANDING_PHASES, getPhaseY]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (selectedSatelliteId || document.querySelector('[role="dialog"]')) {
        return;
      }
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        navigatePhase(1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        navigatePhase(-1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedSatelliteId, navigatePhase]);

  const translatedSites = useMemo(
    () => dataset.sites.map((site) => translateSite(site)),
    [dataset.sites]
  );

  const translatedReferences = useMemo(() => {
    const map: Record<string, ReturnType<typeof translateTarget>> = {};
    for (const [k, v] of Object.entries(dataset.references)) {
      map[k] = translateTarget(v);
    }
    return map;
  }, [dataset.references]);

  const referenceList = useMemo(
    () => Object.values(translatedReferences),
    [translatedReferences]
  );

  const filteredDestinations = useMemo(() => {
    if (destinationFilter === "ALL") return referenceList;
    return referenceList.filter((r) => r.body === destinationFilter);
  }, [referenceList, destinationFilter]);

  const activeComparativeExample = useMemo(() => {
    const found = COMPARATIVE_EXAMPLES.find((ex) => ex.id === activeExampleId);
    if (found && found.body === activeBodyTab) return found;
    return (
      COMPARATIVE_EXAMPLES.find((ex) => ex.body === activeBodyTab) ??
      COMPARATIVE_EXAMPLES[0]
    );
  }, [activeExampleId, activeBodyTab]);

  const activeComparativeSite = useMemo(
    () =>
      translatedSites.find(
        (s) => s.id === activeComparativeExample.earthSiteId
      ) ?? translatedSites[0],
    [translatedSites, activeComparativeExample]
  );

  const activeComparativeTarget = useMemo(
    () =>
      translatedReferences[activeComparativeExample.targetId] ??
      Object.values(translatedReferences)[0],
    [translatedReferences, activeComparativeExample]
  );

  const selectedAsiSite = useMemo(
    () =>
      translatedSites.find((s) => s.id === selectedAsiSiteId) ??
      translatedSites[0],
    [translatedSites, selectedAsiSiteId]
  );

  const selectedAsiTarget = useMemo(
    () =>
      translatedReferences[selectedAsiTargetId] ??
      translatedReferences[selectedAsiSite?.best_target ?? ""] ??
      Object.values(translatedReferences)[0],
    [translatedReferences, selectedAsiTargetId, selectedAsiSite]
  );

  // Strictly read the precalculated score from dataset.sites[i].scores[targetId]
  const selectedAsiScore = useMemo(() => {
    if (!selectedAsiSite) return null;
    return (
      selectedAsiSite.scores[selectedAsiTargetId] ??
      selectedAsiSite.scores[selectedAsiSite.best_target] ??
      null
    );
  }, [selectedAsiSite, selectedAsiTargetId]);

  const challengeCards = useMemo(
    () => [
      {
        id: "where-simulate",
        concept: "topography" as ScientificConcept,
        question: "¿Dónde probamos misiones lunares o marcianas?",
        tag: "Análogos",
        shortAnswer:
          "En desiertos, volcanes y zonas polares de la Tierra.",
        detail:
          "Tubos de lava en Galápagos, salares en Atacama o hielo en Chimborazo aíslan variables reales antes de despegar.",
        metricLabel: "Cobertura del catálogo",
        metricValue: `${translatedSites.length} sitios en ${
          new Set(translatedSites.map((s) => s.country)).size
        } países y regiones`,
      },
      {
        id: "what-makes-useful",
        concept: "geology" as ScientificConcept,
        question: "¿Qué hace útil a un análogo?",
        tag: "5 Ejes ASI",
        shortAnswer:
          "Su similitud en relieve, geología, clima, aridez y subsuelo.",
        detail:
          "Cada destino pondera estos 5 ejes según la misión: tracción de rovers, polvo abrasivo o refugio térmico.",
        metricLabel: "Dimensiones ASI",
        metricValue: `${
          dataset.methodology.dimensions?.length ?? 5
        } ejes · ${Object.keys(dataset.references).length} escenarios PDS`,
      },
      {
        id: "what-differences",
        concept: "gravity" as ScientificConcept,
        question: "¿Qué no puede replicar la Tierra?",
        tag: "Límites Físicos",
        shortAnswer:
          "Gravedad (9.81 m/s²), atmósfera densa y escudo contra radiación.",
        detail:
          "En la Luna (1.62 m/s²) y Marte (3.71 m/s²) cambian la mecánica del suelo, el vacío y la radiación cósmica.",
        metricLabel: "Gravedad comparada",
        metricValue: "Tierra 9.81 vs. Luna 1.62 y Marte 3.71 m/s²",
      },
    ],
    [translatedSites, dataset.methodology.dimensions, dataset.references]
  );

  const pipelineSteps = useMemo(
    () => [
      {
        step: "01 · Recopilar",
        code: "01 // FUENTES ABIERTAS",
        title: "Datos satelitales y archivos NASA",
        description:
          "Clima (NASA POWER), relieve (Copernicus DEM 90 m) y misiones PDS.",
        sources: [
          `NASA POWER (${dataset.methodology.source_counts.nasa_power} sitios)`,
          "Copernicus DEM 90 m",
          "NASA PDS (LRO / MRO)",
          "NASA GIBS VIIRS",
        ],
        brands: ["nasa-power", "copernicus", "nasa-pds"] as BrandId[],
      },
      {
        step: "02 · Analizar",
        code: "02 // TELEMETRÍA",
        title: "Relieve, clima y litología",
        description:
          "Pendientes, rugosidad, amplitud térmica, aridez y perfil de roca.",
        sources: [
          "Gradiente topográfico 90 m",
          "Índice de aridez",
          "Litología difusa",
          "Telemetría verificada",
        ],
        brands: ["python", "open-meteo", "nasa-power"] as BrandId[],
      },
      {
        step: "03 · Comparar",
        code: "03 // ÍNDICE ASI",
        title: "Similitud ASI en 5 dimensiones",
        description:
          "Compara cada sitio terrestre contra 6 destinos de la Luna y Marte.",
        sources: [
          "ASI 0–100 ponderado",
          "Jaccard litológico",
          "Límites físicos reales",
          "Pruebas unitarias",
        ],
        brands: ["python", "nasa-pds"] as BrandId[],
      },
      {
        step: "04 · Explorar",
        code: "04 // EXPLORADOR 3D",
        title: "Estación interactiva de misión",
        description:
          "Globo 3D, comparación lado a lado, sondeo libre y exportación QGIS.",
        sources: [
          "Globo 3D interactivo",
          "Sondeo libre en vivo",
          "Radar de 5 ejes",
          "Exportación GeoJSON / QGIS",
        ],
        brands: ["nextjs", "maplibre", "github"] as BrandId[],
      },
    ],
    [dataset.methodology]
  );

  const currentAsiValue = selectedAsiScore?.overall_asi ?? 0;
  const isSelectedTargetMars = selectedAsiTarget?.body === "Mars";

  return (
    <div className="min-h-screen bg-[#101321] text-[#E4DFD5] selection:bg-[#7CA5B8]/30 selection:text-[#E4DFD5]">
      {/* Accessibility Skip Link */}
      <a
        href="#capitulo-1"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:bg-[#C5A36D] focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-[#101321]"
      >
        Saltar al contenido principal de ATLANIA
      </a>

      {/* =====================================================================
          FLOATING MINIMAL NAVIGATION OVERLAY (NO HEAVY BORDER / NO BOX)
      ===================================================================== */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#55527D]/30 bg-[#121626]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4 sm:px-10 lg:px-16">
          {/* Brand Wordmark */}
          <Link
            href="/"
            className="flex items-center transition-opacity hover:opacity-85"
          >
            <AtlaniaLockup size="sm" />
          </Link>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            <MethodologyDialog dataset={dataset} />

            <Link
              href="/explorer"
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#C5A36D] px-5 py-2 text-xs font-semibold tracking-wider text-[#101321] uppercase transition-transform hover:scale-[1.02] hover:bg-[#d4b47e]"
            >
              <span>Abrir Explorador</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* =====================================================================
          3D SCROLL SCENE WRAPPER (THREE.JS REAL-TIME PLANETARY & TERRAIN CANVAS)
      ===================================================================== */}
      <ScrollScene comparisonBody={activeBodyTab} focusedLayer={focusedLayer}>
        {(scrollState) => {
          const p = scrollState.introProgress;

          // Continuous transition math for Chapter 1 -> Chapter 2 inside the shared sticky viewport
          const ch1Opacity = Math.max(0, 1 - p * 2.5);
          const ch1TranslateY = -p * 110;

          const satOpacity = Math.max(0, 1 - p * 2.15);
          const landsatX = p * 210;
          const landsatY = -p * 125;
          const landsatScale = 1 + p * 0.26;

          const sentinelX = p * 145;
          const sentinelY = -p * 185;
          const sentinelScale = 1 + p * 0.18;

          const suomiX = -p * 95;
          const suomiY = -p * 95;
          const suomiScale = 1 + p * 0.14;

          const ch2Opacity = Math.max(0, Math.min(1, (p - 0.36) * 2.35));
          const ch2TranslateY = Math.max(
            0,
            (1 - Math.min(1, (p - 0.32) * 2.1)) * 64
          );

          return (
            <main>
              {/* ===============================================================
                  CHAPTER 1 & CHAPTER 2 — CONTINUOUS SHARED 3D VIEWPORT STAGE
                  No outer margins, no container boxes. Full-bleed 100vw x 100vh.
              =============================================================== */}
              <div
                id="intro-scroll-track"
                className="relative h-[250vh] w-full snap-start snap-always"
              >
                {/* Invisible anchor at 55% of the track so clicking "02 · La Tierra" or snapping lands in Chapter 2 */}
                <div
                  id="el-desafio"
                  aria-hidden="true"
                  className="pointer-events-none absolute top-[135vh] left-0 h-screen w-full snap-start snap-always"
                />

                <div
                  id="capitulo-1"
                  className="sticky top-0 h-screen w-full overflow-hidden"
                >
                  {/* Directional bottom scrim for strict WCAG AA text legibility over centered 3D Earth */}
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-[58vh] bg-gradient-to-t from-[#101321]/95 via-[#101321]/60 to-transparent"
                    aria-hidden="true"
                  />

                  {/* INTEGRATED INTERACTIVE SATELLITE CONSTELLATION (Spread across viewport + All pointing at centered Earth) */}
                  {/* 1. Suomi NPP (VIIRS / NASA GIBS) — Upper-Left, pointing down-right toward Earth */}
                  <div
                    style={{
                      opacity: satOpacity * 0.96,
                      transform: `translate3d(${suomiX}px, ${suomiY}px, 0) scale(${suomiScale})`,
                      pointerEvents: satOpacity < 0.15 ? "none" : "auto",
                    }}
                    className="hidden sm:absolute sm:top-[13%] sm:left-[3%] sm:z-30 sm:block sm:w-[205px] lg:top-[12%] lg:left-[5%] lg:w-[245px] xl:w-[270px]"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedSatelliteId("suomi-npp")}
                      aria-label="Inspeccionar telemetría del satélite NASA/NOAA Suomi NPP"
                      className="group relative block w-full cursor-pointer rounded-2xl text-left transition-transform duration-300 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D] focus-visible:ring-offset-4 focus-visible:ring-offset-[#101321]"
                    >
                      {/* Nadir Reflector / VIIRS Scan Cone pointing down-right onto Earth */}
                      <svg
                        viewBox="0 0 220 220"
                        aria-hidden="true"
                        className="pointer-events-none absolute top-[55%] left-[52%] -z-10 h-[160px] w-[160px] opacity-75 transition-opacity duration-300 group-hover:opacity-100 lg:h-[200px] lg:w-[200px]"
                      >
                        <defs>
                          <linearGradient id="beam-suomi" x1="10%" y1="5%" x2="90%" y2="95%">
                            <stop offset="0%" stopColor="#7CA5B8" stopOpacity="0.52" />
                            <stop offset="50%" stopColor="#7CA5B8" stopOpacity="0.16" />
                            <stop offset="100%" stopColor="#7CA5B8" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <polygon points="15,12 205,155 115,210" fill="url(#beam-suomi)" />
                        <line x1="15" y1="12" x2="165" y2="185" stroke="#7CA5B8" strokeOpacity="0.34" strokeWidth="1" strokeDasharray="4 5" />
                      </svg>

                      <div className="mb-sat-float-c relative">
                        <div className="relative -rotate-[12deg]">
                          <div
                            className="absolute inset-6 -z-10 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(124,165,184,0.22),transparent_70%)] blur-2xl"
                            aria-hidden="true"
                          />
                          <Image
                            src="/nasa/suomi-npp-cutout.png"
                            alt="Satélite NASA/NOAA Suomi NPP con sensor VIIRS apuntando hacia la Tierra"
                            width={900}
                            height={682}
                            priority
                            sizes="(max-width: 1024px) 205px, 270px"
                            className="h-auto w-full object-contain brightness-[0.95] contrast-[1.06] saturate-[0.86] drop-shadow-[0_20px_36px_rgba(0,0,0,0.85)]"
                          />
                        </div>
                      </div>

                      {/* Leader-line callout (no box) */}
                      <span className="mt-2 inline-flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#E4DFD5] drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] transition-colors group-hover:text-[#7CA5B8] sm:text-[11px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#7CA5B8] shadow-[0_0_8px_#7CA5B8]" aria-hidden="true" />
                        <span className="h-px w-7 bg-gradient-to-r from-[#7CA5B8] to-[#7CA5B8]/25 transition-all duration-300 group-hover:w-10" aria-hidden="true" />
                        SUOMI NPP · VIIRS
                      </span>
                    </button>
                  </div>

                  {/* 2. Sentinel-1 (C-SAR Radar) — Upper-Right, pointing down-left toward Earth */}
                  <div
                    style={{
                      opacity: satOpacity,
                      transform: `translate3d(${sentinelX}px, ${sentinelY}px, 0) scale(${sentinelScale})`,
                      pointerEvents: satOpacity < 0.15 ? "none" : "auto",
                    }}
                    className="absolute top-[11%] right-[2%] z-30 w-[170px] select-none will-change-transform sm:top-[12%] sm:right-[4%] sm:w-[245px] lg:right-[6%] lg:w-[295px] xl:w-[330px]"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedSatelliteId("sentinel1")}
                      aria-label="Inspeccionar telemetría del satélite Copernicus Sentinel-1"
                      className="group relative block w-full cursor-pointer rounded-2xl text-left transition-transform duration-300 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D] focus-visible:ring-offset-4 focus-visible:ring-offset-[#101321]"
                    >
                      {/* Nadir Reflector / C-SAR Scan Cone pointing down-left toward Earth */}
                      <svg
                        viewBox="0 0 220 220"
                        aria-hidden="true"
                        className="pointer-events-none absolute top-[46%] right-[44%] -z-10 h-[155px] w-[155px] origin-top-right opacity-70 transition-opacity duration-300 group-hover:opacity-100 sm:h-[220px] sm:w-[220px]"
                      >
                        <defs>
                          <linearGradient id="beam-sentinel" x1="100%" y1="0%" x2="10%" y2="95%">
                            <stop offset="0%" stopColor="#7CA5B8" stopOpacity="0.52" />
                            <stop offset="45%" stopColor="#7CA5B8" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#7CA5B8" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <polygon points="210,10 10,155 95,215" fill="url(#beam-sentinel)" />
                        <line x1="210" y1="10" x2="50" y2="188" stroke="#7CA5B8" strokeOpacity="0.34" strokeWidth="1" strokeDasharray="4 5" />
                      </svg>

                      <div
                        className="mb-sat-float-b relative"
                        style={{ transformOrigin: "center center" }}
                      >
                        <div className="relative -rotate-[14deg]">
                          <div
                            className="absolute inset-6 -z-10 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(124,165,184,0.22),transparent_70%)] blur-2xl"
                            aria-hidden="true"
                          />
                          <Image
                            src="/nasa/sentinel1-cutout.png"
                            alt="Satélite Copernicus Sentinel-1 con antena radar C-SAR apuntando hacia la Tierra"
                            width={900}
                            height={731}
                            priority
                            sizes="(max-width: 640px) 170px, (max-width: 1024px) 245px, 330px"
                            className="h-auto w-full object-contain brightness-[1.18] contrast-[1.05] saturate-[0.92] drop-shadow-[0_24px_42px_rgba(0,0,0,0.88)]"
                          />
                        </div>
                      </div>

                      {/* Leader-line callout (no box) */}
                      <span className="mt-1 inline-flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#E4DFD5] drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] transition-colors group-hover:text-[#7CA5B8] sm:text-[11px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#7CA5B8] shadow-[0_0_8px_#7CA5B8]" aria-hidden="true" />
                        <span className="h-px w-7 bg-gradient-to-r from-[#7CA5B8] to-[#7CA5B8]/25 transition-all duration-300 group-hover:w-10" aria-hidden="true" />
                        SENTINEL-1 · C-SAR
                      </span>
                    </button>
                  </div>

                  {/* 3. Landsat 9 (OLI-2 / TIRS-2) — Lower-Right, pointing up-left toward centered Earth */}
                  <div
                    style={{
                      opacity: satOpacity,
                      transform: `translate3d(${landsatX}px, ${landsatY}px, 0) scale(${landsatScale})`,
                      pointerEvents: satOpacity < 0.15 ? "none" : "auto",
                    }}
                    className="absolute right-[-3%] bottom-[22%] z-30 w-[240px] select-none will-change-transform sm:right-[2%] sm:bottom-[21%] sm:w-[340px] lg:right-[3%] lg:bottom-[23%] lg:w-[410px] xl:w-[450px]"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedSatelliteId("landsat9")}
                      aria-label="Inspeccionar telemetría del satélite NASA/USGS Landsat 9"
                      className="group relative block w-full cursor-pointer rounded-2xl text-left transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D] focus-visible:ring-offset-4 focus-visible:ring-offset-[#101321]"
                    >
                      {/* Nadir Reflector / OLI-2 + TIRS-2 Scan Cone pointing up-left toward centered Earth */}
                      <svg
                        viewBox="0 0 260 190"
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-[16%] -left-[34%] -z-10 h-[145px] w-[195px] opacity-75 transition-opacity duration-300 group-hover:opacity-100 sm:h-[185px] sm:w-[250px]"
                      >
                        <defs>
                          <linearGradient id="beam-landsat" x1="95%" y1="75%" x2="5%" y2="20%">
                            <stop offset="0%" stopColor="#7CA5B8" stopOpacity="0.54" />
                            <stop offset="45%" stopColor="#7CA5B8" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#7CA5B8" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <polygon points="250,140 8,25 22,125" fill="url(#beam-landsat)" />
                        <line x1="250" y1="140" x2="18" y2="75" stroke="#7CA5B8" strokeOpacity="0.34" strokeWidth="1" strokeDasharray="4 5" />
                      </svg>

                      <div className="mb-sat-float-a relative">
                        <div className="relative rotate-[18deg]">
                          <div
                            className="absolute inset-6 -z-10 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(124,165,184,0.24),transparent_68%)] blur-2xl"
                            aria-hidden="true"
                          />
                          <Image
                            src="/nasa/landsat9-cutout.png"
                            alt="Satélite NASA/USGS Landsat 9 con instrumentos OLI-2 y TIRS-2 apuntando hacia la Tierra"
                            width={900}
                            height={399}
                            priority
                            sizes="(max-width: 640px) 240px, (max-width: 1024px) 340px, 450px"
                            className="h-auto w-full object-contain brightness-[1.08] contrast-[1.05] saturate-[0.95] drop-shadow-[0_28px_48px_rgba(0,0,0,0.92)]"
                          />
                        </div>
                      </div>

                      {/* Leader-line callout (no box, right-aligned) */}
                      <span className="mt-2 flex w-full items-center justify-end gap-2 pr-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#E4DFD5] drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] transition-colors group-hover:text-[#7CA5B8] sm:pr-6 sm:text-[11px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#7CA5B8] shadow-[0_0_8px_#7CA5B8]" aria-hidden="true" />
                        <span className="h-px w-8 bg-gradient-to-r from-[#7CA5B8] to-[#7CA5B8]/25 transition-all duration-300 group-hover:w-11" aria-hidden="true" />
                        LANDSAT 9 · OLI-2 / TIRS-2
                      </span>
                    </button>
                  </div>

                  {/* CHAPTER 1 EDITORIAL CONTENT (Bottom-center over Earth horizon, fades out upward on scroll) */}
                  <div
                    style={{
                      opacity: ch1Opacity,
                      transform: `translate3d(0, ${ch1TranslateY}px, 0)`,
                      pointerEvents: ch1Opacity < 0.15 ? "none" : "auto",
                    }}
                    className="relative z-20 mx-auto flex h-full max-w-[1440px] flex-col justify-end px-6 pt-24 pb-6 will-change-transform sm:px-10 lg:px-16 lg:pb-8"
                  >
                    <div className="mx-auto mb-6 max-w-3xl text-center">
                      <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[#C5A36D] uppercase sm:text-xs">
                        NASA SPACE APPS CHALLENGE · OBSERVATORIO PLANETARIO
                      </p>

                      <h1 className="atlania-hero-title mt-3 text-6xl font-normal tracking-[0.06em] sm:text-7xl lg:text-[6.25rem] lg:leading-[0.95]">
                        ATLANIA
                      </h1>

                      <p className="mt-2 font-display italic text-base tracking-wide text-[#C5A36D] sm:text-lg">
                        Somewhere between Earth and the stars.
                      </p>

                      <p className="mx-auto mt-3 max-w-xl text-base font-medium leading-snug text-[#E4DFD5] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] sm:text-xl">
                        Para explorar otros mundos, primero desciframos el nuestro.
                      </p>
                    </div>

                    {/* Primary CTAs centered at bottom above telemetry bar */}
                    <div className="w-full">
                      <div className="mb-4 flex flex-wrap items-center justify-center gap-4">
                        <Link
                          href="/explorer"
                          className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#C5A36D] px-7 py-3.5 text-sm font-bold text-[#101321] shadow-lg transition-all hover:bg-[#d4b47e]"
                        >
                          <span>Iniciar exploración</span>
                          <ArrowUpRight className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
                        </Link>

                        <a
                          href="#el-desafio"
                          className="inline-flex min-h-12 items-center gap-2.5 rounded-full border border-[#55527D]/35 bg-[#181B2C]/85 px-6 py-3.5 text-sm font-semibold text-[#E4DFD5] backdrop-blur-md transition-colors hover:border-[#7CA5B8] hover:text-[#7CA5B8]"
                        >
                          <span>Conocer la misión</span>
                          <ArrowDown
                            className="h-4 w-4 text-[#7CA5B8]"
                            aria-hidden="true"
                          />
                        </a>
                      </div>

                      {/* High-contrast frosted bottom telemetry bar */}
                      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#55527D]/35 bg-[#121626]/85 px-4 py-3 text-xs text-[#E4DFD5] backdrop-blur-md sm:text-sm">
                      <div className="flex flex-wrap items-center gap-6 font-mono">
                        <span>
                          CATÁLOGO:{" "}
                          <strong className="font-bold text-[#7CA5B8]">
                            {dataset.sites.length} SITIOS TERRESTRES
                          </strong>
                        </span>
                        <span>
                          REFERENCIAS PDS:{" "}
                          <strong className="font-bold text-[#C5A36D]">
                            {Object.keys(dataset.references).length} ESCENARIOS
                            (LUNA Y MARTE)
                          </strong>
                        </span>
                      </div>
                      <span className="font-mono text-xs font-semibold tracking-[0.16em] text-[#E4DFD5] uppercase">
                        Desplaza para aproximarte a la Tierra ↓
                      </span>
                      </div>
                    </div>
                  </div>

                  {/* CHAPTER 2 EDITORIAL CONTENT — EMERGES IN THE SAME CONTINUOUS SCENE AS CAMERA ADVANCES TOWARD EARTH */}
                  <div
                    style={{
                      opacity: ch2Opacity,
                      transform: `translate3d(0, ${ch2TranslateY}px, 0)`,
                      pointerEvents: ch2Opacity < 0.25 ? "none" : "auto",
                    }}
                    className="absolute inset-0 z-20 mx-auto flex h-full max-w-[1440px] flex-col justify-between px-6 pt-24 pb-10 will-change-transform sm:px-10 lg:px-16 lg:pt-28 lg:pb-12"
                  >
                    <div className="my-auto">
                      <div className="max-w-3xl">
                        <p className="font-mono text-xs font-medium tracking-[0.24em] text-[#7CA5B8] uppercase">
                          02 / APROXIMACIÓN A LA TIERRA · EL DESAFÍO CIENTÍFICO
                        </p>
                        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#E4DFD5] sm:text-5xl lg:text-[3.35rem] lg:leading-[1.06]">
                          Aprender en la Tierra antes de despegar.
                        </h2>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#E4DFD5] sm:text-base">
                          Desiertos hiperáridos, campos volcánicos y cráteres polares funcionan como laboratorios naturales para ensayar misiones lunares y marcianas.
                        </p>
                      </div>

                      {/* Three Open Editorial Columns (Hairline dividers, no boxy cards) */}
                      <div className="mt-8 grid grid-cols-1 gap-6 border-t border-[#55527D]/35 pt-6 lg:grid-cols-3 lg:gap-10">
                        {challengeCards.map((item, idx) => (
                          <div
                            key={item.id}
                            className="group flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-xs font-semibold tracking-wider text-[#7CA5B8] uppercase">
                                  0{idx + 1} · {item.tag}
                                </span>
                                <ScientificIcon
                                  concept={item.concept}
                                  className="h-4 w-4 text-[#A3A1BD]"
                                />
                              </div>
                              <h3 className="mt-2.5 text-lg font-bold leading-snug text-[#E4DFD5]">
                                {item.question}
                              </h3>
                              <p className="mt-2 text-sm leading-relaxed text-[#E4DFD5]">
                                {item.shortAnswer}
                              </p>
                            </div>

                            <div className="mt-4 border-t border-[#55527D]/30 pt-3">
                              <span className="rounded-md border border-[#55527D]/35 bg-[#181B2C]/85 px-2.5 py-1 font-mono text-xs text-[#E4DFD5] tabular-nums">
                                {item.metricValue}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#55527D]/30 pt-3 font-mono text-[11px] text-[#A3A1BD]">
                      <span>
                        TELEMETRÍA ORBITAL · ESCALA PLANETARIA CONTINUA
                      </span>
                      <a
                        href="#capas-del-terreno"
                        className="text-[#7CA5B8] hover:underline"
                      >
                        Descender a las capas del terreno ↓
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===============================================================
                  CHAPTER 3 — CAPAS TRIDIMENSIONALES DEL TERRENO
                  Full-bleed sticky 3D terrain block separation + 4-stage pipeline
              =============================================================== */}
              <section
                id="capas-del-terreno"
                aria-label="Capítulo 03: Capas del Terreno y Arquitectura de Evaluación"
                className="relative snap-start snap-always border-t border-[#55527D]/30"
              >
                <TerrainLayers
                  layerSeparation={scrollState.layerSeparation}
                  focusedLayer={focusedLayer}
                  onSelectLayer={setFocusedLayer}
                  activePipelineStep={activePipelineStep}
                  onSelectPipelineStep={setActivePipelineStep}
                  pipelineSteps={pipelineSteps}
                />
              </section>

              {/* ===============================================================
                  CHAPTER 4 — COMPARACIÓN PLANETARIA Y SIMILITUD ASI
                  Editorial layout with hairline dividers and open negative space
              =============================================================== */}
              <MissionChapter
                id="que-es-un-analogo"
                chapterNumber="04"
                chapterTitle="Comparación Planetaria"
                eyebrow="Tierra vs. Luna y Marte"
                title="Tierra vs. Luna y Marte"
                subtitle="Comparamos regiones terrestres con entornos de la Luna y Marte mediante variables medibles."
              >
                {/* Clean Editorial Selector Bar */}
                <div className="flex flex-wrap items-center justify-between gap-6 border-b border-[#55527D]/30 pb-6">
                  <div
                    role="tablist"
                    aria-label="Seleccionar cuerpo planetario a comparar"
                    className="flex items-center gap-6"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeBodyTab === "Moon"}
                      onClick={() => {
                        setActiveBodyTab("Moon");
                        setActiveExampleId("moon-lava-tubes");
                      }}
                      className={`pb-2 text-sm font-semibold tracking-wider uppercase transition-colors ${
                        activeBodyTab === "Moon"
                          ? "border-b-2 border-[#7CA5B8] text-[#E4DFD5]"
                          : "text-[#A3A1BD] hover:text-[#E4DFD5]"
                      }`}
                    >
                      Análogos Lunares (Luna)
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeBodyTab === "Mars"}
                      onClick={() => {
                        setActiveBodyTab("Mars");
                        setActiveExampleId("mars-paleolake");
                      }}
                      className={`pb-2 text-sm font-semibold tracking-wider uppercase transition-colors ${
                        activeBodyTab === "Mars"
                          ? "border-b-2 border-[#C5A36D] text-[#E4DFD5]"
                          : "text-[#A3A1BD] hover:text-[#E4DFD5]"
                      }`}
                    >
                      Análogos Marcianos (Marte)
                    </button>
                  </div>

                  {/* Scenario Pair Links */}
                  <div className="flex flex-wrap items-center gap-3">
                    {COMPARATIVE_EXAMPLES.filter(
                      (ex) => ex.body === activeBodyTab
                    ).map((ex) => {
                      const active = activeComparativeExample.id === ex.id;
                      return (
                        <button
                          key={ex.id}
                          type="button"
                          onClick={() => setActiveExampleId(ex.id)}
                          className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                            active
                              ? "bg-[#27233E] text-[#C5A36D]"
                              : "border border-[#55527D]/35 text-[#A3A1BD] hover:border-[#55527D]/35 hover:text-[#E4DFD5]"
                          }`}
                        >
                          {ex.pairTitle}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Split Planetary Photography + Editorial Telemetry Table */}
                {activeComparativeSite && activeComparativeTarget && (
                  <div className="mt-12 space-y-12">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
                      {/* Earth Analog Visual */}
                      <figure className="group">
                        <div className="relative h-72 w-full overflow-hidden rounded-2xl sm:h-80">
                          <Image
                            src={activeComparativeExample.earthImage}
                            alt={activeComparativeExample.earthAlt}
                            fill
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#101321] via-transparent to-transparent" />
                          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4">
                            <div>
                              <span className="font-mono text-[11px] tracking-[0.18em] text-[#7CA5B8] uppercase">
                                TIERRA · {activeComparativeSite.country}
                              </span>
                              <h3 className="mt-1 text-2xl font-bold text-[#E4DFD5]">
                                {activeComparativeSite.name}
                              </h3>
                            </div>
                            <span className="font-mono text-xs text-[#E4DFD5] tabular-nums">
                              {activeComparativeSite.latitude.toFixed(2)}°,{" "}
                              {activeComparativeSite.longitude.toFixed(2)}°
                            </span>
                          </div>
                        </div>
                        <figcaption className="mt-3 flex items-center justify-between text-xs text-[#A3A1BD]">
                          <span>{activeComparativeExample.earthCredit}</span>
                          <span className="font-mono">
                            NASA ID: {activeComparativeExample.earthNasaId}
                          </span>
                        </figcaption>
                      </figure>

                      {/* Extraterrestrial Target Visual */}
                      <figure className="group">
                        <div className="relative h-72 w-full overflow-hidden rounded-2xl sm:h-80">
                          <Image
                            src={
                              TARGET_MEDIA[activeComparativeTarget.id]?.image ??
                              "/nasa/mare-tranquillitatis-pit.jpg"
                            }
                            alt={
                              TARGET_MEDIA[activeComparativeTarget.id]?.alt ??
                              activeComparativeTarget.name
                            }
                            fill
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#101321] via-transparent to-transparent" />
                          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4">
                            <div>
                              <span className="font-mono text-[11px] tracking-[0.18em] text-[#C5A36D] uppercase">
                                {activeComparativeExample.bodyLabel} · OBJETIVO
                                DE REFERENCIA
                              </span>
                              <h3 className="mt-1 text-2xl font-bold text-[#E4DFD5]">
                                {activeComparativeTarget.name}
                              </h3>
                            </div>
                            <span className="font-mono text-xs text-[#E4DFD5] tabular-nums">
                              {activeComparativeTarget.instrument ?? "NASA PDS"}
                            </span>
                          </div>
                        </div>
                        <figcaption className="mt-3 flex items-center justify-between text-xs text-[#A3A1BD]">
                          <span>
                            {TARGET_MEDIA[activeComparativeTarget.id]?.credit}
                          </span>
                          <span className="font-mono">
                            ASI REAL:{" "}
                            <strong className="text-[#E4DFD5] tabular-nums">
                              {(
                                activeComparativeSite.scores[
                                  activeComparativeTarget.id
                                ]?.overall_asi ??
                                activeComparativeSite.overall_asi
                              ).toFixed(1)}{" "}
                              / 100
                            </strong>
                          </span>
                        </figcaption>
                      </figure>
                    </div>

                    {/* Clean Hairline Comparison Rows (Zero Card Borders) */}
                    <div className="border-t border-[#55527D]/35">
                      <div className="hidden grid-cols-12 gap-6 border-b border-[#55527D]/30 py-2.5 font-mono text-[11px] tracking-[0.16em] text-[#A3A1BD] uppercase md:grid">
                        <div className="col-span-3">Dimensión</div>
                        <div className="col-span-4 text-[#7CA5B8]">
                          Tierra · {activeComparativeSite.name.split("-")[0].trim()}
                        </div>
                        <div className="col-span-5 text-[#C5A36D]">
                          {activeComparativeExample.bodyLabel} ·{" "}
                          {activeComparativeTarget.name.split("/")[0].trim()}
                        </div>
                      </div>

                      <div className="divide-y divide-[#55527D]/30">
                        {activeComparativeExample.characteristics.map(
                          (row) => (
                            <div
                              key={row.label}
                              className="grid grid-cols-1 gap-2 py-3 md:grid-cols-12 md:items-center md:gap-6"
                            >
                              <div className="flex items-center gap-2.5 md:col-span-3">
                                <ScientificIcon
                                  concept={row.concept}
                                  className="h-4 w-4 shrink-0 text-[#7CA5B8]"
                                />
                                <p className="text-sm font-semibold text-[#E4DFD5]">
                                  {row.label}
                                </p>
                              </div>

                              <div className="font-mono text-sm font-medium text-[#E4DFD5] tabular-nums md:col-span-4">
                                {row.earthValue}
                              </div>

                              <div className="font-mono text-sm font-medium text-[#E4DFD5] tabular-nums md:col-span-5">
                                {row.planetaryValue}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* =============================================================
                    ASI REAL INTERPRETATION SUBSECTION (Clean Editorial Layout)
                ============================================================= */}
                <div
                  id="similitud-asi"
                  className="mt-24 snap-start border-t border-[#55527D]/35 pt-18"
                >
                  <div className="max-w-3xl">
                    <p className="font-mono text-xs font-semibold tracking-wider text-[#7CA5B8] uppercase">
                      ÍNDICE DE SIMILITUD ANÁLOGA (ASI) · ESCALA 0 – 100
                    </p>
                    <h3 className="mt-2 text-3xl font-semibold tracking-tight text-[#E4DFD5] sm:text-4xl">
                      Similitud cuantitativa por misión
                    </h3>
                    <p className="mt-2 text-sm text-[#A3A1BD]">
                      Pondera 5 dimensiones según el destino:{" "}
                      <span className="inline-flex items-center rounded-md border border-[#7CA5B8]/40 bg-[#7CA5B8]/10 px-2 py-0.5 font-mono text-xs font-semibold text-[#7CA5B8]">
                        ASI Global = Σ (Peso[d] × Afinidad[d])
                      </span>
                    </p>
                  </div>

                  {/* Minimal Site & Target Selectors */}
                  <div className="mt-6 grid grid-cols-1 gap-6 border-y border-[#55527D]/30 py-4 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="asi-site-select"
                        className="block font-mono text-[11px] tracking-[0.16em] text-[#7CA5B8] uppercase"
                      >
                        1. Sitio análogo terrestre ({translatedSites.length}{" "}
                        sitios)
                      </label>
                      <select
                        id="asi-site-select"
                        value={selectedAsiSiteId}
                        onChange={(e) => {
                          const newSiteId = e.target.value;
                          setSelectedAsiSiteId(newSiteId);
                          const siteObj = translatedSites.find(
                            (s) => s.id === newSiteId
                          );
                          if (siteObj) {
                            setSelectedAsiTargetId(siteObj.best_target);
                          }
                        }}
                        className="mt-1.5 w-full border-b border-[#55527D]/35 bg-transparent py-2 text-sm font-medium text-[#E4DFD5] focus:border-[#7CA5B8] focus:outline-none"
                      >
                        {translatedSites.map((s) => (
                          <option
                            key={s.id}
                            value={s.id}
                            className="bg-[#101321] text-[#E4DFD5]"
                          >
                            {s.name} ({s.country}) — Mejor ASI:{" "}
                            {s.overall_asi.toFixed(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="asi-target-select"
                        className="block font-mono text-[11px] tracking-[0.16em] text-[#C5A36D] uppercase"
                      >
                        2. Escenario extraterrestre de referencia (6 destinos
                        PDS)
                      </label>
                      <select
                        id="asi-target-select"
                        value={selectedAsiTargetId}
                        onChange={(e) => setSelectedAsiTargetId(e.target.value)}
                        className="mt-1.5 w-full border-b border-[#55527D]/35 bg-transparent py-2 text-sm font-medium text-[#E4DFD5] focus:border-[#C5A36D] focus:outline-none"
                      >
                        {referenceList.map((ref) => {
                          const pairScore =
                            selectedAsiSite?.scores[ref.id]?.overall_asi;
                          return (
                            <option
                              key={ref.id}
                              value={ref.id}
                              className="bg-[#101321] text-[#E4DFD5]"
                            >
                              [{ref.body === "Moon" ? "Luna" : "Marte"}]{" "}
                              {ref.name}
                              {pairScore !== undefined
                                ? ` — ASI: ${pairScore.toFixed(2)}`
                                : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Editorial ASI Breakdown + Radar Chart */}
                  {selectedAsiSite &&
                    selectedAsiTarget &&
                    selectedAsiScore && (
                      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
                        {/* Left 5 Columns: Large Typographic ASI Score + Radar */}
                        <div className="lg:col-span-5">
                          <div className="flex items-baseline justify-between border-b border-[#55527D]/30 pb-4">
                            <div>
                              <span className="font-mono text-xs tracking-[0.18em] text-[#A3A1BD] uppercase">
                                ÍNDICE ASI GLOBAL
                              </span>
                              <div className="mt-1 font-mono text-5xl font-bold tracking-tight text-[#E4DFD5] tabular-nums sm:text-6xl">
                                {currentAsiValue.toFixed(1)}
                                <span className="ml-2 text-base font-normal text-[#A3A1BD]">
                                  / 100
                                </span>
                              </div>
                            </div>
                            <Link
                              href={`/explorer?body=${selectedAsiTarget.body}&target=${selectedAsiTarget.id}&site=${selectedAsiSite.id}`}
                              className="inline-flex items-center gap-1.5 font-mono text-xs text-[#7CA5B8] hover:underline"
                            >
                              <span>Abrir en /explorer</span>
                              <ArrowUpRight
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            </Link>
                          </div>

                          <div className="mt-4">
                            <AsiRadarChart
                              dimensions={selectedAsiScore.dimensions}
                              weights={selectedAsiScore.weights}
                              isMars={isSelectedTargetMars}
                            />
                          </div>
                        </div>

                        {/* Right 7 Columns: 5 Dimension Hairlines + Compact Physical Limits */}
                        <div className="space-y-5 lg:col-span-7">
                          <div className="divide-y divide-[#55527D]/30 border-t border-b border-[#55527D]/30">
                            {DIMENSION_LABELS.map((dim) => {
                              const scoreVal =
                                selectedAsiScore.dimensions[dim.key];
                              const weightVal =
                                selectedAsiScore.weights[dim.key];
                              const weightedContribution = scoreVal * weightVal;

                              return (
                                <div key={dim.key} className="py-2.5">
                                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                      <ScientificIcon
                                        concept={dim.concept}
                                        className="h-4 w-4 text-[#7CA5B8]"
                                      />
                                      <span className="text-sm font-semibold text-[#E4DFD5]">
                                        {dim.label}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4 font-mono text-xs tabular-nums">
                                      <span className="text-[#A3A1BD]">
                                        Peso: {(weightVal * 100).toFixed(0)}%
                                      </span>
                                      <span className="text-[#7CA5B8]">
                                        +{weightedContribution.toFixed(1)} pts
                                      </span>
                                      <span className="font-bold text-[#E4DFD5]">
                                        {scoreVal.toFixed(1)} / 100
                                      </span>
                                    </div>
                                  </div>

                                  <div className="mt-2 h-1 w-full overflow-hidden bg-[#27233E]">
                                    <div
                                      className="h-full bg-[#7CA5B8]"
                                      style={{
                                        width: `${Math.max(
                                          0,
                                          Math.min(100, scoreVal)
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Concise Physical Limits Pills */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wider text-[#C5A36D] uppercase">
                              <ShieldAlert
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              Límites físicos:
                            </span>
                            {[
                              `Gravedad 9.81 vs. ${
                                isSelectedTargetMars ? "3.71" : "1.62"
                              } m/s²`,
                              `Atmósfera vs. ${
                                isSelectedTargetMars
                                  ? "CO₂ tenue (0.6 kPa)"
                                  : "vacío lunar"
                              }`,
                              "Radiación espacial sin magnetosfera",
                            ].map((limitTag) => (
                              <span
                                key={limitTag}
                                className="rounded-full border border-[#55527D]/40 bg-[#181B2C]/80 px-2.5 py-1 font-mono text-[11px] text-[#E4DFD5]"
                              >
                                {limitTag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                </div>

                {/* =============================================================
                    EXPLORA LOS DESTINOS (6 NASA PDS Scenarios)
                ============================================================= */}
                <div
                  id="explora-los-destinos"
                  className="mt-24 snap-start border-t border-[#55527D]/35 pt-18"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                    <div className="max-w-2xl">
                      <p className="font-mono text-xs font-medium tracking-[0.22em] text-[#7CA5B8] uppercase">
                        CATÁLOGO PLANETARIO · 6 ESCENARIOS DE REFERENCIA
                      </p>
                      <h3 className="mt-2 text-3xl font-semibold tracking-tight text-[#E4DFD5] sm:text-4xl">
                        Explora los destinos lunares y marcianos
                      </h3>
                    </div>

                    <div
                      role="group"
                      aria-label="Filtrar escenarios por cuerpo celeste"
                      className="flex items-center gap-3"
                    >
                      {(["ALL", "Moon", "Mars"] as const).map((filterVal) => {
                        const active = destinationFilter === filterVal;
                        const label =
                          filterVal === "ALL"
                            ? "Todos (6)"
                            : filterVal === "Moon"
                              ? "Luna (3)"
                              : "Marte (3)";
                        return (
                          <button
                            key={filterVal}
                            type="button"
                            onClick={() => setDestinationFilter(filterVal)}
                            className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider uppercase transition-colors ${
                              active
                                ? "bg-[#27233E] text-[#C5A36D]"
                                : "border border-[#55527D]/35 text-[#A3A1BD] hover:text-[#E4DFD5]"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
                    {filteredDestinations.map((target) => {
                      const media = TARGET_MEDIA[target.id];
                      const isMars = target.body === "Mars";
                      const rankedAnalogs = [...translatedSites]
                        .map((site) => ({
                          site,
                          score: site.scores[target.id]?.overall_asi ?? 0,
                        }))
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 2);
                      const topAnalog = rankedAnalogs[0];
                      const shortName = target.name.split("/")[0].trim();
                      const shortSummary =
                        SHORT_TARGET_SUMMARIES[target.id] ?? target.context;

                      return (
                        <article
                          key={target.id}
                          className="group flex flex-col justify-between border-t border-[#55527D]/35 pt-4"
                        >
                          <div>
                            <div className="flex items-center justify-between font-mono text-[11px] text-[#A3A1BD]">
                              <span
                                className={
                                  isMars ? "text-[#D47A61]" : "text-[#7CA5B8]"
                                }
                              >
                                {isMars ? "MARTE" : "LUNA"}
                              </span>
                              <span className="tabular-nums">
                                {target.instrument ?? "NASA PDS"}
                              </span>
                            </div>

                            <h4 className="mt-1 text-lg font-bold text-[#E4DFD5]">
                              {shortName}
                            </h4>

                            {media && (
                              <div className="relative mt-2.5 h-34 w-full overflow-hidden rounded-xl">
                                <Image
                                  src={media.image}
                                  alt={media.alt}
                                  fill
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                              </div>
                            )}

                            <p className="mt-2.5 text-xs leading-relaxed text-[#A3A1BD]">
                              {shortSummary}
                            </p>
                          </div>

                          <div className="mt-3 flex items-center justify-between border-t border-[#55527D]/30 pt-2.5">
                            <span className="truncate font-mono text-[11px] text-[#A3A1BD]">
                              Análogo:{" "}
                              <strong className="font-normal text-[#E4DFD5]">
                                {topAnalog?.site.name.split("(")[0].trim()}
                              </strong>{" "}
                              <span className="font-bold text-[#7CA5B8] tabular-nums">
                                ({topAnalog?.score.toFixed(1)})
                              </span>
                            </span>

                            <Link
                              href={`/explorer?body=${target.body}&target=${target.id}${
                                topAnalog ? `&site=${topAnalog.site.id}` : ""
                              }`}
                              className="ml-2 inline-flex shrink-0 items-center gap-1 font-mono text-[11px] font-semibold tracking-wider text-[#C5A36D] uppercase transition-colors hover:text-[#E4DFD5]"
                            >
                              <span>Explorar</span>
                              <ArrowUpRight
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </MissionChapter>

              {/* ===============================================================
                  CHAPTER 5 — TRANSICIÓN AL EXPLORADOR REAL (/explorer)
              =============================================================== */}
              <MissionChapter
                id="acceso-al-explorador"
                chapterNumber="05"
                chapterTitle="Acceso al Explorador"
                eyebrow="Del Relato Científico a la Herramienta Geoespacial"
                title="Explora los análogos en 3D"
                subtitle="Globo interactivo, comparación lado a lado, sondeo de coordenadas en vivo y exportación."
              >
                <ExplorerTransition sites={translatedSites} />
              </MissionChapter>

              {/* ===============================================================
                  SCIENTIFIC CREDITS & BRAND ATTRIBUTION FOOTER
                  Official logos presented cleanly in their dedicated section
              =============================================================== */}
              <footer className="snap-start border-t border-[#55527D]/30 bg-[#101321] py-20">
                <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
                  <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                      <AtlaniaLockup size="lg" showTagline className="mb-5" />
                      <p className="font-mono text-xs tracking-[0.2em] text-[#7CA5B8] uppercase">
                        RIGOR CIENTÍFICO Y TRANSPARENCIA
                      </p>
                      <h2 className="mt-3 text-2xl font-semibold text-[#E4DFD5]">
                        Fuentes oficiales y tecnologías utilizadas
                      </h2>
                      <p className="mt-3 text-sm leading-relaxed text-[#A3A1BD]">
                        Proyecto desarrollado para el desafío{" "}
                        <a
                          href="https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#E4DFD5] underline decoration-[#55527D]/35 underline-offset-4 hover:text-[#7CA5B8]"
                        >
                          Identify Earth Locations that Analog the Permanent Moon
                          Base Locations and Mars
                        </a>
                        . Las imágenes de archivo de la NASA se utilizan con
                        fines educativos y científicos sin implicar patrocinio ni
                        respaldo institucional.
                      </p>
                    </div>

                    <div className="lg:col-span-7">
                      <p className="font-mono text-[11px] tracking-[0.18em] text-[#A3A1BD] uppercase">
                        ENTIDADES DE DATOS E INFRAESTRUCTURA TÉCNICA
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <BrandLogo brand="nasa" size="sm" />
                        <BrandLogo brand="nasa-power" size="sm" />
                        <BrandLogo brand="nasa-pds" size="sm" />
                        <BrandLogo brand="copernicus" size="sm" />
                        <BrandLogo brand="open-meteo" size="sm" />
                        <BrandLogo brand="python" size="sm" />
                        <BrandLogo brand="nextjs" size="sm" />
                        <BrandLogo brand="maplibre" size="sm" />
                        <BrandLogo brand="github" size="sm" />
                      </div>

                      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#55527D]/30 pt-6 text-xs text-[#A3A1BD]">
                        <span>
                          ATLANIA · Motor ASI v{dataset.methodology.version}
                        </span>
                        <div className="flex items-center gap-6">
                          <a
                            href="https://github.com/FakeCxbas/nasa-space-apps-2026"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[#E4DFD5] hover:text-[#7CA5B8]"
                          >
                            <span>Repositorio GitHub</span>
                            <ExternalLink
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </a>
                          <Link
                            href="/explorer"
                            className="font-semibold text-[#7CA5B8] hover:underline"
                          >
                            Ir a /explorer →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </footer>
            </main>
          );
        }}
      </ScrollScene>

      {/* =====================================================================
          INTERACTIVE SATELLITE TELEMETRY MODAL (Click on Hero Satellites)
      ===================================================================== */}
      {selectedSatelliteId && (() => {
        const sat = HERO_SATELLITES[selectedSatelliteId];
        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sat-modal-title"
            className="fixed inset-0 z-[70] flex items-center justify-center bg-[#101321]/80 p-4 backdrop-blur-md"
            onClick={() => setSelectedSatelliteId(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[#55527D]/35 bg-[#121626]/92 shadow-[0_32px_90px_rgba(0,0,0,0.85)] backdrop-blur-xl"
            >
              {/* Top HUD header */}
              <div className="flex items-start justify-between gap-4 border-b border-[#55527D]/35 bg-[#121626]/85 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#7CA5B8]/35 bg-[#7CA5B8]/10 text-[#7CA5B8]">
                    <Satellite className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-[#7CA5B8] uppercase">
                      OBSERVATORIO ORBITAL · {sat.agency}
                    </p>
                    <h2
                      id="sat-modal-title"
                      className="text-xl font-semibold text-[#E4DFD5]"
                    >
                      {sat.name}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSatelliteId(null)}
                  aria-label="Cerrar ficha de satélite"
                  className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl border border-[#55527D]/35 bg-[#181B2C] text-[#A3A1BD] transition-colors hover:border-[#7CA5B8]/50 hover:text-[#E4DFD5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {/* Body */}
              <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-12">
                {/* Satellite Cutout Preview */}
                <div className="relative flex items-center justify-center rounded-xl border border-[#55527D]/35 bg-[#181B2C] p-4 sm:col-span-5">
                  <div
                    className="pointer-events-none absolute inset-4 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(124,165,184,0.2),transparent_70%)] blur-xl"
                    aria-hidden="true"
                  />
                  <Image
                    src={sat.image}
                    alt={`Modelo orbital de ${sat.name}`}
                    width={sat.width}
                    height={sat.height}
                    className="relative max-h-44 w-auto object-contain brightness-[1.08] drop-shadow-[0_18px_32px_rgba(0,0,0,0.9)]"
                  />
                </div>

                {/* Telemetry Specs */}
                <div className="space-y-3 sm:col-span-7">
                  <div className="rounded-xl border border-[#55527D]/35 bg-[#181B2C]/85 p-3">
                    <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-[#A3A1BD] uppercase">
                      <Radio className="h-3.5 w-3.5 text-[#7CA5B8]" aria-hidden="true" />
                      Instrumento y espectro
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#E4DFD5]">
                      {sat.instrument}
                    </p>
                    <p className="mt-0.5 font-mono text-xs tabular-nums text-[#A3A1BD]">
                      {sat.spectrum}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-[#55527D]/35 bg-[#181B2C]/85 p-3">
                      <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-[#A3A1BD] uppercase">
                        <Orbit className="h-3.5 w-3.5 text-[#7CA5B8]" aria-hidden="true" />
                        Órbita
                      </p>
                      <p className="mt-1 font-mono text-xs tabular-nums text-[#E4DFD5]">
                        {sat.orbit}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#55527D]/35 bg-[#181B2C]/85 p-3">
                      <p className="font-mono text-[10px] tracking-[0.16em] text-[#A3A1BD] uppercase">
                        Resolución
                      </p>
                      <p className="mt-1 font-mono text-xs tabular-nums text-[#E4DFD5]">
                        {sat.resolution}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scientific Role & Analog Sites */}
              <div className="space-y-3 border-t border-[#55527D]/35 px-6 py-4">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.16em] text-[#7CA5B8] uppercase">
                    Uso en ATLANIA sobre puntos análogos
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[#E4DFD5]">
                    {sat.roleInAtlania}
                  </p>
                  <p className="mt-1.5 font-mono text-xs text-[#A3A1BD]">
                    Sitios clave: <span className="text-[#E4DFD5]">{sat.analogSites}</span>
                  </p>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-[#C5A36D]/50 bg-[#27233E]/80 p-3">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#C5A36D]" aria-hidden="true" />
                  <p className="text-xs leading-relaxed text-[#A3A1BD]">
                    <span className="font-semibold text-[#C5A36D]">Límites físicos:</span>{" "}
                    {sat.limitations}
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#55527D]/35 bg-[#121626]/85 px-6 py-4">
                <a
                  href={sat.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-[#A3A1BD] underline decoration-[#55527D] underline-offset-4 transition-colors hover:text-[#7CA5B8]"
                >
                  <span>Documentación oficial de la misión</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedSatelliteId(null)}
                    className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-[#55527D]/35 px-4 py-2 text-xs font-semibold text-[#E4DFD5] transition-colors hover:border-[#55527D]/35 hover:text-[#E4DFD5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A36D]"
                  >
                    Cerrar ficha
                  </button>
                  <Link
                    href="/explorer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#C5A36D] hover:bg-[#d4b47e] px-5 py-2 text-xs font-semibold tracking-wider text-[#101321] uppercase transition-transform hover:scale-[1.02]"
                  >
                    <span>Explorar sitios en 3D</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
