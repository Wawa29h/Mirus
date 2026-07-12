const PRIMARY_ZONES = ["Occidente", "Centro", "Oriente", "Costa"];

const PLACE_ZONES = {
  "lago-coatepeque": ["Occidente"],
  "el-boqueron": ["Centro", "Parque Nacional"],
  "playa-el-tunco": ["Costa"],
  "playa-el-zonte": ["Costa"],
  "ruta-flores": ["Occidente", "Ruta de las Flores"],
  juayua: ["Occidente", "Ruta de las Flores"],
  "joya-ceren": ["Occidente", "Centro"],
  suchitoto: ["Oriente", "Centro"],
  tazumal: ["Occidente"],
  "cascada-tercios": ["Occidente", "Ruta de las Flores"],
  "parque-imposible": ["Occidente", "Parque Nacional"],
  "restaurante-chorros": ["Centro"],
  "pupuseria-ceiba": ["Centro"],
  "cerro-verde": ["Occidente", "Parque Nacional"],
  "playa-costa-sol": ["Costa"],
  "lago-ilopango": ["Centro", "Oriente"],
  "san-andres": ["Occidente"],
  nahuizalco: ["Occidente", "Ruta de las Flores"],
  "surf-city": ["Costa"],
  "cafe-talnamica": ["Occidente", "Ruta de las Flores"],
};

const NAME_TO_PLACE_ID = {
  "pupuserÃ­a la ceiba": "pupuseria-ceiba",
  tazumal: "tazumal",
  "playa el tunco": "playa-el-tunco",
  "joya de cerÃ©n": "joya-ceren",
  "lago de coatepeque": "lago-coatepeque",
  "san andrÃ©s": "san-andres",
  "playa el zonte": "playa-el-zonte",
  "el boquerÃ³n": "el-boqueron",
  "cafÃ© talnamica": "cafe-talnamica",
  "centro histÃ³rico de suchitoto": "suchitoto",
  "cascada los tercios": "cascada-tercios",
  "ruta de las flores": "ruta-flores",
  juayÃºa: "juayua",
  "playa costa del sol": "playa-costa-sol",
  "lago de ilopango": "lago-ilopango",
  "cerro verde": "cerro-verde",
  "parque nacional el imposible": "parque-imposible",
  "surf city": "surf-city",
  nahuizalco: "nahuizalco",
};

const LOCATION_ZONE_HINTS = [
  { pattern: /santa ana|ahuachap[Ã¡a]n|sonsonate|metap[Ã¡a]n|ataco|juayua|nahuizalco/i, zones: ["Occidente", "Ruta de las Flores"] },
  { pattern: /san salvador|cuscatl[Ã¡a]n|la libertad centro|antiguo cuscatl[Ã¡a]n|apopa|soyapango|ilopango/i, zones: ["Centro"] },
  { pattern: /suchitoto|san miguel|moraz[Ã¡a]n|usulut[Ã¡a]n|la uni[Ã³o]n|berl[iÃ­]n|perqu[iÃ­]n/i, zones: ["Oriente"] },
  { pattern: /la libertad|costa del sol|el tunco|el zonte|el sunzal|surf city|playa/i, zones: ["Costa"] },
];

const NEWSDATA_API_ENDPOINT = "https://newsdata.io/api/1/latest";
const NEWSDATA_API_KEY_STORAGE = "twinmap-newsdata-api-key";
const NEWSDATA_FALLBACK_API_KEY = "pub_d8b03bdf6f384468b9474b71221c5f64";
const NEWSDATA_DEFAULT_QUERY = "El Salvador turismo emergencia";

const newsState = {
  searchQuery: "",
  activeChip: null,
  expandedId: null,
  rssItems: [],
  rssStatus: "idle",
  rssError: null,
  iframeStatus: "idle",
  fetchToken: 0,
};

