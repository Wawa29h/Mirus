const FAVORITOS_STORAGE_KEY = "twinmap-favoritos";

const FAVORITOS_CATEGORIES = [
  { id: "todos", label: "Todos" },
  { id: "restaurante", label: "Restaurantes" },
  { id: "arqueologico", label: "Arqueológicos" },
  { id: "playa", label: "Playas" },
  { id: "naturaleza", label: "Naturaleza" },
  { id: "ciudad", label: "Ciudad" },
];

const FAVORITOS_MOCK = [
  {
    id: "pupuseria-la-ceiba",
    name: "Pupusería La Ceiba",
    category: "restaurante",
    categoryLabel: "Restaurante",
    location: "San Salvador",
  },
  {
    id: "tazumal",
    name: "Tazumal",
    category: "arqueologico",
    categoryLabel: "Arqueológico",
    location: "Chalchuapa, Santa Ana",
  },
  {
    id: "playa-el-tunco",
    name: "Playa El Tunco",
    category: "playa",
    categoryLabel: "Playa",
    location: "La Libertad",
  },
  {
    id: "joya-de-ceren",
    name: "Joya de Cerén",
    category: "arqueologico",
    categoryLabel: "Arqueológico",
    location: "San Juan Opico",
  },
  {
    id: "lago-coatepeque",
    name: "Lago de Coatepeque",
    category: "naturaleza",
    categoryLabel: "Naturaleza",
    location: "Santa Ana",
  },
  {
    id: "centro-suchitoto",
    name: "Centro histórico de Suchitoto",
    category: "ciudad",
    categoryLabel: "Ciudad",
    location: "Suchitoto",
  },
];

const filtersEl = document.getElementById("favoritos-filters");
const listEl = document.getElementById("favoritos-list");
const countEl = document.getElementById("favoritos-count");

let activeCategory = "todos";
let favoritos = loadFavoritos();

function loadFavoritos() {
  try {
    const stored = localStorage.getItem(FAVORITOS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* usar mock */
  }

  return FAVORITOS_MOCK.map((place) => ({ ...place }));
}

function saveFavoritos() {
  localStorage.setItem(FAVORITOS_STORAGE_KEY, JSON.stringify(favoritos));
}

function getFilteredFavoritos() {
  if (activeCategory === "todos") {
    return favoritos;
  }

  return favoritos.filter((place) => place.category === activeCategory);
}

function renderFilters() {
  if (!filtersEl) return;

  filtersEl.innerHTML = FAVORITOS_CATEGORIES.map(
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
      renderFavoritos();
    });
  });
}

function removeFavorito(id) {
  favoritos = favoritos.filter((place) => place.id !== id);
  saveFavoritos();
  renderFavoritos();
}

function renderFavoritos() {
  if (!listEl) return;

  const places = getFilteredFavoritos();

  if (countEl) {
    countEl.textContent =
      favoritos.length === 0 ? "" : `${favoritos.length} en total`;
  }

  if (favoritos.length === 0) {
    listEl.innerHTML =
      '<p class="favoritos-empty">Aún no tienes favoritos. Guarda lugares desde el mapa.</p>';
    return;
  }

  if (places.length === 0) {
    listEl.innerHTML =
      '<p class="favoritos-empty">No hay lugares en esta categoría.</p>';
    return;
  }

  listEl.innerHTML = places
    .map(
      (place) => `
        <article class="favoritos-card" data-id="${place.id}">
          <div class="image-placeholder" aria-hidden="true"></div>
          <div class="favoritos-card__meta">
            <span class="favoritos-card__category">${place.categoryLabel}</span>
            <h3>${place.name}</h3>
            <p class="favoritos-card__location">${place.location}</p>
            <button
              class="favoritos-card__remove outline-button"
              type="button"
              data-remove="${place.id}"
              aria-label="Quitar ${place.name} de favoritos"
            >
              Quitar de favoritos
            </button>
          </div>
        </article>
      `
    )
    .join("");

  listEl.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      removeFavorito(button.dataset.remove);
    });
  });
}

function initFavoritos() {
  if (!listEl && !filtersEl) return;

  renderFilters();
  renderFavoritos();
}

initFavoritos();
