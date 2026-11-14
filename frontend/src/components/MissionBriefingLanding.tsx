"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { AnalogDataset, DimensionScores } from "@/types/analog";
import { AsiRadarChart } from "@/components/AsiRadarChart";
import { MethodologyDialog } from "@/components/MethodologyDialog";
import { translateSite, translateTarget } from "@/lib/spanishTranslations";
import {
  ArrowDown,
  ArrowUpRight,
  CheckCircle2,
  Compass,
  Cpu,
  Database,
  Download,
  ExternalLink,
  Globe2,
  Menu,
  Moon,
  Orbit,
  Scale,
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
    earthAlt: "Vista satelital de NASA de campos volcánicos basálticos en Galápagos, Ecuador",
    characteristics: [
      {
        label: "Topografía",
        earthValue: "Pendiente DEM 4.89° · Relieve volcánico suave",
        planetaryValue: "Pendiente de escenario 5.0° en llanura de mare",
        sourceTag: "DEM Copernicus GLO-90 + Escenario PDS",
      },
      {
        label: "Geología",
        earthValue: "Coladas de basalto (1.0) y regolito/tefra (0.4)",
        planetaryValue: "Basalto de mare lunar (1.0) y regolito (0.8)",
        sourceTag: "Priors litológicos documentados",
      },
      {
        label: "Temperatura",
        earthValue: "Aire a 2 m: 21.8°C a 24.4°C (media 23.1°C)",
        planetaryValue: "Sombra térmica modelada en fosa: ~17°C (Δ2°C)",
        sourceTag: "NASA POWER API vs. LRO Diviner",
      },
      {
        label: "Recursos y condiciones ambientales",
        earthValue: "Precipitación 2.33 mm/día · Humedad 82.6%",
        planetaryValue: "Vacío anhidro (sequedad 1.0) · Sin atmósfera",
        sourceTag: "NASA POWER PRECTOTCORR / RH2M",
      },
      {
        label: "Características del subsuelo",
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
    earthAlt: "Rovers experimentales de la NASA operando sobre brechas y permafrost en el Cráter Haughton",
    characteristics: [
      {
        label: "Topografía",
        earthValue: "Pendiente DEM 2.86° (prior de escarpe 12°)",
        planetaryValue: "Taludes interiores empinados de ~20° y alta rugosidad",
        sourceTag: "DEM Copernicus GLO-90 + LRO LOLA",
      },
      {
        label: "Geología",
        earthValue: "Brechas de impacto (1.0) y regolito polar (0.8)",
        planetaryValue: "Regolito de tierras altas (1.0) e impacto (1.0)",
        sourceTag: "Priors litológicos documentados",
      },
      {
        label: "Temperatura",
        earthValue: "Aire ártico a 2 m: -19.2°C a -13.9°C",
        planetaryValue: "Trampa fría en sombra permanente: -183°C (Δ10°C)",
        sourceTag: "NASA POWER API vs. LRO Diviner",
      },
      {
        label: "Recursos y condiciones ambientales",
        earthValue: "Permafrost polar activo (1.0) · 0.44 mm/día precip.",
        planetaryValue: "Potencial de volátiles e hielo atrapado (0.95)",
        sourceTag: "NASA POWER + Escenario Artemis",
      },
      {
        label: "Características del subsuelo",
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
    earthAlt: "Imagen satelital ASTER de depósitos evaporíticos y cuencas hiperáridas en Atacama, Chile",
    characteristics: [
      {
        label: "Topografía",
        earthValue: "Pendiente DEM 3.75° · Planicie aluvial-evaporítica",
        planetaryValue: "Pendiente de escenario 6.0° en piso cratérico y delta",
        sourceTag: "DEM Copernicus GLO-90 + MRO HiRISE",
      },
      {
        label: "Geología",
        earthValue: "Sedimentos (0.8), evaporitas/sales (0.8) y regolito (0.75)",
        planetaryValue: "Sedimentos deltaicos (1.0), basalto (0.8) y carbonatos",
        sourceTag: "Priors litológicos + MRO CRISM",
      },
      {
        label: "Temperatura",
        earthValue: "Aire a 2 m: 10.6°C a 24.4°C (Δ13.8°C)",
        planetaryValue: "Superficie marciana: -60°C media (-95°C a -25°C, Δ70°C)",
        sourceTag: "NASA POWER API vs. Perseverance MEDA",
      },
      {
        label: "Recursos y condiciones ambientales",
        earthValue: "Hiperaridez extrema: 0.04 mm/día · Humedad 31.6%",
        planetaryValue: "Superficie seca actual (1.0) con historia acuosa (1.0)",
        sourceTag: "NASA POWER PRECTOTCORR",
      },
      {
        label: "Características del subsuelo",
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
    earthAlt: "Imagen orbital ASTER de coladas de lava basáltica oscura en Craters of the Moon",
    characteristics: [
      {
        label: "Topografía",
        earthValue: "Pendiente DEM 0.87° (prior local 6.0°) · Lava rugosa",
        planetaryValue: "Flanco volcánico de ~8.0° y alta rugosidad (0.8)",
        sourceTag: "DEM Copernicus GLO-90 + MGS MOLA",
      },
      {
        label: "Geología",
        earthValue: "Basalto cuaternario (1.0) y regolito volcánico (0.65)",
        planetaryValue: "Coladas basálticas (1.0) y regolito (0.7)",
        sourceTag: "Priors litológicos documentados",
      },
      {
        label: "Temperatura",
        earthValue: "Aire a 2 m: 1.9°C a 14.4°C (media 8.2°C)",
        planetaryValue: "Flanco marciano expuesto: -65°C media (Δ80°C)",
        sourceTag: "NASA POWER API vs. Escenario MOLA",
      },
      {
        label: "Recursos y condiciones ambientales",
        earthValue: "Precipitación 0.91 mm/día · Presión 83.2 kPa",
        planetaryValue: "Atmósfera tenue de CO₂ (~0.65 kPa) · Sequedad 1.0",
        sourceTag: "NASA POWER PS / PRECTOTCORR",
      },
      {
        label: "Características del subsuelo",
        earthValue: "Tubos de lava extensos (1.0) y refugio (0.85)",
        planetaryValue: "Canales de lava colapsados (1.0) y abrigo (0.9)",
        sourceTag: "Relevancia operativa subterránea",
      },
    ],
  },
];

const DIMENSION_LABELS: {
  key: keyof DimensionScores;
  label: string;
  formulaNote: string;
}[] = [
  {
    key: "topography",
    label: "Topografía y Rugosidad",
    formulaNote: "50% similitud de pendiente (escala 30°) + 50% similitud de rugosidad",
  },
  {
    key: "geology",
    label: "Geología y Litología",
    formulaNote: "Superposición difusa de Jaccard (Σ min / Σ max) en 5 litologías",
  },
  {
    key: "thermal",
    label: "Régimen Térmico",
    formulaNote: "60% temperatura media anual + 40% amplitud térmica (escala 100°C)",
  },
  {
    key: "hydrology_ice",
    label: "Sequedad, Hielo e Historia Acuosa",
    formulaNote: "40% aridez 1/(1+P) + 40% relevancia de hielo + 20% historia acuosa",
  },
  {
    key: "subsurface_ops",
    label: "Operaciones Subterráneas y Refugio",
    formulaNote: "70% relevancia de tubos de lava + 30% potencial de refugio",
  },
];

interface ExplorerHotspot {
  id: string;
  title: string;
  badge: string;
  summary: string;
  realImplementation: string;
  coordsPercent: { left: string; top: string };
}

const EXPLORER_HOTSPOTS: ExplorerHotspot[] = [
  {
    id: "interactive-maps",
    title: "1. Mapas interactivos",
    badge: "MapLibre GL 6 + Relieve 3D",
    summary:
      "Conmutador de mapas base entre Satélite (Esri World Imagery), NASA GIBS (VIIRS True Color) y Vector Oscuro (OpenFreeMap), con terreno 3D AWS Terrarium e inclinación de cámara.",
    realImplementation:
      "Implementado en AnalogMap.tsx con caché local de teselas mediante Service Worker (tile-cache-sw.js).",
    coordsPercent: { left: "54%", top: "46%" },
  },
  {
    id: "region-selection",
    title: "2. Selección de regiones",
    badge: "30 Sitios · 17 Países",
    summary:
      "Navegación por pestañas (Tierra, Luna, Marte), filtro rápido por país con foco en Ecuador y Sudamérica, búsqueda textual y directorio completo.",
    realImplementation:
      "Implementado en MissionControlApp.tsx y SiteDirectory.tsx con encuadre automático de cámara.",
    coordsPercent: { left: "34%", top: "14%" },
  },
  {
    id: "geo-probing",
    title: "3. Sondeo geográfico",
    badge: "API /api/evaluate",
    summary:
      "Permite hacer clic en cualquier coordenada de la Tierra para consultar en tiempo real su elevación, pendiente y climatología satelital.",
    realImplementation:
      "Implementado en src/app/api/evaluate/route.ts y src/lib/evaluateCoordinate.ts.",
    coordsPercent: { left: "68%", top: "30%" },
  },
  {
    id: "env-telemetry",
    title: "4. Datos ambientales",
    badge: "NASA POWER + Copernicus DEM",
    summary:
      "Muestra 7 parámetros climáticos de NASA POWER (T2M_MAX, T2M_MIN, precipitación, viento, humedad, irradiancia solar, presión) y muestreo DEM de 5 puntos.",
    realImplementation:
      "Precalculado en analogs.json (30/30 sitios con fuente nasa_power y open_meteo) y consultado en vivo.",
    coordsPercent: { left: "18%", top: "58%" },
  },
  {
    id: "side-by-side",
    title: "5. Comparación Tierra vs. Luna/Marte",
    badge: "Mesa en 3 Columnas",
    summary:
      "Expande el panel lateral en una mesa comparativa de 3 columnas: Sitio Terrestre, Motor ASI de 5 ejes y Sitio de Referencia Planetario con archivo PDS.",
    realImplementation:
      "Implementado en TelemetryDrawer.tsx y SideBySideComparison.tsx.",
    coordsPercent: { left: "22%", top: "34%" },
  },
  {
    id: "asi-results",
    title: "6. Resultados de similitud",
    badge: "ASI v0.2.0 + Límites Físicos",
    summary:
      "Presenta la puntuación ASI ponderada, el gráfico radar pentagonal, las fortalezas (≥ 70/100) y las diferencias físicas irreproducibles (gravedad, vacío, radiación).",
    realImplementation:
      "Generado por engine/asi_engine.py y representado en AsiRadarChart.tsx.",
    coordsPercent: { left: "16%", top: "78%" },
  },
  {
    id: "regional-prospecting",
    title: "7. Prospección regional",
    badge: "Grilla 3×3 y 4×4 en Vivo",
    summary:
      "Traza un rectángulo sobre el mapa para evaluar simultáneamente 9 o 16 sectores orbitales, generando un mapa de calor y ranking respecto al catálogo.",
    realImplementation:
      "Implementado en src/app/api/evaluate-region/route.ts y src/lib/evaluateRegion.ts.",
    coordsPercent: { left: "82%", top: "70%" },
  },
  {
    id: "data-export",
    title: "8. Exportación de datos",
    badge: "Markdown / JSON / QGIS GeoJSON",
    summary:
      "Descarga el Dossier científico de cada comparación en Markdown o JSON con trazabilidad de fuentes, o exporta la colección GeoJSON EPSG:4326 para QGIS.",
    realImplementation:
      "Implementado en src/lib/dossier.ts y verificado por tests/dossier.test.mjs.",
    coordsPercent: { left: "84%", top: "14%" },
  },
];

export function MissionBriefingLanding({ dataset }: MissionBriefingLandingProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeChallengeIdx, setActiveChallengeIdx] = useState<number>(0);
  const [activeBodyTab, setActiveBodyTab] = useState<"Moon" | "Mars">("Moon");
  const [activeExampleId, setActiveExampleId] = useState<string>("moon-lava-tubes");
  const [activePipelineStep, setActivePipelineStep] = useState<number>(0);

  // Real ASI inspection state (strictly reading precalculated dataset values)
  const [selectedAsiSiteId, setSelectedAsiSiteId] = useState<string>(
    dataset.sites[0]?.id ?? "galapagos-lava-tubes"
  );
  const [selectedAsiTargetId, setSelectedAsiTargetId] = useState<string>(
    dataset.sites[0]?.best_target ?? "mare-tranquillitatis"
  );

  // Destinations filter ("ALL" | "Moon" | "Mars")
  const [destinationFilter, setDestinationFilter] = useState<"ALL" | "Moon" | "Mars">("ALL");

  // Explorer preview hotspot state
  const [activeHotspotId, setActiveHotspotId] = useState<string>(EXPLORER_HOTSPOTS[0].id);

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
      translatedSites.find((s) => s.id === activeComparativeExample.earthSiteId) ??
      translatedSites[0],
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
      translatedSites.find((s) => s.id === selectedAsiSiteId) ?? translatedSites[0],
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

  const activeHotspot = useMemo(
    () =>
      EXPLORER_HOTSPOTS.find((h) => h.id === activeHotspotId) ??
      EXPLORER_HOTSPOTS[0],
    [activeHotspotId]
  );

  const challengeCards = useMemo(
    () => [
      {
        id: "where-simulate",
        question: "¿Dónde podemos simular las condiciones de una región lunar o marciana?",
        tag: "Cartografía de Análogos",
        shortAnswer:
          "En entornos terrestres extremos cuyos procesos geológicos, topográficos o climáticos comparten rasgos acotados con regiones específicas de la Luna o Marte.",
        detail:
          "Ningún sitio terrestre replica otro planeta por completo, pero regiones concretas permiten aislar variables de misión: los tubos de lava basáltica de Galápagos (Ecuador), Timanfaya (España) o Craters of the Moon (EE. UU.) reproducen geometrías de cavidades volcánicas subterráneas; los salares e hiperdesiertos de Atacama (Chile) y Uyuni (Bolivia) preservan evaporitas y costras salinas comparables a antiguos paleolagos marcianos; y el permafrost polar del Cráter Haughton (Canadá) o de alta montaña en el Chimborazo y Antisana (Ecuador) permite ensayar movilidad y perforación en suelos congelados.",
        metricLabel: "Cobertura actual del catálogo",
        metricValue: `${translatedSites.length} sitios documentados en ${new Set(translatedSites.map((s) => s.country)).size} países y regiones`,
      },
      {
        id: "what-makes-useful",
        question: "¿Qué características hacen útil a un análogo terrestre?",
        tag: "Evaluación Multidimensional",
        shortAnswer:
          "La correspondencia medible o documentada entre las propiedades del sitio terrestre y los requisitos operativos de la misión extraterrestre.",
        detail:
          "La utilidad de un análogo depende de qué subsistema se desea poner a prueba. En TERR-ANALOG evaluamos cinco ejes complementarios: Topografía (pendiente y rugosidad para locomoción de rovers y aterrizaje), Geología (presencia de basalto, regolito, sedimentos, evaporitas o estructuras de impacto), Régimen Térmico (temperatura media y oscilación térmica), Hidrología y Criósfera (aridez extrema, presencia de hielo/permafrost e historia acuosa) y Operaciones Subterráneas (tubos de lava y potencial de refugio natural). Cada destino pondera estos ejes según su prioridad científica.",
        metricLabel: "Dimensiones del modelo ASI",
        metricValue: `${dataset.methodology.dimensions?.length ?? 5} ejes ponderados por objetivo (${Object.keys(dataset.references).length} escenarios PDS)`,
      },
      {
        id: "what-differences",
        question: "¿Cuáles son las diferencias que ningún entorno terrestre puede reproducir?",
        tag: "Ruptura de Analogía Física",
        shortAnswer:
          "La gravedad reducida, el vacío lunar o la tenue atmósfera de CO₂ marciana, la radiación cósmica ionizante y la ausencia de biosfera activa.",
        detail:
          "Comprender dónde falla una analogía es tan importante como identificar dónde funciona. En la Tierra la aceleración gravitatoria es de 9.81 m/s² (frente a 1.62 m/s² en la Luna y 3.71 m/s² en Marte), lo que altera la mecánica de suelos, el esfuerzo de motores y la estabilidad estructural. Además, la atmósfera terrestre (101.3 kPa, rica en N₂/O₂ y humedad) y la magnetosfera nos protegen de los rayos cósmicos galácticos (GCR) y micrometeoritos, mientras que la vida microbiana y el agua líquida meteorizan las rocas terrestres de forma distinta al regolito lunar o marciano.",
        metricLabel: "Constantes físicas contrastadas",
        metricValue: "Tierra 9.81 m/s² (101.3 kPa) vs. Luna 1.62 m/s² (0 kPa) y Marte 3.71 m/s² (0.65 kPa)",
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
          `Copernicus DEM GLO-90 (${dataset.methodology.dem_source_counts?.open_meteo ?? dataset.sites.length}/${dataset.sites.length} muestreos de 5 puntos)`,
          "NASA PDS: LRO LOLA/Diviner/LROC, MRO CRISM/HiRISE, MGS MOLA y Perseverance MEDA",
          "Capas cartográficas: NASA GIBS VIIRS True Color, Esri World Imagery y AWS Terrarium 3D",
        ],
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
      },
    ],
    [dataset.methodology, dataset.sites.length]
  );

  // SVG Circular Gauge helper for Section 7 (strictly visual representation of precalculated ASI)
  const gaugeRadius = 68;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const currentAsiValue = selectedAsiScore?.overall_asi ?? 0;
  const gaugeStrokeDashoffset =
    gaugeCircumference - (Math.max(0, Math.min(100, currentAsiValue)) / 100) * gaugeCircumference;
  const isSelectedTargetMars = selectedAsiTarget?.body === "Mars";

  return (
    <div className="min-h-screen bg-[#050B13] text-[#F1F5F9] selection:bg-[#00D9F5]/30 selection:text-[#F1F5F9]">
      {/* Accessibility Skip Link */}
      <a
        href="#hero-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#00D9F5] focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-[#050B13]"
      >
        Saltar al contenido principal de Mission Briefing
      </a>

      {/* =====================================================================
          TOP NAVIGATION BAR (Inspired by reference frame + Aerospace HUD)
      ===================================================================== */}
      <header className="sticky top-0 z-40 border-b border-[#00D9F5]/15 bg-[#050B13]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Left Pill Links (Desktop) */}
          <nav
            aria-label="Secciones de la misión"
            className="hidden items-center gap-2 lg:flex"
          >
            <a
              href="#el-desafio"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-800/90 bg-[#0A1624]/90 px-4 py-1.5 text-xs font-medium text-[#F1F5F9] transition-colors hover:border-[#00D9F5]/50 hover:text-[#00D9F5]"
            >
              <span>El Desafío</span>
              <span className="font-mono text-[#00D9F5]" aria-hidden="true">
                +
              </span>
            </a>
            <a
              href="#que-es-un-analogo"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-800/90 bg-[#0A1624]/90 px-4 py-1.5 text-xs font-medium text-[#F1F5F9] transition-colors hover:border-[#00D9F5]/50 hover:text-[#00D9F5]"
            >
              <span>Análogos</span>
              <span className="font-mono text-[#00D9F5]" aria-hidden="true">
                +
              </span>
            </a>
            <a
              href="#similitud-asi"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-800/90 bg-[#0A1624]/90 px-4 py-1.5 text-xs font-medium text-[#F1F5F9] transition-colors hover:border-[#00D9F5]/50 hover:text-[#00D9F5]"
            >
              <span>Índice ASI</span>
              <span className="font-mono text-[#00D9F5]" aria-hidden="true">
                +
              </span>
            </a>
            <a
              href="#explora-los-destinos"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-800/90 bg-[#0A1624]/90 px-4 py-1.5 text-xs font-medium text-[#F1F5F9] transition-colors hover:border-[#00D9F5]/50 hover:text-[#00D9F5]"
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
            className="flex items-center gap-2.5 text-lg font-bold tracking-[0.12em] text-[#F1F5F9] sm:text-xl"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#00D9F5]/40 bg-[#0A1624] text-[#00D9F5]">
              <Compass className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>
              TERR<span className="font-light text-[#00D9F5]">-ANALOG</span>
            </span>
          </Link>

          {/* Right Pill Actions */}
          <div className="flex items-center gap-2.5">
            <a
              href="#herramienta-investigacion"
              className="hidden min-h-10 items-center gap-2 rounded-full border border-slate-800/90 bg-[#0A1624]/90 px-4 py-1.5 font-mono text-xs text-[#94A3B8] transition-colors hover:border-slate-700 hover:text-[#F1F5F9] sm:inline-flex"
            >
              <span>Vista Previa HUD</span>
            </a>

            <Link
              href="/explorer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#00D9F5]/60 bg-gradient-to-r from-[#00D9F5]/25 to-[#0A1624] px-4 py-2 text-xs font-bold tracking-wider text-[#F1F5F9] shadow-[0_0_24px_rgba(0,217,245,0.25)] transition-all hover:border-[#00D9F5] hover:bg-[#00D9F5]/30 sm:px-5"
            >
              <span>Iniciar Exploración</span>
              <ArrowUpRight className="h-4 w-4 text-[#00D9F5]" aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-mission-nav"
              aria-label={
                mobileMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"
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
            aria-label="Navegación móvil de la misión"
            className="border-t border-slate-800/80 bg-[#0A1624] px-4 py-4 lg:hidden"
          >
            <div className="grid gap-2">
              {[
                { href: "#el-desafio", label: "1. El Desafío" },
                { href: "#que-es-un-analogo", label: "2. ¿Qué es un Análogo Terrestre?" },
                { href: "#nuestra-solucion", label: "3. Nuestra Solución (4 Etapas)" },
                { href: "#similitud-asi", label: "4. Cómo Interpretamos la Similitud (ASI)" },
                { href: "#explora-los-destinos", label: "5. Explora los Destinos (Luna y Marte)" },
                { href: "#herramienta-investigacion", label: "6. Una Herramienta para Investigar" },
                { href: "#comienza-tu-mision", label: "7. Comienza tu Misión" },
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

      <main id="hero-main-content">
        {/* =====================================================================
            3. SECCIÓN HERO — THE NEXT FRONTIER
        ===================================================================== */}
        <section
          aria-labelledby="hero-title"
          className="relative px-3 pt-3 pb-10 sm:px-6 sm:pt-5 lg:px-8"
        >
          <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-between overflow-hidden rounded-[28px] border border-[#00D9F5]/25 bg-gradient-to-b from-[#050B13] via-[#071220] to-[#0A1624] px-4 pt-8 pb-6 shadow-[0_0_90px_rgba(0,217,245,0.12)] sm:px-10 sm:pt-12 sm:pb-8">
            {/* Subtle Starfield & Orbital SVG Geometry */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full opacity-55"
              viewBox="0 0 1440 900"
              fill="none"
              aria-hidden="true"
            >
              <defs>
                <radialGradient id="earthAtmosphereGlow" cx="50%" cy="88%" r="52%">
                  <stop offset="0%" stopColor="#00D9F5" stopOpacity="0.34" />
                  <stop offset="45%" stopColor="#0A1624" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#050B13" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="orbitStrokeCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00D9F5" stopOpacity="0.05" />
                  <stop offset="50%" stopColor="#00D9F5" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#F5B82E" stopOpacity="0.08" />
                </linearGradient>
              </defs>
              <rect width="1440" height="900" fill="url(#earthAtmosphereGlow)" />
              {/* Orbital trajectory curves */}
              <ellipse
                cx="720"
                cy="860"
                rx="640"
                ry="380"
                stroke="url(#orbitStrokeCyan)"
                strokeWidth="1.2"
                strokeDasharray="6 8"
              />
              <ellipse
                cx="720"
                cy="890"
                rx="500"
                ry="295"
                stroke="rgba(0, 217, 245, 0.22)"
                strokeWidth="1"
              />
              <ellipse
                cx="720"
                cy="920"
                rx="760"
                ry="470"
                stroke="rgba(245, 184, 46, 0.16)"
                strokeWidth="1"
                strokeDasharray="3 9"
              />
              {/* Subtle trajectory vectors */}
              <line
                x1="1120"
                y1="210"
                x2="1195"
                y2="135"
                stroke="rgba(0, 217, 245, 0.45)"
                strokeWidth="1.5"
              />
              <line
                x1="240"
                y1="300"
                x2="185"
                y2="245"
                stroke="rgba(245, 184, 46, 0.35)"
                strokeWidth="1.2"
              />
            </svg>

            {/* Top HUD Decorative Reference Bar (Explicitly labeled as decorative framing) */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/70 pb-3 font-mono text-[11px] text-[#94A3B8] tabular-nums">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-[#00D9F5]" />
                <span>MISSION BRIEFING // TERR-ANALOG</span>
              </div>
              <span className="rounded border border-slate-800 bg-[#0A1624]/80 px-2.5 py-0.5 text-[10px] text-[#94A3B8]">
                MARCO DECORATIVO HUD: WGS84 00°00&apos;N · SELENE 89°54&apos;S · AREO 18°23&apos;N (NO ES TELEMETRÍA EN VIVO)
              </span>
            </div>

            {/* Hero Central Copy */}
            <div className="relative z-10 mx-auto my-auto flex max-w-4xl flex-col items-center pt-8 pb-6 text-center sm:pt-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#00D9F5]/40 bg-[#101F30]/85 px-4 py-1.5 font-mono text-xs font-semibold tracking-[0.18em] text-[#00D9F5]">
                <span>NASA SPACE APPS CHALLENGE 2026</span>
              </div>

              <h1
                id="hero-title"
                className="mt-5 text-4xl font-bold tracking-[0.16em] text-[#F1F5F9] sm:text-6xl md:text-7xl"
              >
                TERR<span className="font-light text-[#00D9F5]">-ANALOG</span>
              </h1>

              <p className="mt-4 text-lg font-semibold text-[#F5B82E] sm:text-2xl">
                La Tierra como laboratorio para explorar otros mundos.
              </p>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#94A3B8] sm:text-base">
                Explora qué regiones de nuestro planeta comparten características con
                entornos de la Luna y Marte. Compara datos científicos, descubre
                posibles análogos terrestres y comprende sus limitaciones.
              </p>

              {/* Hero CTA Buttons (Styled after the user's reference pill CTA + Secondary scroll CTA) */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/explorer"
                  className="group inline-flex min-h-12 items-center gap-3 rounded-full border border-[#00D9F5]/60 bg-[#0A1624]/95 py-1.5 pl-6 pr-2 text-xs font-bold tracking-[0.12em] text-[#F1F5F9] shadow-[0_0_35px_rgba(0,217,245,0.28)] transition-all hover:border-[#00D9F5] hover:bg-[#101F30] sm:text-sm"
                >
                  <span>INICIAR EXPLORACIÓN</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00D9F5] text-[#050B13] shadow-[0_0_16px_rgba(0,217,245,0.7)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
                  </span>
                </Link>

                <a
                  href="#el-desafio"
                  className="inline-flex min-h-12 items-center gap-2.5 rounded-full border border-slate-700/90 bg-[#101F30]/75 px-6 py-3 text-xs font-bold tracking-[0.12em] text-[#F1F5F9] transition-colors hover:border-[#F5B82E]/70 hover:text-[#F5B82E] sm:text-sm"
                >
                  <span>DESCUBRIR LA MISIÓN</span>
                  <ArrowDown className="h-4 w-4 text-[#F5B82E]" aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Visual Planetary Stage: Rising Earth Horizon + Lunar & Martian Orbital Nodes */}
            <div className="relative z-10 mt-2">
              <div className="relative mx-auto flex max-w-5xl items-end justify-center">
                {/* Left Orbital Node: The Moon (Real NASA Artemis I imagery) */}
                <div className="hidden flex-col items-start gap-2 rounded-2xl border border-slate-800/90 bg-[#0A1624]/90 p-3 backdrop-blur-md md:flex">
                  <div className="flex items-center gap-2.5">
                    <Image
                      src="/nasa/moon-orb.jpg"
                      alt="La Luna fotografiada durante la misión Artemis I de la NASA"
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full border border-slate-600/60 object-cover"
                    />
                    <div>
                      <span className="block font-mono text-[10px] uppercase tracking-wider text-[#00D9F5]">
                        DESTINO // LUNA
                      </span>
                      <span className="text-xs font-bold text-[#F1F5F9]">
                        3 Escenarios Artemis / LRO
                      </span>
                      <span className="block font-mono text-[10px] text-[#94A3B8] tabular-nums">
                        g = 1.62 m/s² · Vacío (0 kPa)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Central Rising Earth Horizon (Real NASA Blue Marble GSFC_20171208_Archive_e001386) */}
                <div className="relative mx-auto h-[210px] w-full max-w-[680px] overflow-hidden sm:h-[260px]">
                  <div
                    className="mb-orbit-glow pointer-events-none absolute -top-4 left-1/2 h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-[#00D9F5]/20 blur-3xl sm:h-[660px] sm:w-[660px]"
                    aria-hidden="true"
                  />
                  <div className="relative mx-auto mt-6 h-[520px] w-[520px] overflow-hidden rounded-full border-t-2 border-[#00D9F5]/70 shadow-[0_-18px_70px_rgba(0,217,245,0.42)] sm:h-[640px] sm:w-[640px]">
                    <Image
                      src="/nasa/earth-blue-marble.jpg"
                      alt="Imagen oficial Blue Marble de la Tierra capturada por el satélite Suomi NPP de la NASA"
                      width={640}
                      height={640}
                      priority
                      className="h-full w-full scale-105 object-cover object-top"
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050B13] via-transparent to-[#00D9F5]/10"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                {/* Right Orbital Node: Mars (Real NASA/JPL Global Mars View PIA00407) */}
                <div className="hidden flex-col items-start gap-2 rounded-2xl border border-slate-800/90 bg-[#0A1624]/90 p-3 backdrop-blur-md md:flex">
                  <div className="flex items-center gap-2.5">
                    <Image
                      src="/nasa/mars-orb.jpg"
                      alt="Vista global de Marte generada por los orbitadores Viking de NASA/JPL"
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full border border-[#E07A5F]/60 object-cover"
                    />
                    <div>
                      <span className="block font-mono text-[10px] uppercase tracking-wider text-[#E07A5F]">
                        DESTINO // MARTE
                      </span>
                      <span className="text-xs font-bold text-[#F1F5F9]">
                        3 Escenarios MRO / Perseverance
                      </span>
                      <span className="block font-mono text-[10px] text-[#94A3B8] tabular-nums">
                        g = 3.71 m/s² · CO₂ (~0.65 kPa)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Hero Status & Scroll Indicator */}
              <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-slate-800/80 pt-4 text-xs text-[#94A3B8] sm:flex-row">
                <p className="font-mono text-[11px]">
                  Imágenes de dominio público: NASA GSFC Blue Marble (
                  <code className="text-[#F1F5F9]">GSFC_20171208_Archive_e001386</code>),
                  Artemis I (<code className="text-[#F1F5F9]">art002e009006</code>) y
                  NASA/JPL (<code className="text-[#F1F5F9]">PIA00407</code>).
                </p>

                <a
                  href="#el-desafio"
                  className="inline-flex items-center gap-2 font-mono text-xs text-[#00D9F5] hover:underline"
                >
                  <span>Desplazar para iniciar el briefing</span>
                  <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            4. SECCIÓN — EL DESAFÍO
        ===================================================================== */}
        <section
          id="el-desafio"
          aria-labelledby="challenge-heading"
          className="mb-scroll-reveal mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
        >
          <div className="flex flex-col justify-between gap-6 border-b border-slate-800/80 pb-8 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#00D9F5]">
                MISIÓN // CONTEXTO CIENTÍFICO DEL RETO
              </span>
              <h2
                id="challenge-heading"
                className="mt-2 text-3xl font-bold tracking-tight text-[#F1F5F9] sm:text-4xl"
              >
                Antes de llegar a otros mundos, debemos aprender aquí.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#94A3B8]">
                Las futuras misiones lunares y marcianas requieren probar hábitats,
                rovers, sistemas de extracción de recursos y procedimientos operativos en
                condiciones terrestres representativas antes de volar al espacio profundo.
                El desafío consiste en utilizar datos abiertos para identificar qué
                regiones de la Tierra comparten características relevantes con sitios de
                interés en la Luna y Marte, evaluando con rigor tanto sus similitudes como
                sus limitaciones.
              </p>
            </div>

            <div className="shrink-0">
              <a
                href="https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#F5B82E]/50 bg-[#101F30] px-4 py-2.5 text-xs font-bold text-[#F5B82E] transition-colors hover:border-[#F5B82E] hover:bg-[#F5B82E]/15"
              >
                <span>Ver enunciado oficial en NASA Space Apps</span>
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* 3 Interactive Challenge Question Cards */}
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {challengeCards.map((card, index) => {
              const isSelected = activeChallengeIdx === index;
              return (
                <article
                  key={card.id}
                  className={`flex flex-col justify-between rounded-2xl border p-6 transition-all ${
                    isSelected
                      ? "border-[#00D9F5] bg-[#101F30] shadow-[0_0_30px_rgba(0,217,245,0.14)]"
                      : "border-slate-800/90 bg-[#0A1624]/90 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md border border-[#00D9F5]/30 bg-[#050B13]/80 px-2.5 py-1 font-mono text-[11px] font-semibold text-[#00D9F5]">
                        {card.tag}
                      </span>
                      <span className="font-mono text-xs text-[#94A3B8] tabular-nums">
                        PREGUNTA {index + 1}/3
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-bold leading-snug text-[#F1F5F9]">
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
                      className={`mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                        isSelected
                          ? "border-[#00D9F5]/60 bg-[#00D9F5]/15 text-[#00D9F5]"
                          : "border-slate-800 bg-[#050B13]/70 text-[#94A3B8] hover:text-[#F1F5F9]"
                      }`}
                    >
                      <span>
                        {isSelected ? "Pregunta activa en foco" : "Enfocar esta dimensión"}
                      </span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* =====================================================================
            5. SECCIÓN — ¿QUÉ ES UN ANÁLOGO TERRESTRE?
        ===================================================================== */}
        <section
          id="que-es-un-analogo"
          aria-labelledby="analog-definition-heading"
          className="mb-scroll-reveal border-y border-slate-800/80 bg-[#0A1624]/70 py-16 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#F5B82E]">
                  COMPARACIÓN // TIERRA VS. LUNA Y MARTE
                </span>
                <h2
                  id="analog-definition-heading"
                  className="mt-2 text-3xl font-bold tracking-tight text-[#F1F5F9] sm:text-4xl"
                >
                  ¿Qué es un análogo terrestre?
                </h2>
                <p className="mt-4 text-base leading-relaxed text-[#F1F5F9]/90">
                  Un análogo terrestre es un lugar de la Tierra que comparte determinadas
                  características con un entorno extraterrestre y puede ayudar a estudiar
                  problemas específicos de exploración.
                </p>
              </div>

              {/* Body Switcher (Moon vs Mars examples) following accessible tab pattern */}
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <span className="font-mono text-[11px] text-[#94A3B8]">
                  Alternar ejemplos por cuerpo celeste:
                </span>
                <div
                  role="tablist"
                  aria-label="Seleccionar cuerpo celeste para ejemplos comparativos"
                  className="flex rounded-xl border border-slate-800 bg-[#050B13] p-1"
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
                    <Moon className="h-4 w-4 text-[#00D9F5]" aria-hidden="true" />
                    <span>Ejemplos Lunares (Tierra ⇄ Luna)</span>
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
                    <Orbit className="h-4 w-4 text-[#E07A5F]" aria-hidden="true" />
                    <span>Ejemplos Marcianos (Tierra ⇄ Marte)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Scenario selector pills within active planetary body */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-[#94A3B8]">Escenario documental:</span>
              {COMPARATIVE_EXAMPLES.filter((ex) => ex.body === activeBodyTab).map((ex) => {
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
                activeBodyTab === "Moon" ? "tab-examples-moon" : "tab-examples-mars"
              }
              className="mt-8 grid gap-6 lg:grid-cols-2"
            >
              {/* PANEL 1: TIERRA */}
              <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#00D9F5]/35 bg-[#101F30]/90 shadow-xl">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800/90 bg-[#050B13]/80 px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Globe2 className="h-4 w-4 text-[#00D9F5]" aria-hidden="true" />
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
                        Fuente imagen: {activeComparativeExample.earthCredit} (ID:{" "}
                        {activeComparativeExample.earthNasaId})
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
                      Coordenadas: {activeComparativeSite.latitude.toFixed(2)}°,{" "}
                      {activeComparativeSite.longitude.toFixed(2)}°
                    </span>
                    <Link
                      href={`/explorer?site=${encodeURIComponent(activeComparativeSite.id)}`}
                      className="font-semibold text-[#00D9F5] hover:underline"
                    >
                      Inspeccionar sitio en el mapa 3D →
                    </Link>
                  </div>
                </div>
              </div>

              {/* PANEL 2: LUNA / MARTE */}
              <div
                className={`flex flex-col justify-between overflow-hidden rounded-2xl border bg-[#101F30]/90 shadow-xl ${
                  activeBodyTab === "Mars"
                    ? "border-[#E07A5F]/40"
                    : "border-[#F5B82E]/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800/90 bg-[#050B13]/80 px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {activeBodyTab === "Mars" ? (
                        <Orbit className="h-4 w-4 text-[#E07A5F]" aria-hidden="true" />
                      ) : (
                        <Moon className="h-4 w-4 text-[#F5B82E]" aria-hidden="true" />
                      )}
                      <span
                        className={`font-mono text-xs font-bold uppercase tracking-wider ${
                          activeBodyTab === "Mars" ? "text-[#E07A5F]" : "text-[#F5B82E]"
                        }`}
                      >
                        PANEL // {activeComparativeExample.bodyLabel}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-[#94A3B8] tabular-nums">
                      Instrumentos: {activeComparativeTarget?.instrument ?? "NASA PDS"}
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
                      Gravedad: {activeComparativeTarget?.gravity_ms2 ?? "—"} m/s² · Presión:{" "}
                      {activeComparativeTarget?.pressure_kpa ?? 0} kPa
                    </span>
                    <Link
                      href={`/explorer?target=${encodeURIComponent(activeComparativeExample.targetId)}`}
                      className="font-semibold text-[#F5B82E] hover:underline"
                    >
                      Abrir destino en el explorador →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* 5 Characteristics Comparison Table (Explicitly distinguishing measured vs scenario priors) */}
            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800/90 bg-[#101F30]/75">
              <div className="border-b border-slate-800/90 bg-[#050B13]/80 px-5 py-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#F1F5F9]">
                    Características comparadas en este escenario (Tierra vs.{" "}
                    {activeComparativeExample.bodyLabel})
                  </h3>
                  <span className="font-mono text-[11px] text-[#94A3B8]">
                    Nota: el sistema combina telemetría satelital (NASA POWER / DEM) con priors
                    documentados; no todas las variables son mediciones directas in situ.
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-800/80">
                {activeComparativeExample.characteristics.map((row) => (
                  <div
                    key={row.label}
                    className="grid gap-3 px-5 py-3.5 text-xs sm:grid-cols-12 sm:items-center"
                  >
                    <div className="font-bold text-[#00D9F5] sm:col-span-3">
                      {row.label}
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
              className="mt-8 rounded-2xl border border-[#F5B82E]/60 bg-gradient-to-r from-[#F5B82E]/15 via-[#101F30] to-[#101F30] p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#F5B82E]/60 bg-[#F5B82E]/20 text-[#F5B82E]">
                    <ShieldAlert className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#F5B82E]">
                      ADVERTENCIA CIENTÍFICA FUNDAMENTAL
                    </span>
                    <h3 className="mt-1 text-xl font-bold text-[#F1F5F9]">
                      Similitud no significa equivalencia.
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#F1F5F9]/90">
                      Los análogos terrestres no son reproducciones exactas de la Luna ni de
                      Marte. Incluso cuando la topografía o la litología muestran alta
                      similitud de escenario, existen barreras físicas irreproducibles a cielo
                      abierto en la Tierra que todo diseño de misión debe compensar por
                      separado:
                    </p>
                  </div>
                </div>

                <div className="grid shrink-0 grid-cols-2 gap-2.5 font-mono text-xs tabular-nums sm:grid-cols-4 md:w-auto">
                  <div className="rounded-xl border border-slate-800 bg-[#050B13]/85 p-3">
                    <span className="block text-[10px] text-[#94A3B8]">GRAVEDAD</span>
                    <span className="mt-1 block font-bold text-[#F1F5F9]">9.81 m/s²</span>
                    <span className="mt-0.5 block text-[10px] text-[#F5B82E]">
                      vs. 1.62 / 3.71 m/s²
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-[#050B13]/85 p-3">
                    <span className="block text-[10px] text-[#94A3B8]">ATMÓSFERA</span>
                    <span className="mt-1 block font-bold text-[#F1F5F9]">101.3 kPa</span>
                    <span className="mt-0.5 block text-[10px] text-[#F5B82E]">
                      vs. 0 / 0.65 kPa
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-[#050B13]/85 p-3">
                    <span className="block text-[10px] text-[#94A3B8]">RADIACIÓN</span>
                    <span className="mt-1 block font-bold text-[#F1F5F9]">Escudo Mag.</span>
                    <span className="mt-0.5 block text-[10px] text-[#F5B82E]">
                      vs. GCR / SPE directos
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-[#050B13]/85 p-3">
                    <span className="block text-[10px] text-[#94A3B8]">INTEMPERISMO</span>
                    <span className="mt-1 block font-bold text-[#F1F5F9]">H₂O + Biota</span>
                    <span className="mt-0.5 block text-[10px] text-[#F5B82E]">
                      vs. Vacío / Oxidación
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            6. SECCIÓN — NUESTRA SOLUCIÓN (DIAGRAMA DE 4 ETAPAS)
        ===================================================================== */}
        <section
          id="nuestra-solucion"
          aria-labelledby="solution-heading"
          className="mb-scroll-reveal mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
        >
          <div className="max-w-3xl">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#00D9F5]">
              ARQUITECTURA DEL SISTEMA // FLUJO REAL DE DATOS
            </span>
            <h2
              id="solution-heading"
              className="mt-2 text-3xl font-bold tracking-tight text-[#F1F5F9] sm:text-4xl"
            >
              De los datos terrestres a la exploración planetaria.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#94A3B8]">
              TERR-ANALOG integra fuentes satelitales abiertas y perfiles planetarios
              documentados en una tubería reproducible de cuatro etapas que conecta el
              motor científico en Python (<code className="font-mono text-[#00D9F5]">engine/asi_engine.py</code>)
              con el explorador geoespacial en Next.js.
            </p>
          </div>

          {/* 4-Stage Interactive Flow Diagram */}
          <div className="relative mt-10">
            {/* Desktop connecting line */}
            <div
              className="pointer-events-none absolute top-12 right-12 left-12 hidden h-0.5 bg-gradient-to-r from-[#00D9F5]/60 via-[#F5B82E]/60 to-[#00D9F5]/60 lg:block"
              aria-hidden="true"
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {pipelineSteps.map((item, idx) => {
                const active = activePipelineStep === idx;
                const icons = [Database, Cpu, Scale, Globe2];
                const StepIcon = icons[idx] ?? Database;
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setActivePipelineStep(idx)}
                    aria-pressed={active}
                    className={`group relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all ${
                      active
                        ? "border-[#00D9F5] bg-[#101F30] shadow-[0_0_28px_rgba(0,217,245,0.16)]"
                        : "border-slate-800/90 bg-[#0A1624]/90 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`flex h-11 w-11 items-center justify-center rounded-xl border font-mono text-sm font-bold ${
                            active
                              ? "border-[#00D9F5] bg-[#00D9F5]/20 text-[#00D9F5]"
                              : "border-slate-700 bg-[#050B13] text-[#94A3B8]"
                          }`}
                        >
                          <StepIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="font-mono text-[11px] font-bold text-[#F5B82E]">
                          0{idx + 1}
                        </span>
                      </div>

                      <span className="mt-4 block font-mono text-[10px] uppercase tracking-wider text-[#00D9F5]">
                        {item.code}
                      </span>
                      <h3 className="mt-1 text-base font-bold text-[#F1F5F9]">
                        {item.step}
                      </h3>
                      <p className="mt-1.5 text-xs font-medium text-[#94A3B8]">
                        {item.title}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 font-mono text-[11px]">
                      <span className={active ? "text-[#00D9F5]" : "text-[#94A3B8]"}>
                        {active ? "Etapa seleccionada" : "Ver detalle técnico"}
                      </span>
                      <span className="text-[#00D9F5]">→</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Pipeline Step Detail Console */}
            <div className="mt-6 rounded-2xl border border-[#00D9F5]/30 bg-[#101F30]/90 p-6 sm:p-8">
              <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-7">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#F5B82E]">
                    {pipelineSteps[activePipelineStep].step} ·{" "}
                    {pipelineSteps[activePipelineStep].code}
                  </span>
                  <h3 className="mt-1 text-xl font-bold text-[#F1F5F9] sm:text-2xl">
                    {pipelineSteps[activePipelineStep].title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#F1F5F9]/90">
                    {pipelineSteps[activePipelineStep].description}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#050B13]/85 p-5 lg:col-span-5">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#00D9F5]">
                    Componentes y fuentes verificadas en el repositorio:
                  </span>
                  <ul className="mt-3 space-y-2 text-xs text-[#F1F5F9]/90">
                    {pipelineSteps[activePipelineStep].sources.map((src) => (
                      <li key={src} className="flex items-start gap-2">
                        <CheckCircle2
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00D9F5]"
                          aria-hidden="true"
                        />
                        <span>{src}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            7. SECCIÓN — CÓMO INTERPRETAMOS LA SIMILITUD (ASI REAL)
        ===================================================================== */}
        <section
          id="similitud-asi"
          aria-labelledby="asi-explanation-heading"
          className="mb-scroll-reveal border-y border-slate-800/80 bg-[#0A1624]/75 py-16 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#00D9F5]">
                  METODOLOGÍA CUANTITATIVA // {dataset.methodology.name.toUpperCase()} v
                  {dataset.methodology.version}
                </span>
                <h2
                  id="asi-explanation-heading"
                  className="mt-2 text-3xl font-bold tracking-tight text-[#F1F5F9] sm:text-4xl"
                >
                  Más allá de lo que parece similar.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-[#94A3B8]">
                  El <strong className="text-[#F1F5F9]">Analog Similarity Index (ASI)</strong>{" "}
                  combina cinco dimensiones en una escala de 0 a 100 ponderada según las
                  prioridades de cada destino extraterrestre. Todos los valores mostrados a
                  continuación provienen directamente del dataset real precalculado por el
                  motor (<code className="font-mono text-[#00D9F5]">analogs.json</code>), sin
                  porcentajes ni ponderaciones inventadas.
                </p>
              </div>

              {/* Direct trigger for the existing MethodologyDialog */}
              <div className="flex items-center gap-3">
                <MethodologyDialog dataset={dataset} />
                <Link
                  href={`/explorer?site=${encodeURIComponent(selectedAsiSite.id)}&target=${encodeURIComponent(selectedAsiTarget.id)}`}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#00D9F5]/50 bg-[#00D9F5]/15 px-3.5 py-1.5 text-xs font-semibold text-[#00D9F5] hover:bg-[#00D9F5]/25"
                >
                  <span>Abrir par en el explorador</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Interactive Selector of Real Catalog Site & Real Target */}
            <div className="mt-8 grid gap-4 rounded-2xl border border-slate-800/90 bg-[#101F30]/80 p-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="asi-site-select"
                  className="block font-mono text-xs font-semibold uppercase tracking-wider text-[#00D9F5]"
                >
                  1. Sitio Terrestre del Catálogo Real ({translatedSites.length} sitios):
                </label>
                <select
                  id="asi-site-select"
                  value={selectedAsiSite.id}
                  onChange={(e) => {
                    const nextSiteId = e.target.value;
                    setSelectedAsiSiteId(nextSiteId);
                    const found = translatedSites.find((s) => s.id === nextSiteId);
                    if (found) {
                      setSelectedAsiTargetId(found.best_target);
                    }
                  }}
                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-[#050B13] px-3.5 py-2 text-sm text-[#F1F5F9]"
                >
                  {translatedSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.country}) — Mejor ASI: {s.overall_asi.toFixed(1)}%
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="asi-target-select"
                  className="block font-mono text-xs font-semibold uppercase tracking-wider text-[#F5B82E]"
                >
                  2. Objetivo Extraterrestre Comparado ({referenceList.length} destinos PDS):
                </label>
                <select
                  id="asi-target-select"
                  value={selectedAsiTarget.id}
                  onChange={(e) => setSelectedAsiTargetId(e.target.value)}
                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-700 bg-[#050B13] px-3.5 py-2 text-sm text-[#F1F5F9]"
                >
                  {referenceList.map((ref) => {
                    const pairScore = selectedAsiSite.scores[ref.id]?.overall_asi;
                    return (
                      <option key={ref.id} value={ref.id}>
                        [{ref.body === "Mars" ? "Marte" : "Luna"}] {ref.name}
                        {pairScore !== undefined ? ` — ASI: ${pairScore.toFixed(2)}%` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Real ASI Circular Indicator + 5-Dimension Breakdown */}
            {selectedAsiScore && (
              <div className="mt-6 grid gap-6 lg:grid-cols-12">
                {/* Left Column: Circular Indicator + Radar Chart */}
                <div className="flex flex-col items-center justify-between rounded-2xl border border-slate-800/90 bg-[#101F30]/90 p-6 lg:col-span-5">
                  <div className="w-full text-center">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#94A3B8]">
                      PUNTUACIÓN PRECALCULADA EN ANALOGS.JSON
                    </span>
                    <h3 className="mt-1 text-base font-bold text-[#F1F5F9]">
                      {selectedAsiSite.name}
                    </h3>
                    <span className="font-mono text-xs text-[#F5B82E]">
                      vs. {selectedAsiTarget.name}
                    </span>
                  </div>

                  {/* Circular SVG Gauge */}
                  <div className="relative my-4 flex items-center justify-center">
                    <svg
                      width="176"
                      height="176"
                      viewBox="0 0 176 176"
                      role="img"
                      aria-label={`Indicador circular ASI: ${selectedAsiScore.overall_asi.toFixed(2)} sobre 100`}
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
                        stroke={isSelectedTargetMars ? "#E07A5F" : "#00D9F5"}
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

                  {/* Reuse existing AsiRadarChart component */}
                  <AsiRadarChart
                    dimensions={selectedAsiScore.dimensions}
                    weights={selectedAsiScore.weights}
                    isMars={isSelectedTargetMars}
                  />
                </div>

                {/* Right Column: 5-Dimension Breakdown with Real Scores & Target Weights */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-[#101F30]/90 p-6 lg:col-span-7">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
                      <div>
                        <h3 className="text-lg font-bold text-[#F1F5F9]">
                          Desglose por dimensiones y pesos reales del objetivo
                        </h3>
                        <p className="text-xs text-[#94A3B8]">
                          Ecuación:{" "}
                          <code className="font-mono text-[#00D9F5]">
                            overall_asi = sum(target_weight[d] * dimension_score[d])
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

                    <div className="mt-5 space-y-4">
                      {DIMENSION_LABELS.map((dim) => {
                        const scoreVal = selectedAsiScore.dimensions[dim.key];
                        const weightVal = selectedAsiScore.weights[dim.key];
                        const contribution = (scoreVal * weightVal).toFixed(2);
                        const isStrength = scoreVal >= 70;
                        return (
                          <div
                            key={dim.key}
                            className="rounded-xl border border-slate-800/90 bg-[#050B13]/75 p-3.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
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

                              <div className="text-right font-mono text-xs tabular-nums">
                                <span className="font-bold text-[#00D9F5]">
                                  {scoreVal.toFixed(2)} / 100
                                </span>
                                <span className="mx-1.5 text-[#94A3B8]">×</span>
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
                                  width: `${Math.max(0, Math.min(100, scoreVal))}%`,
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

                  {/* Interpretation & Transparency Grid */}
                  <div className="mt-6 grid gap-3 border-t border-slate-800 pt-5 text-xs sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-800 bg-[#050B13]/80 p-3.5">
                      <span className="font-mono text-[11px] font-bold uppercase text-[#F5B82E]">
                        Interpretación del resultado
                      </span>
                      <p className="mt-1 leading-relaxed text-[#94A3B8]">
                        {dataset.methodology.interpretation} Una puntuación alta no
                        garantiza la utilidad operativa de un sitio ni equivale a una
                        probabilidad de éxito de misión; un puntaje global alto puede
                        ocultar una dimensión débil.
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-[#050B13]/80 p-3.5">
                      <span className="font-mono text-[11px] font-bold uppercase text-[#00D9F5]">
                        Limitaciones de los datos
                      </span>
                      <p className="mt-1 leading-relaxed text-[#94A3B8]">
                        {dataset.methodology.climate_limitations} Los vectores de
                        terreno, litología y subsuelo del catálogo son supuestos de
                        escenario ilustrativos (priors), no ensayos locales calibrados.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* =====================================================================
            8. SECCIÓN — EXPLORA LOS DESTINOS (CATÁLOGO REAL DINÁMICO)
        ===================================================================== */}
        <section
          id="explora-los-destinos"
          aria-labelledby="destinations-heading"
          className="mb-scroll-reveal mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
        >
          <div className="flex flex-col justify-between gap-6 border-b border-slate-800/80 pb-8 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#F5B82E]">
                CATÁLOGO PLANETARIO // OBJETIVOS EXTRATERRESTRES REALES
              </span>
              <h2
                id="destinations-heading"
                className="mt-2 text-3xl font-bold tracking-tight text-[#F1F5F9] sm:text-4xl"
              >
                Explora los destinos de referencia ({referenceList.length})
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#94A3B8]">
                Cada objetivo extraterrestre del catálogo está vinculado a archivos y
                publicaciones del{" "}
                <strong className="text-[#F1F5F9]">Planetary Data System (PDS)</strong> de
                la NASA. Selecciona cualquier destino para abrir directamente el explorador
                geoespacial filtrado por ese escenario.
              </p>
            </div>

            {/* Filter by body */}
            <div
              role="group"
              aria-label="Filtrar objetivos extraterrestres por cuerpo celeste"
              className="flex rounded-xl border border-slate-800 bg-[#0A1624] p-1"
            >
              {[
                { id: "ALL" as const, label: `Todos (${referenceList.length})` },
                {
                  id: "Moon" as const,
                  label: `Luna (${referenceList.filter((r) => r.body === "Moon").length})`,
                },
                {
                  id: "Mars" as const,
                  label: `Marte (${referenceList.filter((r) => r.body === "Mars").length})`,
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

          {/* Dynamic Grid of Real Catalog Targets */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDestinations.map((target) => {
              const isMars = target.body === "Mars";
              const media =
                TARGET_MEDIA[target.id] ?? TARGET_MEDIA["shackleton-crater"];
              const topAnalogSite = [...translatedSites].sort(
                (a, b) =>
                  (b.scores[target.id]?.overall_asi ?? 0) -
                  (a.scores[target.id]?.overall_asi ?? 0)
              )[0];
              const topAnalogScore = topAnalogSite?.scores[target.id]?.overall_asi;

              return (
                <article
                  key={target.id}
                  className={`flex flex-col justify-between overflow-hidden rounded-2xl border bg-[#101F30]/90 transition-all hover:border-[#00D9F5]/60 ${
                    isMars ? "border-[#E07A5F]/35" : "border-slate-800/95"
                  }`}
                >
                  <div>
                    {/* Target Image + Body Badge */}
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
                            <Orbit className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <Moon className="h-3.5 w-3.5" aria-hidden="true" />
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

                    {/* Card Content */}
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-[#F1F5F9]">{target.name}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-[#94A3B8]">
                        {target.context}
                      </p>

                      {target.mineralogy_summary && (
                        <p className="mt-2.5 rounded-lg border border-slate-800/90 bg-[#050B13]/60 p-2.5 text-[11px] leading-relaxed text-[#F1F5F9]/85">
                          <strong className="text-[#00D9F5]">Contexto mineralógico:</strong>{" "}
                          {target.mineralogy_summary}
                        </p>
                      )}

                      {/* Relevant Characteristics Grid */}
                      <dl className="mt-4 grid grid-cols-2 gap-2 font-mono text-[11px] tabular-nums">
                        <div className="rounded-lg border border-slate-800/80 bg-[#050B13]/75 p-2">
                          <dt className="text-[10px] text-[#94A3B8]">TEMP. ESCENARIO</dt>
                          <dd className="mt-0.5 font-bold text-[#F1F5F9]">
                            {target.temperature_mean_c}°C (Δ{target.temperature_range_c}°C)
                          </dd>
                        </div>
                        <div className="rounded-lg border border-slate-800/80 bg-[#050B13]/75 p-2">
                          <dt className="text-[10px] text-[#94A3B8]">PENDIENTE / RUG.</dt>
                          <dd className="mt-0.5 font-bold text-[#F1F5F9]">
                            {target.terrain?.slope_deg ?? "—"}° · Rug.{" "}
                            {target.terrain?.roughness ?? "—"}
                          </dd>
                        </div>
                        <div className="rounded-lg border border-slate-800/80 bg-[#050B13]/75 p-2">
                          <dt className="text-[10px] text-[#94A3B8]">GRAVEDAD / PRESIÓN</dt>
                          <dd className="mt-0.5 font-bold text-[#F1F5F9]">
                            {target.gravity_ms2 ?? "—"} m/s² · {target.pressure_kpa ?? 0} kPa
                          </dd>
                        </div>
                        <div className="rounded-lg border border-slate-800/80 bg-[#050B13]/75 p-2">
                          <dt className="text-[10px] text-[#94A3B8]">MEJOR ANÁLOGO</dt>
                          <dd className="mt-0.5 truncate font-bold text-[#F5B82E]">
                            {topAnalogScore !== undefined
                              ? `${topAnalogScore.toFixed(1)}% ASI`
                              : "—"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="border-t border-slate-800/90 bg-[#050B13]/60 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={target.source_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex min-h-10 items-center gap-1 font-mono text-[11px] text-[#94A3B8] hover:text-[#00D9F5] hover:underline"
                      >
                        <span>Fuente NASA</span>
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>

                      <Link
                        href={`/explorer?target=${encodeURIComponent(target.id)}`}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#00D9F5]/60 bg-[#00D9F5]/15 px-3.5 py-2 text-xs font-bold text-[#00D9F5] transition-colors hover:bg-[#00D9F5]/25"
                      >
                        <span>Explorar destino</span>
                        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* =====================================================================
            9. SECCIÓN — UNA HERRAMIENTA PARA INVESTIGAR (VISTA PREVIA HUD)
        ===================================================================== */}
        <section
          id="herramienta-investigacion"
          aria-labelledby="workbench-preview-heading"
          className="mb-scroll-reveal border-y border-slate-800/80 bg-[#0A1624]/80 py-16 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#00D9F5]">
                  PLATAFORMA INTERACTIVA // FUNCIONES REALMENTE IMPLEMENTADAS
                </span>
                <h2
                  id="workbench-preview-heading"
                  className="mt-2 text-3xl font-bold tracking-tight text-[#F1F5F9] sm:text-4xl"
                >
                  Una herramienta para investigar.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-[#94A3B8]">
                  Selecciona cualquiera de las 8 anotaciones técnicas para inspeccionar cómo
                  funciona la consola geoespacial de TERR-ANALOG antes de abrirla a
                  pantalla completa.
                </p>
              </div>

              <Link
                href="/explorer"
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-[#00D9F5] bg-[#00D9F5] px-5 py-2.5 text-xs font-bold text-[#050B13] shadow-[0_0_24px_rgba(0,217,245,0.3)] transition-transform hover:scale-[1.01]"
              >
                <span>Abrir Explorador en Pantalla Completa</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            {/* Interactive Workbench Preview + 8 Feature Annotations */}
            <div className="mt-10 grid gap-6 lg:grid-cols-12">
              {/* Left 5 Cols: 8 Selectable Feature Buttons */}
              <div
                role="listbox"
                aria-label="Funciones implementadas en el explorador TERR-ANALOG"
                className="grid gap-2.5 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1"
              >
                {EXPLORER_HOTSPOTS.map((spot) => {
                  const isSelected = activeHotspot.id === spot.id;
                  return (
                    <button
                      key={spot.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => setActiveHotspotId(spot.id)}
                      className={`flex min-h-12 flex-col justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                        isSelected
                          ? "border-[#00D9F5] bg-[#101F30] shadow-[0_0_20px_rgba(0,217,245,0.16)]"
                          : "border-slate-800/90 bg-[#050B13]/80 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#F1F5F9]">
                          {spot.title}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 font-mono text-[10px] ${
                            isSelected
                              ? "bg-[#00D9F5]/20 text-[#00D9F5]"
                              : "bg-slate-800 text-[#94A3B8]"
                          }`}
                        >
                          {spot.badge}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right 7 Cols: Authentic Representation of the Live HUD with Interactive Hotspots */}
              <div className="flex flex-col justify-between rounded-2xl border border-[#00D9F5]/35 bg-[#050B13] p-4 shadow-2xl sm:p-6 lg:col-span-7">
                {/* Simulated HUD Window Frame Showing Real Dataset Values */}
                <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#071018]">
                  {/* Mock Top HUD Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F5B82E]/30 bg-[#050B13]/95 px-3.5 py-2.5 text-[11px]">
                    <div className="flex items-center gap-2">
                      <Compass className="h-3.5 w-3.5 text-[#F5B82E]" aria-hidden="true" />
                      <span className="font-bold tracking-wider text-[#F1F5F9]">
                        TERR-ANALOG // HUD
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <span className="rounded border border-[#F5B82E]/60 bg-[#F5B82E]/15 px-2 py-0.5 text-[#F5B82E]">
                        Tierra ({translatedSites.length})
                      </span>
                      <span className="rounded border border-slate-800 bg-[#0A1624] px-2 py-0.5 text-[#94A3B8]">
                        Luna (3)
                      </span>
                      <span className="rounded border border-slate-800 bg-[#0A1624] px-2 py-0.5 text-[#94A3B8]">
                        Marte (3)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#00D9F5]">
                      <Download className="h-3 w-3" aria-hidden="true" />
                      <span>GeoJSON / Dossier</span>
                    </div>
                  </div>

                  {/* Main Preview Canvas */}
                  <div className="relative h-[340px] w-full overflow-hidden sm:h-[380px]">
                    {/* Topographic background texture from docs/assets/hero_banner.jpg */}
                    <Image
                      src="/nasa/earth-horizon-iss.jpg"
                      alt="Vista orbital de la Tierra desde la Estación Espacial Internacional como fondo del visor geoespacial"
                      width={900}
                      height={500}
                      loading="lazy"
                      className="h-full w-full object-cover opacity-35"
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#050B13] via-[#050B13]/55 to-transparent"
                      aria-hidden="true"
                    />

                    {/* Real Data Telemetry Mini-Drawer Overlay */}
                    <div className="absolute top-3 bottom-3 left-3 w-[210px] rounded-xl border border-[#00D9F5]/30 bg-[#0A1624]/92 p-3 backdrop-blur-md sm:w-[250px]">
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-[#F5B82E]/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#F5B82E]">
                          ECUADOR · {translatedSites[0]?.elevation_m ?? 409} m
                        </span>
                        <span className="font-mono text-xs font-bold text-[#00D9F5] tabular-nums">
                          {(translatedSites[0]?.overall_asi ?? 88.2).toFixed(1)}% ASI
                        </span>
                      </div>
                      <p className="mt-1.5 truncate text-xs font-bold text-[#F1F5F9]">
                        {translatedSites[0]?.name}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[10px] text-[#94A3B8]">
                        Objetivo: Mare Tranquillitatis
                      </p>

                      <div className="mt-3 space-y-1.5 border-t border-slate-800 pt-2.5 font-mono text-[10px] tabular-nums">
                        <div className="flex justify-between">
                          <span className="text-[#94A3B8]">NASA POWER Tmax/Tmin:</span>
                          <span className="text-[#F1F5F9]">
                            {translatedSites[0]?.climatology.tmax_c}°C /{" "}
                            {translatedSites[0]?.climatology.tmin_c}°C
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#94A3B8]">DEM Pendiente:</span>
                          <span className="text-[#00D9F5]">
                            {translatedSites[0]?.dem_telemetry.dem_slope_deg}°
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#94A3B8]">Subterráneo / Tubos:</span>
                          <span className="text-emerald-300">100.0 / 100</span>
                        </div>
                      </div>

                      <div className="mt-3 rounded-lg border border-slate-800 bg-[#050B13]/80 p-2 font-mono text-[9px] text-[#94A3B8]">
                        <span className="block font-bold text-[#F5B82E]">
                          LÍMITE FÍSICO REPORTADO:
                        </span>
                        Gravedad 9.81 m/s² vs. 1.62 m/s² lunar; atmósfera húmeda vs. vacío.
                      </div>
                    </div>

                    {/* Interactive Hotspot Markers on the HUD Canvas */}
                    {EXPLORER_HOTSPOTS.map((spot, idx) => {
                      const active = activeHotspot.id === spot.id;
                      return (
                        <button
                          key={spot.id}
                          type="button"
                          onClick={() => setActiveHotspotId(spot.id)}
                          style={{
                            left: spot.coordsPercent.left,
                            top: spot.coordsPercent.top,
                          }}
                          aria-label={`Ver anotación ${spot.title}`}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border font-mono text-xs font-bold transition-transform ${
                            active
                              ? "z-20 scale-115 border-[#00D9F5] bg-[#00D9F5] text-[#050B13] shadow-[0_0_20px_rgba(0,217,245,0.9)]"
                              : "z-10 border-[#F5B82E]/80 bg-[#050B13]/90 text-[#F5B82E] hover:scale-105"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Hotspot Annotation Card */}
                <div
                  aria-live="polite"
                  className="mt-4 rounded-xl border border-[#00D9F5]/40 bg-[#101F30] p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold uppercase text-[#00D9F5]">
                      ANOTACIÓN ACTIVA // {activeHotspot.badge}
                    </span>
                    <Link
                      href="/explorer"
                      className="font-mono text-xs font-semibold text-[#F5B82E] hover:underline"
                    >
                      Probar esta función en vivo →
                    </Link>
                  </div>
                  <h3 className="mt-1.5 text-lg font-bold text-[#F1F5F9]">
                    {activeHotspot.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#F1F5F9]/90">
                    {activeHotspot.summary}
                  </p>
                  <p className="mt-2 font-mono text-xs text-[#94A3B8]">
                    {activeHotspot.realImplementation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            10. SECCIÓN FINAL — COMIENZA TU MISIÓN
        ===================================================================== */}
        <section
          id="comienza-tu-mision"
          aria-labelledby="final-cta-heading"
          className="mb-scroll-reveal mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
        >
          <div className="relative overflow-hidden rounded-[28px] border border-[#00D9F5]/35 bg-gradient-to-br from-[#0A1624] via-[#101F30] to-[#050B13] px-6 py-14 text-center shadow-[0_0_80px_rgba(0,217,245,0.14)] sm:px-14 sm:py-20">
            <div className="relative z-10 mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#F5B82E]/40 bg-[#F5B82E]/10 px-4 py-1 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#F5B82E]">
                <span>LISTO PARA LA DEMOSTRACIÓN // NASA SPACE APPS 2026</span>
              </span>

              <h2
                id="final-cta-heading"
                className="mt-5 text-3xl font-bold tracking-tight text-[#F1F5F9] sm:text-5xl"
              >
                La próxima misión comienza en la Tierra.
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#94A3B8] sm:text-lg">
                Descubre lugares, compara condiciones y explora cómo los datos terrestres
                pueden apoyar la investigación de futuros entornos lunares y marcianos.
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/explorer"
                  className="inline-flex min-h-13 items-center gap-3 rounded-full border border-[#00D9F5] bg-[#00D9F5] px-8 py-3.5 text-sm font-bold tracking-[0.12em] text-[#050B13] shadow-[0_0_35px_rgba(0,217,245,0.45)] transition-transform hover:scale-[1.02]"
                >
                  <span>ENTRAR A TERR-ANALOG</span>
                  <ArrowUpRight className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
                </Link>

                <a
                  href="https://github.com/FakeCxbas/nasa-space-apps-2026"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-13 items-center gap-2.5 rounded-full border border-slate-700 bg-[#050B13]/85 px-7 py-3.5 text-sm font-bold tracking-[0.1em] text-[#F1F5F9] transition-colors hover:border-[#00D9F5]/60 hover:text-[#00D9F5]"
                >
                  <span>VER CÓDIGO EN GITHUB</span>
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 border-t border-slate-800/80 pt-6 text-xs text-[#94A3B8]">
                <a
                  href="https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 font-medium text-[#F5B82E] hover:underline"
                >
                  <span>
                    Desafío oficial: Identify Earth Locations that Analog the Permanent Moon
                    Base Locations and Mars
                  </span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================================
          FOOTER & SCIENTIFIC ATTRIBUTION / INTEGRITY NOTICE
      ===================================================================== */}
      <footer className="border-t border-slate-800/80 bg-[#050B13] py-10 text-xs text-[#94A3B8]">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div className="max-w-2xl space-y-1.5">
            <p className="font-bold text-[#F1F5F9]">
              TERR-ANALOG — Mission Briefing &amp; Planetary Analog Discovery Platform
            </p>
            <p className="leading-relaxed">
              Proyecto independiente desarrollado para el{" "}
              <strong className="text-[#F1F5F9]">NASA Space Apps Challenge 2026</strong>.
              Utiliza datos e imágenes abiertas de NASA POWER, NASA Image and Video
              Library, NASA Planetary Data System (PDS) y Copernicus DEM GLO-90 /
              Open-Meteo. Este proyecto no es un producto oficial de la NASA ni implica
              respaldo institucional de la agencia.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
            <Link href="/explorer" className="text-[#00D9F5] hover:underline">
              /explorer (Mapa 3D)
            </Link>
            <a
              href="https://github.com/FakeCxbas/nasa-space-apps-2026"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-[#F1F5F9] hover:underline"
            >
              GitHub Repository
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
