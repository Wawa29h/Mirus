const PERSONALIZADO_TOP_COUNT = 8;
const PERSONALIZADO_ROUTE_COUNT = 5;
const PERSONALIZADO_PIN_MIN_SCORE = 4;

const QUIZ_CLIMATE_MAP = {
  "Brisa fresca y sombra": "fresco",
  "Sol radiante y calorcito": "sol",
  "Me adapto a lo que venga": "adaptable",
};

const QUIZ_LANDSCAPE_MAP = {
  "Cascadas, ríos y senderos verdes": "cascada",
  "Playas, olas y atardeceres": "playa",
  "Pueblos, café y calles con historia": "pueblo",
  "Volcanes, miradores y cielo abierto": "volcan",
  "Me gusta mezclar de todo": "mezcla",
};

const QUIZ_BIO_MAP = {
  "¡Sí! Fauna como aves y tortugas": "fauna",
  "Bosques, plantas y ecosistemas": "bosques",
  "Solo si es tranquilo y respetuoso": "tranquilo",
  "Prefiero otras experiencias": "otras",
};

const QUIZ_CROWD_MAP = {
  "Con vida, gente y buena energía": "vida",
  "Íntimo, silencioso y sin prisa": "intimo",
  "Un equilibrio entre ambos": "equilibrio",
};

const PLACE_META = {
  "lago-coatepeque": { zones: ["Occidente"], filters: ["Volcanes", "Parques"] },
  "el-boqueron": { zones: ["Centro", "Parque Nacional"], filters: ["Volcanes", "Parques", "Montañas"] },
  "playa-el-tunco": { zones: ["Costa"], filters: ["Surf", "Playas"] },
  "playa-el-zonte": { zones: ["Costa"], filters: ["Surf", "Playas"] },
  "ruta-flores": { zones: ["Occidente", "Ruta de las Flores"], filters: ["Pueblos mágicos"] },
  juayua: { zones: ["Occidente", "Ruta de las Flores"], filters: ["Pueblos mágicos", "Cascadas"] },
  "joya-ceren": { zones: ["Occidente", "Centro"], filters: ["Sitios históricos"] },
  suchitoto: { zones: ["Oriente", "Centro"], filters: ["Pueblos mágicos", "Sitios históricos"] },
  tazumal: { zones: ["Occidente"], filters: ["Sitios históricos"] },
  "cascada-tercios": { zones: ["Occidente", "Ruta de las Flores"], filters: ["Cascadas", "Montañas"] },
  "parque-imposible": { zones: ["Occidente", "Parque Nacional"], filters: ["Parques", "Montañas"] },
  "restaurante-chorros": { zones: ["Centro"], filters: ["Cascadas"] },
  "pupuseria-ceiba": { zones: ["Centro"], filters: ["Pueblos mágicos"] },
  "cerro-verde": { zones: ["Occidente", "Parque Nacional"], filters: ["Volcanes", "Parques", "Montañas"] },
  "playa-costa-sol": { zones: ["Costa"], filters: ["Playas"] },
  "lago-ilopango": { zones: ["Centro", "Oriente"], filters: ["Volcanes", "Parques"] },
  "san-andres": { zones: ["Occidente"], filters: ["Sitios históricos"] },
  nahuizalco: { zones: ["Occidente", "Ruta de las Flores"], filters: ["Pueblos mágicos"] },
  "surf-city": { zones: ["Costa"], filters: ["Surf", "Playas"] },
  "cafe-talnamica": { zones: ["Occidente", "Ruta de las Flores"], filters: ["Pueblos mágicos"] },
};

const BITACORA_VISITED = [
  "Pupusería La Ceiba",
  "Tazumal",
  "Playa El Tunco",
  "Joya de Cerén",
  "Lago de Coatepeque",
  "San Andrés",
  "Playa El Zonte",
  "El Boquerón",
  "Café Talnamica",
  "Centro histórico de Suchitoto",
  "Cascada Los Tercios",
];

const NAME_TO_ID = {
  "pupusería la ceiba": "pupuseria-ceiba",
  tazumal: "tazumal",
  "playa el tunco": "playa-el-tunco",
  "joya de cerén": "joya-ceren",
  "lago de coatepeque": "lago-coatepeque",
  "san andrés": "san-andres",
  "playa el zonte": "playa-el-zonte",
  "el boquerón": "el-boqueron",
  "café talnamica": "cafe-talnamica",
  "centro histórico de suchitoto": "suchitoto",
  "cascada los tercios": "cascada-tercios",
};

