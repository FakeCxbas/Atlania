"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
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
import { ScrollScene } from "@/components/briefing/ScrollScene";
import { MissionChapter } from "@/components/briefing/MissionChapter";
import { TerrainLayers } from "@/components/briefing/TerrainLayers";
import { ExplorerTransition } from "@/components/briefing/ExplorerTransition";
import { DetailModal } from "@/components/briefing/DetailModal";
import {
  ArrowDown,
  ArrowUpRight,
  Compass,
  ExternalLink,
  Menu,
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
  const [activeChallengeIdx, setActiveChallengeIdx] = useState<number>(-1);
  const [activeBodyTab, setActiveBodyTab] = useState<"Moon" | "Mars">("Moon");
  const [activeExampleId, setActiveExampleId] =
    useState<string>("moon-lava-tubes");
  const [activePipelineStep, setActivePipelineStep] = useState<number>(-1);
  const [focusedLayer, setFocusedLayer] = useState<0 | 1 | 2 | 3 | 4>(0);

  // Always start at the top (01 · El comienzo) on page load/reload without residual #hash
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
    window.scrollTo(0, 0);
  }, []);

  const handleAnchorNavigation = (e: MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement | null)?.closest("a[href^='#']");
    if (!target) return;
    const href = target.getAttribute("href");
    if (!href || href.length <= 1) return;
    const section = document.getElementById(href.slice(1));
    if (section) {
      e.preventDefault();
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

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
        question:
          "¿Dónde podemos simular las condiciones de una región lunar o marciana?",
        tag: "Cartografía de Análogos",
        shortAnswer:
          "En regiones terrestres extremas que aíslan variables clave: tubos de lava basálticos, salares hiperáridos y criósfera de alta montaña.",
        detail:
          "Ningún sitio terrestre replica un planeta al 100%, pero permiten aislar subsistemas: tubos volcánicos en Galápagos y Craters of the Moon reproducen cavidades subterráneas; salares en Atacama y Uyuni simulan paleolagos marcianos; y permafrost en Chimborazo y Haughton permite ensayar perforación en suelos congelados.",
        metricLabel: "Cobertura actual del catálogo",
        metricValue: `${translatedSites.length} sitios documentados en ${
          new Set(translatedSites.map((s) => s.country)).size
        } países y regiones`,
      },
      {
        id: "what-makes-useful",
        concept: "geology" as ScientificConcept,
        question: "¿Qué características hacen útil a un análogo terrestre?",
        tag: "Evaluación Multidimensional",
        shortAnswer:
          "La correspondencia cuantitativa en 5 ejes: Topografía (pendientes), Geología (basalto/regolito), Clima térmico, Aridez/Hielo y Refugio subterráneo.",
        detail:
          "Un análogo es útil según el subsistema a evaluar: movilidad de rovers en pendientes escarpadas, durabilidad de sellos en polvo abrasivo o aislamiento térmico en amplitudes extremas. Cada destino extraterrestre pondera los 5 ejes según su objetivo científico prioritario.",
        metricLabel: "Dimensiones del modelo ASI",
        metricValue: `${
          dataset.methodology.dimensions?.length ?? 5
        } ejes ponderados por objetivo (${
          Object.keys(dataset.references).length
        } escenarios PDS)`,
      },
      {
        id: "what-differences",
        concept: "gravity" as ScientificConcept,
        question:
          "¿Cuáles son las diferencias que ningún entorno terrestre puede reproducir?",
        tag: "Ruptura de Analogía Física",
        shortAnswer:
          "Límites físicos insalvables: gravedad terrestre (9.81 m/s² frente a 1.62 y 3.71 m/s²), atmósfera densa con O₂/humedad y ausencia de radiación cósmica directa.",
        detail:
          "Identificar la ruptura de la analogía es mandatorio: la gravedad terrestre altera la mecánica de suelos y tracción; la atmósfera protege contra micrometeoritos y rayos cósmicos (GCR); y la biosfera meteoriza rocas de forma distinta al vacío lunar o marciano.",
        metricLabel: "Constantes físicas contrastadas",
        metricValue:
          "Tierra 9.81 m/s² (101.3 kPa) vs. Luna 1.62 m/s² (0 kPa) y Marte 3.71 m/s² (0.65 kPa)",
      },
    ],
    [translatedSites, dataset.methodology.dimensions, dataset.references]
  );

  const pipelineSteps = useMemo(
    () => [
      {
        step: "Etapa 1 — Recopilar",
        code: "01 // FUENTES ABIERTAS",
        title: "Telemetría satelital y archivos planetarios oficiales",
        description:
          "Ingesta automatizada de 7 variables climáticas de superficie desde NASA POWER API y modelos digitales de elevación Copernicus DEM GLO-90, cotejados con registros del Planetary Data System (PDS).",
        sources: [
          `NASA POWER API: 7 parámetros climáticos a 2 m (${dataset.methodology.source_counts.nasa_power}/${dataset.sites.length} sitios activos)`,
          `Copernicus DEM 90m: Muestreo topográfico de 5 puntos para pendientes y rugosidad`,
          "NASA PDS: Archivos de misiones LRO (Diviner/LOLA), MRO (HiRISE/CRISM) y Perseverance",
          "Capas cartográficas: NASA GIBS VIIRS True Color y relieve sombreado tridimensional",
        ],
        brands: ["nasa-power", "copernicus", "nasa-pds"] as BrandId[],
      },
      {
        step: "Etapa 2 — Analizar",
        code: "02 // TELEMETRÍA Y PRIORS",
        title: "Procesamiento topográfico, térmico y litológico",
        description:
          "Cálculo de gradientes locales de pendiente por diferencias centrales a 0.01°, rugosidad superficial (σ), amplitud térmica anual e índice continuo de aridez terrestre, cruzados con perfiles litológicos documentados.",
        sources: [
          "Gradiente topográfico por diferencias centrales cardinales (centro ± 0.01° N, S, E, O)",
          "Índice continuo de aridez y balance de sequedad superficial",
          "Superposición geológica difusa: basalto, regolito, sedimentario, evaporitas e impacto",
          "Separación explícita entre telemetría medida en vivo y supuestos documentales",
        ],
        brands: ["python", "open-meteo", "nasa-power"] as BrandId[],
      },
      {
        step: "Etapa 3 — Comparar",
        code: "03 // MODELO ANALÓGICO ASI",
        title: "Analog Similarity Index (ASI) en 5 dimensiones",
        description:
          "Cuantificación multidimensional que compara cada sitio terrestre contra los 6 destinos de referencia lunar y marciano, reportando fortalezas de misión y rupturas de analogía física.",
        sources: [
          "Puntuación global ASI (0 a 100%) ponderada según prioridad científica de misión",
          "Superposición difusa de Jaccard para litología y vulcanismo basáltico",
          "Advertencias obligatorias de límites físicos: gravedad, atmósfera y radiación cósmica",
          "Validación cuantitativa de cálculos con suite automatizada de pruebas unitarias",
        ],
        brands: ["python", "nasa-pds"] as BrandId[],
      },
      {
        step: "Etapa 4 — Explorar",
        code: "04 // ESTACIÓN INTERACTIVA",
        title: "Cartografía 3D, prospección de áreas y exportación científica",
        description:
          "Estación de misión interactiva con globo y terreno 3D, panel comparativo sincrónico de 3 columnas, sondeo de cualquier coordenada terrestre y exportación directa a QGIS y reportes.",
        sources: [
          "Visor geoespacial interactivo 3D con navegación por cuerpo planetario y país",
          "Sondeo puntual y prospección matricial de áreas (grillas 3x3 y 4x4) en tiempo real",
          "Gráfico radar pentagonal de afinidad y análisis lado a lado sincronizado",
          "Descarga instantánea en formatos interoperables: GeoJSON para QGIS, Markdown y JSON",
        ],
        brands: ["nextjs", "maplibre", "github"] as BrandId[],
      },
    ],
    [dataset.methodology, dataset.sites.length]
  );

  const currentAsiValue = selectedAsiScore?.overall_asi ?? 0;
  const isSelectedTargetMars = selectedAsiTarget?.body === "Mars";

  return (
    <div
      onClickCapture={handleAnchorNavigation}
      className="min-h-screen bg-[#03070D] text-[#F1F5F9] selection:bg-[#00D9F5]/30 selection:text-[#F1F5F9]"
    >
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
      <header className="fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-[#03070D]/80 via-[#03070D]/30 to-transparent backdrop-blur-[2px]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 sm:px-10 lg:px-16">
          {/* Brand Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-3 text-sm font-semibold tracking-[0.25em] text-[#E4DFD5] uppercase transition-opacity hover:opacity-80"
          >
            <Compass className="h-4 w-4 text-[#C5A36D]" aria-hidden="true" />
            <span className="font-serif tracking-widest text-lg font-semibold text-[#E4DFD5]">
              ATLANIA
            </span>
          </Link>

          {/* Minimal Chapter Links (Desktop) */}
          <nav
            aria-label="Capítulos del viaje espacial"
            className="hidden items-center gap-8 text-xs font-medium tracking-[0.14em] text-[#94A3B8] uppercase lg:flex"
          >
            <a
              href="#capitulo-1"
              className="transition-colors hover:text-[#F1F5F9]"
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

          const astronautOpacity = Math.max(0, 1 - p * 2.15);
          const astronautTranslateX = p * 190;
          const astronautTranslateY = -p * 135;
          const astronautScale = 1 + p * 0.28;

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
                className="relative mb-24 h-[250vh] w-full"
              >
                {/* Invisible anchor at 55% of the track so clicking "02 · La Tierra" scrolls into Chapter 2 */}
                <div
                  id="el-desafio"
                  aria-hidden="true"
                  className="pointer-events-none absolute top-[135vh] left-0 h-1 w-full"
                />

                <div
                  id="capitulo-1"
                  className="sticky top-0 min-h-screen w-full overflow-x-hidden"
                >
                  {/* Subtle left-side vignette strictly for editorial text legibility over space */}
                  <div
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_74%_48%,transparent_18%,rgba(3,7,13,0.45)_58%,rgba(3,7,13,0.88)_100%)]"
                    aria-hidden="true"
                  />

                  {/* INTEGRATED TRANSPARENT ASTRONAUT LAYER (Cutout PNG + Parallax + Coherent Rim Lighting) */}
                  <div
                    style={{
                      opacity: astronautOpacity,
                      transform: `translate3d(${astronautTranslateX}px, ${astronautTranslateY}px, 0) scale(${astronautScale})`,
                    }}
                    className="pointer-events-none absolute right-[-4%] bottom-[17%] z-10 w-[195px] select-none will-change-transform sm:right-[5%] sm:bottom-[7%] sm:w-[320px] lg:right-[7%] lg:bottom-[6%] lg:w-[430px] xl:w-[480px]"
                  >
                    {/* Subtle directional atmospheric rim glow behind astronaut matching Earth's horizon */}
                    <div
                      className="absolute inset-8 -z-10 rounded-full bg-[radial-gradient(circle_at_35%_40%,rgba(56,189,248,0.22),transparent_68%)] blur-2xl"
                      aria-hidden="true"
                    />
                    <Image
                      src="/nasa/astronaut-cutout.png"
                      alt="Astronauta de la NASA Bruce McCandless II flotando libremente en el espacio con la Unidad de Maniobra Tripulada (NASA ID S84-27017)"
                      width={624}
                      height={701}
                      priority
                      sizes="(max-width: 640px) 230px, (max-width: 1024px) 320px, 480px"
                      className="h-auto w-full object-contain drop-shadow-[0_28px_48px_rgba(0,0,0,0.9)]"
                    />
                  </div>

                  {/* CHAPTER 1 EDITORIAL CONTENT (Fades out upward as camera advances toward Earth) */}
                  <div
                    style={{
                      opacity: ch1Opacity,
                      transform: `translate3d(0, ${ch1TranslateY}px, 0)`,
                      pointerEvents: ch1Opacity < 0.15 ? "none" : "auto",
                    }}
                    className="relative z-20 mx-auto flex h-full max-w-[1440px] flex-col justify-between px-6 pt-28 pb-10 will-change-transform sm:px-10 lg:px-16 lg:pt-32 lg:pb-12"
                  >
                    <div className="my-auto max-w-2xl">
                      <p className="font-mono text-xs font-medium tracking-[0.28em] text-[#C5A36D] uppercase">
                        NASA SPACE APPS CHALLENGE · OBSERVATORIO PLANETARIO
                      </p>

                      <h1 className="mt-5 font-serif text-6xl font-normal tracking-wide text-[#E4DFD5] sm:text-7xl lg:text-[6.5rem] lg:leading-[0.96]">
                        ATLANIA
                      </h1>

                      <p className="mt-3 font-display italic text-base tracking-wide text-[#C5A36D] sm:text-lg">
                        Somewhere between Earth and the stars.
                      </p>

                      <p className="mt-5 max-w-xl text-xl font-light leading-snug text-[#E4DFD5]/90 sm:text-2xl">
                        ¿Y si para comprender otros planetas primero tuviéramos que volver a descubrir el nuestro?
                      </p>

                      <p className="mt-5 max-w-lg text-sm leading-relaxed text-[#A3A1BD] sm:text-base">
                        Un atlas dedicado a explorar los territorios extraordinarios de la Tierra y descubrir sus semejanzas con los paisajes de la Luna y Marte mediante teledetección satelital, geomorfología y datos ambientales.
                      </p>

                      {/* Primary CTAs */}
                      <div className="mt-9 flex flex-wrap items-center gap-4">
                        <Link
                          href="/explorer"
                          className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#C5A36D] px-7 py-3.5 text-sm font-semibold text-[#101321] transition-all hover:bg-[#E4DFD5]"
                        >
                          <span>Iniciar exploración</span>
                          <ArrowUpRight className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
                        </Link>

                        <a
                          href="#el-desafio"
                          className="inline-flex min-h-12 items-center gap-2.5 rounded-full border border-white/20 bg-white/[0.03] px-6 py-3.5 text-sm font-medium text-[#F1F5F9] backdrop-blur-sm transition-colors hover:border-[#00D9F5] hover:text-[#00D9F5]"
                        >
                          <span>Conocer la misión</span>
                          <ArrowDown
                            className="h-4 w-4 text-[#00D9F5]"
                            aria-hidden="true"
                          />
                        </a>
                      </div>
                    </div>

                    {/* Minimal bottom editorial bar */}
                    <div className="flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-4 text-xs text-[#94A3B8]">
                      <div className="flex flex-wrap items-center gap-6 font-mono">
                        <span>
                          CATÁLOGO:{" "}
                          <strong className="font-normal text-[#F1F5F9]">
                            {dataset.sites.length} SITIOS TERRESTRES
                          </strong>
                        </span>
                        <span>
                          REFERENCIAS PDS:{" "}
                          <strong className="font-normal text-[#F1F5F9]">
                            {Object.keys(dataset.references).length} ESCENARIOS
                            (LUNA Y MARTE)
                          </strong>
                        </span>
                      </div>
                      <span className="font-mono text-[11px] tracking-[0.2em] text-[#94A3B8] uppercase">
                        Desplaza para aproximarte a la Tierra ↓
                      </span>
                    </div>
                  </div>

                  {/* CHAPTER 2 EDITORIAL CONTENT — EMERGES IN THE SAME CONTINUOUS SCENE AS CAMERA ADVANCES TOWARD EARTH */}
                  <div
                    style={{
                      opacity: ch2Opacity,
                      transform: `translate3d(0, ${ch2TranslateY}px, 0)`,
                      pointerEvents: ch2Opacity < 0.25 ? "none" : "auto",
                    }}
                    className="absolute inset-x-0 top-0 z-20 mx-auto flex min-h-full max-w-[1440px] flex-col justify-between px-6 pt-24 pb-12 will-change-transform sm:px-10 lg:px-16 lg:pt-28 lg:pb-16"
                  >
                    {/* Subtle contrast scrim behind Chapter 2 typography so bright Earth clouds never reduce legibility */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_28%_30%,rgba(4,9,18,0.84)_0%,rgba(4,9,18,0.52)_48%,rgba(4,9,18,0.18)_100%)]"
                    />

                    <div className="my-auto">
                      <div className="max-w-2xl">
                        <p className="font-mono text-xs font-medium tracking-[0.24em] text-[#00D9F5] uppercase drop-shadow-[0_2px_10px_rgba(3,7,13,0.95)]">
                          02 · Aproximación a la Tierra
                        </p>
                        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#F8FAFC] drop-shadow-[0_4px_24px_rgba(3,7,13,0.95)] sm:text-5xl lg:text-[3.35rem] lg:leading-[1.06]">
                          Antes de llegar a otros mundos, debemos aprender aquí.
                        </h2>
                        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#E2E8F0] drop-shadow-[0_2px_14px_rgba(3,7,13,0.95)] sm:text-base">
                          Desiertos hiperáridos, campos volcánicos y cráteres
                          polares funcionan como laboratorios naturales para
                          validar hábitats, rovers y soporte vital.
                        </p>
                      </div>

                      {/* Three Compact Glassmorphism Cards (Open Centered Modal on Click) */}
                      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
                        {challengeCards.map((item, idx) => {
                          const isSelected = activeChallengeIdx === idx;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              aria-haspopup="dialog"
                              aria-expanded={isSelected}
                              onClick={() => setActiveChallengeIdx(idx)}
                              className={`group flex w-full cursor-pointer flex-col justify-between rounded-xl border bg-[#060d18]/80 p-6 text-left backdrop-blur-md transition-all duration-300 ${
                                isSelected
                                  ? "border-[#00D9F5]/45 shadow-[0_12px_36px_rgba(0,0,0,0.45)]"
                                  : "border-white/10 hover:border-white/25"
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-[11px] font-medium tracking-wider text-[#00D9F5] uppercase">
                                    0{idx + 1} · {item.tag}
                                  </span>
                                  <ScientificIcon
                                    concept={item.concept}
                                    className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-slate-200"
                                  />
                                </div>
                                <h3 className="mt-3.5 text-lg font-semibold leading-snug text-[#F8FAFC] sm:text-xl">
                                  {item.question}
                                </h3>
                              </div>

                              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3.5 font-mono text-xs text-[#00D9F5]">
                                <span>Ver detalles</span>
                                <span
                                  aria-hidden="true"
                                  className="text-sm leading-none transition-transform duration-300 group-hover:translate-x-0.5"
                                >
                                  +
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <DetailModal
                        isOpen={
                          activeChallengeIdx >= 0 &&
                          Boolean(challengeCards[activeChallengeIdx])
                        }
                        onClose={() => setActiveChallengeIdx(-1)}
                        eyebrow={
                          activeChallengeIdx >= 0 &&
                          challengeCards[activeChallengeIdx]
                            ? `0${activeChallengeIdx + 1} · ${challengeCards[activeChallengeIdx].tag}`
                            : ""
                        }
                        title={
                          activeChallengeIdx >= 0 &&
                          challengeCards[activeChallengeIdx]
                            ? challengeCards[activeChallengeIdx].question
                            : ""
                        }
                        icon={
                          activeChallengeIdx >= 0 &&
                          challengeCards[activeChallengeIdx] ? (
                            <ScientificIcon
                              concept={
                                challengeCards[activeChallengeIdx].concept
                              }
                              className="h-4 w-4 shrink-0 text-[#00D9F5]"
                            />
                          ) : null
                        }
                      >
                        {activeChallengeIdx >= 0 &&
                          challengeCards[activeChallengeIdx] && (
                            <div className="space-y-4">
                              <p className="text-sm leading-relaxed text-slate-200 sm:text-base">
                                {challengeCards[activeChallengeIdx].detail}
                              </p>
                              <div className="border-t border-white/10 pt-4 font-mono text-xs text-slate-300 tabular-nums">
                                <span className="text-slate-400">
                                  {challengeCards[activeChallengeIdx].metricLabel}:{" "}
                                </span>
                                <span className="text-[#F8FAFC]">
                                  {challengeCards[activeChallengeIdx].metricValue}
                                </span>
                              </div>
                            </div>
                          )}
                      </DetailModal>
                    </div>

                    <div className="mt-6 flex items-center justify-end pt-3 font-mono text-[11px] text-[#94A3B8]">
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
                className="relative border-t border-white/10"
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
                title="Qué compara ATLANIA entre nuestro planeta y otros mundos"
                subtitle="Un análogo planetario es una región de la Tierra cuyas condiciones físicas o geológicas presentan similitudes medibles con entornos específicos de la Luna o Marte."
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
                  className="mt-28 border-t border-white/15 pt-20"
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
                  className="mt-28 border-t border-white/15 pt-20"
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
                title="Inicia la exploración interactiva en ATLANIA"
                subtitle="La cámara se aleja del paisaje para dar paso a la estación de trabajo completa en /explorer: globo 3D, comparación sincronizada Tierra vs. Luna/Marte, sondeo de coordenadas en vivo y exportación de dossiers."
              >
                <ExplorerTransition sites={translatedSites} />
              </MissionChapter>

              {/* ===============================================================
                  SCIENTIFIC CREDITS & BRAND ATTRIBUTION FOOTER
                  Official logos presented cleanly in their dedicated section
              =============================================================== */}
              <footer className="border-t border-white/10 bg-[#020509] py-20">
                <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
                  <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                    <div className="lg:col-span-5">
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
    </div>
  );
}
