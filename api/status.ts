import type { IncomingMessage, ServerResponse } from "node:http";
import { llmProvider } from "./_lib/llm.js";
import { sendJson } from "./_lib/http.js";

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  const cfg = llmProvider();
  return sendJson(res, 200, {
    ia: cfg ? { configured: true, provider: cfg.provider, model: cfg.model } : { configured: false },
  });
}
