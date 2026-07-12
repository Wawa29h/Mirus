// Copia este archivo como "config.js" y pega tu token real de Mapbox.
// config.js está en .gitignore para no subir tu token al repo.
window.TWINMAP_CONFIG = {
  // Token público de Mapbox (empieza con "pk."). Sácalo de https://account.mapbox.com
  MAPBOX_TOKEN: "PEGA_AQUI_TU_TOKEN_pk...",

  // Punto base: Barra de Santiago, El Salvador (humedal RAMSAR)
  CENTER: [-90.05, 13.74], // [lng, lat]
  ZOOM: 13,

  // Backend Express (crowds, aves, asistente, pronóstico migratorio)
  API_BASE: "http://localhost:3001",
};
