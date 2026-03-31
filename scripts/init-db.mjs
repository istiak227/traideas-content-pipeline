import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

const root = process.cwd();
const dbPath = path.join(root, "pipeline.db");
const schemaPath = path.join(root, "db", "schema.sql");

function log(message) {
  console.log(`[init-db] ${message}`);
}

function ensureColumn(db, tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  if (!columns.some((column) => column.name === columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
    log(`Added column ${tableName}.${columnName}`);
  }
}

function normalizeUsername(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function buildUsernameBase(name) {
  return normalizeUsername(name) || "member";
}

function generateUniqueUsername(db, name, excludeMemberId) {
  const base = buildUsernameBase(name);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = db
      .prepare("SELECT id FROM team_members WHERE username = ?")
      .get(candidate);

    if (!existing || existing.id === excludeMemberId) {
      return candidate;
    }

    candidate = `${base}${suffix}`;
    suffix += 1;
  }
}

function main() {
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  const dbAlreadyExists = fs.existsSync(dbPath);

  const db = new Database(dbPath);
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
    .all();

  for (const member of membersWithoutUsername) {
    db.prepare("UPDATE team_members SET username = ? WHERE id = ?").run(
      generateUniqueUsername(db, member.name, member.id),
      member.id,
    );
  }

  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_username ON team_members(username)");
  db.close();

  log(
    dbAlreadyExists
      ? `Database ready at ${dbPath}`
      : `Database created at ${dbPath}`,
  );
}

try {
  main();
} catch (error) {
  console.error("[init-db] Failed to initialize database", error);
  process.exit(1);
}
