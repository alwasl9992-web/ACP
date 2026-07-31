-- Prevent users from elevating their own global role or reactivating accounts.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    new.role is distinct from old.role
    or new.is_active is distinct from old.is_active
  ) and public.current_app_role() <> 'system_admin' then
    raise exception 'Only a system administrator may change roles or account status'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_privileges
before update on public.profiles
for each row execute function public.protect_profile_privileges();

-- Supervisors may operate project records, but membership administration is
-- limited to the system administrator and the project's manager.
create or replace function public.can_administer_project_members(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_app_role() = 'system_admin'
    or exists (
      select 1
      from public.project_members pm
      where pm.project_id = target_project_id
        and pm.user_id = auth.uid()
        and pm.role = 'project_manager'
    );
$$;

revoke all on function public.can_administer_project_members(uuid) from public;
grant execute on function public.can_administer_project_members(uuid) to authenticated;

drop policy if exists project_members_write on public.project_members;

create policy project_members_write on public.project_members
for all to authenticated
using (public.can_administer_project_members(project_id))
with check (
  public.can_administer_project_members(project_id)
  and (
    role <> 'system_admin'
    or public.current_app_role() = 'system_admin'
  )
);

-- Safely parse a project UUID from the first private-storage path segment.
create or replace function public.try_uuid(value text)
returns uuid
language plpgsql
immutable
as $$
begin
  return value::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

revoke all on function public.try_uuid(text) from public;
grant execute on function public.try_uuid(text) to authenticated;

drop policy if exists acp_storage_read on storage.objects;
drop policy if exists acp_storage_insert on storage.objects;
drop policy if exists acp_storage_update on storage.objects;
drop policy if exists acp_storage_delete on storage.objects;

create policy acp_storage_read on storage.objects
for select to authenticated
using (
  bucket_id = 'acp-private'
  and public.can_access_project(
    public.try_uuid((storage.foldername(name))[1])
  )
);

create policy acp_storage_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'acp-private'
  and public.can_access_project(
    public.try_uuid((storage.foldername(name))[1])
  )
);

create policy acp_storage_update on storage.objects
for update to authenticated
using (
  bucket_id = 'acp-private'
  and public.can_manage_project(
    public.try_uuid((storage.foldername(name))[1])
  )
)
with check (
  bucket_id = 'acp-private'
  and public.can_manage_project(
    public.try_uuid((storage.foldername(name))[1])
  )
);

create policy acp_storage_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'acp-private'
  and public.can_manage_project(
    public.try_uuid((storage.foldername(name))[1])
  )
);
