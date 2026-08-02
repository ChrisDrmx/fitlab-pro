import { Router } from "express";
import { deleteReport } from "../db/index.js";

const router = Router();

router.delete("/:id", (req, res) => {
  if (!deleteReport(req.params.id)) return res.status(404).json({ error: "Rapport introuvable" });
  res.status(204).end();
});

export default router;
