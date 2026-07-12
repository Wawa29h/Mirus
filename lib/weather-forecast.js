const DEPARTMENTS = [
  ["Ahuachapán", 13.92, -89.85], ["Cabañas", 13.87, -88.63],
  ["Chalatenango", 14.07, -88.94], ["Cuscatlán", 13.72, -88.94],
  ["La Libertad", 13.68, -89.29], ["La Paz", 13.48, -88.95],
  ["La Unión", 13.34, -87.84], ["Morazán", 13.70, -88.10],
  ["San Miguel", 13.48, -88.18], ["San Salvador", 13.69, -89.22],
  ["San Vicente", 13.64, -88.78], ["Santa Ana", 13.99, -89.56],
  ["Sonsonate", 13.72, -89.72], ["Usulután", 13.35, -88.44],
];

function summary(day) {
  return {
    fecha: day.time,
    temp_min_c: Math.round(day.temperature_2m_min),
    temp_max_c: Math.round(day.temperature_2m_max),
    lluvia_mm: Number(day.precipitation_sum || 0),
    prob_lluvia_pct: Number(day.precipitation_probability_max || 0),
    viento_kmh: Math.round(day.wind_speed_10m_max || 0),
    codigo_tiempo: day.weather_code,
  };
}

/** Pronóstico abierto para 14 cabeceras. No requiere clave y se usa solo como señal ambiental. */
export async function getWeatherSignals() {
  const results = await Promise.all(DEPARTMENTS.map(async ([department, lat, lng]) => {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude: String(lat), longitude: String(lng), timezone: "America/El_Salvador",
      forecast_days: "5",
      daily: "temperature_2m_min,temperature_2m_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code",
    }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(7000) });
    const weather = await response.json();
    if (!response.ok || !weather.daily) throw new Error(weather.reason || `Open-Meteo HTTP ${response.status}`);
    const keys = Object.keys(weather.daily);
    return {
      department,
      lat, lng,
      dias: weather.daily.time.map((_, index) => summary(Object.fromEntries(keys.map((key) => [key, weather.daily[key][index]])))),
    };
  }));
  return { fuente: "Open-Meteo", generado: new Date().toISOString(), departamentos: results };
}
