import { readFile } from "node:fs/promises";
import { haversineKm } from "./geo.js";

const CATEGORY_MAP = {
  playa: { poiCats: ["playa"], natureCats: ["playa", "arrecife"], tourismCats: ["playa"] },
  naturaleza: { poiCats: ["parque", "turismo"], natureCats: ["humedal", "parque", "cascada", "volcan", "arrecife"], tourismCats: ["parque", "volcan", "cascada", "montana"] },
  comida: { poiCats: ["comida"], natureCats: [], tourismCats: ["comida"] },
  cultura: { poiCats: ["historico", "turismo"], natureCats: [], tourismCats: ["historico", "turismo"] },
  aves: { poiCats: ["parque"], natureCats: ["humedal", "parque"], tourismCats: ["parque"] },
};

const INTEREST_BOOST = {
  playa: { playa: 18, arrecife: 12 },
  naturaleza: { humedal: 20, parque: 16, cascada: 14, volcan: 12, montana: 10 },
  gastronomia: { comida: 22 },
  cultura: { historico: 18, turismo: 10 },
  aves: { humedal: 22, parque: 14 },
};

function normalizeName(name) {
  return String(name || "").trim();
}

async function loadJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function poiToDestination(feature, origin) {
  const [lng, lat] = feature.geometry.coordinates;
  const p = feature.properties || {};
  const name = normalizeName(p.name);
  if (!name || name === "Sin nombre") return null;
  return {
    id: `poi-${name}-${lng.toFixed(4)}-${lat.toFixed(4)}`,
    name,
    category: p.cat || "otro",
    kind: p.kind || p.cat || "lugar",
    lat,
    lng,
    distanceKm: Number(haversineKm([origin.lng, origin.lat], [lng, lat]).toFixed(1)),
    source: "OpenStreetMap",
    tags: [p.cat].filter(Boolean),
  };
}

function natureToDestination(feature, origin) {
  const [lng, lat] = feature.geometry.coordinates;
  const p = feature.properties || {};
  const name = normalizeName(p.name);
  if (!name) return null;
  return {
    id: `nature-${name}-${lng.toFixed(4)}-${lat.toFixed(4)}`,
    name,
    category: p.category || "naturaleza",
    kind: p.category || "naturaleza",
    lat,
    lng,
    distanceKm: Number(haversineKm([origin.lng, origin.lat], [lng, lat]).toFixed(1)),
    source: "Catálogo natural",
    tags: [p.category, p.department].filter(Boolean),
    blurb: p.access || p.season || "",
  };
}

function tourismToDestination(feature, origin) {
  const [lng, lat] = feature.geometry.coordinates;
  const p = feature.properties || {};
  const name = normalizeName(p.name);
  if (!name) return null;
  return {
    id: `official-${p.slug || p.id || name}`,
    name,
    category: p.cat || "turismo",
    kind: p.officialCategory || p.kind || "destino",
    lat,
    lng,
    distanceKm: Number(haversineKm([origin.lng, origin.lat], [lng, lat]).toFixed(1)),
    source: "MITUR",
    tags: [p.cat, p.officialCategory].filter(Boolean),
    blurb: p.address || "",
    verified: Boolean(p.verified),
    featured: Boolean(p.featured),
    rating: p.rating ?? null,
  };
}

function matchesTourismCategory(dest, map) {
  const cats = map.tourismCats || [];
  return cats.includes(dest.category);
}

function scoreDestination(dest, profile) {
  let score = Math.max(0, 100 - dest.distanceKm * 2.5);
  const interest = profile.interest || "playa";
  const boosts = INTEREST_BOOST[interest] || {};
  for (const tag of dest.tags || [dest.category]) {
    if (boosts[tag]) score += boosts[tag];
  }
  if (dest.featured) score += 25;
  if (dest.verified) score += 15;
  if (dest.rating != null) score += Math.round((Number(dest.rating) - 3.5) * 4);
  if (profile.crowds === "avoid" && (dest.category === "comida" || dest.kind === "restaurant")) {
    score -= 8;
  }
  if (profile.crowds === "like" && dest.category === "playa") score += 6;
  if (profile.pace === "zen" && ["humedal", "parque", "cascada"].includes(dest.category)) score += 10;
  if (profile.pace === "flash" && dest.distanceKm < 25) score += 8;
  return Math.round(score);
}

