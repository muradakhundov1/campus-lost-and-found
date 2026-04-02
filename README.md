## Campus Lost & Found (local full-stack)

This project is a static frontend (`index.html` + JS) plus a local backend (Express + SQLite) so the app can be “legit” (persistent data + real API).

### Prereqs

- Node.js (you have it)

### Install

```bash
npm install
```

### Reset/seed the database

```bash
npm run db:reset
```

### Run backend + frontend together

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:8787` (health: `http://localhost:8787/api/health`)

## Deploy (free demo) — Vercel + Supabase

For a teacher demo + a few students for a day, you can keep this on free tiers.

### 1) Create a Supabase project (free)

- In Supabase, open the **SQL editor** and run the schema in `api/_schema.sql`.
- Copy your **Database connection string** (it becomes `DATABASE_URL`).

### 2) Deploy to Vercel

- Import this repo in Vercel.
- Add an Environment Variable:
  - `DATABASE_URL`: your Supabase Postgres connection string

### 3) Frontend API base

`api.js` automatically uses:
- local dev: `http://localhost:8787`
- deployed: same-origin `/api` on Vercel