const EMERGENCY_NUMBERS = [
  {
    id: "pnc",
    label: "Policia Nacional Civil",
    number: "911",
    description: "Atencion inmediata ante delitos, violencia, amenazas o riesgo para la seguridad.",
    icon: "PNC",
  },
  {
    id: "sem",
    label: "Sistema de Emergencias Medicas",
    number: "132",
    description: "Asistencia prehospitalaria y coordinacion de ambulancias para emergencias medicas.",
    icon: "SEM",
  },
  {
    id: "bomberos",
    label: "Cuerpo de Bomberos",
    number: "913",
    description: "Incendios, rescates, fugas, accidentes estructurales y emergencias con riesgo fisico.",
    icon: "913",
  },
  {
    id: "proteccion-civil",
    label: "Proteccion Civil",
    number: "2201-2424",
    description: "Alertas, evacuaciones, gestion de riesgos y apoyo ante desastres naturales.",
    icon: "PC",
  },
  {
    id: "comandos",
    label: "Comandos de Salvamento",
    number: "2133-0000",
    description: "Rescate, primeros auxilios, ambulancias y apoyo en accidentes de transito.",
    icon: "CS",
  },
  {
    id: "cruz-roja",
    label: "Cruz Roja Salvadorena",
    number: "2239-4930",
    description: "Servicios humanitarios, ambulancias, rescate y atencion de emergencias.",
    icon: "CR",
  },
  {
    id: "cruz-verde",
    label: "Cruz Verde Salvadorena",
    number: "2284-5792",
    description: "Atencion prehospitalaria, traslados, primeros auxilios y rescate comunitario.",
    icon: "CV",
  },
];

