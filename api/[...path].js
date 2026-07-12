import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import routeRouter from "../routes/route.js";
import crowdsRouter from "../routes/crowds.js";
import birdsRouter from "../routes/birds.js";
import assistantRouter from "../routes/assistant.js";
import trafficRouter from "../routes/traffic.js";
import configRouter from "../routes/config.js";
import newsRouter from "../routes/news.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: "100kb" }));
app.use("/data", express.static(path.join(__dirname, "..", "data")));
app.use("/api/routes", routeRouter);
app.use("/api/crowds", crowdsRouter);
app.use("/api/birds", birdsRouter);
app.use("/api/assistant", assistantRouter);
app.use("/api/traffic", trafficRouter);
app.use("/api/config", configRouter);
app.use("/api/news", newsRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true, runtime: "vercel" });
});

export default app;
