// Descarga los límites de los 14 departamentos de El Salvador (geoBoundaries, sin key)
// y le asigna un color distinto a cada uno. Correr: node scripts/fetch-departments.mjs
import { writeFileSync, mkdirSync } from "node:fs";

const UA = { "User-Agent": "Mirus/1.0 (hackathon; edwineduardoxd@gmail.com)" };

// 14 colores bien diferenciados
const PALETTE = [
  "#e07a5f", "#3d84a8", "#f2cc8f", "#81b29a", "#c44536", "#5f7161", "#e9c46a",
  "#8d99ae", "#2a9d8f", "#e76f51", "#a8dadc", "#457b9d", "#bc6c25", "#606c38",
];

// Nombre corto (quita "Departamento de")
const corto = (n) => n.replace(/^Departamento de\s+/i, "").trim();

async function run() {
  console.log("→ Consultando geoBoundaries…");
  const api = await fetch("https://www.geoboundaries.org/api/current/gbOpen/SLV/ADM1/", { headers: UA });
  const { gjDownloadURL } = await api.json();

  console.log("→ Descargando GeoJSON de departamentos…");
  const res = await fetch(gjDownloadURL, { headers: UA });
  const geojson = await res.json();

  geojson.features.forEach((f, i) => {
    f.properties = {
      name: corto(f.properties.shapeName),
      color: PALETTE[i % PALETTE.length],
    };
  });

  mkdirSync("data", { recursive: true });
  writeFileSync("data/departments.geojson", JSON.stringify(geojson));
  console.log(`\n✓ Guardado data/departments.geojson con ${geojson.features.length} departamentos`);
  console.log("  ", geojson.features.map((f) => f.properties.name).join(", "));
}

run().catch((e) => { console.error("Error:", e.message); process.exit(1); });