const MOCK_NEWS = [
  {
    id: "n1",
    title: "Carretera a Santa Ana con reducciÃ³n de carriles por mantenimiento",
    summary: "Trabajos entre El Congo y Coatepeque. Tiempo extra estimado: 25 min.",
    zone: "Occidente",
    publishedAt: Date.now() - 45 * 60 * 1000,
    severity: "alerta",
    source: "VMT El Salvador",
    url: "#",
    places: ["Santa Ana", "Coatepeque"],
  },
  {
    id: "n2",
    title: "Feria gastronÃ³mica de fin de semana en JuayÃºa",
    summary: "MÃ¡s de 40 puestos locales en el parque central desde las 8:00.",
    zone: "Occidente",
    publishedAt: Date.now() - 2 * 60 * 60 * 1000,
    severity: "info",
    source: "MITUR",
    url: "#",
    places: ["JuayÃºa", "Ruta de las Flores"],
  },
  {
    id: "n3",
    title: "Condiciones de surf favorables en La Libertad",
    summary: "Olas de 1.2 a 1.8 m en El Tunco y El Zonte. PrecauciÃ³n en corrientes.",
    zone: "Costa",
    publishedAt: Date.now() - 90 * 60 * 1000,
    severity: "info",
    source: "Surf Report SV",
    url: "#",
    places: ["La Libertad", "El Tunco", "El Zonte"],
  },
  {
    id: "n4",
    title: "Cierre temporal de sendero en El BoquerÃ³n por neblina densa",
    summary: "Parque Nacional San Salvador reabrirÃ¡ miradores cuando mejore visibilidad.",
    zone: "Centro",
    publishedAt: Date.now() - 35 * 60 * 1000,
    severity: "alerta",
    source: "MARN",
    url: "#",
    places: ["El BoquerÃ³n", "San Salvador"],
  },
  {
    id: "n5",
    title: "Festival cultural nocturno en Suchitoto",
    summary: "Actividades en el malecÃ³n del lago hasta las 22:00. TrÃ¡fico lento en accesos.",
    zone: "Oriente",
    publishedAt: Date.now() - 4 * 60 * 60 * 1000,
    severity: "info",
    source: "AlcaldÃ­a de Suchitoto",
    url: "#",
    places: ["Suchitoto"],
  },
  {
    id: "n6",
    title: "Lluvias aisladas en la zona central esta tarde",
    summary: "Probabilidad de aguaceros breves en San Salvador y alrededores.",
    zone: "Centro",
    publishedAt: Date.now() - 20 * 60 * 1000,
    severity: "alerta",
    source: "SNET",
    url: "#",
    places: ["San Salvador"],
  },
  {
    id: "n7",
    title: "Operativo de seguridad reforzado en Ruta de las Flores",
    summary: "PNC refuerza patrullaje en JuayÃºa, Nahuizalco y Ataco durante temporada alta.",
    zone: "Occidente",
    publishedAt: Date.now() - 6 * 60 * 60 * 1000,
    severity: "info",
    source: "PNC",
    url: "#",
    places: ["JuayÃºa", "Nahuizalco", "Ataco", "Ruta de las Flores"],
  },
  {
    id: "n8",
    title: "Marea alta en playas del PacÃ­fico",
    summary: "PrecauciÃ³n para baÃ±istas en Costa del Sol y Surf City entre 14:00 y 18:00.",
    zone: "Costa",
    publishedAt: Date.now() - 55 * 60 * 1000,
    severity: "alerta",
    source: "MARN",
    url: "#",
    places: ["Costa del Sol", "Surf City"],
  },
  {
    id: "n9",
    title: "Nuevo horario de visitas en Joya de CerÃ©n",
    summary: "Ãšltimo ingreso a las 16:00 de martes a domingo.",
    zone: "Centro",
    publishedAt: Date.now() - 8 * 60 * 60 * 1000,
    severity: "info",
    source: "CONCULTURA",
    url: "#",
    places: ["Joya de CerÃ©n"],
  },
  {
    id: "n10",
    title: "RestauraciÃ³n de calles en San Miguel centro",
    summary: "DesvÃ­os por trabajos en 4a Avenida Norte hasta el viernes.",
    zone: "Oriente",
    publishedAt: Date.now() - 3 * 60 * 60 * 1000,
    severity: "alerta",
    source: "AlcaldÃ­a de San Miguel",
    url: "#",
    places: ["San Miguel"],
  },
  {
    id: "n11",
    title: "Avistamiento de aves migratorias en Parque El Imposible",
    summary: "GuÃ­as locales recomiendan visitas temprano para observaciÃ³n.",
    zone: "Occidente",
    publishedAt: Date.now() - 12 * 60 * 60 * 1000,
    severity: "info",
    source: "EcoTour SV",
    url: "#",
    places: ["Parque El Imposible", "AhuachapÃ¡n"],
  },
  {
    id: "n12",
    title: "Plan Piloto 911 amplÃ­a cobertura en zonas turÃ­sticas",
    summary: "Respuesta unificada disponible en La Libertad, Santa Ana y Suchitoto.",
    zone: "Centro",
    publishedAt: Date.now() - 24 * 60 * 60 * 1000,
    severity: "info",
    source: "Presidencia SV",
    url: "#",
    places: ["La Libertad", "Santa Ana", "Suchitoto"],
  },
  {
    id: "n13",
    title: "Alerta amarilla por calor en la costa",
    summary: "Ãndice UV alto. HidrataciÃ³n y sombra recomendadas en playas.",
    zone: "Costa",
    publishedAt: Date.now() - 70 * 60 * 1000,
    severity: "alerta",
    source: "Ministerio de Medio Ambiente",
    url: "#",
    places: ["La Libertad", "El Tunco"],
  },
  {
    id: "n14",
    title: "Mercado de artesanÃ­as en Nahuizalco",
    summary: "Productos locales y cafÃ© de altura cada sÃ¡bado en la plaza.",
    zone: "Occidente",
    publishedAt: Date.now() - 5 * 60 * 60 * 1000,
    severity: "info",
    source: "MITUR",
    url: "#",
    places: ["Nahuizalco"],
  },
  {
    id: "n15",
    title: "ActualizaciÃ³n de rutas de buses hacia Lago de Coatepeque",
    summary: "Ruta 201 amplia frecuencia los fines de semana desde Santa Ana.",
    zone: "Occidente",
    publishedAt: Date.now() - 7 * 60 * 60 * 1000,
    severity: "info",
    source: "VMT El Salvador",
    url: "#",
    places: ["Lago de Coatepeque", "Santa Ana"],
  },
  {
    id: "n16",
    title: "Recomendaciones de viaje para turistas en El Salvador",
    summary: "Registra tu itinerario y guarda contactos de emergencia antes de salir.",
    zone: "Nacional",
    publishedAt: Date.now() - 10 * 60 * 60 * 1000,
    severity: "info",
    source: "Twinmap",
    url: "#",
    places: ["El Salvador"],
  },
  {
    id: "n17",
    title: "Semana de patrimonio en sitios arqueolÃ³gicos",
    summary: "Entrada con descuento en Tazumal y San AndrÃ©s durante julio.",
    zone: "Occidente",
    publishedAt: Date.now() - 18 * 60 * 60 * 1000,
    severity: "info",
    source: "CONCULTURA",
    url: "#",
    places: ["Tazumal", "San AndrÃ©s", "Santa Ana"],
  },
  {
    id: "n18",
    title: "Actividad sÃ­smica leve registrada en UsulutÃ¡n",
    summary: "Sin daÃ±os reportados. Servicios normales en la zona oriental.",
    zone: "Oriente",
    publishedAt: Date.now() - 9 * 60 * 60 * 1000,
    severity: "alerta",
    source: "MARN",
    url: "#",
    places: ["UsulutÃ¡n"],
  },
];

