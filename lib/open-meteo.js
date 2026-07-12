import { weatherLabel } from "./place-assets.js";

export async function fetchForecastDays(lat, lng, days = 3) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Coordenadas inválidas para el clima.");
  }
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    timezone: "America/El_Salvador",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
    forecast_days: String(days),
  }).toString();

  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  const payload = await response.json();
  if (!response.ok || !payload.daily?.time) {
    throw new Error(payload.reason || `Open-Meteo HTTP ${response.status}`);
  }

  return payload.daily.time.slice(0, days).map((fecha, index) => ({
    fecha,
    min_c: Math.round(payload.daily.temperature_2m_min[index]),
    max_c: Math.round(payload.daily.temperature_2m_max[index]),
    lluvia_pct: Number(payload.daily.precipitation_probability_max[index] || 0),
    viento_kmh: Math.round(payload.daily.wind_speed_10m_max[index] || 0),
    codigo: payload.daily.weather_code[index],
    condicion: weatherLabel(payload.daily.weather_code[index]),
  }));
}
