-- Persistent work orders linked to ACP assets.
create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  code text not null,
  title text not null,
  description text,
  priority text not null default 'Medium'
    check (priority in ('Low', 'Medium', 'High', 'Critical')),
  status text not null default 'Open'
    check (status in ('Open', 'InProgress', 'Completed', 'Cancelled')),
  assigned_to text,
  due_date date,
  created_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, code),
  constraint work_orders_completed_at_check check (
    (status = 'Completed' and completed_at is not null)
    or (status <> 'Completed')
  )
);

create index work_orders_project_idx on public.work_orders(project_id, created_at desc);
create index work_orders_asset_idx on public.work_orders(asset_id, status, created_at desc);
create index work_orders_due_idx on public.work_orders(project_id, due_date)
where status in ('Open', 'InProgress');

create trigger work_orders_set_updated_at before update on public.work_orders
for each row execute function public.set_updated_at();

create trigger work_orders_audit after insert or update or delete on public.work_orders
for each row execute function public.audit_row_change();

alter table public.work_orders enable row level security;

create policy work_orders_read on public.work_orders
for select using (public.can_access_project(project_id));

create policy work_orders_insert on public.work_orders
for insert with check (public.can_manage_project(project_id));

create policy work_orders_update on public.work_orders
for update using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));

create policy work_orders_delete on public.work_orders
for delete using (public.can_manage_project(project_id));

revoke all on table public.work_orders from anon;
grant select, insert, update, delete on table public.work_orders to authenticated;