const COORD_BOUNDS = { latMin: 13.15, latMax: 14.45, lngMin: -90.1, lngMax: -87.7 };

const panelEl = document.querySelector('[data-panel="mapa-personalizado"]');
const mapCanvasEl = document.getElementById("personalizado-map-canvas");
const routeLineEl = document.getElementById("personalizado-route-line");
const detailTitleEl = document.getElementById("personalizado-detail-title");
const detailTextEl = document.getElementById("personalizado-detail-text");
const detailListEl = document.getElementById("personalizado-detail-list");
const aiSummaryEl = document.getElementById("personalizado-ai-summary");
const perfectRouteEl = document.getElementById("personalizado-perfect-route");
const dashboardAiEl = document.getElementById("dashboard-ai-text");
const dashboardRecommendationsEl = document.getElementById("dashboard-recommendations");
const zonePanelEl = panelEl?.querySelector(".map-zone-panel");
const filterChipsEl = document.getElementById("personalizado-filter-chips");

let activeZone = "Occidente";
let activeCategory = null;
let quizFilterActive = false;
let selectedPlaceId = null;

function normalizeName(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

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

function getQuizAnswers() {
  return window.TwinmapOnboarding?.getAnswers("ruta") || {};
}

function getPlacesPool() {
  const base = window.TwinmapAventuraRoute?.getPlaces() || [];

  return base.map((place) => {
    const meta = PLACE_META[place.id] || { zones: ["Centro"], filters: [] };

    return {
      ...place,
      zones: meta.zones,
      filterCategories: meta.filters,
      zoneLabel: meta.zones[0],
    };
  });
}

function scorePlaceQuiz(place, quiz) {
  let score = 1;

  const climateTag = QUIZ_CLIMATE_MAP[quiz.clima];
  if (climateTag && place.tags.clima.includes(climateTag)) score += 3;

  const landscapeTag = QUIZ_LANDSCAPE_MAP[quiz.paisaje];
  if (landscapeTag && (place.tags.paisaje.includes(landscapeTag) || place.tags.paisaje.includes("mezcla"))) {
    score += 4;
  }

  const bioTag = QUIZ_BIO_MAP[quiz.biodiversidad];
  if (bioTag && place.tags.biodiversidad.includes(bioTag)) score += 2;

  const crowdTag = QUIZ_CROWD_MAP[quiz.multitudes];
  if (crowdTag && place.tags.multitudes.includes(crowdTag)) score += 2;

  if (place.type === "restaurante") score += 1;

  return score;
}

function getBitacoraContext() {
  const visitedIds = new Set(
    BITACORA_VISITED.map((name) => NAME_TO_ID[normalizeName(name)]).filter(Boolean),
  );

  let favoritos = [];
  try {
    const raw = localStorage.getItem("twinmap-favoritos");
    favoritos = raw ? JSON.parse(raw) : [];
  } catch {
    favoritos = [];
  }

  const favoriteIds = new Set(favoritos.map((item) => item.id));
  const favoriteCategories = new Set(favoritos.map((item) => normalizeName(item.category)));

  const routeItems = window.TwinmapRoute?.getRouteItems() || [];
  const routeIds = new Set(
    routeItems
      .map((item) => {
        const match = getPlacesPool().find(
          (place) =>
            normalizeName(place.name) === normalizeName(item.name) ||
            normalizeName(item.id).includes(place.id),
        );
        return match?.id;
      })
      .filter(Boolean),
  );

  const visitedCategories = new Set();
  visitedIds.forEach((id) => {
    const place = getPlacesPool().find((item) => item.id === id);
    if (place) visitedCategories.add(normalizeName(place.category));
  });

  return {
    visitedIds,
    favoriteIds,
    favoriteCategories,
    routeIds,
    visitedCategories,
    visitedCount: visitedIds.size,
    favoritosCount: favoritos.length,
    routeCount: routeItems.length,
  };
}

function scorePlacePersonalizado(place, quiz, context) {
  let score = scorePlaceQuiz(place, quiz);

  if (context.favoriteIds.has(place.id)) score += 3;
  if (context.visitedIds.has(place.id)) score -= 2;
  if (context.routeIds.has(place.id)) score -= 1;

  const placeCategory = normalizeName(place.category);
  if (context.favoriteCategories.has(placeCategory)) score += 2;
  if (context.visitedCategories.has(placeCategory) && !context.visitedIds.has(place.id)) score += 1;

  return score;
}

function matchesFilters(place, { zone, category, quizOnly, minScore, quiz, context }) {
  if (zone && !place.zones.includes(zone)) return false;
  if (category && !place.filterCategories.includes(category)) return false;
  if (quizOnly && scorePlaceQuiz(place, quiz) < PERSONALIZADO_PIN_MIN_SCORE) return false;
  if (minScore && scorePlacePersonalizado(place, quiz, context) < minScore) return false;
  return true;
}

function rankPlaces(quiz, context) {
  return getPlacesPool()
    .map((place) => ({
      place,
      quizScore: scorePlaceQuiz(place, quiz),
      score: scorePlacePersonalizado(place, quiz, context),
      visited: context.visitedIds.has(place.id),
      favorite: context.favoriteIds.has(place.id),
    }))
    .sort((a, b) => b.score - a.score);
}

function getTopRecommendations(quiz, context, limit = PERSONALIZADO_TOP_COUNT) {
  return rankPlaces(quiz, context).slice(0, limit);
}

function getFilteredRankedPlaces(quiz, context, { zone = activeZone, category = activeCategory } = {}) {
  const minScore = quizFilterActive ? PERSONALIZADO_PIN_MIN_SCORE : 2;

  return rankPlaces(quiz, context).filter((entry) =>
    matchesFilters(entry.place, {
      zone,
      category,
      quizOnly: quizFilterActive,
      minScore,
      quiz,
      context,
    }),
  );
}

function pickPerfectRouteStops(rankedEntries, limit = PERSONALIZADO_ROUTE_COUNT) {
  const restaurants = rankedEntries.filter((entry) => entry.place.type === "restaurante");
  const selected = [];

  if (restaurants.length) {
    selected.push(restaurants[0].place);
  }

  for (const entry of rankedEntries) {
    if (selected.length >= limit) break;
    if (!selected.some((place) => place.id === entry.place.id)) {
      selected.push(entry.place);
    }
  }

  return orderRoutePlaces(selected);
}

function buildPerfectRoute(quiz, context, { respectFilters = true } = {}) {
  let ranked = respectFilters ? getFilteredRankedPlaces(quiz, context) : rankPlaces(quiz, context);

  if (respectFilters && ranked.length < PERSONALIZADO_ROUTE_COUNT) {
    ranked = getFilteredRankedPlaces(quiz, context, { zone: null, category: activeCategory });
  }

  if (respectFilters && ranked.length < PERSONALIZADO_ROUTE_COUNT) {
    ranked = getFilteredRankedPlaces(quiz, context, { zone: null, category: null });
  }

  const places = pickPerfectRouteStops(ranked);
  const rankedById = new Map(ranked.map((entry) => [entry.place.id, entry]));

  return places.map((place) => ({
    place,
    score: rankedById.get(place.id)?.score ?? scorePlacePersonalizado(place, quiz, context),
    visited: context.visitedIds.has(place.id),
    favorite: context.favoriteIds.has(place.id),
  }));
}

function getVisiblePins(quiz, context) {
  const minScore = quizFilterActive ? PERSONALIZADO_PIN_MIN_SCORE : 2;

  return rankPlaces(quiz, context)
    .filter((entry) =>
      matchesFilters(entry.place, {
        zone: activeZone,
        category: activeCategory,
        quizOnly: quizFilterActive,
        minScore,
        quiz,
        context,
      }),
    )
    .map((entry) => entry.place);
}

function getPinsForMap(visiblePins, perfectRoute) {
  const pinIds = new Set(visiblePins.map((place) => place.id));
  const merged = [...visiblePins];

  perfectRoute.forEach((entry) => {
    if (!pinIds.has(entry.place.id)) {
      merged.push(entry.place);
      pinIds.add(entry.place.id);
    }
  });

  return merged;
}

function landscapePhrase(quiz) {
  const map = {
    "Cascadas, ríos y senderos verdes": "senderos verdes y cascadas",
    "Playas, olas y atardeceres": "playas y atardeceres en la costa",
    "Pueblos, café y calles con historia": "pueblos con historia y café de altura",
    "Volcanes, miradores y cielo abierto": "miradores y volcanes",
    "Me gusta mezclar de todo": "experiencias variadas por todo el país",
  };

  return map[quiz.paisaje] || "lugares que encajan con tu estilo";
}

function crowdPhrase(quiz) {
  const map = {
    "Con vida, gente y buena energía": "ambiente con vida y buena energía",
    "Íntimo, silencioso y sin prisa": "rincones íntimos y tranquilos",
    "Un equilibrio entre ambos": "un equilibrio entre calma y vida local",
  };

  return map[quiz.multitudes] || "experiencias auténticas";
}

function generateAISummary(quiz, topPlaces, context) {
  const hasQuiz = Object.keys(quiz).length > 0;
  const names = topPlaces.slice(0, 3).map((entry) => entry.place.name);

  if (!hasQuiz) {
    return "Completa el cuestionario del modo ruta para que la IA personalice tus recomendaciones según tus gustos y tu bitácora.";
  }

  let summary = `Basado en tu quiz y tu bitácora (${context.visitedCount} lugares visitados, ${context.favoritosCount} favoritos), `;
  summary += `tu perfil apunta a ${landscapePhrase(quiz)} con ${crowdPhrase(quiz)}. `;

  if (names.length) {
    summary += `Destacamos ${names.join(", ")}`;
    if (topPlaces.length > 3) {
      summary += ` y ${topPlaces.length - 3} opciones más`;
    }
    summary += " en tu mapa.";
  }

  const novelties = topPlaces.filter((entry) => !entry.visited).slice(0, 2);
  if (context.visitedCount > 0 && novelties.length) {
    summary += ` Priorizamos novedades como ${novelties.map((entry) => entry.place.name).join(" y ")} porque ya conoces varios clásicos de tu historial.`;
  }

  if (context.favoritosCount > 0) {
    summary += " También reforzamos categorías que guardas en favoritos.";
  }

  return summary;
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

function renderMapPins(places, context, perfectRoute = []) {
  if (!mapCanvasEl) return;

  const routeOrderById = new Map(perfectRoute.map((entry, index) => [entry.place.id, index + 1]));

  mapCanvasEl.querySelectorAll(".map-pin").forEach((pin) => pin.remove());

  places.forEach((place) => {
    const pos = coordsToPercent(place.lat, place.lng);
    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = `map-pin personalizado-map-pin personalizado-map-pin--${place.type}`;
    pin.style.left = pos.left;
    pin.style.top = pos.top;
    pin.setAttribute("aria-label", place.name);
    pin.dataset.placeId = place.id;

    const routeOrder = routeOrderById.get(place.id);
    if (routeOrder) {
      pin.dataset.routeOrder = String(routeOrder);
      pin.classList.add("personalizado-map-pin--route");
    }

    if (context.visitedIds.has(place.id)) {
      pin.classList.add("personalizado-map-pin--visited");
      pin.dataset.visited = "true";
    }

    if (context.favoriteIds.has(place.id)) {
      pin.classList.add("personalizado-map-pin--favorite");
    }

    if (selectedPlaceId === place.id) {
      pin.classList.add("is-active");
    }

    Object.entries(placeToPinAttrs(place)).forEach(([key, value]) => {
      pin.setAttribute(key, value);
    });

    pin.addEventListener("click", () => {
      selectedPlaceId = place.id;
      renderDetailForPlace(place, context);
      renderMapPins(places, context, perfectRoute);
    });

    mapCanvasEl.appendChild(pin);
  });

  window.TwinmapPlacePopup?.bindPins(mapCanvasEl);
}

function renderRouteLine(perfectRoute) {
  if (!routeLineEl) return;

  const places = perfectRoute.map((entry) => entry.place);

  if (!places.length) {
    routeLineEl.innerHTML = "";
    return;
  }

  const points = places.map((place) => coordsToPercent(place.lat, place.lng));
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  routeLineEl.innerHTML = `
    <svg class="personalizado-route-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline class="personalizado-route-path" points="${polyline}" />
    </svg>
  `;
}

function renderDetailForPlace(place, context) {
  if (!detailTitleEl || !detailTextEl) return;

  const visited = context.visitedIds.has(place.id);
  const favorite = context.favoriteIds.has(place.id);

  detailTitleEl.textContent = place.name;

  let status = "";
  if (visited) status = "Ya conocido · ";
  if (favorite) status += "En tus favoritos · ";
  status += `${place.zoneLabel} · ${place.categoryLabel}`;

  detailTextEl.textContent = `${status}. ${place.description}`;
}

function renderDetailPanel(quiz, context, topPlaces) {
  if (!detailTitleEl || !detailTextEl || !detailListEl) return;

  if (selectedPlaceId) {
    const place = getPlacesPool().find((item) => item.id === selectedPlaceId);
    if (place) {
      renderDetailForPlace(place, context);
    }
  } else {
    detailTitleEl.textContent = activeZone;
    detailTextEl.textContent = `Lugares sugeridos según tu quiz${activeCategory ? ` y la categoría ${activeCategory}` : ""} en esta zona.`;
  }

  const zoneTop = topPlaces
    .filter((entry) => entry.place.zones.includes(activeZone))
    .slice(0, 5);

  detailListEl.innerHTML = zoneTop.length
    ? `
      <ul class="personalizado-detail-list">
        ${zoneTop
          .map(
            (entry) => `
          <li>
            <button type="button" class="personalizado-detail-list__item" data-place-id="${entry.place.id}">
              <strong>${entry.place.name}</strong>
              <span>${entry.visited ? "Ya conocido" : "Nuevo para ti"} · ${entry.place.categoryLabel}</span>
            </button>
          </li>
        `,
          )
          .join("")}
      </ul>
    `
    : '<p class="personalizado-detail-empty">No hay sugerencias en esta zona con los filtros actuales.</p>';

  detailListEl.querySelectorAll("[data-place-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const place = getPlacesPool().find((item) => item.id === button.dataset.placeId);
      if (!place) return;
      selectedPlaceId = place.id;
      renderPersonalizadoMap();
    });
  });
}

