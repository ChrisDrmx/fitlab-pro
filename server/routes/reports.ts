import { Router } from "express";
import { deleteReport } from "../db/index.js";
import { asyncRoute } from "../lib/async-route.js";

const router = Router();

router.delete("/:id", asyncRoute(async (req, res) => {
  const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];
  if (!(await deleteReport(id))) return res.status(404).json({ error: "Rapport introuvable" });
  res.status(204).end();
}));

export default router;
