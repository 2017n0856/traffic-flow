create or replace function public.get_incidents_on_path(
  route_geojson jsonb,
  buffer_meters double precision default 20
)
returns setof public.traffic_events
language sql
stable
set search_path = public, extensions
as $$
  with route_line as (
    select st_setsrid(
      st_geomfromgeojson(route_geojson::text),
      4326
    )::extensions.geography as geom
  )
  select te.*
  from public.traffic_events te
  cross join route_line rl
  where (te.status = 'approved' or te.is_predicted = true)
    and st_dwithin(te.location_point, rl.geom, greatest(buffer_meters, 1));
$$;
