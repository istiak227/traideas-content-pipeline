import Database from "better-sqlite3";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";

import { addWeeks } from "./weeks";
import {
  CARRIED_STATUSES,
  type ContentItem,
  type ContentStatus,
  type ContentTypeKey,
  type FeedbackNote,
  type AppSession,
  type AppSessionRole,
  type AuthSession,
  type MemberLoginCode,
  type NotificationLog,
  type TeamMember,
  type TelegramLinkToken,
} from "./types";

const schemaSql = `
CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  username TEXT DEFAULT '',
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

CREATE TABLE IF NOT EXISTS member_login_codes (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (member_id) REFERENCES team_members(id)
);

CREATE TABLE IF NOT EXISTS app_sessions (
  id TEXT PRIMARY KEY,
  session_token TEXT NOT NULL UNIQUE,
  member_id TEXT DEFAULT '',
  role TEXT NOT NULL,
  expires_at TEXT NOT NULL,
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
`;

type RawContentRow = Omit<ContentItem, "mediums" | "feedback"> & {
  mediums: string;
  carried_from_week_key?: string;
};

declare global {
  var __traideasDb: Database.Database | undefined;
}

function getDatabasePath() {
  return path.join(process.cwd(), "pipeline.db");
}

function deriveInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "NA";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

