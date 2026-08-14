import type { IncomingMessage, ServerResponse } from "node:http";

/** Lit le corps JSON de la requete (Vercel le pre-parse deja la plupart du temps). */
export async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const pre = (req as IncomingMessage & { body?: unknown }).body;
  if (pre && typeof pre === "object") return pre as Record<string, unknown>;
  if (typeof pre === "string" && pre) {
    try {
      return JSON.parse(pre) as Record<string, unknown>;
    } catch {
      throw new Error("Requête illisible.");
    }
  }
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c as string));
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("Requête illisible.");
  }
}

export function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}
