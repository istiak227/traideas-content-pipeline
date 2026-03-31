CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  email TEXT DEFAULT '',
  is_content_writer INTEGER DEFAULT 1,
  is_operator_eligible INTEGER DEFAULT 1,
  telegram_chat_id TEXT DEFAULT '',
  telegram_user_id TEXT DEFAULT '',
  telegram_username TEXT DEFAULT '',
  telegram_connected_at TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS weekly_operators (
  week_key TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES team_members(id)
);

CREATE TABLE IF NOT EXISTS contents (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  week_key TEXT NOT NULL,
  title TEXT DEFAULT '',
  type TEXT DEFAULT '',
  mediums TEXT DEFAULT '[]',
  status TEXT DEFAULT 'pending_title',
  link_post TEXT DEFAULT '',
  link_doc TEXT DEFAULT '',
  link_file TEXT DEFAULT '',
  publish_date TEXT DEFAULT '',
  carried INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (member_id) REFERENCES team_members(id)
);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (content_id) REFERENCES contents(id)
);

CREATE TABLE IF NOT EXISTS browser_pins (
  browser_key TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES team_members(id)
);

CREATE TABLE IF NOT EXISTS telegram_link_tokens (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (member_id) REFERENCES team_members(id)
);

CREATE TABLE IF NOT EXISTS notification_logs (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT DEFAULT '',
  error_text TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (member_id) REFERENCES team_members(id)
);
