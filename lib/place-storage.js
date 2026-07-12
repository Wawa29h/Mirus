(function (root) {
  const ACTIVE_PROFILE_KEY = "twinmap-active-profile";
  const FAVORITOS_KEY = "twinmap-favoritos";
  const BITACORA_LEGACY_KEY = "twinmap-bitacora";
  const DB_PREFIX = "twinmap-db";

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function getActiveProfileId() {
    const fromAuth = root.TwinmapAuth?.getProfile?.()?.id;
    if (fromAuth) return fromAuth;

    try {
      const raw = localStorage.getItem(ACTIVE_PROFILE_KEY);
      if (!raw) return null;
      const trimmed = raw.trim();
      if (!trimmed) return null;
      if (trimmed.startsWith("{")) {
        const profile = JSON.parse(trimmed);
        return profile?.id || null;
      }
      return trimmed;
    } catch {
      return null;
    }
  }

  function getFavoritosKey() {
    const profileId = getActiveProfileId();
    return profileId ? `twinmap-profile:${profileId}:favoritos` : FAVORITOS_KEY;
  }

  function getBitacoraKey() {
    const profileId = getActiveProfileId();
    return profileId ? `${DB_PREFIX}:${profileId}:bitacora` : `${DB_PREFIX}:guest:bitacora`;
  }

  function normalizeCategory(category) {
    const value = normalizeText(category);
    const map = {
      comida: "restaurante",
      restaurantes: "restaurante",
      hospedaje: "ciudad",
      eventos: "ciudad",
      "pueblos-magicos": "arqueologico",
      historico: "arqueologico",
      turismo: "ciudad",
      parque: "naturaleza",
      playa: "playa",
      volcan: "naturaleza",
      cascada: "naturaleza",
      montana: "naturaleza",
      naturaleza: "naturaleza",
      restaurante: "restaurante",
      arqueologico: "arqueologico",
      ciudad: "ciudad",
    };
    return map[value] || value || "lugar";
  }

  function categoryLabelFrom(category, fallback) {
    if (fallback && typeof fallback === "string" && fallback.trim()) return fallback;
    const labels = {
      restaurante: "Restaurante",
      arqueologico: "Arqueológico",
      playa: "Playa",
      naturaleza: "Naturaleza",
      ciudad: "Ciudad",
      comida: "Restaurante",
      hospedaje: "Alojamiento",
      historico: "Histórico",
      turismo: "Turismo",
      parque: "Parque",
    };
    const normalized = normalizeCategory(category);
    return labels[normalized] || labels[category] || category || "Lugar";
  }

  function makePlaceId(place) {
    if (place.id) return String(place.id);
    const location = place.location || place.department || "el-salvador";
    return `${normalizeText(place.name)}-${normalizeText(location)}`
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
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

  function normalizePlace(place) {
    if (!place?.name) return null;
    const lat = place.lat ?? place.coordinates?.[1] ?? null;
    const lng = place.lng ?? place.coordinates?.[0] ?? null;
    const location = place.location || place.department || "El Salvador";
    const category = normalizeCategory(place.category);
    return {
      id: makePlaceId({ ...place, location }),
      name: place.name,
      category,
      categoryLabel: categoryLabelFrom(category, place.categoryLabel || place.category),
      location,
      department: place.department || getDepartment(location),
      lat,
      lng,
    };
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function loadFavoritos() {
    const primary = readJson(getFavoritosKey(), []);
    if (primary.length) return primary;

    const legacyKeys = ["favoritos", FAVORITOS_KEY];
    for (const legacyKey of legacyKeys) {
      if (legacyKey === getFavoritosKey()) continue;
      const legacy = readJson(legacyKey, []);
      if (legacy.length) {
        writeJson(getFavoritosKey(), legacy);
        return legacy;
      }
    }

    return [];
  }

  function saveFavoritos(list) {
    writeJson(getFavoritosKey(), list);
    root.dispatchEvent?.(
      new CustomEvent("twinmap-favoritos-change", {
        detail: { favoritos: list.map((item) => ({ ...item })) },
      }),
    );
  }

  function loadVisited() {
    const fromDb = readJson(getBitacoraKey(), null);
    if (Array.isArray(fromDb)) return fromDb;
    return readJson(BITACORA_LEGACY_KEY, []);
  }

  function saveVisited(list) {
    writeJson(getBitacoraKey(), list);
    writeJson(BITACORA_LEGACY_KEY, list);
    root.dispatchEvent?.(
      new CustomEvent("twinmap-bitacora-change", {
        detail: { places: list.map((item) => ({ ...item })) },
      }),
    );
    root.dispatchEvent?.(
      new CustomEvent("twinmap-database-change", {
        detail: { collection: "bitacora", records: list.map((item) => ({ ...item })) },
      }),
    );
  }

  function matchesPlace(stored, place) {
    const normalized = normalizePlace(place);
    if (!normalized) return false;
    const name = normalizeText(normalized.name);
    return stored.id === normalized.id || normalizeText(stored.name) === name;
  }

  function isFavorite(place) {
    const normalized = normalizePlace(place);
    if (!normalized) return false;
    return loadFavoritos().some((item) => matchesPlace(item, normalized));
  }

  function isVisited(place) {
    if (root.TwinmapBitacora?.hasPlace?.(place)) return true;
    const normalized = normalizePlace(place);
    if (!normalized) return false;
    return loadVisited().some((item) => matchesPlace(item, normalized));
  }

  function addFavorite(place) {
    const normalized = normalizePlace(place);
    if (!normalized) return { added: false };

    const favoritos = loadFavoritos();
    if (favoritos.some((item) => matchesPlace(item, normalized))) {
      return { added: false, alreadyExists: true };
    }

    const item = { ...normalized };
    const next = [item, ...favoritos.filter((entry) => entry.id !== item.id)];
    saveFavoritos(next);
    return { added: true, place: item };
  }

  function markVisited(place) {
    const normalized = normalizePlace(place);
    if (!normalized) return { added: false };

    const visited = loadVisited();
    if (visited.some((item) => matchesPlace(item, normalized))) {
      return { added: false, alreadyExists: true };
    }

    const item = {
      ...normalized,
      visitedAt: formatVisitedDate(),
    };
    const next = [item, ...visited.filter((entry) => entry.id !== item.id)];
    saveVisited(next);
    return { added: true, place: item };
  }

  function removeFavorite(place) {
    const normalized = normalizePlace(place);
    if (!normalized) return { removed: false };

    const favoritos = loadFavoritos();
    const next = favoritos.filter((item) => !matchesPlace(item, normalized));
    if (next.length === favoritos.length) return { removed: false, notFound: true };
    saveFavoritos(next);
    return { removed: true };
  }

  function removeVisited(place) {
    const normalized = normalizePlace(place);
    if (!normalized) return { removed: false };

    const visited = loadVisited();
    const next = visited.filter((item) => !matchesPlace(item, normalized));
    if (next.length === visited.length) return { removed: false, notFound: true };
    saveVisited(next);
    return { removed: true };
  }

  function toggleFavorite(place) {
    if (isFavorite(place)) {
      const result = removeFavorite(place);
      return { ...result, active: false, toggled: result.removed };
    }
    const result = addFavorite(place);
    return {
      ...result,
      active: true,
      toggled: Boolean(result.added || result.alreadyExists),
    };
  }

  function toggleVisited(place) {
    const normalized = normalizePlace(place);
    if (!normalized) return { toggled: false };

    if (isVisited(normalized)) {
      const result = removeVisited(normalized);
      return { ...result, active: false, toggled: result.removed };
    }

    if (root.TwinmapBitacora?.addPlace) {
      const result = root.TwinmapBitacora.addPlace(normalized);
      return {
        ...result,
        active: true,
        toggled: Boolean(result.added || result.alreadyExists),
      };
    }

    const result = markVisited(normalized);
    return {
      ...result,
      active: true,
      toggled: Boolean(result.added || result.alreadyExists),
    };
  }

  function togglePlaceAction(action, place) {
    const normalized = normalizePlace(place);
    if (!normalized) return { toggled: false };

    if (root.self !== root.top) {
      const result =
        action === "favorite"
          ? toggleFavorite(normalized)
          : toggleVisited(normalized);

      if (result?.toggled || result?.added || result?.removed) {
        root.parent.postMessage(
          {
            type: "twinmap-place-changed",
            action,
            place: normalized,
            result,
          },
          "*",
        );
      }

      return result;
    }

    if (action === "favorite") {
      if (root.TwinmapFavoritos?.toggle) return root.TwinmapFavoritos.toggle(normalized);
      return toggleFavorite(normalized);
    }

    return toggleVisited(normalized);
  }

  function savePlaceAction(action, place) {
    return togglePlaceAction(action, place);
  }

  root.TwinmapPlaceStorage = {
    normalizePlace,
    normalizeCategory,
    makePlaceId,
    getFavoritosKey,
    loadFavoritos,
    saveFavoritos,
    loadVisited,
    saveVisited,
    isFavorite,
    isVisited,
    addFavorite,
    markVisited,
    removeFavorite,
    removeVisited,
    toggleFavorite,
    toggleVisited,
    togglePlaceAction,
    savePlaceAction,
  };
})(typeof window !== "undefined" ? window : globalThis);
