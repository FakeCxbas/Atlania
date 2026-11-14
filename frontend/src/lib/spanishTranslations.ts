import type { AnalogSite, TargetProfile } from "@/types/analog";

export interface SiteTranslation {
  name: string;
  country: string;
  rationale: string;
  caveat: string;
}

export interface TargetTranslation {
  name: string;
  context: string;
  body: "Luna" | "Marte";
}

export const SITE_TRANSLATIONS: Record<string, SiteTranslation> = {
  "galapagos-lava-tubes": {
    name: "Tubos de Lava de Galápagos - Santa Cruz / Isabela",
    country: "Ecuador",
    rationale:
      "Conductos y tubos de lava basáltica prístinos ideales para probar robótica de exploración subterránea y geometrías de hábitats protegidos contra radiación cósmica en la Luna y Marte.",
    caveat:
      "La telemetría climática en superficie no reproduce el microclima de las cuevas; existen restricciones de acceso al Parque Nacional y meteorización biológica húmeda.",
  },
  chimborazo: {
    name: "Chimborazo - Criósfera y Permafrost Volcánico",
    country: "Ecuador",
    rationale:
      "Terreno volcánico frío de extrema altitud (5,000 m s.n.m.) que modela ciclos de congelamiento, regolito congelado y ensayos de tracción de rovers en permafrost análogo.",
    caveat:
      "La presencia de permafrost es un supuesto de escenario científico y no un mapa exhaustivo; el material volcánico es andesítico y la NASA suaviza el relieve en cumbres.",
  },
  cotopaxi: {
    name: "Planicies Piroclásticas del Cotopaxi",
    country: "Ecuador",
    rationale:
      "Depósitos piroclásticos y cenizas volcánicas sueltas que ofrecen análogos idóneos para ensayos de tracción de ruedas, abrasión mecánica y mitigación de polvo espacial.",
    caveat:
      "Los materiales andesíticos difieren del regolito lunar; el riesgo de actividad volcánica y la humedad andina requieren protocolos de seguridad en campo.",
  },
  "salar-de-uyuni": {
    name: "Salar de Uyuni",
    country: "Bolivia",
    rationale:
      "El mayor desierto de sal del mundo; sus costras evaporíticas y sedimentos de cuenca cerrada sirven de análogo para paleolagos secos y sales de cloruro en Marte.",
    caveat:
      "Las inundaciones estacionales y la hidroquímica terrestre difieren de las condiciones hiperáridas actuales de la superficie marciana.",
  },
  "qaidam-basin": {
    name: "Cuenca de Qaidam",
    country: "China",
    rationale:
      "Cuenca hiperárida de gran altitud con yardangs esculpidos por el viento y depósitos salinos, excelente modelo para la meteorización eólica y travesía de rovers en Marte.",
    caveat:
      "La heterogeneidad de la cuenca no queda representada en un único punto; las sales terrestres no implican mineralogía marciana idéntica.",
  },
  dallol: {
    name: "Dallol - Salmueras y Fuentes Hidrotermales",
    country: "Etiopía",
    rationale:
      "Salmueras hiperácidas e hidrotermales ricas en hierro que ofrecen análogos para la alteración acuosa hidrotermal temprana en cráteres de Marte.",
    caveat:
      "El calor extremo y los fluidos hiperácidos activos contrastan con el Marte actual extremadamente gélido; condiciones de campo altamente hostiles.",
  },
  "craters-of-the-moon": {
    name: "Cráteres de la Luna (Craters of the Moon)",
    country: "Estados Unidos",
    rationale:
      "Campos de lava basáltica cuaternaria y tubos lávicos utilizados históricamente por astronautas del Apolo para entrenamiento en geología lunar y marciana.",
    caveat:
      "La atmósfera terrestre, la nieve invernal y la vegetación representan diferencias notables frente al vacío lunar o la atmósfera marciana.",
  },
  "haughton-crater": {
    name: "Cráter de Impacto Haughton (Isla Devon)",
    country: "Canadá",
    rationale:
      "Estructura de impacto meteorítico en permafrost polar ártico; sede del Haughton-Mars Project (NASA) para pruebas de movilidad y exploración en hábitats extremos.",
    caveat:
      "Las rocas ricas en carbonatos difieren de las anortositas de las tierras altas lunares; las temperaturas árticas son considerablemente más cálidas que el polo lunar.",
  },
  "atacama-yungay": {
    name: "Desierto de Atacama - Núcleo de Yungay",
    country: "Chile",
    rationale:
      "Núcleo hiperárido con suelos ricos en percloratos y radiación solar extrema; referencia internacional para límites de habitabilidad y ensayos de muestreo en Marte.",
    caveat:
      "Persisten eventos de neblina costera (camanchaca), microorganismos extremófilos y meteorización con oxígeno terrestre.",
  },
  askja: {
    name: "Caldera Volcánica de Askja",
    country: "Islandia",
    rationale:
      "Campos de pumita y basalto desolados donde la NASA entrenó a las tripulaciones del Apolo; reproduce transiciones entre terrenos volcánicos y cráteres lunares.",
    caveat:
      "La nieve, las precipitaciones y la actividad geotérmica difieren de las superficies estériles de la Luna y Marte.",
  },
};

