import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type StoredFitting = {
  id: string;
  createdAt: string;
  updatedAt: string;
  data: Record<string, any>;
};

export type StoredReport = {
  id: string;
  fittingId: string;
  createdAt: string;
  snapshot: Record<string, any>;
};

type State = { fittings: StoredFitting[]; reports: StoredReport[] };

const filePath = process.env.VERCEL
  ? "/tmp/fitlab-pro-data.json"
  : path.resolve(process.cwd(), "data/fitlab-pro-data.json");

function emptyState(): State {
  return { fittings: [], reports: [] };
}

function readState(): State {
  try {
    if (!fs.existsSync(filePath)) return emptyState();
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      fittings: Array.isArray(parsed.fittings) ? parsed.fittings : [],
      reports: Array.isArray(parsed.reports) ? parsed.reports : [],
    };
  } catch {
    return emptyState();
  }
}

function writeState(state: State) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
}

export function listFittings() {
  const state = readState();
  return state.fittings
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((fitting) => ({
      ...fitting.data,
      id: fitting.id,
      createdAt: fitting.createdAt,
      updatedAt: fitting.updatedAt,
      reportCount: state.reports.filter((report) => report.fittingId === fitting.id).length,
    }));
}

export function getFitting(id: string) {
  const state = readState();
  const fitting = state.fittings.find((item) => item.id === id);
  if (!fitting) return null;
  return { ...fitting.data, id: fitting.id, createdAt: fitting.createdAt, updatedAt: fitting.updatedAt };
}

export function createFitting(data: Record<string, any>) {
  const state = readState();
  const now = new Date().toISOString();
  const fitting: StoredFitting = { id: randomUUID(), createdAt: now, updatedAt: now, data };
  state.fittings.push(fitting);
  writeState(state);
  return { ...data, id: fitting.id, createdAt: now, updatedAt: now };
}

export function updateFitting(id: string, patch: Record<string, any>) {
  const state = readState();
  const fitting = state.fittings.find((item) => item.id === id);
  if (!fitting) return null;
  fitting.data = { ...fitting.data, ...patch };
  fitting.updatedAt = new Date().toISOString();
  writeState(state);
  return { ...fitting.data, id: fitting.id, createdAt: fitting.createdAt, updatedAt: fitting.updatedAt };
}

export function deleteFitting(id: string) {
  const state = readState();
  const before = state.fittings.length;
  state.fittings = state.fittings.filter((item) => item.id !== id);
  state.reports = state.reports.filter((report) => report.fittingId !== id);
  if (state.fittings.length === before) return false;
  writeState(state);
  return true;
}

export function listReports(fittingId: string) {
  return readState().reports
    .filter((report) => report.fittingId === fittingId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createReport(fittingId: string, snapshot: Record<string, any>) {
  const state = readState();
  const report: StoredReport = { id: randomUUID(), fittingId, createdAt: new Date().toISOString(), snapshot };
  state.reports.push(report);
  writeState(state);
  return report;
}

export function deleteReport(id: string) {
  const state = readState();
  const before = state.reports.length;
  state.reports = state.reports.filter((report) => report.id !== id);
  if (state.reports.length === before) return false;
  writeState(state);
  return true;
}