const numbersEl = document.getElementById("emergencia-numbers");
const noticiasEl = document.getElementById("emergencia-noticias");
const zonesSummaryEl = document.getElementById("emergencia-zones-summary");
const zonesChipsEl = document.getElementById("emergencia-zones-chips");
const searchFormEl = document.getElementById("emergencia-noticias-search-form");
const searchInputEl = document.getElementById("emergencia-noticias-search-input");
const suggestionsEl = document.getElementById("emergencia-places-suggestions");

let searchListenersBound = false;
let searchDebounceTimer = null;

function normalizeName(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeZone(zone) {
  const value = (zone || "").trim();
  if (!value) return null;

  const lower = normalizeName(value);
  if (lower === "nacional") return "Nacional";

  const match = PRIMARY_ZONES.find((item) => normalizeName(item) === lower);
  if (match) return match;

  if (lower.includes("flores")) return "Occidente";
  if (lower.includes("parque")) return "Centro";

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function zonesFromPlaceId(placeId) {
  if (!placeId) return [];
  return PLACE_ZONES[placeId] || [];
}

function zonesFromPlaceName(name) {
  const id = NAME_TO_PLACE_ID[normalizeName(name)];
  if (id) return zonesFromPlaceId(id);

  const pool = window.TwinmapAventuraRoute?.getPlaces?.() || [];
  const match = pool.find((place) => normalizeName(place.name) === normalizeName(name));
  if (match) return zonesFromPlaceId(match.id);

  return [];
}

function zonesFromLocation(location) {
  const text = location || "";
  for (const hint of LOCATION_ZONE_HINTS) {
    if (hint.pattern.test(text)) return [...hint.zones];
  }
  return [];
}

function collectZonesFromPlaceLike(place) {
  const zones = new Set();

  if (place.id) {
    zonesFromPlaceId(place.id).forEach((zone) => zones.add(normalizeZone(zone)));
  }

  zonesFromPlaceName(place.name).forEach((zone) => zones.add(normalizeZone(zone)));

  if (place.location) {
    zonesFromLocation(place.location).forEach((zone) => zones.add(normalizeZone(zone)));
  }

  return [...zones].filter(Boolean);
}

function getSavedMode() {
  return sessionStorage.getItem("twinmap-mode") || "ruta";
}

function getRouteModePlaces() {
  const itinerary = window.TwinmapRoute?.getRouteItems?.() || [];

  if (itinerary.length > 0) {
    return itinerary;
  }

  const perfectRoute = window.TwinmapPersonalizado?.getPerfectRoute?.({ respectFilters: false }) || [];
  return perfectRoute.map((entry) => entry.place).filter(Boolean);
}

function getActiveRoutePlaces() {
  if (getSavedMode() === "aventura") {
    return window.TwinmapAventuraRoute?.getCurrentRoute?.() || [];
  }
  return getRouteModePlaces();
}

function getActiveRouteZones() {
  const places = getActiveRoutePlaces();
  const zones = new Set();

  places.forEach((place) => {
    collectZonesFromPlaceLike(place).forEach((zone) => zones.add(zone));
  });

  return [...zones];
}

function getPlaceCatalog() {
  const catalog = new Map();

  Object.keys(NAME_TO_PLACE_ID).forEach((name) => {
    const label = name.charAt(0).toUpperCase() + name.slice(1);
    catalog.set(normalizeName(name), label);
  });

  (window.TwinmapAventuraRoute?.getPlaces?.() || []).forEach((place) => {
    catalog.set(normalizeName(place.name), place.name);
    if (place.location) {
      const city = place.location.split(",")[0]?.trim();
      if (city) catalog.set(normalizeName(city), city);
    }
  });

  getActiveRoutePlaces().forEach((place) => {
    if (place?.name) catalog.set(normalizeName(place.name), place.name);
    if (place?.location) {
      const city = place.location.split(",")[0]?.trim();
      if (city) catalog.set(normalizeName(city), city);
    }
  });

  return [...catalog.values()].sort((a, b) => a.localeCompare(b, "es"));
}

function renderPlaceSuggestions() {
  if (!suggestionsEl) return;

  const places = getPlaceCatalog();
  suggestionsEl.innerHTML = places.map((place) => `<option value="${escapeHtml(place)}"></option>`).join("");
}

function getEffectiveSearchQuery() {
  if (newsState.activeChip) return newsState.activeChip;
  return newsState.searchQuery.trim();
}

function getNewsQueryContext(places, zones) {
  const effectiveQuery = getEffectiveSearchQuery();
  if (effectiveQuery) return effectiveQuery;

  if (places.length) {
    return places
      .map((place) => place.name)
      .filter(Boolean)
      .slice(0, 3)
      .join(" ");
  }

  if (zones.length) return `${zones[0]} El Salvador`;
  return "El Salvador noticias";
}

function getNewsDataApiKey() {
  return (
    window.TWINMAP_NEWSDATA_API_KEY ||
    localStorage.getItem(NEWSDATA_API_KEY_STORAGE) ||
    NEWSDATA_FALLBACK_API_KEY
  ).trim();
}

function buildNewsDataQuery(rawQuery) {
  const query = (rawQuery || "").trim();
  if (!query) return NEWSDATA_DEFAULT_QUERY;

  const normalized = normalizeName(query);
  if (normalized.includes("el salvador")) return query;

  return `${query} El Salvador`;
}

function buildNewsDataUrl(query) {
  const apiKey = getNewsDataApiKey();
  if (!apiKey) {
    throw new Error("Agrega tu API key de NewsData.io para activar noticias en vivo.");
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    q: buildNewsDataQuery(query),
    country: "sv",
    language: "es",
    size: "10",
  });

  return `${NEWSDATA_API_ENDPOINT}?${params.toString()}`;
}

function stripHtml(value) {
  const node = document.createElement("div");
  node.innerHTML = value || "";
  return node.textContent || "";
}

function inferNewsDataZone(item, query) {
  const text = [item.title, item.description, item.content, query].filter(Boolean).join(" ");
  const match = LOCATION_ZONE_HINTS.find((hint) => hint.pattern.test(text));
  return match?.zones?.[0] || "NewsData.io";
}

function mapNewsDataItem(item, index, query) {
  const title = item.title?.trim() || "Noticia sin titulo";
  const publishedAt = item.pubDate ? new Date(item.pubDate).getTime() : Date.now() - index * 60000;

  return {
    id: `newsdata-${item.article_id || item.link || index}`,
    title,
    summary: stripHtml(item.description || item.content || "Sin descripcion disponible.").trim(),
    zone: inferNewsDataZone(item, query),
    publishedAt: Number.isNaN(publishedAt) ? Date.now() - index * 60000 : publishedAt,
    severity: "info",
    source: item.source_name || item.source_id || "NewsData.io",
    url: item.link || "#",
    isLive: true,
    places: item.country || [],
  };
}

async function fetchNewsDataLatest(query) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(buildNewsDataUrl(query), { signal: controller.signal });
    window.clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`NewsData.io respondio ${response.status}`);
    }

    const data = await response.json();
    if (data.status !== "success") {
      throw new Error(data.results?.message || data.message || "NewsData.io no devolvio resultados.");
    }

    return (data.results || []).map((item, index) => mapNewsDataItem(item, index, query));
  } catch (error) {
    window.clearTimeout(timeoutId);
    throw error;
  }
}

