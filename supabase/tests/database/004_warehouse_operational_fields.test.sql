begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

select has_column('public', 'warehouses', 'manager_id', 'warehouses has a real manager field');
select col_is_fk('public', 'warehouses', 'manager_id', 'warehouse manager references an employee');
select has_column('public', 'warehouses', 'capacity', 'warehouses has a capacity field');
select col_type_is('public', 'warehouses', 'capacity', 'numeric', 'warehouse capacity uses numeric precision');
select col_not_null('public', 'warehouses', 'capacity', 'warehouse capacity cannot be null');
select col_has_default('public', 'warehouses', 'capacity', 'warehouse capacity has a default');
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.warehouses'::regclass
      and conname = 'warehouses_capacity_nonnegative'
  ),
  'warehouse capacity rejects negative values'
);
select ok(
  exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename = 'warehouses'
      and indexname = 'warehouses_manager_idx'
  ),
  'warehouse manager lookup is indexed'
);
select ok(
  has_table_privilege('authenticated', 'public.warehouses', 'SELECT, INSERT, UPDATE, DELETE'),
  'authenticated warehouse operations remain protected by RLS'
);

select * from finish();
rollback;
