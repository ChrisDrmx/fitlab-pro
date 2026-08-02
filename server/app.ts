import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fittingsRouter from "./routes/fittings.js";
import reportsRouter from "./routes/reports.js";
import aiRouter from "./routes/ai.js";
import "./db/index.js"; // init DB

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (_req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use("/api/fittings", fittingsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api", aiRouter);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "FitLab Pro",
    version: "1.0.0",
    aiConfigured: Boolean(process.env.XAI_API_KEY),
    storage: process.env.VERCEL ? "temporary-instance-storage" : "local-file",
  });
});

// Serve static frontend when not on Vercel (local prod / other hosts)
if (!process.env.VERCEL) {
  const clientDist = path.join(__dirname, "..", "client", "dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) next();
    });
  });
}

export default app;
