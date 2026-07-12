/** Config pública para el frontend (token pk. de Mapbox es de uso en navegador). */
export function getPublicConfig(_req, res) {
  const raw =
    process.env.MAPBOX_ACCESS_TOKEN ||
    process.env.MAPBOX_TOKEN ||
    "";
  const mapboxToken = raw.startsWith("pk.") ? raw : "";

  res.json({
    mapboxToken,
    apiBase: `http://localhost:${process.env.PORT || 3001}`,
  });
}