function parseMediums(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function mapContentRow(row: RawContentRow): ContentItem {
  return {
    ...row,
    mediums: parseMediums(row.mediums),
    feedback: [],
  };
}

function ensureColumn(
  db: Database.Database,
  tableName: string,
  columnName: string,
  definition: string,
) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{
    name: string;
  }>;

  if (!columns.some((column) => column.name === columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function initDatabase(db: Database.Database) {
  db.pragma("journal_mode = WAL");
  db.exec(schemaSql);
  ensureColumn(db, "team_members", "email", "TEXT DEFAULT ''");
  ensureColumn(db, "team_members", "username", "TEXT DEFAULT ''");
  ensureColumn(db, "team_members", "is_content_writer", "INTEGER DEFAULT 1");
  ensureColumn(db, "team_members", "is_operator_eligible", "INTEGER DEFAULT 1");
  ensureColumn(db, "team_members", "telegram_chat_id", "TEXT DEFAULT ''");
  ensureColumn(db, "team_members", "telegram_user_id", "TEXT DEFAULT ''");
  ensureColumn(db, "team_members", "telegram_username", "TEXT DEFAULT ''");
  ensureColumn(db, "team_members", "telegram_connected_at", "TEXT DEFAULT ''");

  const membersWithoutUsername = db
    .prepare("SELECT id, name FROM team_members WHERE COALESCE(username, '') = ''")
    .all() as Array<{ id: string; name: string }>;

  for (const member of membersWithoutUsername) {
    db.prepare("UPDATE team_members SET username = ? WHERE id = ?").run(
      generateUniqueUsername(member.name, member.id, db),
      member.id,
    );
  }

  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_username ON team_members(username)");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_app_sessions_token ON app_sessions(session_token)");
}

export function getDb() {
  if (!global.__traideasDb) {
    global.__traideasDb = new Database(getDatabasePath());
    initDatabase(global.__traideasDb);
  }

  return global.__traideasDb;
}

function listMembersWhere(whereClause = "1 = 1", params: unknown[] = []) {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, name, initials, username, email, is_content_writer, is_operator_eligible,
              telegram_chat_id, telegram_user_id, telegram_username, telegram_connected_at, created_at
       FROM team_members
       WHERE ${whereClause}
       ORDER BY created_at ASC, name ASC`,
    )
    .all(...params) as TeamMember[];
}

export function listMembers() {
  return listMembersWhere();
}

function listContentWriters() {
  return listMembersWhere("is_content_writer = 1");
}

export function listOperatorPoolMembers() {
  return listMembersWhere("is_operator_eligible = 1");
}

export function getMemberById(memberId: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, name, initials, username, email, is_content_writer, is_operator_eligible,
              telegram_chat_id, telegram_user_id, telegram_username, telegram_connected_at, created_at
       FROM team_members
       WHERE id = ?`,
    )
    .get(memberId) as TeamMember | undefined;
}

export function getMemberByUsername(username: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, name, initials, username, email, is_content_writer, is_operator_eligible,
              telegram_chat_id, telegram_user_id, telegram_username, telegram_connected_at, created_at
       FROM team_members
       WHERE username = ?`,
    )
    .get(normalizeUsername(username)) as TeamMember | undefined;
}

function normalizeUsername(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildUsernameBase(name: string) {
  const normalized = normalizeUsername(name);
  return normalized || "member";
}

function generateUniqueUsername(name: string, excludeMemberId?: string, database = getDb()) {
  const base = buildUsernameBase(name);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = database
      .prepare("SELECT id FROM team_members WHERE username = ?")
      .get(candidate) as { id: string } | undefined;

    if (!existing || existing.id === excludeMemberId) {
      return candidate;
    }

    candidate = `${base}${suffix}`;
    suffix += 1;
  }
}

function memberIsContentWriter(memberId: string) {
  const db = getDb();
  const row = db
    .prepare("SELECT is_content_writer FROM team_members WHERE id = ?")
    .get(memberId) as { is_content_writer: number } | undefined;
  return row?.is_content_writer === 1;
}

export function createMember(name: string, initials?: string) {
  const db = getDb();
  const memberId = randomUUID();
  const trimmedName = name.trim();
  const safeInitials = (initials?.trim() || deriveInitials(name)).slice(0, 2).toUpperCase();
  const username = generateUniqueUsername(trimmedName, undefined, db);
  db.prepare(
    `INSERT INTO team_members (
      id, name, initials, username, email, is_content_writer, is_operator_eligible,
      telegram_chat_id, telegram_user_id, telegram_username, telegram_connected_at
    ) VALUES (?, ?, ?, ?, '', 1, 1, '', '', '', '')`,
  ).run(memberId, trimmedName, safeInitials, username);

  return getMemberById(memberId) as TeamMember;
}

export function updateMember(
  memberId: string,
  updates: Partial<{
    name: string;
    initials: string;
    email: string;
    is_content_writer: number;
    is_operator_eligible: number;
  }>,
) {
  const db = getDb();
  const existing = getMemberById(memberId);

  if (!existing) {
    return null;
  }

  const nextName = updates.name?.trim() || existing.name;
  const nextInitials = (
    updates.initials?.trim() ||
    existing.initials ||
    deriveInitials(nextName)
  )
    .slice(0, 2)
    .toUpperCase();
  const nextUsername = generateUniqueUsername(nextName, memberId, db);

  db.prepare(
    `UPDATE team_members
     SET name = ?, initials = ?, username = ?, email = ?, is_content_writer = ?, is_operator_eligible = ?
     WHERE id = ?`,
  ).run(
    nextName,
    nextInitials,
    nextUsername,
    updates.email?.trim() ?? existing.email,
    updates.is_content_writer ?? existing.is_content_writer,
    updates.is_operator_eligible ?? existing.is_operator_eligible,
    memberId,
  );

  return getMemberById(memberId) as TeamMember;
}

export function createTelegramLinkToken(memberId: string, ttlMinutes = 15) {
  const db = getDb();
  const tokenRowId = randomUUID();
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

  db.prepare(
    `UPDATE telegram_link_tokens
     SET used_at = datetime('now')
     WHERE member_id = ?
       AND COALESCE(used_at, '') = ''`,
  ).run(memberId);

  db.prepare(
    `INSERT INTO telegram_link_tokens (id, member_id, token, expires_at, used_at)
     VALUES (?, ?, ?, ?, '')`,
  ).run(tokenRowId, memberId, token, expiresAt);

  return db
    .prepare(
      `SELECT id, member_id, token, expires_at, used_at, created_at
       FROM telegram_link_tokens
       WHERE id = ?`,
    )
    .get(tokenRowId) as TelegramLinkToken;
}

export function getTelegramLinkToken(token: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, member_id, token, expires_at, used_at, created_at
       FROM telegram_link_tokens
       WHERE token = ?`,
    )
    .get(token) as TelegramLinkToken | undefined;
}

