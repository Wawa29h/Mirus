const BITACORA_COLLECTION = "bitacora";
const BITACORA_LEGACY_STORAGE_KEY = "twinmap-bitacora";

const BITACORA_CATEGORIES = [
  { id: "todos", label: "Todos" },
  { id: "restaurante", label: "Restaurantes" },
  { id: "arqueologico", label: "Arqueológicos" },
  { id: "playa", label: "Playas" },
  { id: "naturaleza", label: "Naturaleza" },
  { id: "ciudad", label: "Ciudad" },
];

const BITACORA_PLACES = [
  {
    name: "Pupusería La Ceiba",
    category: "restaurante",
    categoryLabel: "Restaurante",
    location: "San Salvador",
    department: "San Salvador",
    visitedAt: "5 mar 2026",
  },
  {
    name: "Tazumal",
    category: "arqueologico",
    categoryLabel: "Arqueológico",
    location: "Chalchuapa, Santa Ana",
    department: "Santa Ana",
    visitedAt: "6 mar 2026",
  },
  {
    name: "Playa El Tunco",
    category: "playa",
    categoryLabel: "Playa",
    location: "La Libertad",
    department: "La Libertad",
    visitedAt: "7 mar 2026",
  },
  {
    name: "Joya de Cerén",
    category: "arqueologico",
    categoryLabel: "Arqueológico",
    location: "San Juan Opico",
    department: "La Libertad",
    visitedAt: "8 mar 2026",
  },
  {
    name: "Lago de Coatepeque",
    category: "naturaleza",
    categoryLabel: "Naturaleza",
    location: "Santa Ana",
    department: "Santa Ana",
    visitedAt: "9 mar 2026",
  },
  {
    name: "Restaurante Las Flores",
    category: "restaurante",
    categoryLabel: "Restaurante",
    location: "Suchitoto",
    department: "Cuscatlán",
    visitedAt: "10 mar 2026",
  },
  {
    name: "San Andrés",
    category: "arqueologico",
    categoryLabel: "Arqueológico",
    location: "San Andrés, Santa Ana",
    department: "Santa Ana",
    visitedAt: "11 mar 2026",
  },
  {
    name: "Playa El Zonte",
    category: "playa",
    categoryLabel: "Playa",
    location: "La Libertad",
    department: "La Libertad",
    visitedAt: "12 mar 2026",
  },
  {
    name: "El Boquerón",
    category: "naturaleza",
    categoryLabel: "Naturaleza",
    location: "San Salvador",
    department: "San Salvador",
    visitedAt: "13 mar 2026",
  },
  {
    name: "Café Talnamica",
    category: "restaurante",
    categoryLabel: "Restaurante",
    location: "Nahuizalco, Sonsonate",
    department: "Sonsonate",
    visitedAt: "14 mar 2026",
  },
  {
    name: "Centro histórico de Suchitoto",
    category: "ciudad",
    categoryLabel: "Ciudad",
    location: "Suchitoto",
    department: "Cuscatlán",
    visitedAt: "15 mar 2026",
  },
  {
    name: "Cascada Los Tercios",
    category: "naturaleza",
    categoryLabel: "Naturaleza",
    location: "Juayúa, Sonsonate",
    department: "Sonsonate",
    visitedAt: "16 mar 2026",
  },
];

const BITACORA_PHOTOS = [
  { caption: "Atardecer en El Tunco" },
  { caption: "Tazumal al amanecer" },
  { caption: "Pupusas en La Ceiba" },
  { caption: "Vista del lago" },
  { caption: "Calles de Suchitoto" },
  { caption: "Olas en El Zonte" },
  { caption: "Sendero al Boquerón" },
  { caption: "Ruinas de San Andrés" },
  { caption: "Joya de Cerén" },
  { caption: "Mercado local" },
  { caption: "Cascada Los Tercios" },
  { caption: "Café de altura" },
];

const ROUTES_COMPLETED = 2;

const statsEl = document.getElementById("bitacora-stats");
const logrosListEl = document.getElementById("bitacora-logros-list");
const dashboardStatsEl = document.getElementById("dashboard-logros-stats");
const filtersEl = document.getElementById("bitacora-filters");
const placesListEl = document.getElementById("bitacora-places-list");
const placesCountEl = document.getElementById("bitacora-places-count");
const galleryEl = document.getElementById("bitacora-gallery");
const galleryCountEl = document.getElementById("bitacora-gallery-count");

