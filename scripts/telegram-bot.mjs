import path from "node:path";

import nextEnv from "@next/env";
import Database from "better-sqlite3";
import { Telegraf } from "telegraf";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

let db;

function getDb() {
  if (!db) {
    db = new Database(path.join(process.cwd(), "pipeline.db"));
    db.pragma("journal_mode = WAL");
  }

  return db;
}

function getTokenRow(token) {
  return getDb()
    .prepare(
      `SELECT id, member_id, token, expires_at, used_at
       FROM telegram_link_tokens
       WHERE token = ?`,
    )
    .get(token);
}

function markTokenUsed(tokenId) {
  getDb()
    .prepare(
      `UPDATE telegram_link_tokens
       SET used_at = datetime('now')
       WHERE id = ?`,
    )
    .run(tokenId);
}

function bindTelegramToMember(memberId, { chatId, userId, username }) {
  const database = getDb();
  const transaction = database.transaction(() => {
    database
      .prepare(
        `UPDATE team_members
         SET telegram_chat_id = '', telegram_user_id = '', telegram_username = '', telegram_connected_at = ''
         WHERE telegram_chat_id = ? OR telegram_user_id = ?`,
      )
      .run(chatId, userId);

    database
      .prepare(
        `UPDATE team_members
         SET telegram_chat_id = ?, telegram_user_id = ?, telegram_username = ?, telegram_connected_at = datetime('now')
         WHERE id = ?`,
      )
      .run(chatId, userId, username ?? "", memberId);
  });

  transaction();
}

function parseStartToken(text) {
  const parts = text.trim().split(/\s+/);
  if (parts[0] !== "/start") {
    return "";
  }
  return parts[1] ?? "";
}

function parseSqliteDate(dateText) {
  const value = String(dateText ?? "");

  if (!value) {
    return new Date(Number.NaN);
  }

  if (value.includes("T")) {
    return new Date(value);
  }

  return new Date(value.replace(" ", "T"));
}

async function handleTextMessage(bot, { text, chatId, userId, username }) {
  const trimmedText = String(text ?? "").trim();

  if (!chatId) {
    return;
  }

  if (trimmedText === "/help" || trimmedText === "/start") {
    await bot.telegram.sendMessage(
      chatId,
      "Traideas Content Pipeline bot helps connect your Telegram and send content reminders. Use the connect link from the app, then press Start here.",
    );
    return;
  }

  const token = parseStartToken(trimmedText);
  if (!token) {
    await bot.telegram.sendMessage(
      chatId,
      "Use the Telegram connect link from Traideas Content Pipeline, then press Start here.",
    );
    return;
  }

  const tokenRow = getTokenRow(token);
  if (!tokenRow) {
    await bot.telegram.sendMessage(chatId, "That Telegram connect token is invalid.");
    return;
  }

  if (tokenRow.used_at) {
    await bot.telegram.sendMessage(chatId, "That Telegram connect token was already used.");
    return;
  }

  const expiresAt = parseSqliteDate(tokenRow.expires_at);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
    await bot.telegram.sendMessage(chatId, "That Telegram connect token has expired.");
    return;
  }

  bindTelegramToMember(tokenRow.member_id, {
    chatId,
    userId,
    username,
  });
  markTokenUsed(tokenRow.id);
  await bot.telegram.sendMessage(
    chatId,
    "Your Telegram is now connected to Traideas Content Pipeline.",
  );
}

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
  const username = process.env.TELEGRAM_BOT_USERNAME ?? "";

  if (!token || !username) {
    console.error(
      "[telegram-bot] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_USERNAME in .env.local.",
    );
    process.exit(1);
  }

  getDb();

  const bot = new Telegraf(token);

  bot.start(async (ctx) => {
    await handleTextMessage(bot, {
      text: ctx.message?.text ?? "/start",
      chatId: String(ctx.chat.id),
      userId: String(ctx.from.id),
      username: ctx.from.username,
    });
  });

  bot.help(async (ctx) => {
    await ctx.reply(
      "Traideas Content Pipeline bot helps connect your Telegram and send content reminders. Use the connect link from the app, then press Start here.",
    );
  });

  bot.on("text", async (ctx) => {
    const text = ctx.message.text ?? "";
    if (text.startsWith("/start") || text === "/help") {
      return;
    }

    await ctx.reply(
      "Use the Telegram connect link from Traideas Content Pipeline, then press Start here.",
    );
  });

  bot.catch((error) => {
    console.error("[telegram-bot] Polling error", error);
  });

  await bot.telegram.deleteWebhook({ drop_pending_updates: false }).catch((error) => {
    console.warn("[telegram-bot] Failed to clear webhook before polling", error);
  });

  await bot.launch({
    dropPendingUpdates: false,
  });

  console.info("[telegram-bot] Long polling started.");

  process.once("SIGINT", () => {
    bot.stop("SIGINT");
    db?.close();
  });

  process.once("SIGTERM", () => {
    bot.stop("SIGTERM");
    db?.close();
  });
}

main().catch((error) => {
  console.error("[telegram-bot] Failed to start bot", error);
  process.exit(1);
});
