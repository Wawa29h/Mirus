// Librería compartida: trae "Popular Times" (intensidad de gente) desde SerpAPI.
// Primero resuelve un lugar y luego consulta su detalle, donde SerpAPI entrega popular_times.

// Lugares turísticos concurridos que SÍ tienen "Popular Times" en Google (para el
// semáforo de flujo/capacidad). Variedad geográfica sin sacrificar cobertura de dato.
export const PLACES = [
  { q: "Catedral Metropolitana de San Salvador", lat: 13.6989, lng: -89.1914, department: "San Salvador" },
  { q: "Mercado Central de San Salvador", lat: 13.6968, lng: -89.1915, department: "San Salvador" },
  { q: "Plaza Libertad San Salvador", lat: 13.6979, lng: -89.1906, department: "San Salvador" },
  { q: "Plaza Gerardo Barrios San Salvador", lat: 13.6987, lng: -89.1917, department: "San Salvador" },
  { q: "Metrocentro San Salvador", lat: 13.7038, lng: -89.2186, department: "San Salvador" },
  { q: "Puerto de La Libertad El Salvador", lat: 13.4883, lng: -89.3220, department: "La Libertad" },
  { q: "Playa El Tunco El Salvador", lat: 13.4936, lng: -89.3819, department: "La Libertad" },
  { q: "Catedral de Santa Ana El Salvador", lat: 13.9946, lng: -89.5597, department: "Santa Ana" },
  { q: "Lago de Coatepeque El Salvador", lat: 13.8667, lng: -89.5500, department: "Santa Ana" },
  { q: "Juayúa El Salvador", lat: 13.8411, lng: -89.7450, department: "Sonsonate" },
  { q: "Concepción de Ataco El Salvador", lat: 13.8703, lng: -89.8497, department: "Ahuachapán" },
  { q: "Suchitoto El Salvador", lat: 13.9411, lng: -89.0286, department: "Cuscatlán" },
];

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function parseHour(timeStr) {
  const m = String(timeStr).match(/(\d+)\s*([ap])/i);
  if (!m) return null;
  let h = Number(m[1]);
  const pm = m[2].toLowerCase() === "p";
  if (pm && h !== 12) h += 12;
  if (!pm && h === 12) h = 0;
  return h;
}

async function serpRequest(key, params) {
  const url = new URL("https://serpapi.com/search.json");
  url.search = new URLSearchParams({ ...params, api_key: key }).toString();
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || `SerpAPI HTTP ${res.status}`);
  return data;
}

async function fetchPlace(place, key) {
  const search = await serpRequest(key, {
    engine: "google_maps", type: "search", q: place.q,
    ll: `@${place.lat},${place.lng},16z`, hl: "es",
  });
  // La búsqueda puede resolver DIRECTO a un lugar (place_results) o dar una lista (local_results)
  let r = search.place_results || null;
  let result = null;
  if (!r) {
    result = search.local_results?.[0];
    if (!result) return null;
    const identifier = result.place_id || result.data_id || result.data_cid;
    if (!identifier) return null;
    const detailParams = { engine: "google_maps", type: "place", hl: "es" };
    if (result.data_cid && !result.place_id && !result.data_id) detailParams.data_cid = identifier;
    else detailParams.place_id = identifier;
    const detail = await serpRequest(key, detailParams);
    r = detail.place_results;
  }
  if (!r) return null;

  const coords = r.gps_coordinates || result?.gps_coordinates || {};
  const pt = r.popular_times || {};
  const currentDay = pt.current_day || DAYS[new Date().getDay()];
  const graph = pt.graph_results?.[currentDay] || [];
  const hour = new Date().getHours();
  let slot = graph.find((g) => parseHour(g.time) === hour);
  // Si no hay dato para la hora exacta, usar la hora más cercana con lectura
  if (!slot && graph.length) {
    slot = graph.filter((g) => g.busyness_score != null)
      .sort((a, b) => Math.abs(parseHour(a.time) - hour) - Math.abs(parseHour(b.time) - hour))[0];
  }
  let peak = null;
  for (const g of graph) if (g.busyness_score != null && (!peak || g.busyness_score > peak.busyness_score)) peak = g;

  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [coords.longitude ?? place.lng, coords.latitude ?? place.lat] },
    properties: {
      name: r.title || result?.title || place.q,
      department: place.department || "",
      busyness: slot?.busyness_score ?? null,
      is_live: Boolean(pt.live_hash),
      info: pt.live_hash?.info || slot?.info || "Sin lectura de intensidad disponible",
      peak_hour: peak?.time || "",
      peak_score: peak?.busyness_score ?? null,
      rating: r.rating ?? result?.rating ?? null,
    },
  };
}

export async function fetchCrowds(key, places = PLACES) {
  if (!key) throw new Error("Falta SERPAPI_KEY.");
  const features = [];
  const errors = [];
  for (const place of places) {
    try {
      const feature = await fetchPlace(place, key);
      if (feature) features.push(feature);
    } catch (error) {
      errors.push({ place: place.q, error: error.message });
      console.warn(`crowds: falló ${place.q}: ${error.message}`);
    }
  }
  return {
    type: "FeatureCollection",
    metadata: { source: "Google Popular Times vía SerpAPI", fetched_at: new Date().toISOString(), errors },
    features,
  };
}