let activeCategory = "todos";
let bitacoraPlaces = loadBitacoraPlaces();

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function makeBitacoraId(place) {
  return (
    place.id ||
    `${normalizeText(place.name)}-${normalizeText(place.location)}`
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

function getDepartment(location) {
  const parts = String(location || "").split(",");
  return (parts[parts.length - 1] || parts[0] || "El Salvador").trim();
}

function formatVisitedDate(date = new Date()) {
  return new Intl.DateTimeFormat("es-SV", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function loadBitacoraPlaces() {
  const seed = BITACORA_PLACES.map((place) => ({
    id: makeBitacoraId(place),
    ...place,
  }));

  if (window.TwinmapDatabase) {
    try {
      const legacy = localStorage.getItem(BITACORA_LEGACY_STORAGE_KEY);
      if (legacy && !window.TwinmapDatabase.hasCollection(BITACORA_COLLECTION)) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed)) {
          return window.TwinmapDatabase.saveAll(BITACORA_COLLECTION, parsed);
        }
      }
    } catch {
      /* usar seed */
    }

    return window.TwinmapDatabase.seed(BITACORA_COLLECTION, seed);
  }

  try {
    const stored = localStorage.getItem(BITACORA_LEGACY_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    /* usar mock */
  }

  return seed;
}

function saveBitacoraPlaces() {
  if (window.TwinmapDatabase) {
    window.TwinmapDatabase.saveAll(BITACORA_COLLECTION, bitacoraPlaces);
    return;
  }

  localStorage.setItem(BITACORA_LEGACY_STORAGE_KEY, JSON.stringify(bitacoraPlaces));
}

function getBitacoraPlaces() {
  return bitacoraPlaces.map((place) => ({ ...place }));
}

function isPlaceInBitacora(place) {
  const id = makeBitacoraId(place);
  const name = normalizeText(place.name);

  return bitacoraPlaces.some(
    (item) => item.id === id || normalizeText(item.name) === name,
  );
}

function notifyBitacoraChange() {
  window.dispatchEvent(
    new CustomEvent("twinmap-bitacora-change", {
      detail: { places: getBitacoraPlaces() },
    }),
  );
}

function addPlaceToBitacora(place) {
  if (!place?.name) return { added: false };

  if (isPlaceInBitacora(place)) {
    return { added: false, alreadyExists: true };
  }

  const category = normalizeText(place.category || "lugar");
  const item = {
    id: makeBitacoraId(place),
    name: place.name,
    category: category || "lugar",
    categoryLabel: place.category || "Lugar",
    location: place.location || "El Salvador",
    department: getDepartment(place.location),
    visitedAt: formatVisitedDate(),
    lat: place.lat,
    lng: place.lng,
  };

  bitacoraPlaces = [item, ...bitacoraPlaces];
  saveBitacoraPlaces();
  refreshBitacora();
  renderFilters();
  renderPlaces();
  notifyBitacoraChange();

  return { added: true, place: item };
}

function padStat(value) {
  return String(value).padStart(2, "0");
}

function countPlacesByCategory(category) {
  return bitacoraPlaces.filter((place) => place.category === category).length;
}

function getBitacoraStats() {
  const departments = new Set(bitacoraPlaces.map((place) => place.department));

  return {
    lugares: bitacoraPlaces.length,
    departamentos: departments.size,
    fotos: BITACORA_PHOTOS.length,
    rutas: ROUTES_COMPLETED,
  };
}

function getBitacoraLogros() {
  const stats = getBitacoraStats();
  const restaurantes = countPlacesByCategory("restaurante");
  const playas = countPlacesByCategory("playa");
  const arqueologicos = countPlacesByCategory("arqueologico");

  return [
    {
      id: "primer-lugar",
      title: "Primer paso",
      description: "Visitaste tu primer lugar.",
      unlocked: stats.lugares >= 1,
    },
    {
      id: "explorador",
      title: "Explorador regional",
      description: "Exploraste 3 departamentos distintos.",
      unlocked: stats.departamentos >= 3,
    },
    {
      id: "fotografo",
      title: "Fotógrafo viajero",
      description: "Tomaste 10 fotos en tu viaje.",
      unlocked: stats.fotos >= 10,
    },
    {
      id: "rutero",
      title: "Rutero",
      description: "Completaste 2 rutas.",
      unlocked: stats.rutas >= 2,
    },
    {
      id: "gourmet",
      title: "Ruta gastronómica",
      description: "Visitaste 3 restaurantes.",
      unlocked: restaurantes >= 3,
    },
    {
      id: "playero",
      title: "Alma playera",
      description: "Visitaste 2 playas.",
      unlocked: playas >= 2,
    },
    {
      id: "historiador",
      title: "Historiador",
      description: "Visitaste 3 sitios arqueológicos.",
      unlocked: arqueologicos >= 3,
    },
  ];
}

function buildStatsHtml(stats) {
  const items = [
    { value: stats.lugares, label: "Lugares visitados" },
    { value: stats.departamentos, label: "Departamentos explorados" },
    { value: stats.fotos, label: "Fotos tomadas" },
    { value: stats.rutas, label: "Rutas completadas" },
  ];

  return items
    .map(
      (item) => `
        <div>
          <strong>${padStat(item.value)}</strong>
          <span>${item.label}</span>
        </div>
      `
    )
    .join("");
}

function renderStats() {
  if (!statsEl) return;
  statsEl.innerHTML = buildStatsHtml(getBitacoraStats());
}

function renderDashboardStats() {
  if (!dashboardStatsEl) return;
  dashboardStatsEl.innerHTML = buildStatsHtml(getBitacoraStats());
}

function renderLogros() {
  if (!logrosListEl) return;

  logrosListEl.innerHTML = getBitacoraLogros()
    .map(
      (logro) => `
        <article class="bitacora-logro-card ${logro.unlocked ? "is-unlocked" : "is-locked"}">
          <span class="bitacora-logro-card__badge" aria-hidden="true">${logro.unlocked ? "✓" : "○"}</span>
          <div>
            <h3>${logro.title}</h3>
            <p>${logro.description}</p>
            <small>${logro.unlocked ? "Desbloqueado" : "Por desbloquear"}</small>
          </div>
        </article>
      `
    )
    .join("");
}

function getBitacoraCategories() {
  const categoryMap = new Map(BITACORA_CATEGORIES.map((category) => [category.id, category]));

  bitacoraPlaces.forEach((place) => {
    if (!place.category || categoryMap.has(place.category)) return;
    categoryMap.set(place.category, {
      id: place.category,
      label: place.categoryLabel || place.category,
    });
  });

  return [...categoryMap.values()];
}

function renderFilters() {
  if (!filtersEl) return;

  filtersEl.innerHTML = getBitacoraCategories().map(
    (category) => `
      <button
        type="button"
        data-category="${category.id}"
        class="${category.id === activeCategory ? "is-active" : ""}"
        aria-pressed="${category.id === activeCategory}"
      >
        ${category.label}
      </button>
    `
  ).join("");

  filtersEl.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      renderFilters();
      renderPlaces();
    });
  });
}

