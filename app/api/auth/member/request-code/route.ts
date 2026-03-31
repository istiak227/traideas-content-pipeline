import { NextResponse } from "next/server";

import {
  handleRouteError,
  jsonError,
  logRouteHit,
  logRouteSuccess,
} from "../../../../../lib/api";
import {
  createMemberLoginCode,
  createTelegramLinkToken,
  getMemberByUsername,
} from "../../../../../lib/db";
import { getBotUsername, sendTelegramMessage } from "../../../../../lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  logRouteHit(request);
  try {
    const body = (await request.json()) as { username?: string };

    if (!body.username?.trim()) {
      return jsonError("username is required.", 400);
    }

    const member = getMemberByUsername(body.username);
    if (!member) {
      return jsonError("Member not found.", 404);
    }

    if (!member.telegram_chat_id) {
      const botUsername = getBotUsername();
      if (!botUsername) {
        return jsonError("TELEGRAM_BOT_USERNAME is not configured.", 500);
      }

      const tokenRow = createTelegramLinkToken(member.id, 15);
      const response = NextResponse.json({
        step: "connect_telegram",
        deep_link: `https://t.me/${botUsername}?start=${tokenRow.token}`,
        expires_at: tokenRow.expires_at,
        member: {
          id: member.id,
          name: member.name,
          username: member.username,
        },
      });
      logRouteSuccess(request, 200);
      return response;
    }

    const loginCode = createMemberLoginCode(member.id, 10);
    await sendTelegramMessage(
      member.telegram_chat_id,
      `Your Traideas Content Pipeline login code is ${loginCode.code}. It expires in 10 minutes.`,
    );

    const response = NextResponse.json({
      step: "enter_code",
      expires_at: loginCode.expires_at,
      member: {
        id: member.id,
        name: member.name,
        username: member.username,
      },
    });
    logRouteSuccess(request, 200);
    return response;
  } catch (error) {
    return handleRouteError(error, "Failed to start member login.", request);
  }
}
