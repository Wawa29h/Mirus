// Comprobador de TomTom: verifica tu key con Traffic Flow (proxy de actividad),
// Routing (ruta A→B con tráfico) y Search (POIs). No modifica nada.
//
// Uso (lee .env automáticamente):
//   node scripts/test-tomtom.mjs
//   node scripts/test-tomtom.mjs --lat 13.70 --lng -89.21

import "dotenv/config";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const KEY = process.env.TOMTOM_API_KEY || process.env.TOMTOM_KEY;
if (!KEY) {
  console.error("✗ Falta TOMTOM_API_KEY en .env (o TOMTOM_KEY en el entorno).");
  process.exit(1);
}

const lat = arg("lat", "13.6929"); // centro de San Salvador
const lng = arg("lng", "-89.2182");

async function probe(label, url) {
  process.stdout.write(`\n── ${label}\n`);
  try {
    const res = await fetch(url);
    const body = await res.text();
    console.log(`   [HTTP ${res.status}]`);
    if (res.ok) return JSON.parse(body);
    console.log(`   ✗ ${body.slice(0, 180)}`);
  } catch (e) {
    console.log(`   ✗ error de red: ${e.message}`);
  }
  return null;
}

console.log("Probando tu key de TomTom…");

// 1) TRAFFIC FLOW — el proxy de "actividad" por punto
const flow = await probe(
  "TRAFFIC FLOW (actividad en un punto)",
  `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${lat},${lng}&key=${KEY}`
);
if (flow?.flowSegmentData) {
  const f = flow.flowSegmentData;
  const ratio = (f.currentSpeed / f.freeFlowSpeed);
  const congestion = Math.round((1 - ratio) * 100);
  console.log(`   ✓ velocidad actual ${f.currentSpeed} / libre ${f.freeFlowSpeed} km/h`);
  console.log(`   → congestión ~${congestion}%  (más congestión = más actividad/gente)`);
}

// 2) ROUTING — ruta A→B con tráfico
const route = await probe(
  "ROUTING (ruta A→B con tráfico)",
  `https://api.tomtom.com/routing/1/calculateRoute/${lat},${lng}:13.49,-89.31/json?traffic=true&key=${KEY}`
);
if (route?.routes?.[0]) {
  const s = route.routes[0].summary;
  console.log(`   ✓ ${(s.lengthInMeters/1000).toFixed(1)} km · ${Math.round(s.travelTimeInSeconds/60)} min (con tráfico)`);
}

// 3) SEARCH — POIs cercanos
const search = await probe(
  "SEARCH (POIs cercanos)",
  `https://api.tomtom.com/search/2/poiSearch/restaurante.json?lat=${lat}&lon=${lng}&radius=3000&limit=5&key=${KEY}`
);
if (search?.results) {
  console.log(`   ✓ ${search.results.length} lugares. Ej: ${search.results.slice(0,3).map(r=>r.poi?.name).join(", ")}`);
}

console.log("\n══════════ RESULTADO ══════════");
if (flow?.flowSegmentData) console.log("✓ Tu key sirve. Traffic Flow = tu capa de actividad por zona.");
else console.log("✗ Revisa la key (401 = inválida). Sácala en developer.tomtom.com");
