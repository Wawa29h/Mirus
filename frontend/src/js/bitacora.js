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

function padStat(value) {
  return String(value).padStart(2, "0");
}

function countPlacesByCategory(category) {
  return BITACORA_PLACES.filter((place) => place.category === category).length;
}

function getBitacoraStats() {
  const departments = new Set(BITACORA_PLACES.map((place) => place.department));

  return {
    lugares: BITACORA_PLACES.length,
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

function renderFilters() {
  if (!filtersEl) return;

  filtersEl.innerHTML = BITACORA_CATEGORIES.map(
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
    return BITACORA_PLACES;
  }

  return BITACORA_PLACES.filter((place) => place.category === activeCategory);
}

function renderPlaces() {
  if (!placesListEl) return;

  const places = getFilteredPlaces();

  if (placesCountEl) {
    placesCountEl.textContent = `${BITACORA_PLACES.length} en total`;
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
          <div class="image-placeholder" aria-hidden="true"></div>
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
  renderStats();
  renderLogros();
  renderDashboardStats();
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

window.TwinmapBitacora = {
  getStats: getBitacoraStats,
  refresh: refreshBitacora,
};
