/**
 * Genera config.js en build de Netlify desde variables de entorno.
 * En Netlify: Site settings → Environment variables → MAPBOX_TOKEN (pk....)
 * Opcional: API_BASE (URL del backend Express)
 */
import { writeFileSync } from "node:fs";

const token = process.env.MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN || "";
const apiBase = process.env.API_BASE || process.env.URL || "";

const config = `// Generado en build (Netlify). No edites a mano en producción.
window.TWINMAP_CONFIG = {
  MAPBOX_TOKEN: ${JSON.stringify(token)},
  CENTER: [-89.20, 13.80],
  ZOOM: 7.4,
  API_BASE: ${JSON.stringify(apiBase || "http://localhost:3001")},
};
`;

writeFileSync("config.js", config, "utf8");
console.log("config.js generado", token ? "(con token Mapbox)" : "(SIN token — configura MAPBOX_TOKEN en Netlify)");
