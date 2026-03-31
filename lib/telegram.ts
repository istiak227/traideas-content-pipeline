import { getCurrentWeekKey } from "./weeks";
import {
  getContentById,
  getCurrentOperatorPendingTitleCount,
  getTelegramLinkToken,
  getMemberById,
  getMembersWithContentDueToday,
  getMembersWithPendingTitles,
  getOperator,
  bindTelegramToMember,
  logNotificationAttempt,
  markTelegramLinkTokenUsed,
} from "./db";
import type { ContentItem } from "./types";

type TelegramEventType =
  | "title_pending_reminder"
  | "content_due_today"
  | "revision_requested"
  | "new_feedback"
  | "weekly_operator_assigned"
  | "operator_summary"
  | "telegram_test";

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN ?? "";
}

export function getBotUsername() {
  return process.env.TELEGRAM_BOT_USERNAME ?? "";
}

function getTelegramApiUrl(method: string) {
  return `https://api.telegram.org/bot${getBotToken()}/${method}`;
}

export async function sendTelegramMessage(chatId: string, text: string) {
  const token = getBotToken();

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is missing.");
  }

  const response = await fetch(getTelegramApiUrl("sendMessage"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; description?: string }
    | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.description || "Telegram API request failed.");
  }

  return payload;
}

function withContentTitle(base: string, contentTitle?: string) {
  const title = contentTitle?.trim();
  if (!title) {
    return base;
  }

  const withColon = base.replace(/\.$/, "");
  return `${withColon} for: ${title}.`;
}

function buildTelegramMessage(
  eventType: TelegramEventType,
  payload?: {
    reviewerName?: string;
    contentTitle?: string;
    pendingCount?: number;
  },
) {
  switch (eventType) {
    case "title_pending_reminder":
      return "Your title is still pending for this week.";
    case "content_due_today":
      return payload?.contentTitle
        ? `Your content is due today: ${payload.contentTitle}.`
        : "Your content is due today.";
    case "revision_requested":
      return withContentTitle("Revision requested. Check feedback.", payload?.contentTitle);
    case "new_feedback":
      return `New feedback added by ${payload?.reviewerName ?? "a reviewer"}.`;
    case "weekly_operator_assigned":
      return "You are operator this week.";
    case "operator_summary": {
      const count = payload?.pendingCount ?? 0;
      return `${count} team members still have pending titles.`;
    }
    case "telegram_test":
      return "Test message from Traideas Content Pipeline. Your Telegram connection is working.";
  }
}

export async function notifyMemberOnTelegram(
  memberId: string,
  eventType: TelegramEventType,
  payload?: {
    reviewerName?: string;
    contentTitle?: string;
    pendingCount?: number;
  },
) {
  const member = getMemberById(memberId);

  if (!member) {
    throw new Error("Member not found.");
  }

  const message = buildTelegramMessage(eventType, payload);

  if (!member.telegram_chat_id) {
    logNotificationAttempt({
      memberId,
      channel: "telegram",
      eventType,
      status: "failed",
      message,
      errorText: "Member not connected to Telegram.",
    });
    return { skipped: true, reason: "not_connected" as const };
  }

  try {
    await sendTelegramMessage(member.telegram_chat_id, message);
    logNotificationAttempt({
      memberId,
      channel: "telegram",
      eventType,
      status: "success",
      message,
    });
    return { skipped: false };
  } catch (error) {
    logNotificationAttempt({
      memberId,
      channel: "telegram",
      eventType,
      status: "failed",
      message,
      errorText: String(error),
    });
    return { skipped: false, error: String(error) };
  }
}

export async function sendTelegramTestMessage(memberId: string) {
  return notifyMemberOnTelegram(memberId, "telegram_test");
}

function parseStartToken(text: string) {
  const parts = text.trim().split(/\s+/);
  if (parts[0] !== "/start") {
    return "";
  }
  return parts[1] ?? "";
}

