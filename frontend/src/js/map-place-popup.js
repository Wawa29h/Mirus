const placePopup = document.getElementById("place-popup");
const popupCategory = document.getElementById("popup-category");
const popupTitle = document.getElementById("popup-title");
const popupLocation = document.getElementById("popup-location");
const popupDescription = document.getElementById("popup-description");
const popupForecast = document.getElementById("popup-forecast");
const popupWaze = document.getElementById("popup-waze");
const popupNews = document.getElementById("popup-news");
const popupInDrive = document.getElementById("popup-indrive");
const popupDrive = document.getElementById("popup-drive");
const popupDetails = document.getElementById("popup-details");
const popupAddRouteBtn = document.getElementById("popup-add-route");
const popupMarkVisitedBtn = document.getElementById("popup-mark-visited");
const popupSaveFavoriteBtn = document.getElementById("popup-save-favorite");
const popupCloseButtons = document.querySelectorAll("[data-close-popup]");
const popupPlanningEl = document.querySelector(".place-popup__planning");
const popupImage = document.getElementById("popup-image");

let currentPlace = null;
let safetyNewsToken = 0;

const PLACE_NEWSDATA_API_ENDPOINT = "https://newsdata.io/api/1/latest";
const PLACE_NEWSDATA_API_KEY_STORAGE = "twinmap-newsdata-api-key";
const PLACE_NEWSDATA_FALLBACK_API_KEY = "pub_d8b03bdf6f384468b9474b71221c5f64";
const PLACE_SAFETY_NEWS_TERMS = [
  "accidente",
  "accidentes",
  "robo",
  "robos",
  "asalto",
  "asaltos",
  "hurto",
  "seguridad",
  "emergencia",
  "delito",
  "delitos",
];
const safetyNewsCache = new Map();

const FORECAST_LABELS = ["Hoy", "Mañana", "En dos días"];

const UBER = {
  scheme: "uber",
  package: "com.ubercab",
  playStore: "https://play.google.com/store/apps/details?id=com.ubercab",
  appStore: "https://apps.apple.com/app/uber-request-a-ride/id368677773",
  web: "https://m.uber.com/",
};

function buildUberQuery(lat, lng, placeName) {
  const label = encodeURIComponent(placeName);
  const address = encodeURIComponent(placeName);

  return [
    "action=setPickup",
    "pickup=my_location",
    `dropoff[latitude]=${lat}`,
    `dropoff[longitude]=${lng}`,
    `dropoff[nickname]=${label}`,
    `dropoff[formatted_address]=${address}`,
  ].join("&");
}

function buildUberUniversalUrl(lat, lng, placeName) {
  return `https://m.uber.com/ul/?${buildUberQuery(lat, lng, placeName)}`;
}

function buildUberIntentUrl(lat, lng, placeName) {
  const query = buildUberQuery(lat, lng, placeName);
  const playFallback = encodeURIComponent(UBER.playStore);

  return `intent://?${query}#Intent;scheme=${UBER.scheme};package=${UBER.package};S.browser_fallback_url=${playFallback};end`;
}

function openUber(place) {
  const { lat, lng, name } = place;
  const universalUrl = buildUberUniversalUrl(lat, lng, name);
  const deepLink = `${UBER.scheme}://?${buildUberQuery(lat, lng, name)}`;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  if (isIOS) {
    window.location.assign(deepLink);
    window.setTimeout(() => window.open(UBER.appStore, "_blank", "noopener"), 1200);
    return;
  }

  if (isAndroid) {
    window.location.assign(buildUberIntentUrl(lat, lng, name));
    return;
  }

  window.open(universalUrl, "_blank", "noopener");
}

