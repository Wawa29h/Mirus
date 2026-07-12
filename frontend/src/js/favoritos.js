const FAVORITOS_STORAGE_KEY = "twinmap-favoritos";

function getFavoritosStorageKey() {
  return window.TwinmapAuth?.getProfileStorageKey?.("favoritos") || FAVORITOS_STORAGE_KEY;
}

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
let editingFavoritoId = null;

const cardEdit = () => window.TwinmapPlaceCardEdit;

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizePlaceCategory(category) {
  return window.TwinmapPlaceStorage?.normalizeCategory?.(category)
    || normalizeText(category)
    || "lugar";
}

function makeFavoritoId(place) {
  return window.TwinmapPlaceStorage?.makePlaceId?.(place)
    || place.id
    || `${normalizeText(place.name)}-${normalizeText(place.location)}`
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
}

function notifyFavoritosChange() {
  window.dispatchEvent(
    new CustomEvent("twinmap-favoritos-change", {
      detail: { favoritos: favoritos.map((place) => ({ ...place })) },
    }),
  );
}

function ensureFavorito(place) {
  return {
    ...place,
    id: place.id || makeFavoritoId(place),
    category: normalizePlaceCategory(place.category),
    categoryLabel: place.categoryLabel || place.category || "Lugar",
  };
}

function loadFavoritos() {
  let list = [];

  if (window.TwinmapPlaceStorage?.loadFavoritos) {
    list = window.TwinmapPlaceStorage.loadFavoritos();
  } else {
    try {
      const stored = localStorage.getItem(getFavoritosStorageKey());
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) list = parsed;
      }
    } catch {
      /* lista vacía */
    }
  }

  return list.map(ensureFavorito);
}

function saveFavoritos() {
  if (window.TwinmapPlaceStorage?.saveFavoritos) {
    window.TwinmapPlaceStorage.saveFavoritos(favoritos);
    return;
  }

  localStorage.setItem(getFavoritosStorageKey(), JSON.stringify(favoritos));
  notifyFavoritosChange();
}

function getFilteredFavoritos() {
  if (activeCategory === "todos") {
    return favoritos;
  }

  return favoritos.filter(
    (place) => normalizePlaceCategory(place.category) === activeCategory,
  );
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
      const next = button.dataset.category;
      activeCategory = activeCategory === next && next !== "todos" ? "todos" : next;
      renderFilters();
      renderFavoritos();
    });
  });
}

function isFavorito(place) {
  if (!place?.name) return false;
  const id = resolveFavoritoId(place);
  return favoritos.some((item) => resolveFavoritoId(item) === id);
}

function addFavorito(place) {
  if (!place?.name) return { added: false };
  if (isFavorito(place)) return { added: false, alreadyExists: true };

  const normalized = window.TwinmapPlaceStorage?.normalizePlace?.(place);
  const category = normalized?.category || normalizePlaceCategory(place.category);
  const item = normalized || {
    id: makeFavoritoId(place),
    name: place.name,
    category,
    categoryLabel: place.categoryLabel || place.category || "Lugar",
    location: place.location || place.department || "El Salvador",
    lat: place.lat ?? null,
    lng: place.lng ?? null,
  };

  favoritos = [item, ...favoritos.filter((entry) => resolveFavoritoId(entry) !== item.id)];
  saveFavoritos();
  renderFavoritos();
  return { added: true, place: item };
}

function updateFavorito(id, updates) {
  const index = favoritos.findIndex((place) => resolveFavoritoId(place) === id);
  if (index === -1) return { updated: false };

  const current = favoritos[index];
  const next = {
    ...current,
    ...updates,
    id: current.id,
  };

  if (window.TwinmapPlaceStorage?.normalizePlace) {
    const normalized = window.TwinmapPlaceStorage.normalizePlace({
      ...next,
      department: next.department || next.location,
    });
    if (normalized) {
      Object.assign(next, normalized, { id: current.id });
    }
  }

  favoritos = [
    next,
    ...favoritos.filter((place) => resolveFavoritoId(place) !== id),
  ];
  saveFavoritos();
  renderFavoritos();
  return { updated: true, place: next };
}

function resolveFavoritoId(placeOrId) {
  if (typeof placeOrId === "string") return placeOrId;
  return placeOrId?.id || makeFavoritoId(placeOrId);
}

function removeFavorito(id) {
  if (!id || id === "undefined") return;
  favoritos = favoritos.filter((place) => resolveFavoritoId(place) !== id);
  saveFavoritos();
  editingFavoritoId = null;
  renderFavoritos();
}

