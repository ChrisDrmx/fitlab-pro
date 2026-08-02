import { Router } from "express";
import {
  createFitting,
  createReport,
  deleteFitting,
  deleteReport,
  getFitting,
  listFittings,
  listReports,
  updateFitting,
} from "../db/index.js";

const router = Router();

router.get("/", (_req, res) => res.json(listFittings()));

router.post("/", (req, res) => {
  const data = req.body?.data && typeof req.body.data === "object" ? req.body.data : req.body;
  res.status(201).json(createFitting(data || {}));
});

router.get("/:id/reports", (req, res) => {
  if (!getFitting(req.params.id)) return res.status(404).json({ error: "Fiche introuvable" });
  res.json(listReports(req.params.id));
});

router.post("/:id/reports", (req, res) => {
  if (!getFitting(req.params.id)) return res.status(404).json({ error: "Fiche introuvable" });
  res.status(201).json(createReport(req.params.id, req.body?.snapshot || req.body || {}));
});

router.get("/:id", (req, res) => {
  const fitting = getFitting(req.params.id);
  if (!fitting) return res.status(404).json({ error: "Fiche introuvable" });
  res.json(fitting);
});

router.patch("/:id", (req, res) => {
  const patch = req.body?.data && typeof req.body.data === "object" ? req.body.data : req.body;
  const fitting = updateFitting(req.params.id, patch || {});
  if (!fitting) return res.status(404).json({ error: "Fiche introuvable" });
  res.json(fitting);
});

router.delete("/:id", (req, res) => {
  if (!deleteFitting(req.params.id)) return res.status(404).json({ error: "Fiche introuvable" });
  res.status(204).end();
});

export { deleteReport };
export default router;