function textMatchesQuery(text, query) {
  if (!query) return true;
  return normalizeName(text).includes(normalizeName(query));
}

function newsMatchesQuery(item, query) {
  if (!query) return true;

  const fields = [
    item.title,
    item.summary,
    item.zone,
    item.source,
    ...(item.places || []),
  ];

  return fields.some((field) => textMatchesQuery(field, query));
}

function filterNewsByZones(zones, query = "") {
  const effectiveQuery = query.trim();

  if (!zones.length && !effectiveQuery) {
    return MOCK_NEWS.filter((item) => item.zone === "Nacional").slice(0, 3);
  }

  let pool = MOCK_NEWS;

  if (zones.length) {
    const zoneSet = new Set(zones.map(normalizeZone));
    pool = pool.filter((item) => {
      const newsZone = normalizeZone(item.zone);
      return zoneSet.has(newsZone) || item.zone === "Nacional";
    });
  }

  if (effectiveQuery) {
    pool = pool.filter((item) => newsMatchesQuery(item, effectiveQuery));
  }

  return pool.sort((a, b) => b.publishedAt - a.publishedAt);
}

function mergeNewsItems(mockItems, rssItems) {
  const seen = new Set();
  const merged = [];

  [...rssItems, ...mockItems].forEach((item) => {
    const key = normalizeName(item.title);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(item);
  });

  return merged.sort((a, b) => b.publishedAt - a.publishedAt);
}

