-- ACP Enterprise core database
-- Target: PostgreSQL 15+ / Supabase

create extension if not exists pgcrypto;

create type public.app_role as enum (
  'system_admin',
  'project_manager',
  'supervisor',
  'employee',
  'reader'
);

create type public.record_status as enum ('active', 'inactive', 'archived');
create type public.incident_priority as enum ('low', 'medium', 'high', 'critical');
create type public.incident_status as enum ('open', 'assigned', 'in_progress', 'resolved', 'closed', 'cancelled');
create type public.stock_movement_type as enum ('receipt', 'issue', 'transfer_in', 'transfer_out', 'adjustment');
create type public.report_status as enum ('draft', 'submitted', 'approved', 'rejected', 'archived');
create type public.sync_status as enum ('pending', 'applied', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  employee_no text unique,
  phone text,
  role public.app_role not null default 'employee',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  client_name text,
  city text,
  status public.record_status not null default 'active',
  start_date date,
  end_date date,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_dates_check check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  code text not null,
  name text not null,
  building_type text,
  address text,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, code)
);

create table public.gates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  building_id uuid references public.buildings(id) on delete set null,
  code text not null,
  name text not null,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, code)
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  employee_no text not null,
  full_name text not null,
  job_title text,
  phone text,
  status public.record_status not null default 'active',
  hired_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, employee_no)
);

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  code text not null,
  name text not null,
  location text,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, code)
);

create table public.warehouse_items (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  sku text not null,
  name text not null,
  unit text not null default 'قطعة',
  quantity numeric(14,3) not null default 0,
  minimum_quantity numeric(14,3) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (warehouse_id, sku),
  constraint warehouse_items_quantity_check check (quantity >= 0 and minimum_quantity >= 0)
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.warehouse_items(id) on delete restrict,
  movement_type public.stock_movement_type not null,
  quantity numeric(14,3) not null,
  reference_no text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint stock_movements_quantity_check check (quantity > 0)
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  building_id uuid references public.buildings(id) on delete set null,
  gate_id uuid references public.gates(id) on delete set null,
  report_no text not null unique,
  title text not null,
  description text not null,
  priority public.incident_priority not null default 'medium',
  status public.incident_status not null default 'open',
  assigned_to uuid references public.profiles(id) on delete set null,
  reported_by uuid references public.profiles(id) on delete set null,
  due_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  report_no text not null unique,
  report_type text not null,
  title text not null,
  period_start date,
  period_end date,
  status public.report_status not null default 'draft',
  payload jsonb not null default '{}'::jsonb,
  qr_payload text,
  created_by uuid references public.profiles(id),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_dates_check check (period_end is null or period_start is null or period_end >= period_start)
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  bucket text not null default 'acp-private',
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (bucket, storage_path)
);

create table public.sync_mutations (
  id uuid primary key default gen_random_uuid(),
  mutation_id uuid not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  device_id text not null,
  entity_type text not null,
  operation text not null check (operation in ('insert', 'update', 'delete')),
  payload jsonb not null,
  status public.sync_status not null default 'pending',
  error_message text,
  created_at timestamptz not null default now(),
  applied_at timestamptz
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index project_members_user_idx on public.project_members(user_id);
create index buildings_project_idx on public.buildings(project_id);
create index gates_project_idx on public.gates(project_id);
create index employees_project_idx on public.employees(project_id);
create index warehouses_project_idx on public.warehouses(project_id);
create index incidents_project_status_idx on public.incidents(project_id, status);
create index reports_project_status_idx on public.reports(project_id, status);
create index attachments_entity_idx on public.attachments(entity_type, entity_id);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);
create index sync_mutations_status_idx on public.sync_mutations(status, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();
create trigger buildings_set_updated_at before update on public.buildings
for each row execute function public.set_updated_at();
create trigger gates_set_updated_at before update on public.gates
for each row execute function public.set_updated_at();
create trigger employees_set_updated_at before update on public.employees
for each row execute function public.set_updated_at();
create trigger warehouses_set_updated_at before update on public.warehouses
for each row execute function public.set_updated_at();
create trigger warehouse_items_set_updated_at before update on public.warehouse_items
for each row execute function public.set_updated_at();
create trigger incidents_set_updated_at before update on public.incidents
for each row execute function public.set_updated_at();
create trigger reports_set_updated_at before update on public.reports
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email, 'مستخدم جديد'),
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid() and is_active),
    'reader'::public.app_role
  );
$$;

create or replace function public.can_access_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_app_role() = 'system_admin'
    or exists (
      select 1
      from public.project_members pm
      join public.profiles p on p.id = pm.user_id
      where pm.project_id = target_project_id
        and pm.user_id = auth.uid()
        and p.is_active
    );
$$;

create or replace function public.can_manage_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_app_role() = 'system_admin'
    or exists (
      select 1
      from public.project_members pm
      where pm.project_id = target_project_id
        and pm.user_id = auth.uid()
        and pm.role in ('project_manager', 'supervisor')
    );
$$;

