begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

select has_table('public', 'work_orders', 'work_orders table exists');
select has_pk('public', 'work_orders', 'work_orders has a primary key');
select col_is_fk('public', 'work_orders', 'project_id', 'work_orders project_id is a foreign key');
select col_is_fk('public', 'work_orders', 'asset_id', 'work_orders asset_id is a foreign key');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.work_orders'::regclass),
  'work_orders has row-level security enabled'
);
select ok(
  (select count(*) = 4 from pg_policies where schemaname = 'public' and tablename = 'work_orders'),
  'work_orders defines read, insert, update and delete policies'
);
select ok(
  exists (
    select 1 from pg_trigger
    where tgrelid = 'public.work_orders'::regclass
      and tgname = 'work_orders_audit'
      and not tgisinternal
  ),
  'work_orders mutations are audited'
);
select ok(
  exists (
    select 1 from pg_trigger
    where tgrelid = 'public.work_orders'::regclass
      and tgname = 'work_orders_set_updated_at'
      and not tgisinternal
  ),
  'work_orders updated_at is maintained automatically'
);
select ok(
  has_table_privilege('authenticated', 'public.work_orders', 'SELECT, INSERT, UPDATE, DELETE'),
  'authenticated work-order operations reach RLS policies'
);
select ok(
  not has_table_privilege('anon', 'public.work_orders', 'SELECT'),
  'anonymous users cannot read work orders'
);
select ok(
  not has_table_privilege('anon', 'public.work_orders', 'INSERT'),
  'anonymous users cannot create work orders'
);
select ok(
  exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename = 'work_orders'
      and indexname = 'work_orders_asset_idx'
  ),
  'work_orders asset/status lookup is indexed'
);

select * from finish();
rollback;
