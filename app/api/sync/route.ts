import { NextResponse } from "next/server";

import {
  handleRouteError,
  jsonError,
  logRouteHit,
  logRouteSuccess,
} from "../../../lib/api";
import { listContentsForWeek, syncWeek } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  logRouteHit(request);
  try {
    const body = (await request.json()) as {
      week_key?: string;
    };

    if (!body.week_key) {
      return jsonError("week_key is required.", 400);
    }

    syncWeek(body.week_key);

    const response = NextResponse.json({
      success: true,
      contents: listContentsForWeek(body.week_key),
    });
    logRouteSuccess(request, 200);
    return response;
  } catch (error) {
    return handleRouteError(error, "Failed to sync this week.", request);
  }
}
