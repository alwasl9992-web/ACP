-- Some early Staging data received these columns manually. Reconcile the
-- schema without deleting usable data, then register the canonical migration.
alter table public.warehouses
  add column if not exists manager_id uuid,
  add column if not exists capacity numeric(14,3);

do $$
begin
  -- Normalize legacy manager values. Invalid/non-UUID text is cleared instead
  -- of making the migration fail or linking to an unintended employee.
  alter table public.warehouses
    alter column manager_id type uuid
    using (
      case
        when manager_id is null then null
        when manager_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
          then manager_id::text::uuid
        else null
      end
    );

  -- Normalize legacy numeric/text capacity values and reject negative values.
  alter table public.warehouses
    alter column capacity type numeric(14,3)
    using (
      case
        when capacity is null then 0
        when capacity::text ~ '^-?[0-9]+([.][0-9]+)?$'
          then greatest(capacity::text::numeric, 0)
        else 0
      end
    );
end
$$;

update public.warehouses set capacity = 0 where capacity is null;

alter table public.warehouses
  alter column capacity set default 0,
  alter column capacity set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint constraint_row
    join unnest(constraint_row.conkey) key(attnum) on true
    join pg_attribute attribute
      on attribute.attrelid = constraint_row.conrelid
     and attribute.attnum = key.attnum
    where constraint_row.conrelid = 'public.warehouses'::regclass
      and constraint_row.contype = 'f'
      and attribute.attname = 'manager_id'
  ) then
    alter table public.warehouses
      add constraint warehouses_manager_id_fkey
      foreign key (manager_id) references public.employees(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.warehouses'::regclass
      and conname = 'warehouses_capacity_nonnegative'
  ) then
    alter table public.warehouses
      add constraint warehouses_capacity_nonnegative check (capacity >= 0);
  end if;
end
$$;

create index if not exists warehouses_manager_idx
on public.warehouses(manager_id)
where manager_id is not null;
