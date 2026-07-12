/**
 * Cliente HTTP para la API TwinMap (backend Express).
 * Configura window.TWINMAP_API_BASE o frontend/src/js/config.js
 */
(function initTwinmapApi(global) {
  const API_BASE_URL = (
    global.TWINMAP_API_BASE ||
    global.TWINMAP_CONFIG?.apiBaseUrl ||
    "http://localhost:3001"
  ).replace(/\/$/, "");

  const WMO_LABELS = {
    0: "Despejado",
    1: "Mayormente despejado",
    2: "Parcialmente nublado",
    3: "Nublado",
    45: "Niebla",
    48: "Niebla",
    51: "Llovizna ligera",
    53: "Llovizna",
    55: "Llovizna intensa",
    61: "Lluvia ligera",
    63: "Lluvia moderada",
    65: "Lluvia fuerte",
    80: "Chubascos",
    95: "Tormenta",
  };

  function weatherLabel(code) {
    return WMO_LABELS[code] || "Clima variable";
  }

  async function request(path, options = {}, fallback = null) {
    const url = `${API_BASE_URL}${path}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Accept: "application/json",
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...(options.headers || {}),
        },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `HTTP ${response.status}`);
      }
      return { ok: true, payload, fromMock: false };
    } catch (error) {
      if (fallback !== null) {
        return { ok: true, payload: fallback, fromMock: true, error: error.message };
      }
      return { ok: false, error: error.message, fromMock: true };
    }
  }

  let cachedPois = null;
  let apiOnline = null;

  async function checkHealth() {
    const result = await request("/health", {}, { ok: true });
    apiOnline = Boolean(result.ok && result.payload?.ok);
    return apiOnline;
  }

  async function getCrowds(options = {}) {
    const qs = options.refresh ? "?refresh=1" : "";
    return request(`/api/crowds${qs}`, {}, null);
  }

  async function getBirds(options = {}) {
    const qs = options.refresh ? "?refresh=1" : "";
    return request(`/api/birds${qs}`, {}, null);
  }

  async function getBirdForecast(options = {}) {
    const qs = options.refresh ? "?refresh=1" : "";
    return request(`/api/birds/forecast${qs}`, {}, null);
  }

  async function calculateRoute({ origin, destination, departureTime }) {
    return request(
      "/api/routes/calculate",
      {
        method: "POST",
        body: JSON.stringify({ origin, destination, departureTime }),
      },
      null
    );
  }

  async function planAssistantRoute({ message, location }) {
    return request(
      "/api/assistant/route",
      {
        method: "POST",
        body: JSON.stringify({ message, location }),
      },
      null
    );
  }

  async function getWeatherBundle() {
    return request("/data/weather.json", {}, null);
  }

  function weatherBundleToForecast(bundle) {
    if (!bundle?.daily?.time?.length) return null;
    const days = bundle.daily.time.slice(0, 3).map((_, index) => {
      const max = bundle.daily.temperature_2m_max?.[index];
      const min = bundle.daily.temperature_2m_min?.[index];
      const code = bundle.daily.weather_code?.[index];
      const temp =
        max != null && min != null
          ? `${Math.round((max + min) / 2)}°C`
          : max != null
            ? `${Math.round(max)}°C`
            : "—";
      return { temp, condition: weatherLabel(code) };
    });
    return days.length ? days : null;
  }

  async function getPlaceForecast() {
    const result = await getWeatherBundle();
    if (!result.ok || !result.payload) return null;
    return weatherBundleToForecast(result.payload);
  }

  async function getPoisGeojson() {
    if (cachedPois) return { ok: true, payload: cachedPois, fromMock: false };
    const result = await request("/data/pois.geojson", {}, null);
    if (result.ok && result.payload?.features) {
      cachedPois = result.payload;
    }
    return result;
  }

  const CAT_LABELS = {
    hospedaje: "Hospedaje",
    comida: "Gastronomía",
    historico: "Histórico",
    naturaleza: "Naturaleza",
    playa: "Playa",
  };

  function poiToPlace(feature, index) {
    const props = feature.properties || {};
    const name = props.name && props.name !== "Sin nombre" ? props.name : null;
    if (!name) return null;
    const [lng, lat] = feature.geometry?.coordinates || [];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const cat = props.cat || "lugar";
    return {
      id: `poi-${index}-${name}`.toLowerCase().replace(/\s+/g, "-").slice(0, 80),
      name,
      category: CAT_LABELS[cat] || cat,
      categoryLabel: CAT_LABELS[cat] || cat,
      type: "lugar",
      location: "El Salvador",
      description: props.kind ? `Punto de interés (${props.kind})` : "Punto de interés turístico",
      lat,
      lng,
      weather: "26°C · Consulta en vivo",
      tags: { paisaje: ["mezcla"], multitudes: ["equilibrio"] },
      source: "api-poi",
    };
  }

  async function loadSupplementaryPlaces(limit = 40) {
    const result = await getPoisGeojson();
    if (!result.ok || !result.payload?.features) return [];
    return result.payload.features.map(poiToPlace).filter(Boolean).slice(0, limit);
  }

  function formatRouteSummary(apiResult) {
    const route = apiResult?.data?.routes?.[0] || apiResult?.routes?.[0];
    if (!route) return null;
    const km = route.distance ? (route.distance / 1000).toFixed(1) : null;
    const minutes = route.duration ? Math.round(route.duration / 60) : null;
    const parts = [];
    if (km) parts.push(`${km} km`);
    if (minutes) parts.push(`~${minutes} min`);
    const label = route.name || "Ruta sugerida";
    return parts.length ? `${label}: ${parts.join(" · ")}` : label;
  }

  global.TwinmapApi = {
    API_BASE_URL,
    checkHealth,
    getCrowds,
    getBirds,
    getBirdForecast,
    calculateRoute,
    planAssistantRoute,
    getWeatherBundle,
    getPlaceForecast,
    getPoisGeojson,
    loadSupplementaryPlaces,
    weatherBundleToForecast,
    formatRouteSummary,
    isOnline: () => apiOnline,
  };

  checkHealth().catch(() => {
    apiOnline = false;
  });
})(window);