function removeFavoritoByPlace(place) {
  if (!place?.name) return { removed: false };
  const id = resolveFavoritoId(place);
  const before = favoritos.length;
  favoritos = favoritos.filter((item) => resolveFavoritoId(item) !== id);
  if (favoritos.length === before) return { removed: false, notFound: true };
  saveFavoritos();
  renderFavoritos();
  return { removed: true };
}

function toggleFavorito(place) {
  if (isFavorito(place)) {
    const result = removeFavoritoByPlace(place);
    return { ...result, active: false, toggled: result.removed };
  }
  const result = addFavorito(place);
  return { ...result, active: true, toggled: result.added };
}

function renderFavoritoCard(place) {
  const placeId = resolveFavoritoId(place);
  const edit = cardEdit();
  if (editingFavoritoId === placeId && edit) {
    return `
      <article class="favoritos-card favoritos-card--editing" data-id="${placeId}">
        ${edit.buildPlaceEditFormHtml({ ...place, id: placeId })}
      </article>
    `;
  }

  const esc = edit?.escapeHtml || ((value) => String(value ?? ""));
  const actions = edit?.buildPlaceCardActionsHtml(placeId, {
    removeLabel: "Quitar de favoritos",
  }) || "";

  return `
    <article class="favoritos-card" data-id="${placeId}">
      ${window.TwinmapCategoryImages?.thumbHtml(place.categoryLabel || place.category) || '<div class="image-placeholder" aria-hidden="true"></div>'}
      <div class="favoritos-card__meta">
        <span class="favoritos-card__category">${esc(place.categoryLabel)}</span>
        <h3>${esc(place.name)}</h3>
        <p class="favoritos-card__location">${esc(place.location)}</p>
        ${actions}
      </div>
    </article>
  `;
}

function bindFavoritosListEvents() {
  if (!listEl || listEl.dataset.actionsWired) return;
  listEl.dataset.actionsWired = "1";

  listEl.addEventListener("click", (event) => {
    const editBtn = event.target.closest("[data-edit]");
    if (editBtn) {
      editingFavoritoId = editBtn.dataset.edit;
      renderFavoritos();
      return;
    }

    const removeBtn = event.target.closest("[data-remove]");
    if (removeBtn) {
      removeFavorito(removeBtn.dataset.remove);
      return;
    }

    const cancelBtn = event.target.closest("[data-cancel-edit]");
    if (cancelBtn) {
      editingFavoritoId = null;
      renderFavoritos();
    }
  });

  listEl.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-place-edit-form]");
    if (!form || !listEl.contains(form)) return;
    event.preventDefault();

    const data = cardEdit()?.readPlaceEditForm(form);
    if (!data) return;

    updateFavorito(form.dataset.id, data);
    editingFavoritoId = null;
  });
}

function renderFavoritos() {
  if (!listEl) return;

  const places = getFilteredFavoritos();

  if (countEl) {
    countEl.textContent =
      favoritos.length === 0 ? "" : `${favoritos.length} en total`;
  }

  if (favoritos.length === 0) {
    editingFavoritoId = null;
    listEl.innerHTML =
      '<p class="favoritos-empty">Aún no tienes favoritos. Guarda lugares desde el mapa.</p>';
    return;
  }

  if (places.length === 0) {
    listEl.innerHTML =
      '<p class="favoritos-empty">No hay lugares en esta categoría.</p>';
    return;
  }

  listEl.innerHTML = places.map((place) => renderFavoritoCard(place)).join("");
}

function initFavoritos() {
  if (!listEl && !filtersEl) return;

  bindFavoritosListEvents();
  renderFilters();
  renderFavoritos();
}

try {
  initFavoritos();
} catch (favInitError) {
  console.error("[favoritos] initFavoritos falló:", favInitError);
}

window.addEventListener("twinmap-auth-change", () => {
  favoritos = loadFavoritos();
  activeCategory = "todos";
  initFavoritos();
});

window.addEventListener("twinmap-favoritos-change", (event) => {
  const fromEvent = event.detail?.favoritos;
  favoritos = Array.isArray(fromEvent)
    ? fromEvent.map(ensureFavorito)
    : loadFavoritos();
  renderFavoritos();
});

window.addEventListener("storage", (event) => {
  if (!event.key?.includes("favoritos")) return;
  favoritos = loadFavoritos();
  renderFavoritos();
});

window.TwinmapFavoritos = {
  getAll: () => favoritos.map((place) => ({ ...place })),
  add: addFavorito,
  update: updateFavorito,
  toggle: toggleFavorito,
  isFavorite: isFavorito,
  remove: removeFavorito,
  removePlace: removeFavoritoByPlace,
  refresh() {
    favoritos = loadFavoritos();
    editingFavoritoId = null;
    renderFilters();
    renderFavoritos();
  },
};



