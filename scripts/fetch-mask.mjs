// Construye una "máscara isla": un polígono que cubre TODO el mundo excepto El Salvador,
// usando el contorno del país (geoBoundaries ADM0) como huecos. Al rellenarlo de azul,
// solo se ve El Salvador -> parece una isla.
// Correr: node scripts/fetch-mask.mjs
import { writeFileSync, mkdirSync } from "node:fs";

const UA = { "User-Agent": "Mirus/1.0 (hackathon; edwineduardoxd@gmail.com)" };

// --- Simplificación Douglas-Peucker (reduce puntos manteniendo la forma) ---
function perpDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy || 1e-12;
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  const px = a[0] + t * dx, py = a[1] + t * dy;
  return Math.hypot(p[0] - px, p[1] - py);
}
function dp(points, eps) {
  if (points.length < 3) return points;
  let maxD = 0, idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], points[0], points[points.length - 1]);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD > eps) {
    const left = dp(points.slice(0, idx + 1), eps);
    const right = dp(points.slice(idx), eps);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}
function simplifyRing(ring, eps) {
  const s = dp(ring, eps);
  if (s[0][0] !== s[s.length - 1][0] || s[0][1] !== s[s.length - 1][1]) s.push(s[0]); // cerrar
  return s;
}

async function run() {
  console.log("→ Consultando geoBoundaries (ADM0 El Salvador)…");
  const api = await fetch("https://www.geoboundaries.org/api/current/gbOpen/SLV/ADM0/", { headers: UA });
  const { gjDownloadURL } = await api.json();
  const res = await fetch(gjDownloadURL, { headers: UA });
  const geojson = await res.json();

  // Reunir los anillos EXTERIORES de cada polígono del país (soporta Polygon y MultiPolygon)
  const holesRaw = [];
  for (const f of geojson.features) {
    const g = f.geometry;
    if (g.type === "Polygon") holesRaw.push(g.coordinates[0]);
    else if (g.type === "MultiPolygon") g.coordinates.forEach((poly) => holesRaw.push(poly[0]));
  }
  // Simplificar cada anillo (~330m) para que el tesselador no falle con el rectángulo del mundo
  const EPS = 0.003;
  const holes = holesRaw.map((r) => simplifyRing(r, EPS));
  console.log(`  contorno: ${holesRaw.length} anillo(s), ${holesRaw[0].length} → ${holes[0].length} puntos tras simplificar`);

  // Anillo exterior = todo el mundo, en sentido HORARIO (convención Turf, requerido
  // para que Mapbox rellene el exterior). Los anillos del país van como huecos (CCW).
  const world = [[180, 90], [-180, 90], [-180, -90], [180, -90], [180, 90]];
  const mask = {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [world, ...holes] },
    }],
  };

  mkdirSync("data", { recursive: true });
  writeFileSync("data/mask.geojson", JSON.stringify(mask));
  writeFileSync("data/elsalvador.geojson", JSON.stringify(geojson));
  console.log("✓ Guardado data/mask.geojson (máscara isla) y data/elsalvador.geojson (contorno)");
}

run().catch((e) => { console.error("Error:", e.message); process.exit(1); });