export const TARGET_TRANSLATIONS: Record<string, TargetTranslation> = {
  "shackleton-crater": {
    name: "Cráter Shackleton / Polo Sur Lunar (Artemis)",
    context:
      "Trampa fría en oscuridad permanente (-183°C) con potencial de hielo atrapado; objetivo estratégico del programa Artemis de la NASA para la primera base lunar permanente.",
    body: "Luna",
  },
  "mare-tranquillitatis": {
    name: "Mare Tranquillitatis / Tubos de Lava Lunares",
    context:
      "Fosa volcánica en sombra térmica con temperaturas moderadas (17°C); escenario propuesto por la NASA para albergar bases subterráneas protegidas de meteoritos y radiación.",
    body: "Luna",
  },
  "jezero-crater": {
    name: "Cráter Jezero / Delta Fluvial y Basaltos",
    context:
      "Antiguo paleolago explorado por el rover Perseverance de la NASA; combina depósitos sedimentarios deltaicos ricos en arcillas con lechos ígneos basálticos.",
    body: "Marte",
  },
  "olympus-mons-flank": {
    name: "Flanco del Monte Olimpo / Tubos Volcánicos",
    context:
      "Escudo volcánico colosal en Marte con extensas coladas basálticas y canales de lava colapsados; referencia clave para volcanismo extraterrestre a gran escala.",
    body: "Marte",
  },
};

export const BREAKDOWN_TITLES_ES: Record<string, string> = {
  gravity: "Gravedad Diferencial",
  atmosphere_vacuum: "Atmósfera y Vacío",
  radiation: "Radiación Ionizante",
  weathering: "Meteorización e Intemperismo",
  thermal_comparability: "Comparabilidad Térmica",
  site_specific: "Límites del Sitio Terrestre",
};

export const BREAKDOWN_TEXTS_ES: Record<string, (body: string) => string> = {
  gravity: (body) =>
    body === "Moon" || body === "Luna"
      ? "La gravedad terrestre (9.81 m/s²) es seis veces mayor que la lunar (1.62 m/s²); la tracción de rovers, la biomecánica de astronautas y la carga estructural de los hábitats son muy distintas."
      : "La gravedad terrestre (9.81 m/s²) es casi el triple de la marciana (3.71 m/s²); la tracción, la dispersión del polvo y el esfuerzo motriz de los vehículos difieren sustancialmente.",
  atmosphere_vacuum: (body) =>
    body === "Moon" || body === "Luna"
      ? "La atmósfera terrestre (101.3 kPa, 21% O₂) no reproduce el vacío absoluto de la Luna, donde se requieren trajes espaciales presurizados y sellos herméticos totales."
      : "El aire terrestre no reproduce la tenue atmósfera marciana (0.64 kPa, 95% CO₂); la sustentación aerodinámica, la transferencia de calor y la presión son drásticamente menores en Marte.",
  radiation: () =>
    "El campo magnético y la atmósfera de la Tierra bloquean los rayos cósmicos galácticos (GCR) y las tormentas de partículas solares (SPE); la Luna y Marte carecen de esta protección natural.",
  weathering: () =>
    "El agua líquida, el oxígeno reactivo y la vida biológica en la Tierra alteran las rocas de manera muy diferente al bombardeo micrometeorítico y la química oxidativa extraterrestre.",
  thermal_comparability: () =>
    "La telemetría de aire a 2 metros de NASA POWER es una aproximación climática; no reproduce los ciclos lunares de 28 días ni la radiación infrarroja superficial directa.",
};

export function translateSite(site: AnalogSite): AnalogSite {
  const trans = SITE_TRANSLATIONS[site.id];
  const translatedName = trans?.name ?? site.name;
  const translatedCountry = trans?.country ?? site.country;
  const translatedRationale = trans?.rationale ?? site.rationale;
  const translatedCaveat = trans?.caveat ?? site.analogy_breakdowns.site_specific ?? "";

  // Translate strengths
  const translatedStrengths = site.analogy_strengths.map((str) => {
    return str
      .replace("topography", "Topografía")
      .replace("geology", "Geología")
      .replace("thermal", "Régimen Térmico")
      .replace("hydrology_ice", "Sequedad e Hielo")
      .replace("subsurface_ops", "Operaciones Subterráneas")
      .replace("scenario similarity", "similitud de escenario");
  });

  // Translate breakdowns
  const translatedBreakdowns: Record<string, string> = {};
  for (const [key, msg] of Object.entries(site.analogy_breakdowns)) {
    if (key === "site_specific") {
      translatedBreakdowns[key] = translatedCaveat;
    } else if (BREAKDOWN_TEXTS_ES[key]) {
      const bestTarget = site.best_target;
      const isMoon = bestTarget.includes("shackleton") || bestTarget.includes("tranquillitatis");
      translatedBreakdowns[key] = BREAKDOWN_TEXTS_ES[key](isMoon ? "Luna" : "Marte");
    } else {
      translatedBreakdowns[key] = msg;
    }
  }

  return {
    ...site,
    name: translatedName,
    country: translatedCountry,
    rationale: translatedRationale,
    analogy_strengths: translatedStrengths,
    analogy_breakdowns: translatedBreakdowns,
  };
}

export function translateTarget(target: TargetProfile): TargetProfile {
  const trans = TARGET_TRANSLATIONS[target.id];
  if (!trans) return target;

  return {
    ...target,
    name: trans.name,
    context: trans.context,
    body: (trans.body === "Luna" ? "Moon" : "Mars") as "Moon" | "Mars",
  };
}
