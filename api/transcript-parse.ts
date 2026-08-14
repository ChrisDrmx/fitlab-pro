import type { IncomingMessage, ServerResponse } from "node:http";
import { parseTranscript } from "./_lib/transcript-parse.js";
import { LlmNotConfiguredError } from "./_lib/llm.js";
import { readJsonBody, sendJson } from "./_lib/http.js";

export const config = { maxDuration: 60 };

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Méthode non autorisée." });
  try {
    const body = await readJsonBody(req);
    const transcript = typeof body.transcript === "string" ? body.transcript : "";
    if (!transcript.trim()) return sendJson(res, 400, { error: "Aucune transcription transmise." });
    const result = await parseTranscript(transcript);
    return sendJson(res, 200, result);
  } catch (e) {
    const status = e instanceof LlmNotConfiguredError ? 503 : 400;
    const message = e instanceof Error ? e.message : "Analyse impossible.";
    return sendJson(res, status, { error: message });
  }
}
