import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { setSessionCookie } from "../../../../../lib/auth";
import {
  handleRouteError,
  jsonError,
  logRouteHit,
  logRouteSuccess,
} from "../../../../../lib/api";
import { createAppSession } from "../../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function POST(request: Request) {
  logRouteHit(request);
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const adminUsername = process.env.ADMIN_USERNAME ?? "";
    const adminPassword = process.env.ADMIN_PASSWORD ?? "";

    if (!adminUsername || !adminPassword) {
      return jsonError("Admin credentials are not configured.", 500);
    }

    if (!body.username || !body.password) {
      return jsonError("username and password are required.", 400);
    }

    if (!safeEqual(body.username, adminUsername) || !safeEqual(body.password, adminPassword)) {
      return jsonError("Invalid admin credentials.", 401);
    }

    const session = createAppSession({ role: "admin", ttlDays: 14 });
    const response = NextResponse.json({ success: true, role: "admin" });
    setSessionCookie(response, session.session_token, session.expires_at);
    logRouteSuccess(request, 200);
    return response;
  } catch (error) {
    return handleRouteError(error, "Failed to log in as admin.", request);
  }
}
