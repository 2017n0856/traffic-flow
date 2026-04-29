create or replace function public.get_forecasts_in_radius(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision,
  requested_horizon int
)
returns setof public.traffic_forecasts
language sql
stable
as $$
  with latest as (
    select distinct on (tf.zone_key, tf.horizon_minutes)
      tf.*
    from public.traffic_forecasts tf
    where tf.horizon_minutes = requested_horizon
      and tf.valid_until >= now()
    order by tf.zone_key, tf.horizon_minutes, tf.generated_at desc
  )
  select l.*
  from latest l
  where (
    6371 * acos(
      cos(radians(user_lat)) * cos(radians(l.center_lat)) *
      cos(radians(l.center_lng) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(l.center_lat))
    )
  ) <= radius_km;
$$;
