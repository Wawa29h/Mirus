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
let editingBitacoraId = null;

const cardEdit = () => window.TwinmapPlaceCardEdit;

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function makeBitacoraId(place) {
  return (
    window.TwinmapPlaceStorage?.makePlaceId?.(place)
    || place.id
    || `${normalizeText(place.name)}-${normalizeText(place.location || place.department)}`
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

function resolveBitacoraId(placeOrId) {
  if (typeof placeOrId === "string") return placeOrId;
  return placeOrId?.id || makeBitacoraId(placeOrId);
}

function normalizeBitacoraCategory(category) {
  return window.TwinmapPlaceStorage?.normalizeCategory?.(category)
    || normalizeText(category)
    || "lugar";
}

function ensureBitacoraPlace(place) {
  const enriched = enrichBitacoraPlace(place);
  return {
    ...enriched,
    id: enriched.id || makeBitacoraId(enriched),
    category: normalizeBitacoraCategory(enriched.category),
  };
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

function enrichBitacoraPlace(place) {
  return {
    ...place,
    department: place.department || getDepartment(place.location),
    categoryLabel: place.categoryLabel || place.category || "Lugar",
    visitedAt: place.visitedAt || formatVisitedDate(),
  };
}

function loadBitacoraPlaces() {
  if (window.TwinmapPlaceStorage?.loadVisited) {
    return window.TwinmapPlaceStorage.loadVisited().map(ensureBitacoraPlace);
  }

  const seed = BITACORA_PLACES.map((place) => ensureBitacoraPlace({
    id: makeBitacoraId(place),
    ...place,
  }));

  if (window.TwinmapDatabase) {
    try {
      const legacy = localStorage.getItem(BITACORA_LEGACY_STORAGE_KEY);
      if (legacy && !window.TwinmapDatabase.hasCollection(BITACORA_COLLECTION)) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length) {
          return window.TwinmapDatabase.saveAll(BITACORA_COLLECTION, parsed).map(ensureBitacoraPlace);
        }
      }
    } catch {
      /* usar seed */
    }

    const fromDb = window.TwinmapDatabase.getAll(BITACORA_COLLECTION, []);
    if (fromDb.length) {
      return fromDb.map(ensureBitacoraPlace);
    }

    return window.TwinmapDatabase.seed(BITACORA_COLLECTION, seed).map(ensureBitacoraPlace);
  }

  try {
    const stored = localStorage.getItem(BITACORA_LEGACY_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    if (Array.isArray(parsed) && parsed.length) {
      return parsed.map(ensureBitacoraPlace);
    }
  } catch {
    /* usar mock */
  }

  return seed;
}

function saveBitacoraPlaces() {
  if (window.TwinmapPlaceStorage?.saveVisited) {
    window.TwinmapPlaceStorage.saveVisited(bitacoraPlaces);
    return;
  }

  if (window.TwinmapDatabase) {
    window.TwinmapDatabase.saveAll(BITACORA_COLLECTION, bitacoraPlaces);
  }

  localStorage.setItem(BITACORA_LEGACY_STORAGE_KEY, JSON.stringify(bitacoraPlaces));
  notifyBitacoraChange();
}

function getBitacoraPlaces() {
  return bitacoraPlaces.map((place) => ({ ...place }));
}

function isPlaceInBitacora(place) {
  const id = resolveBitacoraId(place);
  return bitacoraPlaces.some((item) => resolveBitacoraId(item) === id);
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

  const category = normalizeBitacoraCategory(place.category);
  const item = ensureBitacoraPlace({
    id: makeBitacoraId(place),
    name: place.name,
    category,
    categoryLabel: place.categoryLabel || place.category || "Lugar",
    location: place.location || "El Salvador",
    department: getDepartment(place.location),
    visitedAt: formatVisitedDate(),
    lat: place.lat,
    lng: place.lng,
  });

  bitacoraPlaces = [item, ...bitacoraPlaces.filter((entry) => resolveBitacoraId(entry) !== item.id)];
  saveBitacoraPlaces();
  renderStats();
  renderLogros();
  renderDashboardStats();
  renderFilters();
  renderPlaces();

  return { added: true, place: item };
}

function removePlaceById(id) {
  if (!id || id === "undefined") return;
  bitacoraPlaces = bitacoraPlaces.filter((place) => resolveBitacoraId(place) !== id);
  editingBitacoraId = null;
  saveBitacoraPlaces();
  renderStats();
  renderLogros();
  renderDashboardStats();
  renderPlaces();
}

function updateBitacoraPlace(id, updates) {
  const index = bitacoraPlaces.findIndex((place) => resolveBitacoraId(place) === id);
  if (index === -1) return { updated: false };

  const current = bitacoraPlaces[index];
  let next = enrichBitacoraPlace({
    ...current,
    ...updates,
    id: current.id,
  });

  if (window.TwinmapPlaceStorage?.normalizePlace) {
    const normalized = window.TwinmapPlaceStorage.normalizePlace({
      ...next,
      department: next.department || next.location,
    });
    if (normalized) {
      next = enrichBitacoraPlace({
        ...normalized,
        id: current.id,
        visitedAt: updates.visitedAt || current.visitedAt,
        notes: updates.notes ?? current.notes,
      });
    }
  }

  bitacoraPlaces = [next, ...bitacoraPlaces.filter((place) => resolveBitacoraId(place) !== id)];
  saveBitacoraPlaces();
  renderStats();
  renderLogros();
  renderDashboardStats();
  renderPlaces();
  return { updated: true, place: next };
}

function removePlaceFromBitacora(place) {
  if (!place?.name) return { removed: false };

  const id = resolveBitacoraId(place);
  const before = bitacoraPlaces.length;
  bitacoraPlaces = bitacoraPlaces.filter((item) => resolveBitacoraId(item) !== id);
  if (bitacoraPlaces.length === before) return { removed: false, notFound: true };

  saveBitacoraPlaces();
  renderStats();
  renderLogros();
  renderDashboardStats();
  renderPlaces();
  return { removed: true };
}

function togglePlaceInBitacora(place) {
  if (isPlaceInBitacora(place)) {
    const result = removePlaceFromBitacora(place);
    return { ...result, active: false, toggled: result.removed };
  }
  const result = addPlaceToBitacora(place);
  return { ...result, active: true, toggled: result.added };
}

function padStat(value) {
  return String(value).padStart(2, "0");
}

function countPlacesByCategory(category) {
  return bitacoraPlaces.filter(
    (place) => normalizeBitacoraCategory(place.category) === category,
  ).length;
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
      const next = button.dataset.category;
      activeCategory = activeCategory === next && next !== "todos" ? "todos" : next;
      renderFilters();
      renderPlaces();
    });
  });
}

