const AVENTURA_ROUTE_STORAGE_KEY = "twinmap-aventura-route";
const AVENTURA_ROUTE_COUNT = 5;

const AVENTURA_PLACES = [
  {
    id: "lago-coatepeque",
    name: "Lago de Coatepeque",
    category: "Naturaleza",
    categoryLabel: "Naturaleza",
    type: "lugar",
    location: "Santa Ana, El Salvador",
    description: "CrÃ¡ter volcÃ¡nico con aguas turquesas ideal para kayak, miradores y gastronomÃ­a en la orilla.",
    lat: 13.819,
    lng: -89.559,
    weather: "24Â°C Â· Parcialmente nublado",
    tags: {
      clima: ["fresco"],
      paisaje: ["volcan", "mezcla"],
      biodiversidad: ["bosques"],
      multitudes: ["equilibrio"],
      experiencia: ["naturaleza", "accion", "relajacion", "gastronomica"],
      entorno: ["montana", "mixto"],
      intensidad: ["intensa", "equilibrio"],
    },
  },
  {
    id: "el-boqueron",
    name: "El BoquerÃ³n",
    category: "VolcÃ¡n",
    categoryLabel: "VolcÃ¡n",
    type: "lugar",
    location: "San Salvador, El Salvador",
    description: "VolcÃ¡n activo con senderos, miradores y clima fresco sobre la capital.",
    lat: 13.734,
    lng: -89.287,
    weather: "19Â°C Â· Brisa fresca",
    tags: {
      clima: ["fresco"],
      paisaje: ["volcan"],
      biodiversidad: ["bosques", "tranquilo"],
      multitudes: ["intimo"],
      experiencia: ["naturaleza", "accion"],
      entorno: ["montana", "ciudad"],
      intensidad: ["intensa", "equilibrio"],
    },
  },
  {
    id: "playa-el-tunco",
    name: "Playa El Tunco",
    category: "Playa",
    categoryLabel: "Playa",
    type: "playa",
    location: "La Libertad, El Salvador",
    description: "Destino de surf, atardeceres y ambiente relajado en la costa del PacÃ­fico.",
    lat: 13.493,
    lng: -89.385,
    weather: "29Â°C Â· Soleado",
    tags: {
      clima: ["sol"],
      paisaje: ["playa"],
      biodiversidad: ["otras"],
      multitudes: ["vida"],
      experiencia: ["accion", "relajacion"],
      entorno: ["costa"],
      intensidad: ["intensa", "equilibrio"],
    },
  },
  {
    id: "playa-el-zonte",
    name: "Playa El Zonte",
    category: "Playa",
    categoryLabel: "Playa",
    type: "playa",
    location: "La Libertad, El Salvador",
    description: "Playa mÃ¡s tranquila con olas suaves, hostels y cafÃ©s frente al mar.",
    lat: 13.496,
    lng: -89.441,
    weather: "28Â°C Â· Soleado",
    tags: {
      clima: ["sol"],
      paisaje: ["playa"],
      biodiversidad: ["otras"],
      multitudes: ["intimo", "equilibrio"],
      experiencia: ["relajacion", "accion"],
      entorno: ["costa"],
      intensidad: ["suave", "equilibrio"],
    },
  },
  {
    id: "ruta-flores",
    name: "Ruta de las Flores",
    category: "Ruta",
    categoryLabel: "Ruta",
    type: "lugar",
    location: "Sonsonate, El Salvador",
    description: "Recorrido por pueblos, cafÃ©, artesanÃ­as y naturaleza en el occidente del paÃ­s.",
    lat: 13.749,
    lng: -89.714,
    weather: "23Â°C Â· Nublado ligero",
    tags: {
      clima: ["fresco", "adaptable"],
      paisaje: ["pueblo", "mezcla"],
      biodiversidad: ["bosques"],
      multitudes: ["equilibrio"],
      experiencia: ["naturaleza", "gastronomica", "monumentos", "relajacion"],
      entorno: ["pueblo", "montana", "mixto"],
      intensidad: ["suave", "equilibrio"],
    },
  },
  {
    id: "juayua",
    name: "JuayÃºa",
    category: "Pueblo",
    categoryLabel: "Pueblo",
    type: "lugar",
    location: "Sonsonate, El Salvador",
    description: "Pueblo de la Ruta de las Flores famoso por su feria gastronÃ³mica y cascadas cercanas.",
    lat: 13.717,
    lng: -89.745,
    weather: "22Â°C Â· Fresco",
    tags: {
      clima: ["fresco"],
      paisaje: ["pueblo", "cascada"],
      biodiversidad: ["tranquilo"],
      multitudes: ["vida", "equilibrio"],
      experiencia: ["gastronomica", "naturaleza", "monumentos"],
      entorno: ["pueblo", "montana"],
      intensidad: ["suave", "equilibrio"],
    },
  },
  {
    id: "joya-ceren",
    name: "Joya de CerÃ©n",
    category: "ArqueolÃ³gico",
    categoryLabel: "ArqueolÃ³gico",
    type: "lugar",
    location: "La Libertad, El Salvador",
    description: "Sitio arqueolÃ³gico Patrimonio de la Humanidad, conocido como la Pompeya de AmÃ©rica.",
    lat: 13.827,
    lng: -89.356,
    weather: "27Â°C Â· Calor moderado",
    tags: {
      clima: ["sol", "adaptable"],
      paisaje: ["pueblo"],
      biodiversidad: ["otras"],
      multitudes: ["intimo"],
      experiencia: ["arqueologica", "monumentos"],
      entorno: ["pueblo", "mixto"],
      intensidad: ["suave"],
    },
  },
  {
    id: "suchitoto",
    name: "Suchitoto",
    category: "Ciudad",
    categoryLabel: "Ciudad",
    type: "lugar",
    location: "CuscatlÃ¡n, El Salvador",
    description: "Pueblo colonial con calles empedradas, arte y vistas al lago SuchitlÃ¡n.",
    lat: 13.978,
    lng: -89.028,
    weather: "26Â°C Â· Soleado",
    tags: {
      clima: ["adaptable"],
      paisaje: ["pueblo"],
      biodiversidad: ["tranquilo"],
      multitudes: ["equilibrio"],
      experiencia: ["monumentos", "relajacion", "gastronomica"],
      entorno: ["pueblo", "ciudad"],
      intensidad: ["suave", "equilibrio"],
    },
  },
  {
    id: "tazumal",
    name: "Tazumal",
    category: "ArqueolÃ³gico",
    categoryLabel: "ArqueolÃ³gico",
    type: "lugar",
    location: "Chalchuapa, Santa Ana",
    description: "Complejo maya con estructuras impresionantes y museo arqueolÃ³gico.",
    lat: 13.979,
    lng: -89.674,
    weather: "25Â°C Â· Soleado",
    tags: {
      clima: ["adaptable"],
      paisaje: ["pueblo"],
      biodiversidad: ["otras"],
      multitudes: ["intimo"],
      experiencia: ["arqueologica", "monumentos"],
      entorno: ["pueblo"],
      intensidad: ["suave"],
    },
  },
  {
    id: "cascada-tercios",
    name: "Cascada Los Tercios",
    category: "Naturaleza",
    categoryLabel: "Naturaleza",
    type: "lugar",
    location: "JuayÃºa, Sonsonate",
    description: "Cascada de columnas basÃ¡lticas en sendero verde del occidente.",
    lat: 13.704,
    lng: -89.752,
    weather: "21Â°C Â· Fresco",
    tags: {
      clima: ["fresco"],
      paisaje: ["cascada"],
      biodiversidad: ["bosques", "fauna"],
      multitudes: ["intimo"],
      experiencia: ["naturaleza", "accion"],
      entorno: ["montana"],
      intensidad: ["intensa", "equilibrio"],
    },
  },
  {
    id: "parque-imposible",
    name: "Parque Nacional El Imposible",
    category: "Naturaleza",
    categoryLabel: "Naturaleza",
    type: "lugar",
    location: "AhuachapÃ¡n, El Salvador",
    description: "Reserva con bosque nuboso, aves endÃ©micas y senderos de biodiversidad.",
    lat: 13.817,
    lng: -89.871,
    weather: "20Â°C Â· Brisa fresca",
    tags: {
      clima: ["fresco"],
      paisaje: ["cascada", "mezcla"],
      biodiversidad: ["fauna", "bosques"],
      multitudes: ["intimo"],
      experiencia: ["naturaleza", "accion"],
      entorno: ["montana"],
      intensidad: ["intensa"],
    },
  },
  {
    id: "restaurante-chorros",
    name: "Restaurante Los Chorros",
    category: "Restaurante",
    categoryLabel: "Restaurante",
    type: "restaurante",
    location: "Santa Tecla, La Libertad",
    description: "Comida tÃ­pica salvadoreÃ±a junto a cascadas naturales y Ã¡reas verdes.",
    lat: 13.676,
    lng: -89.279,
    weather: "24Â°C Â· Fresco",
    tags: {
      clima: ["fresco", "adaptable"],
      paisaje: ["cascada", "pueblo"],
      biodiversidad: ["tranquilo"],
      multitudes: ["equilibrio"],
      experiencia: ["gastronomica", "relajacion", "naturaleza"],
      entorno: ["ciudad", "montana"],
      intensidad: ["suave"],
    },
  },
  {
    id: "pupuseria-ceiba",
    name: "PupuserÃ­a La Ceiba",
    category: "Restaurante",
    categoryLabel: "Restaurante",
    type: "restaurante",
    location: "San Salvador, El Salvador",
    description: "Pupusas artesanales y ambiente local en el corazÃ³n de la capital.",
    lat: 13.692,
    lng: -89.218,
    weather: "26Â°C Â· Soleado",
    tags: {
      clima: ["adaptable"],
      paisaje: ["pueblo"],
      biodiversidad: ["otras"],
      multitudes: ["vida"],
      experiencia: ["gastronomica"],
      entorno: ["ciudad"],
      intensidad: ["suave"],
    },
  },
  {
    id: "cerro-verde",
    name: "Cerro Verde",
    category: "VolcÃ¡n",
    categoryLabel: "VolcÃ¡n",
    type: "lugar",
    location: "Santa Ana, El Salvador",
    description: "Parque nacional con miradores, neblina y vistas a volcanes vecinos.",
    lat: 13.832,
    lng: -89.626,
    weather: "18Â°C Â· Neblina",
    tags: {
      clima: ["fresco"],
      paisaje: ["volcan"],
      biodiversidad: ["fauna", "bosques"],
      multitudes: ["intimo"],
      experiencia: ["naturaleza", "accion", "relajacion"],
      entorno: ["montana"],
      intensidad: ["suave", "equilibrio"],
    },
  },
  {
    id: "playa-costa-sol",
    name: "Playa Costa del Sol",
    category: "Playa",
    categoryLabel: "Playa",
    type: "playa",
    location: "La Paz, El Salvador",
    description: "Playa familiar con resorts, mariscos y aguas cÃ¡lidas del PacÃ­fico.",
    lat: 13.345,
    lng: -88.988,
    weather: "30Â°C Â· Soleado",
    tags: {
      clima: ["sol"],
      paisaje: ["playa"],
      biodiversidad: ["otras"],
      multitudes: ["vida"],
      experiencia: ["relajacion", "gastronomica"],
      entorno: ["costa"],
      intensidad: ["suave"],
    },
  },
  {
    id: "lago-ilopango",
    name: "Lago de Ilopango",
    category: "Naturaleza",
    categoryLabel: "Naturaleza",
    type: "lugar",
    location: "San Salvador, El Salvador",
    description: "Lago volcÃ¡nico para kayak, veleros y atardeceres cerca de la capital.",
    lat: 13.672,
    lng: -89.056,
    weather: "27Â°C Â· Soleado",
    tags: {
      clima: ["sol", "adaptable"],
      paisaje: ["volcan", "mezcla"],
      biodiversidad: ["tranquilo"],
      multitudes: ["equilibrio"],
      experiencia: ["naturaleza", "accion", "relajacion"],
      entorno: ["ciudad", "mixto"],
      intensidad: ["intensa", "equilibrio"],
    },
  },
  {
    id: "san-andres",
    name: "San AndrÃ©s",
    category: "ArqueolÃ³gico",
    categoryLabel: "ArqueolÃ³gico",
    type: "lugar",
    location: "San AndrÃ©s, Santa Ana",
    description: "Sitio arqueolÃ³gico con acrÃ³polis maya y museo de sitio.",
    lat: 13.797,
    lng: -89.629,
    weather: "25Â°C Â· Soleado",
    tags: {
      clima: ["adaptable"],
      paisaje: ["pueblo"],
      biodiversidad: ["otras"],
      multitudes: ["intimo"],
      experiencia: ["arqueologica", "monumentos"],
      entorno: ["pueblo", "mixto"],
      intensidad: ["suave"],
    },
  },
  {
    id: "nahuizalco",
    name: "Nahuizalco",
    category: "Pueblo",
    categoryLabel: "Pueblo",
    type: "lugar",
    location: "Sonsonate, El Salvador",
    description: "Pueblo artesanal de calles empedradas y cafÃ© de altura en la Ruta de las Flores.",
    lat: 13.777,
    lng: -89.737,
    weather: "22Â°C Â· Fresco",
    tags: {
      clima: ["fresco"],
      paisaje: ["pueblo"],
      biodiversidad: ["tranquilo"],
      multitudes: ["intimo"],
      experiencia: ["monumentos", "relajacion", "gastronomica"],
      entorno: ["pueblo"],
      intensidad: ["suave"],
    },
  },
  {
    id: "surf-city",
    name: "Surf City La Libertad",
    category: "Playa",
    categoryLabel: "Playa",
    type: "playa",
    location: "La Libertad, El Salvador",
    description: "MalecÃ³n, competencias de surf y vida nocturna en la costa.",
    lat: 13.488,
    lng: -89.324,
    weather: "29Â°C Â· Soleado",
    tags: {
      clima: ["sol"],
      paisaje: ["playa"],
      biodiversidad: ["otras"],
      multitudes: ["vida"],
      experiencia: ["accion", "gastronomica"],
      entorno: ["costa", "ciudad"],
      intensidad: ["intensa"],
    },
  },
  {
    id: "cafe-talnamica",
    name: "CafÃ© Talnamica",
    category: "Restaurante",
    categoryLabel: "Restaurante",
    type: "restaurante",
    location: "Nahuizalco, Sonsonate",
    description: "CafÃ© de especialidad y talleres de barismo en zona cafetalera.",
    lat: 13.781,
    lng: -89.741,
    weather: "21Â°C Â· Fresco",
    tags: {
      clima: ["fresco"],
      paisaje: ["pueblo"],
      biodiversidad: ["tranquilo"],
      multitudes: ["intimo", "equilibrio"],
      experiencia: ["gastronomica", "relajacion"],
      entorno: ["pueblo", "montana"],
      intensidad: ["suave"],
    },
  },
];

