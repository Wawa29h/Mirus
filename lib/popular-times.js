// Librería compartida: trae "Popular Times" (intensidad de gente) desde SerpAPI.
// Primero resuelve un lugar y luego consulta su detalle, donde SerpAPI entrega popular_times.

export const PLACES = [
  { q: "Centro Histórico San Salvador El Salvador", lat: 13.6989, lng: -89.1914, department: "San Salvador" },
  { q: "Parque Libertad Santa Ana El Salvador", lat: 13.9942, lng: -89.5597, department: "Santa Ana" },
  { q: "Parque La Concordia Ahuachapán El Salvador", lat: 13.9220, lng: -89.8450, department: "Ahuachapán" },
  { q: "Parque Rafael Campos Sonsonate El Salvador", lat: 13.7189, lng: -89.7240, department: "Sonsonate" },
  { q: "Parque Daniel Hernández Santa Tecla El Salvador", lat: 13.6766, lng: -89.2797, department: "La Libertad" },
  { q: "Parque Central Chalatenango El Salvador", lat: 14.0725, lng: -89.0941, department: "Chalatenango" },
  { q: "Parque Rafael Cabrera Cojutepeque El Salvador", lat: 13.7212, lng: -88.9364, department: "Cuscatlán" },
  { q: "Parque Central Zacatecoluca El Salvador", lat: 13.5007, lng: -88.8685, department: "La Paz" },
  { q: "Parque Central Sensuntepeque El Salvador", lat: 13.8668, lng: -88.6287, department: "Cabañas" },
  { q: "Parque Central San Vicente El Salvador", lat: 13.6409, lng: -88.7850, department: "San Vicente" },
  { q: "Parque Central Usulután El Salvador", lat: 13.3458, lng: -88.4420, department: "Usulután" },
  { q: "Parque Guzmán San Miguel El Salvador", lat: 13.4838, lng: -88.1772, department: "San Miguel" },
  { q: "Parque Central San Francisco Gotera El Salvador", lat: 13.6962, lng: -88.1011, department: "Morazán" },
  { q: "Parque Central La Unión El Salvador", lat: 13.3362, lng: -87.8405, department: "La Unión" },
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
  const result = search.local_results?.[0];
  if (!result) return null;

  const identifier = result.place_id || result.data_id || result.data_cid;
  if (!identifier) return null;
  const detailParams = { engine: "google_maps", type: "place", hl: "es" };
  if (result.data_cid && !result.place_id && !result.data_id) detailParams.data_cid = identifier;
  else detailParams.place_id = identifier;
  const detail = await serpRequest(key, detailParams);
  const r = detail.place_results;
  if (!r) return null;

  const coords = r.gps_coordinates || result.gps_coordinates || {};
  const pt = r.popular_times || {};
  const currentDay = pt.current_day || DAYS[new Date().getDay()];
  const graph = pt.graph_results?.[currentDay] || [];
  const hour = new Date().getHours();
  const slot = graph.find((g) => parseHour(g.time) === hour);
  let peak = null;
  for (const g of graph) if (g.busyness_score != null && (!peak || g.busyness_score > peak.busyness_score)) peak = g;

  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [coords.longitude ?? place.lng, coords.latitude ?? place.lat] },
    properties: {
      name: r.title || result.title || place.q,
      department: place.department || "",
      busyness: slot?.busyness_score ?? null,
      is_live: Boolean(pt.live_hash),
      info: pt.live_hash?.info || slot?.info || "Sin lectura de intensidad disponible",
      peak_hour: peak?.time || "",
      peak_score: peak?.busyness_score ?? null,
      rating: r.rating ?? result.rating ?? null,
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
