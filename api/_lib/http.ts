import type { IncomingMessage, ServerResponse } from "node:http";

export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

/** Lit le corps JSON de la requete (Vercel le pre-parse deja la plupart du temps). */
export async function readJsonBody(req: IncomingMessage, maxBytes = 8_500_000): Promise<Record<string, unknown>> {
  const pre = (req as IncomingMessage & { body?: unknown }).body;
  if (pre && typeof pre === "object") {
    if (JSON.stringify(pre).length > maxBytes) throw new HttpError(413, "Requête trop volumineuse.");
    return pre as Record<string, unknown>;
  }
  if (typeof pre === "string" && pre) {
    if (pre.length > maxBytes) throw new HttpError(413, "Requête trop volumineuse.");
    try {
      return JSON.parse(pre) as Record<string, unknown>;
    } catch {
      throw new HttpError(400, "Requête illisible.");
    }
  }
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const c of req) {
    const chunk = Buffer.isBuffer(c) ? c : Buffer.from(c as string);
    total += chunk.length;
    if (total > maxBytes) throw new HttpError(413, "Requête trop volumineuse.");
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new HttpError(400, "Requête illisible.");
  }
}

export function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}
