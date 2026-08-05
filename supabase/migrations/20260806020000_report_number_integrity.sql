-- Report numbers must be generated atomically by PostgreSQL, not derived from
-- a client-side row count. This prevents collisions across users, devices,
-- offline synchronization and deleted records.
create or replace function public.assign_report_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.report_no := public.next_document_number('RPT');
  new.qr_payload := '/reports/verify/' || new.report_no;
  return new;
end;
$$;

revoke all on function public.assign_report_number() from public;

create trigger reports_assign_number
before insert on public.reports
for each row execute function public.assign_report_number();
