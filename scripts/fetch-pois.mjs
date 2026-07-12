// Trae TODOS los POIs de El Salvador desde Overpass y los guarda como GeoJSON local.
// Correr UNA sola vez (o cuando quieras refrescar):  node scripts/fetch-pois.mjs
import { writeFileSync, mkdirSync } from "node:fs";

const QUERY = `[out:json][timeout:180];
area["ISO3166-1"="SV"][admin_level=2]->.sv;
(
  node["tourism"](area.sv);
  way["tourism"](area.sv);
  node["amenity"="restaurant"](area.sv);
  node["amenity"="cafe"](area.sv);
  node["amenity"="bar"](area.sv);
  node["natural"="beach"](area.sv);
  node["historic"](area.sv);
  node["leisure"="park"](area.sv);
);
out center body;`;

const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.osm.ch/api/interpreter",
];

// Clasifica cada POI en una categoría simple para pintarlo/filtrarlo en el mapa
function categoria(tags = {}) {
  if (tags.tourism === "hotel" || tags.tourism === "guest_house" || tags.tourism === "hostel") return "hospedaje";
  if (tags.amenity === "restaurant" || tags.amenity === "cafe" || tags.amenity === "bar") return "comida";
  if (tags.natural === "beach") return "playa";
  if (tags.historic) return "historico";
  if (tags.leisure === "park") return "parque";
  if (tags.tourism) return "turismo";
  return "otro";
}

async function run() {
  let elements = null;
  for (const url of MIRRORS) {
    try {
      console.log("→ Consultando", url, "…");
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mirus/1.0 (hackathon; edwineduardoxd@gmail.com)",
        },
        body: "data=" + encodeURIComponent(QUERY),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      elements = data.elements || [];
      console.log("✓ OK:", elements.length, "elementos crudos");
      break;
    } catch (e) {
      console.warn("✗ Falló", url, "-", e.message);
    }
  }
  if (!elements) { console.error("Todos los mirrors fallaron. Reintenta en un minuto."); process.exit(1); }

  const features = elements
    .map((e) => {
      const lon = e.lon ?? e.center?.lon;
      const lat = e.lat ?? e.center?.lat;
      if (lon == null || lat == null) return null;
      const t = e.tags || {};
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lon, lat] },
        properties: {
          name: t.name || "Sin nombre",
          cat: categoria(t),
          kind: t.tourism || t.amenity || t.natural || t.historic || t.leisure || "poi",
          website: t.website || t["contact:website"] || "",
          phone: t.phone || t["contact:phone"] || "",
        },
      };
    })
    .filter(Boolean);

  const geojson = { type: "FeatureCollection", features };
  mkdirSync("data", { recursive: true });
  writeFileSync("data/pois.geojson", JSON.stringify(geojson));

  // Resumen por categoría
  const conteo = {};
  for (const f of features) conteo[f.properties.cat] = (conteo[f.properties.cat] || 0) + 1;
  console.log("\n✓ Guardado data/pois.geojson con", features.length, "POIs");
  console.log("  Por categoría:", conteo);
}

run();