export function markTelegramLinkTokenUsed(tokenId: string) {
  const db = getDb();
  db.prepare(
    `UPDATE telegram_link_tokens
     SET used_at = datetime('now')
     WHERE id = ?`,
  ).run(tokenId);
}

export function bindTelegramToMember(
  memberId: string,
  values: {
    chatId: string;
    userId: string;
    username?: string;
  },
) {
  const db = getDb();
  const transaction = db.transaction(() => {
    db.prepare(
      `UPDATE team_members
       SET telegram_chat_id = '', telegram_user_id = '', telegram_username = '', telegram_connected_at = ''
       WHERE telegram_chat_id = ? OR telegram_user_id = ?`,
    ).run(values.chatId, values.userId);

    db.prepare(
      `UPDATE team_members
       SET telegram_chat_id = ?, telegram_user_id = ?, telegram_username = ?, telegram_connected_at = datetime('now')
       WHERE id = ?`,
    ).run(values.chatId, values.userId, values.username ?? "", memberId);
  });

  transaction();
  return getMemberById(memberId) ?? null;
}

export function createMemberLoginCode(memberId: string, ttlMinutes = 10) {
  const db = getDb();
  const id = randomUUID();
  const code = String(Math.floor(1000 + Math.random() * 9000));
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

  db.prepare(
    `UPDATE member_login_codes
     SET used_at = datetime('now')
     WHERE member_id = ?
       AND COALESCE(used_at, '') = ''`,
  ).run(memberId);

  db.prepare(
    `INSERT INTO member_login_codes (id, member_id, code, expires_at, used_at)
     VALUES (?, ?, ?, ?, '')`,
  ).run(id, memberId, code, expiresAt);

  return db
    .prepare(
      `SELECT id, member_id, code, expires_at, used_at, created_at
       FROM member_login_codes
       WHERE id = ?`,
    )
    .get(id) as MemberLoginCode;
}

export function getMemberLoginCode(memberId: string, code: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, member_id, code, expires_at, used_at, created_at
       FROM member_login_codes
       WHERE member_id = ?
         AND code = ?
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .get(memberId, code) as MemberLoginCode | undefined;
}

export function markMemberLoginCodeUsed(codeId: string) {
  getDb()
    .prepare(
      `UPDATE member_login_codes
       SET used_at = datetime('now')
       WHERE id = ?`,
    )
    .run(codeId);
}

export function createAppSession({
  role,
  memberId,
  ttlDays = 14,
}: {
  role: AppSessionRole;
  memberId?: string;
  ttlDays?: number;
}) {
  const db = getDb();
  const id = randomUUID();
  const sessionToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    `INSERT INTO app_sessions (id, session_token, member_id, role, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(id, sessionToken, memberId ?? null, role, expiresAt);

  return db
    .prepare(
      `SELECT id, session_token, member_id, role, expires_at, created_at
       FROM app_sessions
       WHERE id = ?`,
    )
    .get(id) as AppSession;
}

export function deleteAppSession(sessionToken: string) {
  getDb().prepare("DELETE FROM app_sessions WHERE session_token = ?").run(sessionToken);
}

export function getAuthSessionByToken(sessionToken: string) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT s.id, s.session_token, s.member_id, s.role, s.expires_at, s.created_at,
              tm.id as tm_id, tm.name, tm.initials, tm.username, tm.email, tm.is_content_writer, tm.is_operator_eligible,
              tm.telegram_chat_id, tm.telegram_user_id, tm.telegram_username, tm.telegram_connected_at, tm.created_at as tm_created_at
       FROM app_sessions s
       LEFT JOIN team_members tm ON tm.id = s.member_id
       WHERE s.session_token = ?
       LIMIT 1`,
    )
    .get(sessionToken) as
    | {
        id: string;
        session_token: string;
        member_id: string;
        role: AppSessionRole;
        expires_at: string;
        created_at: string;
        tm_id: string | null;
        name: string | null;
        initials: string | null;
        username: string | null;
        email: string | null;
        is_content_writer: number | null;
        is_operator_eligible: number | null;
        telegram_chat_id: string | null;
        telegram_user_id: string | null;
        telegram_username: string | null;
        telegram_connected_at: string | null;
        tm_created_at: string | null;
      }
    | undefined;

  if (!row) {
    return null;
  }

  const expiresAt = new Date(row.expires_at);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
    deleteAppSession(sessionToken);
    return null;
  }

  const member =
    row.tm_id && row.role === "member"
      ? {
          id: row.tm_id,
          name: row.name ?? "",
          initials: row.initials ?? "",
          username: row.username ?? "",
          email: row.email ?? "",
          is_content_writer: row.is_content_writer ?? 0,
          is_operator_eligible: row.is_operator_eligible ?? 0,
          telegram_chat_id: row.telegram_chat_id ?? "",
          telegram_user_id: row.telegram_user_id ?? "",
          telegram_username: row.telegram_username ?? "",
          telegram_connected_at: row.telegram_connected_at ?? "",
          created_at: row.tm_created_at ?? "",
        }
      : null;

  return {
    role: row.role,
    member,
  } satisfies AuthSession;
}

