import { mkdirSync, writeFileSync } from "node:fs";

const MIRRORS = ["https://overpass.kumi.systems/api/interpreter", "https://overpass-api.de/api/interpreter", "https://overpass.osm.ch/api/interpreter"];
const QUERY = `[out:json][timeout:120];area["ISO3166-1"="SV"][admin_level=2]->.sv;nwr["amenity"="parking"](area.sv);out center tags;`;

async function request() {
  for (const url of MIRRORS) {
    try {
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "TwinMap/1.0" }, body: "data=" + encodeURIComponent(QUERY), signal: AbortSignal.timeout(90000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()).elements || [];
    } catch (error) { console.warn(`${url}: ${error.message}`); }
  }
  throw new Error("No se pudo obtener parqueos de Overpass.");
}

const elements = await request();
const features = elements.map((item) => {
  const lng = item.lon ?? item.center?.lon, lat = item.lat ?? item.center?.lat;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  const t = item.tags || {};
  return { type: "Feature", geometry: { type: "Point", coordinates: [lng, lat] }, properties: {
    name: t.name || "Parqueo", type: t.parking || "no especificado", capacity: t.capacity || "", fee: t.fee || "", access: t.access || "", opening_hours: t.opening_hours || "", covered: t.covered || "", wheelchair: t.wheelchair || "", source: "OpenStreetMap"
  }};
}).filter(Boolean);
mkdirSync("data", { recursive: true });
writeFileSync("data/parking.geojson", JSON.stringify({ type: "FeatureCollection", metadata: { source: "OpenStreetMap", fetched_at: new Date().toISOString(), disclaimer: "Capacidad y disponibilidad dependen de etiquetas publicas; no representa espacios libres en tiempo real." }, features }));
console.log(`Guardado data/parking.geojson: ${features.length} parqueos`);
