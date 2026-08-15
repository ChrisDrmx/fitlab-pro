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
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  const sb = supabase();
  if (sb) {
    const { data: sessionData } = await sb.auth.getSession();
    if (sessionData.session?.access_token) {
      headers.Authorization = `Bearer ${sessionData.session.access_token}`;
    }
  }
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
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