const QUIZ_EXPERIENCIA_MAP = {
  "AcciÃ³n y adrenalina": "accion",
  "RelajaciÃ³n y desconexiÃ³n": "relajacion",
  "GastronÃ³mica": "gastronomica",
  "ArqueolÃ³gica": "arqueologica",
  "Monumentos emblemÃ¡ticos": "monumentos",
  Naturaleza: "naturaleza",
};

const QUIZ_ESCENARIO_MAP = {
  "Playas y costa": "playa",
  "Volcanes y miradores": "volcan",
  "Cascadas y senderos verdes": "cascada",
  "Pueblos y calles con historia": "pueblo",
  "Me gusta mezclar de todo": "mezcla",
};

const QUIZ_ENTORNO_MAP = {
  "Ciudad y ritmo urbano": "ciudad",
  "Costa o cerca del mar": "costa",
  "MontaÃ±a o zona rural": "montana",
  "Pueblo con historia": "pueblo",
  "Un poco de todo": "mixto",
};

const QUIZ_INTENSIDAD_MAP = {
  "Intensa: caminar, surfear, explorar sin parar": "intensa",
  "Suave: pausas, vistas y buen cafÃ©": "suave",
  "Un equilibrio entre ambos": "equilibrio",
};

const QUIZ_AMBIENTE_MAP = {
  "Con vida, gente y buena energÃ­a": "vida",
  "Ãntimo, silencioso y sin prisa": "intimo",
  "Un equilibrio entre ambos": "equilibrio",
};

