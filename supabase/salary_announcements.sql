create table if not exists public.salary_announcements (
  id uuid primary key default gen_random_uuid(),
  organization_code text not null,
  title text not null,
  content text not null,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.salary_announcements
  drop constraint if exists salary_announcements_organization_code_check;

alter table public.salary_announcements
  add constraint salary_announcements_organization_code_check
  check (organization_code in ('deepnight', 'qiunai', 'xy', 'all'));

create index if not exists salary_announcements_active_idx
  on public.salary_announcements (organization_code, is_active, created_at desc);

alter table public.salary_announcements enable row level security;
revoke all on table public.salary_announcements from anon, authenticated;
grant all on table public.salary_announcements to service_role;

