// Descarga avistamientos de GBIF y los guarda como GeoJSON. No necesita API key.
// Uso: node scripts/fetch-biodiversity.mjs --lat 13.74 --lng -90.05 --radius 25 --name "Mi destino"
import { mkdirSync, writeFileSync } from "node:fs";

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
};
const lat = Number(arg("lat", "13.74"));
const lng = Number(arg("lng", "-90.05"));
const radiusKm = Math.min(Math.max(Number(arg("radius", "25")), 1), 100);
const name = arg("name", "Destino seleccionado");
if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radiusKm)) throw new Error("--lat, --lng y --radius deben ser números.");

const latDelta = radiusKm / 111;
const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
const url = new URL("https://api.gbif.org/v1/occurrence/search");
url.search = new URLSearchParams({
  decimalLatitude: `${lat - latDelta},${lat + latDelta}`,
  decimalLongitude: `${lng - lngDelta},${lng + lngDelta}`,
  hasCoordinate: "true", basisOfRecord: "HUMAN_OBSERVATION", limit: "300",
}).toString();
const response = await fetch(url, { headers: { "User-Agent": "Mirus/1.0" } });
if (!response.ok) throw new Error(`GBIF respondió HTTP ${response.status}`);
const payload = await response.json();
const seen = new Set();
const features = payload.results.flatMap((record) => {
  if (!Number.isFinite(record.decimalLongitude) || !Number.isFinite(record.decimalLatitude)) return [];
  const key = `${record.speciesKey || record.scientificName}|${record.decimalLongitude.toFixed(3)}|${record.decimalLatitude.toFixed(3)}`;
  if (seen.has(key)) return [];
  seen.add(key);
  return [{ type: "Feature", geometry: { type: "Point", coordinates: [record.decimalLongitude, record.decimalLatitude] }, properties: { scientific_name: record.scientificName || "Especie sin identificar", common_name: record.vernacularName || "", kingdom: record.kingdom || "", observed_on: record.eventDate || record.lastInterpreted || "", source: "GBIF" } }];
});
const output = { type: "FeatureCollection", metadata: { source: "GBIF", fetched_at: new Date().toISOString(), destination: { name, lat, lng, radius_km: radiusKm }, records_found: payload.count }, features };
mkdirSync("data", { recursive: true });
writeFileSync("data/biodiversity.geojson", JSON.stringify(output));
console.log(`✓ Biodiversidad guardada en data/biodiversity.geojson (${features.length} puntos únicos)`);
