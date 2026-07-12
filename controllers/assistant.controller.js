import { readFile } from "node:fs/promises";

const POIS_PATH = "data/pois.geojson";

function haversineKm([lng1, lat1], [lng2, lat2]) {
  const rad = Math.PI / 180;
  const a = Math.sin((lat2 - lat1) * rad / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin((lng2 - lng1) * rad / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function nearbyPois(location) {
  const raw = JSON.parse(await readFile(POIS_PATH, "utf8"));
  return raw.features
    .filter((feature) => ["hospedaje", "comida"].includes(feature.properties?.cat) && feature.properties?.name && feature.properties.name !== "Sin nombre")
    .map((feature, index) => ({
      id: index,
      name: feature.properties.name,
      category: feature.properties.cat,
      kind: feature.properties.kind || "lugar",
      coordinates: feature.geometry.coordinates,
      distanceKm: Number(haversineKm(location, feature.geometry.coordinates).toFixed(1)),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 24);
}

function fallback(message, candidates) {
  const wantsHotel = /hotel|dormir|hosped|noche/i.test(message);
  const wantsFood = /restaur|comer|cena|almuerzo|desayuno|comida/i.test(message);
  const stops = candidates.filter((place) => (wantsHotel && place.category === "hospedaje") || (wantsFood && place.category === "comida")).slice(0, 4);
  return { reply: stops.length ? "Encontré opciones cercanas y armé una ruta sugerida." : "No encontré suficientes opciones cercanas con esos criterios.", stopIds: stops.map((place) => place.id) };
}

async function rankWithOpenRouter(message, candidates) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY no está configurada.");
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-5";
  const prompt = `Eres el asistente de TwinMap en El Salvador. Recomienda una ruta turística usando SOLAMENTE estos lugares reales cercanos. Elige máximo 4 paradas y no inventes horarios, precios, reseñas ni lugares. Prioriza hoteles si se piden y restaurantes si se piden.\n\nSolicitud: ${message}\n\nLugares: ${JSON.stringify(candidates.map(({ id, name, category, kind, distanceKm }) => ({ id, name, category, kind, distanceKm })))}\n\nResponde SOLO JSON: {"reply":"texto breve en español","stopIds":[1,2]}`;
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.2, max_tokens: 300, response_format: { type: "json_object" } }),
    signal: AbortSignal.timeout(15000),
  });
  const payload = await response.json();
  if (!response.ok || payload.error) throw new Error(payload.error?.message || `OpenRouter HTTP ${response.status}`);
  const content = String(payload.choices?.[0]?.message?.content || "").replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(content);
}

export async function planPlaces(req, res) {
  const message = String(req.body?.message || "").trim().slice(0, 500);
  const location = req.body?.location;
  if (!message) return res.status(400).json({ success: false, error: "Escribe qué tipo de ruta buscas." });
  if (!Number.isFinite(location?.lat) || !Number.isFinite(location?.lng)) return res.status(400).json({ success: false, error: "Falta una ubicación válida." });
  try {
    const candidates = await nearbyPois([location.lng, location.lat]);
    let answer; let source = "openrouter";
    try { answer = await rankWithOpenRouter(message, candidates); }
    catch (error) { answer = fallback(message, candidates); source = "local-fallback"; }
    const stopIds = Array.isArray(answer.stopIds) ? answer.stopIds.slice(0, 4) : [];
    const stops = stopIds.map((id) => candidates.find((place) => place.id === id)).filter(Boolean);
    return res.json({ success: true, source, data: { reply: String(answer.reply || "Ruta sugerida lista."), stops, candidatesCount: candidates.length } });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "No se pudo crear la ruta." });
  }
}
