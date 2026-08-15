import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { CoachingData } from "./types";

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

export type Coaching = {
  id: string;
  studentName: string;
  studentEmail: string;
  date: string;
  status: string;
  data: string;
  updatedAt: string;
  deletedAt: string | null;
  dirty: number;
};

interface FitlabDB extends DBSchema {
  fittings: { key: string; value: Fitting; indexes: { dirty: number } };
  reports: { key: string; value: Report; indexes: { dirty: number; fittingId: string } };
  coachings: { key: string; value: Coaching; indexes: { dirty: number } };
  meta: { key: string; value: unknown };
}

let dbp: Promise<IDBPDatabase<FitlabDB>> | null = null;
export type StoreScope = "local" | `user:${string}`;
let activeScope: StoreScope = "local";

function databaseName() {
  if (activeScope === "local") return "fitlab-pro";
  // Les identifiants Supabase sont des UUID. Le remplacement garde un nom de
  // base lisible tout en evitant tout caractere structurel inattendu.
  return `fitlab-pro-${activeScope.slice(5).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

function db() {
  if (!dbp) {
    dbp = openDB<FitlabDB>(databaseName(), 2, {
      upgrade(d) {
        if (!d.objectStoreNames.contains("fittings")) {
          const f = d.createObjectStore("fittings", { keyPath: "id" });
          f.createIndex("dirty", "dirty");
        }
        if (!d.objectStoreNames.contains("reports")) {
          const r = d.createObjectStore("reports", { keyPath: "id" });
          r.createIndex("dirty", "dirty");
          r.createIndex("fittingId", "fittingId");
        }
        if (!d.objectStoreNames.contains("coachings")) {
          const c = d.createObjectStore("coachings", { keyPath: "id" });
          c.createIndex("dirty", "dirty");
        }
        if (!d.objectStoreNames.contains("meta")) d.createObjectStore("meta");
      },
    });
  }
  return dbp;
}

export function currentStoreScope() {
  return activeScope;
}

/** Change de base locale lorsque la session Supabase change. */
export async function switchStoreScope(scope: StoreScope) {
  if (scope === activeScope) return;
  const previous = dbp;
  dbp = null;
  activeScope = scope;
  if (previous) {
    try {
      (await previous).close();
    } catch {
      // Une base deja fermee ne doit pas bloquer la nouvelle session.
    }
  }
}

/**
 * Adopte les fiches creees en mode local apres une connexion explicite.
 * Les donnees restent aussi dans la base locale : une deconnexion ne les
 * detruit pas et un autre compte ne peut pas les voir dans sa base dediee.
 */
export async function adoptLocalDataFor(userId: string) {
  if (!userId) return;
  if (activeScope !== "local") await switchStoreScope("local");
  const source = await db();
  const fittings = await source.getAll("fittings");
  const reports = await source.getAll("reports");
  const coachings = await source.getAll("coachings");
  // Marque l'adoption comme consommee pour qu'un autre compte ne reprenne pas
  // les memes donnees locales apres une deconnexion.
  await source.put("meta", false, "localOnly");
  await switchStoreScope(`user:${userId}`);
  const target = await db();
  const fittingTx = target.transaction("fittings", "readwrite");
  for (const row of fittings) {
    if (!(await fittingTx.store.get(row.id))) {
      await fittingTx.store.put({ ...row, dirty: 1 });
    }
  }
  await fittingTx.done;
  const reportTx = target.transaction("reports", "readwrite");
  for (const row of reports) {
    if (!(await reportTx.store.get(row.id))) {
      await reportTx.store.put({ ...row, dirty: 1 });
    }
  }
  await reportTx.done;
  const coachingTx = target.transaction("coachings", "readwrite");
  for (const row of coachings) {
    if (!(await coachingTx.store.get(row.id))) {
      await coachingTx.store.put({ ...row, dirty: 1 });
    }
  }
  await coachingTx.done;
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

/* -------------------------------------------------------------- coachings */

export async function listCoachings(): Promise<Coaching[]> {
  const d = await db();
  return (await d.getAll("coachings"))
    .filter((c) => !c.deletedAt)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.updatedAt.localeCompare(a.updatedAt)));
}

export async function getCoaching(id: string): Promise<Coaching | undefined> {
  const d = await db();
  const c = await d.get("coachings", id);
  return c && !c.deletedAt ? c : undefined;
}

export async function createCoaching(input: {
  studentName: string;
  studentEmail: string;
  date: string;
  status: string;
  data: CoachingData | string;
}): Promise<Coaching> {
  const d = await db();
  const row: Coaching = {
    id: newId(),
    studentName: input.studentName || "Sans nom",
    studentEmail: input.studentEmail || "",
    date: input.date,
    status: input.status || "en_cours",
    data: typeof input.data === "string" ? input.data : JSON.stringify(input.data),
    updatedAt: now(),
    deletedAt: null,
    dirty: 1,
  };
  await d.put("coachings", row);
  emit();
  scheduleSync();
  return row;
}

export async function updateCoaching(
  id: string,
  patch: Partial<Pick<Coaching, "studentName" | "studentEmail" | "date" | "status" | "data">>,
): Promise<Coaching | undefined> {
  const d = await db();
  const cur = await d.get("coachings", id);
  if (!cur) return undefined;
  const row: Coaching = { ...cur, ...patch, updatedAt: now(), dirty: 1 };
  await d.put("coachings", row);
  emit();
  scheduleSync();
  return row;
}

export async function deleteCoaching(id: string) {
  const d = await db();
  const cur = await d.get("coachings", id);
  if (!cur) return;
  const stamp = now();
  await d.put("coachings", { ...cur, deletedAt: stamp, updatedAt: stamp, dirty: 1 });
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
  const c = await d.countFromIndex("coachings", "dirty", 1);
  return a + b + c;
}

export async function dirtyRows() {
  const d = await db();
  return {
    fittings: await d.getAllFromIndex("fittings", "dirty", 1),
    reports: await d.getAllFromIndex("reports", "dirty", 1),
    coachings: await d.getAllFromIndex("coachings", "dirty", 1),
  };
}

export async function markClean(kind: "fittings" | "reports" | "coachings", ids: string[]) {
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
export async function applyRemote(kind: "fittings" | "reports" | "coachings", rows: (Fitting | Report | Coaching)[]) {
  if (!rows.length) return 0;
  const d = await db();
  const tx = d.transaction(kind, "readwrite");
  let applied = 0;
  for (const row of rows) {
    const cur = (await tx.store.get(row.id)) as Fitting | Report | Coaching | undefined;
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
  await d.clear("coachings");
  await d.clear("meta");
  emit();
}
