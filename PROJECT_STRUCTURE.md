# Booking CMS — project overview

**Package name:** `cms-booking` (private)

This repository is a **Next.js 14** admin / content-management style web app for **bookings, travel experiences, finances, and operations**. The UI is built with **React 18**, **TypeScript**, **Tailwind CSS v4**, and **Redux Toolkit** for global state (currently centered on authentication). Data shown in many areas is backed by **mock data** and feature modules under `src/features`, with HTTP helpers (`axios`) and service modules prepared for real APIs.

## Tech stack (high level)

| Area | Choice |
|------|--------|
| Framework | Next.js 14 (App Router under `src/app`) |
| UI | React 18, Tailwind CSS 4, assorted chart libraries (Chart.js, Highcharts, Recharts) |
| Forms | React Hook Form, Yup, `@hookform/resolvers` |
| State | Redux Toolkit (`src/store`) |
| HTTP | Axios (`src/services`) |
| Drag and drop | `@dnd-kit/*` |

## NPM scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run dev:turbo` | Dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint (Next.js config) |

## Repository layout (root)

```
booking-cms/
├── public/              # Static assets served as-is (images, fonts, `.well-known`, etc.)
├── scripts/             # Maintenance scripts (e.g. route migration helpers)
├── src/                 # Application source (see below)
├── eslint.config.mjs
├── next.config.mjs      # Next config (e.g. remote image hostnames)
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json        # TypeScript + path aliases (`@/*`, `@features/*`, …)
└── README.md            # Default Next.js starter notes
```

## `src/` layout

```
src/
├── app/                 # Next.js App Router: layouts, pages, route segments
├── assets/              # Icons, images, shared asset barrels
├── components/          # Shared UI (common widgets + layout shells)
├── constants/           # Static config, labels, table column helpers, etc.
├── data/                # Mock datasets and static data modules
├── features/            # Domain-oriented modules (largest area of product code)
├── hooks/               # Reusable React hooks
├── mockups/             # Mockup / prototype style data or UI helpers
├── schemas/             # Validation schemas (often used with forms)
├── services/            # API / auth service layer (axios, etc.)
├── store/               # Redux store and slices
├── types/               # Shared TypeScript types
├── utils/               # Formatters, money helpers, misc utilities
├── index.css            # Additional global styles (alongside `app/globals.css`)
└── app/globals.css      # Global styles imported by root / portal layouts
```

### `src/app/` — routing

The app uses **route groups** (folders in parentheses do not appear in the URL):

| Group | Role |
|-------|------|
| `(auth)` | Sign-in, OTP verification, and related auth flows |
| `(portal)` | Main authenticated dashboard: sidebar + header layout |
| `(legal)` | Legal-related layout segment (structure for terms / policies as needed) |

**Portal** routes cover product areas such as:

- **Finance:** `finance/`, including booking ledger and weekly payout flows  
- **Management:** properties, bookings, users, vendors, promotions, refunds  
- **Content / catalog:** tour activities, transport guides, travel experiences  
- **Operations:** notifications, loyalty program, settings (profile, password)  
- **Underscore-prefixed segments** (e.g. `_manage`, `_team-management`, `_tour-activities`): parallel or transitional route trees; compare with the non-prefixed URLs in the same feature area when linking or refactoring  

The **home / entry** route is `src/app/page.tsx`.

### `src/features/` — domain modules

Feature code is grouped by product domain. Typical folders contain **components**, **types**, and sometimes **page-level** compositions consumed by `src/app/*/page.tsx`.

| Folder | Typical focus |
|--------|----------------|
| `auth` | Registration, business setup, auth UI and context |
| `bookings` | Booking tables, calendars, booking UI |
| `cms-app` | Large set of **page implementations** under `pages/` (Dashboard, Finance, Management, Settings, etc.) wired into App Router |
| `cms-legacy` | Older or shared CMS building blocks (modals, tables, cards, filters) still used across the app |
| `dashboard` | Dashboard widgets and summaries |
| `finances` | Payouts, payment summaries, finance visuals |
| `listings` | Property / homestay listing flows and steps |
| `management` | Admin-style management UIs |
| `messages`, `notifications` | Messaging / notification experiences |
| `promotions` | Promotions and applied-promotion tables |
| `reviews` | Review-related UI |
| `settings` | Account / profile settings |
| `team-management` | Roles and team administration |

### `src/components/`

Shared, reusable UI:

- **`common/`** — Buttons, inputs, tables, modals, charts, filters, etc.  
- **`layout/`** — `AuthLayout`, dashboard `Sidebar` / `Header` / `Wrapper`, and related layout pieces  

### Other notable `src/` folders

- **`constants/`** — Shared constants and JSX fragments used in tables or finance views  
- **`services/`** — Auth and API-facing modules  
- **`store/`** — Redux `configureStore`, `slices/` (e.g. auth)  
- **`types/`** — Cross-cutting TypeScript models (bookings, finance, roles, etc.)  
- **`utils/`** — Formatting, money, phone helpers, column helpers for tables  

## Path aliases (from `tsconfig.json`)

Imports often use aliases instead of deep relative paths, for example:

- `@/*` → `src/*`  
- `@components/*`, `@layouts/*`, `@features/*`, `@hooks/*`, `@utils/*`, `@constants/*`  
- `@store/*`, `@services/*`, `@data/*`, `@mockups/*`  
- `@pages/*` → `src/features/cms-app/pages/*`  

## Configuration files

- **`next.config.mjs`** — Image `remotePatterns` for external hosts (e.g. Unsplash, UI Avatars)  
- **`tailwind.config.ts`** / **`postcss.config.mjs`** — Tailwind v4 + PostCSS pipeline  
- **`eslint.config.mjs`** — Lint rules for the codebase  

---

*This document describes the layout as of the date it was added; route names may evolve as features are merged or migrated.*
