// Pronóstico HONESTO de concentración de aves migratorias.
// NO es un modelo entrenado ni rastreo GPS: es tendencia observada (eBird, semana actual vs
// anterior) + razonamiento de un LLM (OpenRouter) sobre patrones migratorios conocidos.
import { readFile } from "node:fs/promises";
import { getWeatherSignals } from "./weather-forecast.js";

// ---- Punto en polígono (ray casting) para asignar cada avistamiento a un departamento ----
function pointInRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    const intersect = (yi > lat) !== (yj > lat) &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
function pointInFeature(lng, lat, geom) {
  const polys = geom.type === "MultiPolygon" ? geom.coordinates : [geom.coordinates];
  for (const poly of polys) if (pointInRing(lng, lat, poly[0])) return true;
  return false;
}
async function loadDepartments() {
  try {
    const gj = JSON.parse(await readFile("data/departments.geojson", "utf8"));
    return gj.features.map((f) => ({ name: f.properties.name, geom: f.geometry }));
  } catch { return []; }
}
function departmentOf(lng, lat, depts) {
  for (const d of depts) if (pointInFeature(lng, lat, d.geom)) return d.name;
  return "Fuera/Costa";
}

// ---- Trae eBird (14 días) y arma tendencia esta semana vs la anterior, por departamento ----
export async function buildTrend(ebirdKey) {
  if (!ebirdKey) throw new Error("Falta EBIRD_API_KEY.");
  const url = new URL("https://api.ebird.org/v2/data/obs/SV/recent");
  url.search = new URLSearchParams({ back: "14", maxResults: "5000", sppLocale: "es" }).toString();
  const res = await fetch(url, { headers: { "X-eBirdApiToken": ebirdKey } });
  const obs = await res.json();
  if (!res.ok) throw new Error(obs?.message || "eBird HTTP " + res.status);

  const depts = await loadDepartments();
  const now = Date.now();
  const byDept = {};
  const speciesCount = {};

  for (const o of obs) {
    if (!Number.isFinite(o.lat) || !Number.isFinite(o.lng)) continue;
    const days = (now - new Date(o.obsDt).getTime()) / 86400000;
    const bucket = days < 7 ? "esta_semana" : days < 14 ? "semana_pasada" : null;
    if (!bucket) continue;
    const dept = departmentOf(o.lng, o.lat, depts);
    byDept[dept] ??= { esta_semana: 0, semana_pasada: 0, especies: {} };
    byDept[dept][bucket] += 1;
    const sp = o.comName || o.sciName;
    byDept[dept].especies[sp] = (byDept[dept].especies[sp] || 0) + 1;
    speciesCount[sp] = (speciesCount[sp] || 0) + (o.howMany || 1);
  }

  const por_departamento = Object.entries(byDept).map(([department, v]) => ({
    department,
    esta_semana: v.esta_semana,
    semana_pasada: v.semana_pasada,
    cambio: v.esta_semana - v.semana_pasada,
    top_especies: Object.entries(v.especies).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, c]) => `${n} (${c})`),
  })).sort((a, b) => b.esta_semana - a.esta_semana);

  const especies_frecuentes = Object.entries(speciesCount).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([n, c]) => `${n}: ${c}`);

  return { total_obs: obs.length, por_departamento, especies_frecuentes };
}

// ---- Prompt para el LLM ----
function buildPrompt(trend, weather) {
  const fecha = new Date().toISOString().slice(0, 10);
  return `Eres ornitólogo experto en aves de Centroamérica. Con estos avistamientos REALES de eBird en El Salvador (fecha ${fecha}), compara "esta_semana" vs "semana_pasada" por departamento e identifica qué especies son MIGRATORIAS (no residentes).

DATOS OBSERVADOS (reales, no inventes otros):
${JSON.stringify(trend)}

CLIMA PRONOSTICADO PARA LOS PR?XIMOS 5 D?AS (Open-Meteo, real):
${JSON.stringify(weather)}

Tarea: estima en qué departamentos es más probable que se concentren bandadas de aves MIGRATORIAS en los próximos 3-5 días, razonando sobre la tendencia observada, la época del año y rutas migratorias conocidas del Pacífico centroamericano. Sé honesto: si el dato es escaso o son mayormente residentes, dilo y baja la confianza.

SÉ MUY CONCISO para no truncarte: "resumen" máx 2 frases; máximo 6 zonas; cada "razon" máx 1 frase corta.
Responde SOLO JSON con esta forma exacta. Incluye los 5 dias del clima y usa solo departamentos presentes en los datos. Si no hay evidencia de movimiento, conserva o baja la zona y dilo en la razon:
{"resumen":"","zonas":[{"department":"","nivel":"alta|media|baja","especies_migratorias":[""],"razon":""}],"dias":[{"dia":1,"fecha":"YYYY-MM-DD","zonas":[{"department":"","nivel":"alta|media|baja","especies_migratorias":[""],"razon":""}]}],"confianza":"alta|media|baja","disclaimer":""}`;
}

// ---- Orquestador: datos reales + razonamiento LLM ----
export async function getMigrationForecast(ebirdKey, openrouterKey, model = "anthropic/claude-sonnet-5") {
  const trend = await buildTrend(ebirdKey);
  const weather = await getWeatherSignals();
  if (!openrouterKey) throw new Error("Falta OPENROUTER_API_KEY.");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openrouterKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: buildPrompt(trend, weather) }],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message || `OpenRouter HTTP ${res.status}`);

  let text = data.choices?.[0]?.message?.content || "";
  text = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim(); // limpiar fences
  let forecast;
  try { forecast = JSON.parse(text); }
  catch { forecast = { resumen: "El modelo no devolvió JSON válido.", zonas: [], raw: text.slice(0, 500) }; }

  return {
    generado: new Date().toISOString(),
    modelo: data.model || model,
    metodo: "Tendencia observada (eBird, esta semana vs anterior) + razonamiento LLM. No es modelo entrenado ni rastreo GPS.",
    tendencia: trend,
    clima: weather,
    pronostico: forecast,
  };
}
