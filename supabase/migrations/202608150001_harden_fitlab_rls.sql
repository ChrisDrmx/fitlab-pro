-- FitLab Pro : policies RLS explicites pour les donnees synchronisees.
-- A appliquer dans le projet Supabase avant le prochain deploiement.

alter table public.fitlab_fittings enable row level security;
alter table public.fitlab_reports enable row level security;

drop policy if exists fitlab_fittings_owner_all on public.fitlab_fittings;
drop policy if exists fitlab_fittings_select_own on public.fitlab_fittings;
drop policy if exists fitlab_fittings_insert_own on public.fitlab_fittings;
drop policy if exists fitlab_fittings_update_own on public.fitlab_fittings;
drop policy if exists fitlab_fittings_delete_own on public.fitlab_fittings;

create policy fitlab_fittings_select_own on public.fitlab_fittings
  for select to authenticated using ((select auth.uid()) = owner);
create policy fitlab_fittings_insert_own on public.fitlab_fittings
  for insert to authenticated with check ((select auth.uid()) = owner);
create policy fitlab_fittings_update_own on public.fitlab_fittings
  for update to authenticated
  using ((select auth.uid()) = owner)
  with check ((select auth.uid()) = owner);
create policy fitlab_fittings_delete_own on public.fitlab_fittings
  for delete to authenticated using ((select auth.uid()) = owner);

drop policy if exists fitlab_reports_owner_all on public.fitlab_reports;
drop policy if exists fitlab_reports_select_own on public.fitlab_reports;
drop policy if exists fitlab_reports_insert_own on public.fitlab_reports;
drop policy if exists fitlab_reports_update_own on public.fitlab_reports;
drop policy if exists fitlab_reports_delete_own on public.fitlab_reports;

create policy fitlab_reports_select_own on public.fitlab_reports
  for select to authenticated using ((select auth.uid()) = owner);
create policy fitlab_reports_insert_own on public.fitlab_reports
  for insert to authenticated with check ((select auth.uid()) = owner);
create policy fitlab_reports_update_own on public.fitlab_reports
  for update to authenticated
  using ((select auth.uid()) = owner)
  with check ((select auth.uid()) = owner);
create policy fitlab_reports_delete_own on public.fitlab_reports
  for delete to authenticated using ((select auth.uid()) = owner);
