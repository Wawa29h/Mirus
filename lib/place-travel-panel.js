(function (root) {
  const NEWSDATA_ENDPOINT = "https://newsdata.io/api/1/latest";
  const NEWSDATA_KEY_STORAGE = "twinmap-newsdata-api-key";
  const NEWSDATA_FALLBACK_KEY = "pub_d8b03bdf6f384468b9474b71221c5f64";

  const SAFETY_TERMS = [
    "accidente",
    "accidentes",
    "robo",
    "robos",
    "asalto",
    "asaltos",
    "hurto",
    "seguridad",
    "emergencia",
    "delito",
    "delitos",
    "policia",
    "capturan",
    "detienen",
    "inundacion",
    "inundaciones",
    "lluvia",
    "lluvias",
    "clima",
    "trafico",
    "vial",
    "alerta",
    "turismo",
  ];

  const UBER = {
    scheme: "uber",
    package: "com.ubercab",
    playStore: "https://play.google.com/store/apps/details?id=com.ubercab",
    appStore: "https://apps.apple.com/app/uber-request-a-ride/id368677773",
    web: "https://m.uber.com/",
  };

  const INDRIVE = {
    scheme: "indriver",
    package: "sinet.startup.inDriver",
    playStore: "https://play.google.com/store/apps/details?id=sinet.startup.inDriver",
    appStore: "https://apps.apple.com/app/indrive-rides-at-your-price/id780125801",
    web: "https://indrive.com/",
  };

  const safetyNewsCache = new Map();
  const safetyNewsTokens = new Map();

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function stripHtml(value) {
    const node = document.createElement("div");
    node.innerHTML = value || "";
    return node.textContent || "";
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function getNewsDataApiKey() {
    return (
      root.TWINMAP_NEWSDATA_API_KEY
      || localStorage.getItem(NEWSDATA_KEY_STORAGE)
      || NEWSDATA_FALLBACK_KEY
    ).trim();
  }

  function getNewsApiBase() {
    return (
      root.TWINMAP_API_BASE
      || root.TWINMAP_CONFIG?.API_BASE
      || root.TWINMAP_CONFIG?.apiBaseUrl
      || root.TwinmapApi?.API_BASE_URL
      || ""
    ).replace(/\/$/, "");
  }

  function buildDirectNewsDataUrl(query, options = {}) {
    const params = new URLSearchParams({
      apikey: getNewsDataApiKey(),
      q: query,
      language: "es",
      size: String(options.size || 10),
    });
    if (options.country !== false) params.set("country", "sv");
    return `${NEWSDATA_ENDPOINT}?${params.toString()}`;
  }

  function normalizePlace(place) {
    if (!place?.name) return null;
    const lat = place.lat ?? place.coordinates?.[1] ?? null;
    const lng = place.lng ?? place.coordinates?.[0] ?? null;
    const location = place.location || place.department || "El Salvador";
    return {
      name: place.name,
      location,
      lat: lat != null ? Number(lat) : null,
      lng: lng != null ? Number(lng) : null,
    };
  }

  function buildWazeUrl(lat, lng) {
    return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  }

  function extractDepartment(location) {
    const value = String(location || "").trim();
    if (!value) return "El Salvador";
    return value.split(/[,/]/)[0]?.trim() || value;
  }

  function buildGoogleNewsSearchUrl(place) {
    const dept = extractDepartment(place.location);
    const query = `${place.name} ${dept} El Salvador noticias seguridad accidente robo`;
    return `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=es-419&gl=SV&ceid=SV:es-419`;
  }

  function buildGoogleNewsSearchUrlFromQuery(rawQuery) {
    const query = String(rawQuery || "").trim();
    const withCountry = normalizeText(query).includes("el salvador")
      ? query
      : `${query} El Salvador`;
    const fullQuery = `${withCountry} noticias seguridad accidente robo`;
    return `https://news.google.com/search?q=${encodeURIComponent(fullQuery)}&hl=es-419&gl=SV&ceid=SV:es-419`;
  }

  function buildSafetyNewsQueries(place) {
    const dept = extractDepartment(place.location);
    const candidates = [
      `${place.name} ${dept} El Salvador`,
      `${dept} El Salvador seguridad`,
      `${dept} El Salvador`,
      "El Salvador seguridad",
    ];

    return candidates.filter((query, index, list) => {
      const key = normalizeText(query);
      return key && list.findIndex((item) => normalizeText(item) === key) === index;
    });
  }

  function buildSafetyNewsApiUrl(query, options = {}) {
    const apiBase = getNewsApiBase();
    const params = new URLSearchParams({
      q: query,
      language: "es",
      size: String(options.size || 10),
    });
    if (options.country !== false) params.set("country", "sv");
    if (apiBase) return `${apiBase}/api/news?${params.toString()}`;
    return buildDirectNewsDataUrl(query, options);
  }

  function getPlaceSearchTerms(place) {
    const terms = new Set();
    [place.name, place.location, extractDepartment(place.location)].forEach((value) => {
      normalizeText(value)
        .split(/[^a-z0-9]+/)
        .filter((term) => term.length >= 4)
        .forEach((term) => terms.add(term));
    });
    return [...terms];
  }

  function isPlaceRelevantNewsItem(item, place) {
    const searchable = normalizeText([
      item.title,
      item.description,
      item.content,
    ].filter(Boolean).join(" "));
    return getPlaceSearchTerms(place).some((term) => searchable.includes(term));
  }

  function scoreNewsItem(item, place) {
    if (isSafetyNewsItem(item)) return 3;
    if (isPlaceRelevantNewsItem(item, place)) return 2;
    if (normalizeText(item.title || "").includes("el salvador")) return 1;
    return 0;
  }

  function selectNewsItems(items, place, limit = 5) {
    const ranked = items
      .map((item, index) => ({ item, score: scoreNewsItem(item, place), index }))
      .sort((a, b) => b.score - a.score || a.index - b.index);

    const picked = [];
    const seen = new Set();

    ranked.forEach(({ item, score }) => {
      if (score === 0 || picked.length >= limit) return;
      const key = item.link || item.article_id || item.title;
      if (seen.has(key)) return;
      seen.add(key);
      picked.push(mapSafetyNewsItem(item, picked.length));
    });

    if (!picked.length) {
      return items.slice(0, limit).map((item, index) => mapSafetyNewsItem(item, index));
    }

    return picked;
  }

  function extractNewsDataError(data) {
    if (!data) return "NewsData.io no respondio.";
    if (typeof data.message === "string" && data.message) return data.message;
    if (typeof data.results?.message === "string" && data.results.message) return data.results.message;
    return "NewsData.io no devolvio resultados.";
  }

  async function fetchNewsDataBatch(query, options = {}) {
    const attempts = [buildSafetyNewsApiUrl(query, options)];
    if (getNewsApiBase()) {
      attempts.push(buildDirectNewsDataUrl(query, options));
    }

    let lastError = null;
    for (const url of attempts) {
      try {
        const response = await fetch(url);
        const data = await response.json().catch(() => null);
        if (!response.ok || data?.status !== "success") {
          throw new Error(extractNewsDataError(data) || `NewsData.io respondio ${response.status}`);
        }
        return data.results || [];
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("No se pudo cargar noticias.");
  }

  async function fetchSafetyNewsForPlace(place) {
    const normalized = normalizePlace(place);
    if (!normalized) return [];

    const queries = buildSafetyNewsQueries(normalized);
    const seen = new Set();
    let pool = [];

    for (const query of queries) {
      try {
        const batch = await fetchNewsDataBatch(query);
        batch.forEach((item) => {
          const key = item.link || item.article_id || item.title;
          if (!seen.has(key)) {
            seen.add(key);
            pool.push(item);
          }
        });
      } catch {
        /* intentar consulta mas amplia */
      }

      const selected = selectNewsItems(pool, normalized);
      if (selected.length >= 3) return selected;
    }

    if (!pool.length) {
      try {
        pool = await fetchNewsDataBatch("El Salvador", { country: false, size: 8 });
      } catch {
        return [];
      }
    }

    return selectNewsItems(pool, normalized);
  }

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

  function buildInDriveIntentUrl(lat, lng) {
    const playFallback = encodeURIComponent(INDRIVE.playStore);
    return `intent://open?ll=${lat},${lng}#Intent;scheme=${INDRIVE.scheme};package=${INDRIVE.package};S.browser_fallback_url=${playFallback};end`;
  }

  function openUber(place) {
    const normalized = normalizePlace(place);
    if (!normalized?.lat || !normalized?.lng) return;
    const { lat, lng, name } = normalized;
    const universalUrl = buildUberUniversalUrl(lat, lng, name);
    const deepLink = `${UBER.scheme}://?${buildUberQuery(lat, lng, name)}`;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      root.location.assign(deepLink);
      root.setTimeout(() => root.open(UBER.appStore, "_blank", "noopener"), 1200);
      return;
    }
    if (isAndroid) {
      root.location.assign(buildUberIntentUrl(lat, lng, name));
      return;
    }
    root.open(universalUrl, "_blank", "noopener");
  }

  function openInDrive(place) {
    const normalized = normalizePlace(place);
    if (!normalized?.lat || !normalized?.lng) return;
    const { lat, lng } = normalized;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      root.location.assign(`${INDRIVE.scheme}://open`);
      root.setTimeout(() => root.open(INDRIVE.appStore, "_blank", "noopener"), 1200);
      return;
    }
    if (isAndroid) {
      root.location.assign(buildInDriveIntentUrl(lat, lng));
      return;
    }
    root.open(INDRIVE.web, "_blank", "noopener");
  }

  function isSafetyNewsItem(item) {
    const searchable = normalizeText([
      item.title,
      item.description,
      item.content,
      item.source_name,
    ].filter(Boolean).join(" "));
    return SAFETY_TERMS.some((term) => searchable.includes(term));
  }

  function mapSafetyNewsItem(item, index) {
    return {
      id: item.article_id || item.link || `safety-news-${index}`,
      title: item.title?.trim() || "Noticia sin titulo",
      summary: stripHtml(item.description || item.content || "").trim(),
      source: item.source_name || item.source_id || "NewsData.io",
      url: item.link || "#",
      publishedAt: item.pubDate ? new Date(item.pubDate).getTime() : null,
    };
  }

  function formatNewsDate(timestamp) {
    if (!timestamp || Number.isNaN(timestamp)) return "Fecha no disponible";
    return new Intl.DateTimeFormat("es-SV", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(timestamp));
  }

  function renderSafetyNewsHtml(placeName, state, items = [], message = "", newsUrl = "") {
    const listHtml = items.length
      ? `<ul class="place-safety-news__list">
          ${items.map((item) => `
            <li class="place-safety-news__item">
              <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
                ${escapeHtml(item.title)}
              </a>
              <span>${escapeHtml(item.source)} · ${escapeHtml(formatNewsDate(item.publishedAt))}</span>
            </li>
          `).join("")}
        </ul>`
      : "";

    const summary = items.length
      ? `Se encontraron ${items.length} noticia${items.length === 1 ? "" : "s"} recientes relacionadas con ${escapeHtml(placeName)}.`
      : message;

    const statusHtml = summary
      ? `<p class="place-safety-news__status place-safety-news__status--${escapeHtml(state)}">${escapeHtml(summary)}</p>`
      : "";

    const searchHtml = newsUrl
      ? `<p class="place-safety-news__search">
          <a href="${escapeHtml(newsUrl)}" target="_blank" rel="noopener noreferrer">
            Buscar más noticias de accidentes y robos en Google Noticias
          </a>
        </p>`
      : "";

    return `
      <section class="place-safety-news" aria-label="Noticias de seguridad recientes">
        <div class="place-safety-news__header">
          <div>
            <p class="place-safety-news__eyebrow">Seguridad reciente</p>
            <h3>Accidentes y robos cerca de ${escapeHtml(placeName)}</h3>
          </div>
        </div>
        ${statusHtml}
        ${listHtml}
        ${searchHtml}
      </section>
    `;
  }

  function renderTravelLinksHtml(place, options = {}) {
    const normalized = normalizePlace(place);
    if (!normalized?.lat || !normalized?.lng) {
      return `<p class="place-sidebar-travel-note">Ubicacion no disponible para abrir Waze o inDrive.</p>`;
    }

    const { lat, lng, name } = normalized;
    const wazeUrl = buildWazeUrl(lat, lng);
    const showUber = options.showUber !== false;

    return `
      <section class="place-sidebar-travel" aria-label="Ir al lugar">
        <h3>Cómo llegar</h3>
        <p class="place-sidebar-travel-note">Desde tu ubicación actual hasta ${escapeHtml(name)}</p>
        <div class="place-sidebar-travel-links">
          <a class="place-sidebar-travel-link" href="${escapeHtml(wazeUrl)}" target="_blank" rel="noopener noreferrer">Ir con Waze</a>
          <a class="place-sidebar-travel-link" href="#" data-indrive-link="1">Viaje con inDrive</a>
          ${showUber ? `<a class="place-sidebar-travel-link" href="#" data-uber-link="1">Viaje con Uber</a>` : ""}
        </div>
      </section>
    `;
  }

  function wireTravelLinks(container, place) {
    if (!container) return;
    container.querySelector("[data-indrive-link]")?.addEventListener("click", (event) => {
      event.preventDefault();
      openInDrive(place);
    });
    container.querySelector("[data-uber-link]")?.addEventListener("click", (event) => {
      event.preventDefault();
      openUber(place);
    });
  }

  function renderSidebarPanel(travelContainerId, safetyContainerId, place, options = {}) {
    const normalized = normalizePlace(place);
    if (!normalized) return;

    const travelEl = document.getElementById(travelContainerId);
    const safetyEl = document.getElementById(safetyContainerId);
    const newsUrl = buildGoogleNewsSearchUrl(normalized);

    if (travelEl) {
      travelEl.innerHTML = renderTravelLinksHtml(normalized, options);
      wireTravelLinks(travelEl, normalized);
    }

    if (safetyEl) {
      loadSafetyNews(safetyContainerId, normalized, newsUrl);
    }
  }

  async function loadSafetyNews(containerId, place, newsUrl = "") {
    const normalized = normalizePlace(place);
    const container = document.getElementById(containerId);
    if (!normalized || !container) return;

    const searchUrl = newsUrl || buildGoogleNewsSearchUrl(normalized);
    const token = (safetyNewsTokens.get(containerId) || 0) + 1;
    safetyNewsTokens.set(containerId, token);
    const cacheKey = `${normalized.name}|${normalized.location}`;

    if (safetyNewsCache.has(cacheKey)) {
      container.innerHTML = renderSafetyNewsHtml(
        normalized.name,
        "ready",
        safetyNewsCache.get(cacheKey),
        "",
        searchUrl,
      );
      return;
    }

    container.innerHTML = renderSafetyNewsHtml(
      normalized.name,
      "loading",
      [],
      "Revisando noticias recientes de accidentes, robos y seguridad...",
      searchUrl,
    );

    try {
      const items = await fetchSafetyNewsForPlace(normalized);

      if (safetyNewsTokens.get(containerId) !== token) return;

      safetyNewsCache.set(cacheKey, items);

      if (!items.length) {
        container.innerHTML = renderSafetyNewsHtml(
          normalized.name,
          "empty",
          [],
          "No encontramos noticias recientes en NewsData.io para este lugar. Busca en Google Noticias con el enlace de abajo.",
          searchUrl,
        );
        return;
      }

      container.innerHTML = renderSafetyNewsHtml(normalized.name, "ready", items, "", searchUrl);
    } catch (error) {
      if (safetyNewsTokens.get(containerId) !== token) return;
      container.innerHTML = renderSafetyNewsHtml(
        normalized.name,
        "error",
        [],
        error?.message || "No se pudo cargar NewsData.io. Usa el enlace de abajo para buscar noticias.",
        searchUrl,
      );
    }
  }

  function renderPopupLinks(place, elements) {
    const normalized = normalizePlace(place);
    if (!normalized?.lat || !normalized?.lng) return;

    const { lat, lng, name } = normalized;
    if (elements.waze) elements.waze.href = buildWazeUrl(lat, lng);
    if (elements.news) elements.news.href = buildGoogleNewsSearchUrl(normalized);
    if (elements.uber) elements.uber.href = buildUberUniversalUrl(lat, lng, name);
    if (elements.indrive) {
      elements.indrive.href = "#";
      elements.indrive.onclick = (event) => {
        event.preventDefault();
        openInDrive(normalized);
      };
    }
    if (elements.details) {
      loadSafetyNewsIntoElement(elements.details, normalized);
    }
  }

  async function loadSafetyNewsIntoElement(container, place) {
    if (!container) return;
    const normalized = normalizePlace(place);
    if (!normalized) return;

    const searchUrl = buildGoogleNewsSearchUrl(normalized);
    const cacheKey = `${normalized.name}|${normalized.location}`;
    if (safetyNewsCache.has(cacheKey)) {
      container.innerHTML = renderSafetyNewsHtml(
        normalized.name,
        "ready",
        safetyNewsCache.get(cacheKey),
        "",
        searchUrl,
      );
      return;
    }

    container.innerHTML = renderSafetyNewsHtml(
      normalized.name,
      "loading",
      [],
      "Revisando noticias recientes de accidentes, robos y seguridad...",
      searchUrl,
    );

    try {
      const items = await fetchSafetyNewsForPlace(normalized);
      safetyNewsCache.set(cacheKey, items);

      if (!items.length) {
        container.innerHTML = renderSafetyNewsHtml(
          normalized.name,
          "empty",
          [],
          "No encontramos noticias recientes en NewsData.io. Busca en Google Noticias con el enlace de abajo.",
          searchUrl,
        );
        return;
      }

      container.innerHTML = renderSafetyNewsHtml(normalized.name, "ready", items, "", searchUrl);
    } catch (error) {
      container.innerHTML = renderSafetyNewsHtml(
        normalized.name,
        "error",
        [],
        error?.message || "No se pudo revisar NewsData.io en este momento.",
        searchUrl,
      );
    }
  }

  function sidebarPlacePayload(place) {
    const coords = place?.coordinates || [];
    return {
      name: place.name,
      category: place.category,
      department: place.department,
      location: place.department || place.location || "El Salvador",
      lat: coords[1],
      lng: coords[0],
      coordinates: coords,
    };
  }

  function renderSidebarExtras(place) {
    renderSidebarPanel("place-sidebar-travel", "place-sidebar-safety", sidebarPlacePayload(place));
  }

  root.TwinmapPlaceTravelPanel = {
    normalizePlace,
    buildWazeUrl,
    buildGoogleNewsSearchUrl,
    buildGoogleNewsSearchUrlFromQuery,
    buildSafetyNewsQueries,
    buildSafetyNewsApiUrl,
    getNewsApiBase,
    fetchSafetyNewsForPlace,
    buildUberUniversalUrl,
    openUber,
    openInDrive,
    renderTravelLinksHtml,
    renderSidebarPanel,
    renderSidebarExtras,
    loadSafetyNews,
    renderPopupLinks,
    loadSafetyNewsIntoElement,
  };
})(typeof window !== "undefined" ? window : globalThis);
