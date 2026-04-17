## Campus Lost & Found

A simple **campus lost & found web app** where students/staff can post lost or found items, search/filter listings, and safely resolve returns through a claim + verification flow.

### Product features

- **Post lost/found items**: title, description, category, location, date/time, optional photo link.
- **Browse + search**: filter by type/category/location/status and full-text search.
- **Claims workflow**: request an item by answering verification questions, then get approved/rejected by the poster/admin.
- **Chat after approval**: once approved, a claim chat opens to coordinate handover.
- **Handover tracking**: schedule a meeting point/time and mark a claim as completed.
- **Admin tools (basic)**: reports, admin actions log, and simple dashboard stats.

### Tech overview (how it’s built)

- **Frontend**: static files served from the repo root (via `http-server` in local dev).
- **Local API**: Express + SQLite (`backend/dev.sqlite3`) for fast local development.
- **Deployed API (Vercel)**: Serverless `/api/*` routes backed by **Postgres** via `DATABASE_URL` (recommended: Supabase).

## Run locally (recommended for development)

### Prerequisites

- Node.js 18+ (any recent Node should work)

### Install

```bash
npm install
```

### Reset / seed the local database (SQLite)

This recreates `backend/dev.sqlite3` using `backend/schema.sql`.

```bash
npm run db:reset
```

### Start the app (frontend + API)

```bash
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **API**: `http://localhost:8787` (health: `http://localhost:8787/api/health`)

## Deploy on Vercel (Postgres-backed)

### One-click deploy link

Use this button to create a new Vercel project from this repo:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmuradakhundov1%2Fcampus-lost-and-found.git)

### Step-by-step (Vercel + Supabase)

- **1) Create a Supabase project**
  - In Supabase → **SQL Editor**, run the schema in `api/_schema.sql`.
  - Copy the **Postgres connection string** for your project.

- **2) Configure Vercel environment variables**
  - In Vercel → Project → Settings → Environment Variables, set:
    - **`DATABASE_URL`**: your Supabase Postgres connection string

- **3) Deploy**
  - Import the repo (or use the deploy button) and deploy.
  - Your deployed frontend will call the API via **same-origin** `/api/*`.

### Optional (image uploads via Supabase Storage)

The app can upload item photos to Supabase Storage if you set these variables (locally or on Vercel):

- **`SUPABASE_URL`**
- **`SUPABASE_STORAGE_BUCKET`** (default: `item-photos`)
- **`SUPABASE_SERVICE_ROLE_KEY`** (required for the upload endpoint)
- **`SUPABASE_ANON_KEY`** (used by the frontend config endpoint)

If you don’t set these, the app still works; photo upload will just be unavailable.

## API base URL behavior

The frontend is set up to use:

- **Local dev**: `http://localhost:8787`
- **Vercel deploy**: same-origin `/api`