function getFilteredPlaces() {
  if (activeCategory === "todos") {
    return bitacoraPlaces;
  }

  return bitacoraPlaces.filter((place) => place.category === activeCategory);
}

function renderPlaces() {
  if (!placesListEl) return;

  const places = getFilteredPlaces();

  if (placesCountEl) {
    placesCountEl.textContent = `${bitacoraPlaces.length} en total`;
  }

  if (places.length === 0) {
    placesListEl.innerHTML =
      '<p class="bitacora-empty">No hay lugares en esta categoría.</p>';
    return;
  }

  placesListEl.innerHTML = places
    .map(
      (place) => `
        <article class="bitacora-place-card">
          ${window.TwinmapCategoryImages?.thumbHtml(place.categoryLabel || place.category) || '<div class="image-placeholder" aria-hidden="true"></div>'}
          <div class="bitacora-place-card__meta">
            <span class="bitacora-place-card__category">${place.categoryLabel}</span>
            <h3>${place.name}</h3>
            <p class="bitacora-place-card__location">${place.location}</p>
            <p class="bitacora-place-card__date">Visitado · ${place.visitedAt}</p>
          </div>
        </article>
      `
    )
    .join("");
}

function renderGallery() {
  if (!galleryEl) return;

  if (galleryCountEl) {
    galleryCountEl.textContent = `${BITACORA_PHOTOS.length} fotos`;
  }

  galleryEl.innerHTML = BITACORA_PHOTOS.map(
    (photo, index) => `
      <figure class="bitacora-photo">
        <div class="bitacora-photo__thumb" aria-hidden="true"></div>
        <figcaption class="bitacora-photo__caption">${photo.caption || `Foto ${index + 1}`}</figcaption>
      </figure>
    `
  ).join("");
}

function bindDashboardLink() {
  document.getElementById("dashboard-logros-ver-todo")?.addEventListener("click", () => {
    window.TwinmapApp?.showView("bitacora", { scrollTo: "#bitacora-logros" });
  });
}

function refreshBitacora() {
  bitacoraPlaces = loadBitacoraPlaces();
  renderStats();
  renderLogros();
  renderDashboardStats();
  renderPlaces();
}

function initBitacora() {
  if (!statsEl && !placesListEl && !galleryEl && !dashboardStatsEl) return;

  refreshBitacora();
  renderFilters();
  renderPlaces();
  renderGallery();
  bindDashboardLink();
}

initBitacora();

window.addEventListener("twinmap-auth-change", () => {
  bitacoraPlaces = loadBitacoraPlaces();
  activeCategory = "todos";
  initBitacora();
});

window.TwinmapBitacora = {
  getStats: getBitacoraStats,
  getPlaces: getBitacoraPlaces,
  addPlace: addPlaceToBitacora,
  hasPlace: isPlaceInBitacora,
  refresh: refreshBitacora,
};