export function logNotificationAttempt({
  memberId,
  channel,
  eventType,
  status,
  message,
  errorText,
}: {
  memberId: string;
  channel: string;
  eventType: string;
  status: string;
  message?: string;
  errorText?: string;
}) {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO notification_logs (
      id, member_id, channel, event_type, status, message, error_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, memberId, channel, eventType, status, message ?? "", errorText ?? "");

  return db
    .prepare(
      `SELECT id, member_id, channel, event_type, status, message, error_text, created_at
       FROM notification_logs
       WHERE id = ?`,
    )
    .get(id) as NotificationLog;
}

export function deleteMember(memberId: string) {
  const db = getDb();
  const transaction = db.transaction(() => {
    const contentIds = (
      db.prepare("SELECT id FROM contents WHERE member_id = ?").all(memberId) as Array<{
        id: string;
      }>
    ).map((row) => row.id);

    const deleteFeedback = db.prepare("DELETE FROM feedback WHERE content_id = ?");
    for (const contentId of contentIds) {
      deleteFeedback.run(contentId);
    }

    db.prepare("DELETE FROM contents WHERE member_id = ?").run(memberId);
    db.prepare("DELETE FROM weekly_operators WHERE member_id = ?").run(memberId);
    db.prepare("DELETE FROM browser_pins WHERE member_id = ?").run(memberId);
    db.prepare("DELETE FROM telegram_link_tokens WHERE member_id = ?").run(memberId);
    db.prepare("DELETE FROM member_login_codes WHERE member_id = ?").run(memberId);
    db.prepare("DELETE FROM app_sessions WHERE member_id = ?").run(memberId);
    db.prepare("DELETE FROM notification_logs WHERE member_id = ?").run(memberId);
    db.prepare("DELETE FROM team_members WHERE id = ?").run(memberId);
  });

  transaction();
}

