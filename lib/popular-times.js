// Librería compartida: trae "Popular Times" (intensidad de gente) desde SerpAPI.
// Primero resuelve un lugar y luego consulta su detalle, donde SerpAPI entrega popular_times.

import { readFile } from "node:fs/promises";

// Respaldo si no hay cache de turismo oficial
const FALLBACK_PLACES = [
  { q: "Catedral Metropolitana de San Salvador", lat: 13.6989, lng: -89.1914, department: "San Salvador" },
  { q: "Mercado Central de San Salvador", lat: 13.6968, lng: -89.1915, department: "San Salvador" },
  { q: "Playa El Tunco El Salvador", lat: 13.4936, lng: -89.3819, department: "La Libertad" },
  { q: "Lago de Coatepeque El Salvador", lat: 13.8667, lng: -89.5500, department: "Santa Ana" },
  { q: "Juayúa El Salvador", lat: 13.8411, lng: -89.7450, department: "Sonsonate" },
  { q: "Concepción de Ataco El Salvador", lat: 13.8703, lng: -89.8497, department: "Ahuachapán" },
  { q: "Suchitoto El Salvador", lat: 13.9411, lng: -89.0286, department: "Cuscatlán" },
];

const SKIP_SLUGS = new Set(["volcan-santa-ana"]);

function placeScore(place) {
  return (place.featured ? 2 : 0) + (place.verified ? 1 : 0);
}

export async function loadTourismPlaces(path = "data/tourism-official.geojson") {
  try {
    const geojson = JSON.parse(await readFile(path, "utf8"));
    const seen = new Map();
    for (const feature of geojson.features || []) {
      const p = feature.properties || {};
      if (SKIP_SLUGS.has(p.slug)) continue;
      const [lng, lat] = feature.geometry?.coordinates || [];
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
      const entry = {
        q: `${p.name} El Salvador`,
        lat,
        lng,
        department: p.department || "",
        slug: p.slug || "",
        featured: Boolean(p.featured),
        verified: Boolean(p.verified),
      };
      const prev = seen.get(key);
      if (!prev || placeScore(entry) > placeScore(prev)) seen.set(key, entry);
    }
    const places = [...seen.values()].sort((a, b) => placeScore(b) - placeScore(a) || a.q.localeCompare(b.q, "es"));
    return places.length ? places : FALLBACK_PLACES;
  } catch (error) {
    console.warn("popular-times: sin cache de turismo, usando respaldo:", error.message);
    return FALLBACK_PLACES;
  }
}

let placesCache = null;

export async function getPlaces() {
  if (!placesCache) placesCache = await loadTourismPlaces();
  return placesCache;
}

/** @deprecated Usar getPlaces() — se mantiene por compatibilidad */
export const PLACES = FALLBACK_PLACES;

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
      slug: place.slug || "",
      featured: place.featured || false,
      verified: place.verified || false,
    },
  };
}

const CATEGORY_WEIGHT = {
  Playas: 8, Beach: 8, "Parques Nacionales": 10, "Pueblos Turísticos": 9,
  "Zonas Arqueológicas Mayas": 8, Volcanes: 7, Volcano: 7, "Rutas Turísticas": 6,
};

/** Potencial turístico MITUR 25–95 (rating + destacado + verificado + categoría). */
export function estimateBusyness(props = {}) {
  let score = 28;
  if (Number.isFinite(props.rating)) score += (props.rating / 5) * 32;
  if (props.featured) score += 25;
  if (props.verified) score += 15;
  const cat = props.category || props.officialCategory || "";
  score += CATEGORY_WEIGHT[cat] || 4;
  return Math.min(95, Math.max(25, Math.round(score)));
}

function coordKey(feature) {
  const [lng, lat] = feature.geometry?.coordinates || [];
  return `${Number(lat).toFixed(3)},${Number(lng).toFixed(3)}`;
}

/** GeoJSON de calor desde data/tourism-official.geojson (sin API). */
export async function buildEstimatedCrowdsFromTourism(path = "data/tourism-official.geojson") {
  const geojson = JSON.parse(await readFile(path, "utf8"));
  return {
    type: "FeatureCollection",
    metadata: {
      source: "Estimado MITUR (featured · verified · rating)",
      fetched_at: new Date().toISOString(),
      estimated: true,
      place_count: geojson.features?.length || 0,
    },
    features: (geojson.features || []).map((feature) => ({
      type: "Feature",
      geometry: feature.geometry,
      properties: {
        name: feature.properties?.name || "Destino",
        department: feature.properties?.department || "",
        slug: feature.properties?.slug || "",
        featured: Boolean(feature.properties?.featured),
        verified: Boolean(feature.properties?.verified),
        rating: feature.properties?.rating ?? null,
        category: feature.properties?.category || "",
        busyness: estimateBusyness(feature.properties || {}),
        is_live: false,
        is_estimated: true,
        info: "Potencial turístico MITUR",
        peak_hour: "",
        peak_score: null,
      },
    })),
  };
}

/** Combina lecturas SerpAPI con estimaciones MITUR donde falta dato. */
export function mergeCrowdsWithEstimates(live, estimated) {
  const features = [...(live?.features || [])];
  const seen = new Set(
    features.filter((f) => Number.isFinite(f.properties?.busyness)).map(coordKey),
  );
  for (const feature of estimated?.features || []) {
    if (seen.has(coordKey(feature))) continue;
    features.push(feature);
    seen.add(coordKey(feature));
  }
  return {
    type: "FeatureCollection",
    metadata: {
      ...(estimated?.metadata || {}),
      merged_with: live?.metadata?.source || "serpapi",
      merged_at: new Date().toISOString(),
    },
    features,
  };
}

export async function fetchCrowds(key, places) {
  if (!key) throw new Error("Falta SERPAPI_KEY.");
  const list = places || await getPlaces();
  const features = [];
  const errors = [];
  for (const place of list) {
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
    metadata: {
      source: "Google Popular Times vía SerpAPI",
      fetched_at: new Date().toISOString(),
      place_count: list.length,
      errors,
    },
    features,
  };
}
