import Database from "better-sqlite3";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { addWeeks } from "./weeks";
import {
  CARRIED_STATUSES,
  type ContentItem,
  type ContentStatus,
  type ContentTypeKey,
  type FeedbackNote,
  type TeamMember,
} from "./types";

const schemaSql = `
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
  ensureColumn(db, "team_members", "is_content_writer", "INTEGER DEFAULT 1");
  ensureColumn(db, "team_members", "is_operator_eligible", "INTEGER DEFAULT 1");
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
      `SELECT id, name, initials, is_content_writer, is_operator_eligible, created_at
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
  const safeInitials = (initials?.trim() || deriveInitials(name)).slice(0, 2).toUpperCase();
  db.prepare(
    `INSERT INTO team_members (id, name, initials, is_content_writer, is_operator_eligible)
     VALUES (?, ?, ?, 1, 1)`,
  ).run(memberId, name.trim(), safeInitials);

  return db
    .prepare(
      `SELECT id, name, initials, is_content_writer, is_operator_eligible, created_at
       FROM team_members
       WHERE id = ?`,
    )
    .get(memberId) as TeamMember;
}

export function updateMember(
  memberId: string,
  updates: Partial<{
    name: string;
    initials: string;
    is_content_writer: number;
    is_operator_eligible: number;
  }>,
) {
  const db = getDb();
  const existing = db
    .prepare(
      `SELECT id, name, initials, is_content_writer, is_operator_eligible, created_at
       FROM team_members
       WHERE id = ?`,
    )
    .get(memberId) as TeamMember | undefined;

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

  db.prepare(
    `UPDATE team_members
     SET name = ?, initials = ?, is_content_writer = ?, is_operator_eligible = ?
     WHERE id = ?`,
  ).run(
    nextName,
    nextInitials,
    updates.is_content_writer ?? existing.is_content_writer,
    updates.is_operator_eligible ?? existing.is_operator_eligible,
    memberId,
  );

  return db
    .prepare(
      `SELECT id, name, initials, is_content_writer, is_operator_eligible, created_at
       FROM team_members
       WHERE id = ?`,
    )
    .get(memberId) as TeamMember;
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
    const pendingRows = db
      .prepare(
        `SELECT id, member_id
         FROM contents
         WHERE week_key = ?
           AND status = 'pending_title'`,
      )
      .all(weekKey) as Array<{ id: string; member_id: string }>;

    for (const row of pendingRows) {
      if (!activeIds.has(row.member_id)) {
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
    const carriedMemberIds = new Set(carriedRows.map((row) => row.member_id));

    for (const member of missingMembers) {
      if (!carriedMemberIds.has(member.id)) {
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

  if ((next.status === "scheduled" || next.status === "published") && memberIsContentWriter(existing.member_id)) {
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
              tm.id as tm_id, tm.name, tm.initials, tm.is_content_writer, tm.is_operator_eligible, tm.created_at
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
        is_content_writer: number | null;
        is_operator_eligible: number | null;
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
          is_content_writer: row.is_content_writer ?? 0,
          is_operator_eligible: row.is_operator_eligible ?? 0,
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

export function getPin(browserKey: string) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT bp.browser_key,
              tm.id, tm.name, tm.initials, tm.is_content_writer, tm.is_operator_eligible, tm.created_at
       FROM browser_pins bp
       LEFT JOIN team_members tm ON tm.id = bp.member_id
       WHERE bp.browser_key = ?`,
    )
    .get(browserKey) as
    | {
        browser_key: string;
        id: string | null;
        name: string | null;
        initials: string | null;
        is_content_writer: number | null;
        is_operator_eligible: number | null;
        created_at: string | null;
      }
    | undefined;

  if (!row || !row.id) {
    return null;
  }

  return {
    browser_key: row.browser_key,
    member: {
      id: row.id,
      name: row.name ?? "",
      initials: row.initials ?? "",
      is_content_writer: row.is_content_writer ?? 0,
      is_operator_eligible: row.is_operator_eligible ?? 0,
      created_at: row.created_at ?? "",
    },
  };
}

export function setPin(browserKey: string, memberId: string) {
  const db = getDb();
  db.prepare(
    `INSERT INTO browser_pins (browser_key, member_id)
     VALUES (?, ?)
     ON CONFLICT(browser_key) DO UPDATE SET member_id = excluded.member_id`,
  ).run(browserKey, memberId);

  return getPin(browserKey);
}

export function resetAllData() {
  const db = getDb();
  db.exec(`
    DELETE FROM feedback;
    DELETE FROM contents;
    DELETE FROM weekly_operators;
    DELETE FROM browser_pins;
    DELETE FROM team_members;
  `);
}
