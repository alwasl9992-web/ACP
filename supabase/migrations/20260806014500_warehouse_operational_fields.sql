alter table public.warehouses
  add column manager_id uuid references public.employees(id) on delete set null,
  add column capacity numeric(14,3) not null default 0;

alter table public.warehouses
  add constraint warehouses_capacity_nonnegative check (capacity >= 0);

create index warehouses_manager_idx on public.warehouses(manager_id)
where manager_id is not null;
