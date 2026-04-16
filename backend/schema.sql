PRAGMA foreign_keys = ON;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'staff', 'admin')),
  avatar TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  suspended INTEGER NOT NULL DEFAULT 0,
  joined_date TEXT,
  department TEXT,
  year TEXT,
  post_count INTEGER NOT NULL DEFAULT 0,
  resolved_count INTEGER NOT NULL DEFAULT 0
);

-- Sessions (simple bearer token auth for local dev)
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Items
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('lost', 'found')),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  photo_url TEXT,
  location TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT,
  status TEXT NOT NULL,
  poster_id TEXT NOT NULL,
  poster_name TEXT NOT NULL,
  claim_count INTEGER NOT NULL DEFAULT 0,
  resolved_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (poster_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS item_verification_questions (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  text TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Claims + finder responses live in same table
CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  claimant_id TEXT NOT NULL,
  claimant_name TEXT NOT NULL,
  is_finder_response INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  chat_enabled INTEGER NOT NULL DEFAULT 0,
  review_note TEXT NOT NULL DEFAULT '',
  meeting_point TEXT,
  meeting_time TEXT,
  handover_status TEXT,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (claimant_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS claim_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_id TEXT NOT NULL,
  question_id TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE
);

-- Messages by claim
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  text TEXT NOT NULL,
  time TEXT,
  date TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  time_label TEXT,
  read INTEGER NOT NULL DEFAULT 0,
  screen TEXT,
  claim_id TEXT,
  item_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE SET NULL,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
);

-- Reports + admin log
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('post', 'user')),
  target_id TEXT,
  target_title TEXT,
  reporter_id TEXT,
  reason TEXT NOT NULL,
  detail TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'reviewed')),
  created_at TEXT NOT NULL,
  FOREIGN KEY (reporter_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS admin_log (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  target TEXT,
  note TEXT,
  admin_id TEXT,
  at TEXT NOT NULL,
  FOREIGN KEY (admin_id) REFERENCES users(id)
);

