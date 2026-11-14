"use client";

import { useMemo, useState } from "react";
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
import {
  ArrowDown,
  ArrowUpRight,
  Compass,
  ExternalLink,
  Globe2,
  Menu,
  Moon,
  Orbit,
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
    archiveUrl: "https://www.nasa.gov/reference/artemis-iii-candidate-landing-regions/",
    alt: "Región de cráteres y mesetas del polo sur lunar fotografiada durante la misión Artemis I de la NASA",
  },
  "jezero-crater": {
    image: "/nasa/jezero-crater-delta.jpg",
    nasaId: "PIA24814",
    credit: "NASA / JPL-Caltech / University of Arizona (MRO HiRISE & Perseverance)",
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
    earthCredit: "NASA Ames Research Center (Haughton Crater, Isla Devon, Canadá)",
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
    earthCredit: "NASA / JPL-Caltech / ASTER Science Team (Desierto de Atacama, Chile)",
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
        planetaryValue: "Sedimentos deltaicos (1.0), basalto (0.8) y carbonatos",
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
    earthCredit: "NASA / JPL-Caltech / ASTER (Craters of the Moon, Idaho, EE. UU.)",
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
    formulaNote:
      "70% relevancia de tubos de lava + 30% potencial de refugio",
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
  const [focusedLayer, setFocusedLayer] = useState<0 | 1 | 2 | 3>(0);

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
          "En entornos terrestres extremos cuyos procesos geológicos, topográficos o climáticos comparten rasgos acotados con regiones específicas de la Luna o Marte.",
        detail:
          "Ningún sitio terrestre replica otro planeta por completo, pero regiones concretas permiten aislar variables de misión: los tubos de lava basáltica de Galápagos (Ecuador), Timanfaya (España) o Craters of the Moon (EE. UU.) reproducen geometrías de cavidades volcánicas subterráneas; los salares e hiperdesiertos de Atacama (Chile) y Uyuni (Bolivia) preservan evaporitas y costras salinas comparables a antiguos paleolagos marcianos; y el permafrost polar del Cráter Haughton (Canadá) o de alta montaña en el Chimborazo y Antisana (Ecuador) permite ensayar movilidad y perforación en suelos congelados.",
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
          "La correspondencia medible o documentada entre las propiedades del sitio terrestre y los requisitos operativos de la misión extraterrestre.",
        detail:
          "La utilidad de un análogo depende de qué subsistema se desea poner a prueba. En TERR-ANALOG evaluamos cinco ejes complementarios: Topografía (pendiente y rugosidad para locomoción de rovers y aterrizaje), Geología (presencia de basalto, regolito, sedimentos, evaporitas o estructuras de impacto), Régimen Térmico (temperatura media y oscilación térmica), Hidrología y Criósfera (aridez extrema, presencia de hielo/permafrost e historia acuosa) y Operaciones Subterráneas (tubos de lava y potencial de refugio natural). Cada destino pondera estos ejes según su prioridad científica.",
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
          "La gravedad reducida, el vacío lunar o la tenue atmósfera de CO₂ marciana, la radiación cósmica ionizante y la ausencia de biosfera activa.",
        detail:
          "Comprender dónde falla una analogía es tan importante como identificar dónde funciona. En la Tierra la aceleración gravitatoria es de 9.81 m/s² (frente a 1.62 m/s² en la Luna y 3.71 m/s² en Marte), lo que altera la mecánica de suelos, el esfuerzo de motores y la estabilidad estructural. Además, la atmósfera terrestre (101.3 kPa, rica en N₂/O₂ y humedad) y la magnetosfera nos protegen de los rayos cósmicos galácticos (GCR) y micrometeoritos, mientras que la vida microbiana y el agua líquida meteorizan las rocas terrestres de forma distinta al regolito lunar o marciano.",
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
        code: "INGESTA // FUENTES ABIERTAS",
        title: "Datos satelitales y archivos planetarios reales",
        description:
          "El motor consulta la API climatológica de NASA POWER (7 parámetros en celda a 2 metros: T2M_MAX, T2M_MIN, PRECTOTCORR, WS10M, RH2M, ALLSKY_SFC_SW_DWN y PS) y el modelo digital de elevación Copernicus DEM GLO-90 vía Open-Meteo, cruzándolos con 6 perfiles de referencia documentados con fuentes del Planetary Data System (PDS) de la NASA.",
        sources: [
          `NASA POWER API (${dataset.methodology.source_counts.nasa_power}/${dataset.sites.length} sitios activos)`,
          `Copernicus DEM GLO-90 (${
            dataset.methodology.dem_source_counts?.open_meteo ??
            dataset.sites.length
          }/${dataset.sites.length} muestreos de 5 puntos)`,
          "NASA PDS: LRO LOLA/Diviner/LROC, MRO CRISM/HiRISE, MGS MOLA y Perseverance MEDA",
          "Capas cartográficas: NASA GIBS VIIRS True Color, Esri World Imagery y AWS Terrarium 3D",
        ],
        brands: ["nasa-power", "copernicus", "nasa-pds"] as BrandId[],
      },
      {
        step: "Etapa 2 — Analizar",
        code: "PROCESAMIENTO // TELEMETRÍA Y PRIORS",
        title: "Caracterización ambiental, topográfica y geológica",
        description:
          "En engine/asi_engine.py y src/lib/evaluateCoordinate.ts se calculan la pendiente por gradiente central N/S/E/W a 0.01°, la rugosidad por desviación estándar de elevación, la temperatura media anual, el rango térmico diurno y el índice hiperbólico de sequedad 1 / (1 + precip_mm_día), integrados con los vectores de membresía litológica y subterránea del catálogo.",
        sources: [
          "Muestreo cardinal de 5 puntos DEM (centro ± 0.01° N, S, E, O)",
          "Índice de aridez terrestre continuo: Dryness = 1 / (1 + PRECTOTCORR)",
          "5 membresías litológicas en [0, 1]: basalto, regolito, sedimentario, evaporita e impacto",
          "Distinción explícita entre telemetría medida y supuestos de escenario (priors)",
        ],
        brands: ["python", "open-meteo", "nasa-power"] as BrandId[],
      },
      {
        step: "Etapa 3 — Comparar",
        code: "MODELO // ÍNDICE ASI v0.2.0",
        title: "Cálculo del Analog Similarity Index (ASI) en 5 ejes",
        description:
          "Cada sitio terrestre se compara contra cada objetivo lunar y marciano mediante la función de similitud acotada L(a, b; s) = max(0, 1 − |a − b| / s) y la superposición difusa de Jaccard Σ min / Σ max para geología. Las 5 dimensiones se ponderan según las prioridades del destino extraterrestre y se generan automáticamente las advertencias de ruptura de analogía.",
        sources: [
          "Ecuación real: overall_asi = Σ (target_weight[d] × dimension_score[d])",
          "Umbral de fortaleza dimensional: puntuación ≥ 70 / 100",
          "Reporte obligatorio de 6 categorías de ruptura de analogía (analogy_breakdowns)",
          "Verificado por pruebas unitarias en Python (pytest) y Node.js (node --test)",
        ],
        brands: ["python", "nasa-pds"] as BrandId[],
      },
      {
        step: "Etapa 4 — Explorar",
        code: "INTERFAZ // MISSION CONTROL HUD",
        title: "Exploración cartográfica 3D, sondeo en vivo y exportación",
        description:
          "Los resultados alimentan el explorador interactivo en /explorer: globo y relieve 3D con MapLibre GL, comparación lado a lado Tierra vs. Luna/Marte, sondeo puntual de cualquier coordenada terrestre, prospección matricial 3×3 y 4×4 de regiones enteras y exportación de dossiers científicos en Markdown, JSON y GeoJSON para QGIS.",
        sources: [
          "Explorador geoespacial interactivo en /explorer con filtros por cuerpo y país",
          "Endpoints en tiempo real: /api/evaluate (punto) y /api/evaluate-region (grilla 3×3 / 4×4)",
          "Mesa comparativa expandible de 3 columnas con gráfico radar pentagonal",
          "Exportación directa de Dossier Markdown/JSON y capa GeoJSON EPSG:4326",
        ],
        brands: ["nextjs", "maplibre", "github"] as BrandId[],
      },
    ],
    [dataset.methodology, dataset.sites.length]
  );

  // SVG Circular Gauge helper (strictly visual representation of precalculated ASI)
  const gaugeRadius = 68;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const currentAsiValue = selectedAsiScore?.overall_asi ?? 0;
  const gaugeStrokeDashoffset =
    gaugeCircumference -
    (Math.max(0, Math.min(100, currentAsiValue)) / 100) * gaugeCircumference;
  const isSelectedTargetMars = selectedAsiTarget?.body === "Mars";

  return (
    <div className="min-h-screen bg-[#050B13] text-[#F1F5F9] selection:bg-[#00D9F5]/30 selection:text-[#F1F5F9]">
      {/* Accessibility Skip Link */}
      <a
        href="#capitulo-1"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-[#00D9F5] focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-[#050B13]"
      >
        Saltar al contenido principal de Mission Briefing
      </a>

      {/* =====================================================================
          TOP EDITORIAL NAVIGATION BAR
      ===================================================================== */}
      <header className="sticky top-0 z-40 border-b border-slate-800/70 bg-[#050B13]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Left Pill Links (Desktop) */}
          <nav
            aria-label="Capítulos del viaje espacial"
            className="hidden items-center gap-2 lg:flex"
          >
            <a
              href="#el-desafio"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-800/90 bg-[#0A1624]/80 px-4 py-1.5 text-xs font-medium text-[#F1F5F9] transition-colors hover:border-[#00D9F5]/50 hover:text-[#00D9F5]"
            >
              <span>02 · Tierra</span>
              <span className="font-mono text-[#00D9F5]" aria-hidden="true">
                +
              </span>
            </a>
            <a
              href="#capas-del-terreno"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-800/90 bg-[#0A1624]/80 px-4 py-1.5 text-xs font-medium text-[#F1F5F9] transition-colors hover:border-[#00D9F5]/50 hover:text-[#00D9F5]"
            >
              <span>03 · Capas 3D</span>
              <span className="font-mono text-[#00D9F5]" aria-hidden="true">
                +
              </span>
            </a>
            <a
              href="#que-es-un-analogo"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-800/90 bg-[#0A1624]/80 px-4 py-1.5 text-xs font-medium text-[#F1F5F9] transition-colors hover:border-[#00D9F5]/50 hover:text-[#00D9F5]"
            >
              <span>04 · Comparación y ASI</span>
              <span className="font-mono text-[#00D9F5]" aria-hidden="true">
                +
              </span>
            </a>
            <a
              href="#explora-los-destinos"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-800/90 bg-[#0A1624]/80 px-4 py-1.5 text-xs font-medium text-[#F1F5F9] transition-colors hover:border-[#00D9F5]/50 hover:text-[#00D9F5]"
            >
              <span>Destinos</span>
              <span className="font-mono text-[#00D9F5]" aria-hidden="true">
                +
              </span>
            </a>
          </nav>

          {/* Center Brand Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-lg font-bold tracking-[0.14em] text-[#F1F5F9] sm:text-xl"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#00D9F5]/40 bg-[#0A1624] text-[#00D9F5]">
              <Compass className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>
              TERR<span className="font-light text-[#00D9F5]">-ANALOG</span>
            </span>
          </Link>

          {/* Right Pill Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center sm:flex">
              <BrandLogo brand="nasa-worm" size="sm" showLabel={false} />
            </div>

            <Link
              href="/explorer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#00D9F5]/60 bg-[#0A1624] px-4 py-2 text-xs font-bold tracking-wider text-[#F1F5F9] transition-colors hover:border-[#00D9F5] hover:bg-[#101F30] sm:px-5"
            >
              <span>Iniciar Exploración</span>
              <ArrowUpRight
                className="h-4 w-4 text-[#00D9F5]"
                aria-hidden="true"
              />
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-mission-nav"
              aria-label={
                mobileMenuOpen
                  ? "Cerrar menú de navegación"
                  : "Abrir menú de navegación"
              }
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-slate-800 bg-[#0A1624] p-2.5 text-[#F1F5F9] lg:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav
            id="mobile-mission-nav"
            aria-label="Navegación móvil de capítulos"
            className="border-t border-slate-800/80 bg-[#0A1624] px-4 py-4 lg:hidden"
          >
            <div className="grid gap-2">
              {[
                { href: "#capitulo-1", label: "Capítulo 1 — El comienzo" },
                {
                  href: "#el-desafio",
                  label: "Capítulo 2 — Aproximación a la Tierra (El Desafío)",
                },
                {
                  href: "#capas-del-terreno",
                  label: "Capítulo 3 — Capas del terreno y Solución",
                },
                {
                  href: "#que-es-un-analogo",
                  label: "Capítulo 4 — Comparación planetaria e Índice ASI",
                },
                {
                  href: "#acceso-explorador",
                  label: "Capítulo 5 — Acceso al explorador TERR-ANALOG",
                },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-11 items-center justify-between rounded-xl border border-slate-800/80 bg-[#101F30]/70 px-4 py-2.5 text-sm font-medium text-[#F1F5F9] hover:border-[#00D9F5]/50"
                >
                  <span>{item.label}</span>
                  <span className="font-mono text-xs text-[#00D9F5]">→</span>
                </a>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* =====================================================================
          CONTINUOUS 5-CHAPTER 3D SCROLL JOURNEY
      ===================================================================== */}
      <ScrollScene
        comparisonBody={activeBodyTab}
        focusedLayer={focusedLayer}
      >
        {(scrollState) => (
          <main id="hero-main-content">
            {/* =================================================================
                CAPÍTULO 1 — EL COMIENZO (HERO — THE NEXT FRONTIER)
            ================================================================= */}
            <section
              id="capitulo-1"
              aria-labelledby="hero-title"
              className="relative px-4 pt-6 pb-20 sm:px-6 sm:pt-10 lg:px-8"
            >
              <div className="relative mx-auto flex min-h-[86vh] max-w-7xl flex-col justify-between rounded-[32px] border border-slate-800/80 bg-[#050B13]/45 px-6 pt-8 pb-8 backdrop-blur-[2px] sm:px-12 sm:pt-12">
                {/* Top Discreet Editorial Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-4 font-mono text-[11px] text-[#94A3B8] tabular-nums">
                  <div className="flex items-center gap-3">
                    <BrandLogo brand="nasa" size="sm" showLabel={false} />
                    <span className="tracking-wider text-[#F1F5F9]">
                      CAPÍTULO 01 — EL COMIENZO // MISSION BRIEFING
                    </span>
                  </div>
                  <span className="rounded-full border border-slate-800/80 bg-[#0A1624]/80 px-3 py-0.5 text-[10px] text-[#94A3B8]">
                    MARCO DECORATIVO HUD: WGS84 00°00&apos;N · SELENE 89°54&apos;S · AREO
                    18°23&apos;N (NO ES TELEMETRÍA EN VIVO)
                  </span>
                </div>

                {/* Editorial Hero Grid: Left/Center Typography + Right Astronaut & Orbital Telemetry */}
                <div className="my-auto grid items-center gap-10 py-10 lg:grid-cols-12">
                  <div className="text-left lg:col-span-7">
                    <div className="inline-flex items-center gap-2.5 rounded-full border border-[#00D9F5]/35 bg-[#0A1624]/85 px-4 py-1.5 font-mono text-xs font-semibold tracking-[0.18em] text-[#00D9F5]">
                      <span>NASA SPACE APPS CHALLENGE 2026</span>
                    </div>

                    <h1
                      id="hero-title"
                      className="mt-6 text-5xl font-bold tracking-[0.14em] text-[#F1F5F9] sm:text-7xl"
                    >
                      TERR<span className="font-light text-[#00D9F5]">-ANALOG</span>
                    </h1>

                    <p className="mt-4 text-xl font-semibold text-[#F5B82E] sm:text-3xl">
                      La Tierra como laboratorio para explorar otros mundos.
                    </p>

                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#F1F5F9]/90 sm:text-lg">
                      Explora qué regiones de nuestro planeta comparten
                      características con entornos de la Luna y Marte. Compara
                      datos científicos, descubre posibles análogos terrestres y
                      comprende sus limitaciones.
                    </p>

                    {/* Primary & Secondary CTAs */}
                    <div className="mt-9 flex flex-wrap items-center gap-4">
                      <Link
                        href="/explorer"
                        className="group inline-flex min-h-12 items-center gap-3 rounded-full border border-[#00D9F5]/70 bg-[#0A1624]/95 py-1.5 pr-2 pl-6 text-xs font-bold tracking-[0.12em] text-[#F1F5F9] transition-all hover:border-[#00D9F5] hover:bg-[#101F30] sm:text-sm"
                      >
                        <span>INICIAR EXPLORACIÓN</span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00D9F5] text-[#050B13] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                          <ArrowUpRight
                            className="h-4 w-4 stroke-[2.5]"
                            aria-hidden="true"
                          />
                        </span>
                      </Link>

                      <a
                        href="#el-desafio"
                        className="inline-flex min-h-12 items-center gap-2.5 rounded-full border border-slate-700/90 bg-[#101F30]/75 px-6 py-3 text-xs font-bold tracking-[0.12em] text-[#F1F5F9] transition-colors hover:border-[#F5B82E]/70 hover:text-[#F5B82E] sm:text-sm"
                      >
                        <span>DESCUBRIR LA MISIÓN</span>
                        <ArrowDown
                          className="h-4 w-4 text-[#F5B82E]"
                          aria-hidden="true"
                        />
                      </a>
                    </div>

                    {/* Verified Data Source Strip */}
                    <div className="mt-10 flex flex-wrap items-center gap-5 border-t border-slate-800/70 pt-5">
                      <BrandLogo brand="nasa-power" size="sm" />
                      <BrandLogo brand="nasa-pds" size="sm" />
                      <BrandLogo brand="copernicus" size="sm" />
                    </div>
                  </div>

                  {/* Right 5 Cols: Iconic NASA EVA Astronaut Card + Planetary Trio Reference */}
                  <div className="flex flex-col gap-4 lg:col-span-5">
                    <figure className="relative overflow-hidden rounded-3xl border border-slate-800/90 bg-[#0A1624]/80 shadow-2xl backdrop-blur-md">
                      <div className="relative aspect-[4/3] w-full overflow-hidden">
                        <Image
                          src="/nasa/astronaut-eva.jpg"
                          alt="Astronauta de la NASA Bruce McCandless II en actividad extravehicular libre sobre el horizonte terrestre (Misión STS-41B, ID S84-27017)"
                          width={720}
                          height={540}
                          priority
                          className="h-full w-full object-cover"
                        />
                        <div
                          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050B13] via-transparent to-transparent"
                          aria-hidden="true"
                        />
                      </div>
                      <figcaption className="flex items-center justify-between gap-2 px-5 py-3.5 font-mono text-[11px] text-[#94A3B8]">
                        <span>
                          Archivo NASA JSC · EVA sobre el limbo terrestre (ID:{" "}
                          <strong className="text-[#F1F5F9]">S84-27017</strong>)
                        </span>
                        <span className="text-[#00D9F5]">Dominio Público</span>
                      </figcaption>
                    </figure>

                    {/* Moon & Mars Orbital Quick Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-800/90 bg-[#0A1624]/85 p-3 backdrop-blur-md">
                        <Image
                          src="/nasa/moon-orb.jpg"
                          alt="La Luna fotografiada durante la misión Artemis I de la NASA"
                          width={44}
                          height={44}
                          className="h-11 w-11 rounded-full border border-slate-700 object-cover"
                        />
                        <div>
                          <span className="block font-mono text-[10px] uppercase text-[#00D9F5]">
                            LUNA · ARTEMIS / LRO
                          </span>
                          <span className="font-mono text-xs font-bold text-[#F1F5F9] tabular-nums">
                            1.62 m/s² · 0 kPa
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-2xl border border-slate-800/90 bg-[#0A1624]/85 p-3 backdrop-blur-md">
                        <Image
                          src="/nasa/mars-orb.jpg"
                          alt="Vista global de Marte generada por los orbitadores Viking de NASA/JPL"
                          width={44}
                          height={44}
                          className="h-11 w-11 rounded-full border border-[#E07A5F]/50 object-cover"
                        />
                        <div>
                          <span className="block font-mono text-[10px] uppercase text-[#E07A5F]">
                            MARTE · MRO / MEDA
                          </span>
                          <span className="font-mono text-xs font-bold text-[#F1F5F9] tabular-nums">
                            3.71 m/s² · 0.65 kPa
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Hero Status & Scroll Indicator */}
                <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-800/70 pt-4 text-xs text-[#94A3B8] sm:flex-row">
                  <p className="font-mono text-[11px]">
                    Escena 3D en tiempo real texturizada con NASA Blue Marble (
                    <code className="text-[#F1F5F9]">
                      GSFC_20171208_Archive_e001386
                    </code>
                    ), Artemis I (<code className="text-[#F1F5F9]">art002e009006</code>)
                    y Viking (<code className="text-[#F1F5F9]">PIA00407</code>).
                  </p>

                  <a
                    href="#el-desafio"
                    className="inline-flex items-center gap-2 font-mono text-xs text-[#00D9F5] hover:underline"
                  >
                    <span>Desplazar para iniciar aproximación orbital</span>
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </section>

            {/* =================================================================
                CAPÍTULO 2 — APROXIMACIÓN A LA TIERRA (EL DESAFÍO)
            ================================================================= */}
            <MissionChapter
              id="el-desafio"
              chapterNumber="02"
              chapterTitle="Aproximación a la Tierra"
              eyebrow="El Problema Científico"
              headline="Antes de llegar a otros mundos, debemos aprender aquí."
              lead="A medida que nos aproximamos a la atmósfera y superficie de nuestro planeta, surge el reto planteado por NASA Space Apps: identificar con datos abiertos qué lugares de la Tierra permiten ensayar hábitats, rovers e instrumentación antes de enviarlos a la Luna o Marte."
              rightSlot={
                <a
                  href="https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-[#F5B82E]/50 bg-[#101F30]/90 px-5 py-2.5 text-xs font-bold text-[#F5B82E] transition-colors hover:border-[#F5B82E] hover:bg-[#F5B82E]/15"
                >
                  <BrandLogo brand="nasa" size="sm" showLabel={false} />
                  <span>Ver desafío oficial en NASA Space Apps</span>
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              }
            >
              <div className="grid gap-6 lg:grid-cols-3">
                {challengeCards.map((card, index) => {
                  const isSelected = activeChallengeIdx === index;
                  return (
                    <article
                      key={card.id}
                      className={`flex flex-col justify-between rounded-2xl border p-7 backdrop-blur-md transition-all ${
                        isSelected
                          ? "border-[#00D9F5]/80 bg-[#101F30]/92"
                          : "border-slate-800/90 bg-[#0A1624]/85 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#050B13]/85 px-3 py-1 font-mono text-[11px] font-semibold text-[#00D9F5]">
                            <ScientificIcon
                              concept={card.concept}
                              className="h-4 w-4"
                            />
                            <span>{card.tag}</span>
                          </span>
                          <span className="font-mono text-xs text-[#94A3B8] tabular-nums">
                            PREGUNTA {index + 1}/3
                          </span>
                        </div>

                        <h3 className="mt-5 text-xl font-bold leading-snug text-[#F1F5F9]">
                          {card.question}
                        </h3>

                        <p className="mt-3 text-sm leading-relaxed text-[#F1F5F9]/90">
                          {card.shortAnswer}
                        </p>

                        <p className="mt-3 text-xs leading-relaxed text-[#94A3B8]">
                          {card.detail}
                        </p>
                      </div>

                      <div className="mt-6 border-t border-slate-800/80 pt-4">
                        <span className="block font-mono text-[10px] uppercase tracking-wider text-[#94A3B8]">
                          {card.metricLabel}
                        </span>
                        <span className="mt-1 block font-mono text-xs font-semibold text-[#F5B82E] tabular-nums">
                          {card.metricValue}
                        </span>

                        <button
                          type="button"
                          onClick={() => setActiveChallengeIdx(index)}
                          aria-pressed={isSelected}
                          className={`mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                            isSelected
                              ? "border-[#00D9F5]/60 bg-[#00D9F5]/15 text-[#00D9F5]"
                              : "border-slate-800 bg-[#050B13]/70 text-[#94A3B8] hover:text-[#F1F5F9]"
                          }`}
                        >
                          <span>
                            {isSelected
                              ? "Pregunta activa en foco"
                              : "Enfocar este eje"}
                          </span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </MissionChapter>

            {/* =================================================================
                CAPÍTULO 3 — CAPAS DEL TERRENO Y NUESTRA SOLUCIÓN
            ================================================================= */}
            <MissionChapter
              id="capas-del-terreno"
              chapterNumber="03"
              chapterTitle="Capas del terreno"
              eyebrow="Estratigrafía Esquemática y Tubería de Datos"
              headline="Descomponiendo el paisaje terrestre en capas de análisis."
              lead="Al acercarnos a una región candidata, TERR-ANALOG separa esquemáticamente el entorno en tres estratos complementarios —superficie topográfica y climática, corteza litológica y subsuelo operativo— sincronizados con el flujo real de datos del proyecto."
            >
              <TerrainLayers
                layerSeparation={scrollState.layerSeparation}
                focusedLayer={focusedLayer}
                onSelectLayer={setFocusedLayer}
                activePipelineStep={activePipelineStep}
                onSelectPipelineStep={setActivePipelineStep}
                pipelineSteps={pipelineSteps}
              />
            </MissionChapter>

            {/* =================================================================
                CAPÍTULO 4 — COMPARACIÓN PLANETARIA E ÍNDICE ASI REAL
            ================================================================= */}
            <MissionChapter
              id="que-es-un-analogo"
              chapterNumber="04"
              chapterTitle="Comparación planetaria"
              eyebrow="Tierra vs. Luna y Marte · Analog Similarity Index (ASI)"
              headline="¿Qué es un análogo terrestre y cómo interpretamos su similitud?"
              lead="Un análogo terrestre es un lugar de la Tierra que comparte determinadas características con un entorno extraterrestre y puede ayudar a estudiar problemas específicos de exploración."
              rightSlot={
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span className="font-mono text-[11px] text-[#94A3B8]">
                    Alternar comparación planetaria en 3D y paneles:
                  </span>
                  <div
                    role="tablist"
                    aria-label="Seleccionar cuerpo celeste para ejemplos comparativos"
                    className="flex rounded-xl border border-slate-800 bg-[#050B13]/90 p-1"
                  >
                    <button
                      type="button"
                      role="tab"
                      id="tab-examples-moon"
                      aria-selected={activeBodyTab === "Moon"}
                      onClick={() => {
                        setActiveBodyTab("Moon");
                        setActiveExampleId("moon-lava-tubes");
                      }}
                      className="mb-tab inline-flex min-h-11 items-center gap-2 px-4 py-2 text-xs font-bold text-[#F1F5F9] transition-colors"
                    >
                      <Moon
                        className="h-4 w-4 text-[#00D9F5]"
                        aria-hidden="true"
                      />
                      <span>Tierra ⇄ Luna</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      id="tab-examples-mars"
                      aria-selected={activeBodyTab === "Mars"}
                      onClick={() => {
                        setActiveBodyTab("Mars");
                        setActiveExampleId("mars-paleolake");
                      }}
                      className="mb-tab inline-flex min-h-11 items-center gap-2 px-4 py-2 text-xs font-bold text-[#F1F5F9] transition-colors"
                    >
                      <Orbit
                        className="h-4 w-4 text-[#E07A5F]"
                        aria-hidden="true"
                      />
                      <span>Tierra ⇄ Marte</span>
                    </button>
                  </div>
                </div>
              }
            >
              {/* Scenario selector pills within active planetary body */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-[#94A3B8]">
                  Escenario documental:
                </span>
                {COMPARATIVE_EXAMPLES.filter(
                  (ex) => ex.body === activeBodyTab
                ).map((ex) => {
                  const selected = activeComparativeExample.id === ex.id;
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => setActiveExampleId(ex.id)}
                      aria-pressed={selected}
                      className={`min-h-10 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                        selected
                          ? "border-[#00D9F5] bg-[#00D9F5]/20 text-[#00D9F5]"
                          : "border-slate-800 bg-[#101F30]/80 text-[#94A3B8] hover:text-[#F1F5F9]"
                      }`}
                    >
                      {ex.pairTitle}
                    </button>
                  );
                })}
              </div>

              {/* Two Visual Comparative Panels: TIERRA vs LUNA / MARTE */}
              <div
                role="tabpanel"
                aria-labelledby={
                  activeBodyTab === "Moon"
                    ? "tab-examples-moon"
                    : "tab-examples-mars"
                }
                className="mt-8 grid gap-6 lg:grid-cols-2"
              >
                {/* PANEL 1: TIERRA */}
                <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/90 bg-[#101F30]/90 backdrop-blur-md">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800/90 bg-[#050B13]/80 px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Globe2
                          className="h-4 w-4 text-[#00D9F5]"
                          aria-hidden="true"
                        />
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#00D9F5]">
                          PANEL // TIERRA
                        </span>
                      </div>
                      <span className="font-mono text-xs text-[#94A3B8] tabular-nums">
                        {activeComparativeSite.country} · Elev.{" "}
                        {activeComparativeSite.elevation_m.toLocaleString()} m
                      </span>
                    </div>

                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#050B13]">
                      <Image
                        src={activeComparativeExample.earthImage}
                        alt={activeComparativeExample.earthAlt}
                        width={800}
                        height={450}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#050B13] via-[#050B13]/80 to-transparent p-4">
                        <h3 className="text-lg font-bold text-[#F1F5F9]">
                          {activeComparativeSite.name}
                        </h3>
                        <p className="mt-0.5 font-mono text-[11px] text-[#94A3B8]">
                          Fuente imagen: {activeComparativeExample.earthCredit}{" "}
                          (ID: {activeComparativeExample.earthNasaId})
                        </p>
                      </div>
                    </div>

                    <div className="p-5">
                      <p className="text-sm leading-relaxed text-[#F1F5F9]/90">
                        {activeComparativeSite.rationale}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-800/80 bg-[#050B13]/50 px-5 py-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-[#94A3B8] tabular-nums">
                      <span>
                        Coordenadas: {activeComparativeSite.latitude.toFixed(2)}
                        °, {activeComparativeSite.longitude.toFixed(2)}°
                      </span>
                      <Link
                        href={`/explorer?site=${encodeURIComponent(
                          activeComparativeSite.id
                        )}`}
                        className="font-semibold text-[#00D9F5] hover:underline"
                      >
                        Inspeccionar sitio en el mapa 3D →
                      </Link>
                    </div>
                  </div>
                </div>

                {/* PANEL 2: LUNA / MARTE */}
                <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/90 bg-[#101F30]/90 backdrop-blur-md">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800/90 bg-[#050B13]/80 px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {activeBodyTab === "Mars" ? (
                          <Orbit
                            className="h-4 w-4 text-[#E07A5F]"
                            aria-hidden="true"
                          />
                        ) : (
                          <Moon
                            className="h-4 w-4 text-[#F5B82E]"
                            aria-hidden="true"
                          />
                        )}
                        <span
                          className={`font-mono text-xs font-bold uppercase tracking-wider ${
                            activeBodyTab === "Mars"
                              ? "text-[#E07A5F]"
                              : "text-[#F5B82E]"
                          }`}
                        >
                          PANEL // {activeComparativeExample.bodyLabel}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-[#94A3B8] tabular-nums">
                        Instrumentos:{" "}
                        {activeComparativeTarget?.instrument ?? "NASA PDS"}
                      </span>
                    </div>

                    {(() => {
                      const media =
                        TARGET_MEDIA[activeComparativeExample.targetId] ??
                        TARGET_MEDIA["mare-tranquillitatis"];
                      return (
                        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#050B13]">
                          <Image
                            src={media.image}
                            alt={media.alt}
                            width={800}
                            height={450}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#050B13] via-[#050B13]/80 to-transparent p-4">
                            <h3 className="text-lg font-bold text-[#F1F5F9]">
                              {activeComparativeTarget?.name}
                            </h3>
                            <p className="mt-0.5 font-mono text-[11px] text-[#94A3B8]">
                              Fuente imagen: {media.credit} (ID: {media.nasaId})
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="p-5">
                      <p className="text-sm leading-relaxed text-[#F1F5F9]/90">
                        {activeComparativeTarget?.context}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-800/80 bg-[#050B13]/50 px-5 py-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-[#94A3B8] tabular-nums">
                      <span>
                        Gravedad: {activeComparativeTarget?.gravity_ms2 ?? "—"}{" "}
                        m/s² · Presión:{" "}
                        {activeComparativeTarget?.pressure_kpa ?? 0} kPa
                      </span>
                      <Link
                        href={`/explorer?target=${encodeURIComponent(
                          activeComparativeExample.targetId
                        )}`}
                        className="font-semibold text-[#F5B82E] hover:underline"
                      >
                        Abrir destino en el explorador →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5 Characteristics Comparison Table with Semantic ScientificIcons */}
              <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800/90 bg-[#101F30]/80 backdrop-blur-md">
                <div className="border-b border-slate-800/90 bg-[#050B13]/80 px-5 py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-[#F1F5F9]">
                      Características comparadas en este escenario (Tierra vs.{" "}
                      {activeComparativeExample.bodyLabel})
                    </h3>
                    <span className="font-mono text-[11px] text-[#94A3B8]">
                      Nota: el sistema combina telemetría satelital (NASA POWER /
                      DEM) con priors documentados; no todas las variables son
                      mediciones directas in situ.
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-800/80">
                  {activeComparativeExample.characteristics.map((row) => (
                    <div
                      key={row.label}
                      className="grid gap-3 px-5 py-3.5 text-xs sm:grid-cols-12 sm:items-center"
                    >
                      <div className="flex items-center gap-2.5 font-bold text-[#00D9F5] sm:col-span-3">
                        <ScientificIcon
                          concept={row.concept}
                          className="h-4 w-4 shrink-0"
                        />
                        <span>{row.label}</span>
                      </div>
                      <div className="font-mono text-[#F1F5F9] tabular-nums sm:col-span-4">
                        <span className="mr-1.5 text-[10px] uppercase text-[#94A3B8]">
                          Tierra:
                        </span>
                        {row.earthValue}
                      </div>
                      <div className="font-mono text-[#F1F5F9] tabular-nums sm:col-span-3">
                        <span className="mr-1.5 text-[10px] uppercase text-[#F5B82E]">
                          {activeComparativeExample.bodyLabel}:
                        </span>
                        {row.planetaryValue}
                      </div>
                      <div className="font-mono text-[11px] text-[#94A3B8] sm:col-span-2 sm:text-right">
                        {row.sourceTag}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mandatory Scientific Warning: Similitud no significa equivalencia */}
              <div
                role="note"
                aria-label="Advertencia científica sobre limitaciones de los análogos terrestres"
                className="mt-8 rounded-2xl border border-[#F5B82E]/50 bg-[#101F30]/90 p-6 backdrop-blur-md"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#F5B82E]/50 bg-[#F5B82E]/15 text-[#F5B82E]">
                      <ShieldAlert className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#F5B82E]">
                        ADVERTENCIA CIENTÍFICA FUNDAMENTAL
                      </span>
                      <h3 className="mt-1 text-xl font-bold text-[#F1F5F9]">
                        Similitud no significa equivalencia.
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#F1F5F9]/90">
                        Los análogos terrestres no son reproducciones exactas de
                        la Luna ni de Marte. Incluso cuando la topografía o la
                        litología muestran alta similitud de escenario, existen
                        barreras físicas irreproducibles a cielo abierto en la
                        Tierra:
                      </p>
                    </div>
                  </div>

                  <div className="grid shrink-0 grid-cols-2 gap-3 font-mono text-xs tabular-nums sm:grid-cols-4">
                    <div className="rounded-xl border border-slate-800 bg-[#050B13]/85 p-3">
                      <div className="flex items-center gap-1.5 text-[#00D9F5]">
                        <ScientificIcon concept="gravity" className="h-4 w-4" />
                        <span className="text-[10px] text-[#94A3B8]">
                          GRAVEDAD
                        </span>
                      </div>
                      <span className="mt-1.5 block font-bold text-[#F1F5F9]">
                        9.81 m/s²
                      </span>
                      <span className="mt-0.5 block text-[10px] text-[#F5B82E]">
                        vs. 1.62 / 3.71 m/s²
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-[#050B13]/85 p-3">
                      <div className="flex items-center gap-1.5 text-[#00D9F5]">
                        <ScientificIcon
                          concept="atmosphere"
                          className="h-4 w-4"
                        />
                        <span className="text-[10px] text-[#94A3B8]">
                          ATMÓSFERA
                        </span>
                      </div>
                      <span className="mt-1.5 block font-bold text-[#F1F5F9]">
                        101.3 kPa
                      </span>
                      <span className="mt-0.5 block text-[10px] text-[#F5B82E]">
                        vs. 0 / 0.65 kPa
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-[#050B13]/85 p-3">
                      <div className="flex items-center gap-1.5 text-[#00D9F5]">
                        <ScientificIcon
                          concept="radiation"
                          className="h-4 w-4"
                        />
                        <span className="text-[10px] text-[#94A3B8]">
                          RADIACIÓN
                        </span>
                      </div>
                      <span className="mt-1.5 block font-bold text-[#F1F5F9]">
                        Escudo Mag.
                      </span>
                      <span className="mt-0.5 block text-[10px] text-[#F5B82E]">
                        vs. GCR / SPE directos
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-[#050B13]/85 p-3">
                      <div className="flex items-center gap-1.5 text-[#00D9F5]">
                        <ScientificIcon
                          concept="weathering"
                          className="h-4 w-4"
                        />
                        <span className="text-[10px] text-[#94A3B8]">
                          INTEMPERISMO
                        </span>
                      </div>
                      <span className="mt-1.5 block font-bold text-[#F1F5F9]">
                        H₂O + Biota
                      </span>
                      <span className="mt-0.5 block text-[10px] text-[#F5B82E]">
                        vs. Vacío / Oxidación
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===============================================================
                  SUB-SECTION 7: CÓMO INTERPRETAMOS LA SIMILITUD (ASI REAL)
              =============================================================== */}
              <div id="similitud-asi" className="mt-20 pt-12 border-t border-slate-800/80">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                  <div className="max-w-3xl">
                    <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#00D9F5]">
                      METODOLOGÍA CUANTITATIVA //{" "}
                      {dataset.methodology.name.toUpperCase()} v
                      {dataset.methodology.version}
                    </span>
                    <h3 className="mt-2 text-3xl font-bold tracking-tight text-[#F1F5F9] sm:text-4xl">
                      Más allá de lo que parece similar.
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-[#94A3B8]">
                      El{" "}
                      <strong className="text-[#F1F5F9]">
                        Analog Similarity Index (ASI)
                      </strong>{" "}
                      combina cinco dimensiones en una escala de 0 a 100
                      ponderada según las prioridades de cada destino
                      extraterrestre. Todos los valores provienen directamente de{" "}
                      <code className="font-mono text-[#00D9F5]">
                        analogs.json
                      </code>
                      , sin porcentajes ni ponderaciones inventadas.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <MethodologyDialog dataset={dataset} />
                    <Link
                      href={`/explorer?site=${encodeURIComponent(
                        selectedAsiSite.id
                      )}&target=${encodeURIComponent(selectedAsiTarget.id)}`}
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#00D9F5]/50 bg-[#00D9F5]/15 px-3.5 py-1.5 text-xs font-semibold text-[#00D9F5] hover:bg-[#00D9F5]/25"
                    >
                      <span>Abrir par en el explorador</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                {/* Interactive Selector of Real Catalog Site & Real Target */}
                <div className="mt-8 grid gap-4 rounded-2xl border border-slate-800/90 bg-[#101F30]/85 p-5 backdrop-blur-md sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="asi-site-select"
                      className="block font-mono text-xs font-semibold uppercase tracking-wider text-[#00D9F5]"
                    >
                      1. Sitio Terrestre del Catálogo Real (
                      {translatedSites.length} sitios):
                    </label>
                    <select
                      id="asi-site-select"
                      value={selectedAsiSite.id}
                      onChange={(e) => {
                        const nextSiteId = e.target.value;
                        setSelectedAsiSiteId(nextSiteId);
                        const found = translatedSites.find(
                          (s) => s.id === nextSiteId
                        );
                        if (found) {
                          setSelectedAsiTargetId(found.best_target);
                        }
                      }}
                      className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-[#050B13] px-3.5 py-2 text-sm text-[#F1F5F9]"
                    >
                      {translatedSites.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.country}) — Mejor ASI:{" "}
                          {s.overall_asi.toFixed(1)}%
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="asi-target-select"
                      className="block font-mono text-xs font-semibold uppercase tracking-wider text-[#F5B82E]"
                    >
                      2. Objetivo Extraterrestre Comparado (
                      {referenceList.length} destinos PDS):
                    </label>
                    <select
                      id="asi-target-select"
                      value={selectedAsiTarget.id}
                      onChange={(e) => setSelectedAsiTargetId(e.target.value)}
                      className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-[#050B13] px-3.5 py-2 text-sm text-[#F1F5F9]"
                    >
                      {referenceList.map((ref) => {
                        const pairScore =
                          selectedAsiSite.scores[ref.id]?.overall_asi;
                        return (
                          <option key={ref.id} value={ref.id}>
                            [{ref.body === "Mars" ? "Marte" : "Luna"}]{" "}
                            {ref.name}
                            {pairScore !== undefined
                              ? ` — ASI: ${pairScore.toFixed(2)}%`
                              : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Real ASI Circular Indicator + 5-Dimension Breakdown */}
                {selectedAsiScore && (
                  <div className="mt-6 grid gap-6 lg:grid-cols-12">
                    <div className="flex flex-col items-center justify-between rounded-2xl border border-slate-800/90 bg-[#101F30]/90 p-6 backdrop-blur-md lg:col-span-5">
                      <div className="w-full text-center">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-[#94A3B8]">
                          PUNTUACIÓN PRECALCULADA EN ANALOGS.JSON
                        </span>
                        <h4 className="mt-1 text-base font-bold text-[#F1F5F9]">
                          {selectedAsiSite.name}
                        </h4>
                        <span className="font-mono text-xs text-[#F5B82E]">
                          vs. {selectedAsiTarget.name}
                        </span>
                      </div>

                      <div className="relative my-4 flex items-center justify-center">
                        <svg
                          width="176"
                          height="176"
                          viewBox="0 0 176 176"
                          role="img"
                          aria-label={`Indicador circular ASI: ${selectedAsiScore.overall_asi.toFixed(
                            2
                          )} sobre 100`}
                        >
                          <circle
                            cx="88"
                            cy="88"
                            r={gaugeRadius}
                            fill="none"
                            stroke="rgba(148, 163, 184, 0.16)"
                            strokeWidth="12"
                          />
                          <circle
                            cx="88"
                            cy="88"
                            r={gaugeRadius}
                            fill="none"
                            stroke={
                              isSelectedTargetMars ? "#E07A5F" : "#00D9F5"
                            }
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={gaugeCircumference}
                            strokeDashoffset={gaugeStrokeDashoffset}
                            transform="rotate(-90 88 88)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="font-mono text-3xl font-bold text-[#F1F5F9] tabular-nums">
                            {selectedAsiScore.overall_asi.toFixed(1)}
                          </span>
                          <span className="font-mono text-[11px] text-[#94A3B8]">
                            / 100 ASI
                          </span>
                        </div>
                      </div>

                      <AsiRadarChart
                        dimensions={selectedAsiScore.dimensions}
                        weights={selectedAsiScore.weights}
                        isMars={isSelectedTargetMars}
                      />
                    </div>

                    <div className="flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-[#101F30]/90 p-6 backdrop-blur-md lg:col-span-7">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
                          <div>
                            <h4 className="text-lg font-bold text-[#F1F5F9]">
                              Desglose por dimensiones y pesos reales del
                              objetivo
                            </h4>
                            <p className="text-xs text-[#94A3B8]">
                              Ecuación:{" "}
                              <code className="font-mono text-[#00D9F5]">
                                overall_asi = sum(target_weight[d] *
                                dimension_score[d])
                              </code>
                            </p>
                          </div>
                          <span className="rounded-md border border-[#F5B82E]/40 bg-[#F5B82E]/10 px-2.5 py-1 font-mono text-xs text-[#F5B82E] tabular-nums">
                            Σ pesos ={" "}
                            {Object.values(selectedAsiScore.weights)
                              .reduce((acc, v) => acc + v, 0)
                              .toFixed(2)}
                          </span>
                        </div>

                        <div className="mt-5 space-y-3.5">
                          {DIMENSION_LABELS.map((dim) => {
                            const scoreVal =
                              selectedAsiScore.dimensions[dim.key];
                            const weightVal = selectedAsiScore.weights[dim.key];
                            const contribution = (scoreVal * weightVal).toFixed(
                              2
                            );
                            const isStrength = scoreVal >= 70;
                            return (
                              <div
                                key={dim.key}
                                className="rounded-xl border border-slate-800/90 bg-[#050B13]/75 p-3.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-start gap-2.5">
                                    <span className="mt-0.5 text-[#00D9F5]">
                                      <ScientificIcon
                                        concept={dim.concept}
                                        className="h-4 w-4"
                                      />
                                    </span>
                                    <div>
                                      <span className="text-sm font-bold text-[#F1F5F9]">
                                        {dim.label}
                                      </span>
                                      {isStrength && (
                                        <span className="ml-2 rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                                          Fortaleza (≥70)
                                        </span>
                                      )}
                                      <span className="mt-0.5 block text-[11px] text-[#94A3B8]">
                                        {dim.formulaNote}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-right font-mono text-xs tabular-nums">
                                    <span className="font-bold text-[#00D9F5]">
                                      {scoreVal.toFixed(2)} / 100
                                    </span>
                                    <span className="mx-1.5 text-[#94A3B8]">
                                      ×
                                    </span>
                                    <span className="rounded bg-[#F5B82E]/15 px-1.5 py-0.5 text-[#F5B82E]">
                                      Peso {(weightVal * 100).toFixed(0)}%
                                    </span>
                                    <span className="ml-2 text-[#94A3B8]">
                                      = {contribution} pts
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${Math.max(
                                        0,
                                        Math.min(100, scoreVal)
                                      )}%`,
                                      backgroundColor: isSelectedTargetMars
                                        ? "#E07A5F"
                                        : "#00D9F5",
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-6 grid gap-3 border-t border-slate-800 pt-5 text-xs sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-800 bg-[#050B13]/80 p-3.5">
                          <span className="font-mono text-[11px] font-bold uppercase text-[#F5B82E]">
                            Interpretación del resultado
                          </span>
                          <p className="mt-1 leading-relaxed text-[#94A3B8]">
                            {dataset.methodology.interpretation} Una puntuación
                            alta no garantiza la utilidad operativa de un sitio
                            ni equivale a una probabilidad de éxito de misión.
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-[#050B13]/80 p-3.5">
                          <span className="font-mono text-[11px] font-bold uppercase text-[#00D9F5]">
                            Limitaciones de los datos
                          </span>
                          <p className="mt-1 leading-relaxed text-[#94A3B8]">
                            {dataset.methodology.climate_limitations} Los
                            vectores de terreno, litología y subsuelo del
                            catálogo son supuestos de escenario ilustrativos
                            (priors).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ===============================================================
                  SUB-SECTION 8: EXPLORA LOS DESTINOS (CATÁLOGO PDS DINÁMICO)
              =============================================================== */}
              <div
                id="explora-los-destinos"
                className="mt-20 pt-12 border-t border-slate-800/80"
              >
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                  <div className="max-w-3xl">
                    <div className="flex items-center gap-3">
                      <BrandLogo brand="nasa-pds" size="sm" />
                      <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#F5B82E]">
                        OBJETIVOS EXTRATERRESTRES REALES
                      </span>
                    </div>
                    <h3 className="mt-3 text-3xl font-bold tracking-tight text-[#F1F5F9] sm:text-4xl">
                      Explora los destinos de referencia ({referenceList.length}
                      )
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-[#94A3B8]">
                      Cada objetivo extraterrestre del catálogo está vinculado a
                      archivos del{" "}
                      <strong className="text-[#F1F5F9]">
                        Planetary Data System (PDS)
                      </strong>{" "}
                      de la NASA y abre directamente el explorador filtrado por
                      ese escenario.
                    </p>
                  </div>

                  <div
                    role="group"
                    aria-label="Filtrar objetivos extraterrestres por cuerpo celeste"
                    className="flex rounded-xl border border-slate-800 bg-[#0A1624] p-1"
                  >
                    {[
                      {
                        id: "ALL" as const,
                        label: `Todos (${referenceList.length})`,
                      },
                      {
                        id: "Moon" as const,
                        label: `Luna (${
                          referenceList.filter((r) => r.body === "Moon").length
                        })`,
                      },
                      {
                        id: "Mars" as const,
                        label: `Marte (${
                          referenceList.filter((r) => r.body === "Mars").length
                        })`,
                      },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setDestinationFilter(tab.id)}
                        aria-pressed={destinationFilter === tab.id}
                        className={`min-h-10 rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${
                          destinationFilter === tab.id
                            ? "bg-[#00D9F5]/20 text-[#00D9F5]"
                            : "text-[#94A3B8] hover:text-[#F1F5F9]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDestinations.map((target) => {
                    const isMars = target.body === "Mars";
                    const media =
                      TARGET_MEDIA[target.id] ??
                      TARGET_MEDIA["shackleton-crater"];
                    const topAnalogSite = [...translatedSites].sort(
                      (a, b) =>
                        (b.scores[target.id]?.overall_asi ?? 0) -
                        (a.scores[target.id]?.overall_asi ?? 0)
                    )[0];
                    const topAnalogScore =
                      topAnalogSite?.scores[target.id]?.overall_asi;

                    return (
                      <article
                        key={target.id}
                        className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/90 bg-[#101F30]/90 backdrop-blur-md transition-colors hover:border-[#00D9F5]/50"
                      >
                        <div>
                          <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#050B13]">
                            <Image
                              src={media.image}
                              alt={media.alt}
                              width={640}
                              height={400}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                            />
                            <div className="absolute top-3 right-3 left-3 flex items-center justify-between gap-2">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-bold uppercase backdrop-blur-md ${
                                  isMars
                                    ? "border-[#E07A5F]/60 bg-[#050B13]/85 text-[#E07A5F]"
                                    : "border-[#00D9F5]/60 bg-[#050B13]/85 text-[#00D9F5]"
                                }`}
                              >
                                {isMars ? (
                                  <Orbit
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <Moon
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                  />
                                )}
                                <span>{isMars ? "Marte" : "Luna"}</span>
                              </span>

                              {target.instrument && (
                                <span className="rounded-full border border-slate-700/80 bg-[#050B13]/85 px-2.5 py-1 font-mono text-[10px] text-[#F1F5F9] backdrop-blur-md">
                                  {target.instrument}
                                </span>
                              )}
                            </div>
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#101F30] via-[#101F30]/70 to-transparent px-4 pt-8 pb-2">
                              <p className="font-mono text-[10px] text-[#94A3B8]">
                                Fuente imagen: {media.credit} ({media.nasaId})
                              </p>
                            </div>
                          </div>

                          <div className="p-5">
                            <h4 className="text-lg font-bold text-[#F1F5F9]">
                              {target.name}
                            </h4>
                            <p className="mt-2 text-xs leading-relaxed text-[#94A3B8]">
                              {target.context}
                            </p>

                            {target.mineralogy_summary && (
                              <p className="mt-2.5 rounded-lg border border-slate-800/90 bg-[#050B13]/60 p-2.5 text-[11px] leading-relaxed text-[#F1F5F9]/85">
                                <strong className="text-[#00D9F5]">
                                  Contexto mineralógico:
                                </strong>{" "}
                                {target.mineralogy_summary}
                              </p>
                            )}

                            <dl className="mt-4 grid grid-cols-2 gap-2 font-mono text-[11px] tabular-nums">
                              <div className="rounded-lg border border-slate-800/80 bg-[#050B13]/75 p-2">
                                <dt className="text-[10px] text-[#94A3B8]">
                                  TEMP. ESCENARIO
                                </dt>
                                <dd className="mt-0.5 font-bold text-[#F1F5F9]">
                                  {target.temperature_mean_c}°C (Δ
                                  {target.temperature_range_c}°C)
                                </dd>
                              </div>
                              <div className="rounded-lg border border-slate-800/80 bg-[#050B13]/75 p-2">
                                <dt className="text-[10px] text-[#94A3B8]">
                                  PENDIENTE / RUG.
                                </dt>
                                <dd className="mt-0.5 font-bold text-[#F1F5F9]">
                                  {target.terrain?.slope_deg ?? "—"}° · Rug.{" "}
                                  {target.terrain?.roughness ?? "—"}
                                </dd>
                              </div>
                              <div className="rounded-lg border border-slate-800/80 bg-[#050B13]/75 p-2">
                                <dt className="text-[10px] text-[#94A3B8]">
                                  GRAVEDAD / PRESIÓN
                                </dt>
                                <dd className="mt-0.5 font-bold text-[#F1F5F9]">
                                  {target.gravity_ms2 ?? "—"} m/s² ·{" "}
                                  {target.pressure_kpa ?? 0} kPa
                                </dd>
                              </div>
                              <div className="rounded-lg border border-slate-800/80 bg-[#050B13]/75 p-2">
                                <dt className="text-[10px] text-[#94A3B8]">
                                  MEJOR ANÁLOGO
                                </dt>
                                <dd className="mt-0.5 truncate font-bold text-[#F5B82E]">
                                  {topAnalogScore !== undefined
                                    ? `${topAnalogScore.toFixed(1)}% ASI`
                                    : "—"}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        </div>

                        <div className="border-t border-slate-800/90 bg-[#050B13]/60 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <a
                              href={target.source_url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex min-h-10 items-center gap-1 font-mono text-[11px] text-[#94A3B8] hover:text-[#00D9F5] hover:underline"
                            >
                              <span>Fuente NASA</span>
                              <ExternalLink
                                className="h-3 w-3"
                                aria-hidden="true"
                              />
                            </a>

                            <Link
                              href={`/explorer?target=${encodeURIComponent(
                                target.id
                              )}`}
                              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#00D9F5]/60 bg-[#00D9F5]/15 px-3.5 py-2 text-xs font-bold text-[#00D9F5] transition-colors hover:bg-[#00D9F5]/25"
                            >
                              <span>Explorar destino</span>
                              <ArrowUpRight
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </MissionChapter>

            {/* =================================================================
                CAPÍTULO 5 — ACCESO AL EXPLORADOR (UNA HERRAMIENTA PARA INVESTIGAR)
            ================================================================= */}
            <MissionChapter
              id="acceso-explorador"
              chapterNumber="05"
              chapterTitle="Acceso al explorador"
              eyebrow="Transición al Visor Geoespacial en Tiempo Real"
              headline="Una herramienta para investigar."
              lead="La cámara se aleja hacia la órbita alta para dar paso a la consola geoespacial real de TERR-ANALOG. Inspecciona sus 8 funciones implementadas o inicia directamente la exploración interactiva."
              rightSlot={
                <Link
                  href="/explorer"
                  className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[#00D9F5] bg-[#00D9F5] px-6 py-2.5 text-xs font-bold tracking-wider text-[#050B13] transition-transform hover:scale-[1.02]"
                >
                  <span>Iniciar exploración</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              }
            >
              <ExplorerTransition sites={translatedSites} />
            </MissionChapter>
          </main>
        )}
      </ScrollScene>

      {/* =====================================================================
          FOOTER & SCIENTIFIC ATTRIBUTION / NON-ENDORSEMENT NOTICE
      ===================================================================== */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#050B13]/95 py-12 text-xs text-[#94A3B8] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div className="max-w-2xl space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-[#F1F5F9]">
                TERR-ANALOG — Mission Briefing &amp; Planetary Analog Discovery
                Platform
              </span>
            </div>
            <p className="leading-relaxed">
              Proyecto independiente desarrollado para el{" "}
              <strong className="text-[#F1F5F9]">
                NASA Space Apps Challenge 2026
              </strong>
              . Utiliza datos e imágenes abiertas de NASA POWER, NASA Image and
              Video Library, NASA Planetary Data System (PDS) y Copernicus DEM
              GLO-90 / Open-Meteo. Los logotipos e insignias se emplean
              exclusivamente para atribución factual de fuentes abiertas; este
              proyecto no es un producto oficial de la NASA ni implica
              patrocinio, certificación o respaldo institucional de la agencia.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 font-mono text-xs">
            <Link href="/explorer" className="text-[#00D9F5] hover:underline">
              /explorer (Mapa 3D)
            </Link>
            <a
              href="https://github.com/FakeCxbas/nasa-space-apps-2026"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 hover:text-[#F1F5F9] hover:underline"
            >
              <BrandLogo brand="github" size="sm" showLabel={false} />
              <span>GitHub Repository</span>
            </a>
            <a
              href="https://power.larc.nasa.gov/"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-[#F1F5F9] hover:underline"
            >
              NASA POWER API
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
