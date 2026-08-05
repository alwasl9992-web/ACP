begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

select ok(
  has_schema_privilege('authenticated', 'public', 'USAGE'),
  'authenticated can use the public schema'
);
select ok(
  has_table_privilege('authenticated', 'public.profiles', 'SELECT'),
  'authenticated can read profiles through RLS'
);
select ok(
  has_table_privilege('authenticated', 'public.profiles', 'UPDATE'),
  'authenticated can update permitted profile fields through RLS'
);
select ok(
  not has_table_privilege('authenticated', 'public.profiles', 'INSERT'),
  'authenticated cannot insert profiles directly'
);
select ok(
  has_table_privilege('authenticated', 'public.projects', 'SELECT, INSERT, UPDATE, DELETE'),
  'authenticated project operations reach RLS policies'
);
select ok(
  has_table_privilege('authenticated', 'public.buildings', 'SELECT, INSERT, UPDATE, DELETE'),
  'authenticated building operations reach RLS policies'
);
select ok(
  has_table_privilege('authenticated', 'public.reports', 'SELECT, INSERT, UPDATE, DELETE'),
  'authenticated report operations reach RLS policies'
);
select ok(
  has_table_privilege('authenticated', 'public.audit_logs', 'SELECT'),
  'authenticated can read permitted audit records'
);
select ok(
  not has_table_privilege('authenticated', 'public.audit_logs', 'INSERT'),
  'authenticated cannot forge audit records'
);
select ok(
  not has_table_privilege('anon', 'public.profiles', 'SELECT'),
  'anonymous users have no profile table privilege'
);
select ok(
  not has_table_privilege('anon', 'public.projects', 'SELECT'),
  'anonymous users have no project table privilege'
);
select ok(
  has_sequence_privilege('authenticated', 'public.document_number_seq', 'USAGE'),
  'authenticated workflows can allocate document numbers'
);

select * from finish();
rollback;