export function upsertPendingSlot(memberId: string, weekKey: string) {
  if (!memberIsContentWriter(memberId)) {
    return null;
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM contents WHERE member_id = ? AND week_key = ? LIMIT 1")
    .get(memberId, weekKey) as { id: string } | undefined;

  if (existing) {
    return existing.id;
  }

  const contentId = randomUUID();
  db.prepare(
    `INSERT INTO contents (
      id, member_id, week_key, title, type, mediums, status, link_post, link_doc, link_file, publish_date, carried
    ) VALUES (?, ?, ?, '', '', '[]', 'pending_title', '', '', '', '', 0)`,
  ).run(contentId, memberId, weekKey);

  return contentId;
}

function getFeedbackMap(contentIds: string[]) {
  const db = getDb();
  if (contentIds.length === 0) {
    return new Map<string, FeedbackNote[]>();
  }

  const placeholders = contentIds.map(() => "?").join(", ");
  const rows = db
    .prepare(
      `SELECT id, content_id, reviewer_name, note, created_at
       FROM feedback
       WHERE content_id IN (${placeholders})
       ORDER BY created_at DESC`,
    )
    .all(...contentIds) as FeedbackNote[];

  const map = new Map<string, FeedbackNote[]>();
  for (const row of rows) {
    const list = map.get(row.content_id) ?? [];
    list.push(row);
    map.set(row.content_id, list);
  }

  return map;
}

function attachFeedback(rows: RawContentRow[]) {
  const feedbackMap = getFeedbackMap(rows.map((row) => row.id));
  return rows.map((row) => {
    const feedback = feedbackMap.get(row.id) ?? [];
    return {
      ...mapContentRow(row),
      feedback_count: feedback.length,
      feedback,
    };
  });
}

function latestCarriedContentByMember(weekKey: string, memberIds: string[]) {
  const db = getDb();
  if (memberIds.length === 0) {
    return [];
  }

  const placeholders = memberIds.map(() => "?").join(", ");
  const rows = db
    .prepare(
      `SELECT c.*,
          (SELECT COUNT(*) FROM feedback f WHERE f.content_id = c.id) as feedback_count
       FROM contents c
       WHERE c.member_id IN (${placeholders})
         AND c.week_key < ?
         AND c.status IN (${CARRIED_STATUSES.map(() => "?").join(", ")})
       ORDER BY c.week_key DESC, c.created_at DESC`,
    )
    .all(...memberIds, weekKey, ...CARRIED_STATUSES) as RawContentRow[];

  const seen = new Set<string>();
  const selected: RawContentRow[] = [];
  for (const row of rows) {
    if (seen.has(row.member_id)) {
      continue;
    }

    seen.add(row.member_id);
    selected.push({ ...row, carried: 1, carried_from_week_key: row.week_key });
  }

  return selected;
}

export function syncWeek(weekKey: string) {
  const db = getDb();
  const activeMembers = listContentWriters();
  const activeIds = new Set(activeMembers.map((member) => member.id));

  const transaction = db.transaction(() => {
    const carriedRowsForActive = latestCarriedContentByMember(
      weekKey,
      activeMembers.map((member) => member.id),
    );
    const carriedMemberIds = new Set(carriedRowsForActive.map((row) => row.member_id));

    const pendingRows = db
      .prepare(
        `SELECT id, member_id
         FROM contents
         WHERE week_key = ?
           AND status = 'pending_title'`,
      )
      .all(weekKey) as Array<{ id: string; member_id: string }>;

    for (const row of pendingRows) {
      if (!activeIds.has(row.member_id) || carriedMemberIds.has(row.member_id)) {
        db.prepare("DELETE FROM contents WHERE id = ?").run(row.id);
      }
    }

    const currentRows = db
      .prepare(
        `SELECT member_id
         FROM contents
         WHERE week_key = ?`,
      )
      .all(weekKey) as Array<{ member_id: string }>;

    const currentMemberIds = new Set(currentRows.map((row) => row.member_id));
    const missingMembers = activeMembers.filter((member) => !currentMemberIds.has(member.id));
    const carriedRows = latestCarriedContentByMember(
      weekKey,
      missingMembers.map((member) => member.id),
    );
    const missingCarriedMemberIds = new Set(carriedRows.map((row) => row.member_id));

    for (const member of missingMembers) {
      if (!missingCarriedMemberIds.has(member.id)) {
        upsertPendingSlot(member.id, weekKey);
      }
    }
  });

  transaction();
}

export function listContentsForWeek(weekKey: string) {
  syncWeek(weekKey);
  const db = getDb();
  const activeIds = listContentWriters().map((member) => member.id);

  if (activeIds.length === 0) {
    return [];
  }

  const placeholders = activeIds.map(() => "?").join(", ");
  const currentRows = db
    .prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM feedback f WHERE f.content_id = c.id) as feedback_count
       FROM contents c
       WHERE c.week_key = ?
         AND c.member_id IN (${placeholders})
       ORDER BY c.created_at ASC`,
    )
    .all(weekKey, ...activeIds) as RawContentRow[];

  const currentMemberIds = new Set(currentRows.map((row) => row.member_id));
  const membersWithoutCurrent = activeIds.filter((memberId) => !currentMemberIds.has(memberId));
  const carriedRows = latestCarriedContentByMember(weekKey, membersWithoutCurrent);

  return attachFeedback([...currentRows, ...carriedRows]);
}

export function listAllContents() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM feedback f WHERE f.content_id = c.id) as feedback_count
       FROM contents c
       ORDER BY COALESCE(NULLIF(c.publish_date, ''), c.week_key) DESC, c.created_at DESC`,
    )
    .all() as RawContentRow[];

  return attachFeedback(rows);
}

