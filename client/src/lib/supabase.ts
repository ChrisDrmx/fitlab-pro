import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase optionnel.
 *
 * L'application est concue pour fonctionner seule : toutes les fiches vivent
 * d'abord dans la base locale de l'appareil. Supabase sert uniquement de
 * sauvegarde et de synchronisation entre appareils. Si les variables ne sont
 * pas renseignees, l'application reste pleinement utilisable en local.
 */

const URL = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

export const supabaseConfigured = Boolean(URL && KEY);

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!client) {
    client = createClient(URL, KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: "fitlab-auth",
      },
    });
  }
  return client;
}

export const TABLE_FITTINGS = "fitlab_fittings";
export const TABLE_REPORTS = "fitlab_reports";
export const TABLE_COACHINGS = "fitlab_coachings";
