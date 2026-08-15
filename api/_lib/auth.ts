import type { IncomingMessage } from "node:http";
import { createClient } from "@supabase/supabase-js";

export class ApiAuthError extends Error {
  constructor(public readonly status: 401 | 503, message: string) {
    super(message);
    this.name = "ApiAuthError";
  }
}
let client: ReturnType<typeof createClient> | null = null;

function configuredClient() {
  const url = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return client;
}

function authRequired() {
  const explicit = (process.env.AI_REQUIRE_AUTH ?? "").trim().toLowerCase();
  if (explicit === "true" || explicit === "1" || explicit === "yes") return true;
  if (explicit === "false" || explicit === "0" || explicit === "no") return false;
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

function bearer(req: IncomingMessage) {
  const value = req.headers.authorization ?? "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

function requestKey(req: IncomingMessage, userId: string | null) {
  if (userId) return `user:${userId}`;
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim();
  return `ip:${ip || req.socket.remoteAddress || "unknown"}`;
}

/** Vérifie le JWT Supabase sans exposer de service_role côté serveur ou client. */
export async function authenticateAiRequest(req: IncomingMessage) {
  const token = bearer(req);
  const required = authRequired();
  if (!token) {
    if (required) throw new ApiAuthError(401, "Connecte-toi pour utiliser l'analyse IA.");
    return { userId: null, key: requestKey(req, null) };
  }
  const sb = configuredClient();
  if (!sb) throw new ApiAuthError(503, "Authentification Supabase indisponible.");
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) throw new ApiAuthError(401, "Session expirée : reconnecte-toi puis réessaie.");
  return { userId: data.user.id, key: requestKey(req, data.user.id) };
}
