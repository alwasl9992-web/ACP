create table public.assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  building_id uuid references public.buildings(id) on delete set null,
  code text not null,
  name text not null,
  description text,
  asset_type text not null,
  location text,
  manufacturer text,
  model text,
  serial_number text,
  floors integer not null default 0,
  gates_count integer not null default 0,
  install_date date,
  warranty_expiry date,
  criticality text not null default 'Medium' check (criticality in ('Low', 'Medium', 'High', 'Critical')),
  operational_status text not null default 'Running' check (operational_status in ('Running', 'Maintenance', 'Stopped')),
  qr_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, code),
  constraint assets_nonnegative_counts check (floors >= 0 and gates_count >= 0),
  constraint assets_warranty_check check (
    warranty_expiry is null or install_date is null or warranty_expiry >= install_date
  )
);

create index assets_project_idx on public.assets(project_id);
create index assets_building_idx on public.assets(building_id);
create index assets_status_idx on public.assets(project_id, operational_status);

create trigger assets_set_updated_at before update on public.assets
for each row execute function public.set_updated_at();

create trigger assets_audit after insert or update or delete on public.assets
for each row execute function public.audit_row_change();

alter table public.assets enable row level security;

create policy assets_read on public.assets
for select using (public.can_access_project(project_id));

create policy assets_write on public.assets
for all using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));
