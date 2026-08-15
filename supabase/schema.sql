-- FitLab Pro — schema de synchronisation.
-- Reflete l'etat reel du projet Supabase whhpqdhiwhsfsigchbxx (eu-west-1),
-- releve le 15 aout 2026. Idempotent : rejouable sans risque.
--
-- Modele : la source de verite est l'IndexedDB du navigateur. Ces tables ne
-- servent qu'a la sauvegarde et a la reprise sur un autre appareil, avec une
-- resolution "derniere ecriture gagnante" sur updated_at. La suppression est
-- logique (deleted_at) pour qu'elle se propage entre appareils.

create table if not exists public.fitlab_fittings (
  id           uuid        primary key,
  owner        uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  player_name  text        not null default 'Sans nom',
  date         date        not null default current_date,
  status       text        not null default 'en_cours',
  brand        text        not null default 'PING',
  data         jsonb       not null default '{}'::jsonb,
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create table if not exists public.fitlab_reports (
  id            uuid        primary key,
  fitting_id    uuid        not null,
  owner         uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  player_name   text        not null default 'Sans nom',
  created_at    timestamptz not null default now(),
  label         text        not null default '',
  brand         text        not null default '',
  insight_count integer     not null default 0,
  snapshot      jsonb       not null default '{}'::jsonb,
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- L'identifiant est genere par le client (crypto.randomUUID) avant meme d'avoir
-- du reseau : pas de default gen_random_uuid(), et fitting_id n'est pas une
-- cle etrangere pour qu'un rapport puisse remonter avant sa fiche.

create index if not exists fitlab_fittings_owner_idx
  on public.fitlab_fittings (owner, updated_at desc);
create index if not exists fitlab_reports_owner_idx
  on public.fitlab_reports (owner, updated_at desc);
create index if not exists fitlab_reports_fitting_idx
  on public.fitlab_reports (fitting_id, created_at desc);

alter table public.fitlab_fittings enable row level security;
alter table public.fitlab_reports  enable row level security;

-- Policies explicites : seuls les comptes authentifies peuvent toucher leurs
-- propres lignes. La cle publishable/anon exposee au navigateur ne donne donc
-- acces a aucune ligne sans session authentifiee.

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
