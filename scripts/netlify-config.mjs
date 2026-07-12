/**
 * Genera config.js en build (Netlify / Vercel) desde variables de entorno.
 * MAPBOX_TOKEN o MAPBOX_ACCESS_TOKEN (pk....)
 * Opcional: API_BASE (URL del backend Express desplegado aparte)
 */
import { readFileSync, writeFileSync } from "node:fs";

const token = process.env.MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN || "";
const apiBase =
  process.env.API_BASE ||
  process.env.URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

const config = `// Generado en build. No edites a mano en producción.
window.TWINMAP_CONFIG = {
  MAPBOX_TOKEN: ${JSON.stringify(token)},
  CENTER: [-89.20, 13.80],
  ZOOM: 7.4,
  API_BASE: ${JSON.stringify(apiBase || "http://localhost:3001")},
};
`;

writeFileSync("config.js", config, "utf8");
const host = process.env.VERCEL ? "Vercel" : process.env.NETLIFY ? "Netlify" : "build";
console.log(`config.js generado (${host})`, token ? "(con token Mapbox)" : "(SIN token — agrega MAPBOX_TOKEN en el panel del deploy)");

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