function parseTelegramDate(dateText: string) {
  if (!dateText) {
    return new Date(Number.NaN);
  }

  if (dateText.includes("T")) {
    return new Date(dateText);
  }

  return new Date(dateText.replace(" ", "T"));
}

export async function handleTelegramTextMessage({
  text,
  chatId,
  userId,
  username,
}: {
  text: string;
  chatId: string;
  userId: string;
  username?: string;
}) {
  const trimmedText = text.trim();

  if (!chatId) {
    return { ok: true as const, type: "ignored" as const };
  }

  if (trimmedText === "/help" || trimmedText === "/start") {
    await sendTelegramMessage(
      chatId,
      "Traideas Content Pipeline bot helps connect your Telegram and send content reminders. Use the connect link from the app, then press Start here.",
    );
    return { ok: true as const, type: "help" as const };
  }

  const token = parseStartToken(trimmedText);
  if (!token) {
    await sendTelegramMessage(
      chatId,
      "Use the Telegram connect link from Traideas Content Pipeline, then press Start here.",
    );
    return { ok: true as const, type: "missing_token" as const };
  }

  const tokenRow = getTelegramLinkToken(token);
  if (!tokenRow) {
    await sendTelegramMessage(chatId, "That Telegram connect token is invalid.");
    return { ok: true as const, type: "invalid_token" as const };
  }

  if (tokenRow.used_at) {
    await sendTelegramMessage(chatId, "That Telegram connect token was already used.");
    return { ok: true as const, type: "used_token" as const };
  }

  const expiresAt = parseTelegramDate(tokenRow.expires_at);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
    await sendTelegramMessage(chatId, "That Telegram connect token has expired.");
    return { ok: true as const, type: "expired_token" as const };
  }

  bindTelegramToMember(tokenRow.member_id, {
    chatId,
    userId,
    username,
  });
  markTelegramLinkTokenUsed(tokenRow.id);
  await sendTelegramMessage(
    chatId,
    "Your Telegram is now connected to Traideas Content Pipeline.",
  );

  return { ok: true as const, type: "connected" as const, memberId: tokenRow.member_id };
}

export async function sendFeedbackNotification(
  contentId: string,
  reviewerName: string,
) {
  const content = getContentById(contentId);
  if (!content) {
    return null;
  }

  return notifyMemberOnTelegram(content.member_id, "new_feedback", {
    reviewerName,
    contentTitle: content.title,
  });
}

export async function sendRevisionRequestedNotification(content: ContentItem) {
  return notifyMemberOnTelegram(content.member_id, "revision_requested", {
    contentTitle: content.title,
  });
}

export async function sendOperatorAssignedNotification(memberId: string) {
  return notifyMemberOnTelegram(memberId, "weekly_operator_assigned");
}

export async function runTelegramReminders(today = new Date()) {
  const weekKey = getCurrentWeekKey();
  const results: Array<{ eventType: string; memberId: string; result: unknown }> = [];

  for (const member of getMembersWithPendingTitles(weekKey)) {
    const result = await notifyMemberOnTelegram(member.id, "title_pending_reminder");
    results.push({ eventType: "title_pending_reminder", memberId: member.id, result });
  }

  const dayOfWeek = today.getDay();
  if (dayOfWeek === 4) {
    for (const content of getMembersWithContentDueToday(weekKey)) {
      const result = await notifyMemberOnTelegram(content.member_id, "content_due_today", {
        contentTitle: content.title,
      });
      results.push({ eventType: "content_due_today", memberId: content.member_id, result });
    }
  }

  const operator = getOperator(weekKey);
  const pendingCount = getCurrentOperatorPendingTitleCount(weekKey);
  if (operator?.member_id && pendingCount > 0) {
    const result = await notifyMemberOnTelegram(operator.member_id, "operator_summary", {
      pendingCount,
    });
    results.push({ eventType: "operator_summary", memberId: operator.member_id, result });
  }

  return results;
}
