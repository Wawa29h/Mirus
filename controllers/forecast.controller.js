import { readFile, writeFile, mkdir } from "node:fs/promises";
import { getMigrationForecast } from "../lib/migration.js";

const CACHE_PATH = "data/forecast.json";
const CACHE_MINUTES = Number(process.env.FORECAST_CACHE_MINUTES || 360); // 6h (el LLM cuesta)

async function readCache() { try { return JSON.parse(await readFile(CACHE_PATH, "utf8")); } catch { return null; } }
function ageMinutes(c) { const t = c?.generado; return t ? (Date.now() - new Date(t).getTime()) / 60000 : Infinity; }

// GET /api/birds/forecast        → pronóstico de aves migratorias (cache 6h)
// GET /api/birds/forecast?refresh=1 → fuerza recomputar (consume 1 llamada al LLM)
export const getForecast = async (req, res) => {
  const force = req.query.refresh === "1" || req.query.refresh === "true";
  const cache = await readCache();
  if (!force && cache && ageMinutes(cache) < CACHE_MINUTES) {
    return res.json({ success: true, source: "cache", age_min: Math.round(ageMinutes(cache)), data: cache });
  }
  try {
    const model = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-5";
    const data = await getMigrationForecast(process.env.EBIRD_API_KEY, process.env.OPENROUTER_API_KEY, model);
    await mkdir("data", { recursive: true });
    await writeFile(CACHE_PATH, JSON.stringify(data));
    return res.json({ success: true, source: "llm", data });
  } catch (e) {
    if (cache) return res.json({ success: true, source: "cache-fallback", warning: e.message, data: cache });
    return res.status(502).json({ success: false, error: e.message });
  }
};
