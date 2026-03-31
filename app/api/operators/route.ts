import { NextResponse } from "next/server";

import { getAuthSessionFromRequest } from "../../../lib/auth";
import {
  handleRouteError,
  jsonError,
  logRouteHit,
  logRouteSuccess,
} from "../../../lib/api";
import { getOperator, setOperator } from "../../../lib/db";
import { sendOperatorAssignedNotification } from "../../../lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  logRouteHit(request);
  try {
    if (!getAuthSessionFromRequest(request)) {
      return jsonError("Unauthorized.", 401);
    }

    const { searchParams } = new URL(request.url);
    const weekKey = searchParams.get("week_key");

    if (!weekKey) {
      return jsonError("week_key is required.", 400);
    }

    const response = NextResponse.json({ operator: getOperator(weekKey) });
    logRouteSuccess(request, 200);
    return response;
  } catch (error) {
    return handleRouteError(error, "Failed to load operator.", request);
  }
}

export async function POST(request: Request) {
  logRouteHit(request);
  try {
    if (!getAuthSessionFromRequest(request)) {
      return jsonError("Unauthorized.", 401);
    }

    const body = (await request.json()) as {
      week_key?: string;
      member_id?: string;
    };

    if (!body.week_key || !body.member_id) {
      return jsonError("week_key and member_id are required.", 400);
    }

    const operator = setOperator(body.week_key, body.member_id);
    await sendOperatorAssignedNotification(body.member_id);
    const response = NextResponse.json({
      operator,
    });
    logRouteSuccess(request, 200);
    return response;
  } catch (error) {
    return handleRouteError(error, "Failed to assign operator.", request);
  }
}
