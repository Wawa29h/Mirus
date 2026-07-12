import axios from "axios";

const isCoordinate = (point) =>
  point &&
  Number.isFinite(point.lat) &&
  Number.isFinite(point.lng) &&
  point.lat >= -90 && point.lat <= 90 &&
  point.lng >= -180 && point.lng <= 180;

const buildFallbackData = (directions) => {
  const route = directions.routes?.[0];
  if (!route) throw new Error("Mapbox no devolvió una ruta de conducción.");

  return {
    routes: [{
      id: "standard-contingency",
      name: "Ruta estándar (Modo de contingencia)",
      mode: "driving",
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
      legs: route.legs || [],
    }],
    waypoints: directions.waypoints || [],
  };
};

const fetchMapboxFallback = async ({ origin, destination, departureTime }) => {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) throw new Error("Falta MAPBOX_ACCESS_TOKEN para activar el modo de contingencia.");

  const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}`;
  const response = await axios.get(url, {
    timeout: 4000,
    params: {
      access_token: token,
      geometries: "geojson",
      overview: "full",
      steps: true,
      depart_at: departureTime?.replace(/\.\d{3}Z$/, "Z"),
    },
  });

  return buildFallbackData(response.data);
};

export const calculateSmartRoute = async (req, res) => {
  const { origin, destination, departureTime } = req.body ?? {};
  const selectedDepartureTime = departureTime || new Date().toISOString();

  if (!isCoordinate(origin) || !isCoordinate(destination)) {
    return res.status(400).json({
      success: false,
      error: "origin y destination son obligatorios y deben tener lat y lng válidos.",
    });
  }
  if (Number.isNaN(Date.parse(selectedDepartureTime))) {
    return res.status(400).json({ success: false, error: "departureTime debe ser una fecha ISO válida." });
  }

  const payload = { origin, destination, departureTime: selectedDepartureTime };

  try {
    if (!process.env.N8N_ROUTE_WEBHOOK_URL) {
      throw new Error("Falta N8N_ROUTE_WEBHOOK_URL.");
    }

    const n8nResponse = await axios.post(process.env.N8N_ROUTE_WEBHOOK_URL, payload, {
      timeout: 4000,
      headers: { "Content-Type": "application/json" },
    });

    return res.status(200).json({
      success: true,
      source: "n8n-digital-twin",
      data: n8nResponse.data,
    });
  } catch (n8nError) {
    console.warn("n8n no respondió; activando fallback de Mapbox:", n8nError.message);

    try {
      const fallbackData = await fetchMapboxFallback(payload);
      return res.status(200).json({
        success: true,
        source: "mapbox-fallback",
        data: fallbackData,
      });
    } catch (fallbackError) {
      console.error("El fallback de Mapbox también falló:", fallbackError.message);
      return res.status(502).json({
        success: false,
        source: "mapbox-fallback",
        error: "No fue posible calcular una ruta en este momento.",
      });
    }
  }
};
