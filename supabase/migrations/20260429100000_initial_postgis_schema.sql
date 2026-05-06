-- Base app schema (PostGIS + profiles + traffic_events + traffic_forecasts + RPC).
-- Omits public.spatial_ref_sys and PostGIS metadata views (owned by postgis extension).
-- IF NOT EXISTS on tables supports projects that ran the old manual SQL bootstrap first.

create extension if not exists postgis with schema extensions;

create table if not exists public.profiles (
  id uuid not null,
  email text not null,
  role text null default 'user'::text,
  created_at timestamp with time zone null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade,
  constraint profiles_role_check check (
    (role = any (array['user'::text, 'admin'::text]))
  )
);

create table if not exists public.traffic_events (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone null default now(),
  type text null,
  description text null,
  status text null default 'pending'::text,
  is_predicted boolean null default false,
  location_lat double precision not null,
  location_lng double precision not null,
  location_point extensions.geography null,
  reported_by uuid null,
  constraint traffic_events_pkey primary key (id),
  constraint traffic_events_reported_by_fkey foreign key (reported_by) references profiles (id) on delete set null,
  constraint traffic_events_status_check check (
    (status = any (array['pending'::text, 'approved'::text]))
  ),
  constraint traffic_events_type_check check (
    (
      type = any (
        array[
          'accident'::text,
          'closure'::text,
          'congestion'::text
        ]
      )
    )
  )
);

create or replace function public.sync_traffic_point()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  new.location_point :=
    st_setsrid(st_makepoint(new.location_lng, new.location_lat), 4326)::extensions.geography;
  return new;
end;
$$;

drop trigger if exists tr_sync_point on public.traffic_events;

create trigger tr_sync_point
before insert or update on public.traffic_events
for each row
execute function public.sync_traffic_point();

create table if not exists public.traffic_forecasts (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  generated_at timestamp with time zone not null,
  horizon_minutes integer not null,
  zone_key text not null,
  center_lat double precision not null,
  center_lng double precision not null,
  forecast_score double precision not null,
  forecast_level text not null,
  confidence double precision not null,
  source text not null default 'incident_rules_v1'::text,
  valid_from timestamp with time zone not null,
  valid_until timestamp with time zone not null,
  constraint traffic_forecasts_pkey primary key (id),
  constraint traffic_forecasts_confidence_check check (
    (confidence >= (0)::double precision)
    and (confidence <= (1)::double precision)
  ),
  constraint traffic_forecasts_forecast_level_check check (
    (forecast_level = any (array['low'::text, 'medium'::text, 'high'::text]))
  ),
  constraint traffic_forecasts_forecast_score_check check (
    (forecast_score >= (0)::double precision)
    and (forecast_score <= (100)::double precision)
  ),
  constraint traffic_forecasts_horizon_minutes_check check (
    (horizon_minutes = any (array[15, 30, 60]))
  )
);

create index if not exists traffic_forecasts_horizon_valid_until_idx
  on public.traffic_forecasts using btree (horizon_minutes, valid_until desc);

create index if not exists traffic_forecasts_zone_horizon_generated_idx
  on public.traffic_forecasts using btree (zone_key, horizon_minutes, generated_at desc);

create unique index if not exists traffic_forecasts_zone_horizon_generated_uniq
  on public.traffic_forecasts using btree (zone_key, horizon_minutes, generated_at);

create or replace function public.get_activities_in_radius(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision
)
returns setof public.traffic_events
language plpgsql
stable
set search_path = public, extensions
as $$
begin
  return query
  select *
  from public.traffic_events
  where st_dwithin(
    location_point,
    st_setsrid(st_makepoint(user_lng, user_lat), 4326)::extensions.geography,
    radius_km * 1000
  )
  and (status = 'approved' or is_predicted = true);
end;
$$;
