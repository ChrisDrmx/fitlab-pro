-- FitLab Pro storage for the analyze-upload-report Supabase project.
-- The application uses the server-side publishable key and remains protected
-- by Vercel Authentication. Supabase Auth can be added later for per-user rows.

create table if not exists public.fitlab_fittings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

create table if not exists public.fitlab_reports (
  id uuid primary key default gen_random_uuid(),
  fitting_id uuid not null references public.fitlab_fittings(id) on delete cascade,
  created_at timestamptz not null default now(),
  snapshot jsonb not null default '{}'::jsonb
);

create index if not exists fitlab_fittings_updated_at_idx
  on public.fitlab_fittings (updated_at desc);

create index if not exists fitlab_reports_fitting_id_created_at_idx
  on public.fitlab_reports (fitting_id, created_at desc);

alter table public.fitlab_fittings enable row level security;
alter table public.fitlab_reports enable row level security;

grant select, insert, update, delete on table public.fitlab_fittings to anon;
grant select, insert, update, delete on table public.fitlab_reports to anon;

drop policy if exists "FitLab fittings read" on public.fitlab_fittings;
create policy "FitLab fittings read"
  on public.fitlab_fittings for select to anon using (true);

drop policy if exists "FitLab fittings create" on public.fitlab_fittings;
create policy "FitLab fittings create"
  on public.fitlab_fittings for insert to anon with check (true);

drop policy if exists "FitLab fittings update" on public.fitlab_fittings;
create policy "FitLab fittings update"
  on public.fitlab_fittings for update to anon using (true) with check (true);

drop policy if exists "FitLab fittings delete" on public.fitlab_fittings;
create policy "FitLab fittings delete"
  on public.fitlab_fittings for delete to anon using (true);

drop policy if exists "FitLab reports read" on public.fitlab_reports;
create policy "FitLab reports read"
  on public.fitlab_reports for select to anon using (true);

drop policy if exists "FitLab reports create" on public.fitlab_reports;
create policy "FitLab reports create"
  on public.fitlab_reports for insert to anon with check (true);

drop policy if exists "FitLab reports delete" on public.fitlab_reports;
create policy "FitLab reports delete"
  on public.fitlab_reports for delete to anon using (true);
