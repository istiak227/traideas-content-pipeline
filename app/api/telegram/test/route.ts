import { NextResponse } from "next/server";

import { getAuthSessionFromRequest } from "../../../../lib/auth";
import {
  handleRouteError,
  jsonError,
  logRouteHit,
  logRouteSuccess,
} from "../../../../lib/api";
import { getMemberById } from "../../../../lib/db";
import { sendTelegramTestMessage } from "../../../../lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  logRouteHit(request);
  try {
    const session = getAuthSessionFromRequest(request);
    if (!session || session.role !== "admin") {
      return jsonError("Admin access required.", 403);
    }

    const body = (await request.json()) as { member_id?: string };

    if (!body.member_id) {
      return jsonError("member_id is required.", 400);
    }

    const member = getMemberById(body.member_id);
    if (!member) {
      return jsonError("Member not found.", 404);
    }

    const result = await sendTelegramTestMessage(body.member_id);
    const response = NextResponse.json({ success: true, result });
    logRouteSuccess(request, 200);
    return response;
  } catch (error) {
    return handleRouteError(error, "Failed to send Telegram test message.", request);
  }
}