function formatRelativeTime(timestamp) {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "ahora mismo";
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderEmergencyNumbers() {
  if (!numbersEl) return;

  numbersEl.innerHTML = `
    <div class="emergencia-numbers-grid">
      ${EMERGENCY_NUMBERS.map(
        (entry) => `
        <a class="emergencia-number-card" href="tel:${entry.number.replace(/\D/g, "")}" aria-label="Llamar a ${escapeHtml(entry.label)}">
          <span class="emergencia-number-card__icon" aria-hidden="true">${entry.icon}</span>
          <div class="emergencia-number-card__body">
            <strong class="emergencia-number-card__label">${escapeHtml(entry.label)}</strong>
            <span class="emergencia-number-card__number">${escapeHtml(entry.number)}</span>
            <p class="emergencia-number-card__desc">${escapeHtml(entry.description)}</p>
          </div>
        </a>
      `,
      ).join("")}
    </div>
  `;
}

function renderFilterChips(places, zones) {
  if (!zonesChipsEl) return;

  const chips = [];

  places.forEach((place) => {
    if (!place?.name) return;
    chips.push({
      id: `place:${place.name}`,
      label: place.name,
      value: place.name,
      type: "place",
    });
  });

  zones.forEach((zone) => {
    chips.push({
      id: `zone:${zone}`,
      label: zone,
      value: zone,
      type: "zone",
    });
  });

  if (!chips.length) {
    zonesChipsEl.innerHTML = "";
    return;
  }

  zonesChipsEl.innerHTML = chips
    .map((chip) => {
      const isActive = newsState.activeChip === chip.value;
      return `
        <button
          type="button"
          class="emergencia-filter-chip${isActive ? " is-active" : ""}"
          data-chip-value="${escapeHtml(chip.value)}"
          data-chip-type="${chip.type}"
          role="listitem"
          aria-pressed="${isActive}"
        >${escapeHtml(chip.label)}</button>
      `;
    })
    .join("");

  zonesChipsEl.querySelectorAll("[data-chip-value]").forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.dataset.chipValue;
      newsState.activeChip = newsState.activeChip === value ? null : value;
      if (searchInputEl) {
        searchInputEl.value = newsState.activeChip || newsState.searchQuery;
      }
      refreshNewsContent();
    });
  });
}

function renderNewsCard(item) {
  const isExpanded = newsState.expandedId === item.id;
  const hasExternalUrl = item.url && item.url !== "#";
  const liveBadge = item.isLive
    ? '<span class="emergencia-noticia-card__live">En vivo</span>'
    : `<span class="emergencia-noticia-card__severity emergencia-noticia-card__severity--${item.severity}">
        ${item.severity === "alerta" ? "Alerta" : "Info"}
      </span>`;

  return `
    <article class="emergencia-noticia-card emergencia-noticia-card--${item.severity}${isExpanded ? " is-expanded" : ""}" data-news-id="${escapeHtml(item.id)}">
      <header class="emergencia-noticia-card__header">
        <span class="emergencia-noticia-card__zone">${escapeHtml(item.zone)}</span>
        ${liveBadge}
      </header>
      <div class="emergencia-noticia-card__title-row">
        <button class="emergencia-noticia-card__toggle" type="button" data-news-toggle="${escapeHtml(item.id)}">
          <span class="emergencia-noticia-card__title-text">${escapeHtml(item.title)}</span>
        </button>
        ${
          hasExternalUrl
            ? `<a
                class="emergencia-noticia-card__external"
                href="${escapeHtml(item.url)}"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir noticia en nueva pestaÃ±a"
                title="Abrir en nueva pestaÃ±a"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3zM5 5h7v2H7v10h10v-5h2v7H5V5z"/>
                </svg>
              </a>`
            : ""
        }
      </div>
      <p class="emergencia-noticia-card__summary">${escapeHtml(item.summary)}</p>
      ${
        isExpanded
          ? `<div class="emergencia-noticia-card__detail">
              <p>${escapeHtml(item.summary)}</p>
              ${
                hasExternalUrl
                  ? `<p class="emergencia-noticia-card__detail-link">
                      <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Ver fuente completa â†—</a>
                    </p>`
                  : ""
              }
            </div>`
          : ""
      }
      <footer class="emergencia-noticia-card__footer">
        <span>${escapeHtml(item.source)}</span>
        <time datetime="${new Date(item.publishedAt).toISOString()}">${formatRelativeTime(item.publishedAt)}</time>
      </footer>
    </article>
  `;
}

