import { Router } from "express";
import {
  createFitting,
  createReport,
  deleteFitting,
  getFitting,
  listFittings,
  listReports,
  updateFitting,
} from "../db/index.js";
import { asyncRoute } from "../lib/async-route.js";

const router = Router();

router.get("/", asyncRoute(async (_req, res) => res.json(await listFittings())));

router.post("/", asyncRoute(async (req, res) => {
  const data = req.body?.data && typeof req.body.data === "object" ? req.body.data : req.body;
  res.status(201).json(await createFitting(data || {}));
}));

router.get("/:id/reports", asyncRoute(async (req, res) => {
  const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];
  if (!(await getFitting(id))) return res.status(404).json({ error: "Fiche introuvable" });
  res.json(await listReports(id));
}));

router.post("/:id/reports", asyncRoute(async (req, res) => {
  const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];
  if (!(await getFitting(id))) return res.status(404).json({ error: "Fiche introuvable" });
  res.status(201).json(await createReport(id, req.body?.snapshot || req.body || {}));
}));

router.get("/:id", asyncRoute(async (req, res) => {
  const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];
  const fitting = await getFitting(id);
  if (!fitting) return res.status(404).json({ error: "Fiche introuvable" });
  res.json(fitting);
}));

router.patch("/:id", asyncRoute(async (req, res) => {
  const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];
  const patch = req.body?.data && typeof req.body.data === "object" ? req.body.data : req.body;
  const fitting = await updateFitting(id, patch || {});
  if (!fitting) return res.status(404).json({ error: "Fiche introuvable" });
  res.json(fitting);
}));

router.delete("/:id", asyncRoute(async (req, res) => {
  const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];
  if (!(await deleteFitting(id))) return res.status(404).json({ error: "Fiche introuvable" });
  res.status(204).end();
}));

export default router;
