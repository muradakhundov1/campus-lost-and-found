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

-- Lost/found listings (persist across deploys; run in Supabase SQL after users/sessions exist)
create table if not exists items (
  id text primary key,
  type text not null check (type in ('lost', 'found')),
  title text not null,
  category text not null,
  description text not null,
  location text not null,
  date text not null,
  time text default '',
  status text not null default 'Active',
  poster_id text not null references users(id) on delete cascade,
  poster_name text not null,
  claim_count int not null default 0,
  resolved_at text,
  verification_questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists items_poster_id_idx on items (poster_id);
create index if not exists items_created_at_idx on items (created_at desc);

-- Claims & answers
create table if not exists claims (
  id text primary key,
  item_id text not null references items(id) on delete cascade,
  claimant_id text not null references users(id) on delete cascade,
  claimant_name text not null,
  is_finder_response boolean not null default false,
  status text not null,
  submitted_at timestamptz not null default now(),
  chat_enabled boolean not null default false,
  review_note text not null default '',
  meeting_point text,
  meeting_time text,
  handover_status text
);

create index if not exists claims_item_id_idx on claims (item_id);
create index if not exists claims_claimant_id_idx on claims (claimant_id);

create table if not exists claim_answers (
  id serial primary key,
  claim_id text not null references claims(id) on delete cascade,
  question_id text,
  question text not null,
  answer text not null
);

create index if not exists claim_answers_claim_id_idx on claim_answers (claim_id);

-- Chat messages per claim
create table if not exists messages (
  id text primary key,
  claim_id text not null references claims(id) on delete cascade,
  sender_id text not null,
  text text not null,
  time text,
  date text,
  created_at timestamptz not null default now()
);

create index if not exists messages_claim_id_idx on messages (claim_id);

-- Per-user notifications
create table if not exists notifications (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  type text not null,
  title text not null,
  description text not null,
  time_label text,
  read boolean not null default false,
  screen text,
  claim_id text,
  item_id text,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on notifications (user_id);

-- Reports & admin audit
create table if not exists reports (
  id text primary key,
  type text not null check (type in ('post', 'user')),
  target_id text,
  target_title text,
  reporter_id text references users(id) on delete set null,
  reason text not null,
  detail text,
  severity text not null check (severity in ('low', 'medium', 'high')),
  status text not null check (status in ('pending', 'reviewed')),
  created_at timestamptz not null default now()
);

create table if not exists admin_log (
  id text primary key,
  action text not null,
  target text,
  note text,
  admin_id text references users(id) on delete set null,
  at timestamptz not null default now()
);

