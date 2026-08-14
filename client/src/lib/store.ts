import { openDB, type DBSchema, type IDBPDatabase } from "idb";

/**
 * Couche de donnees locale (local-first).
 *
 * Toutes les lectures et ecritures passent par la base IndexedDB de l'appareil :
 * l'application fonctionne donc integralement hors ligne, sans serveur.
 * Chaque enregistrement modifie est marque "dirty" et sera pousse vers Supabase
 * par lib/sync.ts des qu'une connexion et une session sont disponibles.
 */

export type Fitting = {
  id: string;
  playerName: string;
  date: string;
  status: string;
  brand: string;
  data: string;
  updatedAt: string;
  deletedAt: string | null;
  dirty: number;
};

export type Report = {
  id: string;
  fittingId: string;
  playerName: string;
  createdAt: string;
  label: string;
  brand: string;
  insightCount: number;
  snapshot: string;
  updatedAt: string;
  deletedAt: string | null;
  dirty: number;
};

interface FitlabDB extends DBSchema {
  fittings: { key: string; value: Fitting; indexes: { dirty: number } };
  reports: { key: string; value: Report; indexes: { dirty: number; fittingId: string } };
  meta: { key: string; value: unknown };
}

let dbp: Promise<IDBPDatabase<FitlabDB>> | null = null;

function db() {
  if (!dbp) {
    dbp = openDB<FitlabDB>("fitlab-pro", 1, {
      upgrade(d) {
        const f = d.createObjectStore("fittings", { keyPath: "id" });
        f.createIndex("dirty", "dirty");
        const r = d.createObjectStore("reports", { keyPath: "id" });
        r.createIndex("dirty", "dirty");
        r.createIndex("fittingId", "fittingId");
        d.createObjectStore("meta");
      },
    });
  }
  return dbp;
}

export function newId() {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}

const now = () => new Date().toISOString();