const mapCanvasEl = document.getElementById("aventura-map-canvas");
const routeLineEl = document.getElementById("aventura-route-line");
const routeListEl = document.getElementById("aventura-route-list");
const routeSummaryEl = document.getElementById("aventura-route-summary");
const regenerateBtn = document.getElementById("aventura-regenerate-route");

const COORD_BOUNDS = { latMin: 13.15, latMax: 14.45, lngMin: -90.1, lngMax: -87.7 };

function coordsToPercent(lat, lng) {
  const x = ((lng - COORD_BOUNDS.lngMin) / (COORD_BOUNDS.lngMax - COORD_BOUNDS.lngMin)) * 100;
  const y = ((COORD_BOUNDS.latMax - lat) / (COORD_BOUNDS.latMax - COORD_BOUNDS.latMin)) * 100;
  return {
    left: `${Math.min(92, Math.max(8, x))}%`,
    top: `${Math.min(90, Math.max(10, y))}%`,
    x: Math.min(92, Math.max(8, x)),
    y: Math.min(90, Math.max(10, y)),
  };
}

function getQuizAnswers() {
  return window.TwinmapOnboarding?.getAnswers("aventura") || {};
}

function scorePlace(place, quiz) {
  let score = 1;
  const tags = place.tags || {};

  const experienciaTag = QUIZ_EXPERIENCIA_MAP[quiz.experiencia];
  if (experienciaTag && tags.experiencia?.includes(experienciaTag)) score += 5;

  const escenarioTag = QUIZ_ESCENARIO_MAP[quiz.escenario];
  if (
    escenarioTag &&
    (tags.paisaje?.includes(escenarioTag) || tags.paisaje?.includes("mezcla") || escenarioTag === "mezcla")
  ) {
    score += 4;
  }

  const intensidadTag = QUIZ_INTENSIDAD_MAP[quiz.intensidad];
  if (intensidadTag && tags.intensidad?.includes(intensidadTag)) score += 3;

  const entornoTag = QUIZ_ENTORNO_MAP[quiz.entorno];
  if (entornoTag && (tags.entorno?.includes(entornoTag) || tags.entorno?.includes("mixto"))) {
    score += 2;
  }

  const ambienteTag = QUIZ_AMBIENTE_MAP[quiz.ambiente];
  if (ambienteTag && tags.multitudes?.includes(ambienteTag)) score += 2;

  if (experienciaTag === "gastronomica" && place.type === "restaurante") score += 2;
  else if (place.type === "restaurante") score += 1;

  return score;
}