function renderRecommendationCard(entry) {
  const { place, visited } = entry;
  const postmark = visited ? "portrait" : "classic";

  return `
    <article class="place-card personalizado-place-card" data-place-id="${place.id}">
      <div class="image-placeholder"></div>
      <span class="tag">${place.zoneLabel}</span>
      ${visited ? '<span class="personalizado-badge personalizado-badge--visited">Ya conocido</span>' : ""}
      <h3 class="place-name">
        <span class="visually-hidden">${place.name}</span>
        <span
          class="place-stamp"
          data-postmark="${postmark}"
          data-title="${place.name}"
          data-location="${place.location.split(",")[0]}"
        ></span>
      </h3>
      <p>${place.description}</p>
      <small>${place.categoryLabel} · ${visited ? "En tu bitácora" : "Recomendado para ti"}</small>
    </article>
  `;
}

function renderRecommendations(container, topPlaces) {
  if (!container) return;

  const items = topPlaces.slice(0, 3);
  container.innerHTML = items.map((entry) => renderRecommendationCard(entry)).join("");

  container.querySelectorAll("[data-place-id]").forEach((card) => {
    card.addEventListener("click", () => {
      selectedPlaceId = card.dataset.placeId;
      window.TwinmapApp?.showView("mapa-personalizado");
    });
  });

  window.TwinmapInkPostmarks?.refresh?.();
}

