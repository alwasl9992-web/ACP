create type public.attendance_type as enum ('present', 'absent', 'late', 'leave');

alter table public.gates
  add column if not exists supervisor_id uuid references public.profiles(id) on delete set null;

alter table public.warehouses
  add column if not exists manager_id uuid references public.profiles(id) on delete set null,
  add column if not exists capacity numeric(14,3) not null default 0;

create table public.gate_daily_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  gate_id uuid not null references public.gates(id) on delete cascade,
  log_date date not null default current_date,
  trucks_count integer not null default 0,
  visitors_count integer not null default 0,
  contractors_count integer not null default 0,
  event_summary text,
  action_taken text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gate_id, log_date),
  constraint gate_daily_counts_check check (
    trucks_count >= 0 and visitors_count >= 0 and contractors_count >= 0
  )
);

create table public.employee_assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  building_id uuid references public.buildings(id) on delete set null,
  gate_id uuid references public.gates(id) on delete set null,
  department text,
  assignment_title text,
  starts_at date not null default current_date,
  ends_at date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_assignments_dates_check check (ends_at is null or ends_at >= starts_at)
);

create table public.attendance_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  event_date date not null default current_date,
  event_type public.attendance_type not null,
  minutes_late integer not null default 0,
  notes text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (employee_id, event_date, event_type),
  constraint attendance_minutes_check check (minutes_late >= 0)
);

create table public.employee_warnings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  warning_no text not null unique,
  warning_date date not null default current_date,
  reason text not null,
  action_taken text,
  status text not null default 'active' check (status in ('active', 'cancelled', 'archived')),
  issued_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index gate_daily_logs_project_date_idx on public.gate_daily_logs(project_id, log_date desc);
create index employee_assignments_employee_idx on public.employee_assignments(employee_id, is_active);
create index attendance_events_employee_date_idx on public.attendance_events(employee_id, event_date desc);
create index employee_warnings_employee_idx on public.employee_warnings(employee_id, warning_date desc);

create trigger gate_daily_logs_set_updated_at before update on public.gate_daily_logs
for each row execute function public.set_updated_at();
create trigger employee_assignments_set_updated_at before update on public.employee_assignments
for each row execute function public.set_updated_at();

create trigger gate_daily_logs_audit after insert or update or delete on public.gate_daily_logs
for each row execute function public.audit_row_change();
create trigger employee_assignments_audit after insert or update or delete on public.employee_assignments
for each row execute function public.audit_row_change();
create trigger attendance_events_audit after insert or update or delete on public.attendance_events
for each row execute function public.audit_row_change();
create trigger employee_warnings_audit after insert or update or delete on public.employee_warnings
for each row execute function public.audit_row_change();

alter table public.gate_daily_logs enable row level security;
alter table public.employee_assignments enable row level security;
alter table public.attendance_events enable row level security;
alter table public.employee_warnings enable row level security;

create policy gate_daily_logs_read on public.gate_daily_logs
for select using (public.can_access_project(project_id));
create policy gate_daily_logs_write on public.gate_daily_logs
for all using (public.can_access_project(project_id))
with check (public.can_access_project(project_id));

create policy employee_assignments_read on public.employee_assignments
for select using (public.can_access_project(project_id));
create policy employee_assignments_write on public.employee_assignments
for all using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));

create policy attendance_events_read on public.attendance_events
for select using (public.can_access_project(project_id));
create policy attendance_events_write on public.attendance_events
for all using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));

create policy employee_warnings_read on public.employee_warnings
for select using (public.can_access_project(project_id));
create policy employee_warnings_write on public.employee_warnings
for all using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));