function getCompatiblePool(quiz, excludeIds = []) {
  const scored = AVENTURA_PLACES.map((place) => ({
    place,
    score: scorePlace(place, quiz),
  }))
    .filter((entry) => !excludeIds.includes(entry.place.id))
    .sort((a, b) => b.score - a.score);

  const threshold = scored.length ? Math.max(3, scored[Math.min(4, scored.length - 1)].score) : 0;
  const pool = scored.filter((entry) => entry.score >= threshold).map((entry) => entry.place);

  return pool.length >= AVENTURA_ROUTE_COUNT ? pool : AVENTURA_PLACES.filter((p) => !excludeIds.includes(p.id));
}

function shuffleArray(items) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function distance(a, b) {
  const dx = a.lng - b.lng;
  const dy = a.lat - b.lat;
  return Math.sqrt(dx * dx + dy * dy);
}

function orderRoutePlaces(places) {
  if (places.length <= 1) return places;

  const remaining = [...places];
  const ordered = [remaining.shift()];

  while (remaining.length) {
    const last = ordered[ordered.length - 1];
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    remaining.forEach((place, index) => {
      const dist = distance(last, place);
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestIndex = index;
      }
    });

    ordered.push(remaining.splice(nearestIndex, 1)[0]);
  }

  return ordered;
}

