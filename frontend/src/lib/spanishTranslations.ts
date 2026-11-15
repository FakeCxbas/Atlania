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
  India: "India",
  Australia: "Australia",
  "Colombia": "Colombia",
  "Brazil": "Brasil",
  "Costa Rica": "Costa Rica",
  "Italy": "Italia",
  "Jordan": "Jordania",
  "Botswana": "Botsuana",
  "Germany": "Alemania",
  "South Africa": "Sudáfrica",
  "Algeria": "Argelia",
  "Libya": "Libia",
  "South Korea": "Corea del Sur",
};

export const SITE_TRANSLATIONS: Record<string, SiteTranslation> = {
  "fernandina-caldera": {
    "name": "Caldera Basáltica de Fernandina",
    "country": "Ecuador",
    "rationale": "La caldera de colapso y las coladas del escudo basáltico ofrecen análogos de morfología volcánica y cartografía remota del terreno.",
    "caveat": "La elevación representa el interior de la caldera, no la cumbre de 1476 m; las erupciones, paredes inestables y ecosistemas protegidos impiden asumir un acceso seguro."
  },
  "alcedo-hydrothermal": {
    "name": "Caldera Hidrotermal de Alcedo",
    "country": "Ecuador",
    "rationale": "La alteración fumarólica de un escudo de Galápagos con basaltos y riolitas permite comparaciones con el hidrotermalismo del Marte primitivo.",
    "caveat": "Alcedo no es uniformemente basáltico; las fumarolas, meteorización húmeda y fauna protegida limitan el muestreo. El punto representa la caldera, no una fumarola verificada."
  },
  "cayambe-glacier": {
    "name": "Márgenes Glaciares del Cayambe",
    "country": "Ecuador",
    "rationale": "Los márgenes glaciares ecuatoriales y detritos volcánicos permiten ensayos en interfaces de hielo y roca y movilidad en terreno frío.",
    "caveat": "El punto del flanco glaciar occidental está bajo la cumbre; el hielo templado y las rocas andesíticas y dacíticas difieren de las trampas frías lunares y del Marte basáltico."
  },
  "altar-crater-lake": {
    "name": "Laguna Amarilla y Cráter de El Altar",
    "country": "Ecuador",
    "rationale": "El anfiteatro volcánico modificado por glaciares y la Laguna Amarilla ofrecen análogos de sedimentación en cuencas y retroceso del hielo.",
    "caveat": "La erosión glaciar contribuye a la forma de la cuenca; el lago actual de deshielo no es un cráter de impacto ni prueba de un paleolago de tipo marciano."
  },
  "payunia-volcanic": {
    "name": "Campo Volcánico de La Payunia",
    "country": "Argentina",
    "rationale": "Las extensas coladas basálticas y conos de escoria permiten comparar volcanismo fisural planetario y recorridos por superficies rugosas.",
    "caveat": "El volcanismo regional incluye composiciones evolucionadas; el acceso a tubos no está verificado y la meteorización terrestre difiere del regolito lunar."
  },
  "salar-atacama-pajonales": {
    "name": "Salar de Pajonales - Región de Atacama",
    "country": "Chile",
    "rationale": "Las costras salinas con yeso y hábitats microbianos estudiados para buscar biofirmas ofrecen un análogo evaporítico de Marte.",
    "caveat": "Pajonales es un salar separado al sur del Salar de Atacama; sus microbios actuales y agua intermitente no implican vida en Marte."
  },
  "nevado-tres-cruces": {
    "name": "Flanco Volcánico Alto del Nevado Tres Cruces",
    "country": "Chile",
    "rationale": "Los detritos volcánicos fríos y áridos bajo las cumbres ofrecen escenarios de heladas y movilidad sobre regolito a gran altitud.",
    "caveat": "El punto representa el flanco occidental, no una cumbre ni las lagunas del parque; el permafrost es un supuesto que requiere validación en campo."
  },
  "tatacoa-badlands": {
    "name": "Tierras Erosionadas de Tatacoa",
    "country": "Colombia",
    "rationale": "Los estratos sedimentarios miocenos y cárcavas permiten ensayos de navegación en terreno estratificado y comparaciones de estratigrafía fluvial.",
    "caveat": "Tatacoa es un paisaje erosionado de bosque seco tropical, no un desierto hiperárido; la lluvia, fósiles y biología del suelo difieren del Marte actual."
  },
  "lencois-maranhenses": {
    "name": "Dunas Costeras de Lençóis Maranhenses",
    "country": "Brasil",
    "rationale": "Las dunas móviles de arena cuarzosa y lagunas interdunares permiten comparar formas eólicas y movilidad sobre arena seca y húmeda.",
    "caveat": "Este campo costero lluvioso no es un desierto; el cuarzo, agua dulce estacional y densidad del aire difieren de las dunas marcianas."
  },
  "pariaqaqa-permafrost": {
    "name": "Terreno Periglaciar de Pariaqaqa",
    "country": "Perú",
    "rationale": "El retroceso glaciar documentado y las morrenas de la cordillera de Pariacaca motivan escenarios de gelifracción y exploración de hielo y detritos.",
    "caveat": "El permafrost es un supuesto no medido, no una extensión local confirmada; los glaciares tropicales y el deshielo estacional difieren de los depósitos de hielo planetarios."
  },
  "poas-acid-crater": {
    "name": "Lago Cratérico Ácido del Poás",
    "country": "Costa Rica",
    "rationale": "Los fluidos ácidos y la alteración hidrotermal rica en azufre permiten comparaciones mineralógicas y de extremófilos con el Marte primitivo.",
    "caveat": "La extensión y química del lago varían con la actividad; gases corrosivos, erupciones y clima tropical húmedo limitan la transferencia operativa."
  },
  "kilauea-caldera": {
    "name": "Caldera Cimera del Kīlauea",
    "country": "Estados Unidos",
    "rationale": "Las estructuras de colapso y superficies basálticas permiten cartografía volcánica y comparaciones del emplazamiento de coladas planetarias.",
    "caveat": "Los respiraderos activos, gases y geometría cambiante impiden asumir terreno transitable; este punto de la caldera no localiza un tubo accesible."
  },
  "mount-etna": {
    "name": "Flanco Basáltico del Etna",
    "country": "Italia",
    "rationale": "Las coladas basálticas, tefra y conductos volcánicos ofrecen escenarios de movilidad de rovers y morfología de flujos planetarios.",
    "caveat": "El punto representa un flanco meridional alto, no la cumbre cambiante; la nieve, erupciones y acceso no verificado a tubos limitan las comparaciones."
  },
  "white-sands-gypsum": {
    "name": "Dunas de Yeso de White Sands",
    "country": "Estados Unidos",
    "rationale": "Las dunas de yeso conectan el aporte de sedimentos evaporíticos con el transporte eólico y permiten comparaciones con sulfatos marcianos.",
    "caveat": "El agua subterránea somera y los umbrales de viento terrestres afectan la cohesión; los hábitats y recursos arqueológicos protegidos limitan los ensayos."
  },
  "channeled-scablands": {
    "name": "Channeled Scablands - Dry Falls",
    "country": "Estados Unidos",
    "rationale": "Los canales de inundaciones glaciares catastróficas excavados en basalto permiten comparar procesos con los canales de desbordamiento marcianos.",
    "caveat": "La escala de inundación, gravedad y aporte sedimentario difieren de Marte; Dry Falls representa solo una parte de la red regional."
  },
  "wadi-rum": {
    "name": "Desierto de Arenisca de Wadi Rum",
    "country": "Jordania",
    "rationale": "Los acantilados de arenisca, fracturas y corredores de dunas permiten ensayos de navegación desértica y cartografía de afloramientos sedimentarios.",
    "caveat": "La meteorización de arenisca y el transporte eólico terrestre difieren de la geología basáltica marciana; el patrimonio cultural y paisaje protegido limitan los despliegues."
  },
  "makgadikgadi-pans": {
    "name": "Salares de Makgadikgadi",
    "country": "Botsuana",
    "rationale": "Los fondos de paleolagos, costras salinas e inundación estacional ofrecen análogos de cuencas evaporíticas y patrones de desecación.",
    "caveat": "Las inundaciones, fauna y sedimentos biológicamente activos difieren de los paleolagos secos marcianos; la resistencia de la costra varía mucho."
  },
  "lake-tyrrell": {
    "name": "Sedimentos Salinos del Lago Tyrrell",
    "country": "Australia",
    "rationale": "Los sedimentos hipersalinos y descargas subterráneas localmente ácidas ricas en hierro permiten estudios análogos de ciclos de hierro y azufre y biofirmas.",
    "caveat": "La acidez varía dentro del lago; los tapetes microbianos vivos, salmueras someras y clima templado no reproducen el Marte actual."
  },
  "sudbury-basin": {
    "name": "Cuenca de Impacto de Sudbury",
    "country": "Canadá",
    "rationale": "Las rocas antiguas de fusión por impacto y depósitos de cuenca permiten comparar diferenciación y alteración posteriores a grandes impactos.",
    "caveat": "La erosión, deformación tectónica, vegetación y minería ocultan el cráter original; no es una superficie intacta de cuenca lunar."
  },
  "ries-crater": {
    "name": "Cráter de Impacto de Nördlinger Ries",
    "country": "Alemania",
    "rationale": "Las brechas de impacto de suevita y la morfología conservada de la cuenca permiten comparar metamorfismo de choque y cartografía de eyecta.",
    "caveat": "Las rocas sedimentarias, depósitos lacustres posteriores y tierras cultivadas difieren de los mares lunares; el acceso a afloramientos requiere acuerdos locales."
  },
  "vredefort-dome": {
    "name": "Domo de Impacto de Vredefort",
    "country": "Sudáfrica",
    "rationale": "El levantamiento central erosionado y la corteza antigua chocada documentan deformación por grandes impactos relevante para interiores de cuencas planetarias.",
    "caveat": "El domo expone corteza profunda tras erosión prolongada; no es el borde original del cráter ni una cuenca intacta de tipo lunar."
  },
  "tassili-najjer": {
    "name": "Meseta de Arenisca de Tassili nAjjer",
    "country": "Argelia",
    "rationale": "Las mesetas erosionadas, arcos rocosos y valles secos permiten cartografía de terreno estratificado y planificación de rutas desérticas.",
    "caveat": "La erosión combina procesos de antiguos climas húmedos con aridez actual; la protección arqueológica y ecológica limita los ensayos."
  },
  "waw-an-namus": {
    "name": "Caldera Volcánica de Waw an Namus",
    "country": "Libia",
    "rationale": "La tefra basáltica oscura alrededor de una caldera sahariana ofrece análogos de transporte de ceniza y contraste espectral.",
    "caveat": "Hay lagos y vegetación de oasis dentro de la depresión; la edad volcánica y el acceso son inciertos, y los depósitos oscuros no demuestran tubos de lava."
  },
  "jeju-manjanggul": {
    "name": "Tubo de Lava Manjanggul de Jeju",
    "country": "Corea del Sur",
    "rationale": "El sistema documentado de tubos basálticos ofrece análogos de geometría de conductos, localización robótica y comunicaciones subterráneas.",
    "caveat": "La humedad, colonización biológica y acceso protegido limitan la comparación de refugios; la relevancia del tubo no implica que esté listo para ser un hábitat."
  },
  "undara-lava-tubes": {
    "name": "Sistema de Tubos de Lava de Undara",
    "country": "Australia",
    "rationale": "Los largos conductos basálticos con secciones de techo colapsado ofrecen análogos de geometría y navegación robótica en cuevas.",
    "caveat": "La humedad estacional, hábitats de murciélagos, vegetación y estabilidad del techo requieren evaluación; los supuestos de refugio no establecen idoneidad como hábitat lunar."
  },
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
  "lonar-crater": {
    name: "Cráter de Meteorito Lonar (Basaltos del Decán)",
    country: "India",
    rationale:
      "Uno de los únicos cráteres de impacto de meteorito en roca basáltica pura de la Tierra; análogo directo e insustituible para el estudio de impactos y eyecciones en los mares lunares y planicies de Marte.",
    caveat:
      "El fondo del cráter alberga un lago salino alcalino y vegetación tropical que no existen en la Luna; el régimen monzónico altera la meteorización.",
  },
  "pilbara-craton": {
    name: "Cratón de Pilbara (Formaciones Arcaicas de 3.5 Ga)",
    country: "Australia",
    rationale:
      "Basaltos primitivos, formaciones de hierro bandeado y estromatolitos de 3,500 millones de años; análogo de referencia para el equipo de Perseverance en la búsqueda de biofirmas en Jezero.",
    caveat:
      "El cratón ha experimentado meteorización e hidrotermalismo terrestre prolongado durante miles de millones de años.",
  },
  "cono-de-arita": {
    name: "Cono de Arita y Salar de Arizaro (Puna)",
    country: "Argentina",
    rationale:
      "Estructura cónica de arenisca en medio de un salar hiperárido a 3,750 m s.n.m.; análogo para el transporte eólico de sedimentos, evaporitas y dunas en Marte.",
    caveat:
      "La colina es de origen sedimentario según la NASA, no un cono volcánico activo; la presión atmosférica sigue siendo superior a la marciana.",
  },
  "danakil-erta-ale": {
    name: "Erta Ale y Cuenca Hidrotermal de Danakil",
    country: "Etiopía",
    rationale:
      "Lago de lava basáltica activa continua y manantiales hidrotermales hiperácidos; análogo para estudiar procesos volcánicos tempranos y extremófilos en Marte.",
    caveat:
      "Las temperaturas extremas y emanaciones de gases sulfurosos imponen severos límites operacionales para ensayos de campo.",
  },
  "mojave-pisgah": {
    name: "Cráter y Tubos de Lava Pisgah (Mojave)",
    country: "Estados Unidos",
    rationale:
      "Tubos de lava basáltica cuaternarios y conos de escoria utilizados por NASA JPL para la calibración de movilidad, ruedas y visión de rovers marcianos.",
    caveat:
      "El basalto reciente carece de la gruesa capa de regolito lunar; el polvo terrestre posee distinta composición electrostática.",
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
