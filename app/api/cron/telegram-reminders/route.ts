import { NextResponse } from "next/server";

import {
  handleRouteError,
  logRouteHit,
  logRouteSuccess,
} from "../../../../lib/api";
import { runTelegramReminders } from "../../../../lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  logRouteHit(request);
  try {
    const results = await runTelegramReminders();
    const response = NextResponse.json({ success: true, results });
    logRouteSuccess(request, 200);
    return response;
  } catch (error) {
    return handleRouteError(error, "Failed to run Telegram reminders.", request);
  }
}