function pickRoutePlaces(quiz, { random = false, excludeIds = [] } = {}) {
  const pool = getCompatiblePool(quiz, excludeIds);
  const restaurants = pool.filter((place) => place.type === "restaurante");
  const others = pool.filter((place) => place.type !== "restaurante");

  let candidates = random ? shuffleArray(pool) : pool;
  const selected = [];

  if (restaurants.length) {
    selected.push(random ? restaurants[Math.floor(Math.random() * restaurants.length)] : restaurants[0]);
  }

  candidates = candidates.filter((place) => !selected.some((item) => item.id === place.id));

  for (const place of candidates) {
    if (selected.length >= AVENTURA_ROUTE_COUNT) break;
    selected.push(place);
  }

  while (selected.length < AVENTURA_ROUTE_COUNT) {
    const fallback = shuffleArray(AVENTURA_PLACES).find((place) => !selected.some((item) => item.id === place.id));
    if (!fallback) break;
    selected.push(fallback);
  }

  return orderRoutePlaces(selected);
}

function saveRoute(places) {
  localStorage.setItem(
    AVENTURA_ROUTE_STORAGE_KEY,
    JSON.stringify(places.map((place) => place.id)),
  );
}

function loadRouteIds() {
  try {
    const raw = localStorage.getItem(AVENTURA_ROUTE_STORAGE_KEY);
    if (!raw) return null;
    const ids = JSON.parse(raw);
    return Array.isArray(ids) ? ids : null;
  } catch {
    return null;
  }
}

