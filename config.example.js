// Copia este archivo como "config.js" y pega tu token real de Mapbox.
// config.js está en .gitignore para no subir tu token al repo.
// En Netlify: variable MAPBOX_TOKEN → scripts/netlify-config.mjs genera config.js en el build.
window.TWINMAP_CONFIG = {
  MAPBOX_TOKEN: "PEGA_AQUI_TU_TOKEN_pk...",
  CENTER: [-89.20, 13.80],
  ZOOM: 7.4,
  API_BASE: "http://localhost:3001",
};