function escapePlaceHtml(value) {
  const text = String(value ?? "");
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function stripPlaceHtml(value) {
  const node = document.createElement("div");
  node.innerHTML = value || "";
  return node.textContent || "";
}

function getPlaceNewsDataApiKey() {
  return (
    window.TWINMAP_NEWSDATA_API_KEY ||
    localStorage.getItem(PLACE_NEWSDATA_API_KEY_STORAGE) ||
    PLACE_NEWSDATA_FALLBACK_API_KEY
  ).trim();
}

function normalizeNewsText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function buildSafetyNewsQuery(place) {
  const location = place.location || "El Salvador";
  return `${place.name} ${location} accidente robo asalto seguridad`;
}

function buildSafetyNewsUrl(place) {
  const params = new URLSearchParams({
    q: buildSafetyNewsQuery(place),
    country: "sv",
    language: "es",
    size: "6",
  });

  const apiBase = (
    window.TWINMAP_API_BASE ||
    window.TWINMAP_CONFIG?.API_BASE ||
    window.TWINMAP_CONFIG?.apiBaseUrl ||
    window.TwinmapApi?.API_BASE_URL ||
    ""
  ).replace(/\/$/, "");

  if (apiBase) {
    return `${apiBase}/api/news?${params.toString()}`;
  }

  const apiKey = getPlaceNewsDataApiKey();
  if (!apiKey) {
    throw new Error("Configura tu API key de NewsData.io para revisar seguridad reciente.");
  }

  params.set("apikey", apiKey);
  return `${PLACE_NEWSDATA_API_ENDPOINT}?${params.toString()}`;
}

function isSafetyNewsItem(item) {
  const searchable = normalizeNewsText([
    item.title,
    item.description,
    item.content,
    item.source_name,
  ].filter(Boolean).join(" "));

  return PLACE_SAFETY_NEWS_TERMS.some((term) => searchable.includes(term));
}

function mapSafetyNewsItem(item, index) {
  return {
    id: item.article_id || item.link || `safety-news-${index}`,
    title: item.title?.trim() || "Noticia sin titulo",
    summary: stripPlaceHtml(item.description || item.content || "Sin descripcion disponible.").trim(),
    source: item.source_name || item.source_id || "NewsData.io",
    url: item.link || "#",
    publishedAt: item.pubDate ? new Date(item.pubDate).getTime() : null,
  };
}

function formatSafetyNewsDate(timestamp) {
  if (!timestamp || Number.isNaN(timestamp)) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}

function buildGoogleNewsSearchUrl(place) {
  if (window.TwinmapPlaceTravelPanel?.buildGoogleNewsSearchUrl) {
    return window.TwinmapPlaceTravelPanel.buildGoogleNewsSearchUrl(place);
  }

  const location = place.location || "El Salvador";
  const query = `${place.name} ${location} El Salvador noticias seguridad accidente robo`;
  return `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=es-419&gl=SV&ceid=SV:es-419`;
}

function renderSafetyNewsPanel(state, placeName, items = [], message = "", newsUrl = "") {
  if (!popupDetails) return;

  const listHtml = items.length
    ? `<ul class="place-safety-news__list">
        ${items.map((item) => `
          <li class="place-safety-news__item">
            <a href="${escapePlaceHtml(item.url)}" target="_blank" rel="noopener noreferrer">
              ${escapePlaceHtml(item.title)}
            </a>
            <span>${escapePlaceHtml(item.source)} · ${escapePlaceHtml(formatSafetyNewsDate(item.publishedAt))}</span>
          </li>
        `).join("")}
      </ul>`
    : "";

  const summary = items.length
    ? `Se encontraron ${items.length} noticia${items.length === 1 ? "" : "s"} recientes relacionadas con ${placeName}.`
    : message;
  const statusHtml = summary
    ? `<p class="place-safety-news__status place-safety-news__status--${escapePlaceHtml(state)}">${escapePlaceHtml(summary)}</p>`
    : "";

  const searchHtml = newsUrl
    ? `<p class="place-safety-news__search">
        <a href="${escapePlaceHtml(newsUrl)}" target="_blank" rel="noopener noreferrer">
          Buscar mas noticias en Google Noticias
        </a>
      </p>`
    : "";

  popupDetails.innerHTML = `
    <section class="place-safety-news" aria-label="Noticias de seguridad recientes">
      <div class="place-safety-news__header">
        <div>
          <p class="place-safety-news__eyebrow">Seguridad reciente</p>
          <h3>Accidentes y robos cerca de ${escapePlaceHtml(placeName)}</h3>
        </div>
        <span>NewsData.io</span>
      </div>
      ${statusHtml}
      ${listHtml}
      ${searchHtml}
    </section>
  `;
}

async function loadSafetyNews(place) {
  const token = ++safetyNewsToken;
  const cacheKey = `${place.name}|${place.location}`;
  const newsUrl = buildGoogleNewsSearchUrl(place);

  if (window.TwinmapPlaceTravelPanel?.fetchSafetyNewsForPlace) {
    if (safetyNewsCache.has(cacheKey)) {
      renderSafetyNewsPanel("ready", place.name, safetyNewsCache.get(cacheKey), "", newsUrl);
      return;
    }

    renderSafetyNewsPanel(
      "loading",
      place.name,
      [],
      "Revisando noticias recientes de accidentes, robos y seguridad...",
      newsUrl,
    );

    try {
      const items = await window.TwinmapPlaceTravelPanel.fetchSafetyNewsForPlace(place);
      if (token !== safetyNewsToken) return;

      safetyNewsCache.set(cacheKey, items);
      if (!items.length) {
        renderSafetyNewsPanel(
          "empty",
          place.name,
          [],
          "No encontramos noticias recientes en NewsData.io. Busca en Google Noticias con el enlace de abajo.",
          newsUrl,
        );
        return;
      }

      renderSafetyNewsPanel("ready", place.name, items, "", newsUrl);
    } catch (error) {
      if (token !== safetyNewsToken) return;
      renderSafetyNewsPanel(
        "error",
        place.name,
        [],
        error?.message || "No se pudo revisar NewsData.io en este momento.",
        newsUrl,
      );
    }
    return;
  }

  if (safetyNewsCache.has(cacheKey)) {
    renderSafetyNewsPanel("ready", place.name, safetyNewsCache.get(cacheKey), "", newsUrl);
    return;
  }

  renderSafetyNewsPanel(
    "loading",
    place.name,
    [],
    "Revisando noticias recientes de accidentes, robos y seguridad...",
    newsUrl,
  );

  try {
    const response = await fetch(buildSafetyNewsUrl(place));
    if (!response.ok) {
      throw new Error(`NewsData.io respondio ${response.status}`);
    }

    const data = await response.json();
    if (data.status !== "success") {
      throw new Error(data.message || "NewsData.io no devolvio resultados.");
    }

    if (token !== safetyNewsToken) return;

    const items = (data.results || [])
      .map(mapSafetyNewsItem)
      .slice(0, 5);

    safetyNewsCache.set(cacheKey, items);

    if (!items.length) {
      renderSafetyNewsPanel(
        "empty",
        place.name,
        [],
        "No encontramos noticias recientes en NewsData.io. Busca en Google Noticias con el enlace de abajo.",
        newsUrl,
      );
      return;
    }

    renderSafetyNewsPanel("ready", place.name, items, "", newsUrl);
  } catch (error) {
    if (token !== safetyNewsToken) return;

    renderSafetyNewsPanel(
      "error",
      place.name,
      [],
      error?.message || "No se pudo revisar NewsData.io en este momento.",
      newsUrl,
    );
  }
}
const MOCK_CONDITIONS = [
  "Soleado",
  "Parcialmente nublado",
  "Nublado",
  "Lluvia ligera",
  "Brisa fresca",
  "Despejado",
  "Intervalos soleados",
  "Llovizna",
];

function parseWeatherString(weather) {
  if (!weather) {
    return { temp: "26°C", condition: "Despejado" };
  }

  const parts = weather.split("·");

  return {
    temp: parts[0]?.trim() || weather,
    condition: parts.slice(1).join("·").trim() || "Clima local",
  };
}

function hashString(value) {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 1000;
  }

  return hash;
}