function renderPerfectRoute(container, perfectRoute) {
  if (!container) return;

  if (!perfectRoute.length) {
    container.innerHTML = `
      <p class="personalizado-perfect-route__intro">Tu ruta perfecta según tus gustos y tu bitácora</p>
      <p class="personalizado-perfect-route__empty">No hay paradas suficientes con los filtros actuales. Prueba otra zona o completa el quiz.</p>
    `;
    return;
  }

  container.innerHTML = `
    <p class="personalizado-perfect-route__intro">Tu ruta perfecta según tus gustos y tu bitácora</p>
    <ol class="route-itinerary__list personalizado-perfect-route__list">
      ${perfectRoute
        .map(
          (entry, index) => `
        <li class="route-itinerary__item personalizado-perfect-route__stop" data-place-id="${entry.place.id}">
          <span class="route-itinerary__order" aria-hidden="true">${index + 1}</span>
          <div class="route-itinerary__body">
            <span class="route-itinerary__category">${entry.place.categoryLabel}</span>
            <strong class="route-itinerary__name">${entry.place.name}</strong>
            <span class="route-itinerary__location">${entry.place.location}</span>
            <small class="personalizado-perfect-route__meta">
              ${entry.place.zoneLabel}
              ${entry.visited ? " · Ya conocido" : " · Nuevo para ti"}
              ${entry.favorite ? " · Favorito" : ""}
            </small>
          </div>
        </li>
      `,
        )
        .join("")}
    </ol>
  `;

  container.querySelectorAll("[data-place-id]").forEach((stop) => {
    stop.addEventListener("click", () => {
      selectedPlaceId = stop.dataset.placeId;
      renderPersonalizadoMap();
    });
  });
}