export function createContent({
  memberId,
  weekKey,
  title,
}: {
  memberId: string;
  weekKey: string;
  title?: string;
}) {
  const db = getDb();
  const cleanTitle = title?.trim() ?? "";
  const existingPending = db
    .prepare(
      "SELECT id FROM contents WHERE member_id = ? AND week_key = ? AND status = 'pending_title' LIMIT 1",
    )
    .get(memberId, weekKey) as { id: string } | undefined;

  if (existingPending) {
    db.prepare(
      `UPDATE contents
       SET title = ?, status = ?, updated_at = datetime('now')
       WHERE id = ?`,
    ).run(cleanTitle, cleanTitle ? "title_submitted" : "pending_title", existingPending.id);
    return getContentById(existingPending.id);
  }

  const contentId = randomUUID();
  db.prepare(
    `INSERT INTO contents (
      id, member_id, week_key, title, type, mediums, status, link_post, link_doc, link_file, publish_date, carried
    ) VALUES (?, ?, ?, ?, '', '[]', ?, '', '', '', '', 0)`,
  ).run(contentId, memberId, weekKey, cleanTitle, cleanTitle ? "title_submitted" : "pending_title");

  return getContentById(contentId);
}

export function getContentById(contentId: string) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM feedback f WHERE f.content_id = c.id) as feedback_count
       FROM contents c
       WHERE c.id = ?`,
    )
    .get(contentId) as RawContentRow | undefined;

  if (!row) {
    return null;
  }

  return attachFeedback([row])[0] ?? null;
}

export function updateContent(
  contentId: string,
  updates: Partial<{
    title: string;
    type: ContentTypeKey | "";
    mediums: string[];
    status: ContentStatus;
    link_post: string;
    link_doc: string;
    link_file: string;
    publish_date: string;
  }>,
) {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM contents WHERE id = ?")
    .get(contentId) as RawContentRow | undefined;

  if (!existing) {
    return null;
  }

  const next = {
    title: updates.title ?? existing.title,
    type: updates.type ?? existing.type,
    mediums: JSON.stringify(updates.mediums ?? parseMediums(existing.mediums)),
    status: updates.status ?? existing.status,
    link_post: updates.link_post ?? existing.link_post,
    link_doc: updates.link_doc ?? existing.link_doc,
    link_file: updates.link_file ?? existing.link_file,
    publish_date: updates.publish_date ?? existing.publish_date,
  };

  db.prepare(
    `UPDATE contents
     SET title = ?, type = ?, mediums = ?, status = ?, link_post = ?, link_doc = ?, link_file = ?, publish_date = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(
    next.title,
    next.type,
    next.mediums,
    next.status,
    next.link_post,
    next.link_doc,
    next.link_file,
    next.publish_date,
    contentId,
  );

  if (next.status === "published" && memberIsContentWriter(existing.member_id)) {
    upsertPendingSlot(existing.member_id, addWeeks(existing.week_key, 1));
  }

  return getContentById(contentId);
}

export function addFeedback({
  contentId,
  reviewerName,
  note,
}: {
  contentId: string;
  reviewerName: string;
  note: string;
}) {
  const db = getDb();
  const feedbackId = randomUUID();
  db.prepare(
    "INSERT INTO feedback (id, content_id, reviewer_name, note) VALUES (?, ?, ?, ?)",
  ).run(feedbackId, contentId, reviewerName.trim(), note.trim());

  return db
    .prepare(
      "SELECT id, content_id, reviewer_name, note, created_at FROM feedback WHERE id = ?",
    )
    .get(feedbackId) as FeedbackNote;
}

