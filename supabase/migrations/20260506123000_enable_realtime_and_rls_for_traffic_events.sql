-- Restore live subscriptions for traffic events after schema rebuilds/migrations.
-- This keeps API writes via service role intact while allowing authenticated users
-- to read approved/predicted incidents and receive realtime updates.

alter table public.traffic_events enable row level security;

drop policy if exists "traffic_events_select_authenticated" on public.traffic_events;
create policy "traffic_events_select_authenticated"
  on public.traffic_events
  for select
  to authenticated
  using (status = 'approved' or is_predicted = true);

-- Needed so UPDATE realtime payload includes previous row values (e.g. old status).
alter table public.traffic_events replica identity full;

-- Ensure table is part of Supabase realtime publication.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'traffic_events'
  ) then
    execute 'alter publication supabase_realtime add table public.traffic_events';
  end if;
end
$$;
