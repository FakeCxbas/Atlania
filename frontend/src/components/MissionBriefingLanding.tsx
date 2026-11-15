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
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Menu,
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
        earthValue: "Pendiente DEM 4.89° · Relieve volcánico suave",
        planetaryValue: "Pendiente de escenario 5.0° en llanura de mare",
        sourceTag: "DEM Copernicus GLO-90 + Escenario PDS",
      },
      {
        label: "Geología",
        concept: "geology",
        earthValue: "Coladas de basalto (1.0) y regolito/tefra (0.4)",
        planetaryValue: "Basalto de mare lunar (1.0) y regolito (0.8)",
        sourceTag: "Priors litológicos documentados",
      },
      {
        label: "Temperatura",
        concept: "thermal",
        earthValue: "Aire a 2 m: 21.8°C a 24.4°C (media 23.1°C)",
        planetaryValue: "Sombra térmica modelada en fosa: ~17°C (Δ2°C)",
        sourceTag: "NASA POWER API vs. LRO Diviner",
      },
      {
        label: "Recursos y condiciones ambientales",
        concept: "hydrology",
        earthValue: "Precipitación 2.33 mm/día · Humedad 82.6%",
        planetaryValue: "Vacío anhidro (sequedad 1.0) · Sin atmósfera",
        sourceTag: "NASA POWER PRECTOTCORR / RH2M",
      },
      {
        label: "Características del subsuelo",
        concept: "subsurface",
        earthValue: "Tubos de lava basáltica (1.0) y techo natural (1.0)",
        planetaryValue: "Fosa de colapso con posible acceso a cavidad (1.0)",
        sourceTag: "Relevancia operativa de escenario",
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
        earthValue: "Pendiente DEM 2.86° (prior de escarpe 12°)",
        planetaryValue: "Taludes interiores empinados de ~20° y alta rugosidad",
        sourceTag: "DEM Copernicus GLO-90 + LRO LOLA",
      },
      {
        label: "Geología",
        concept: "geology",
        earthValue: "Brechas de impacto (1.0) y regolito polar (0.8)",
        planetaryValue: "Regolito de tierras altas (1.0) e impacto (1.0)",
        sourceTag: "Priors litológicos documentados",
      },
      {
        label: "Temperatura",
        concept: "thermal",
        earthValue: "Aire ártico a 2 m: -19.2°C a -13.9°C",
        planetaryValue: "Trampa fría en sombra permanente: -183°C (Δ10°C)",
        sourceTag: "NASA POWER API vs. LRO Diviner",
      },
      {
        label: "Recursos y condiciones ambientales",
        concept: "hydrology",
        earthValue: "Permafrost polar activo (1.0) · 0.44 mm/día precip.",
        planetaryValue: "Potencial de volátiles e hielo atrapado (0.95)",
        sourceTag: "NASA POWER + Escenario Artemis",
      },
      {
        label: "Características del subsuelo",
        concept: "subsurface",
        earthValue: "Suelo cementado por hielo para pruebas de perforación",
        planetaryValue: "Regolito criogénico sin tubos de lava (0.0)",
        sourceTag: "Relevancia operativa ISRU",
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
        earthValue: "Pendiente DEM 3.75° · Planicie aluvial-evaporítica",
        planetaryValue: "Pendiente de escenario 6.0° en piso cratérico y delta",
        sourceTag: "DEM Copernicus GLO-90 + MRO HiRISE",
      },
      {
        label: "Geología",
        concept: "geology",
        earthValue: "Sedimentos (0.8), evaporitas/sales (0.8) y regolito (0.75)",
        planetaryValue:
          "Sedimentos deltaicos (1.0), basalto (0.8) y carbonatos",
        sourceTag: "Priors litológicos + MRO CRISM",
      },
      {
        label: "Temperatura",
        concept: "thermal",
        earthValue: "Aire a 2 m: 10.6°C a 24.4°C (Δ13.8°C)",
        planetaryValue:
          "Superficie marciana: -60°C media (-95°C a -25°C, Δ70°C)",
        sourceTag: "NASA POWER API vs. Perseverance MEDA",
      },
      {
        label: "Recursos y condiciones ambientales",
        concept: "hydrology",
        earthValue: "Hiperaridez extrema: 0.04 mm/día · Humedad 31.6%",
        planetaryValue: "Superficie seca actual (1.0) con historia acuosa (1.0)",
        sourceTag: "NASA POWER PRECTOTCORR",
      },
      {
        label: "Características del subsuelo",
        concept: "subsurface",
        earthValue: "Horizontes de sulfatos/percloratos a baja profundidad",
        planetaryValue: "Estratigrafía lacustre para muestreo de testigos",
        sourceTag: "Contexto astrobiológico de escenario",
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
        earthValue: "Pendiente DEM 0.87° (prior local 6.0°) · Lava rugosa",
        planetaryValue: "Flanco volcánico de ~8.0° y alta rugosidad (0.8)",
        sourceTag: "DEM Copernicus GLO-90 + MGS MOLA",
      },
      {
        label: "Geología",
        concept: "geology",
        earthValue: "Basalto cuaternario (1.0) y regolito volcánico (0.65)",
        planetaryValue: "Coladas basálticas (1.0) y regolito (0.7)",
        sourceTag: "Priors litológicos documentados",
      },
      {
        label: "Temperatura",
        concept: "thermal",
        earthValue: "Aire a 2 m: 1.9°C a 14.4°C (media 8.2°C)",
        planetaryValue: "Flanco marciano expuesto: -65°C media (Δ80°C)",
        sourceTag: "NASA POWER API vs. Escenario MOLA",
      },
      {
        label: "Recursos y condiciones ambientales",
        concept: "hydrology",
        earthValue: "Precipitación 0.91 mm/día · Presión 83.2 kPa",
        planetaryValue: "Atmósfera tenue de CO₂ (~0.65 kPa) · Sequedad 1.0",
        sourceTag: "NASA POWER PS / PRECTOTCORR",
      },
      {
        label: "Características del subsuelo",
        concept: "subsurface",
        earthValue: "Tubos de lava extensos (1.0) y refugio (0.85)",
        planetaryValue: "Canales de lava colapsados (1.0) y abrigo (0.9)",
        sourceTag: "Relevancia operativa subterránea",
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
    label: "Topografía y Rugosidad",
    formulaNote:
      "50% similitud de pendiente (escala 30°) + 50% similitud de rugosidad",
  },
  {
    key: "geology",
    concept: "geology",
    label: "Geología y Litología",
    formulaNote:
      "Superposición difusa de Jaccard (Σ min / Σ max) en 5 litologías",
  },
  {
    key: "thermal",
    concept: "thermal",
    label: "Régimen Térmico",
    formulaNote:
      "60% temperatura media anual + 40% amplitud térmica (escala 100°C)",
  },
  {
    key: "hydrology_ice",
    concept: "hydrology",
    label: "Sequedad, Hielo e Historia Acuosa",
    formulaNote:
      "40% aridez 1/(1+P) + 40% relevancia de hielo + 20% historia acuosa",
  },
  {
    key: "subsurface_ops",
    concept: "subsurface",
    label: "Operaciones Subterráneas y Refugio",
    formulaNote: "70% relevancia de tubos de lava + 30% potencial de refugio",
  },
];

