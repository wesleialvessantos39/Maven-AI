create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 140),
  created_at timestamptz not null default now()
);
create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  primary key (organization_id, user_id)
);
create index organization_members_user_idx on public.organization_members(user_id);
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
revoke all on public.organizations, public.organization_members from anon, authenticated;
grant select on public.organizations, public.organization_members to authenticated;
create policy "members see own membership" on public.organization_members
  for select to authenticated using (user_id = (select auth.uid()));
create policy "members see organization" on public.organizations
  for select to authenticated using (
    exists (select 1 from public.organization_members m
      where m.organization_id = organizations.id and m.user_id = (select auth.uid()))
  );
-- Provisionamento de organizações e membros somente por backend confiável.
-- Nenhuma policy de escrita é concedida ao cliente neste template.