create or replace function public.next_document_number(prefix text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  sequence_value bigint;
begin
  sequence_value := nextval('public.document_number_seq');
  return upper(prefix) || '-' || to_char(now(), 'YYYYMM') || '-' || lpad(sequence_value::text, 6, '0');
end;
$$;

create sequence public.document_number_seq start 1;

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_id uuid;
begin
  row_id := coalesce(new.id, old.id);
  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data
  ) values (
    auth.uid(),
    tg_op,
    tg_table_name,
    row_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

create trigger projects_audit after insert or update or delete on public.projects
for each row execute function public.audit_row_change();
create trigger buildings_audit after insert or update or delete on public.buildings
for each row execute function public.audit_row_change();
create trigger gates_audit after insert or update or delete on public.gates
for each row execute function public.audit_row_change();
create trigger employees_audit after insert or update or delete on public.employees
for each row execute function public.audit_row_change();
create trigger warehouses_audit after insert or update or delete on public.warehouses
for each row execute function public.audit_row_change();
create trigger incidents_audit after insert or update or delete on public.incidents
for each row execute function public.audit_row_change();
create trigger reports_audit after insert or update or delete on public.reports
for each row execute function public.audit_row_change();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.buildings enable row level security;
alter table public.gates enable row level security;
alter table public.employees enable row level security;
alter table public.warehouses enable row level security;
alter table public.warehouse_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.incidents enable row level security;
alter table public.reports enable row level security;
alter table public.attachments enable row level security;
alter table public.sync_mutations enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_read_self_or_admin on public.profiles
for select using (id = auth.uid() or public.current_app_role() = 'system_admin');
create policy profiles_update_self_or_admin on public.profiles
for update using (id = auth.uid() or public.current_app_role() = 'system_admin')
with check (id = auth.uid() or public.current_app_role() = 'system_admin');

create policy projects_read on public.projects
for select using (public.can_access_project(id));
create policy projects_insert on public.projects
for insert with check (public.current_app_role() = 'system_admin');
create policy projects_update on public.projects
for update using (public.can_manage_project(id)) with check (public.can_manage_project(id));
create policy projects_delete on public.projects
for delete using (public.current_app_role() = 'system_admin');

create policy project_members_read on public.project_members
for select using (public.can_access_project(project_id));
create policy project_members_write on public.project_members
for all using (public.can_manage_project(project_id)) with check (public.can_manage_project(project_id));

create policy buildings_read on public.buildings
for select using (public.can_access_project(project_id));
create policy buildings_write on public.buildings
for all using (public.can_manage_project(project_id)) with check (public.can_manage_project(project_id));

create policy gates_read on public.gates
for select using (public.can_access_project(project_id));
create policy gates_write on public.gates
for all using (public.can_manage_project(project_id)) with check (public.can_manage_project(project_id));

create policy employees_read on public.employees
for select using (public.can_access_project(project_id));
create policy employees_write on public.employees
for all using (public.can_manage_project(project_id)) with check (public.can_manage_project(project_id));

create policy warehouses_read on public.warehouses
for select using (public.can_access_project(project_id));
create policy warehouses_write on public.warehouses
for all using (public.can_manage_project(project_id)) with check (public.can_manage_project(project_id));

create policy warehouse_items_read on public.warehouse_items
for select using (
  exists (
    select 1 from public.warehouses w
    where w.id = warehouse_id and public.can_access_project(w.project_id)
  )
);
create policy warehouse_items_write on public.warehouse_items
for all using (
  exists (
    select 1 from public.warehouses w
    where w.id = warehouse_id and public.can_manage_project(w.project_id)
  )
) with check (
  exists (
    select 1 from public.warehouses w
    where w.id = warehouse_id and public.can_manage_project(w.project_id)
  )
);

create policy stock_movements_read on public.stock_movements
for select using (
  exists (
    select 1
    from public.warehouse_items wi
    join public.warehouses w on w.id = wi.warehouse_id
    where wi.id = item_id and public.can_access_project(w.project_id)
  )
);
create policy stock_movements_insert on public.stock_movements
for insert with check (
  exists (
    select 1
    from public.warehouse_items wi
    join public.warehouses w on w.id = wi.warehouse_id
    where wi.id = item_id and public.can_manage_project(w.project_id)
  )
);

create policy incidents_read on public.incidents
for select using (public.can_access_project(project_id));
create policy incidents_insert on public.incidents
for insert with check (public.can_access_project(project_id));
create policy incidents_update on public.incidents
for update using (public.can_manage_project(project_id) or reported_by = auth.uid())
with check (public.can_manage_project(project_id) or reported_by = auth.uid());
create policy incidents_delete on public.incidents
for delete using (public.can_manage_project(project_id));

create policy reports_read on public.reports
for select using (public.can_access_project(project_id));
create policy reports_insert on public.reports
for insert with check (public.can_access_project(project_id));
create policy reports_update on public.reports
for update using (public.can_manage_project(project_id) or created_by = auth.uid())
with check (public.can_manage_project(project_id) or created_by = auth.uid());
create policy reports_delete on public.reports
for delete using (public.can_manage_project(project_id));

create policy attachments_read on public.attachments
for select using (project_id is null or public.can_access_project(project_id));
create policy attachments_write on public.attachments
for all using (project_id is null or public.can_manage_project(project_id))
with check (project_id is null or public.can_manage_project(project_id));

create policy sync_mutations_own on public.sync_mutations
for all using (user_id = auth.uid() or public.current_app_role() = 'system_admin')
with check (user_id = auth.uid() or public.current_app_role() = 'system_admin');

create policy audit_logs_admin_read on public.audit_logs
for select using (public.current_app_role() = 'system_admin');

-- Private object storage bucket. Run after storage schema is available.
insert into storage.buckets (id, name, public, file_size_limit)
values ('acp-private', 'acp-private', false, 52428800)
on conflict (id) do nothing;

create policy acp_storage_read on storage.objects
for select using (
  bucket_id = 'acp-private'
  and auth.role() = 'authenticated'
);

create policy acp_storage_insert on storage.objects
for insert with check (
  bucket_id = 'acp-private'
  and auth.role() = 'authenticated'
);

create policy acp_storage_update on storage.objects
for update using (
  bucket_id = 'acp-private'
  and auth.role() = 'authenticated'
);

create policy acp_storage_delete on storage.objects
for delete using (
  bucket_id = 'acp-private'
  and public.current_app_role() in ('system_admin', 'project_manager')
);
