import { Router } from "express";
import { parseTranscript, ocrTrackman, hasAiKey } from "../lib/ai.js";

const router = Router();

// POST /api/transcript/parse
router.post("/transcript/parse", async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript || typeof transcript !== "string" || transcript.trim().length < 10) {
      return res.status(400).json({ error: "Transcription trop courte ou manquante" });
    }

    if (!hasAiKey()) {
      return res.status(503).json({
        error: "Clé API Grok non configurée. Ajoutez XAI_API_KEY dans les variables d'environnement Vercel.",
      });
    }

    const result = await parseTranscript(transcript.trim());
    res.json(result);
  } catch (err: any) {
    console.error("Transcript parse error:", err);
    res.status(500).json({
      error: err.message || "Erreur lors de l'analyse de la transcription",
    });
  }
});

// POST /api/trackman/ocr
router.post("/trackman/ocr", async (req, res) => {
  try {
    const { image } = req.body; // data URL base64
    if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
      return res.status(400).json({ error: "Image base64 (data URL) manquante" });
    }

    if (!hasAiKey()) {
      return res.status(503).json({
        error: "Clé API Grok non configurée. Ajoutez XAI_API_KEY dans les variables d'environnement Vercel.",
      });
    }

    const result = await ocrTrackman(image);
    res.json(result);
  } catch (err: any) {
    console.error("Trackman OCR error:", err);
    res.status(500).json({
      error: err.message || "Erreur lors de l'OCR TrackMan",
    });
  }
});

export default router;
