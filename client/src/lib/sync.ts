import { supabase, supabaseConfigured, TABLE_FITTINGS, TABLE_REPORTS } from "./supabase";
import {
  applyRemote, dirtyRows, getMeta, markClean, pendingCount, setMeta, setSyncHook,
  type Fitting, type Report,
} from "./store";

/**
 * Synchronisation bidirectionnelle avec Supabase.
 *
 * Principe : la base locale est la source de verite pour l'utilisation
 * quotidienne. On pousse les lignes modifiees, puis on recupere les lignes plus
 * recentes du serveur. Le plus recent horodatage gagne. Les suppressions sont
 * des pierres tombales (deleted_at) afin de se propager d'un appareil a l'autre.
 */

export type SyncState = {
  status: "hors-ligne" | "local" | "synchro" | "a-jour" | "erreur";
  pending: number;
  lastSync: string | null;
  message: string;
};

let state: SyncState = { status: "local", pending: 0, lastSync: null, message: "" };
const listeners = new Set<(s: SyncState) => void>();

export function syncState() {
  return state;
}

export function onSyncState(fn: (s: SyncState) => void) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

function set(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  for (const l of listeners) l(state);
}

const LAST_PULL = "lastPullAt";

/* ------------------------------------------------------ mapping local <-> pg */

const fittingToRemote = (f: Fitting, owner: string) => ({
  id: f.id,
  owner,
  player_name: f.playerName,
  date: f.date,
  status: f.status,
  brand: f.brand,
  data: safeParse(f.data),
  updated_at: f.updatedAt,
  deleted_at: f.deletedAt,
});

const fittingFromRemote = (r: Record<string, unknown>): Fitting => ({
  id: String(r.id),
  playerName: String(r.player_name ?? "Sans nom"),
  date: String(r.date ?? "").slice(0, 10),
  status: String(r.status ?? "en_cours"),
  brand: String(r.brand ?? ""),
  data: JSON.stringify(r.data ?? {}),
  updatedAt: String(r.updated_at ?? new Date().toISOString()),
  deletedAt: r.deleted_at ? String(r.deleted_at) : null,
  dirty: 0,
});

const reportToRemote = (r: Report, owner: string) => ({
  id: r.id,
  fitting_id: r.fittingId,
  owner,
  player_name: r.playerName,
  created_at: r.createdAt,
  label: r.label,
  brand: r.brand,
  insight_count: r.insightCount,
  snapshot: safeParse(r.snapshot),
  updated_at: r.updatedAt,
  deleted_at: r.deletedAt,
});

const reportFromRemote = (r: Record<string, unknown>): Report => ({
  id: String(r.id),
  fittingId: String(r.fitting_id),
  playerName: String(r.player_name ?? "Sans nom"),
  createdAt: String(r.created_at ?? new Date().toISOString()),
  label: String(r.label ?? ""),
  brand: String(r.brand ?? ""),
  insightCount: Number(r.insight_count ?? 0),
  snapshot: JSON.stringify(r.snapshot ?? {}),
  updatedAt: String(r.updated_at ?? new Date().toISOString()),
  deletedAt: r.deleted_at ? String(r.deleted_at) : null,
  dirty: 0,
});

function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

/* -------------------------------------------------------------------- moteur */

let running = false;
let queued = false;
let timer: ReturnType<typeof setTimeout> | null = null;

export async function syncNow(): Promise<SyncState> {
  const pending = await pendingCount();
  if (!supabaseConfigured) {
    set({ status: "local", pending, message: "Sauvegarde locale uniquement" });
    return state;
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    set({ status: "hors-ligne", pending, message: "Hors ligne — les fiches sont gardées sur l'appareil" });
    return state;
  }
  if (running) {
    queued = true;
    return state;
  }
  running = true;
  set({ status: "synchro", pending, message: "Synchronisation…" });

  try {
    const sb = supabase();
    if (!sb) throw new Error("client indisponible");
    const { data: sess } = await sb.auth.getSession();
    const owner = sess.session?.user?.id;
    if (!owner) {
      set({
        status: "local",
        pending: await pendingCount(),
        message: "Non connecté — sauvegarde locale uniquement",
      });
      return state;
    }

    // 1) Envoi des modifications locales.
    const { fittings, reports } = await dirtyRows();
    if (fittings.length) {
      const { error } = await sb
        .from(TABLE_FITTINGS)
        .upsert(fittings.map((f) => fittingToRemote(f, owner)), { onConflict: "id" });
      if (error) throw new Error(error.message);
      await markClean("fittings", fittings.map((f) => f.id));
    }
    if (reports.length) {
      const { error } = await sb
        .from(TABLE_REPORTS)
        .upsert(reports.map((r) => reportToRemote(r, owner)), { onConflict: "id" });
      if (error) throw new Error(error.message);
      await markClean("reports", reports.map((r) => r.id));
    }

    // 2) Recuperation des lignes plus recentes que le dernier passage.
    const since = (await getMeta<string>(LAST_PULL)) ?? "1970-01-01T00:00:00.000Z";
    const [rf, rr] = await Promise.all([
      sb.from(TABLE_FITTINGS).select("*").gt("updated_at", since).order("updated_at"),
      sb.from(TABLE_REPORTS).select("*").gt("updated_at", since).order("updated_at"),
    ]);
    if (rf.error) throw new Error(rf.error.message);
    if (rr.error) throw new Error(rr.error.message);
    await applyRemote("fittings", (rf.data ?? []).map(fittingFromRemote));
    await applyRemote("reports", (rr.data ?? []).map(reportFromRemote));

    const stamps = [
      ...(rf.data ?? []).map((r) => String(r.updated_at)),
      ...(rr.data ?? []).map((r) => String(r.updated_at)),
    ];
    if (stamps.length) await setMeta(LAST_PULL, stamps.sort().at(-1));

    const done = new Date().toISOString();
    await setMeta("lastSyncAt", done);
    set({ status: "a-jour", pending: await pendingCount(), lastSync: done, message: "Synchronise" });
  } catch (e) {
    set({
      status: "erreur",
      pending: await pendingCount(),
      message: e instanceof Error ? e.message : "Synchronisation impossible",
    });
  } finally {
    running = false;
    if (queued) {
      queued = false;
      void syncNow();
    }
  }
  return state;
}

/** Synchronisation differee : evite un appel reseau a chaque frappe clavier. */
export function scheduleSync(delay = 1500) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void syncNow(), delay);
  void pendingCount().then((pending) => set({ pending }));
}

let started = false;
export function startSync() {
  if (started) return;
  started = true;
  setSyncHook(() => scheduleSync());
  void getMeta<string>("lastSyncAt").then((v) => set({ lastSync: v ?? null }));
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => void syncNow());
    window.addEventListener("offline", () =>
      set({ status: "hors-ligne", message: "Hors ligne — les fiches sont gardées sur l'appareil" }),
    );
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") scheduleSync(300);
    });
    setInterval(() => void syncNow(), 5 * 60 * 1000);
  }
  void syncNow();
}
