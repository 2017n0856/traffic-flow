## Traffic Flow

Traffic Flow is a Next.js (App Router) web application for reporting, moderating, and monitoring traffic incidents in real time.  
It uses Supabase for auth + database, Leaflet for map visualization, and includes short‑horizon traffic forecasting based on incident activity (no hardware sensors).

---

## 1. Technologies

- **Frontend**
  - **Next.js 16** (App Router)
  - **React 19**
  - **TypeScript**
  - **Tailwind CSS v4**
  - **Leaflet + React Leaflet** for interactive maps
- **Backend / APIs**
  - **Next.js Route Handlers** under `src/app/api`
  - **Supabase**:
    - Postgres with **PostGIS** extension
    - Supabase Auth and **Row Level Security (RLS)**
    - RPC functions for spatial lookups
- **Tooling**
  - ESLint with TypeScript support
  - Supabase CLI for database migrations
  - Node.js 20+ and npm
- **Forecasting**
  - Custom, rule‑based forecast engine implemented in TypeScript
  - Short‑horizon forecasts at 15, 30, and 60 minutes
  - Incident‑driven (no sensor data)

Example `package.json` (scripts only):

```json
{
  "name": "traffic-flow",
  "scripts": {
    "dev": "next dev",
    "dev:turbo": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "supabase:check": "node scripts/check-supabase-connection.mjs",
    "forecast:run": "node scripts/run-forecast.mjs",
    "forecast:backfill": "npm run forecast:run",
    "forecast:calibrate": "node scripts/calibrate-forecast.mjs"
  }
}
```

---

## 2. Features Overview

- **Incident reporting**
  - Report incidents directly from the map with geolocation support.
  - Validate incident type and coordinates on the server.
- **Admin moderation flow**
  - Incident lifecycle with `pending` → `approved`.
  - Automatic approval heuristic based on nearby confirming reports.
- **Realtime incident updates**
  - RLS + realtime publication for `traffic_events`.
  - Client shows live toasts when incidents are created/updated.
- **Interactive dashboard**
  - Center selection and radius filter.
  - Incident type and report‑time filters.
  - Combined view of incidents and forecasts on the map.
- **Traffic forecasting**
  - Incident‑only forecasting (no physical sensors).
  - Horizons: 15 / 30 / 60 minutes.
  - Forecast zones with score, level, and confidence.
- **Routing / route checks**
  - Check incident density along a driving route.
  - Accepts both free‑text locations and `lat,lng` strings.
- **Mobile responsive**
  - Tailwind responsive utilities for map + side panels.
  - Layouts that adapt between desktop and small screens.

---

## 3. Pages & Navigation

The app uses the Next.js App Router with multiple layout segments.

- **Root**
  - `/` → `src/app/page.tsx`  
    Redirects the user to a sensible home (e.g. dashboard or login) via `HomeRedirect`:

    ```tsx
    import type { Metadata } from "next";
    import { HomeRedirect } from "@/components/auth/HomeRedirect";

    export const metadata: Metadata = {
      title: "Home",
    };

    export default function HomePage() {
      return <HomeRedirect />;
    }
    ```

- **Auth**
  - `/sign-in` → `src/app/(auth)/sign-in/page.tsx`
  - `/sign-up` → `src/app/(auth)/sign-up/page.tsx`

  ```tsx
  import type { Metadata } from "next";
  import { SignInForm } from "@/components/auth/SignInForm";

  export const metadata: Metadata = {
    title: "Sign in",
  };

  export default function SignInPage() {
    return <SignInForm />;
  }
  ```

- **Portal**
  - `/dashboard` → main user dashboard

    ```tsx
    import { UserTrafficDashboard } from "@/features/dashboard/components/UserTrafficDashboard";

    export default function DashboardPage() {
      return <UserTrafficDashboard />;
    }
    ```

  - `/report-incident` → incident reporting page.
  - `/admin` → admin portal home.
  - `/admin/reports` → list of pending/approved incidents.
  - `/admin/users` → user management panel.

- **Legal**
  - `/terms` and similar pages under `src/app/(legal)`.

Auth‑aware wrappers like `RequireAuth` and `GuestOnly` are used at the layout/component level to guard portal pages.

---

## 4. Authentication, Login & Signup

### 4.1 Auth Model

- **Supabase Auth** is the primary source of truth for authenticated users.
- A `profiles` table mirrors `auth.users` so the app can reason about roles (`user` vs `admin`) and email:

```sql
create table if not exists public.profiles (
  id uuid not null,
  email text not null,
  role text null default 'user'::text,
  created_at timestamptz null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade,
  constraint profiles_role_check check (
    (role = any (array['user'::text, 'admin'::text]))
  )
);
```