function getRouteFromStorage(quiz) {
  const ids = loadRouteIds();
  if (!ids?.length) return null;

  const places = ids
    .map((id) => AVENTURA_PLACES.find((place) => place.id === id))
    .filter(Boolean);

  return places.length ? places : null;
}

function getOrCreateRoute({ forceNew = false, random = false } = {}) {
  const quiz = getQuizAnswers();

  if (!forceNew) {
    const stored = getRouteFromStorage(quiz);
    if (stored?.length) return stored;
  }

  const currentIds = loadRouteIds() || [];
  const places = pickRoutePlaces(quiz, { random, excludeIds: random ? currentIds : [] });
  saveRoute(places);
  return places;
}

function placeToPinAttrs(place) {
  return {
    "data-place-name": place.name,
    "data-place-category": place.category,
    "data-place-location": place.location,
    "data-place-description": place.description,
    "data-place-lat": String(place.lat),
    "data-place-lng": String(place.lng),
    "data-place-weather": place.weather,
    "data-place-id": place.id,
  };
}

function renderRouteLine(places) {
  if (!routeLineEl) return;

  if (!places.length) {
    routeLineEl.innerHTML = "";
    return;
  }

  const points = places.map((place) => coordsToPercent(place.lat, place.lng));
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  routeLineEl.innerHTML = `
    <svg class="aventura-route-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline class="aventura-route-path" points="${polyline}" />
    </svg>
  `;
}

