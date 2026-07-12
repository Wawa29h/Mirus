const placePopup = document.getElementById("place-popup");
const popupCategory = document.getElementById("popup-category");
const popupTitle = document.getElementById("popup-title");
const popupLocation = document.getElementById("popup-location");
const popupDescription = document.getElementById("popup-description");
const popupForecast = document.getElementById("popup-forecast");
const popupWaze = document.getElementById("popup-waze");
const popupNews = document.getElementById("popup-news");
const popupDrive = document.getElementById("popup-drive");
const popupAddRouteBtn = document.getElementById("popup-add-route");
const popupSaveFavoriteBtn = document.getElementById("popup-save-favorite");
const popupCloseButtons = document.querySelectorAll("[data-close-popup]");
const popupPlanningEl = document.querySelector(".place-popup__planning");

let currentPlace = null;

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

function updateSaveFavoriteButton() {
  if (!popupSaveFavoriteBtn || !currentPlace) return;

  if (isAdventureMode()) {
    const isFavorite = window.TwinmapAventuraFavoritos?.isFavorite(currentPlace);
    popupSaveFavoriteBtn.textContent = isFavorite ? "Guardado en favoritos" : "Guardar en favoritos";
    popupSaveFavoriteBtn.disabled = Boolean(isFavorite);
    return;
  }

  popupSaveFavoriteBtn.textContent = "Guardar lugar";
  popupSaveFavoriteBtn.disabled = false;
}

function updateAddRouteButton() {
  if (!popupAddRouteBtn || !currentPlace) return;

  const inRoute = window.TwinmapRoute?.isPlaceInRoute(currentPlace);

  popupAddRouteBtn.disabled = inRoute;
  popupAddRouteBtn.textContent = inRoute ? "Añadido a mi ruta" : "Añadir a mi ruta";
  popupAddRouteBtn.classList.toggle("is-added", inRoute);
}

function openPlacePopup(pin) {
  currentPlace = getPlaceFromPin(pin);

  document.querySelectorAll(".map-pin").forEach((node) => {
    node.classList.toggle("is-active", node === pin);
  });

  popupCategory.textContent = currentPlace.category;
  popupTitle.textContent = currentPlace.name;
  popupLocation.textContent = currentPlace.location;
  popupDescription.textContent = currentPlace.description;
  renderForecast(currentPlace.forecast);
  popupWaze.href = currentPlace.wazeUrl;
  popupNews.href = currentPlace.newsUrl;
  popupDrive.href = currentPlace.uberUrl;

  updatePopupModeUI();
  updateAddRouteButton();

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

popupSaveFavoriteBtn?.addEventListener("click", () => {
  if (!currentPlace || !isAdventureMode()) return;

  const result = window.TwinmapAventuraFavoritos?.add({
    id: currentPlace.id || document.querySelector(".map-pin.is-active")?.dataset.placeId,
    name: currentPlace.name,
    category: currentPlace.category,
    categoryLabel: currentPlace.category,
    location: currentPlace.location,
    type: document.querySelector(".map-pin.is-active")?.classList.contains("aventura-map-pin--restaurante")
      ? "restaurante"
      : document.querySelector(".map-pin.is-active")?.classList.contains("aventura-map-pin--playa")
        ? "playa"
        : "lugar",
  });

  if (result?.added) {
    window.TwinmapRoute?.showRouteToast(`${currentPlace.name} guardado en favoritos`);
    updateSaveFavoriteButton();
    window.TwinmapAventuraLogros?.refresh();
    return;
  }

  if (result?.alreadyExists) {
    window.TwinmapRoute?.showRouteToast("Este lugar ya está en favoritos");
    updateSaveFavoriteButton();
  }
});

function bindMapPins(root = document) {
  root.querySelectorAll(".map-pin").forEach((pin) => {
    if (pin.dataset.popupBound === "true") return;
    pin.dataset.popupBound = "true";
    pin.addEventListener("click", () => openPlacePopup(pin));
  });
}

bindMapPins();

window.TwinmapPlacePopup = {
  bindPins: bindMapPins,
  openFromPin: openPlacePopup,
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
