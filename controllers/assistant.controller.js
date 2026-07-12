import { readFile } from "node:fs/promises";
import { fetchForecastDays } from "../lib/open-meteo.js";
import { imagePathForCategory, weatherLabel } from "../lib/place-assets.js";

const POIS_PATH = "data/pois.geojson";
const placeInfoCache = new Map();

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
  const prompt = `Eres el asistente de Mirus en El Salvador. Recomienda una ruta turística usando SOLAMENTE estos lugares reales cercanos. Elige máximo 4 paradas y no inventes horarios, precios, reseñas ni lugares. Prioriza hoteles si se piden y restaurantes si se piden.\n\nSolicitud: ${message}\n\nLugares: ${JSON.stringify(candidates.map(({ id, name, category, kind, distanceKm }) => ({ id, name, category, kind, distanceKm })))}\n\nResponde SOLO JSON: {"reply":"texto breve en español","stopIds":[1,2]}`;
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
  const profile = req.body?.profile;
  if (!message) return res.status(400).json({ success: false, error: "Escribe qué tipo de ruta buscas." });
  if (!Number.isFinite(location?.lat) || !Number.isFinite(location?.lng)) return res.status(400).json({ success: false, error: "Falta una ubicación válida." });
  const enrichedMessage = profile && typeof profile === "object"
    ? `${message}\n\nContexto del viajero (usa esto para personalizar): ${JSON.stringify(profile).slice(0, 1800)}`
    : message;
  try {
    const candidates = await nearbyPois([location.lng, location.lat]);
    let answer; let source = "openrouter";
    try { answer = await rankWithOpenRouter(enrichedMessage, candidates); }
    catch (error) { answer = fallback(enrichedMessage, candidates); source = "local-fallback"; }
    const stopIds = Array.isArray(answer.stopIds) ? answer.stopIds.slice(0, 4) : [];
    const stops = stopIds.map((id) => candidates.find((place) => place.id === id)).filter(Boolean);
    return res.json({ success: true, source, data: { reply: String(answer.reply || "Ruta sugerida lista."), stops, candidatesCount: candidates.length } });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "No se pudo crear la ruta." });
  }
}

function localPlaceFallback(place) {
  const bits = [
    `${place.name} es un punto de interés en ${place.department || "El Salvador"}.`,
    place.category ? `Categoría: ${place.category}.` : "",
    "Confirma horarios y acceso antes de visitar.",
  ].filter(Boolean);
  return bits.join(" ");
}

function buildLugarLabel(place) {
  const parts = [place.department, "El Salvador"].filter(Boolean);
  if (Number.isFinite(place.location?.lat) && Number.isFinite(place.location?.lng)) {
    parts.unshift(`${place.location.lat.toFixed(4)}, ${place.location.lng.toFixed(4)}`);
  }
  return parts.join(" · ");
}

function localWeatherFallback(place, dias) {
  const resumen = dias.length
    ? `Próximos 3 días en ${place.name}: ${dias.map((d) => `${d.condicion} (${d.min_c}–${d.max_c}°C)`).join("; ")}.`
    : "No hay datos de clima disponibles.";
  return { resumen, dias };
}

async function fetchWeatherFromOpenRouter(place, dias) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY no está configurada.");
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-5";
  const prompt = [
    "Eres meteorólogo turístico en El Salvador.",
    `Lugar: ${place.name}`,
    place.department ? `Zona: ${place.department}` : "",
    Number.isFinite(place.location?.lat) ? `Coordenadas: ${place.location.lat}, ${place.location.lng}` : "",
    "",
    "Con estos datos REALES de Open-Meteo, describe el clima de los próximos 3 días consecutivos para un visitante.",
    "Responde SOLO JSON válido:",
    '{"resumen":"2-3 frases útiles para planear la visita","dias":[{"fecha":"YYYY-MM-DD","condicion":"texto corto","min_c":22,"max_c":30,"lluvia_pct":40,"consejo":"tip breve"}]}',
    "",
    `Datos Open-Meteo: ${JSON.stringify(dias)}`,
  ].filter(Boolean).join("\n");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.25,
      max_tokens: 500,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(20000),
  });

  const payload = await response.json();
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message || `OpenRouter HTTP ${response.status}`);
  }
  const content = String(payload.choices?.[0]?.message?.content || "")
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const parsed = JSON.parse(content);
  const days = Array.isArray(parsed.dias) ? parsed.dias.slice(0, 3).map((day, index) => ({
    fecha: day.fecha || dias[index]?.fecha,
    condicion: day.condicion || dias[index]?.condicion || weatherLabel(dias[index]?.codigo),
    min_c: Number.isFinite(Number(day.min_c)) ? Number(day.min_c) : dias[index]?.min_c,
    max_c: Number.isFinite(Number(day.max_c)) ? Number(day.max_c) : dias[index]?.max_c,
    lluvia_pct: Number.isFinite(Number(day.lluvia_pct)) ? Number(day.lluvia_pct) : dias[index]?.lluvia_pct,
    consejo: String(day.consejo || "").trim(),
  })) : dias;
  return {
    resumen: String(parsed.resumen || "").trim(),
    dias: days,
  };
}