function renderMapPins(places) {
  if (!mapCanvasEl) return;

  mapCanvasEl.querySelectorAll(".map-pin").forEach((pin) => pin.remove());

  places.forEach((place, index) => {
    const pos = coordsToPercent(place.lat, place.lng);
    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = `map-pin map-pin--icon aventura-map-pin aventura-map-pin--${place.type}`;
    pin.style.left = pos.left;
    pin.style.top = pos.top;
    window.TwinmapCategoryImages?.applyPinIcon?.(pin, place.categoryLabel || place.category, place.type);
    pin.setAttribute("aria-label", `${index + 1}. ${place.name}`);
    pin.dataset.routeOrder = String(index + 1);

    Object.entries(placeToPinAttrs(place)).forEach(([key, value]) => {
      pin.setAttribute(key, value);
    });

    mapCanvasEl.appendChild(pin);
  });

  window.TwinmapCategoryImages?.prepareIconAssets?.().then(() => {
    window.TwinmapCategoryImages?.refreshPinIcons?.(mapCanvasEl);
  });

  window.TwinmapPlacePopup?.bindPins(mapCanvasEl);
}

function renderRouteList(places) {
  if (!routeListEl) return;

  if (!places.length) {
    routeListEl.innerHTML = '<p class="aventura-route-empty">No hay paradas en tu ruta.</p>';
    return;
  }

  routeListEl.innerHTML = `
    <ol class="route-itinerary__list aventura-route-stops">
      ${places
        .map(
          (place, index) => `
        <li class="route-itinerary__item aventura-route-stop" data-place-id="${place.id}">
          <span class="route-itinerary__order" aria-hidden="true">${index + 1}</span>
          <div class="route-itinerary__body">
            <span class="route-itinerary__category">${place.categoryLabel}</span>
            <strong class="route-itinerary__name">${place.name}</strong>
            <span class="route-itinerary__location">${place.location}</span>
          </div>
        </li>
      `,
        )
        .join("")}
    </ol>
  `;
}

function renderRouteSummary(places, quiz) {
  if (!routeSummaryEl) return;

  const prefs = [];
  if (quiz.experiencia) prefs.push(quiz.experiencia);
  if (quiz.escenario) prefs.push(quiz.escenario.split(" ")[0].toLowerCase());

  routeSummaryEl.textContent = places.length
    ? `${places.length} paradas Â· ${prefs.length ? `Basada en: ${prefs.join(", ")}` : "Personalizada segÃºn tu quiz"}`
    : "";
}

function renderAventuraRoute({ forceNew = false, random = false } = {}) {
  const quiz = getQuizAnswers();
  const places = getOrCreateRoute({ forceNew, random });

  renderMapPins(places);
  renderRouteLine(places);
  renderRouteList(places);
  renderRouteSummary(places, quiz);

  window.dispatchEvent(new CustomEvent("twinmap-aventura-route-change", { detail: { places } }));
}

function getCurrentRoutePlaces() {
  const ids = loadRouteIds() || [];
  return ids.map((id) => AVENTURA_PLACES.find((place) => place.id === id)).filter(Boolean);
}

function regenerateRoute() {
  const previous = getCurrentRoutePlaces();
  if (previous.length) {
    window.TwinmapAventuraBitacora?.saveRoute(previous, getQuizAnswers(), { skipIfDuplicate: true });
  }

  renderAventuraRoute({ forceNew: true, random: true });

  const newRoute = getCurrentRoutePlaces();
  if (newRoute.length) {
    window.TwinmapAventuraBitacora?.saveRoute(newRoute, getQuizAnswers(), { skipIfDuplicate: true });
  }

  window.TwinmapRoute?.showRouteToast("Ruta de aventura regenerada Â· guardada en tu bitÃ¡cora");
}

regenerateBtn?.addEventListener("click", regenerateRoute);

window.TwinmapAventuraRoute = {
  getPlaces: () => AVENTURA_PLACES,
  getCurrentRoute: getCurrentRoutePlaces,
  render: renderAventuraRoute,
  regenerate: regenerateRoute,
};

