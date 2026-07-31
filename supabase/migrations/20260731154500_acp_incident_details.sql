alter table public.incidents
  add column if not exists category text,
  add column if not exists location_label text,
  add column if not exists asset_label text,
  add column if not exists assignee_label text;

create index if not exists incidents_category_idx
  on public.incidents(project_id, category);