Profile rows are automatically kept in sync with `auth.users` using a trigger:

```sql
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
```

### 4.2 Frontend Login & Signup

- `SignInForm` and `SignUpForm` handle the UI and call validation helpers from `src/lib/auth/validation.ts`.
- Validation covers:
  - Email format and length.
  - Phone length and digits.
  - Password strength (length, letters + numbers).

```ts
export function validateEmail(value: string): FieldResult {
  const v = value.trim();
  if (!v) return { ok: false, message: "Email is required." };
  if (v.length > 254) return { ok: false, message: "Email is too long." };
  if (!EMAIL_RE.test(v)) return { ok: false, message: "Enter a valid email address." };
  return { ok: true };
}
```

### 4.3 Local Demo Auth

For local/demo use, there is a **local user registry** managed via `localStorage` / `sessionStorage`:

- `src/lib/auth/local-users.ts`:
  - Loads seed users from `src/data/users.json`.
  - Allows registering additional users on the client.
  - Stores the current session in `sessionStorage`.

```ts
export function registerUser(input: {
  email: string;
  phone: string;
  name: string;
  password: string;
}): { ok: true; user: PublicUser } | { ok: false; error: string } {
  // Checks for existing email/phone, then persists to localStorage
}
```

Server‑side APIs still use Supabase `auth.getUser()` to enforce authorization.

---

## 5. Database, Migrations & Seed Data

### 5.1 Core Tables

- **`profiles`**
  - 1:1 with `auth.users`.
  - Fields: `id`, `email`, `role`, `created_at`.

- **`traffic_events`**
  - Stores real and predicted incidents.
  - Important columns:
    - `type`: `accident` | `closure` | `congestion`
    - `status`: `pending` | `approved`
    - `is_predicted`: `boolean`
    - `location_lat`, `location_lng`
    - `location_point`: PostGIS geography, synced via trigger.

```sql
create table if not exists public.traffic_events (
  id uuid not null default gen_random_uuid(),
  created_at timestamptz null default now(),
  type text null,
  description text null,
  status text null default 'pending'::text,
  is_predicted boolean null default false,
  location_lat double precision not null,
  location_lng double precision not null,
  location_point extensions.geography null,
  reported_by uuid null,
  constraint traffic_events_pkey primary key (id),
  constraint traffic_events_status_check check (
    (status = any (array['pending'::text, 'approved'::text]))
  )
);
```

`location_point` is computed by a trigger:

```sql
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
```

- **`traffic_forecasts`**
  - Stores zone‑based forecasts for fixed horizons (15/30/60 minutes).
  - Ensures `forecast_score` is between 0 and 100, `confidence` between 0 and 1, and `forecast_level` is one of `low`, `medium`, `high`.

```sql
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
```

### 5.2 Spatial & RPC Helpers

- `get_activities_in_radius(user_lat, user_lng, radius_km)`  
  Returns incidents within a distance of a point using PostGIS.
- `get_forecasts_in_radius(user_lat, user_lng, radius_km, requested_horizon)`  
  Returns the latest valid forecasts in a radius.
- `get_incidents_on_route(...)` and `get_incidents_on_path(route_geojson, buffer_meters)`  
  Return incidents that lie within a buffer of a line or path geometry.

### 5.3 Migrations

Migrations live under `supabase/migrations` and are intended to be applied using:

```bash
supabase db push
```

Important files:

- `20260429100000_initial_postgis_schema.sql` – PostGIS, `profiles`, `traffic_events`, base `traffic_forecasts`.
- `20260429184000_create_traffic_forecasts.sql` – ensures `traffic_forecasts` table + RLS policy.
- `20260429184500_create_get_forecasts_in_radius.sql` – SQL for `get_forecasts_in_radius`.
- `20260506110000_sync_profiles_from_auth_users.sql` – profile sync triggers.
- `20260506123000_enable_realtime_and_rls_for_traffic_events.sql` – enable RLS, realtime publication.
- `20260506140000_create_get_incidents_on_route.sql` – route‑line function for start/end points.
- `20260506152000_create_get_incidents_on_path.sql` – path‑based function for OSRM GeoJSON.

### 5.4 Seed Data

- `src/data/users.json` holds seed user data (id, email, phone, name, password) that powers local/demo logins.
- Additional seed/maintenance scripts live under `scripts/` (e.g. `seed-users.mjs`).
- Incidents are created through the UI or API; forecasts are always generated programmatically via the forecast job (not pre‑seeded).

---

## 6. Incident Reporting & Approval Flow

### 6.1 User Reporting

Users report incidents via the map‑driven `report-incident` page, which posts to:

