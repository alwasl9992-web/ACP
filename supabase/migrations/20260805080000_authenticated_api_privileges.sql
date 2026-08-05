-- PostgREST requires table-level privileges before row-level security policies
-- can evaluate an authenticated request. Keep anonymous access closed and grant
-- authenticated users only the operations exposed by ACP policies.

grant usage on schema public to authenticated;

revoke all on table public.profiles from anon;
revoke all on table public.projects from anon;
revoke all on table public.project_members from anon;
revoke all on table public.buildings from anon;
revoke all on table public.assets from anon;
revoke all on table public.gates from anon;
revoke all on table public.gate_daily_logs from anon;
revoke all on table public.employees from anon;
revoke all on table public.employee_assignments from anon;
revoke all on table public.attendance_events from anon;
revoke all on table public.employee_warnings from anon;
revoke all on table public.warehouses from anon;
revoke all on table public.warehouse_items from anon;
revoke all on table public.stock_movements from anon;
revoke all on table public.incidents from anon;
revoke all on table public.reports from anon;
revoke all on table public.attachments from anon;
revoke all on table public.sync_mutations from anon;
revoke all on table public.audit_logs from anon;
revoke all on table public.system_settings from anon;

grant select, update on table public.profiles to authenticated;
revoke insert, delete on table public.profiles from authenticated;

grant select, insert, update, delete on table
  public.projects,
  public.project_members,
  public.buildings,
  public.assets,
  public.gates,
  public.gate_daily_logs,
  public.employees,
  public.employee_assignments,
  public.attendance_events,
  public.employee_warnings,
  public.warehouses,
  public.warehouse_items,
  public.stock_movements,
  public.incidents,
  public.reports,
  public.attachments,
  public.sync_mutations
  to authenticated;

grant select, insert, update on table public.system_settings to authenticated;
revoke delete on table public.system_settings from authenticated;

grant select on table public.audit_logs to authenticated;
revoke insert, update, delete on table public.audit_logs from authenticated;

grant usage, select on sequence public.document_number_seq to authenticated;

revoke all on function public.current_app_role() from anon;
revoke all on function public.can_access_project(uuid) from anon;
revoke all on function public.can_manage_project(uuid) from anon;
revoke all on function public.can_administer_project_members(uuid) from anon;
revoke all on function public.next_document_number(text) from anon;

grant execute on function public.current_app_role() to authenticated;
grant execute on function public.can_access_project(uuid) to authenticated;
grant execute on function public.can_manage_project(uuid) to authenticated;
grant execute on function public.can_administer_project_members(uuid) to authenticated;
grant execute on function public.next_document_number(text) to authenticated;
