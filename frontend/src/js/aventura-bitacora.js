const AVENTURA_BITACORA_KEY = "twinmap-aventura-bitacora";

const AVENTURA_VIBE_TAGS = [
  { id: "loca", label: "Loca", emoji: "ðŸ¤ª" },
  { id: "entretenida", label: "Entretenida", emoji: "ðŸŽ‰" },
  { id: "epica", label: "Ã‰pica", emoji: "âš¡" },
  { id: "chill", label: "Chill", emoji: "ðŸ˜Ž" },
  { id: "gastronomica", label: "GastronÃ³mica", emoji: "ðŸ½ï¸" },
  { id: "salvaje", label: "Salvaje", emoji: "ðŸŒ¿" },
];

const ROUTE_NAME_TEMPLATES = [
  (n) => `La ruta mÃ¡s loca: ${n}`,
  (n) => `Aventura ${n}`,
  (n) => `Recorrido Ã©pico Â· ${n}`,
  (n) => `Ruta salvaje por ${n}`,
  (n) => `ExpediciÃ³n ${n}`,
];

const statsEl = document.getElementById("aventura-bitacora-stats");
const filtersEl = document.getElementById("aventura-bitacora-filters");
const listEl = document.getElementById("aventura-bitacora-list");
const countEl = document.getElementById("aventura-bitacora-count");

let activeFilter = "todos";
let entries = loadBitacora();

