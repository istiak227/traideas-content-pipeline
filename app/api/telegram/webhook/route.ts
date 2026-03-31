import { NextResponse } from "next/server";

import {
  handleRouteError,
  logRouteHit,
  logRouteSuccess,
} from "../../../../lib/api";
import { handleTelegramTextMessage } from "../../../../lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  logRouteHit(request);
  try {
    const body = (await request.json()) as {
      message?: {
        text?: string;
        chat?: { id?: number | string };
        from?: { id?: number | string; username?: string };
      };
    };

    const text = body.message?.text?.trim() ?? "";
    const chatId = body.message?.chat?.id ? String(body.message.chat.id) : "";
    const userId = body.message?.from?.id ? String(body.message.from.id) : "";
    const username = body.message?.from?.username ?? "";

    if (!chatId) {
      const response = NextResponse.json({ ok: true });
      logRouteSuccess(request, 200);
      return response;
    }

    await handleTelegramTextMessage({
      text,
      chatId,
      userId,
      username,
    });

    const response = NextResponse.json({ ok: true });
    logRouteSuccess(request, 200);
    return response;
  } catch (error) {
    return handleRouteError(error, "Failed to process Telegram webhook.", request);
  }
}
