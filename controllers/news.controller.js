const NEWSDATA_ENDPOINT = "https://newsdata.io/api/1/latest";
const NEWSDATA_FALLBACK_KEY = "pub_d8b03bdf6f384468b9474b71221c5f64";

function getNewsDataApiKey() {
  return (process.env.NEWSDATA_API_KEY || NEWSDATA_FALLBACK_KEY).trim();
}

function extractNewsDataError(data) {
  if (!data) return "NewsData.io no respondió.";
  if (typeof data.message === "string" && data.message) return data.message;
  if (typeof data.results?.message === "string" && data.results.message) return data.results.message;
  return "NewsData.io no devolvió resultados.";
}

export async function getNews(req, res) {
  const query = String(req.query.q || "").trim();
  if (!query) {
    return res.status(400).json({
      status: "error",
      message: "Falta el parámetro q.",
      source: "newsdata-proxy",
    });
  }

  const params = new URLSearchParams({
    apikey: getNewsDataApiKey(),
    q: query,
    language: String(req.query.language || "es"),
    size: String(req.query.size || "10"),
  });

  if (req.query.country !== "false") {
    params.set("country", String(req.query.country || "sv"));
  }

  try {
    const response = await fetch(`${NEWSDATA_ENDPOINT}?${params.toString()}`);
    const data = await response.json().catch(() => null);

    if (!response.ok || data?.status !== "success") {
      return res.status(response.ok ? 502 : response.status).json({
        status: "error",
        message: extractNewsDataError(data),
        source: "newsdata-proxy",
      });
    }

    return res.json({
      status: "success",
      results: data.results || [],
      totalResults: data.totalResults ?? (data.results || []).length,
      source: "newsdata-proxy",
    });
  } catch (error) {
    return res.status(502).json({
      status: "error",
      message: error?.message || "No se pudo consultar NewsData.io.",
      source: "newsdata-proxy",
    });
  }
}