function renderNewsDataPanel(query) {
  const apiKey = getNewsDataApiKey();
  const queryLabel = buildNewsDataQuery(query);

  return `
    <section class="emergencia-google-news" aria-label="Integracion NewsData.io">
      <div class="emergencia-google-news__header">
        <h3>NewsData.io</h3>
        <span class="emergencia-google-news__query">${escapeHtml(queryLabel)}</span>
      </div>
      <div class="emergencia-google-news__frame-wrap emergencia-google-news__frame-wrap--info">
        <p class="emergencia-google-news__note">
          ${apiKey
            ? "Noticias en vivo activas con NewsData.io. Las tarjetas superiores combinan resultados reales con mocks locales."
            : "Configura tu API key para activar noticias en vivo. Mientras tanto se muestran noticias simuladas filtradas."}
        </p>
        <p class="emergencia-google-news__fallback">
          En consola: <code>localStorage.setItem("${NEWSDATA_API_KEY_STORAGE}", "TU_API_KEY")</code> y luego recarga la pagina.
        </p>
      </div>
    </section>
  `;
}

function renderRssStatus() {
  if (newsState.rssStatus === "loading") {
    return `<p class="emergencia-noticias-status">Cargando noticias en vivo desde NewsData.io...</p>`;
  }

  if (newsState.rssStatus === "error") {
    return `
      <p class="emergencia-noticias-status emergencia-noticias-status--warn">
        No se pudo conectar a NewsData.io (${escapeHtml(newsState.rssError || "error desconocido")}).
        Mostrando noticias locales filtradas.
      </p>
    `;
  }

  return "";
}

function bindNewsCardInteractions() {
  if (!noticiasEl) return;

  noticiasEl.querySelectorAll("[data-news-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.newsToggle;
      newsState.expandedId = newsState.expandedId === id ? null : id;
      refreshNewsContent({ preserveScroll: true });
    });
  });

  const iframe = noticiasEl.querySelector(".emergencia-google-news__iframe");
  const fallback = noticiasEl.querySelector(".emergencia-google-news__fallback");

  if (iframe && fallback) {
    const revealFallback = () => {
      fallback.hidden = false;
      iframe.classList.add("is-blocked");
    };

    iframe.addEventListener("error", revealFallback);
    window.setTimeout(() => {
      try {
        const doc = iframe.contentDocument;
        if (!doc || !doc.body || doc.body.childNodes.length === 0) {
          revealFallback();
        }
      } catch {
        /* cross-origin: el iframe cargÃ³ contenido externo */
      }
    }, 3500);
  }
}

