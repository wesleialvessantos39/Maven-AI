-- REVISIONE antes de aplicar. Projeto dedicado de teste recomendado.
create extension if not exists pgcrypto;
create table if not exists public.tasks (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (length(title) between 2 and 140),
 done boolean not null default false,
 created_at timestamptz not null default now()
);
create index if not exists tasks_user_created_idx on public.tasks(user_id, created_at desc);
alter table public.tasks enable row level security;
grant select,insert,update,delete on public.tasks to authenticated;
drop policy if exists tasks_select_own on public.tasks;
create policy tasks_select_own on public.tasks for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists tasks_insert_own on public.tasks;
create policy tasks_insert_own on public.tasks for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists tasks_update_own on public.tasks;
create policy tasks_update_own on public.tasks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists tasks_delete_own on public.tasks;
create policy tasks_delete_own on public.tasks for delete to authenticated using ((select auth.uid()) = user_id);