function loadBitacora() {
  try {
    const raw = localStorage.getItem(AVENTURA_BITACORA_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBitacora() {
  localStorage.setItem(AVENTURA_BITACORA_KEY, JSON.stringify(entries));
}

function padStat(value) {
  return String(value).padStart(2, "0");
}

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat("es-SV", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function routeFingerprint(places) {
  return places.map((p) => p.id || p.name).sort().join("|");
}

function pickRouteName(places) {
  const categories = [...new Set(places.map((p) => p.categoryLabel || p.category))];
  const highlight = categories.slice(0, 2).join(" + ") || "El Salvador";
  const template = ROUTE_NAME_TEMPLATES[Math.floor(Math.random() * ROUTE_NAME_TEMPLATES.length)];
  return template(highlight);
}

function inferAutoTags(places) {
  const tags = new Set();
  const types = places.map((p) => p.type || p.category);

  if (places.length >= 5) tags.add("epica");
  if (types.filter((t) => t === "playa").length >= 2) tags.add("loca");
  if (types.some((t) => t === "restaurante")) tags.add("gastronomica");
  if (types.some((t) => ["Naturaleza", "naturaleza", "VolcÃ¡n"].includes(t))) tags.add("salvaje");
  if (!tags.size) tags.add("entretenida");

  return [...tags];
}

function buildVibeSummary(places, quiz) {
  const names = places.slice(0, 3).map((p) => p.name);
  const trail = names.length ? names.join(" â†’ ") : "paradas por descubrir";
  const prefs = [];

  if (quiz?.experiencia) prefs.push(quiz.experiencia.toLowerCase());
  if (quiz?.escenario) prefs.push(quiz.escenario.split(" ")[0].toLowerCase());
  if (quiz?.paisaje) prefs.push(quiz.paisaje.split(",")[0].toLowerCase());
  if (quiz?.clima) prefs.push(quiz.clima.split(" ")[0].toLowerCase());

  const vibe = prefs.length ? `Vibe: ${prefs.join(" Â· ")}.` : "Ruta personalizada segÃºn tu quiz.";
  return `${trail}. ${vibe} Â¡Lista para compartir con tus amigos!`;
}

function placesToStops(places) {
  return places.map((place) => ({
    id: place.id,
    name: place.name,
    categoryLabel: place.categoryLabel || place.category || "Lugar",
    location: place.location || "",
    description: place.description || "",
  }));
}

function createEntry(places, quiz = {}) {
  const stops = placesToStops(places);
  return {
    id: `route-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    routeName: pickRouteName(places),
    stops,
    fingerprint: routeFingerprint(places),
    quiz: {
      entorno: quiz.entorno || "",
      experiencia: quiz.experiencia || "",
      escenario: quiz.escenario || "",
      intensidad: quiz.intensidad || "",
      ambiente: quiz.ambiente || "",
      clima: quiz.clima || "",
      paisaje: quiz.paisaje || "",
      biodiversidad: quiz.biodiversidad || "",
      multitudes: quiz.multitudes || "",
    },
    createdAt: new Date().toISOString(),
    rating: 0,
    tags: inferAutoTags(places),
    summary: buildVibeSummary(places, quiz),
  };
}

function saveRoute(places, quiz = {}, { skipIfDuplicate = false } = {}) {
  if (!places?.length) return null;

  const fingerprint = routeFingerprint(places);
  if (skipIfDuplicate && entries.some((e) => e.fingerprint === fingerprint)) {
    return null;
  }

  const entry = createEntry(places, quiz);
  entries.unshift(entry);
  saveBitacora();
  renderBitacora();
  return entry;
}

function updateEntry(id, updates) {
  const index = entries.findIndex((e) => e.id === id);
  if (index === -1) return;

  entries[index] = { ...entries[index], ...updates };
  saveBitacora();
  renderBitacora();
}

function getEntryById(id) {
  return entries.find((e) => e.id === id) || null;
}

function getAllEntries() {
  return [...entries];
}

function getBitacoraStats() {
  const rated = entries.filter((e) => e.rating > 0);
  const avgRating = rated.length
    ? (rated.reduce((sum, e) => sum + e.rating, 0) / rated.length).toFixed(1)
    : "â€”";

  return {
    rutas: entries.length,
    calificadas: rated.length,
    promedio: avgRating,
    paradas: entries.reduce((sum, e) => sum + (e.stops?.length || 0), 0),
  };
}

function renderStats() {
  if (!statsEl) return;

  const stats = getBitacoraStats();
  const items = [
    { value: stats.rutas, label: "Rutas locas guardadas" },
    { value: stats.calificadas, label: "Rutas calificadas" },
    { value: stats.promedio, label: "Rating promedio" },
    { value: stats.paradas, label: "Paradas en total" },
  ];

  statsEl.innerHTML = items
    .map(
      (item) => `
        <div>
          <strong>${typeof item.value === "number" ? padStat(item.value) : item.value}</strong>
          <span>${item.label}</span>
        </div>
      `,
    )
    .join("");
}

function renderFilters() {
  if (!filtersEl) return;

  const filters = [
    { id: "todos", label: "Todas" },
    ...AVENTURA_VIBE_TAGS.map((tag) => ({ id: tag.id, label: `${tag.emoji} ${tag.label}` })),
  ];

  filtersEl.innerHTML = filters
    .map(
      (filter) => `
        <button
          type="button"
          data-filter="${filter.id}"
          class="${filter.id === activeFilter ? "is-active" : ""}"
          aria-pressed="${filter.id === activeFilter}"
        >
          ${filter.label}
        </button>
      `,
    )
    .join("");

  filtersEl.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      renderFilters();
      renderList();
    });
  });
}

function getFilteredEntries() {
  if (activeFilter === "todos") return entries;
  return entries.filter((entry) => entry.tags?.includes(activeFilter));
}

function renderStars(entryId, currentRating) {
  return [1, 2, 3, 4, 5]
    .map(
      (star) => `
        <button
          type="button"
          class="aventura-bitacora-star ${star <= currentRating ? "is-filled" : ""}"
          data-entry-id="${entryId}"
          data-rating="${star}"
          aria-label="Calificar con ${star} estrellas"
        >
          â˜…
        </button>
      `,
    )
    .join("");
}

function renderTagPicker(entryId, selectedTags) {
  return AVENTURA_VIBE_TAGS.map(
    (tag) => `
      <button
        type="button"
        class="aventura-bitacora-tag ${selectedTags.includes(tag.id) ? "is-active" : ""}"
        data-entry-id="${entryId}"
        data-tag="${tag.id}"
        aria-pressed="${selectedTags.includes(tag.id)}"
      >
        ${tag.emoji} ${tag.label}
      </button>
    `,
  ).join("");
}

function renderList() {
  if (!listEl) return;

  const filtered = getFilteredEntries();

  if (countEl) {
    countEl.textContent = `${entries.length} en total`;
  }

  if (!filtered.length) {
    listEl.innerHTML = entries.length
      ? '<p class="bitacora-empty">No hay rutas con este filtro. Prueba otra etiqueta.</p>'
      : `<p class="bitacora-empty">AÃºn no tienes rutas locas guardadas. Genera o regenera una ruta en el mapa de aventura y aparecerÃ¡ aquÃ­.</p>`;
    return;
  }

  listEl.innerHTML = filtered
    .map(
      (entry) => `
        <article class="aventura-bitacora-card" data-entry-id="${entry.id}">
          <header class="aventura-bitacora-card__header">
            <div>
              <h3>${entry.routeName}</h3>
              <p class="aventura-bitacora-card__date">${formatDate(entry.createdAt)} Â· ${entry.stops.length} paradas</p>
            </div>
            <div class="aventura-bitacora-card__rating" role="group" aria-label="Calificar ruta">
              ${renderStars(entry.id, entry.rating)}
            </div>
          </header>

          <p class="aventura-bitacora-card__summary">${entry.summary}</p>

          <ol class="aventura-bitacora-card__stops">
            ${entry.stops
              .map(
                (stop, index) => `
              <li>
                <span class="aventura-bitacora-card__order">${index + 1}</span>
                <span class="aventura-bitacora-card__stop-name">${stop.name}</span>
                <span class="aventura-bitacora-card__stop-cat">${stop.categoryLabel}</span>
              </li>
            `,
              )
              .join("")}
          </ol>

          <div class="aventura-bitacora-card__tags" role="group" aria-label="Etiquetas de la ruta">
            ${renderTagPicker(entry.id, entry.tags || [])}
          </div>

          <div class="aventura-bitacora-card__actions">
            <button type="button" class="outline-button aventura-share-btn" data-entry-id="${entry.id}">
              Comparte con tus amigos
            </button>
          </div>
        </article>
      `,
    )
    .join("");

  bindListInteractions();
}

function bindListInteractions() {
  if (!listEl) return;

  listEl.querySelectorAll(".aventura-bitacora-star").forEach((button) => {
    button.addEventListener("click", () => {
      const entryId = button.dataset.entryId;
      const rating = Number(button.dataset.rating);
      updateEntry(entryId, { rating });
      window.TwinmapRoute?.showRouteToast(`Â¡${rating} estrellas! Gracias por calificar`);
    });
  });

  listEl.querySelectorAll(".aventura-bitacora-tag").forEach((button) => {
    button.addEventListener("click", () => {
      const entryId = button.dataset.entryId;
      const tag = button.dataset.tag;
      const entry = getEntryById(entryId);
      if (!entry) return;

      const tags = new Set(entry.tags || []);
      if (tags.has(tag)) tags.delete(tag);
      else tags.add(tag);

      updateEntry(entryId, { tags: [...tags] });
    });
  });

  listEl.querySelectorAll(".aventura-share-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const entry = getEntryById(button.dataset.entryId);
      if (entry) window.TwinmapAventuraShare?.shareEntry(entry);
    });
  });
}

function renderBitacora() {
  renderStats();
  renderFilters();
  renderList();
}

function refreshBitacora() {
  entries = loadBitacora();
  renderBitacora();
}

function initBitacora() {
  if (!statsEl && !listEl) return;
  renderBitacora();
}

initBitacora();

window.TwinmapAventuraBitacora = {
  saveRoute,
  getAllEntries,
  getEntryById,
  refresh: refreshBitacora,
  updateEntry,
};