function adjustTemp(temp, delta) {
  const match = temp.match(/(-?\d+)/);

  if (!match) return temp;

  return `${Number(match[0]) + delta}°C`;
}

function generateMockForecast(baseWeather, placeName) {
  const today = parseWeatherString(baseWeather);
  const seed = hashString(placeName || today.temp);

  return [
    today,
    {
      temp: adjustTemp(today.temp, (seed % 3) - 1),
      condition: MOCK_CONDITIONS[(seed + 2) % MOCK_CONDITIONS.length],
    },
    {
      temp: adjustTemp(today.temp, ((seed + 5) % 5) - 2),
      condition: MOCK_CONDITIONS[(seed + 4) % MOCK_CONDITIONS.length],
    },
  ];
}

function getForecastFromPin(pin) {
  const explicit = [
    pin.dataset.placeWeatherHoy,
    pin.dataset.placeWeatherManana,
    pin.dataset.placeWeatherPasadomanana,
  ];

  if (explicit.some(Boolean)) {
    const fallback = pin.dataset.placeWeather || "26°C · Despejado";

    return explicit.map((weather) => parseWeatherString(weather || fallback));
  }

  return generateMockForecast(
    pin.dataset.placeWeather || "26°C · Despejado",
    pin.dataset.placeName
  );
}

