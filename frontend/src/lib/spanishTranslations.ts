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

const COUNTRY_TRANSLATIONS: Record<string, string> = {
  Ecuador: "Ecuador",
  Bolivia: "Bolivia",
  China: "China",
  Ethiopia: "Etiopía",
  "United States": "Estados Unidos",
  Canada: "Canadá",
  Chile: "Chile",
  Iceland: "Islandia",
  "Chile / Argentina": "Chile / Argentina",
  Iran: "Irán",
  Chad: "Chad",
  Spain: "España",
  Argentina: "Argentina",
  Peru: "Perú",
  Antarctica: "Antártida",
  Norway: "Noruega",
  Namibia: "Namibia",
  Russia: "Rusia",
};

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
  "sierra-negra": {
    name: "Caldera Volcánica Sierra Negra (Isabela)",
    country: "Ecuador",
    rationale:
      "Extensa caldera basáltica activa con coladas recientes y redes de fisuras ideales para pruebas de abrasión de ruedas de rovers y fotogrametría orbital/aérea.",
    caveat:
      "Volcanismo activo, meteorización biológica húmeda y regulaciones del Parque Nacional Galápagos; los conductos subterráneos requieren prospección local.",
  },
  antisana: {
    name: "Complejo Glaciar-Basáltico del Antisana",
    country: "Ecuador",
    rationale:
      "Contacto directo entre frentes glaciares de alta montaña (4,800 m) y coladas volcánicas oscuras; escenario clave para perforación ISRU en hielo y radar de penetración terrestre (GPR).",
    caveat:
      "La litología volcánica mixta y el hielo glaciar templado no reproducen la física criogénica de los depósitos de hielo en trampas frías lunares.",
  },
  "puna-laguna-verde": {
    name: "Puna de Atacama y Laguna Verde",
    country: "Chile / Argentina",
    rationale:
      "Cuencas endorreicas volcánicas y salinas a 4,350 m s.n.m. con alta radiación UV y baja presión atmosférica para pruebas de vuelo de rotores tipo Ingenuity y espectroscopía Raman.",
    caveat:
      "Un punto representativo no abarca toda la heterogeneidad transfronteriza de la Puna; el aire terrestre sigue siendo mucho más denso que en Marte.",
  },
  "lut-rig-e-yalan": {
    name: "Desierto de Lut - Megadunas Rig-e Yalan",
    country: "Irán",
    rationale:
      "Uno de los polos térmicos más cálidos e hiperáridos de la Tierra; sus campos de dunas gigantes modelan la estimación de deslizamiento (slip) de rovers y abrasión eólica.",
    caveat:
      "Las arenas terrestres extremadamente cálidas y la atmósfera oxidante contrastan con las dunas frías de basalto en Marte.",
  },
  tibesti: {
    name: "Campo Volcánico del Tibesti",
    country: "Chad",
    rationale:
      "Macizo volcánico sahariano hiperárido con calderas, ignimbritas y escudos basálticos análogos a los complejos volcánicos de Tharsis y Elysium en Marte.",
    caveat:
      "Escasez de estaciones in situ y restricciones logísticas severas en terreno remoto requieren validación previa.",
  },
  timanfaya: {
    name: "Tubos de Lava de Timanfaya (Lanzarote)",
    country: "España",
    rationale:
      "Campos de lava basáltica histórica y tubos volcánicos monumentales (como el sistema de la Corona) empleados por la ESA (PANGAEA) para entrenar astronautas y rovers subterráneos.",
    caveat:
      "La humedad marina atlántica y la protección ambiental insular limitan las excavaciones directas fuera de rutas autorizadas.",
  },
  "el-reventador": {
    name: "Complejo Volcánico El Reventador",
    country: "Ecuador",
    rationale:
      "Estratovolcán activo con escarpes empinados, coladas frescas de basalto-andesita y depósitos de bloques para navegación autónoma de alto riesgo y mapeo LiDAR.",
    caveat:
      "La alta pluviosidad subandina y el entorno de bosque nublado circundante contrastan con los cañones hiperáridos marcianos.",
  },
  "sangay-volcano": {
    name: "Cono Piroclástico y Cenizas del Sangay",
    country: "Ecuador",
    rationale:
      "Cono andino aislado de gran altitud (5,230 m) con pendientes extremas de tefra y caída continua de ceniza para ensayos de tracción en taludes y sellado hermético contra polvo.",
    caveat:
      "El peligro eruptivo permanente y la influencia húmeda amazónica difieren del vacío lunar y la aridez marciana.",
  },
  "quilotoa-caldera": {
    name: "Caldera Volcánica e Hidrotermal del Quilotoa",
    country: "Ecuador",
    rationale:
      "Caldera de colapso de 3 km con paredes escarpadas de toba y laguna cratérica alcalino-salina mineralizada que modela antiguos lagos de cráter y alteración hidrotermal en Marte.",
    caveat:
      "La composición dacítica y el cuerpo de agua líquida actual difieren de los cráteres basálticos secos de Marte.",
  },
  "valle-de-la-luna": {
    name: "Valle de la Luna - Cordillera de la Sal",
    country: "Chile",
    rationale:
      "Crestas plegadas de halita, yeso y arcillas hiperáridas con cavernas salinas que reproducen depósitos evaporíticos estratificados y cañones de sulfatos en Marte.",
    caveat:
      "El karst salino se origina por humedad episódica ocasional bajo gravedad y presión atmosférica terrestres.",
  },
  "campo-piedra-pomez": {
    name: "Campo de Piedra Pómez (Puna Catamarqueña)",
    country: "Argentina",
    rationale:
      "Laberinto de yardangs esculpidos por el viento sobre ignimbritas y ondas de grava basáltica oscura a más de 3,150 m de altitud, análogo directo de la erosión eólica en Marte.",
    caveat:
      "La densidad de la piedra pómez silícea es muy inferior a la roca basáltica marciana pese a su extraordinaria similitud geomorfológica.",
  },
  "pampas-de-la-joya": {
    name: "Pampas de La Joya - Desierto Hiperárido",
    country: "Perú",
    rationale:
      "Planicies hiperáridas del desierto costero sur con suelos ricos en sulfatos y carbono orgánico ultrabajo, estudiadas para calibración de ensayos astrobiológicos marcianos.",
    caveat:
      "Las incursiones estacionales de neblina costera y los nitratos oxidados reflejan procesos atmosféricos terrestres.",
  },
  "laguna-colorada": {
    name: "Laguna Colorada y Campos Geotérmicos Sol de Mañana",
    country: "Bolivia",
    rationale:
      "Cuenca altoandina (4,300 m) con evaporitas de bórax/sulfatos y fumarolas hidrotermales ricas en óxidos de hierro que modelan sistemas lacustres-volcánicos del Marte primitivo.",
    caveat:
      "La presencia de agua superficial y microorganismos pigmentados difiere del estado criogénico actual de Marte.",
  },
  "mcmurdo-dry-valleys": {
    name: "Valles Secos de McMurdo - Valle Wright",
    country: "Antártida",
    rationale:
      "El desierto frío hiperárido más extremo de la Tierra; su permafrost cementado con hielo y diques de dolerita constituyen el referente mundial de la NASA para el regolito polar marciano y lunar.",
    caveat:
      "La logística del Tratado Antártico y la noche polar invernal restringen severamente las ventanas operativas.",
  },
  "rio-tinto": {
    name: "Cuenca Ácida de Hierro y Sulfatos de Río Tinto",
    country: "España",
    rationale:
      "Sistema fluvial extremadamente ácido (pH ~2) que precipita jarosita y goethita férrica; análogo mineralógico fundamental de Meridiani Planum explorado por el rover Opportunity.",
    caveat:
      "El clima mediterráneo templado y el flujo abundante de agua líquida contrastan con el desierto frío marciano.",
  },
  "mauna-loa-hiseas": {
    name: "Escudo Basáltico de Mauna Loa y Tubos HI-SEAS",
    country: "Estados Unidos",
    rationale:
      "Coladas de basalto pahoehoe/aa sin alterar y claraboyas de tubos de lava a 2,500 m donde la NASA realiza misiones de aislamiento humano y robótica de entrada a cuevas lunares.",
    caveat:
      "La atmósfera insular tropical y las precipitaciones orográficas difieren de los ambientes sin atmósfera.",
  },
  "barringer-crater": {
    name: "Cráter de Impacto Meteorítico Barringer",
    country: "Estados Unidos",
    rationale:
      "El cráter de impacto simple mejor preservado de la Tierra, con manto de eyecta invertido y brechas de choque donde entrenaron los astronautas de las misiones Apolo.",
    caveat:
      "La estratigrafía sedimentaria objetivo (areniscas y dolomitas) difiere de la corteza anortosítica lunar.",
  },
  "svalbard-bockfjord": {
    name: "Complejo Volcánico-Permafrost de Bockfjord (Svalbard)",
    country: "Noruega",
    rationale:
      "Conos basálticos cuaternarios emplazados sobre permafrost ártico con carbonatos idénticos a los del meteorito marciano ALH84001; sede de expediciones AMASE (NASA/ESA).",
    caveat:
      "La humedad marina ártica y el deshielo estacional superan la actividad hídrica del Marte moderno.",
  },
  "namib-sossusvlei": {
    name: "Desierto del Namib - Megadunas de Sossusvlei",
    country: "Namibia",
    rationale:
      "Megadunas lineales recubiertas de óxidos de hierro y cuencas interdunares de arcilla análogas al campo de dunas de Bagnold en el Cráter Gale de Marte.",
    caveat:
      "La mayor densidad del aire terrestre genera umbrales de saltación eólica distintos a la atmósfera marciana de 0.6 kPa.",
  },
  "kamchatka-tolbachik": {
    name: "Fisura Basáltica y Escorias de Tolbachik (Kamchatka)",
    country: "Rusia",
    rationale:
      "Extensas planicies de escoria basáltica suelta y tubos de lava colapsados donde se ensayaron los chasis y trenes de rodaje de los rovers Lunokhod y Marsokhod.",
    caveat:
      "La densa cobertura de nieve invernal y las lluvias subárticas difieren de los mares basálticos lunares.",
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
  "mouton-mons": {
    name: "Mons Mouton / Meseta del Polo Sur Lunar (Artemis III)",
    context:
      "Amplia meseta polar de cima plana contigua a Shackleton; región candidata prioritaria de aterrizaje para Artemis III por su baja pendiente y prolongada iluminación solar.",
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
  "valles-marineris": {
    name: "Valles Marineris / Cañón Coprates y Sulfatos",
    context:
      "Sistema de cañones tectónicos gigantescos con taludes estratificados de basalto y depósitos interiores ricos en sulfatos polihidratados detectados por MRO CRISM.",
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
  const translatedCountry =
    trans?.country ?? COUNTRY_TRANSLATIONS[site.country] ?? site.country;
  const translatedRationale = trans?.rationale ?? site.rationale;
  const translatedCaveat =
    trans?.caveat ?? site.analogy_breakdowns.site_specific ?? "";

  const translatedStrengths = site.analogy_strengths.map((str) => {
    return str
      .replace("topography", "Topografía")
      .replace("geology", "Geología")
      .replace("thermal", "Régimen Térmico")
      .replace("hydrology_ice", "Sequedad e Hielo")
      .replace("subsurface_ops", "Operaciones Subterráneas")
      .replace("scenario similarity", "similitud de escenario");
  });

  const translatedBreakdowns: Record<string, string> = {};
  for (const [key, msg] of Object.entries(site.analogy_breakdowns)) {
    if (key === "site_specific") {
      translatedBreakdowns[key] = translatedCaveat;
    } else if (BREAKDOWN_TEXTS_ES[key]) {
      const bestTarget = site.best_target;
      const isMoon =
        bestTarget.includes("shackleton") ||
        bestTarget.includes("tranquillitatis") ||
        bestTarget.includes("mouton");
      translatedBreakdowns[key] = BREAKDOWN_TEXTS_ES[key](
        isMoon ? "Luna" : "Marte"
      );
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
  };
}
