const ROUTE_STORAGE_KEY = "twinmap-route-itinerary";

const routeListEl = document.getElementById("route-itinerary-list");
const routeBadgeEl = document.getElementById("route-count-badge");

function getRouteItems() {
  try {
    const raw = localStorage.getItem(ROUTE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRouteItems(items) {
  localStorage.setItem(ROUTE_STORAGE_KEY, JSON.stringify(items));
}

function makePlaceId(place) {
  return `${place.name}|${place.location}`.toLowerCase();
}

function addPlaceToRoute(place) {
  const items = getRouteItems();
  const id = makePlaceId(place);

  if (items.some((item) => item.id === id)) {
    return { added: false, alreadyExists: true };
  }

  items.push({
    id,
    name: place.name,
    category: place.category,
    location: place.location,
    lat: place.lat,
    lng: place.lng,
    addedAt: Date.now(),
  });

  saveRouteItems(items);
  notifyRouteChange();
  return { added: true, alreadyExists: false };
}

function removePlaceFromRoute(id) {
  const items = getRouteItems().filter((item) => item.id !== id);
  saveRouteItems(items);
  notifyRouteChange();
}

function isPlaceInRoute(place) {
  const id = makePlaceId(place);
  return getRouteItems().some((item) => item.id === id);
}

function getRouteCount() {
  return getRouteItems().length;
}

function notifyRouteChange() {
  updateRouteBadge();
  renderItineraryList();
  window.dispatchEvent(new CustomEvent("twinmap-route-change"));
}

function updateRouteBadge() {
  if (!routeBadgeEl) return;

  const count = getRouteCount();
  routeBadgeEl.textContent = String(count);
  routeBadgeEl.hidden = count === 0;
}

function renderItineraryList() {
  if (!routeListEl) return;

  const items = getRouteItems();

  if (items.length === 0) {
    routeListEl.innerHTML = `
      <div class="route-itinerary__empty">
        <p>Aún no has añadido lugares. Explora el mapa y añádelos a tu ruta.</p>
        <button class="outline-button" type="button" data-view="mapa">Explorar mapa</button>
      </div>
    `;
    routeListEl.querySelector("[data-view]")?.addEventListener("click", (event) => {
      event.preventDefault();
      window.TwinmapApp?.showView("mapa");
    });
    return;
  }

  routeListEl.innerHTML = `
    <ol class="route-itinerary__list">
      ${items
        .map(
          (item, index) => `
        <li class="route-itinerary__item" data-route-id="${item.id}">
          <span class="route-itinerary__order" aria-hidden="true">${index + 1}</span>
          <div class="route-itinerary__body">
            <span class="route-itinerary__category">${item.category}</span>
            <strong class="route-itinerary__name">${item.name}</strong>
            <span class="route-itinerary__location">${item.location}</span>
          </div>
          <button
            class="route-itinerary__remove text-button"
            type="button"
            aria-label="Quitar ${item.name} de la ruta"
            data-remove-route="${item.id}"
          >Quitar</button>
        </li>
      `
        )
        .join("")}
    </ol>
  `;

  routeListEl.querySelectorAll("[data-remove-route]").forEach((button) => {
    button.addEventListener("click", () => {
      removePlaceFromRoute(button.dataset.removeRoute);
    });
  });
}

let toastTimer;

function showRouteToast(message) {
  let toast = document.getElementById("route-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "route-toast";
    toast.className = "route-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("is-visible");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2400);
}

function refreshRouteUI() {
  updateRouteBadge();
  renderItineraryList();
}

window.TwinmapRoute = {
  addPlaceToRoute,
  removePlaceFromRoute,
  isPlaceInRoute,
  getRouteItems,
  getRouteCount,
  showRouteToast,
  refreshRouteUI,
};

refreshRouteUI();