function renderForecast(forecast) {
  if (!popupForecast) return;

  popupForecast.innerHTML = forecast
    .map(
      (day, index) => `
        <div class="place-popup__forecast-day">
          <p class="place-popup__forecast-label">${FORECAST_LABELS[index]}</p>
          <strong class="place-popup__forecast-temp">${day.temp}</strong>
          <span class="place-popup__forecast-condition">${day.condition}</span>
        </div>
      `
    )
    .join("");
}

function getPlaceFromPin(pin) {
  const name = pin.dataset.placeName || "Lugar";
  const lat = pin.dataset.placeLat || "13.6929";
  const lng = pin.dataset.placeLng || "-89.2182";

  return {
    id: pin.dataset.placeId,
    name,
    category: pin.dataset.placeCategory || "Lugar",
    location: pin.dataset.placeLocation || "El Salvador",
    description:
      pin.dataset.placeDescription ||
      "Información general del lugar seleccionado en el mapa.",
    weather: pin.dataset.placeWeather || "26°C · Despejado",
    forecast: getForecastFromPin(pin),
    newsUrl:
      pin.dataset.placeNews ||
      `https://news.google.com/search?q=${encodeURIComponent(`${name} El Salvador`)}`,
    uberUrl: pin.dataset.placeUber || buildUberUniversalUrl(lat, lng, name),
    wazeUrl: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
    lat,
    lng,
  };
}

function isAdventureMode() {
  return document.body.dataset.mode === "aventura";
}

function updatePopupModeUI() {
  const adventure = isAdventureMode();

  if (popupAddRouteBtn) {
    popupAddRouteBtn.hidden = adventure;
  }

  if (popupPlanningEl) {
    popupPlanningEl.textContent = adventure
      ? "Parada sugerida en tu ruta de aventura"
      : "Parte de tu planeación del viaje";
    popupPlanningEl.classList.toggle("place-popup__planning--aventura", adventure);
  }

  updateSaveFavoriteButton();
}

function refreshPersonalizadoFromPlaceSave() {
  window.TwinmapBitacora?.refresh?.();
  window.TwinmapFavoritos?.refresh?.();
  window.TwinmapPersonalizado?.render?.();
  window.TwinmapPersonalizado?.renderDashboard?.();
}

function showPlaceActionToast(message) {
  if (window.TwinmapRoute?.showRouteToast) {
    window.TwinmapRoute.showRouteToast(message);
    return;
  }
  window.alert(message);
}

