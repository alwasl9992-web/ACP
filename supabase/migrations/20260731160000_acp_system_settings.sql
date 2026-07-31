create table public.system_settings (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null default 'ACP Enterprise',
  timezone text not null default 'Asia/Riyadh',
  language text not null default 'ar' check (language in ('ar', 'en')),
  report_prefix text not null default 'ACP',
  auto_backup boolean not null default true,
  notifications boolean not null default true,
  audit_log boolean not null default true,
  offline_mode boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index system_settings_singleton_idx
  on public.system_settings ((true));

create trigger system_settings_set_updated_at before update on public.system_settings
for each row execute function public.set_updated_at();

create trigger system_settings_audit after insert or update or delete on public.system_settings
for each row execute function public.audit_row_change();

alter table public.system_settings enable row level security;

create policy system_settings_read on public.system_settings
for select to authenticated using (true);

create policy system_settings_admin_insert on public.system_settings
for insert to authenticated
with check (public.current_app_role() = 'system_admin');

create policy system_settings_admin_update on public.system_settings
for update to authenticated
using (public.current_app_role() = 'system_admin')
with check (public.current_app_role() = 'system_admin');

insert into public.system_settings (
  organization_name,
  timezone,
  language,
  report_prefix,
  auto_backup,
  notifications,
  audit_log,
  offline_mode
) values (
  'ACP Enterprise',
  'Asia/Riyadh',
  'ar',
  'ACP',
  true,
  true,
  true,
  true
)
on conflict do nothing;
