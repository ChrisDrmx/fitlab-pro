import { QueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

/**
 * Les donnees de fitting ne passent plus par un serveur : elles vivent dans la
 * base locale de l'appareil (lib/store.ts). Seules les deux analyses a la
 * demande (OCR Trackman et transcription) appellent une fonction serverless.
 */

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const sb = supabase();
  const body = data ? JSON.stringify(data) : undefined;
  const baseHeaders: Record<string, string> = data ? { "Content-Type": "application/json" } : {};

  const withToken = async (token?: string) => {
    const headers = { ...baseHeaders };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, { method, headers, body });
  };

  let token: string | undefined;
  if (sb) {
    const { data: sessionData } = await sb.auth.getSession();
    token = sessionData.session?.access_token;
  }

  let res = await withToken(token);
  // Les onglets restés ouverts peuvent conserver un access token expiré alors
  // que le refresh token est encore valide. On renouvelle une seule fois avant
  // d'afficher une erreur d'authentification à l'utilisateur.
  if (res.status === 401 && sb) {
    const { data: refreshed, error } = await sb.auth.refreshSession();
    if (!error && refreshed.session?.access_token) {
      res = await withToken(refreshed.session.access_token);
    }
  }
  if (!res.ok) {
    let message = `${res.status}`;
    try {
      const body = (await res.clone().json()) as { error?: string };
      if (body?.error) message = body.error;
      else message = `${res.status}: ${await res.clone().text()}`;
    } catch {
      message = `${res.status}: ${res.statusText}`;
    }
    throw new Error(message);
  }
  return res;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: { retry: false },
  },
});
