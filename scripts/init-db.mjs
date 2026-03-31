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

function main() {
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  const dbAlreadyExists = fs.existsSync(dbPath);

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(schemaSql);
  ensureColumn(db, "team_members", "email", "TEXT DEFAULT ''");
  ensureColumn(db, "team_members", "is_content_writer", "INTEGER DEFAULT 1");
  ensureColumn(db, "team_members", "is_operator_eligible", "INTEGER DEFAULT 1");
  ensureColumn(db, "team_members", "telegram_chat_id", "TEXT DEFAULT ''");
  ensureColumn(db, "team_members", "telegram_user_id", "TEXT DEFAULT ''");
  ensureColumn(db, "team_members", "telegram_username", "TEXT DEFAULT ''");
  ensureColumn(db, "team_members", "telegram_connected_at", "TEXT DEFAULT ''");
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
