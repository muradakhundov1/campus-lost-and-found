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


## Vercel 

Use this link to enter the Vercel deployment:

https://campus-lost-and-found-narmins-projects-7a0748c4.vercel.app


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

