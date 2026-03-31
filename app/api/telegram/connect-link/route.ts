import { NextResponse } from "next/server";

import {
  handleRouteError,
  jsonError,
  logRouteHit,
  logRouteSuccess,
} from "../../../../lib/api";
import { createTelegramLinkToken, getMemberById } from "../../../../lib/db";
import { getBotUsername } from "../../../../lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  logRouteHit(request);
  try {
    const body = (await request.json()) as {
      member_id?: string;
    };

    if (!body.member_id) {
      return jsonError("member_id is required.", 400);
    }

    const member = getMemberById(body.member_id);
    if (!member) {
      return jsonError("Member not found.", 404);
    }

    const botUsername = getBotUsername();
    if (!botUsername) {
      return jsonError("TELEGRAM_BOT_USERNAME is not configured.", 500);
    }

    const tokenRow = createTelegramLinkToken(body.member_id, 15);
    const deepLink = `https://t.me/${botUsername}?start=${tokenRow.token}`;

    const response = NextResponse.json({
      deep_link: deepLink,
      expires_at: tokenRow.expires_at,
      member,
    });
    logRouteSuccess(request, 200);
    return response;
  } catch (error) {
    return handleRouteError(error, "Failed to generate Telegram connect link.", request);
  }
}
