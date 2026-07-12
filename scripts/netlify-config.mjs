/**
 * Genera config.js en build de Netlify desde variables de entorno.
 * En Netlify: Site settings → Environment variables → MAPBOX_TOKEN (pk....)
 * Opcional: API_BASE (URL del backend Express)
 */
import { readFileSync, writeFileSync } from "node:fs";

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

if (token.startsWith("pk.")) {
  const htmlPath = "index.html";
  let html = readFileSync(htmlPath, "utf8");
  const metaNeedle = '<meta name="mapbox-token" content="" id="mapbox-token-meta" />';
  const metaFilled = `<meta name="mapbox-token" content="${token}" id="mapbox-token-meta" />`;
  if (html.includes(metaNeedle)) {
    html = html.replace(metaNeedle, metaFilled);
    writeFileSync(htmlPath, html, "utf8");
    console.log("meta mapbox-token inyectado en index.html");
  }
}
