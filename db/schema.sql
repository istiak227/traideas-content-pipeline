CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  is_content_writer INTEGER DEFAULT 1,
  is_operator_eligible INTEGER DEFAULT 1,
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
