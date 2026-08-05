begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

select has_function('public', 'assign_report_number', array[]::text[], 'report numbering trigger function exists');
select ok(
  exists (
    select 1 from pg_trigger
    where tgrelid = 'public.reports'::regclass
      and tgname = 'reports_assign_number'
      and not tgisinternal
  ),
  'reports use a before-insert numbering trigger'
);
select function_returns('public', 'assign_report_number', array[]::text[], 'trigger', 'numbering function returns trigger');
select ok(
  pg_get_functiondef('public.assign_report_number()'::regprocedure) like '%next_document_number(''RPT'')%',
  'report number comes from the atomic database sequence'
);
select ok(
  pg_get_functiondef('public.assign_report_number()'::regprocedure) like '%/reports/verify/%',
  'QR verification payload follows the generated report number'
);
select ok(
  not has_function_privilege('anon', 'public.assign_report_number()', 'EXECUTE'),
  'anonymous users cannot execute the internal numbering trigger function'
);

select * from finish();
rollback;
