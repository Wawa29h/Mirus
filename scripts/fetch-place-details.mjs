import { mkdirSync, writeFileSync } from "node:fs";

const MIRRORS = ["https://overpass.kumi.systems/api/interpreter", "https://overpass-api.de/api/interpreter", "https://overpass.osm.ch/api/interpreter"];
const QUERY = `[out:json][timeout:180];area["ISO3166-1"="SV"][admin_level=2]->.sv;(nwr["tourism"~"^(hotel|guest_house|hostel|motel)$"](area.sv);nwr["amenity"~"^(restaurant|cafe|bar|fast_food)$"](area.sv););out center tags;`;

async function request() {
  for (const url of MIRRORS) {
    try {
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Mirus/1.0" }, body: "data=" + encodeURIComponent(QUERY), signal: AbortSignal.timeout(120000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()).elements || [];
    } catch (error) { console.warn(`${url}: ${error.message}`); }
  }
  throw new Error("No se pudieron obtener detalles de lugares de Overpass.");
}

const elements = await request();
const features = elements.map((item) => {
  const lng = item.lon ?? item.center?.lon, lat = item.lat ?? item.center?.lat;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  const t = item.tags || {};
  return { type: "Feature", geometry: { type: "Point", coordinates: [lng, lat] }, properties: {
    name: t.name || "Sin nombre", kind: t.tourism || t.amenity || "lugar", opening_hours: t.opening_hours || "", cuisine: t.cuisine || "", phone: t.phone || t["contact:phone"] || "", website: t.website || t["contact:website"] || "", email: t.email || t["contact:email"] || "", stars: t.stars || "", rooms: t.rooms || "", internet_access: t.internet_access || "", wheelchair: t.wheelchair || "", outdoor_seating: t.outdoor_seating || "", takeaway: t.takeaway || "", delivery: t.delivery || "", payment: t["payment:credit_cards"] || "", source: "OpenStreetMap", availability: "Consultar directamente con el establecimiento"
  }};
}).filter(Boolean);
mkdirSync("data", { recursive: true });
writeFileSync("data/place-details.geojson", JSON.stringify({ type: "FeatureCollection", metadata: { source: "OpenStreetMap", fetched_at: new Date().toISOString(), disclaimer: "Los campos dependen de lo publicado por cada establecimiento. Precio, fotos y disponibilidad requieren proveedor comercial o contacto directo." }, features }));
console.log(`Guardado data/place-details.geojson: ${features.length} lugares enriquecidos`);
