import axios from "axios";
import { findScenicWaypoint } from "./destinations.js";

const ROUTE_STYLES = {
  flash: { id: "flash", name: "Ruta Flash", emoji: "⚡", color: "#ff6b6b", mode: "driving", tagline: "La más rápida" },
  vibes: { id: "vibes", name: "Ruta Vibes", emoji: "🌅", color: "#ffbf69", mode: "driving", tagline: "Panorámica con parada" },
  zen: { id: "zen", name: "Ruta Zen", emoji: "🌿", color: "#2ec4b6", mode: "walking", tagline: "Tranquila y conectada" },
};

function profileMode(profile, styleId) {
  if (styleId === "zen") {
    if (profile.transport === "walking") return "walking";
    if (profile.transport === "cycling") return "cycling";
    if (profile.pace === "zen") return "walking";
    return "driving";
  }
  if (profile.transport === "cycling" && styleId === "vibes") return "cycling";
  return "driving";
}

async function fetchMapboxRoute(token, mode, coordinates) {
  const path = coordinates.map((c) => `${c.lng},${c.lat}`).join(";");
  const response = await axios.get(`https://api.mapbox.com/directions/v5/mapbox/${mode}/${path}`, {
    timeout: 8000,
    params: { access_token: token, geometries: "geojson", overview: "full", steps: false },
  });
  const data = response.data;
  if (data.code !== "Ok" || !data.routes?.[0]) {
    throw new Error(data.message || `Mapbox Directions: ${data.code}`);
  }
  return data.routes[0];
}

function scoreRoute(styleId, route, profile, extras = {}) {
  let score = 70;
  const min = route.duration / 60;
  const km = route.distance / 1000;
  if (styleId === "flash") score += Math.max(0, 40 - min / 2);
  if (styleId === "vibes") score += extras.waypoint ? 15 : 5;
  if (styleId === "zen") score += profile.pace === "zen" ? 18 : 6;
  if (profile.crowds === "avoid" && styleId === "zen") score += 8;
  if (profile.pace === "flash" && styleId === "flash") score += 12;
  if (km > 120) score -= 10;
  return Math.min(99, Math.round(score));
}

function explainRoute(style, route, destination, profile, extras = {}) {
  const min = Math.round(route.duration / 60);
  const km = (route.distance / 1000).toFixed(1);
  if (style.id === "flash") {
    return `${km} km en ~${min} min. Ideal si prefieres llegar pronto a ${destination.name}.`;
  }
  if (style.id === "vibes" && extras.waypoint) {
    return `Pasa cerca de ${extras.waypoint.name} antes de ${destination.name}. ~${min} min, ${km} km.`;
  }
  if (style.id === "zen") {
    return `Ritmo ${profile.pace === "zen" ? "relajado" : "suave"} hacia ${destination.name}. ~${min} min.`;
  }
  return `${km} km · ~${min} min hacia ${destination.name}.`;
}

export async function buildSmartRoutes(origin, destination, profile = {}) {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) throw new Error("Falta MAPBOX_ACCESS_TOKEN.");

  const dest = { lat: destination.lat, lng: destination.lng };
  const waypoint = await findScenicWaypoint(origin, dest);

  const variants = [
    { style: ROUTE_STYLES.flash, coords: [origin, dest] },
    {
      style: ROUTE_STYLES.vibes,
      coords: waypoint ? [origin, { lat: waypoint.lat, lng: waypoint.lng }, dest] : [origin, dest],
      extras: { waypoint },
    },
    { style: { ...ROUTE_STYLES.zen, mode: profileMode(profile, "zen") }, coords: [origin, dest] },
  ];

  const routes = [];
  for (const variant of variants) {
    try {
      const mode = variant.style.mode || profileMode(profile, variant.style.id);
      const mapboxRoute = await fetchMapboxRoute(token, mode, variant.coords);
      const extras = variant.extras || {};
      routes.push({
        id: variant.style.id,
        name: variant.style.name,
        emoji: variant.style.emoji,
        color: variant.style.color,
        mode,
        tagline: variant.style.tagline,
        distance: mapboxRoute.distance,
        duration: mapboxRoute.duration,
        geometry: mapboxRoute.geometry,
        score: scoreRoute(variant.style.id, mapboxRoute, profile, extras),
        summary: explainRoute(variant.style, mapboxRoute, destination, profile, extras),
        waypoint: extras.waypoint || null,
      });
    } catch (error) {
      console.warn(`Ruta ${variant.style.id} no disponible:`, error.message);
    }
  }

  if (!routes.length) throw new Error("No se pudieron calcular rutas.");
  routes.sort((a, b) => b.score - a.score);
  const recommendedId = routes[0].id;
  return { routes, recommendedId, destination };
}
