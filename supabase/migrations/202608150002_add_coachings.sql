-- Parcours Coaching : meme modele local-first et meme isolation par compte que les fittings.
create table if not exists public.fitlab_coachings (
  id            uuid        primary key,
  owner         uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  student_name  text        not null default 'Sans nom',
  student_email text        not null default '',
  date          date        not null default current_date,
  status        text        not null default 'en_cours',
  data          jsonb       not null default '{}'::jsonb,
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index if not exists fitlab_coachings_owner_idx
  on public.fitlab_coachings (owner, updated_at desc);

alter table public.fitlab_coachings enable row level security;

drop policy if exists fitlab_coachings_owner_all on public.fitlab_coachings;
drop policy if exists fitlab_coachings_select_own on public.fitlab_coachings;
drop policy if exists fitlab_coachings_insert_own on public.fitlab_coachings;
drop policy if exists fitlab_coachings_update_own on public.fitlab_coachings;
drop policy if exists fitlab_coachings_delete_own on public.fitlab_coachings;
create policy fitlab_coachings_select_own on public.fitlab_coachings
  for select to authenticated using ((select auth.uid()) = owner);
create policy fitlab_coachings_insert_own on public.fitlab_coachings
  for insert to authenticated with check ((select auth.uid()) = owner);
create policy fitlab_coachings_update_own on public.fitlab_coachings
  for update to authenticated
  using ((select auth.uid()) = owner)
  with check ((select auth.uid()) = owner);
create policy fitlab_coachings_delete_own on public.fitlab_coachings
  for delete to authenticated using ((select auth.uid()) = owner);
