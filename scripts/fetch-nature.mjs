import { mkdirSync, writeFileSync } from "node:fs";

const MIRRORS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.osm.ch/api/interpreter",
];

const TYPES = [
  ["volcano", 'nwr["natural"="volcano"](area.sv);'],
  ["mountain", 'nwr["natural"="peak"](area.sv);'],
  ["waterfall", 'nwr["natural"="waterfall"](area.sv); nwr["waterway"="waterfall"](area.sv);'],
  ["viewpoint", 'nwr["tourism"="viewpoint"](area.sv);'],
];

async function query(query) {
  for (const mirror of MIRRORS) {
    try {
      const response = await fetch(mirror, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "TwinMap/1.0" },
        body: "data=" + encodeURIComponent(query),
        signal: AbortSignal.timeout(60000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()).elements || [];
    } catch (error) {
      console.warn(`  ${mirror}: ${error.message}`);
    }
  }
  return null;
}

function feature(element, category) {
  const lng = element.lon ?? element.center?.lon;
  const lat = element.lat ?? element.center?.lat;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  const tags = element.tags || {};
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [lng, lat] },
    properties: {
      osm_id: `${element.type}/${element.id}`,
      category,
      name: tags.name || "Sin nombre",
      elevation_m: Number(tags.ele) || null,
      website: tags.website || tags["contact:website"] || "",
      phone: tags.phone || tags["contact:phone"] || "",
      access: tags.access || "",
      image: tags.image || "",
    },
  };
}

const area = 'area["ISO3166-1"="SV"][admin_level=2]->.sv;';
const features = [];
for (const [category, statement] of TYPES) {
  console.log(`Buscando ${category}...`);
  const elements = await query(`[out:json][timeout:60];${area}(${statement});out center tags;`);
  if (elements === null) { console.warn(`  No se pudo obtener ${category}; se omitio sin sobrescribir datos validos.`); continue; }
  const group = elements.map((element) => feature(element, category)).filter(Boolean);
  console.log(`  ${group.length} resultados`);
  features.push(...group);
}

if (!features.length) { console.error("No hubo respuesta valida de Overpass. Reintenta mas tarde."); process.exit(1); }
const unique = [...new Map(features.map((item) => [item.properties.osm_id, item])).values()];
mkdirSync("data", { recursive: true });
writeFileSync("data/nature.geojson", JSON.stringify({ type: "FeatureCollection", features: unique }));
console.log(`Guardado data/nature.geojson: ${unique.length} lugares`);