- **Endpoint**: `POST /api/incidents/report`  
- **Handler**: `src/app/api/incidents/report/route.ts`

Key steps in the handler:

1. Authenticate with Supabase `auth.getUser()` (must be logged in).
2. Validate payload (`type`, `locationLat`, `locationLng`, optional `description`).
3. Default status to `pending` unless overridden.
4. If `pending`, run auto‑approval heuristic.
5. Insert into `traffic_events` using a service‑role Supabase client.
6. Return the new incident id, final status, and whether it was auto‑approved.

Auto‑approval logic (simplified):

```ts
const AUTO_APPROVAL_RADIUS_METERS = 50;

if (defaultStatus === "pending") {
  const { data: existingIncidents } = await admin
    .from("traffic_events")
    .select("id, status, location_lat, location_lng")
    .eq("type", type)
    .eq("is_predicted", false)
    .in("status", ["pending", "approved"]);

  const nearbyIncidents = ((existingIncidents ?? []) as TrafficEvent[]).filter((incident) => {
    const incidentLocation = { lat: incident.location_lat, lng: incident.location_lng };
    return (
      distanceInMeters(
        { lat: locationLat, lng: locationLng },
        incidentLocation,
      ) <= AUTO_APPROVAL_RADIUS_METERS
    );
  });

  if (nearbyIncidents.length >= 3) {
    resolvedStatus = "approved";
    const pendingNearbyIds = nearbyIncidents
      .filter((incident) => incident.status === "pending")
      .map((incident) => incident.id);

    if (pendingNearbyIds.length > 0) {
      await admin
        .from("traffic_events")
        .update({ status: "approved" })
        .in("id", pendingNearbyIds);
    }
  }
}
```

This means that once three or more matching incidents cluster within 50 meters, new incidents of that type in the same area are auto‑approved, and nearby pending incidents are promoted to `approved` as well.

### 6.2 Admin Moderation

Admins manage incidents via the admin portal:

- `/admin/reports` → `PendingReportsPage` (pending and approved incidents).
- `/admin` → overview components like `AdminControlCenter`.

Admin capabilities typically include:

- Viewing pending incidents.
- Approving or rejecting incidents.
- Seeing meta‑data such as type, description, and reporter profile.

### 6.3 Route‑Based Incident Checks

Users can check a **route** for incidents using:

- **Endpoint**: `POST /api/incidents/route-check`  
- **Handler**: `src/app/api/incidents/route-check/route.ts`

Flow:

1. Parse body: `{ from?: string; to?: string; bufferMeters?: number }`.
2. Resolve `from`/`to`:
   - First attempt to parse `"lat,lng"`.
   - Fall back to geocoding via Nominatim.
3. Request a drivable route from OSRM (`router.project-osrm.org`) with GeoJSON geometry.
4. Call Supabase RPC `get_incidents_on_path(route_geojson, buffer_meters)` to fetch incidents along the route.
5. Return:
   - Parsed `from`/`to` coordinates.
   - Route polyline.
   - List of incidents and `count`.

---

## 7. Forecast Trigger & Logic

### 7.1 Triggering Forecasts

Forecasts are computed via the `/api/forecast/run` endpoint.

- **Manual run** (development/local):

  ```bash
  curl -X POST \
    -H "x-forecast-secret: $FORECAST_RUN_SECRET" \
    http://localhost:3000/api/forecast/run
  ```

- **Scheduled (cron)**:

  ```bash
  curl -X GET \
    -H "Authorization: Bearer $CRON_SECRET" \
    https://your-domain.com/api/forecast/run
  ```

Route handler (excerpt):

```ts
function assertManualRunSecret(request: Request) {
  const expectedSecret = process.env.FORECAST_RUN_SECRET;
  if (!expectedSecret) {
    throw new Error("Missing FORECAST_RUN_SECRET.");
  }
  const suppliedSecret = request.headers.get("x-forecast-secret");
  return suppliedSecret === expectedSecret;
}
```

The shared secret mechanism ensures only trusted callers (CLI scripts, schedulers) can trigger expensive forecast runs.

### 7.2 Forecast Algorithm (High Level)

The core logic lives in `src/lib/forecast/compute.ts` and `src/lib/forecast/repository.ts`.

1. **Fetch recent incidents**
   - Use `fetchApprovedIncidentsForForecast(lookbackHours = 6)` to fetch approved, real incidents from the last N hours.
2. **Bucket into zones**
   - Round `location_lat` and `location_lng` to 2 decimal places to form a `zone_key` (≈1 km grid).
3. **Compute incident contribution**
   - For each incident:
     - Map type to severity weight (`closure` > `accident` > `congestion`).
     - Apply time decay using an exponential half‑life (`FORECAST_HALF_LIFE_MINUTES`).
     - Apply distance attenuation based on distance to the zone center.
