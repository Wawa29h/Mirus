// Convierte el export oficial de turismo (JSON) a GeoJSON cacheado.
// Uso:
//   node scripts/fetch-tourism.mjs
//   node scripts/fetch-tourism.mjs --file data/tourism-export.json
//   node scripts/fetch-tourism.mjs --url https://api.ejemplo.com/tourism/export
//
// El JSON esperado: { success, data: { metadata, statistics, dataset: [...] } }

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const DEFAULT_INPUT = "data/tourism-export.json";
const OUTPUT = "data/tourism-official.geojson";

// 26 categorías oficiales → categoría del mapa (iconos / filtros)
export const OFFICIAL_TO_CAT = {
  "Aeropuertos": "turismo",
  "Balnearios y Aguas Termales": "parque",
  "Beach": "playa",
  "Centros Comerciales": "turismo",
  "Centros Culturales": "historico",
  "Centros Históricos": "historico",
  "Ferias y Artesanías": "turismo",
  "Iglesias y Templos": "historico",
  "Lagos y Lagunas": "parque",
  "Malecones": "playa",
  "Mercados": "comida",
  "Miradores": "montana",
  "Museos": "historico",
  "Parques Nacionales": "parque",
  "Parques Urbanos": "parque",
  "Playas": "playa",
  "Puertos": "turismo",
  "Pueblos Turísticos": "historico",
  "Reservas Naturales": "parque",
  "Ríos y Cascadas": "cascada",
  "Rutas Turísticas": "turismo",
  "Sitios Arqueológicos": "historico",
  "Terminales de Transporte": "turismo",
  "Volcanes": "volcan",
  "Volcano": "volcan",
  "Zonas Arqueológicas Mayas": "historico",
};

function parseArgs(argv) {
  const args = { file: DEFAULT_INPUT, url: null };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--file" && argv[i + 1]) { args.file = argv[++i]; continue; }
    if (argv[i] === "--url" && argv[i + 1]) { args.url = argv[++i]; continue; }
  }
  return args;
}

function mapCategory(official) {
  return OFFICIAL_TO_CAT[official] || "turismo";
}

function normalizeDataset(payload) {
  if (Array.isArray(payload?.dataset)) return payload.dataset;
  if (Array.isArray(payload?.data?.dataset)) return payload.data.dataset;
  if (Array.isArray(payload)) return payload;
  throw new Error("No se encontró data.dataset[] en el JSON.");
}

function toFeature(row) {
  const lat = Number(row.latitude);
  const lng = Number(row.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const category = String(row.category || "").trim();
  const cat = mapCategory(category);
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [lng, lat] },
    properties: {
      official_id: row.id || "",
      name: row.name || "Sin nombre",
      slug: row.slug || "",
      category,
      cat,
      department: row.department || "",
      municipality: row.municipality || "",
      address: row.address || "",
      rating: row.rating ?? null,
      verified: Boolean(row.verified),
      featured: Boolean(row.featured),
      source: "MITUR",
    },
  };
}

export function buildTourismGeoJson(payload) {
  const rows = normalizeDataset(payload);
  const features = rows.map(toFeature).filter(Boolean);
  const metadata = payload?.data?.metadata || payload?.metadata || {};
  const departments = new Set(features.map((f) => f.properties.department).filter(Boolean));
  const categories = new Set(features.map((f) => f.properties.category).filter(Boolean));
  return {
    type: "FeatureCollection",
    metadata: {
      source: "Catálogo oficial de turismo",
      fetched_at: metadata.generatedAt || new Date().toISOString(),
      record_count: features.length,
      department_count: departments.size,
      category_count: categories.size,
      locale: metadata.locale || "es-SV",
      statistics: payload?.data?.statistics || payload?.statistics || null,
    },
    features,
  };
}

async function loadPayload({ file, url }) {
  if (url) {
    console.log("→ Descargando", url, "…");
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  console.log("→ Leyendo", file, "…");
  return JSON.parse(readFileSync(file, "utf8"));
}

async function run() {
  const args = parseArgs(process.argv);
  const payload = await loadPayload(args);
  const geojson = buildTourismGeoJson(payload);

  mkdirSync("data", { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(geojson));
  const featured = geojson.features.filter((f) => f.properties.featured).length;
  const verified = geojson.features.filter((f) => f.properties.verified).length;
  console.log(`✓ Guardado ${OUTPUT} · ${geojson.features.length} destinos (${verified} verificados, ${featured} destacados)`);
}

run().catch((error) => {
  console.error("✗", error.message);
  process.exit(1);
});
