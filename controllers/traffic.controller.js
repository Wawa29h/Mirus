const getTomTomKey = () =>
  process.env.TOMTOM_API_KEY || process.env.TOMTOM_KEY || "";

export const getTrafficStatus = (_req, res) => {
  const key = getTomTomKey();
  res.json({
    configured: Boolean(key),
    providers: {
      tomtom: Boolean(key),
      mapbox: Boolean(process.env.MAPBOX_ACCESS_TOKEN),
    },
  });
};

export const getFlowAtPoint = async (req, res) => {
  const key = getTomTomKey();
  if (!key) {
    return res.status(503).json({ error: "TomTom no configurado (TOMTOM_API_KEY en .env)" });
  }

  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: "Parámetros lat y lng requeridos" });
  }

  const url =
    `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json` +
    `?point=${lat},${lng}&key=${key}`;

  try {
    const upstream = await fetch(url);
    const body = await upstream.text();
    res.status(upstream.status).type("application/json").send(body);
  } catch (error) {
    res.status(502).json({ error: "No se pudo consultar TomTom Traffic Flow", detail: error.message });
  }
};

export const getTrafficTile = async (req, res) => {
  const key = getTomTomKey();
  if (!key) return res.sendStatus(503);

  const { z, x, y } = req.params;
  const style = req.query.style === "relative" ? "relative" : "absolute";
  const url =
    `https://api.tomtom.com/traffic/map/4/tile/flow/${style}/${z}/${x}/${y}.png?key=${key}`;

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) return res.sendStatus(upstream.status);
    res.set("Content-Type", upstream.headers.get("content-type") || "image/png");
    res.set("Cache-Control", "public, max-age=60");
    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.send(buffer);
  } catch {
    res.sendStatus(502);
  }
};