async function fetchPlaceInfoFromOpenAI(place, weatherDays) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY no está configurada en el backend.");
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const extra = place.extra && typeof place.extra === "object" ? place.extra : {};
  const climaTxt = weatherDays.length
    ? `Clima próximos días: ${weatherDays.map((d) => `${d.fecha}: ${d.condicion}, ${d.min_c}-${d.max_c}°C, lluvia ${d.lluvia_pct}%`).join("; ")}`
    : "";
  const prompt = [
    `Lugar: ${place.name}`,
    place.category ? `Categoría: ${place.category}` : "",
    place.kind ? `Tipo: ${place.kind}` : "",
    place.department ? `Departamento: ${place.department}` : "",
    Number.isFinite(place.location?.lat) && Number.isFinite(place.location?.lng)
      ? `Coordenadas: ${place.location.lat}, ${place.location.lng}`
      : "",
    climaTxt,
    Object.keys(extra).length ? `Datos locales: ${JSON.stringify(extra)}` : "",
    "",
    "Escribe una guía breve en español (120-180 palabras) con:",
    "1) Qué es y por qué visitarlo",
    "2) Mejor época o momento del día",
    "3) Consejos prácticos (acceso, qué llevar, seguridad)",
    "Menciona brevemente cómo el clima reciente puede afectar la visita si aplica.",
    "No inventes precios, teléfonos ni horarios exactos.",
  ].filter(Boolean).join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "Eres un guía turístico experto en El Salvador. Respuestas claras, amigables y útiles para viajeros.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.45,
      max_tokens: 450,
    }),
    signal: AbortSignal.timeout(25000),
  });

  const payload = await response.json();
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message || `OpenAI HTTP ${response.status}`);
  }
  const text = String(payload.choices?.[0]?.message?.content || "").trim();
  if (!text) throw new Error("OpenAI no devolvió texto.");
  return text;
}

export async function describePlace(req, res) {
  const name = String(req.body?.name || "").trim().slice(0, 200);
  const category = String(req.body?.category || "").trim().slice(0, 80);
  const kind = String(req.body?.kind || "").trim().slice(0, 80);
  const department = String(req.body?.department || "").trim().slice(0, 80);
  const location = req.body?.location;
  const extra = req.body?.extra && typeof req.body.extra === "object" ? req.body.extra : {};

  if (!name) return res.status(400).json({ success: false, error: "Falta el nombre del lugar." });

  const place = {
    name,
    category,
    kind,
    department,
    location: {
      lat: Number(location?.lat),
      lng: Number(location?.lng),
    },
    extra,
  };

  const cacheKey = `${name}|${category}|${place.location.lat}|${place.location.lng}`;
  const cached = placeInfoCache.get(cacheKey);
  if (cached && Date.now() - cached.at < 1000 * 60 * 60 * 6) {
    return res.json({ success: true, source: "cache", data: cached.data });
  }

  const imagen = imagePathForCategory(category, kind);
  const lugar = buildLugarLabel(place);
  const warnings = [];

  let weatherDays = [];
  try {
    weatherDays = await fetchForecastDays(place.location.lat, place.location.lng, 3);
  } catch (error) {
    warnings.push(error.message || "No se pudo cargar Open-Meteo.");
  }

  let clima = localWeatherFallback(place, weatherDays);
  let climaSource = "open-meteo";
  try {
    clima = await fetchWeatherFromOpenRouter(place, weatherDays);
    climaSource = "openrouter";
  } catch (error) {
    warnings.push(error.message || "OpenRouter no disponible para clima.");
  }

  try {
    const descripcion = await fetchPlaceInfoFromOpenAI(place, weatherDays);
    const data = {
      nombre: name,
      categoria: category,
      tipo: kind,
      lugar,
      descripcion,
      clima: {
        fuente: climaSource,
        resumen: clima.resumen,
        dias: clima.dias,
      },
      imagen,
    };
    if (warnings.length) data.warning = warnings.join(" ");
    placeInfoCache.set(cacheKey, { data, at: Date.now() });
    return res.json({ success: true, source: "openai+openrouter", data });
  } catch (error) {
    const data = {
      nombre: name,
      categoria: category,
      tipo: kind,
      lugar,
      descripcion: localPlaceFallback(place),
      clima: {
        fuente: climaSource,
        resumen: clima.resumen,
        dias: clima.dias,
      },
      imagen,
      warning: [error.message, ...warnings].filter(Boolean).join(" "),
    };
    return res.json({ success: true, source: "local-fallback", data });
  }
}