function getFilteredPlaces() {
  if (activeCategory === "todos") {
    return bitacoraPlaces;
  }

  return bitacoraPlaces.filter(
    (place) => normalizeBitacoraCategory(place.category) === activeCategory,
  );
}

function renderBitacoraPlaceCard(place) {
  const placeId = resolveBitacoraId(place);
  const edit = cardEdit();
  if (editingBitacoraId === placeId && edit) {
    return `
      <article class="bitacora-place-card bitacora-place-card--editing" data-id="${placeId}">
        ${edit.buildPlaceEditFormHtml({ ...place, id: placeId }, { showVisitedAt: true, showNotes: true })}
      </article>
    `;
  }

  const esc = edit?.escapeHtml || ((value) => String(value ?? ""));
  const actions = edit?.buildPlaceCardActionsHtml(placeId, {
    removeLabel: "Quitar de visitados",
  }) || "";
  const notesHtml = place.notes
    ? `<p class="bitacora-place-card__notes">${esc(place.notes)}</p>`
    : "";

  return `
    <article class="bitacora-place-card" data-id="${placeId}">
      ${window.TwinmapCategoryImages?.thumbHtml(place.categoryLabel || place.category) || '<div class="image-placeholder" aria-hidden="true"></div>'}
      <div class="bitacora-place-card__meta">
        <span class="bitacora-place-card__category">${esc(place.categoryLabel)}</span>
        <h3>${esc(place.name)}</h3>
        <p class="bitacora-place-card__location">${esc(place.location)}</p>
        <p class="bitacora-place-card__date">Visitado · ${esc(place.visitedAt)}</p>
        ${notesHtml}
        ${actions}
      </div>
    </article>
  `;
}

