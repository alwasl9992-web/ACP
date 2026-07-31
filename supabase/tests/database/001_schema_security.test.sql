begin;

create extension if not exists pgtap with schema extensions;

select plan(42);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'projects', 'projects table exists');
select has_table('public', 'project_members', 'project_members table exists');
select has_table('public', 'buildings', 'buildings table exists');
select has_table('public', 'assets', 'assets table exists');
select has_table('public', 'gates', 'gates table exists');
select has_table('public', 'gate_daily_logs', 'gate_daily_logs table exists');
select has_table('public', 'employees', 'employees table exists');
select has_table('public', 'employee_assignments', 'employee_assignments table exists');
select has_table('public', 'attendance_events', 'attendance_events table exists');
select has_table('public', 'employee_warnings', 'employee_warnings table exists');
select has_table('public', 'warehouses', 'warehouses table exists');
select has_table('public', 'warehouse_items', 'warehouse_items table exists');
select has_table('public', 'stock_movements', 'stock_movements table exists');
select has_table('public', 'incidents', 'incidents table exists');
select has_table('public', 'reports', 'reports table exists');
select has_table('public', 'attachments', 'attachments table exists');
select has_table('public', 'sync_mutations', 'sync_mutations table exists');
select has_table('public', 'audit_logs', 'audit_logs table exists');
select has_table('public', 'system_settings', 'system_settings table exists');

select ok(
  (select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'profiles'),
  'profiles has RLS enabled'
);
select ok(
  (select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'projects'),
  'projects has RLS enabled'
);
select ok(
  (select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'project_members'),
  'project_members has RLS enabled'
);
select ok(
  (select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'assets'),
  'assets has RLS enabled'
);
select ok(
  (select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'gates'),
  'gates has RLS enabled'
);
select ok(
  (select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'employees'),
  'employees has RLS enabled'
);
select ok(
  (select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'warehouses'),
  'warehouses has RLS enabled'
);
select ok(
  (select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'incidents'),
  'incidents has RLS enabled'
);
select ok(
  (select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'reports'),
  'reports has RLS enabled'
);
select ok(
  (select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'attachments'),
  'attachments has RLS enabled'
);
select ok(
  (select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'audit_logs'),
  'audit_logs has RLS enabled'
);
select ok(
  (select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'system_settings'),
  'system_settings has RLS enabled'
);

select ok(to_regprocedure('public.current_app_role()') is not null, 'current_app_role function exists');
select ok(to_regprocedure('public.can_access_project(uuid)') is not null, 'can_access_project function exists');
select ok(to_regprocedure('public.can_manage_project(uuid)') is not null, 'can_manage_project function exists');
select ok(to_regprocedure('public.can_administer_project_members(uuid)') is not null, 'project membership administration function exists');
select ok(to_regprocedure('public.protect_profile_privileges()') is not null, 'profile privilege protection function exists');

select ok(
  exists (
    select 1 from pg_catalog.pg_trigger
    where tgname = 'profiles_protect_privileges' and not tgisinternal
  ),
  'profile privilege protection trigger exists'
);
select ok(
  (select count(*) = 4 from pg_catalog.pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname in ('acp_storage_read', 'acp_storage_insert', 'acp_storage_update', 'acp_storage_delete')),
  'four project-isolated storage policies exist'
);
select ok(
  exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'public' and tablename = 'project_members' and policyname = 'project_members_write'
  ),
  'project member write policy exists'
);
select ok(
  to_regclass('public.system_settings_singleton_idx') is not null,
  'system settings singleton index exists'
);
select ok(
  exists (select 1 from storage.buckets where id = 'acp-private' and public = false),
  'private storage bucket exists'
);

select * from finish();
rollback;
