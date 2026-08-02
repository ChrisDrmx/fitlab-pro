import { createClient } from "@supabase/supabase-js";

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

type FittingRow = {
  id: string;
  created_at: string;
  updated_at: string;
  data: Record<string, any>;
};

type ReportRow = {
  id: string;
  fitting_id: string;
  created_at: string;
  snapshot: Record<string, any>;
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

function getSupabase() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Supabase n'est pas configuré : variables SUPABASE_URL et SUPABASE_PUBLISHABLE_KEY manquantes");
  }

  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

function fittingFromRow(row: FittingRow) {
  return {
    ...(row.data || {}),
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function reportFromRow(row: ReportRow): StoredReport {
  return {
    id: row.id,
    fittingId: row.fitting_id,
    createdAt: row.created_at,
    snapshot: row.snapshot || {},
  };
}

export async function listFittings() {
  const supabase = getSupabase();
  const [{ data: fittingRows, error: fittingsError }, { data: reportRows, error: reportsError }] = await Promise.all([
    supabase.from("fitlab_fittings").select("id, created_at, updated_at, data").order("updated_at", { ascending: false }),
    supabase.from("fitlab_reports").select("id, fitting_id"),
  ]);

  if (fittingsError) throw fittingsError;
  if (reportsError) throw reportsError;

  const reportCounts = new Map<string, number>();
  for (const report of reportRows || []) {
    reportCounts.set(report.fitting_id, (reportCounts.get(report.fitting_id) || 0) + 1);
  }

  return ((fittingRows || []) as FittingRow[]).map((fitting) => ({
    ...fittingFromRow(fitting),
    reportCount: reportCounts.get(fitting.id) || 0,
  }));
}

export async function getFitting(id: string) {
  const { data, error } = await getSupabase()
    .from("fitlab_fittings")
    .select("id, created_at, updated_at, data")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? fittingFromRow(data as FittingRow) : null;
}

export async function createFitting(data: Record<string, any>) {
  const { data: row, error } = await getSupabase()
    .from("fitlab_fittings")
    .insert({ data })
    .select("id, created_at, updated_at, data")
    .single();

  if (error) throw error;
  return fittingFromRow(row as FittingRow);
}

export async function updateFitting(id: string, patch: Record<string, any>) {
  const current = await getFitting(id);
  if (!current) return null;

  const mergedData: Record<string, any> = { ...current, ...patch };
  delete mergedData.id;
  delete mergedData.createdAt;
  delete mergedData.updatedAt;

  const { data: row, error } = await getSupabase()
    .from("fitlab_fittings")
    .update({ data: mergedData, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, created_at, updated_at, data")
    .single();

  if (error) throw error;
  return fittingFromRow(row as FittingRow);
}

export async function deleteFitting(id: string) {
  const { data, error } = await getSupabase()
    .from("fitlab_fittings")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) throw error;
  return Boolean(data?.length);
}

export async function listReports(fittingId: string) {
  const { data, error } = await getSupabase()
    .from("fitlab_reports")
    .select("id, fitting_id, created_at, snapshot")
    .eq("fitting_id", fittingId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data || []) as ReportRow[]).map(reportFromRow);
}

export async function createReport(fittingId: string, snapshot: Record<string, any>) {
  const { data, error } = await getSupabase()
    .from("fitlab_reports")
    .insert({ fitting_id: fittingId, snapshot })
    .select("id, fitting_id, created_at, snapshot")
    .single();

  if (error) throw error;
  return reportFromRow(data as ReportRow);
}

export async function deleteReport(id: string) {
  const { data, error } = await getSupabase()
    .from("fitlab_reports")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) throw error;
  return Boolean(data?.length);
}
