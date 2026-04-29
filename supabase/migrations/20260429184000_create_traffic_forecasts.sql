create table if not exists public.traffic_forecasts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  generated_at timestamptz not null,
  horizon_minutes int not null check (horizon_minutes in (15, 30, 60)),
  zone_key text not null,
  center_lat double precision not null,
  center_lng double precision not null,
  forecast_score double precision not null check (forecast_score >= 0 and forecast_score <= 100),
  forecast_level text not null check (forecast_level in ('low', 'medium', 'high')),
  confidence double precision not null check (confidence >= 0 and confidence <= 1),
  source text not null default 'incident_rules_v1',
  valid_from timestamptz not null,
  valid_until timestamptz not null
);

create unique index if not exists traffic_forecasts_zone_horizon_generated_uniq
  on public.traffic_forecasts (zone_key, horizon_minutes, generated_at);

create index if not exists traffic_forecasts_horizon_valid_until_idx
  on public.traffic_forecasts (horizon_minutes, valid_until desc);

create index if not exists traffic_forecasts_zone_horizon_generated_idx
  on public.traffic_forecasts (zone_key, horizon_minutes, generated_at desc);

alter table public.traffic_forecasts enable row level security;

drop policy if exists "traffic_forecasts_read_authenticated" on public.traffic_forecasts;
create policy "traffic_forecasts_read_authenticated"
  on public.traffic_forecasts
  for select
  to authenticated
  using (true);