function renderAISummaries(summary) {
  if (aiSummaryEl) {
    aiSummaryEl.textContent = summary;
  }

  if (dashboardAiEl) {
    dashboardAiEl.textContent = summary;
  }
}

function syncFilterButtons() {
  zonePanelEl?.querySelectorAll("[data-filter-zone]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filterZone === activeZone);
  });

  zonePanelEl?.querySelectorAll("[data-filter-category]").forEach((button) => {
    const isActive = activeCategory === button.dataset.filterCategory;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  filterChipsEl?.querySelectorAll("[data-quiz-filter]").forEach((button) => {
    button.classList.toggle("is-active", quizFilterActive);
    button.setAttribute("aria-pressed", String(quizFilterActive));
  });
}

function bindFilters() {
  zonePanelEl?.querySelectorAll("[data-filter-zone]").forEach((button) => {
    button.addEventListener("click", () => {
      activeZone = button.dataset.filterZone;
      selectedPlaceId = null;
      renderPersonalizadoMap();
    });
  });

  zonePanelEl?.querySelectorAll("[data-filter-category]").forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.dataset.filterCategory;
      activeCategory = activeCategory === category ? null : category;
      selectedPlaceId = null;
      renderPersonalizadoMap();
    });
  });

  filterChipsEl?.querySelectorAll("[data-quiz-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      quizFilterActive = !quizFilterActive;
      renderPersonalizadoMap();
    });
  });

  document.getElementById("dashboard-go-personalizado")?.addEventListener("click", () => {
    window.TwinmapApp?.showView("mapa-personalizado");
  });
}

