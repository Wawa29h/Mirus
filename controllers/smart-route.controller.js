import { isCoordinate } from "../lib/geo.js";
import { rankDestinations } from "../lib/destinations.js";
import { buildSmartRoutes } from "../lib/smart-routes.js";

const VALID_CATEGORIES = ["playa", "naturaleza", "comida", "cultura", "aves"];

export const getDestinations = async (req, res) => {
  const category = String(req.query.category || "playa").toLowerCase();
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  let profile = {};

  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ success: false, error: `Categoría inválida. Usa: ${VALID_CATEGORIES.join(", ")}` });
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ success: false, error: "lat y lng son obligatorios." });
  }

  try {
    profile = req.body?.profile || JSON.parse(req.query.profile || "{}");
  } catch {
    profile = {};
  }

  try {
    const destinations = await rankDestinations(category, { lat, lng }, profile);
    return res.json({
      success: true,
      data: { category, destinations, profileUsed: profile },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "No se pudieron cargar destinos." });
  }
};

export const calculatePersonalizedRoutes = async (req, res) => {
  const { origin, destination, profile } = req.body ?? {};

  if (!isCoordinate(origin)) {
    return res.status(400).json({ success: false, error: "origin con lat/lng válidos es obligatorio." });
  }
  if (!destination?.lat || !destination?.lng || !destination?.name) {
    return res.status(400).json({ success: false, error: "destination debe incluir name, lat y lng." });
  }

  try {
    const data = await buildSmartRoutes(origin, destination, profile || {});
    return res.json({
      success: true,
      source: "twinmap-smart-routes",
      data,
    });
  } catch (error) {
    return res.status(502).json({ success: false, error: error.message || "No se pudieron calcular rutas." });
  }
};