export function getOperator(weekKey: string) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT wo.week_key, wo.member_id,
              tm.id as tm_id, tm.name, tm.initials, tm.username, tm.email, tm.is_content_writer, tm.is_operator_eligible,
              tm.telegram_chat_id, tm.telegram_user_id, tm.telegram_username, tm.telegram_connected_at, tm.created_at
       FROM weekly_operators wo
       LEFT JOIN team_members tm ON tm.id = wo.member_id
       WHERE wo.week_key = ?`,
    )
    .get(weekKey) as
    | {
        week_key: string;
        member_id: string;
        tm_id: string | null;
        name: string | null;
        initials: string | null;
        username: string | null;
        email: string | null;
        is_content_writer: number | null;
        is_operator_eligible: number | null;
        telegram_chat_id: string | null;
        telegram_user_id: string | null;
        telegram_username: string | null;
        telegram_connected_at: string | null;
        created_at: string | null;
      }
    | undefined;

  if (!row) {
    return null;
  }

  return {
    week_key: row.week_key,
    member_id: row.member_id,
    member: row.tm_id
      ? {
          id: row.tm_id,
          name: row.name ?? "",
          initials: row.initials ?? "",
          username: row.username ?? "",
          email: row.email ?? "",
          is_content_writer: row.is_content_writer ?? 0,
          is_operator_eligible: row.is_operator_eligible ?? 0,
          telegram_chat_id: row.telegram_chat_id ?? "",
          telegram_user_id: row.telegram_user_id ?? "",
          telegram_username: row.telegram_username ?? "",
          telegram_connected_at: row.telegram_connected_at ?? "",
          created_at: row.created_at ?? "",
        }
      : null,
  };
}

export function setOperator(weekKey: string, memberId: string) {
  const db = getDb();
  db.prepare(
    `INSERT INTO weekly_operators (week_key, member_id)
     VALUES (?, ?)
     ON CONFLICT(week_key) DO UPDATE SET member_id = excluded.member_id`,
  ).run(weekKey, memberId);

  return getOperator(weekKey);
}

export function getMembersWithPendingTitles(weekKey: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT DISTINCT tm.id, tm.name, tm.initials, tm.email, tm.is_content_writer, tm.is_operator_eligible,
              tm.username,
              tm.telegram_chat_id, tm.telegram_user_id, tm.telegram_username, tm.telegram_connected_at, tm.created_at
       FROM contents c
       INNER JOIN team_members tm ON tm.id = c.member_id
       WHERE c.week_key = ?
         AND c.status = 'pending_title'
         AND tm.is_content_writer = 1`,
    )
    .all(weekKey) as TeamMember[];
}

export function getMembersWithContentDueToday(weekKey: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT c.*,
              (SELECT COUNT(*) FROM feedback f WHERE f.content_id = c.id) as feedback_count
       FROM contents c
       INNER JOIN team_members tm ON tm.id = c.member_id
       WHERE c.week_key = ?
         AND c.status IN ('title_submitted', 'writing', 'content_submitted', 'revision')
         AND tm.is_content_writer = 1
       ORDER BY c.created_at ASC`,
    )
    .all(weekKey) as RawContentRow[];
}

export function getCurrentOperatorPendingTitleCount(weekKey: string) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COUNT(*) as count
       FROM contents c
       INNER JOIN team_members tm ON tm.id = c.member_id
       WHERE c.week_key = ?
         AND c.status = 'pending_title'
         AND tm.is_content_writer = 1`,
    )
    .get(weekKey) as { count: number };

  return row.count;
}

export function resetAllData() {
  const db = getDb();
  db.exec(`
    DELETE FROM feedback;
    DELETE FROM contents;
    DELETE FROM weekly_operators;
    DELETE FROM browser_pins;
    DELETE FROM telegram_link_tokens;
    DELETE FROM member_login_codes;
    DELETE FROM app_sessions;
    DELETE FROM team_members;
  `);
}