export function MissionBriefingLanding({
  dataset,
}: MissionBriefingLandingProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeChallengeIdx, setActiveChallengeIdx] = useState<number>(0);
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
          `NASA POWER: 7 variables climáticas (${dataset.methodology.source_counts.nasa_power}/${dataset.sites.length} sitios)`,
          "Copernicus DEM 90 m: pendiente y rugosidad en 5 puntos",
          "NASA PDS: misiones LRO, MRO y Perseverance",
          "NASA GIBS VIIRS y relieve 3D sombreado",
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
          "Gradiente local por diferencias centrales (±0.01°)",
          "Índice continuo de aridez superficial",
          "Superposición difusa: basalto, regolito, sales e impacto",
          "Separación clara entre telemetría medida y supuestos",
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
          "Puntuación global ASI (0–100%) ponderada por misión",
          "Jaccard difuso para litología y vulcanismo",
          "Alertas físicas: gravedad, atmósfera y radiación",
          "Validado con suite de pruebas unitarias",
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
          "Globo 3D con filtros por planeta y país",
          "Sondeo puntual y grillas 3x3 / 4x4 en vivo",
          "Radar pentagonal de afinidad y vista lado a lado",
          "Exportación a GeoJSON (QGIS), Markdown y JSON",
        ],
        brands: ["nextjs", "maplibre", "github"] as BrandId[],
      },
    ],
    [dataset.methodology, dataset.sites.length]
  );

  const currentAsiValue = selectedAsiScore?.overall_asi ?? 0;
  const isSelectedTargetMars = selectedAsiTarget?.body === "Mars";

  return (
    <div className="min-h-screen bg-[#03070D] text-[#F1F5F9] selection:bg-[#00D9F5]/30 selection:text-[#F1F5F9]">
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
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#03070D]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4 sm:px-10 lg:px-16">
          {/* Brand Wordmark + Route Breadcrumb */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center transition-opacity hover:opacity-85"
            >
              <AtlaniaLockup size="sm" />
            </Link>
            <span className="hidden items-center gap-1.5 font-mono text-xs text-slate-400 sm:inline-flex">
              <span className="text-slate-600">/</span>
              <span className="rounded border border-[#00D9F5]/30 bg-[#00D9F5]/10 px-2 py-0.5 font-semibold text-[#00D9F5]">
                Inicio
              </span>
            </span>
          </div>

          {/* Minimal Chapter Links (Desktop) */}
          <nav
            aria-label="Capítulos del viaje espacial"
            className="hidden items-center gap-7 text-xs font-semibold tracking-[0.14em] text-slate-300 uppercase lg:flex"
          >
            <a
              href="#capitulo-1"
              className="text-[#00D9F5] transition-colors hover:text-[#F1F5F9]"
            >
              01 · Inicio
            </a>
            <a
              href="#el-desafio"
              className="transition-colors hover:text-[#F1F5F9]"
            >
              02 · La Tierra
            </a>
            <a
              href="#capas-del-terreno"
              className="transition-colors hover:text-[#F1F5F9]"
            >
              03 · Capas 3D
            </a>
            <a
              href="#que-es-un-analogo"
              className="transition-colors hover:text-[#F1F5F9]"
            >
              04 · Comparación y ASI
            </a>
            <a
              href="#explora-los-destinos"
              className="transition-colors hover:text-[#F1F5F9]"
            >
              05 · Destinos
            </a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <MethodologyDialog dataset={dataset} />
            </div>

            <Link
              href="/explorer"
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#F1F5F9] px-5 py-2 text-xs font-semibold tracking-wider text-[#03070D] uppercase transition-transform hover:scale-[1.02] hover:bg-[#00D9F5]"
            >
              <span>Abrir Explorador</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={
                mobileMenuOpen
                  ? "Cerrar menú de navegación"
                  : "Abrir menú de navegación"
              }
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#03070D]/60 text-[#F1F5F9] lg:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <nav
            aria-label="Navegación móvil"
            className="border-t border-white/10 bg-[#03070D]/95 px-6 py-6 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col gap-4 text-sm font-medium text-[#F1F5F9]">
              <a
                href="#capitulo-1"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-[#94A3B8] hover:text-[#F1F5F9]"
              >
                01 · El Comienzo
              </a>
              <a
                href="#el-desafio"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-[#94A3B8] hover:text-[#F1F5F9]"
              >
                02 · Aproximación a la Tierra
              </a>
              <a
                href="#capas-del-terreno"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-[#94A3B8] hover:text-[#F1F5F9]"
              >
                03 · Capas Tridimensionales del Terreno
              </a>
              <a
                href="#que-es-un-analogo"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-[#94A3B8] hover:text-[#F1F5F9]"
              >
                04 · Comparación Planetaria y ASI
              </a>
              <a
                href="#explora-los-destinos"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-[#94A3B8] hover:text-[#F1F5F9]"
              >
                05 · Explora los Destinos
              </a>
              <div className="pt-2">
                <MethodologyDialog dataset={dataset} />
              </div>
            </div>
          </nav>
        )}
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
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-[58vh] bg-gradient-to-t from-[#03070D]/95 via-[#03070D]/60 to-transparent"
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
                      className="group relative block w-full cursor-pointer rounded-2xl text-left transition-transform duration-300 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9F5] focus-visible:ring-offset-4 focus-visible:ring-offset-[#03070D]"
                    >
                      {/* Nadir Reflector / VIIRS Scan Cone pointing down-right onto Earth */}
                      <svg
                        viewBox="0 0 220 220"
                        aria-hidden="true"
                        className="pointer-events-none absolute top-[55%] left-[52%] -z-10 h-[160px] w-[160px] opacity-75 transition-opacity duration-300 group-hover:opacity-100 lg:h-[200px] lg:w-[200px]"
                      >
                        <defs>
                          <linearGradient id="beam-suomi" x1="10%" y1="5%" x2="90%" y2="95%">
                            <stop offset="0%" stopColor="#00D9F5" stopOpacity="0.52" />
                            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.16" />
                            <stop offset="100%" stopColor="#00D9F5" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <polygon points="15,12 205,155 115,210" fill="url(#beam-suomi)" />
                        <line x1="15" y1="12" x2="165" y2="185" stroke="#00D9F5" strokeOpacity="0.34" strokeWidth="1" strokeDasharray="4 5" />
                      </svg>

                      <div className="mb-sat-float-c relative">
                        <div className="relative -rotate-[12deg]">
                          <div
                            className="absolute inset-6 -z-10 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(56,189,248,0.22),transparent_70%)] blur-2xl"
                            aria-hidden="true"
                          />
                          <Image
                            src="/nasa/suomi-npp-cutout.png"
                            alt="Satélite NASA/NOAA Suomi NPP con sensor VIIRS apuntando hacia la Tierra"
                            width={900}
                            height={682}
                            sizes="(max-width: 1024px) 205px, 270px"
                            className="h-auto w-full object-contain brightness-[0.95] contrast-[1.06] saturate-[0.86] drop-shadow-[0_20px_36px_rgba(0,0,0,0.85)]"
                          />
                          <div
                            aria-hidden="true"
                            style={{
                              maskImage: "url(/nasa/suomi-npp-cutout.png)",
                              WebkitMaskImage: "url(/nasa/suomi-npp-cutout.png)",
                              maskSize: "contain",
                              WebkitMaskSize: "contain",
                              maskRepeat: "no-repeat",
                              WebkitMaskRepeat: "no-repeat",
                              maskPosition: "center",
                              WebkitMaskPosition: "center",
                            }}
                            className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(224,247,255,0.44)_0%,rgba(56,189,248,0.16)_36%,transparent_66%)] mix-blend-screen"
                          />
                        </div>
                      </div>

                      {/* Leader-line callout (no box) */}
                      <span className="mt-2 inline-flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-slate-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] transition-colors group-hover:text-[#00D9F5] sm:text-[11px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#00D9F5] shadow-[0_0_8px_#00D9F5]" aria-hidden="true" />
                        <span className="h-px w-7 bg-gradient-to-r from-[#00D9F5] to-[#00D9F5]/25 transition-all duration-300 group-hover:w-10" aria-hidden="true" />
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
                      className="group relative block w-full cursor-pointer rounded-2xl text-left transition-transform duration-300 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9F5] focus-visible:ring-offset-4 focus-visible:ring-offset-[#03070D]"
                    >
                      {/* Nadir Reflector / C-SAR Scan Cone pointing down-left toward Earth */}
                      <svg
                        viewBox="0 0 220 220"
                        aria-hidden="true"
                        className="pointer-events-none absolute top-[46%] right-[44%] -z-10 h-[155px] w-[155px] origin-top-right opacity-70 transition-opacity duration-300 group-hover:opacity-100 sm:h-[220px] sm:w-[220px]"
                      >
                        <defs>
                          <linearGradient id="beam-sentinel" x1="100%" y1="0%" x2="10%" y2="95%">
                            <stop offset="0%" stopColor="#00D9F5" stopOpacity="0.52" />
                            <stop offset="45%" stopColor="#38BDF8" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#00D9F5" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <polygon points="210,10 10,155 95,215" fill="url(#beam-sentinel)" />
                        <line x1="210" y1="10" x2="50" y2="188" stroke="#00D9F5" strokeOpacity="0.34" strokeWidth="1" strokeDasharray="4 5" />
                      </svg>

                      <div
                        className="mb-sat-float-b relative"
                        style={{ transformOrigin: "center center" }}
                      >
                        <div className="relative -rotate-[14deg]">
                          <div
                            className="absolute inset-6 -z-10 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(56,189,248,0.22),transparent_70%)] blur-2xl"
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
                          <div
                            aria-hidden="true"
                            style={{
                              maskImage: "url(/nasa/sentinel1-cutout.png)",
                              WebkitMaskImage: "url(/nasa/sentinel1-cutout.png)",
                              maskSize: "contain",
                              WebkitMaskSize: "contain",
                              maskRepeat: "no-repeat",
                              WebkitMaskRepeat: "no-repeat",
                              maskPosition: "center",
                              WebkitMaskPosition: "center",
                            }}
                            className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(224,247,255,0.48)_0%,rgba(56,189,248,0.18)_36%,transparent_66%)] mix-blend-screen"
                          />
                        </div>
                      </div>

                      {/* Leader-line callout (no box) */}
                      <span className="mt-1 inline-flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-slate-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] transition-colors group-hover:text-[#00D9F5] sm:text-[11px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#00D9F5] shadow-[0_0_8px_#00D9F5]" aria-hidden="true" />
                        <span className="h-px w-7 bg-gradient-to-r from-[#00D9F5] to-[#00D9F5]/25 transition-all duration-300 group-hover:w-10" aria-hidden="true" />
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
                      className="group relative block w-full cursor-pointer rounded-2xl text-left transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9F5] focus-visible:ring-offset-4 focus-visible:ring-offset-[#03070D]"
                    >
                      {/* Nadir Reflector / OLI-2 + TIRS-2 Scan Cone pointing up-left toward centered Earth */}
                      <svg
                        viewBox="0 0 260 190"
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-[16%] -left-[34%] -z-10 h-[145px] w-[195px] opacity-75 transition-opacity duration-300 group-hover:opacity-100 sm:h-[185px] sm:w-[250px]"
                      >
                        <defs>
                          <linearGradient id="beam-landsat" x1="95%" y1="75%" x2="5%" y2="20%">
                            <stop offset="0%" stopColor="#00D9F5" stopOpacity="0.54" />
                            <stop offset="45%" stopColor="#38BDF8" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#00D9F5" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <polygon points="250,140 8,25 22,125" fill="url(#beam-landsat)" />
                        <line x1="250" y1="140" x2="18" y2="75" stroke="#00D9F5" strokeOpacity="0.34" strokeWidth="1" strokeDasharray="4 5" />
                      </svg>

                      <div className="mb-sat-float-a relative">
                        <div className="relative rotate-[18deg]">
                          <div
                            className="absolute inset-6 -z-10 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(56,189,248,0.24),transparent_68%)] blur-2xl"
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
                          <div
                            aria-hidden="true"
                            style={{
                              maskImage: "url(/nasa/landsat9-cutout.png)",
                              WebkitMaskImage: "url(/nasa/landsat9-cutout.png)",
                              maskSize: "contain",
                              WebkitMaskSize: "contain",
                              maskRepeat: "no-repeat",
                              WebkitMaskRepeat: "no-repeat",
                              maskPosition: "center",
                              WebkitMaskPosition: "center",
                            }}
                            className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(224,247,255,0.48)_0%,rgba(56,189,248,0.18)_36%,transparent_66%)] mix-blend-screen"
                          />
                        </div>
                      </div>

                      {/* Leader-line callout (no box, right-aligned) */}
                      <span className="mt-2 flex w-full items-center justify-end gap-2 pr-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#F1F5F9] drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] transition-colors group-hover:text-[#00D9F5] sm:pr-6 sm:text-[11px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#00D9F5] shadow-[0_0_8px_#00D9F5]" aria-hidden="true" />
                        <span className="h-px w-8 bg-gradient-to-r from-[#00D9F5] to-[#00D9F5]/25 transition-all duration-300 group-hover:w-11" aria-hidden="true" />
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

                      <p className="mx-auto mt-3 max-w-xl text-base font-medium leading-snug text-slate-100 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] sm:text-xl">
                        Para explorar otros mundos, primero desciframos el nuestro.
                      </p>
                    </div>

                    {/* Primary CTAs centered at bottom above telemetry bar */}
                    <div className="w-full">
                      <div className="mb-4 flex flex-wrap items-center justify-center gap-4">
                        <Link
                          href="/explorer"
                          className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#C5A36D] px-7 py-3.5 text-sm font-bold text-[#101321] shadow-lg transition-all hover:bg-[#E4DFD5]"
                        >
                          <span>Iniciar exploración</span>
                          <ArrowUpRight className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
                        </Link>

                        <a
                          href="#el-desafio"
                          className="inline-flex min-h-12 items-center gap-2.5 rounded-full border border-white/25 bg-[#03070D]/75 px-6 py-3.5 text-sm font-semibold text-slate-100 backdrop-blur-md transition-colors hover:border-[#00D9F5] hover:text-[#00D9F5]"
                        >
                          <span>Conocer la misión</span>
                          <ArrowDown
                            className="h-4 w-4 text-[#00D9F5]"
                            aria-hidden="true"
                          />
                        </a>
                      </div>

                      {/* High-contrast frosted bottom telemetry bar */}
                      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/15 bg-[#03070D]/80 px-4 py-3 text-xs text-slate-200 backdrop-blur-md sm:text-sm">
                      <div className="flex flex-wrap items-center gap-6 font-mono">
                        <span>
                          CATÁLOGO:{" "}
                          <strong className="font-bold text-[#00D9F5]">
                            {dataset.sites.length} SITIOS TERRESTRES
                          </strong>
                        </span>
                        <span>
                          REFERENCIAS PDS:{" "}
                          <strong className="font-bold text-[#F5B82E]">
                            {Object.keys(dataset.references).length} ESCENARIOS
                            (LUNA Y MARTE)
                          </strong>
                        </span>
                      </div>
                      <span className="font-mono text-xs font-semibold tracking-[0.16em] text-slate-200 uppercase">
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
                        <p className="font-mono text-xs font-medium tracking-[0.24em] text-[#00D9F5] uppercase">
                          02 / APROXIMACIÓN A LA TIERRA · EL DESAFÍO CIENTÍFICO
                        </p>
                        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#F1F5F9] sm:text-5xl lg:text-[3.35rem] lg:leading-[1.06]">
                          Aprender en la Tierra antes de despegar.
                        </h2>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#CBD5E1] sm:text-base">
                          Desiertos hiperáridos, campos volcánicos y cráteres polares funcionan como laboratorios naturales para ensayar misiones lunares y marcianas.
                        </p>
                      </div>

                      {/* Three Open Editorial Columns (Hairline dividers, no boxy cards) */}
                      <div className="mt-8 grid grid-cols-1 gap-6 border-t border-white/15 pt-6 lg:grid-cols-3 lg:gap-10">
                        {challengeCards.map((item, idx) => {
                          const isSelected = activeChallengeIdx === idx;
                          return (
                            <div
                              key={item.id}
                              className="group flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-xs font-semibold tracking-wider text-[#00D9F5] uppercase">
                                    0{idx + 1} · {item.tag}
                                  </span>
                                  <ScientificIcon
                                    concept={item.concept}
                                    className="h-4 w-4 text-slate-400"
                                  />
                                </div>
                                <h3 className="mt-3 text-lg font-bold leading-snug text-slate-100 sm:text-xl">
                                  {item.question}
                                </h3>
                                <p className="mt-2.5 text-sm leading-relaxed text-slate-200">
                                  {isSelected ? item.detail : item.shortAnswer}
                                </p>
                              </div>

                              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                                <span className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-xs text-slate-200 tabular-nums">
                                  {item.metricValue}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveChallengeIdx(
                                      isSelected ? -1 : idx
                                    )
                                  }
                                  className="font-mono text-xs font-semibold text-[#00D9F5] underline-offset-4 hover:underline"
                                >
                                  {isSelected ? "Sintetizar" : "Profundizar"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-3 font-mono text-[11px] text-[#94A3B8]">
                      <span>
                        TELEMETRÍA ORBITAL · ESCALA PLANETARIA CONTINUA
                      </span>
                      <a
                        href="#capas-del-terreno"
                        className="text-[#00D9F5] hover:underline"
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
                className="relative snap-start snap-always border-t border-white/10"
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
                <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/10 pb-6">
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
                          ? "border-b-2 border-[#00D9F5] text-[#F1F5F9]"
                          : "text-[#94A3B8] hover:text-[#F1F5F9]"
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
                          ? "border-b-2 border-[#F5B82E] text-[#F1F5F9]"
                          : "text-[#94A3B8] hover:text-[#F1F5F9]"
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
                              ? "bg-[#F1F5F9] text-[#03070D]"
                              : "border border-white/15 text-[#94A3B8] hover:border-white/35 hover:text-[#F1F5F9]"
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
                          <div className="absolute inset-0 bg-gradient-to-t from-[#03070D] via-transparent to-transparent" />
                          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4">
                            <div>
                              <span className="font-mono text-[11px] tracking-[0.18em] text-[#00D9F5] uppercase">
                                TIERRA · {activeComparativeSite.country}
                              </span>
                              <h3 className="mt-1 text-2xl font-bold text-[#F1F5F9]">
                                {activeComparativeSite.name}
                              </h3>
                            </div>
                            <span className="font-mono text-xs text-[#CBD5E1] tabular-nums">
                              {activeComparativeSite.latitude.toFixed(2)}°,{" "}
                              {activeComparativeSite.longitude.toFixed(2)}°
                            </span>
                          </div>
                        </div>
                        <figcaption className="mt-3 flex items-center justify-between text-xs text-[#94A3B8]">
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
                          <div className="absolute inset-0 bg-gradient-to-t from-[#03070D] via-transparent to-transparent" />
                          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4">
                            <div>
                              <span className="font-mono text-[11px] tracking-[0.18em] text-[#F5B82E] uppercase">
                                {activeComparativeExample.bodyLabel} · OBJETIVO
                                DE REFERENCIA
                              </span>
                              <h3 className="mt-1 text-2xl font-bold text-[#F1F5F9]">
                                {activeComparativeTarget.name}
                              </h3>
                            </div>
                            <span className="font-mono text-xs text-[#CBD5E1] tabular-nums">
                              {activeComparativeTarget.instrument ?? "NASA PDS"}
                            </span>
                          </div>
                        </div>
                        <figcaption className="mt-3 flex items-center justify-between text-xs text-[#94A3B8]">
                          <span>
                            {TARGET_MEDIA[activeComparativeTarget.id]?.credit}
                          </span>
                          <span className="font-mono">
                            ASI REAL:{" "}
                            <strong className="text-[#F1F5F9] tabular-nums">
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
                    <div className="border-t border-white/15">
                      <div className="hidden grid-cols-12 gap-6 border-b border-white/10 py-3 font-mono text-[11px] tracking-[0.16em] text-[#94A3B8] uppercase md:grid">
                        <div className="col-span-3">Dimensión evaluada</div>
                        <div className="col-span-4 text-[#00D9F5]">
                          Condición en la Tierra ({activeComparativeSite.name})
                        </div>
                        <div className="col-span-5 text-[#F5B82E]">
                          Condición en {activeComparativeExample.bodyLabel} (
                          {activeComparativeTarget.name})
                        </div>
                      </div>

                      <div className="divide-y divide-white/10">
                        {activeComparativeExample.characteristics.map(
                          (row) => (
                            <div
                              key={row.label}
                              className="grid grid-cols-1 gap-3 py-5 md:grid-cols-12 md:items-baseline md:gap-6"
                            >
                              <div className="flex items-center gap-2.5 md:col-span-3">
                                <ScientificIcon
                                  concept={row.concept}
                                  className="h-4 w-4 shrink-0 text-[#00D9F5]"
                                />
                                <div>
                                  <p className="text-sm font-semibold text-[#F1F5F9]">
                                    {row.label}
                                  </p>
                                  <p className="font-mono text-xs text-slate-300">
                                    {row.sourceTag}
                                  </p>
                                </div>
                              </div>

                              <div className="font-mono text-sm font-medium text-slate-100 tabular-nums md:col-span-4">
                                {row.earthValue}
                              </div>

                              <div className="font-mono text-sm font-medium text-slate-100 tabular-nums md:col-span-5">
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
                  className="mt-28 snap-start border-t border-white/15 pt-24"
                >
                  <div className="max-w-3xl">
                    <p className="font-mono text-xs font-semibold tracking-wider text-[#00D9F5] uppercase">
                      ÍNDICE DE SIMILITUD ANÁLOGA (ASI) · ESCALA REAL 0 – 100
                    </p>
                    <h3 className="mt-3 text-3xl font-semibold tracking-tight text-[#F1F5F9] sm:text-4xl">
                      Cómo se interpreta una puntuación real en ATLANIA
                    </h3>
                    <p className="mt-4 text-base leading-relaxed text-slate-200">
                      El ASI pondera cinco dimensiones clave (Topografía, Geología, Clima, Aridez/Hielo y Refugio Subterráneo) según los requisitos de cada misión:{" "}
                      <span className="inline-flex items-center rounded-md border border-[#00D9F5]/40 bg-[#00D9F5]/10 px-2.5 py-1 font-mono text-xs font-semibold text-[#00D9F5]">
                        ASI Global = Σ (Peso[d] × Afinidad[d])
                      </span>
                      . Todos los valores se calculan a partir de telemetría satelital abierta y priors geológicos documentados.
                    </p>
                  </div>

                  {/* Minimal Site & Target Selectors */}
                  <div className="mt-10 grid grid-cols-1 gap-6 border-y border-white/10 py-6 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="asi-site-select"
                        className="block font-mono text-[11px] tracking-[0.16em] text-[#00D9F5] uppercase"
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
                        className="mt-2 w-full border-b border-white/25 bg-transparent py-2.5 text-base font-medium text-[#F1F5F9] focus:border-[#00D9F5] focus:outline-none"
                      >
                        {translatedSites.map((s) => (
                          <option
                            key={s.id}
                            value={s.id}
                            className="bg-[#050B13] text-[#F1F5F9]"
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
                        className="block font-mono text-[11px] tracking-[0.16em] text-[#F5B82E] uppercase"
                      >
                        2. Escenario extraterrestre de referencia (6 destinos
                        PDS)
                      </label>
                      <select
                        id="asi-target-select"
                        value={selectedAsiTargetId}
                        onChange={(e) => setSelectedAsiTargetId(e.target.value)}
                        className="mt-2 w-full border-b border-white/25 bg-transparent py-2.5 text-base font-medium text-[#F1F5F9] focus:border-[#F5B82E] focus:outline-none"
                      >
                        {referenceList.map((ref) => {
                          const pairScore =
                            selectedAsiSite?.scores[ref.id]?.overall_asi;
                          return (
                            <option
                              key={ref.id}
                              value={ref.id}
                              className="bg-[#050B13] text-[#F1F5F9]"
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
                      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
                        {/* Left 5 Columns: Large Typographic ASI Score + Radar */}
                        <div className="lg:col-span-5">
                          <div className="flex items-baseline justify-between border-b border-white/10 pb-6">
                            <div>
                              <span className="font-mono text-xs tracking-[0.18em] text-[#94A3B8] uppercase">
                                ÍNDICE ASI GLOBAL
                              </span>
                              <div className="mt-1 font-mono text-6xl font-bold tracking-tight text-[#F1F5F9] tabular-nums sm:text-7xl">
                                {currentAsiValue.toFixed(2)}
                                <span className="ml-2 text-lg font-normal text-[#94A3B8]">
                                  / 100
                                </span>
                              </div>
                            </div>
                            <Link
                              href={`/explorer?body=${selectedAsiTarget.body}&target=${selectedAsiTarget.id}&site=${selectedAsiSite.id}`}
                              className="inline-flex items-center gap-1.5 font-mono text-xs text-[#00D9F5] hover:underline"
                            >
                              <span>Abrir par en /explorer</span>
                              <ArrowUpRight
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            </Link>
                          </div>

                          <div className="mt-6">
                            <AsiRadarChart
                              dimensions={selectedAsiScore.dimensions}
                              weights={selectedAsiScore.weights}
                              isMars={isSelectedTargetMars}
                            />
                          </div>
                        </div>

                        {/* Right 7 Columns: 5 Dimension Hairlines + Breakdowns */}
                        <div className="space-y-8 lg:col-span-7">
                          <div className="divide-y divide-white/10 border-t border-b border-white/10">
                            {DIMENSION_LABELS.map((dim) => {
                              const scoreVal =
                                selectedAsiScore.dimensions[dim.key];
                              const weightVal =
                                selectedAsiScore.weights[dim.key];
                              const weightedContribution = scoreVal * weightVal;

                              return (
                                <div key={dim.key} className="py-4">
                                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                      <ScientificIcon
                                        concept={dim.concept}
                                        className="h-4 w-4 text-[#00D9F5]"
                                      />
                                      <span className="text-sm font-semibold text-[#F1F5F9]">
                                        {dim.label}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4 font-mono text-xs tabular-nums">
                                      <span className="text-[#94A3B8]">
                                        Peso:{" "}
                                        {(weightVal * 100).toFixed(0)}%
                                      </span>
                                      <span className="text-[#00D9F5]">
                                        +{weightedContribution.toFixed(1)} pts
                                      </span>
                                      <span className="font-bold text-[#F1F5F9]">
                                        {scoreVal.toFixed(1)} / 100
                                      </span>
                                    </div>
                                  </div>

                                  <div className="mt-2.5 h-1 w-full overflow-hidden bg-white/10">
                                    <div
                                      className="h-full bg-[#00D9F5]"
                                      style={{
                                        width: `${Math.max(
                                          0,
                                          Math.min(100, scoreVal)
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                  <p className="mt-1.5 font-mono text-xs text-slate-300">
                                    {dim.formulaNote}
                                  </p>
                                </div>
                              );
                            })}
                          </div>

                          {/* Mandatory Analogy Breakdowns (Honest scientific limits) */}
                          <div>
                            <div className="flex items-center gap-2 font-mono text-xs font-semibold tracking-wider text-[#F5B82E] uppercase">
                              <ShieldAlert
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              <span>
                                Límites físicos donde la analogía se rompe (
                                {
                                  Object.keys(
                                    selectedAsiScore.analogy_breakdowns
                                  ).length
                                }
                                )
                              </span>
                            </div>
                            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-200">
                              {Object.entries(
                                selectedAsiScore.analogy_breakdowns
                              ).map(([key, msg]) => (
                                <li
                                  key={key}
                                  className="flex items-start gap-2.5"
                                >
                                  <span
                                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F5B82E]"
                                    aria-hidden="true"
                                  />
                                  <span>{msg}</span>
                                </li>
                              ))}
                            </ul>
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
                  className="mt-28 snap-start border-t border-white/15 pt-24"
                >
                  <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                    <div className="max-w-2xl">
                      <p className="font-mono text-xs font-medium tracking-[0.22em] text-[#00D9F5] uppercase">
                        CATÁLOGO PLANETARIO · 6 ESCENARIOS DE REFERENCIA
                      </p>
                      <h3 className="mt-3 text-3xl font-semibold tracking-tight text-[#F1F5F9] sm:text-4xl">
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
                            className={`rounded-full px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-colors ${
                              active
                                ? "bg-[#F1F5F9] text-[#03070D]"
                                : "border border-white/15 text-[#94A3B8] hover:text-[#F1F5F9]"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
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

                      return (
                        <article
                          key={target.id}
                          className="group flex flex-col justify-between border-t border-white/15 pt-5"
                        >
                          <div>
                            <div className="flex items-center justify-between font-mono text-[11px] text-[#94A3B8]">
                              <span
                                className={
                                  isMars ? "text-[#F5B82E]" : "text-[#00D9F5]"
                                }
                              >
                                {isMars ? "MARTE" : "LUNA"}
                              </span>
                              <span className="tabular-nums">
                                {target.instrument ?? "NASA PDS"}
                              </span>
                            </div>

                            <h4 className="mt-2 text-2xl font-bold text-[#F1F5F9]">
                              {target.name}
                            </h4>

                            {media && (
                              <div className="relative mt-4 h-48 w-full overflow-hidden rounded-xl">
                                <Image
                                  src={media.image}
                                  alt={media.alt}
                                  fill
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                              </div>
                            )}

                            <p className="mt-4 text-sm leading-relaxed text-[#94A3B8]">
                              {target.context}
                            </p>
                          </div>

                          <div className="mt-6 border-t border-white/10 pt-4">
                            <div className="flex items-center justify-between font-mono text-xs">
                              <span className="text-[#94A3B8]">
                                Mejor análogo:{" "}
                                <strong className="font-normal text-[#F1F5F9]">
                                  {topAnalog?.site.name}
                                </strong>
                              </span>
                              <span className="font-bold text-[#00D9F5] tabular-nums">
                                {topAnalog?.score.toFixed(1)}
                              </span>
                            </div>

                            <Link
                              href={`/explorer?body=${target.body}&target=${target.id}${
                                topAnalog ? `&site=${topAnalog.site.id}` : ""
                              }`}
                              className="mt-4 inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[#F1F5F9] uppercase transition-colors hover:text-[#00D9F5]"
                            >
                              <span>Inspeccionar en el explorador</span>
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
              <footer className="snap-start border-t border-white/10 bg-[#020509] py-20">
                <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
                  <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                      <AtlaniaLockup size="lg" showTagline className="mb-5" />
                      <p className="font-mono text-xs tracking-[0.2em] text-[#00D9F5] uppercase">
                        RIGOR CIENTÍFICO Y TRANSPARENCIA
                      </p>
                      <h2 className="mt-3 text-2xl font-semibold text-[#F1F5F9]">
                        Fuentes oficiales y tecnologías utilizadas
                      </h2>
                      <p className="mt-3 text-sm leading-relaxed text-[#94A3B8]">
                        Proyecto desarrollado para el desafío{" "}
                        <a
                          href="https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#F1F5F9] underline decoration-white/30 underline-offset-4 hover:text-[#00D9F5]"
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
                      <p className="font-mono text-[11px] tracking-[0.18em] text-[#94A3B8] uppercase">
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

                      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-[#94A3B8]">
                        <span>
                          ATLANIA · Motor ASI v{dataset.methodology.version}
                        </span>
                        <div className="flex items-center gap-6">
                          <a
                            href="https://github.com/FakeCxbas/nasa-space-apps-2026"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[#F1F5F9] hover:text-[#00D9F5]"
                          >
                            <span>Repositorio GitHub</span>
                            <ExternalLink
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </a>
                          <Link
                            href="/explorer"
                            className="font-semibold text-[#00D9F5] hover:underline"
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
            className="fixed inset-0 z-[70] flex items-center justify-center bg-[#03070D]/80 p-4 backdrop-blur-md"
            onClick={() => setSelectedSatelliteId(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0D1424]/95 shadow-[0_32px_90px_rgba(0,0,0,0.85)] backdrop-blur-xl"
            >
              {/* Top HUD header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 bg-[#060913]/80 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#00D9F5]/35 bg-[#00D9F5]/10 text-[#00D9F5]">
                    <Satellite className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-[#00D9F5] uppercase">
                      OBSERVATORIO ORBITAL · {sat.agency}
                    </p>
                    <h2
                      id="sat-modal-title"
                      className="text-xl font-semibold text-[#F1F5F9]"
                    >
                      {sat.name}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSatelliteId(null)}
                  aria-label="Cerrar ficha de satélite"
                  className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl border border-slate-800 bg-[#060913] text-slate-300 transition-colors hover:border-[#00D9F5]/50 hover:text-[#F1F5F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9F5]"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {/* Body */}
              <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-12">
                {/* Satellite Cutout Preview */}
                <div className="relative flex items-center justify-center rounded-xl border border-slate-800/80 bg-[#060913] p-4 sm:col-span-5">
                  <div
                    className="pointer-events-none absolute inset-4 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(56,189,248,0.2),transparent_70%)] blur-xl"
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
                  <div className="rounded-xl border border-slate-800/80 bg-[#060913]/75 p-3">
                    <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-slate-400 uppercase">
                      <Radio className="h-3.5 w-3.5 text-[#00D9F5]" aria-hidden="true" />
                      Instrumento y espectro
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#F1F5F9]">
                      {sat.instrument}
                    </p>
                    <p className="mt-0.5 font-mono text-xs tabular-nums text-slate-400">
                      {sat.spectrum}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-800/80 bg-[#060913]/75 p-3">
                      <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-slate-400 uppercase">
                        <Orbit className="h-3.5 w-3.5 text-[#00D9F5]" aria-hidden="true" />
                        Órbita
                      </p>
                      <p className="mt-1 font-mono text-xs tabular-nums text-slate-200">
                        {sat.orbit}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-800/80 bg-[#060913]/75 p-3">
                      <p className="font-mono text-[10px] tracking-[0.16em] text-slate-400 uppercase">
                        Resolución
                      </p>
                      <p className="mt-1 font-mono text-xs tabular-nums text-slate-200">
                        {sat.resolution}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scientific Role & Analog Sites */}
              <div className="space-y-3 border-t border-slate-800/80 px-6 py-4">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.16em] text-[#00D9F5] uppercase">
                    Uso en ATLANIA sobre puntos análogos
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-200">
                    {sat.roleInAtlania}
                  </p>
                  <p className="mt-1.5 font-mono text-xs text-slate-400">
                    Sitios clave: <span className="text-slate-200">{sat.analogSites}</span>
                  </p>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                  <p className="text-xs leading-relaxed text-slate-300">
                    <span className="font-semibold text-amber-300">Límites físicos:</span>{" "}
                    {sat.limitations}
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 bg-[#060913]/80 px-6 py-4">
                <a
                  href={sat.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-slate-300 underline decoration-slate-600 underline-offset-4 transition-colors hover:text-[#00D9F5]"
                >
                  <span>Documentación oficial de la misión</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedSatelliteId(null)}
                    className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9F5]"
                  >
                    Cerrar ficha
                  </button>
                  <Link
                    href="/explorer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#00D9F5] px-5 py-2 text-xs font-semibold tracking-wider text-[#03070D] uppercase transition-transform hover:scale-[1.02]"
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
      {/* Floating Up/Down Phase Arrow Navigator */}
      <nav
        aria-label="Navegación por fases con flechas"
        className="fixed right-5 bottom-5 z-40 flex items-center gap-1.5 rounded-full border border-white/15 bg-[#03070D]/85 p-1.5 shadow-2xl backdrop-blur-md"
      >
        <button
          type="button"
          onClick={() => navigatePhase(-1)}
          disabled={currentPhaseIdx <= 0}
          aria-label="Subir a la fase anterior"
          title="Fase anterior (↑)"
          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-slate-200 transition-colors hover:bg-white/10 hover:text-[#00D9F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9F5] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronUp className="h-5 w-5" aria-hidden="true" />
        </button>

        <span className="hidden px-2 font-mono text-[11px] font-semibold tracking-wider text-slate-200 uppercase sm:inline">
          {LANDING_PHASES[currentPhaseIdx]?.label}
        </span>

        <button
          type="button"
          onClick={() => navigatePhase(1)}
          disabled={currentPhaseIdx >= LANDING_PHASES.length - 1}
          aria-label="Bajar a la siguiente fase"
          title="Siguiente fase (↓)"
          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[#00D9F5]/15 text-[#00D9F5] transition-colors hover:bg-[#00D9F5]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9F5] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronDown className="h-5 w-5" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
