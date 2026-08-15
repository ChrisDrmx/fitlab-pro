import type { IncomingMessage, ServerResponse } from "node:http";
import { parseCoachingTranscript } from "./_lib/coaching-parse.js";
import { clientEffort, LlmNotConfiguredError } from "./_lib/llm.js";
import { authenticateAiRequest, ApiAuthError } from "./_lib/auth.js";
import { consumeAiLimit } from "./_lib/rate-limit.js";
import { HttpError, readJsonBody, sendJson } from "./_lib/http.js";

export const config = { maxDuration: 60 };

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Méthode non autorisée." });
  try {
    const auth = await authenticateAiRequest(req);
    const rate = consumeAiLimit(auth.key, "coaching-parse");
    if (!rate.allowed) {
      res.setHeader("Retry-After", String(rate.retryAfter));
      return sendJson(res, 429, { error: "Trop d'analyses IA rapprochées. Réessaie dans quelques minutes." });
    }
    const body = await readJsonBody(req);
    const transcript = typeof body.transcript === "string" ? body.transcript : "";
    if (!transcript.trim()) return sendJson(res, 400, { error: "Aucune transcription transmise." });
    const student = body.student && typeof body.student === "object" ? body.student as Record<string, unknown> : {};
    const result = await parseCoachingTranscript(
      transcript,
      {
        studentName: typeof student.firstName === "string" || typeof student.lastName === "string"
          ? `${typeof student.firstName === "string" ? student.firstName : ""} ${typeof student.lastName === "string" ? student.lastName : ""}`.trim()
          : "",
        objective: typeof body.objective === "string" ? body.objective : "",
        duration: typeof body.duration === "string" ? body.duration : "",
      },
      { effort: clientEffort(body.effort) },
    );
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
