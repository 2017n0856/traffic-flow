# Traffic Flow

Traffic Flow is a Next.js (App Router) web application for reporting, moderating, and monitoring traffic incidents in real time.  
It uses Supabase for auth + database, Leaflet for map visualization, and includes short-horizon traffic forecasting based on incident activity.

## Features

- Incident reporting from map with geolocation support
- Admin moderation flow (pending/approved incident lifecycle)
- Realtime incident updates and user toasts
- Interactive dashboard with:
  - center selection
  - radius filter
  - incident type filter
  - report-time filter
- Traffic trend forecasting (no sensors) for:
  - next 15 minutes
  - next 30 minutes
  - next 60 minutes
- Forecast overlay on map with score + confidence

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- Leaflet + React Leaflet

## Prerequisites

- Node.js 20+ (recommended)
- npm
- Supabase project (URL, anon/publishable key, service role key)
- Supabase CLI (for DB migrations)

## Environment Variables

Create a `.env` file in project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
FORECAST_RUN_SECRET=...
# Optional (defaults to http://localhost:3000)
FORECAST_BASE_URL=http://127.0.0.1:3000
```

Notes:
- `FORECAST_RUN_SECRET` should be a strong random string.
- `FORECAST_BASE_URL` is useful when running forecast scripts against non-local environments.

## Setup and Run (in order)

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Add `.env` as shown above.

### 3) Link Supabase project (one-time)

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

### 4) Apply database migrations

```bash
supabase db push
```

This applies schema changes including forecast tables/functions from `supabase/migrations`.

### 5) Start app

```bash
npm run dev
```

### 6) Generate forecast data

In another terminal (with app still running):

```bash
npm run forecast:run
```

### 7) Open the app

- Dashboard: `http://localhost:3000/dashboard`

## Available Scripts

- `npm run dev` — start development server
- `npm run dev:turbo` — start development server with Turbopack
- `npm run build` — build production bundle
- `npm run start` — run production server
- `npm run lint` — run ESLint
- `npm run supabase:check` — verify Supabase connectivity
- `npm run forecast:run` — trigger forecast computation endpoint
- `npm run forecast:backfill` — alias to forecast run command
- `npm run forecast:calibrate` — run forecast scoring calibration scenarios

## Forecasting Notes

- Forecasts are incident-based (no physical sensors).
- Current severity weights:
  - `closure`: high impact
  - `accident`: medium impact
  - `congestion`: low impact
- Only approved incidents are used as forecast input.

## Troubleshooting

- `ECONNREFUSED ::1:3000` while running `forecast:run`:
  - start app first with `npm run dev`
  - or set `FORECAST_BASE_URL=http://127.0.0.1:3000`
- Forecast shows 0 zones:
  - ensure incidents are approved
  - run `npm run forecast:run` after adding incidents
  - confirm migrations were applied successfully