function bindBitacoraListEvents() {
  if (!placesListEl || placesListEl.dataset.actionsWired) return;
  placesListEl.dataset.actionsWired = "1";

  placesListEl.addEventListener("click", (event) => {
    const editBtn = event.target.closest("[data-edit]");
    if (editBtn) {
      editingBitacoraId = editBtn.dataset.edit;
      renderPlaces();
      return;
    }

    const removeBtn = event.target.closest("[data-remove]");
    if (removeBtn) {
      removePlaceById(removeBtn.dataset.remove);
      return;
    }

    const cancelBtn = event.target.closest("[data-cancel-edit]");
    if (cancelBtn) {
      editingBitacoraId = null;
      renderPlaces();
    }
  });

  placesListEl.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-place-edit-form]");
    if (!form || !placesListEl.contains(form)) return;
    event.preventDefault();

    const data = cardEdit()?.readPlaceEditForm(form);
    if (!data) return;

    updateBitacoraPlace(form.dataset.id, data);
    editingBitacoraId = null;
  });
}

function renderPlaces() {
  if (!placesListEl) return;

  const places = getFilteredPlaces();

  if (placesCountEl) {
    placesCountEl.textContent =
      bitacoraPlaces.length === 0 ? "" : `${bitacoraPlaces.length} en total`;
  }

  if (bitacoraPlaces.length === 0) {
    editingBitacoraId = null;
    placesListEl.innerHTML =
      '<p class="bitacora-empty">Aún no tienes lugares visitados. Márcalos desde Explorar mapa.</p>';
    return;
  }

  if (places.length === 0) {
    placesListEl.innerHTML =
      '<p class="bitacora-empty">No hay lugares en esta categoría.</p>';
    return;
  }

  placesListEl.innerHTML = places.map((place) => renderBitacoraPlaceCard(place)).join("");
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
  renderFilters();
  renderPlaces();
}

function initBitacora() {
  if (!statsEl && !placesListEl && !galleryEl && !dashboardStatsEl) return;

  bindBitacoraListEvents();
  refreshBitacora();
  renderGallery();
  bindDashboardLink();
}

initBitacora();

window.addEventListener("twinmap-auth-change", () => {
  bitacoraPlaces = loadBitacoraPlaces();
  activeCategory = "todos";
  initBitacora();
});

window.addEventListener("twinmap-bitacora-change", (event) => {
  const fromEvent = event.detail?.places;
  if (Array.isArray(fromEvent)) {
    bitacoraPlaces = fromEvent.map(ensureBitacoraPlace);
    renderStats();
    renderLogros();
    renderDashboardStats();
    renderPlaces();
    return;
  }
  refreshBitacora();
});

window.addEventListener("storage", (event) => {
  if (!event.key) return;
  if (event.key.includes("bitacora") || event.key === BITACORA_LEGACY_STORAGE_KEY) {
    refreshBitacora();
  }
});

window.TwinmapBitacora = {
  getStats: getBitacoraStats,
  getPlaces: getBitacoraPlaces,
  addPlace: addPlaceToBitacora,
  updatePlace: updateBitacoraPlace,
  removePlace: removePlaceFromBitacora,
  removePlaceById: removePlaceById,
  togglePlace: togglePlaceInBitacora,
  hasPlace: isPlaceInBitacora,
  refresh() {
    editingBitacoraId = null;
    refreshBitacora();
  },
};
