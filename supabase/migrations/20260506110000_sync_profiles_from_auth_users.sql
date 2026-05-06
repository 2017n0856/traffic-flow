-- Keep public.profiles synchronized with auth.users so admin role workflows work.

create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, created_at)
  values (new.id, new.email, 'user', now())
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_sync_profile on auth.users;
create trigger on_auth_user_created_sync_profile
after insert on auth.users
for each row
execute function public.sync_profile_from_auth_user();

drop trigger if exists on_auth_user_updated_sync_profile on auth.users;
create trigger on_auth_user_updated_sync_profile
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function public.sync_profile_from_auth_user();

-- Backfill any existing auth users that don't yet have a profile row.
insert into public.profiles (id, email, role, created_at)
select au.id, au.email, 'user', now()
from auth.users au
left join public.profiles p on p.id = au.id
where p.id is null
on conflict (id) do nothing;