function updatePlaceActionButtons() {
  if (!currentPlace) return;

  if (isAdventureMode()) {
    const isFavorite = window.TwinmapAventuraFavoritos?.isFavorite(currentPlace);
    if (popupSaveFavoriteBtn) {
      popupSaveFavoriteBtn.textContent = isFavorite ? "Quitar de favoritos" : "Guardar en favoritos";
      popupSaveFavoriteBtn.classList.toggle("is-active", Boolean(isFavorite));
      popupSaveFavoriteBtn.disabled = false;
    }
    if (popupMarkVisitedBtn) popupMarkVisitedBtn.hidden = true;
    return;
  }

  if (popupMarkVisitedBtn) popupMarkVisitedBtn.hidden = false;

  const inBitacora = window.TwinmapBitacora?.hasPlace?.(currentPlace)
    || window.TwinmapPlaceStorage?.isVisited?.(currentPlace);
  const inFavoritos = window.TwinmapFavoritos?.isFavorite?.(currentPlace)
    || window.TwinmapPlaceStorage?.isFavorite?.(currentPlace);

  if (popupMarkVisitedBtn) {
    popupMarkVisitedBtn.textContent = inBitacora ? "Quitar de visitados" : "Marcar visitado";
    popupMarkVisitedBtn.classList.toggle("is-active", Boolean(inBitacora));
    popupMarkVisitedBtn.disabled = false;
  }

  if (popupSaveFavoriteBtn) {
    popupSaveFavoriteBtn.textContent = inFavoritos ? "Quitar de favoritos" : "Guardar en favoritos";
    popupSaveFavoriteBtn.classList.toggle("is-active", Boolean(inFavoritos));
    popupSaveFavoriteBtn.disabled = false;
  }
}

function updateSaveFavoriteButton() {
  updatePlaceActionButtons();
}

function updateAddRouteButton() {
  if (!popupAddRouteBtn || !currentPlace) return;

  const inRoute = window.TwinmapRoute?.isPlaceInRoute(currentPlace);

  popupAddRouteBtn.disabled = inRoute;
  popupAddRouteBtn.textContent = inRoute ? "Añadido a mi ruta" : "Añadir a mi ruta";
  popupAddRouteBtn.classList.toggle("is-added", inRoute);
}

function applyTravelPanelLinks(place) {
  if (window.TwinmapPlaceTravelPanel?.renderPopupLinks) {
    window.TwinmapPlaceTravelPanel.renderPopupLinks(place, {
      waze: popupWaze,
      news: popupNews,
      indrive: popupInDrive,
      uber: popupDrive,
      details: popupDetails,
    });
    return;
  }

  popupWaze.href = place.wazeUrl;
  popupNews.href = place.newsUrl;
  popupDrive.href = place.uberUrl;
  loadSafetyNews(place);
}

function openPlacePopup(pin) {
  currentPlace = getPlaceFromPin(pin);
  document.querySelectorAll(".map-pin").forEach((node) => {
    node.classList.toggle("is-active", node === pin);
  });
  showPlacePopup(currentPlace);
}

  popupCategory.textContent = currentPlace.category;
  popupTitle.textContent = currentPlace.name;
  popupLocation.textContent = currentPlace.location;
  popupDescription.textContent = currentPlace.description;
  if (popupImage) {
    popupImage.src = window.TwinmapCategoryImages?.urlForCategory(currentPlace.category) || "assets/parque.png";
    popupImage.alt = currentPlace.category;
  }
  renderForecast(currentPlace.forecast);
  applyTravelPanelLinks(currentPlace);

  updatePopupModeUI();
  updateAddRouteButton();

  window.TwinmapApi?.getPlaceForecast?.().then((live) => {
    if (live?.length && currentPlace) renderForecast(live);
  });

  placePopup.hidden = false;
  document.body.classList.add("has-place-popup");
  popupCloseButtons[0]?.focus();
}

function closePlacePopup() {
  placePopup.hidden = true;
  document.body.classList.remove("has-place-popup");
  document.querySelectorAll(".map-pin.is-active").forEach((node) => {
    node.classList.remove("is-active");
  });
  currentPlace = null;
}

