import "dotenv/config";
import express from "express";
import routeRouter from "./routes/route.js";
import crowdsRouter from "./routes/crowds.js";
import birdsRouter from "./routes/birds.js";
import assistantRouter from "./routes/assistant.js";

const app = express();
const port = process.env.PORT || 3001;

// CORS simple para que el frontend (localhost:3000) pueda consumir la API
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: "100kb" }));
app.use("/api/routes", routeRouter);
app.use("/api/crowds", crowdsRouter);
app.use("/api/birds", birdsRouter);
app.use("/api/assistant", assistantRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(port, () => {
  console.log(`TwinMap API escuchando en http://localhost:${port}`);
});
