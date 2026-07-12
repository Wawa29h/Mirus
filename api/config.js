export default function handler(_req, res) {
  const raw = process.env.MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN || "";
  const mapboxToken = raw.startsWith("pk.") ? raw : "";

  res.status(200).json({
    mapboxToken,
    source: mapboxToken ? "vercel-environment" : "missing-mapbox-token",
  });
}
