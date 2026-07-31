alter table public.incidents
  add column if not exists category text,
  add column if not exists assignee_text text;

create index if not exists incidents_project_status_created_idx
  on public.incidents(project_id, status, created_at desc);