function renderNewsContent({ places, zones, hasRoute, preserveScroll = false }) {
  if (!noticiasEl) return;

  const scrollTop = preserveScroll ? noticiasEl.scrollTop : 0;
  const effectiveQuery = getEffectiveSearchQuery();
  const newsQuery = getNewsQueryContext(places, zones);
  const hasSearch = Boolean(effectiveQuery);
  const mockNews = filterNewsByZones(hasSearch ? [] : zones, effectiveQuery);
  const mergedNews = mergeNewsItems(mockNews, newsState.rssItems);
  const showEmbed = hasSearch || hasRoute;

  if (zonesSummaryEl) {
    if (!hasRoute && !hasSearch) {
      zonesSummaryEl.textContent = "Sin ruta activa Â· busca un lugar";
    } else if (hasSearch) {
      zonesSummaryEl.textContent = `${mergedNews.length} resultado${mergedNews.length === 1 ? "" : "s"} Â· ${effectiveQuery}`;
    } else {
      zonesSummaryEl.textContent = `${mergedNews.length} alerta${mergedNews.length === 1 ? "" : "s"} Â· ${zones.length} zona${zones.length === 1 ? "" : "s"}`;
    }
  }

  if (!hasRoute && !hasSearch) {
    noticiasEl.innerHTML = `
      <div class="emergencia-noticias-empty">
        <p>Completa tu ruta o busca un lugar para ver noticias relevantes.</p>
        <p class="emergencia-noticias-empty__hint">
          Prueba <strong>Santa Ana</strong>, <strong>El Tunco</strong> o <strong>JuayÃºa</strong> en el buscador.
          TambiÃ©n puedes aÃ±adir paradas en <strong>Mi ruta</strong>.
        </p>
        <div class="emergencia-noticias-empty__actions">
          <button class="outline-button" type="button" data-view="mi-ruta">Ir a Mi ruta</button>
          <button class="outline-button" type="button" data-view="mapa-personalizado">Ver mapa personalizado</button>
        </div>
      </div>
    `;

    noticiasEl.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        window.TwinmapApp?.showView(button.dataset.view);
      });
    });
    return;
  }

  const cardsHtml = mergedNews.length
    ? `<div class="emergencia-noticias-grid">${mergedNews.map((item) => renderNewsCard(item)).join("")}</div>`
    : `
      <div class="emergencia-noticias-empty emergencia-noticias-empty--compact">
        <p>No hay noticias recientes para "${escapeHtml(effectiveQuery || "tu bÃºsqueda")}".</p>
        <p class="emergencia-noticias-empty__hint">Prueba otro lugar o revisa la configuracion de NewsData.io abajo.</p>
      </div>
    `;

  noticiasEl.innerHTML = `
    ${renderRssStatus()}
    ${cardsHtml}
    ${showEmbed ? renderNewsDataPanel(newsQuery) : ""}
  `;

  bindNewsCardInteractions();

  if (preserveScroll) {
    noticiasEl.scrollTop = scrollTop;
  }
}

async function refreshNewsContent(options = {}) {
  const places = getActiveRoutePlaces();
  const hasRoute = places.length > 0;
  const zones = getActiveRouteZones();
  const effectiveQuery = getEffectiveSearchQuery();
  const newsQuery = getNewsQueryContext(places, zones);

  renderFilterChips(places, zones);
  renderNewsContent({ places, zones, hasRoute, preserveScroll: options.preserveScroll });

  if (!effectiveQuery && !hasRoute) {
    newsState.rssItems = [];
    newsState.rssStatus = "idle";
    newsState.rssError = null;
    return;
  }

  const token = ++newsState.fetchToken;
  newsState.rssStatus = "loading";
  newsState.rssError = null;
  renderNewsContent({ places, zones, hasRoute, preserveScroll: true });

  try {
    const rssItems = await fetchNewsDataLatest(newsQuery);
    if (token !== newsState.fetchToken) return;

    newsState.rssItems = rssItems.slice(0, 12);
    newsState.rssStatus = "ok";
    newsState.rssError = null;
  } catch (error) {
    if (token !== newsState.fetchToken) return;

    newsState.rssItems = [];
    newsState.rssStatus = "error";
    newsState.rssError = error?.message || "Error de red";
  }

  renderNewsContent({ places, zones, hasRoute, preserveScroll: true });
}

function bindSearchInteractions() {
  if (searchListenersBound) return;
  searchListenersBound = true;

  if (searchFormEl) {
    searchFormEl.addEventListener("submit", (event) => {
      event.preventDefault();
      newsState.searchQuery = searchInputEl?.value?.trim() || "";
      newsState.activeChip = null;
      refreshNewsContent();
    });
  }

  if (searchInputEl) {
    searchInputEl.addEventListener("input", () => {
      window.clearTimeout(searchDebounceTimer);
      searchDebounceTimer = window.setTimeout(() => {
        newsState.searchQuery = searchInputEl.value.trim();
        if (newsState.activeChip && normalizeName(newsState.activeChip) !== normalizeName(newsState.searchQuery)) {
          newsState.activeChip = null;
        }
        refreshNewsContent();
      }, 400);
    });
  }
}

function refreshEmergenciaPanel() {
  renderEmergencyNumbers();
  renderPlaceSuggestions();
  bindSearchInteractions();

  if (searchInputEl && document.activeElement !== searchInputEl) {
    searchInputEl.value = newsState.activeChip || newsState.searchQuery;
  }

  refreshNewsContent();
}

window.TwinmapEmergencia = {
  refresh: refreshEmergenciaPanel,
  getActiveRouteZones,
  filterNewsByZones,
};

refreshEmergenciaPanel();



