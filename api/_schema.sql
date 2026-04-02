-- Postgres schema for Vercel deployment (run this in Supabase SQL editor)

create table if not exists users (
  id text primary key,
  name text not null,
  email text unique,
  phone text unique,
  password_hash text,
  role text not null check (role in ('student','staff','admin')),
  avatar text,
  verified boolean not null default true,
  suspended boolean not null default false,
  joined_date date,
  department text,
  year text,
  post_count int not null default 0,
  resolved_count int not null default 0
);

create table if not exists sessions (
  token text primary key,
  user_id text not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