popupAddRouteBtn?.addEventListener("click", () => {
  if (!currentPlace || !window.TwinmapRoute) return;

  const result = window.TwinmapRoute.addPlaceToRoute(currentPlace);

  if (result.added) {
    window.TwinmapRoute.showRouteToast(`${currentPlace.name} añadido a tu ruta`);
    updateAddRouteButton();
    return;
  }

  if (result.alreadyExists) {
    window.TwinmapRoute.showRouteToast("Este lugar ya está en tu ruta");
    updateAddRouteButton();
  }
});

window.addEventListener("twinmap-route-change", () => {
  updateAddRouteButton();
});

popupDrive?.addEventListener("click", (event) => {
  if (!currentPlace) return;

  event.preventDefault();
  openUber(currentPlace);
});

popupMarkVisitedBtn?.addEventListener("click", () => {
  if (!currentPlace || isAdventureMode()) return;

  const result = window.TwinmapPlaceStorage?.toggleVisited?.(currentPlace)
    || window.TwinmapBitacora?.togglePlace?.(currentPlace);

  if (result?.toggled || result?.delegated) {
    const active = result.active ?? window.TwinmapBitacora?.hasPlace?.(currentPlace)
      ?? window.TwinmapPlaceStorage?.isVisited?.(currentPlace);
    showPlaceActionToast(
      active
        ? `${currentPlace.name} marcado como visitado`
        : `${currentPlace.name} quitado de visitados`,
    );
    updatePlaceActionButtons();
    refreshPersonalizadoFromPlaceSave();
  }
});

popupSaveFavoriteBtn?.addEventListener("click", () => {
  if (!currentPlace) return;

  if (!isAdventureMode()) {
    const result = window.TwinmapFavoritos?.toggle?.(currentPlace)
      || window.TwinmapPlaceStorage?.toggleFavorite?.(currentPlace);

    if (result?.toggled || result?.delegated) {
      const active = result.active ?? window.TwinmapFavoritos?.isFavorite?.(currentPlace)
        ?? window.TwinmapPlaceStorage?.isFavorite?.(currentPlace);
      showPlaceActionToast(
        active
          ? `${currentPlace.name} guardado en favoritos`
          : `${currentPlace.name} quitado de favoritos`,
      );
      updatePlaceActionButtons();
      refreshPersonalizadoFromPlaceSave();
    }

    return;
  }

  const pin = document.querySelector(".map-pin.is-active");
  const placeId = currentPlace.id || pin?.dataset.placeId;
  const isFavorite = window.TwinmapAventuraFavoritos?.isFavorite(currentPlace);

  if (isFavorite) {
    window.TwinmapAventuraFavoritos?.remove?.(placeId);
    window.TwinmapRoute?.showRouteToast(`${currentPlace.name} quitado de favoritos`);
    updateSaveFavoriteButton();
    window.TwinmapAventuraLogros?.refresh();
    return;
  }

  const result = window.TwinmapAventuraFavoritos?.add({
    id: placeId,
    name: currentPlace.name,
    category: currentPlace.category,
    categoryLabel: currentPlace.category,
    location: currentPlace.location,
    type: pin?.classList.contains("aventura-map-pin--restaurante")
      ? "restaurante"
      : pin?.classList.contains("aventura-map-pin--playa")
        ? "playa"
        : "lugar",
  });

  if (result?.added) {
    window.TwinmapRoute?.showRouteToast(`${currentPlace.name} guardado en favoritos`);
    updateSaveFavoriteButton();
    window.TwinmapAventuraLogros?.refresh();
  }
});