/** Notifie l'interface qu'il faut relire la base (invalidation TanStack). */
type Listener = () => void;
const listeners = new Set<Listener>();
export function onStoreChange(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit() {
  for (const l of listeners) l();
}

/** Declenche une synchronisation differee, sans bloquer l'ecriture locale. */
let syncHook: (() => void) | null = null;
export function setSyncHook(fn: () => void) {
  syncHook = fn;
}
function scheduleSync() {
  if (syncHook) syncHook();
}

/* ---------------------------------------------------------------- fittings */

export async function listFittings(): Promise<(Fitting & { reportCount: number })[]> {
  const d = await db();
  const all = (await d.getAll("fittings")).filter((f) => !f.deletedAt);
  const reports = (await d.getAll("reports")).filter((r) => !r.deletedAt);
  const counts = new Map<string, number>();
  for (const r of reports) counts.set(r.fittingId, (counts.get(r.fittingId) ?? 0) + 1);
  return all
    .map((f) => ({ ...f, reportCount: counts.get(f.id) ?? 0 }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.updatedAt.localeCompare(a.updatedAt)));
}

export async function getFitting(id: string): Promise<Fitting | undefined> {
  const d = await db();
  const f = await d.get("fittings", id);
  return f && !f.deletedAt ? f : undefined;
}

export async function createFitting(input: {
  playerName: string;
  date: string;
  status: string;
  brand: string;
  data: string;
}): Promise<Fitting> {
  const d = await db();
  const row: Fitting = {
    id: newId(),
    playerName: input.playerName || "Sans nom",
    date: input.date,
    status: input.status || "en_cours",
    brand: input.brand || "",
    data: input.data,
    updatedAt: now(),
    deletedAt: null,
    dirty: 1,
  };
  await d.put("fittings", row);
  emit();
  scheduleSync();
  return row;
}

export async function updateFitting(
  id: string,
  patch: Partial<Pick<Fitting, "playerName" | "date" | "status" | "brand" | "data">>,
): Promise<Fitting | undefined> {
  const d = await db();
  const cur = await d.get("fittings", id);
  if (!cur) return undefined;
  const row: Fitting = { ...cur, ...patch, updatedAt: now(), dirty: 1 };
  await d.put("fittings", row);
  emit();
  scheduleSync();
  return row;
}

export async function deleteFitting(id: string) {
  const d = await db();
  const cur = await d.get("fittings", id);
  if (!cur) return;
  const stamp = now();
  await d.put("fittings", { ...cur, deletedAt: stamp, updatedAt: stamp, dirty: 1 });
  const linked = await d.getAllFromIndex("reports", "fittingId", id);
  const tx = d.transaction("reports", "readwrite");
  for (const r of linked) {
    if (!r.deletedAt) await tx.store.put({ ...r, deletedAt: stamp, updatedAt: stamp, dirty: 1 });
  }
  await tx.done;
  emit();
  scheduleSync();
}

/* ----------------------------------------------------------------- reports */

export async function listReports(fittingId: string): Promise<Report[]> {
  const d = await db();
  return (await d.getAllFromIndex("reports", "fittingId", fittingId))
    .filter((r) => !r.deletedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createReport(input: {
  fittingId: string;
  playerName: string;
  createdAt: string;
  label: string;
  brand: string;
  insightCount: number;
  snapshot: string;
}): Promise<Report> {
  const d = await db();
  const row: Report = {
    id: newId(),
    ...input,
    updatedAt: now(),
    deletedAt: null,
    dirty: 1,
  };
  await d.put("reports", row);
  emit();
  scheduleSync();
  return row;
}

export async function deleteReport(id: string) {
  const d = await db();
  const cur = await d.get("reports", id);
  if (!cur) return;
  const stamp = now();
  await d.put("reports", { ...cur, deletedAt: stamp, updatedAt: stamp, dirty: 1 });
  emit();
  scheduleSync();
}

/* -------------------------------------------------- acces interne (sync.ts) */

export async function pendingCount() {
  const d = await db();
  const a = await d.countFromIndex("fittings", "dirty", 1);
  const b = await d.countFromIndex("reports", "dirty", 1);
  return a + b;
}

export async function dirtyRows() {
  const d = await db();
  return {
    fittings: await d.getAllFromIndex("fittings", "dirty", 1),
    reports: await d.getAllFromIndex("reports", "dirty", 1),
  };
}

export async function markClean(kind: "fittings" | "reports", ids: string[]) {
  if (!ids.length) return;
  const d = await db();
  const tx = d.transaction(kind, "readwrite");
  for (const id of ids) {
    const cur = await tx.store.get(id);
    if (cur) await tx.store.put({ ...cur, dirty: 0 } as never);
  }
  await tx.done;
}

/** Applique une ligne venue du serveur (le plus recent gagne). */
export async function applyRemote(kind: "fittings" | "reports", rows: (Fitting | Report)[]) {
  if (!rows.length) return 0;
  const d = await db();
  const tx = d.transaction(kind, "readwrite");
  let applied = 0;
  for (const row of rows) {
    const cur = (await tx.store.get(row.id)) as Fitting | Report | undefined;
    if (cur && cur.dirty === 1 && cur.updatedAt >= row.updatedAt) continue;
    if (cur && cur.updatedAt > row.updatedAt) continue;
    await tx.store.put({ ...(row as object), dirty: 0 } as never);
    applied += 1;
  }
  await tx.done;
  if (applied) emit();
  return applied;
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const d = await db();
  return (await d.get("meta", key)) as T | undefined;
}

export async function setMeta(key: string, value: unknown) {
  const d = await db();
  await d.put("meta", value, key);
}

/** Efface les donnees locales (utilise a la deconnexion si demande). */
export async function wipeLocal() {
  const d = await db();
  await d.clear("fittings");
  await d.clear("reports");
  await d.clear("meta");
  emit();
}
