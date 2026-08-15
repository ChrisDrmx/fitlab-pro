import type { IncomingMessage, ServerResponse } from "node:http";
import { parseTranscript } from "./_lib/transcript-parse.js";
import { clientEffort, LlmNotConfiguredError } from "./_lib/llm.js";
import { authenticateAiRequest, ApiAuthError } from "./_lib/auth.js";
import { consumeAiLimit } from "./_lib/rate-limit.js";
import { HttpError, readJsonBody, sendJson } from "./_lib/http.js";

export const config = { maxDuration: 60 };

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Méthode non autorisée." });
  try {
    const auth = await authenticateAiRequest(req);
    const rate = consumeAiLimit(auth.key, "transcript-parse");
    if (!rate.allowed) {
      res.setHeader("Retry-After", String(rate.retryAfter));
      return sendJson(res, 429, { error: "Trop d'analyses IA rapprochées. Réessaie dans quelques minutes." });
    }
    const body = await readJsonBody(req);
    const transcript = typeof body.transcript === "string" ? body.transcript : "";
    if (!transcript.trim()) return sendJson(res, 400, { error: "Aucune transcription transmise." });
    const tune = {
      effort: clientEffort(body.effort),
    };
    const result = await parseTranscript(transcript, tune);
    return sendJson(res, 200, result);
  } catch (e) {
    const status = e instanceof LlmNotConfiguredError || e instanceof ApiAuthError && e.status === 503
      ? 503
      : e instanceof ApiAuthError ? e.status
      : e instanceof HttpError ? e.status
      : 400;
    const message = e instanceof Error ? e.message : "Analyse impossible.";
    return sendJson(res, status, { error: message });
  }
}