4. **Scale by horizon**
   - For each horizon in `{15, 30, 60}`:
     - Multiply total impact by a horizon‑specific factor.
     - Clamp to \[0, 100\].
     - Map to `forecast_level` (`low`/`medium`/`high`) using `FORECAST_LEVEL_THRESHOLDS`.
     - Compute `confidence` using a mix of:
       - Number of incidents in the zone.
       - Average recency of those incidents.
5. **Persist rows**
   - Upsert into `traffic_forecasts` with a unique index on `(zone_key, horizon_minutes, generated_at)`.

Example score calculation:

```ts
const score = clamp(totalImpact * 28 * horizonScale, 0, 100);
const forecast_level = scoreToLevel(score); // low / medium / high
const confidence = computeConfidence(zone.incidents.length, averageRecency);
```

### 7.3 Consuming Forecasts

Client code fetches forecasts near a point using:

- **Endpoint**: `GET /api/forecast/nearby`
- **Query params**:
  - `lat`, `lng` – required.
  - `radiusKm` – default 5, max 50.
  - `horizonMinutes` – one of 15, 30, 60.

The handler calls Supabase RPC `get_forecasts_in_radius`:

```ts
const { data, error } = await admin.rpc("get_forecasts_in_radius", {
  user_lat: lat,
  user_lng: lng,
  radius_km: radiusKm,
  requested_horizon: horizonMinutes,
});
```

The frontend then overlays these forecasts on the map as zones with intensity and confidence.

---

## 8. Mobile Responsiveness

The UI is built with Tailwind CSS v4 and designed to work on mobile:

- **Layouts**
  - Desktop: map and filters side‑by‑side.
  - Mobile: panels stack vertically; map takes the majority of the height, filters collapse where needed.
- **Components**
  - Buttons and form inputs have touch‑friendly hit areas.
  - Scrollable containers for lists (e.g. pending reports).
  - Modals and side‑panels avoid overflowing small screens.

Most components use Tailwind breakpoints (`sm:`, `md:`, `lg:`) to adjust typography, padding, and layout based on viewport size.

---

## 9. Environment & Running the App

### 9.1 Prerequisites

- Node.js **20+** (recommended).
- npm.
- Supabase project:
  - `SUPABASE_URL`
  - anon/publishable key
  - service role key
- Supabase CLI for migrations.

### 9.2 Environment Variables

Create a `.env` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
FORECAST_RUN_SECRET=...
CRON_SECRET=...
# Optional (defaults to http://localhost:3000)
FORECAST_BASE_URL=http://127.0.0.1:3000
```

Notes:

- **`FORECAST_RUN_SECRET`**: strong random string for manual forecast runs.
- **`CRON_SECRET`**: strong random string used by your scheduler via `Authorization: Bearer`.
- **`FORECAST_BASE_URL`**: override base URL when calling forecast scripts against remote deployments.

### 9.3 Setup & Run

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   - Add `.env` as above.

3. **Link Supabase project**

   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   ```

4. **Apply database migrations**

   ```bash
   supabase db push
   ```

5. **Start the app**

   ```bash
   npm run dev
   ```

6. **Generate forecast data**

   In another terminal (with the app running):

   ```bash
   npm run forecast:run
   ```

7. **Open the app**

   - Dashboard: `http://localhost:3000/dashboard`

### 9.4 Available Scripts

- `npm run dev` — start development server.
- `npm run dev:turbo` — dev server with Turbopack.
- `npm run build` — build production bundle.
- `npm run start` — run production server.
- `npm run lint` — run ESLint.
- `npm run supabase:check` — verify Supabase connectivity.
- `npm run forecast:run` — trigger forecast computation endpoint.
- `npm run forecast:backfill` — alias to `forecast:run`.
- `npm run forecast:calibrate` — run forecast scoring calibration scenarios.

---

## 10. Troubleshooting

- **`ECONNREFUSED ::1:3000` while running `forecast:run`**
  - Start the app first with `npm run dev`.
  - Or set `FORECAST_BASE_URL=http://127.0.0.1:3000`.
- **Forecast shows 0 zones**
  - Ensure incidents are approved (pending incidents are not used).
  - Run `npm run forecast:run` after adding incidents.
  - Confirm Supabase migrations applied successfully.
- **Unauthorized when calling `/api/forecast/run`**
  - Check `FORECAST_RUN_SECRET` / `CRON_SECRET` in both environment and request headers.
- **No realtime updates**
  - Ensure RLS and publication on `traffic_events` are correct.
  - Confirm you are authenticated as an `authenticated` Supabase user.
