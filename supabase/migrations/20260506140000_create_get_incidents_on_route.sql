create or replace function public.get_incidents_on_route(
  from_lat double precision,
  from_lng double precision,
  to_lat double precision,
  to_lng double precision,
  buffer_meters double precision default 20
)
returns setof public.traffic_events
language sql
stable
set search_path = public, extensions
as $$
  with route_line as (
    select st_makeline(
      st_setsrid(st_makepoint(from_lng, from_lat), 4326),
      st_setsrid(st_makepoint(to_lng, to_lat), 4326)
    )::extensions.geography as geom
  )
  select te.*
  from public.traffic_events te
  cross join route_line rl
  where (te.status = 'approved' or te.is_predicted = true)
    and st_dwithin(te.location_point, rl.geom, greatest(buffer_meters, 1));
$$;