const DEBUG_RANDOM_PLACES = [
  { name: "San Salvador Centro", category: "Ciudad", location: "San Salvador", lat: "13.6929", lng: "-89.2182", description: "Zona urbana para probar noticias de seguridad, trafico y eventos recientes." },
  { name: "Santa Ana", category: "Ciudad", location: "Santa Ana", lat: "13.9942", lng: "-89.5597", description: "Ciudad occidental para revisar alertas recientes y noticias locales." },
  { name: "Playa El Tunco", category: "Playa", location: "La Libertad", lat: "13.4942", lng: "-89.3810", description: "Destino costero para probar reportes de accidentes, robos o seguridad turistica." },
  { name: "Lago de Coatepeque", category: "Naturaleza", location: "Santa Ana", lat: "13.8655", lng: "-89.5458", description: "Destino natural para revisar noticias cercanas antes de viajar." },
  { name: "Suchitoto", category: "Pueblo", location: "Cuscatlan", lat: "13.9381", lng: "-89.0277", description: "Pueblo turistico usado como prueba de seguridad local." },
  { name: "San Miguel", category: "Ciudad", location: "San Miguel", lat: "13.4833", lng: "-88.1833", description: "Ciudad oriental para probar noticias recientes de seguridad." },
  { name: "Ruta de las Flores", category: "Ruta", location: "Ahuachapan Sonsonate", lat: "13.8700", lng: "-89.8500", description: "Ruta turistica para verificar noticias por zona." },
  { name: "El Boqueron", category: "Volcan", location: "San Salvador", lat: "13.7347", lng: "-89.2860", description: "Parque y volcan usado para pruebas de seguridad del lugar." },
];

function openDebugPlace(place) {
  currentPlace = {
    ...place,
    id: place.name.toLowerCase().replace(/\s+/g, "-"),
    weather: "26°C · Despejado",
    forecast: generateMockForecast("26°C · Despejado", place.name),
    newsUrl: `https://news.google.com/search?q=${encodeURIComponent(`${place.name} El Salvador`)}`,
    uberUrl: buildUberUniversalUrl(place.lat, place.lng, place.name),
    wazeUrl: `https://waze.com/ul?ll=${place.lat},${place.lng}&navigate=yes`,
  };

  popupCategory.textContent = currentPlace.category;
  popupTitle.textContent = currentPlace.name;
  popupLocation.textContent = currentPlace.location;
  popupDescription.textContent = currentPlace.description;
  renderForecast(currentPlace.forecast);
  applyTravelPanelLinks(currentPlace);

  updatePopupModeUI();
  updateAddRouteButton();

  placePopup.hidden = false;
  document.body.classList.add("has-place-popup");
  popupCloseButtons[0]?.focus();
}

function initDebugLocationsPanel() {
  if (document.getElementById("debug-locations-panel")) return;

  const panel = document.createElement("section");
  panel.id = "debug-locations-panel";
  panel.className = "debug-locations-panel";
  panel.innerHTML = `
    <div class="debug-locations-panel__header">
      <strong>Debug noticias</strong>
      <button type="button" data-debug-random>Random</button>
    </div>
    <div class="debug-locations-panel__list">
      ${DEBUG_RANDOM_PLACES.slice(0, 5).map((place, index) => `
        <button type="button" data-debug-place="${index}">${escapePlaceHtml(place.name)}</button>
      `).join("")}
    </div>
  `;

  panel.querySelector("[data-debug-random]").addEventListener("click", () => {
    const place = DEBUG_RANDOM_PLACES[Math.floor(Math.random() * DEBUG_RANDOM_PLACES.length)];
    openDebugPlace(place);
  });

  panel.querySelectorAll("[data-debug-place]").forEach((button) => {
    button.addEventListener("click", () => {
      openDebugPlace(DEBUG_RANDOM_PLACES[Number(button.dataset.debugPlace)]);
    });
  });

  document.body.appendChild(panel);
}
function bindMapPins(root = document) {
  root.querySelectorAll(".map-pin").forEach((pin) => {
    if (pin.dataset.popupBound === "true") return;
    pin.dataset.popupBound = "true";
    pin.addEventListener("click", () => openPlacePopup(pin));
  });
}

bindMapPins();
initDebugLocationsPanel();

window.TwinmapPlacePopup = {
  bindPins: bindMapPins,
  openFromPin: openPlacePopup,
  openFromPlace,
};

popupCloseButtons.forEach((button) => {
  button.addEventListener("click", closePlacePopup);
});

placePopup?.querySelector(".place-popup__backdrop")?.addEventListener("click", closePlacePopup);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !placePopup.hidden) {
    closePlacePopup();
  }
});