function reasonForDestination(dest, profile, score) {
  const bits = [];
  if (dest.distanceKm <= 30) bits.push(`${dest.distanceKm} km de ti`);
  if (dest.featured) bits.push("destino destacado MITUR");
  if (dest.verified) bits.push("verificado oficialmente");
  if (profile.interest === "playa" && dest.category === "playa") bits.push("encaja con tu gusto por playa");
  if (profile.interest === "aves" && ["humedal", "parque"].includes(dest.category)) bits.push("zona con potencial de aves");
  if (profile.pace === "zen" && ["humedal", "parque"].includes(dest.category)) bits.push("ritmo tranquilo");
  if (profile.crowds === "avoid") bits.push("menos presión turística");
  if (!bits.length) bits.push("buena opción según tu perfil");
  return { score, reason: bits.slice(0, 2).join(" · ") };
}

export async function rankDestinations(category, origin, profile = {}, limit = 12) {
  const map = CATEGORY_MAP[category] || CATEGORY_MAP.playa;
  const [poisRaw, natureRaw, tourismRaw] = await Promise.all([
    loadJson("data/pois.geojson"),
    loadJson("data/nature-curated.geojson").catch(() => ({ features: [] })),
    loadJson("data/tourism-official.geojson").catch(() => ({ features: [] })),
  ]);

  const seen = new Set();
  const items = [];

  for (const feature of poisRaw.features || []) {
    const cat = feature.properties?.cat;
    if (!map.poiCats.includes(cat)) continue;
    const dest = poiToDestination(feature, origin);
    if (!dest || seen.has(dest.id)) continue;
    seen.add(dest.id);
    items.push(dest);
  }

  for (const feature of natureRaw.features || []) {
    const cat = feature.properties?.category;
    if (!map.natureCats.includes(cat)) continue;
    const dest = natureToDestination(feature, origin);
    if (!dest || seen.has(dest.id)) continue;
    seen.add(dest.id);
    items.push(dest);
  }

  for (const feature of tourismRaw.features || []) {
    const dest = tourismToDestination(feature, origin);
    if (!dest || seen.has(dest.id)) continue;
    if (!matchesTourismCategory(dest, map)) continue;
    seen.add(dest.id);
    items.push(dest);
  }

  return items
    .map((dest) => {
      const scored = reasonForDestination(dest, profile, scoreDestination(dest, profile));
      return { ...dest, matchScore: scored.score, matchReason: scored.reason };
    })
    .sort((a, b) => b.matchScore - a.matchScore || a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export async function findScenicWaypoint(origin, destination) {
  const [nature, tourism] = await Promise.all([
    loadJson("data/nature-curated.geojson").catch(() => ({ features: [] })),
    loadJson("data/tourism-official.geojson").catch(() => ({ features: [] })),
  ]);
  const midLat = (origin.lat + destination.lat) / 2;
  const midLng = (origin.lng + destination.lng) / 2;
  let best = null;
  let bestDist = Infinity;

  const candidates = [
    ...(nature.features || []),
    ...(tourism.features || []).filter((f) => ["playa", "parque", "volcan", "cascada", "montana"].includes(f.properties?.cat)),
  ];

  for (const feature of candidates) {
    const cat = feature.properties?.category || feature.properties?.cat;
    if (!["playa", "humedal", "parque", "cascada", "arrecife", "volcan", "montana"].includes(cat)) continue;
    const [lng, lat] = feature.geometry.coordinates;
    const d = haversineKm([midLng, midLat], [lng, lat]);
    const boost = feature.properties?.featured ? 0.85 : 1;
    const weighted = d * boost;
    if (weighted < bestDist) {
      bestDist = weighted;
      best = { lat, lng, name: feature.properties.name };
    }
  }
  return bestDist < 80 ? best : null;
}
