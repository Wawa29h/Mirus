import { mkdirSync, writeFileSync } from "node:fs";

const MIRRORS = ["https://overpass.kumi.systems/api/interpreter", "https://overpass-api.de/api/interpreter"];
const QUERY = `[out:json][timeout:90];
area["ISO3166-1"="SV"][admin_level=2]->.sv;
relation["route"="hiking"](area.sv);
out tags center;`;

let elements = [];
for (const mirror of MIRRORS) {
  try {
    console.log(`Consultando ${mirror}...`);
    const response = await fetch(mirror, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "TwinMap/1.0" }, body: "data=" + encodeURIComponent(QUERY), signal: AbortSignal.timeout(90000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    elements = (await response.json()).elements || [];
    break;
  } catch (error) { console.warn(error.message); }
}

if (!elements.length) { console.error("No hubo respuesta valida de Overpass. Reintenta mas tarde."); process.exit(1); }

const features = elements.map((element) => {
  const tags = element.tags || {};
  const lng = element.center?.lon;
  const lat = element.center?.lat;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { type: "Feature", geometry: { type: "Point", coordinates: [lng, lat] }, properties: { osm_id: `relation/${element.id}`, name: tags.name || "Sendero sin nombre", category: "trail", distance: tags.distance || "", website: tags.website || "" } };
}).filter(Boolean);

mkdirSync("data", { recursive: true });
writeFileSync("data/trails.geojson", JSON.stringify({ type: "FeatureCollection", features }));
console.log(`Guardado data/trails.geojson: ${features.length} senderos`);
