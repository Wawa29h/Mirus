const AVENTURA_FAVORITOS_KEY = "twinmap-aventura-favoritos";

const AVENTURA_FAVORITOS_CATEGORIES = [
  { id: "todos", label: "Todos" },
  { id: "restaurante", label: "Restaurantes" },
  { id: "playa", label: "Playas" },
  { id: "lugar", label: "Lugares" },
  { id: "naturaleza", label: "Naturaleza" },
];

const AVENTURA_FAVORITOS_MOCK = [
  {
    id: "playa-el-tunco",
    name: "Playa El Tunco",
    category: "playa",
    categoryLabel: "Playa",
    location: "La Libertad",
  },
  {
    id: "pupuseria-ceiba",
    name: "PupuserÃ­a La Ceiba",
    category: "restaurante",
    categoryLabel: "Restaurante",
    location: "San Salvador",
  },
  {
    id: "cascada-tercios",
    name: "Cascada Los Tercios",
    category: "naturaleza",
    categoryLabel: "Naturaleza",
    location: "JuayÃºa, Sonsonate",
  },
];

const filtersEl = document.getElementById("aventura-favoritos-filters");
const listEl = document.getElementById("aventura-favoritos-list");
const countEl = document.getElementById("aventura-favoritos-count");

let activeCategory = "todos";
let favoritos = loadAventuraFavoritos();

function loadAventuraFavoritos() {
  try {
    const stored = localStorage.getItem(AVENTURA_FAVORITOS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* usar mock */
  }

  return AVENTURA_FAVORITOS_MOCK.map((place) => ({ ...place }));
}

function saveAventuraFavoritos() {
  localStorage.setItem(AVENTURA_FAVORITOS_KEY, JSON.stringify(favoritos));
}

function normalizeCategory(place) {
  if (place.type === "restaurante" || place.category === "restaurante") return "restaurante";
  if (place.type === "playa" || place.category === "playa") return "playa";
  if (place.category === "naturaleza" || place.categoryLabel === "Naturaleza") return "naturaleza";
  return "lugar";
}

function addAventuraFavorito(place) {
  const category = normalizeCategory(place);
  const entry = {
    id: place.id || `${place.name}|${place.location}`.toLowerCase().replace(/\s+/g, "-"),
    name: place.name,
    category,
    categoryLabel: place.categoryLabel || place.category || "Lugar",
    location: place.location,
  };

  if (favoritos.some((item) => item.id === entry.id)) {
    return { added: false, alreadyExists: true };
  }

  favoritos.push(entry);
  saveAventuraFavoritos();
  renderAventuraFavoritos();
  return { added: true, alreadyExists: false };
}

function isAventuraFavorito(place) {
  const id = place.id || `${place.name}|${place.location}`.toLowerCase().replace(/\s+/g, "-");
  return favoritos.some((item) => item.id === id);
}

function getFilteredFavoritos() {
  if (activeCategory === "todos") return favoritos;
  return favoritos.filter((place) => place.category === activeCategory);
}

function renderFilters() {
  if (!filtersEl) return;

  filtersEl.innerHTML = AVENTURA_FAVORITOS_CATEGORIES.map(
    (category) => `
      <button
        type="button"
        data-category="${category.id}"
        class="${category.id === activeCategory ? "is-active" : ""}"
        aria-pressed="${category.id === activeCategory}"
      >
        ${category.label}
      </button>
    `,
  ).join("");

  filtersEl.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      renderFilters();
      renderAventuraFavoritos();
    });
  });
}

function removeAventuraFavorito(id) {
  favoritos = favoritos.filter((place) => place.id !== id);
  saveAventuraFavoritos();
  renderAventuraFavoritos();
}

function renderAventuraFavoritos() {
  if (!listEl) return;

  const places = getFilteredFavoritos();

  if (countEl) {
    countEl.textContent = favoritos.length === 0 ? "" : `${favoritos.length} en total`;
  }

  if (favoritos.length === 0) {
    listEl.innerHTML =
      '<p class="favoritos-empty">AÃºn no tienes favoritos. Guarda lugares desde el mapa de aventura.</p>';
    return;
  }

  if (places.length === 0) {
    listEl.innerHTML = '<p class="favoritos-empty">No hay lugares en esta categorÃ­a.</p>';
    return;
  }

  listEl.innerHTML = places
    .map(
      (place) => `
        <article class="favoritos-card" data-id="${place.id}">
          ${window.TwinmapCategoryImages?.thumbHtml(item.categoryLabel || item.category) || '<div class="image-placeholder" aria-hidden="true"></div>'}
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
      `,
    )
    .join("");

  listEl.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      removeAventuraFavorito(button.dataset.remove);
    });
  });
}

function initAventuraFavoritos() {
  if (!listEl && !filtersEl) return;
  renderFilters();
  renderAventuraFavoritos();
}

initAventuraFavoritos();

window.TwinmapAventuraFavoritos = {
  add: addAventuraFavorito,
  isFavorite: isAventuraFavorito,
  getAll: () => [...favoritos],
  refresh: renderAventuraFavoritos,
};