function renderPersonalizadoMap() {
  const quiz = getQuizAnswers();
  const context = getBitacoraContext();
  const ranked = rankPlaces(quiz, context);
  const topPlaces = ranked.slice(0, PERSONALIZADO_TOP_COUNT);
  const perfectRoute = buildPerfectRoute(quiz, context);
  const visiblePins = getVisiblePins(quiz, context);
  const pinsToShow = getPinsForMap(visiblePins, perfectRoute);
  const summary = generateAISummary(quiz, topPlaces, context);

  syncFilterButtons();
  renderMapPins(pinsToShow, context, perfectRoute);
  renderRouteLine(perfectRoute);
  renderDetailPanel(quiz, context, ranked);
  renderPerfectRoute(perfectRouteEl, perfectRoute);
  renderAISummaries(summary);
}

function renderDashboardFeed() {
  const quiz = getQuizAnswers();
  const context = getBitacoraContext();
  const perfectRoute = buildPerfectRoute(quiz, context, { respectFilters: false });
  const topPlaces = perfectRoute.length ? perfectRoute.slice(0, 3) : getTopRecommendations(quiz, context, 3);
  const summary = generateAISummary(quiz, topPlaces, context);

  renderRecommendations(dashboardRecommendationsEl, topPlaces);
  renderAISummaries(summary);
}

function initPersonalizadoMap() {
  if (!panelEl && !dashboardAiEl) return;

  bindFilters();
  renderPersonalizadoMap();
  renderDashboardFeed();
}

initPersonalizadoMap();

window.TwinmapPersonalizado = {
  render: renderPersonalizadoMap,
  renderDashboard: renderDashboardFeed,
  getTopRecommendations: () => {
    const quiz = getQuizAnswers();
    const context = getBitacoraContext();
    return getTopRecommendations(quiz, context);
  },
  getPerfectRoute: (options) => {
    const quiz = getQuizAnswers();
    const context = getBitacoraContext();
    return buildPerfectRoute(quiz, context, options);
  },
};
